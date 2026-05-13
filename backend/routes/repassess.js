const express = require('express');
const RepasseService = require('../services/repasseService');
const { verifyToken } = require('../middlewares/authMiddleware');
const User = require('../models/User');
const Repasse = require('../models/Repasse');

const router = express.Router();

/**
 * GET /api/repassess/my-history
 * Get professional's repasse history and earnings
 */
router.get('/my-history', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (user.role !== 'professional') {
      return res.status(403).json({ error: 'Only professionals can access this endpoint' });
    }

    const professionalId = user.professionalId;
    const repassess = await RepasseService.getProfessionalRepasseHistory(professionalId);
    const stats = await RepasseService.getProfessionalRepasseStats(professionalId);

    res.json({
      stats,
      repassess: repassess.map(r => ({
        id: r._id,
        date: r.createdAt,
        patient: r.userId?.name,
        planName: r.planName,
        amount: r.netAmount,
        status: r.status,
        transferredAt: r.transferredAt
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/repassess/stats
 * Get earnings statistics
 */
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (user.role !== 'professional') {
      return res.status(403).json({ error: 'Only professionals can access this endpoint' });
    }

    const stats = await RepasseService.getProfessionalRepasseStats(user.professionalId);

    // Format for display
    const formattedStats = {
      totalEarned: `R$ ${stats.totalTransferred.toFixed(2)}`,
      pendingTransfer: `R$ ${stats.totalPending.toFixed(2)}`,
      failedTransfers: `R$ ${stats.totalFailed.toFixed(2)}`,
      transactionCount: stats.transactionCount,
      averagePerTransaction: `R$ ${stats.averagePerTransaction.toFixed(2)}`,
      note: '100% of earnings - no fees deducted'
    };

    res.json(formattedStats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/repassess/process-pending
 * Process pending repassess (admin/scheduler only)
 * Should be called via cron job
 */
router.post('/process-pending', async (req, res) => {
  try {
    // Verify API key for automated calls
    const apiKey = req.get('X-API-Key');
    if (apiKey !== process.env.INTERNAL_API_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await RepasseService.processPendingRepassess();

    res.json({
      processed: result.processed,
      totalAmount: `R$ ${result.totalAmount.toFixed(2)}`,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/repassess/verify-integrity
 * Verify no fees were deducted (security check)
 */
router.get('/verify-integrity/:repasseId', async (req, res) => {
  try {
    // Verify API key
    const apiKey = req.get('X-API-Key');
    if (apiKey !== process.env.INTERNAL_API_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const isValid = await RepasseService.verifyNoFeesDeducted(req.params.repasseId);

    res.json({
      repasseId: req.params.repasseId,
      noFeesDeducted: isValid,
      status: isValid ? '✅ Valid' : '❌ Fee detected!'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/repassess/:repasseId
 * Get repasse details
 */
router.get('/:repasseId', verifyToken, async (req, res) => {
  try {
    const repasse = await Repasse.findById(req.params.repasseId)
      .populate('userId', 'name email')
      .populate('professionalId', 'name email')
      .populate('paymentId');

    if (!repasse) {
      return res.status(404).json({ error: 'Repasse not found' });
    }

    // Check authorization (only user, professional, or admin can view)
    if (
      req.user.id !== repasse.userId._id.toString() &&
      req.user.id !== repasse.professionalId._id.toString()
    ) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json({
      id: repasse._id,
      patient: repasse.userId?.name,
      professional: repasse.professionalId?.name,
      planName: repasse.planName,
      amount: `R$ ${repasse.netAmount.toFixed(2)}`,
      status: repasse.status,
      createdAt: repasse.createdAt,
      transferredAt: repasse.transferredAt,
      note: 'No fees deducted - 100% of payment goes to professional'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
