const mongoose = require('mongoose');

/**
 * Repasse Model
 * Tracks all financial transfers to professionals
 * - 100% of payment value goes to professional
 * - No fees or interest deducted
 * - Automatic calculation based on approved payments
 */

const repasseSchema = new mongoose.Schema({
  // Reference to payment that triggered this repasse
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    required: true,
    unique: true
  },

  // Professional receiving the repasse
  professionalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Professional',
    required: true,
    index: true
  },

  // Patient/User making the payment
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Subscription plan info
  planName: {
    type: String,
    enum: ['Básico', 'Intermediário', 'Premium'],
    required: true
  },

  // Financial details
  grossAmount: {
    type: Number,
    required: true,
    description: 'Total amount received from patient'
  },

  // 100% of gross amount - NO FEES
  netAmount: {
    type: Number,
    required: true,
    description: '100% of gross amount (no deductions)'
  },

  // Tax info (for future compliance)
  taxAmount: {
    type: Number,
    default: 0,
    description: 'Future: tax withholding if applicable'
  },

  // Status tracking
  status: {
    type: String,
    enum: ['pending', 'approved', 'processing', 'transferred', 'failed'],
    default: 'pending',
    index: true
  },

  // When payment was confirmed
  approvedAt: {
    type: Date,
    required: false
  },

  // When repasse was processed
  processedAt: {
    type: Date,
    required: false
  },

  // When money was transferred to professional
  transferredAt: {
    type: Date,
    required: false
  },

  // Bank details for transfer
  bankInfo: {
    accountType: {
      type: String,
      enum: ['checking', 'savings', 'pix'],
      default: 'pix'
    },
    bankCode: String,
    accountNumber: String,
    accountDigit: String,
    holderName: String,
    pixKey: String, // Can be email, phone, CPF, CNPJ, or random key
  },

  // Audit trail
  notes: String,
  failureReason: String,

  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware to ensure netAmount = grossAmount (no fees)
repasseSchema.pre('save', function(next) {
  if (this.status === 'pending' || this.status === 'approved') {
    this.netAmount = this.grossAmount;
  }
  this.updatedAt = new Date();
  next();
});

// Index for efficient queries
repasseSchema.index({ professionalId: 1, createdAt: -1 });
repasseSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Repasse', repasseSchema);
