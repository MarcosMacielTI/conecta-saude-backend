const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dns = require('dns');
const dotenv = require('dotenv');
const { Server } = require('socket.io');

dotenv.config();

const app = express();
app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Connect to MongoDB (use local or Atlas)
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/conecta_saude';

async function connectMongo(uri) {
    try {
        await mongoose.connect(uri);
        console.log(`MongoDB connected to ${uri}`);
    } catch (err) {
        if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED' || err.message.includes('querySrv')) {
            console.warn('MongoDB Atlas SRV lookup failed on default DNS resolver. Retrying with public DNS (8.8.8.8)...');
            const originalServers = dns.getServers();
            dns.setServers(['8.8.8.8']);
            try {
                await mongoose.connect(uri);
                console.log(`MongoDB connected to ${uri} using public DNS`);
                return;
            } catch (innerErr) {
                console.error('MongoDB connection failed with public DNS:', innerErr);
            } finally {
                dns.setServers(originalServers);
            }
        }
        console.error('MongoDB connection failed:', err);
    }
}

connectMongo(mongoUri);

const jwt = require('jsonwebtoken');
const Professional = require('./models/Professional');
const User = require('./models/User');
const Connection = require('./models/Connection');
const Message = require('./models/Message');

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/professionals', require('./routes/professionals'));
app.use('/api/users', require('./routes/users'));
app.use('/api/subscriptions', require('./routes/subscriptions'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api', require('./routes/messages'));
app.use('/api', require('./routes/connections'));
app.use('/api', require('./routes/availability'));

// Alias endpoints under /api for exact requested paths
app.get('/api/professional', async (req, res) => {
    try {
        const professional = await Professional.findOne().populate('clients', 'name email role cpf plan consultationsLeft');
        if (!professional) {
            return res.status(404).json({ error: 'No professional found' });
        }
        res.json(professional);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.get('/api/patients', async (req, res) => {
    try {
        const professional = await Professional.findOne();
        if (!professional) {
            return res.status(404).json({ error: 'No professional found' });
        }
        const patients = await User.find({ role: 'patient', professionalId: professional._id }).select('name email cpf plan consultationsLeft');
        res.json(patients);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Health check endpoint for Docker
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const io = new Server(server, {
    cors: {
        origin: true,
        methods: ['GET', 'POST'],
        credentials: true,
    },
});
const onlineUserSocketCount = new Map();
const userLastSeen = new Map();

const normalizeId = (id) => id?.toString?.();
const isUserOnline = (userId) => onlineUserSocketCount.has(normalizeId(userId));

const broadcastPresenceUpdate = (userId, online, lastSeen = null) => {
    io.emit('presenceUpdate', { userId, online, lastSeen });
};
io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
    if (!token) {
        return next(new Error('Authentication error: token required'));
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        socket.user = decoded;
        next();
    } catch (err) {
        console.error('Socket auth failed:', err.message);
        next(new Error('Authentication error'));
    }
});

io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);
    socket.join(`user:${socket.user.id}`);

    const userId = socket.user?.id?.toString();
    if (userId) {
        const currentCount = onlineUserSocketCount.get(userId) || 0;
        onlineUserSocketCount.set(userId, currentCount + 1);
        if (currentCount === 0) {
            broadcastPresenceUpdate(userId, true, null);
        }

        socket.emit('onlineUsers', Array.from(onlineUserSocketCount.keys()));
        const lastSeenPayload = {};
        for (const [id, lastSeen] of userLastSeen.entries()) {
            lastSeenPayload[id] = lastSeen;
        }
        socket.emit('lastSeenUsers', lastSeenPayload);
    }

    socket.on('joinChat', async (chatId) => {
        if (chatId) {
            socket.join(`chat:${chatId}`);
            console.log(`Socket ${socket.id} joined chat ${chatId}`);

            try {
                const pendingMessages = await Message.find({ connectionId: chatId, receiverId: socket.user.id, status: 'sent' });
                if (pendingMessages.length > 0) {
                    const messageIds = pendingMessages.map(msg => msg._id);
                    await Message.updateMany({ _id: { $in: messageIds } }, { status: 'delivered' });
                    pendingMessages.forEach((msg) => {
                        io.to(`user:${msg.senderId}`).emit('messageStatusUpdate', {
                            messageId: msg._id,
                            status: 'delivered',
                            connectionId: msg.connectionId,
                        });
                    });
                }
            } catch (err) {
                console.error('joinChat status update failed:', err.message);
            }
        }
    });

    socket.on('sendMessage', async (messageData, callback) => {
        try {
            const { chatId, text } = messageData || {};
            const senderId = socket.user?.id;
            console.log('📤 sendMessage received:', {
                chatId: chatId?.toString?.(),
                text: text?.substring?.(0, 50),
                senderId: senderId?.toString?.()
            });
            if (!chatId || !text || !senderId) {
                console.error('❌ Invalid message payload:', messageData);
                if (typeof callback === 'function') callback({ success: false, error: 'Invalid message payload' });
                return socket.emit('error', { error: 'Invalid message payload' });
            }

            const connection = await Connection.findById(chatId);
            if (!connection) {
                return socket.emit('error', { error: 'Connection not found' });
            }

            const sender = await User.findById(senderId);
            if (!sender) {
                return socket.emit('error', { error: 'Sender not found' });
            }

            let senderProfessionalId = sender.professionalId;
            if (sender.role === 'professional' && !senderProfessionalId) {
                const professional = await Professional.findOne({ email: sender.email });
                senderProfessionalId = professional?._id;
                if (senderProfessionalId) {
                    sender.professionalId = senderProfessionalId;
                    await sender.save();
                }
            }

            const isPatient = sender.role === 'patient' && connection.patientId.toString() === senderId;
            const isProfessional = sender.role === 'professional' && senderProfessionalId && connection.professionalId.toString() === senderProfessionalId.toString();
            if (!isPatient && !isProfessional) {
                return socket.emit('error', { error: 'Access denied' });
            }

            let receiverUser;
            if (isPatient) {
                receiverUser = await User.findOne({ role: 'professional', professionalId: connection.professionalId });
                if (!receiverUser) {
                    const professional = await Professional.findById(connection.professionalId);
                    if (professional?.email) {
                        receiverUser = await User.findOne({ role: 'professional', email: professional.email });
                    }
                }
            } else {
                receiverUser = await User.findById(connection.patientId);
            }

            console.log('Socket sendMessage:', {
                senderId,
                senderRole: sender.role,
                senderProfessionalId,
                connectionId: connection._id.toString(),
                connectionProfessionalId: connection.professionalId.toString(),
                receiverUserId: receiverUser?._id?.toString(),
                receiverUserRole: receiverUser?.role,
            });

            if (!receiverUser) {
                return socket.emit('error', { error: 'Receiver user not found' });
            }

            const message = new Message({
                connectionId: connection._id,
                senderId,
                receiverId: receiverUser._id,
                senderType: sender.role,
                content: text.trim(),
                status: 'sent',
            });
            await message.save();

            const receiverOnline = isUserOnline(receiverUser._id);
            let messageStatus = message.status;
            if (receiverOnline) {
                const updated = await Message.findByIdAndUpdate(
                    message._id,
                    { status: 'delivered' },
                    { new: true }
                );
                messageStatus = updated?.status || 'delivered';
                console.log(`Message ${message._id} marked as delivered for online user ${receiverUser._id}`);
            }

            const payload = {
                _id: message._id.toString(),
                connectionId: message.connectionId.toString(),
                senderId: message.senderId.toString(),
                senderName: sender.name,
                receiverId: message.receiverId.toString(),
                senderType: message.senderType,
                content: message.content,
                status: messageStatus,
                timestamp: message.timestamp,
            };

            console.log('📦 Payload being sent:', {
                _id: payload._id,
                senderId: payload.senderId,
                senderIdType: typeof payload.senderId,
                receiverId: payload.receiverId,
                connectionId: payload.connectionId,
                content: payload.content.substring(0, 50)
            });

            if (typeof callback === 'function') {
                callback({ success: true, message: payload });
            }

            const unreadCount = await Message.countDocuments({
                connectionId: chatId,
                receiverId: receiverUser._id,
                status: { $in: ['sent', 'delivered'] },
            });

            io.to(`user:${receiverUser._id}`).emit('conversationUpdate', {
                connectionId: chatId,
                lastMessage: payload.content,
                updatedAt: payload.timestamp,
                unreadCount,
            });

            if (receiverOnline) {
                io.to(`user:${senderId}`).emit('messageStatusUpdate', {
                    messageId: message._id,
                    status: 'delivered',
                    connectionId: message.connectionId,
                });
            }

            // Emit both to receiver's user channel and to the active chat room.
            io.to(`user:${receiverUser._id}`).emit('receiveMessage', payload);
            io.to(`chat:${chatId}`).emit('receiveMessage', payload);

            console.log(`Message ${message._id} emitted to:`, {
                toUserRoom: `user:${receiverUser._id}`,
                toChatRoom: `chat:${chatId}`,
                content: payload.content,
                status: payload.status
            });
        } catch (err) {
            console.error('Socket sendMessage error:', err.message);
            socket.emit('error', { error: 'Unable to send message' });
        }
    });

    socket.on('markAsRead', async (chatId) => {
        if (!chatId) return;

        try {
            const unreadMessages = await Message.find({
                connectionId: chatId,
                receiverId: socket.user.id,
                status: { $in: ['sent', 'delivered'] },
            });

            if (unreadMessages.length > 0) {
                const messageIds = unreadMessages.map(msg => msg._id);
                await Message.updateMany(
                    { _id: { $in: messageIds } },
                    { $set: { status: 'read' } }
                );

                console.log(`Marked ${messageIds.length} messages as read for conversation ${chatId}`);

                unreadMessages.forEach((msg) => {
                    io.to(`user:${msg.senderId}`).emit('messageStatusUpdate', {
                        messageId: msg._id,
                        status: 'read',
                        connectionId: msg.connectionId,
                    });
                });
            }
        } catch (err) {
            console.error('markAsRead failed:', err.message);
        }
    });

    socket.on('disconnect', (reason) => {
        console.log(`Socket disconnected: ${socket.id} (${reason})`);
        const userId = socket.user?.id?.toString();
        if (userId) {
            const currentCount = onlineUserSocketCount.get(userId) || 1;
            const nextCount = currentCount - 1;
            if (nextCount <= 0) {
                onlineUserSocketCount.delete(userId);
                const lastSeen = new Date().toISOString();
                userLastSeen.set(userId, lastSeen);
                broadcastPresenceUpdate(userId, false, lastSeen);
            } else {
                onlineUserSocketCount.set(userId, nextCount);
            }
        }
    });
});

server.on('error', err => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Stop the other process or set PORT to a different value.`);
    } else {
        console.error('Server error:', err);
    }
});