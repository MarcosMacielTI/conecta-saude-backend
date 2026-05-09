const express = require('express');
const jwt = require('jsonwebtoken');
const Connection = require('../models/Connection');
const Message = require('../models/Message');
const User = require('../models/User');
const Professional = require('../models/Professional');

const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access token required' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        req.user = decoded;
        next();
    } catch (err) {
        res.status(403).json({ error: 'Invalid token' });
    }
};

// POST /messages - Send a message
router.post('/messages', authenticateToken, async (req, res) => {
    const { content, connectionId } = req.body;
    const senderId = req.user.id;

    if (!content || !content.trim()) {
        return res.status(400).json({ error: 'Message content is required' });
    }

    try {
        const sender = await User.findById(senderId);
        if (!sender) return res.status(404).json({ error: 'Sender not found' });

        const connection = await Connection.findById(connectionId);
        if (!connection) return res.status(404).json({ error: 'Connection not found' });

        const isParticipant =
            (sender.role === 'patient' && connection.patientId.toString() === senderId) ||
            (sender.role === 'professional' && connection.professionalId.toString() === sender.professionalId?.toString());

        if (!isParticipant) return res.status(403).json({ error: 'Access denied' });

        const receiverId = sender.role === 'patient' ? connection.professionalId : connection.patientId;

        const message = new Message({
            connectionId: connection._id,
            senderId,
            receiverId,
            senderType: sender.role,
            content: content.trim(),
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
                timestamp: message.timestamp,
            },
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// GET /messages/:connectionId - Get messages for a connection
router.get('/messages/:connectionId', authenticateToken, async (req, res) => {
    const { connectionId } = req.params;
    const userId = req.user.id;

    try {
        const connection = await Connection.findById(connectionId);
        if (!connection) return res.status(404).json({ error: 'Connection not found' });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const isParticipant = (user.role === 'patient' && connection.patientId.toString() === userId) ||
            (user.role === 'professional' && connection.professionalId.toString() === user.professionalId?.toString());

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
router.get('/conversation', authenticateToken, async (req, res) => {
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
            const connections = await Connection.find({ professionalId: user.professionalId })
                .populate('patientId', 'name email cpf plan consultationsLeft');
            return res.json({ connections });
        }

        res.json({ connection: null });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;