const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    createdAt: { type: Date, default: Date.now },
});

chatSchema.index({ participants: 1 }, { unique: true });

module.exports = mongoose.model('Chat', chatSchema);
