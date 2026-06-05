const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

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
mongoose.connect(mongoUri)
    .then(() => console.log(`MongoDB connected to ${mongoUri}`))
    .catch(err => console.log(err));

const Professional = require('./models/Professional');
const User = require('./models/User');

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/professionals', require('./routes/professionals'));
app.use('/api/users', require('./routes/users'));
app.use('/api/subscriptions', require('./routes/subscriptions'));
app.use('/api/payments', require('./routes/payments'));
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));