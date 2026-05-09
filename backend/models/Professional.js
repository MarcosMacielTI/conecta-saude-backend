const mongoose = require('mongoose');

const professionalSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: false },
    specialty: { type: String, required: true },
    rating: { type: Number, default: 0 },
    price: { type: String, required: true }, // e.g., 'Plano Premium'
    image: { type: String },
    availability: { type: String, default: 'Hoje' },
    clients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    balance: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Professional', professionalSchema);