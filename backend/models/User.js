const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: false },
    googleId: { type: String, required: false },
    cpf: { type: String, required: false },
    role: { type: String, enum: ['patient', 'professional'], default: 'patient' },
    plan: { type: String, default: 'sem plano' }, // default: 'sem plano'; patients only
    consultationsLeft: { type: Number, default: 0 },
    professionalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Professional', required: false },
    image: { type: String, required: false },
    profilePhoto: {
        url: { type: String, required: false },
        publicId: { type: String, required: false },
        updatedAt: { type: Date, required: false },
    },
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