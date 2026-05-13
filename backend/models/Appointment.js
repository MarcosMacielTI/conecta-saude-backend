const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    professionalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Professional', required: true },
    date: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    status: {
        type: String,
        enum: ['agendada', 'em_andamento', 'finalizada', 'cancelada'],
        default: 'agendada',
    },
    videoLink: {
        type: String,
        required: false,
        description: 'Jitsi Meet link for video consultation'
    },
    notes: {
        type: String,
        required: false,
        description: 'Professional notes after appointment'
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Appointment', appointmentSchema);
