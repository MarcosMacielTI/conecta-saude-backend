const express = require('express');
const jwt = require('jsonwebtoken');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Professional = require('../models/Professional');
const { hasActivePlan } = require('../middlewares/authMiddleware');

const router = express.Router();

// Middleware to verify token
const verifyToken = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Access denied' });
    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).json({ error: 'Invalid token' });
    }
};

// Create appointment (with plan verification)
router.post('/', verifyToken, async (req, res) => {
    const { professionalId, date, startTime, endTime } = req.body;
    try {
        // Check if user has active plan
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (!hasActivePlan(user.plan)) {
            return res.status(403).json({
                error: 'Active plan required to schedule appointments. Please purchase a plan.',
                code: 'NO_PLAN'
            });
        }

        // Check if user has consultations left
        if (!user.consultationsLeft || user.consultationsLeft <= 0) {
            return res.status(400).json({
                error: 'No consultations left in your plan',
                consultationsLeft: user.consultationsLeft || 0
            });
        }

        // Check if professional exists
        const professional = await Professional.findById(professionalId);
        if (!professional) {
            return res.status(404).json({ error: 'Professional not found' });
        }

        // Generate unique video link using Jitsi
        const videoLink = `https://meet.jit.si/conecta-saude-${professionalId}-${user._id}-${Date.now()}`;

        const appointment = new Appointment({
            patientId: req.user.id,
            professionalId,
            date,
            startTime,
            endTime,
            videoLink,
        });

        await appointment.save();
        res.status(201).json(appointment);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Get appointments for user
router.get('/', verifyToken, async (req, res) => {
    try {
        let appointments;
        if (req.user.role === 'professional') {
            appointments = await Appointment.find({ professionalId: req.user.professionalId }).populate('patientId', 'name email');
        } else {
            appointments = await Appointment.find({ patientId: req.user.id }).populate('professionalId', 'name specialty');
        }
        res.json(appointments);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Update appointment status
router.put('/:id', verifyToken, async (req, res) => {
    const { status } = req.body;
    try {
        const appointment = await Appointment.findById(req.params.id);
        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        // Check permissions
        if (req.user.role === 'patient' && appointment.patientId.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }
        if (req.user.role === 'professional' && appointment.professionalId.toString() !== req.user.professionalId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        appointment.status = status;
        await appointment.save();

        // If status is 'finalizada', decrement consultationsLeft
        if (status === 'finalizada') {
            await User.findByIdAndUpdate(appointment.patientId, { $inc: { consultationsLeft: -1 } });
        }

        res.json(appointment);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;