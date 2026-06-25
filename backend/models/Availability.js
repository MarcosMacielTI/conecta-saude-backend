const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema({
    professionalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Professional',
        required: true,
        unique: true
    },
    schedule: {
        Monday: {
            active: { type: Boolean, default: true },
            startTime: { type: String, default: '08:00' },
            endTime: { type: String, default: '17:00' }
        },
        Tuesday: {
            active: { type: Boolean, default: true },
            startTime: { type: String, default: '08:00' },
            endTime: { type: String, default: '17:00' }
        },
        Wednesday: {
            active: { type: Boolean, default: true },
            startTime: { type: String, default: '08:00' },
            endTime: { type: String, default: '17:00' }
        },
        Thursday: {
            active: { type: Boolean, default: true },
            startTime: { type: String, default: '08:00' },
            endTime: { type: String, default: '17:00' }
        },
        Friday: {
            active: { type: Boolean, default: true },
            startTime: { type: String, default: '08:00' },
            endTime: { type: String, default: '17:00' }
        },
        Saturday: {
            active: { type: Boolean, default: false },
            startTime: { type: String, default: '09:00' },
            endTime: { type: String, default: '12:00' }
        },
        Sunday: {
            active: { type: Boolean, default: false },
            startTime: { type: String, default: '00:00' },
            endTime: { type: String, default: '00:00' }
        }
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Availability', availabilitySchema);
