const express = require('express');
const jwt = require('jsonwebtoken');
const Subscription = require('../models/Subscription');
const Professional = require('../models/Professional');
const User = require('../models/User');
const Connection = require('../models/Connection');

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

// Subscribe
router.post('/', verifyToken, async (req, res) => {
    const { professionalId, plan, duration, price, paymentMethod } = req.body;
    try {
        const planValue = String(plan || '').trim().toLowerCase();
        const planLabels = {
            basico: 'Básico',
            básico: 'Básico',
            basic: 'Básico',
            intermediario: 'Intermediário',
            intermediário: 'Intermediário',
            intermediate: 'Intermediário',
            premium: 'Premium',
            prem: 'Premium',
        };
        const activePlan = planLabels[planValue] || plan;
        const consultations = planValue === 'basico' || planValue === 'básico' || planValue === 'basic' ? 1 : planValue === 'intermediario' || planValue === 'intermediário' || planValue === 'intermediate' ? 2 : 3;
        const validPaymentMethods = ['pix', 'credit_card', 'debit_card', 'boleto'];
        const selectedPaymentMethod = validPaymentMethods.includes(paymentMethod) ? paymentMethod : 'pix';

        const subscription = new Subscription({
            user: req.user.id,
            professional: professionalId,
            plan: activePlan,
            duration,
            price,
            paymentMethod: selectedPaymentMethod,
        });
        await subscription.save();

        // Update professional balance and connected clients
        await Professional.findByIdAndUpdate(professionalId, {
            $inc: { balance: price },
            $addToSet: { clients: req.user.id },
        });

        // Update user plan, consultations and linked professional
        await User.findByIdAndUpdate(req.user.id, {
            plan: activePlan,
            consultationsLeft: consultations,
            professionalId,
        });

        // Create connection record when patient signs up for a plan with a professional
        const existingConnection = await Connection.findOne({ patientId: req.user.id, professionalId });
        if (!existingConnection) {
            const connection = new Connection({ patientId: req.user.id, professionalId });
            await connection.save();
        }

        res.status(201).json(subscription);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Get subscriptions for user
router.get('/', verifyToken, async (req, res) => {
    try {
        const subscriptions = await Subscription.find({ user: req.user.id }).populate('professional');
        res.json(subscriptions);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;