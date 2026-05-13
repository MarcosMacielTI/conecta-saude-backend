const AuditLog = require('../models/AuditLog');

/**
 * Audit Service
 * Logs all sensitive data access for LGPD/GDPR compliance
 */

class AuditService {
  /**
   * Log data access
   */
  static async logAccess(userId, resourceType, resourceId, action, options = {}) {
    try {
      const {
        fieldsAccessed = [],
        reason = 'other',
        ipAddress = null,
        userAgent = null,
        changes = null
      } = options;

      const log = new AuditLog({
        userId,
        resourceType,
        resourceId,
        action,
        fieldsAccessed,
        reason,
        ipAddress,
        userAgent,
        changes,
        status: 'success'
      });

      await log.save();
      console.log(`[AUDIT] User ${userId} performed ${action} on ${resourceType}:${resourceId}`);
    } catch (error) {
      console.error('Error logging audit trail:', error);
    }
  }

  /**
   * Log failed access
   */
  static async logFailedAccess(userId, resourceType, resourceId, action, errorMessage, options = {}) {
    try {
      const {
        reason = 'other',
        ipAddress = null,
        userAgent = null
      } = options;

      const log = new AuditLog({
        userId,
        resourceType,
        resourceId,
        action,
        status: 'failed',
        errorMessage,
        reason,
        ipAddress,
        userAgent
      });

      await log.save();
      console.log(`[AUDIT] Failed access - User ${userId} attempted ${action} on ${resourceType}:${resourceId}`);
    } catch (error) {
      console.error('Error logging failed access:', error);
    }
  }

  /**
   * Log unauthorized access attempt
   */
  static async logUnauthorizedAccess(userId, resourceType, resourceId, action, options = {}) {
    try {
      const {
        reason = 'other',
        ipAddress = null,
        userAgent = null
      } = options;

      const log = new AuditLog({
        userId: userId || 'unknown',
        resourceType,
        resourceId,
        action,
        status: 'unauthorized',
        reason,
        ipAddress,
        userAgent
      });

      await log.save();
      console.warn(`[AUDIT] Unauthorized access - User ${userId} attempted ${action} on ${resourceType}:${resourceId}`);
    } catch (error) {
      console.error('Error logging unauthorized access:', error);
    }
  }

  /**
   * Get audit trail for a resource (for GDPR data access requests)
   */
  static async getResourceAudit(resourceType, resourceId, limit = 100) {
    try {
      const logs = await AuditLog.find({
        resourceType,
        resourceId
      })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('userId', 'name email role');

      return logs;
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      return [];
    }
  }

  /**
   * Get user's data access history (for GDPR data requests)
   */
  static async getUserAudit(userId, limit = 100) {
    try {
      const logs = await AuditLog.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('userId', 'name email');

      return logs;
    } catch (error) {
      console.error('Error fetching user audit:', error);
      return [];
    }
  }

  /**
   * Export audit trail (for compliance reports)
   */
  static async exportAuditTrail(filters = {}, limit = 10000) {
    try {
      const logs = await AuditLog.find(filters)
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('userId', 'name email role');

      return logs;
    } catch (error) {
      console.error('Error exporting audit trail:', error);
      return [];
    }
  }

  /**
   * Detect suspicious activity (multiple failed accesses)
   */
  static async detectSuspiciousActivity(userId, timeWindowMinutes = 30) {
    try {
      const timeWindow = new Date(Date.now() - timeWindowMinutes * 60 * 1000);

      const failedAttempts = await AuditLog.countDocuments({
        userId,
        status: { $in: ['failed', 'unauthorized'] },
        createdAt: { $gte: timeWindow }
      });

      return failedAttempts >= 5; // Flag if 5+ failed attempts in window
    } catch (error) {
      console.error('Error detecting suspicious activity:', error);
      return false;
    }
  }
}

module.exports = AuditService;
