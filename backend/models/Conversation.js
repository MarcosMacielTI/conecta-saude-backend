const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    professionalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Professional', required: true },
    createdAt: { type: Date, default: Date.now },
});

// Ensure only one conversation per patient-professional pair
conversationSchema.index({ patientId: 1, professionalId: 1 }, { unique: true });

module.exports = mongoose.model('Conversation', conversationSchema);