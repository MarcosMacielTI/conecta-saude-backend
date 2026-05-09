const express = require('express');
const jwt = require('jsonwebtoken');
const Connection = require('../models/Connection');
const User = require('../models/User');
const Professional = require('../models/Professional');

const router = express.Router();

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

// POST /connect - connect a patient to a professional
router.post('/connect', authenticateToken, async (req, res) => {
    const { professionalId } = req.body;
    const patientId = req.user.id;

    if (!professionalId) return res.status(400).json({ error: 'professionalId is required' });

    try {
        const patient = await User.findById(patientId);
        if (!patient || patient.role !== 'patient') {
            return res.status(403).json({ error: 'Only patients can create a connection' });
        }

        const planValue = String(patient.plan || '').trim().toLowerCase();
        if (!patient.plan || planValue === 'sem plano' || planValue === 'semplano') {
            return res.status(403).json({ error: 'É necessário possuir um plano ativo para conectar com um profissional.' });
        }

        if (patient.professionalId) {
            return res.status(400).json({ error: 'Paciente já possui um profissional vinculado' });
        }

        const professional = await Professional.findById(professionalId);
        if (!professional) return res.status(404).json({ error: 'Professional not found' });

        const connection = new Connection({ patientId, professionalId });
        await connection.save();

        patient.professionalId = professionalId;
        await patient.save();

        await Professional.findByIdAndUpdate(professionalId, {
            $addToSet: { clients: patientId },
        });

        res.status(201).json(connection);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ error: 'Connection already exists' });
        }
        res.status(400).json({ error: err.message });
    }
});

// GET /professional/:id/patients - get patients connected to a professional
router.get('/professional/:id/patients', authenticateToken, async (req, res) => {
    try {
        const connections = await Connection.find({ professionalId: req.params.id }).populate('patientId', 'name email cpf plan consultationsLeft');
        const patients = connections.map((item) => item.patientId);
        res.json(patients);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// GET /patient/:id/professional - get professional for a patient
router.get('/patient/:id/professional', authenticateToken, async (req, res) => {
    try {
        const connection = await Connection.findOne({ patientId: req.params.id }).populate('professionalId', 'name email specialty price availability');
        if (!connection) return res.status(404).json({ error: 'Connection not found' });
        res.json(connection.professionalId);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// GET /patients/search?q= - search patients by name, email, cpf
router.get('/patients/search', authenticateToken, async (req, res) => {
    try {
        const { q = '', professionalId } = req.query;
        const regex = new RegExp(q, 'i');
        const filter = { role: 'patient' };
        if (q) {
            filter.$or = [
                { name: regex },
                { email: regex },
                { cpf: regex },
            ];
        }
        if (professionalId) {
            const connections = await Connection.find({ professionalId }).select('patientId');
            const patientIds = connections.map((item) => item.patientId);
            filter._id = { $in: patientIds };
        }
        const patients = await User.find(filter).select('name email cpf plan consultationsLeft');
        res.json(patients);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// GET /professionals/search?q= - search professionals by name or email
router.get('/professionals/search', authenticateToken, async (req, res) => {
    try {
        const { q = '' } = req.query;
        const regex = new RegExp(q, 'i');
        const filter = {};
        if (q) {
            filter.$or = [
                { name: regex },
                { email: regex },
            ];
        }
        const professionals = await Professional.find(filter).select('name email specialty price availability');
        res.json(professionals);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// GET /connections - get current user's connections
router.get('/connections', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (user.role === 'patient') {
            const connection = await Connection.findOne({ patientId: user._id }).populate('professionalId', 'name email specialty price availability');
            return res.json({ connections: connection ? [connection] : [] });
        }

        const connections = await Connection.find({ professionalId: user.professionalId }).populate('patientId', 'name email cpf plan consultationsLeft');
        res.json({ connections });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
