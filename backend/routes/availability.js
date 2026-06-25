const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Availability = require('../models/Availability');
const Professional = require('../models/Professional');
const User = require('../models/User');

// Middleware de autenticação
const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

// GET horários disponíveis de um profissional
router.get('/availability/:professionalId', async (req, res) => {
    try {
        const { professionalId } = req.params;

        let availability = await Availability.findOne({ professionalId });

        if (!availability) {
            // Se não existir, criar padrão
            availability = new Availability({
                professionalId,
                schedule: {
                    Monday: { active: true, startTime: '08:00', endTime: '17:00' },
                    Tuesday: { active: true, startTime: '08:00', endTime: '17:00' },
                    Wednesday: { active: true, startTime: '08:00', endTime: '17:00' },
                    Thursday: { active: true, startTime: '08:00', endTime: '17:00' },
                    Friday: { active: true, startTime: '08:00', endTime: '17:00' },
                    Saturday: { active: false, startTime: '09:00', endTime: '12:00' },
                    Sunday: { active: false, startTime: '00:00', endTime: '00:00' }
                }
            });
            await availability.save();
        }

        res.json(availability);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET meus horários (profissional autenticado)
router.get('/availability', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user || user.role !== 'professional') {
            return res.status(403).json({ error: 'Only professionals can access this' });
        }

        const professional = await Professional.findOne({ email: user.email });
        if (!professional) {
            return res.status(404).json({ error: 'Professional not found' });
        }

        let availability = await Availability.findOne({ professionalId: professional._id });

        if (!availability) {
            availability = new Availability({
                professionalId: professional._id
            });
            await availability.save();
        }

        res.json(availability);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT atualizar meus horários (profissional autenticado)
router.put('/availability', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user || user.role !== 'professional') {
            return res.status(403).json({ error: 'Only professionals can update availability' });
        }

        const professional = await Professional.findOne({ email: user.email });
        if (!professional) {
            return res.status(404).json({ error: 'Professional not found' });
        }

        const { schedule } = req.body;

        let availability = await Availability.findOne({ professionalId: professional._id });

        if (!availability) {
            availability = new Availability({
                professionalId: professional._id,
                schedule
            });
        } else {
            availability.schedule = schedule;
            availability.updatedAt = new Date();
        }

        await availability.save();
        res.json({ message: 'Availability updated successfully', availability });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
