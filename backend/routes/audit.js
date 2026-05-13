const express = require('express');
const AuditService = require('../services/auditService');
const { verifyToken } = require('../middlewares/authMiddleware');

const router = express.Router();

/**
 * GET /api/audit/my-access
 * Get current user's data access history (GDPR right)
 */
router.get('/my-access', verifyToken, async (req, res) => {
  try {
    const logs = await AuditService.getUserAudit(req.user.id, 100);
    
    res.json({
      message: 'Your data access history',
      totalRecords: logs.length,
      logs: logs.map(log => ({
        date: log.createdAt,
        action: log.action,
        resourceType: log.resourceType,
        reason: log.reason,
        ipAddress: log.ipAddress,
        fieldsAccessed: log.fieldsAccessed
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/audit/resource/:resourceType/:resourceId
 * Get audit trail for a specific resource
 * Only for admins or resource owners
 */
router.get('/resource/:resourceType/:resourceId', verifyToken, async (req, res) => {
  try {
    const { resourceType, resourceId } = req.params;

    // TODO: Add authorization check
    const logs = await AuditService.getResourceAudit(resourceType, resourceId, 100);

    res.json({
      resourceType,
      resourceId,
      auditTrail: logs.map(log => ({
        date: log.createdAt,
        user: log.userId?.name || 'Unknown',
        action: log.action,
        status: log.status,
        reason: log.reason,
        ipAddress: log.ipAddress
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/audit/export
 * Export audit trail for compliance (admin only)
 */
router.post('/export', verifyToken, async (req, res) => {
  try {
    // TODO: Verify admin role

    const { filters = {}, startDate, endDate } = req.body;

    if (startDate && endDate) {
      filters.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const logs = await AuditService.exportAuditTrail(filters, 10000);

    res.json({
      exportedAt: new Date(),
      totalRecords: logs.length,
      logs: logs.map(log => ({
        date: log.createdAt,
        userId: log.userId?.email,
        resourceType: log.resourceType,
        resourceId: log.resourceId,
        action: log.action,
        status: log.status,
        reason: log.reason,
        ipAddress: log.ipAddress
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
