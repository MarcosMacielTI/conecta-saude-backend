const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    connectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Connection', required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    senderType: { type: String, enum: ['patient', 'professional'], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Message', messageSchema);