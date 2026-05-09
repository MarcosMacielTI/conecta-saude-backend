const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: false },
    googleId: { type: String, required: false },
    cpf: { type: String, required: false, unique: true, sparse: true },
    role: { type: String, enum: ['patient', 'professional'], default: 'patient' },
    plan: { type: String, default: null },
    consultationsLeft: { type: Number, default: 0 },
    professionalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Professional', required: false },
    createdAt: { type: Date, default: Date.now },
});

// Pre-save middleware to ensure professionals never have a plan
// userSchema.pre('save', function(next) {
//     if (this.role === 'professional') {
//         this.plan = null;
//     }
//     next();
// });

module.exports = mongoose.model('User', userSchema);