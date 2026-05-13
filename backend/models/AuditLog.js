const mongoose = require('mongoose');

/**
 * Audit Log Model
 * Tracks all sensitive data access and modifications
 * Required for LGPD/GDPR compliance
 */

const auditLogSchema = new mongoose.Schema({
  // Who accessed the data
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // What resource was accessed
  resourceType: {
    type: String,
    enum: ['user', 'professional', 'patient_data', 'payment', 'consultation', 'message'],
    required: true,
    index: true
  },

  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },

  // Action performed
  action: {
    type: String,
    enum: ['read', 'create', 'update', 'delete', 'export', 'download', 'share'],
    required: true
  },

  // Change details (for updates)
  changes: {
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed
  },

  // Sensitive fields accessed (without values)
  fieldsAccessed: [String],

  // IP address and user agent
  ipAddress: String,
  userAgent: String,

  // Reason for access
  reason: {
    type: String,
    enum: ['medical_consultation', 'payment_processing', 'support', 'compliance', 'system_maintenance', 'other'],
    default: 'other'
  },

  // Status
  status: {
    type: String,
    enum: ['success', 'failed', 'unauthorized'],
    default: 'success'
  },

  // Error message if failed
  errorMessage: String,

  // Data retained (days) - for data lifecycle management
  dataRetentionDays: {
    type: Number,
    default: 90
  },

  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
    // Auto-delete after 90 days (LGPD compliance)
    expires: 7776000 // 90 days in seconds
  }
});

// Index for compliance queries
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ resourceType: 1, action: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
