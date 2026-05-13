const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    professional: { type: mongoose.Schema.Types.ObjectId, ref: 'Professional', required: true },
    plan: { type: String, required: true },
    duration: { type: String, required: true }, // e.g., 'mensal'
    price: { type: Number, required: true },
    paymentMethod: {
        type: String,
        enum: ['pix', 'credit_card', 'debit_card', 'boleto'],
        default: 'pix',
    },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Subscription', subscriptionSchema);