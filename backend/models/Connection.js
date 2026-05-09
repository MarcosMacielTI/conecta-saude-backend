const mongoose = require('mongoose');

const connectionSchema = new mongoose.Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    professionalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Professional', required: true },
    createdAt: { type: Date, default: Date.now },
});

connectionSchema.index({ patientId: 1, professionalId: 1 }, { unique: true });

module.exports = mongoose.model('Connection', connectionSchema, 'connections');
