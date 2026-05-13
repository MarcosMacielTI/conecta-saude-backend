const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  professionalId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Professional', 
    required: true 
  },
  subscriptionId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Subscription', 
    required: true 
  },
  
  // Plan info
  planName: { 
    type: String, 
    enum: ['Básico', 'Intermediário', 'Premium'], 
    required: true 
  },
  planPrice: { 
    type: Number, 
    required: true 
  },
  planDuration: { 
    type: String, 
    default: 'mensal' // mensal, trimestral, anual
  },
  
  // Payment method
  paymentMethod: { 
    type: String, 
    enum: ['pix', 'credit_card', 'debit_card', 'boleto'], 
    default: 'pix' 
  },
  
  // Mercado Pago integration
  mercadoPagoId: { 
    type: String, 
    required: false // Returned from Mercado Pago API
  },
  mercadoPagoStatus: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'cancelled', 'refunded'], 
    default: 'pending' 
  },
  qrCodeData: { 
    type: String, 
    required: false // QR Code raw data for Pix
  },
  qrCodeUrl: { 
    type: String, 
    required: false // URL to display QR Code image
  },
  
  // Payment details
  transactionId: { 
    type: String, 
    required: false // Mercado Pago transaction ID
  },
  pixKey: { 
    type: String, 
    required: false // Pix key for display
  },
  
  // Timestamps
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  approvedAt: { 
    type: Date, 
    required: false 
  },
  expiresAt: { 
    type: Date, 
    required: false // For Pix QR code expiration
  },
  
  // Metadata
  ipAddress: { 
    type: String, 
    required: false 
  },
  userAgent: { 
    type: String, 
    required: false 
  },
  
  // Refund tracking
  refundedAt: { 
    type: Date, 
    required: false 
  },
  refundReason: { 
    type: String, 
    required: false 
  }
});

// Index for quick lookups
paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ mercadoPagoId: 1 });
paymentSchema.index({ mercadoPagoStatus: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
