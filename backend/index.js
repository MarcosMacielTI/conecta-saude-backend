const express = require('express');
global.crypto = require('crypto');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const helmet = require('helmet');

dotenv.config();

const app = express();
app.set('trust proxy', 1);

const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Security Middleware
const {
    apiLimiter,
    authLimiter,
    captureRequestInfo,
    checkSuspiciousActivity,
    validateSensitiveData,
    sanitizeInput,
    enforceHTTPS
} = require('./middlewares/securityMiddleware');

// Apply Helmet for security headers
app.use(helmet());

// Apply security middleware
if (process.env.NODE_ENV === 'production') {
    app.use(enforceHTTPS);
}

app.use(captureRequestInfo);
app.use(sanitizeInput);

app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
}));
app.use(express.json({ limit: '10mb' })); // Prevent large payloads

// Rate limiting
app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);

// Connect to MongoDB (use local or Atlas)
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/conecta_saude';
console.log('🔗 Connecting to MongoDB:', mongoUri.split('@')[1] || mongoUri);

mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
})
    .then(() => console.log('✅ MongoDB connected successfully'))
    .catch(err => {
        console.error('❌ MongoDB connection error:', err.message);
        process.exit(1);
    });

const Professional = require('./models/Professional');
const User = require('./models/User');
const Payment = require('./models/Payment');
const Repasse = require('./models/Repasse');
const AuditLog = require('./models/AuditLog');

// Health check endpoint (for Railway)
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        uptime: process.uptime()
    });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/professionals', require('./routes/professionals'));
app.use('/api/users', require('./routes/users'));
app.use('/api/subscriptions', require('./routes/subscriptions'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/repassess', require('./routes/repassess'));
app.use('/api/audit', require('./routes/audit'));
app.use('/api', require('./routes/connections'));
app.use('/api', require('./routes/messages'));

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

// Rota principal
app.get('/', (req, res) => {
    res.send('🚀 API Conecta Saúde online!');
});


// Socket.IO for real-time chat with plan verification
const jwt = require('jsonwebtoken');

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Authenticate user via token
    const token = socket.handshake.auth?.token;
    let userId = null;
    let userRole = null;

    if (token) {
        try {
            const verified = jwt.verify(token, process.env.JWT_SECRET || 'secret');
            userId = verified.id;
        } catch (err) {
            console.error('Socket auth error:', err.message);
        }
    }

    // Join a chat room (for patient-professional communication)
    socket.on('joinChat', async (chatId) => {
        if (!userId) {
            socket.emit('error', { message: 'Authentication required' });
            return;
        }

        try {
            const user = await User.findById(userId);
            if (!user) {
                socket.emit('error', { message: 'User not found' });
                return;
            }

            userRole = user.role;

            // Check if patient has active plan (but professionals can always chat)
            if (user.role === 'patient' && !user.plan) {
                socket.emit('error', {
                    message: 'Active plan required to chat. Please purchase a plan.',
                    code: 'NO_PLAN'
                });
                return;
            }

            socket.join(chatId);
            socket.userData = { userId, userRole, userName: user.name };

            console.log(`User ${user.name} (${userId}) joined chat ${chatId}`);

            // Notify others
            io.to(chatId).emit('userJoined', {
                userId,
                userName: user.name,
                userRole,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error joining chat:', error);
            socket.emit('error', { message: 'Error joining chat' });
        }
    });

    // Handle sending message
    socket.on('sendMessage', async (data) => {
        if (!userId || !socket.userData) {
            socket.emit('error', { message: 'Not authenticated or not in chat' });
            return;
        }

        const { chatId, text } = data;

        if (!text || text.trim().length === 0) {
            socket.emit('error', { message: 'Message cannot be empty' });
            return;
        }

        try {
            const user = await User.findById(userId);

            // Verify patient still has active plan
            if (user.role === 'patient' && !user.plan) {
                socket.emit('error', {
                    message: 'Your plan has expired. Please renew to continue chatting.',
                    code: 'PLAN_EXPIRED'
                });
                return;
            }

            const Message = require('./models/Message');
            const message = new Message({
                connectionId: chatId,
                senderId: userId,
                senderType: user.role,
                content: text.trim(),
            });
            await message.save();

            // Emit to chat room
            io.to(chatId).emit('receiveMessage', {
                _id: message._id,
                senderId: userId,
                senderType: user.role,
                senderName: user.name,
                content: text.trim(),
                timestamp: message.timestamp,
            });
        } catch (error) {
            console.error('Error saving message:', error);
            socket.emit('error', { message: 'Error sending message' });
        }
    });

    // Handle typing indicator
    socket.on('typing', (data) => {
        const { chatId } = data;
        socket.broadcast.to(chatId).emit('userTyping', {
            userId,
            userName: socket.userData?.userName,
            isTyping: true
        });
    });

    // Handle stop typing
    socket.on('stopTyping', (data) => {
        const { chatId } = data;
        socket.broadcast.to(chatId).emit('userTyping', {
            userId,
            userName: socket.userData?.userName,
            isTyping: false
        });
    });

    // Leave chat room
    socket.on('leaveChat', (chatId) => {
        socket.leave(chatId);
        if (socket.userData) {
            io.to(chatId).emit('userLeft', {
                userId,
                userName: socket.userData.userName,
                timestamp: new Date().toISOString()
            });
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 5000;

// Graceful error handling
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Check SMTP configuration and warn if missing
const smtpConfigured = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;
if (!smtpConfigured) {
    console.warn('⚠️ SMTP não configurado: configure SMTP_HOST, SMTP_USER e SMTP_PASS para envio de emails de redefinição de senha.');
} else {
    console.log('✉️ SMTP configurado (HOST:', process.env.SMTP_HOST, ')');
}

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('⚠️ SIGTERM received, shutting down gracefully...');
    server.close(() => {
        console.log('✅ Server closed');
        mongoose.connection.close(false, () => {
            console.log('✅ MongoDB connection closed');
            process.exit(0);
        });
    });
});