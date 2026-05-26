const mongoose = require('mongoose');
const EncryptionService = require('../services/encryptionService');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: false },
    googleId: { type: String, required: false },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },

    // CPF - ENCRYPTED
    cpf: {
        type: String,
        required: false,
        sparse: true,
        set: function (value) {
            if (!value) return value;
            // Store encrypted CPF
            const encryption = new EncryptionService();
            return encryption.encrypt(value);
        }
    },
    cpfHash: {
        type: String,
        required: false,
        unique: true,
        sparse: true
    },

    role: { type: String, enum: ['patient', 'professional'], default: 'patient' },
    plan: { type: String, default: null },
    consultationsLeft: { type: Number, default: 0 },
    professionalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Professional', required: false },

    // Security fields
    lastLogin: { type: Date },
    loginAttempts: { type: Number, default: 0 },
    isBlocked: { type: Boolean, default: false },
    blockedUntil: { type: Date },

    // Privacy settings (LGPD)
    dataConsent: {
        type: Boolean,
        default: false,
        description: 'User consented to data processing'
    },
    consentDate: { type: Date },

    // Data deletion request
    deletionRequested: { type: Boolean, default: false },
    deletionRequestedAt: { type: Date },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Index for user role lookups
userSchema.index({ role: 1 });

// Pre-save middleware for security
userSchema.pre('save', async function () {
    // Encrypt CPF if provided
    if (this.isModified('cpf') && this.cpf) {
        try {
            const encryption = new EncryptionService();
            // Store hash for lookups (without ability to decrypt)
            this.cpfHash = encryption.hash(this.cpf.replace(/\D/g, ''));
        } catch (error) {
            console.error('Error hashing CPF:', error);
        }
    }

    // Ensure professionals never have a plan
    if (this.role === 'professional') {
        this.plan = null;
    }

    this.updatedAt = new Date();
});

// Virtual to decrypt CPF (only accessible in code, not serialized)
userSchema.virtual('decryptedCpf').get(function () {
    if (!this.cpf) return null;
    try {
        const encryption = new EncryptionService();
        return encryption.decrypt(this.cpf);
    } catch (error) {
        console.error('Error decrypting CPF:', error);
        return null;
    }
});

// Override toJSON to exclude sensitive fields
userSchema.methods.toJSON = function () {
    const obj = this.toObject();

    // Remove encrypted CPF and password from serialization
    delete obj.cpf;
    delete obj.cpfHash;
    delete obj.password;
    delete obj.resetPasswordToken;
    delete obj.resetPasswordExpires;
    delete obj.loginAttempts;
    delete obj.isBlocked;

    return obj;
};

module.exports = mongoose.model('User', userSchema);