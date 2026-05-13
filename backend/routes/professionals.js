const express = require('express');
const Professional = require('../models/Professional');
const User = require('../models/User');

const router = express.Router();

// Get all professionals
router.get('/', async (req, res) => {
    try {
        console.log('🔍 [Professionals] GET / - Fetching all professionals');
        const professionals = await Professional.find().populate('clients', 'name email role cpf plan consultationsLeft');
        console.log(`✅ [Professionals] Found ${professionals?.length || 0} professionals`);

        if (!professionals || professionals.length === 0) {
            console.warn('⚠️ [Professionals] No professionals found');
            return res.status(404).json({ error: 'No professional found' });
        }

        res.json(professionals);
    } catch (err) {
        console.error('❌ [Professionals] Error:', err.message);
        res.status(400).json({ error: err.message });
    }
});

// Get the professional for patients
router.get('/professional', async (req, res) => {
    try {
        console.log('🔍 [Professionals] GET /professional - Fetching first professional');
        const professional = await Professional.findOne().populate('clients', 'name email role cpf plan consultationsLeft');
        console.log('✅ [Professionals] Got professional:', professional?.name);
        if (!professional) {
            console.warn('⚠️ [Professionals] No professional found in GET /professional');
            return res.status(404).json({ error: 'No professional found' });
        }
        res.json(professional);
    } catch (err) {
        console.error('❌ [Professionals] Error in GET /professional:', err.message);
        res.status(400).json({ error: err.message });
    }
});

// Get all patients for the professional
router.get('/patients', async (req, res) => {
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

// Get professional by id
router.get('/:id', async (req, res) => {
    try {
        const professional = await Professional.findById(req.params.id).populate('clients', 'name email role cpf plan consultationsLeft');
        res.json(professional);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Get patients of a professional by id
router.get('/:id/patients', async (req, res) => {
    try {
        const professional = await Professional.findById(req.params.id).populate('clients', 'name email role cpf plan consultationsLeft');

        if (!professional) {
            return res.status(404).json({ error: 'Professional not found' });
        }

        res.json(professional.clients);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;