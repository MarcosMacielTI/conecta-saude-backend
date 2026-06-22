const express = require('express');
const Connection = require('../models/Connection');
const Message = require('../models/Message');
const User = require('../models/User');
const Professional = require('../models/Professional');
const { verifyToken, hasActivePlan } = require('../middlewares/authMiddleware');

const router = express.Router();

// POST /messages - Send a message (with plan verification for patients)
router.post('/messages', verifyToken, async (req, res) => {
    const { content, connectionId } = req.body;
    const senderId = req.user.id;

    if (!content || !content.trim()) {
        return res.status(400).json({ error: 'Message content is required' });
    }

    try {
        const sender = await User.findById(senderId);
        if (!sender) return res.status(404).json({ error: 'Sender not found' });

        // Check if patient has active plan
        if (sender.role === 'patient' && !hasActivePlan(sender.plan)) {
            return res.status(403).json({
                error: 'Active plan required to send messages. Please purchase a plan.',
                code: 'NO_PLAN'
            });
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

        const connection = await Connection.findById(connectionId);
        if (!connection) return res.status(404).json({ error: 'Connection not found' });

        const isParticipant =
            (sender.role === 'patient' && connection.patientId.toString() === senderId) ||
            (sender.role === 'professional' && senderProfessionalId && connection.professionalId.toString() === senderProfessionalId.toString());

        if (!isParticipant) return res.status(403).json({ error: 'Access denied' });

        const receiverId = sender.role === 'patient' ? connection.professionalId : connection.patientId;

        const message = new Message({
            connectionId: connection._id,
            senderId,
            receiverId,
            senderType: sender.role,
            content: content.trim(),
            status: 'sent',
        });

        await message.save();

        res.status(201).json({
            message: {
                _id: message._id,
                connectionId: message.connectionId,
                senderId: message.senderId,
                receiverId: message.receiverId,
                senderType: message.senderType,
                content: message.content,
                status: message.status,
                timestamp: message.timestamp,
            },
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// GET /messages/:connectionId - Get messages for a connection
router.get('/messages/:connectionId', verifyToken, async (req, res) => {
    const { connectionId } = req.params;
    const userId = req.user.id;

    try {
        const connection = await Connection.findById(connectionId);
        if (!connection) return res.status(404).json({ error: 'Connection not found' });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        let userProfessionalId = user.professionalId;
        if (user.role === 'professional' && !userProfessionalId) {
            const professional = await Professional.findOne({ email: user.email });
            userProfessionalId = professional?._id;
            if (userProfessionalId) {
                user.professionalId = userProfessionalId;
                await user.save();
            }
        }

        const isParticipant = (user.role === 'patient' && connection.patientId.toString() === userId) ||
            (user.role === 'professional' && userProfessionalId && connection.professionalId.toString() === userProfessionalId.toString());

        if (!isParticipant) return res.status(403).json({ error: 'Access denied' });

        const messages = await Message.find({ connectionId })
            .sort({ timestamp: 1 })
            .populate('senderId', 'name email role');

        res.json(messages);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// GET /conversation - Get current connection for logged-in user
router.get('/conversation', verifyToken, async (req, res) => {
    const userId = req.user.id;

    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (user.role === 'patient') {
            const connection = await Connection.findOne({ patientId: userId })
                .populate('professionalId', 'name email specialty price availability');
            return res.json({ connection });
        }

        if (user.role === 'professional') {
            let userProfessionalId = user.professionalId;
            if (!userProfessionalId) {
                const professional = await Professional.findOne({ email: user.email });
                userProfessionalId = professional?._id;
                if (userProfessionalId) {
                    user.professionalId = userProfessionalId;
                    await user.save();
                }
            }

            const connections = await Connection.find({ professionalId: userProfessionalId })
                .populate('patientId', 'name email cpf plan consultationsLeft');
            return res.json({ connections });
        }

        res.json({ connection: null });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// GET /conversations - Get conversations list for logged-in user
router.get('/conversations', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const buildConversation = async (connection) => {
            const lastMessage = await Message.findOne({ connectionId: connection._id }).sort({ timestamp: -1 });
            const unreadCount = await Message.countDocuments({
                connectionId: connection._id,
                receiverId: user._id,
                status: { $in: ['sent', 'delivered'] },
            });
            return {
                _id: connection._id,
                connectionId: connection._id,
                updatedAt: lastMessage?.timestamp || connection.createdAt,
                lastMessage: lastMessage ? lastMessage.content : null,
                unreadCount,
                professionalId: connection.professionalId,
                patientId: connection.patientId,
            };
        };

        if (user.role === 'patient') {
            const connection = await Connection.findOne({ patientId: user._id }).populate('professionalId', 'name email specialty price availability');
            if (!connection) return res.json({ conversations: [] });
            const professionalUser = await User.findOne({ professionalId: connection.professionalId._id }).select('_id');
            const conversation = await buildConversation(connection);
            if (professionalUser) {
                conversation.professionalUserId = professionalUser._id;
            }
            return res.json({ conversations: [conversation] });
        }

        let userProfessionalId = user.professionalId;
        if (user.role === 'professional' && !userProfessionalId) {
            const professional = await Professional.findOne({ email: user.email });
            userProfessionalId = professional?._id;
            if (userProfessionalId) {
                user.professionalId = userProfessionalId;
                await user.save();
            }
        }

        if (!userProfessionalId) {
            return res.status(404).json({ error: 'Professional account not linked to professional data' });
        }

        const connections = await Connection.find({ professionalId: userProfessionalId }).populate('patientId', 'name email cpf plan consultationsLeft');
        const conversations = await Promise.all(connections.map(buildConversation));
        res.json({ conversations });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;