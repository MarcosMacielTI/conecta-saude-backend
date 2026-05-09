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

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/conecta_saude';
mongoose.connect(mongoUri)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log('MongoDB error:', err));

const User = require('./models/User');

app.post('/test', async (req, res) => {
  try {
    console.log('Request body:', req.body);
    const user = new User(req.body);
    await user.save();
    res.json({ success: true, user });
  } catch (err) {
    console.error('Error:', err);
    res.status(400).json({ error: err.message });
  }
});

app.listen(3001, () => console.log('Test server on 3001'));