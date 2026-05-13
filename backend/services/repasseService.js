const Repasse = require('../models/Repasse');
const Payment = require('../models/Payment');
const Professional = require('../models/Professional');
const AuditService = require('./auditService');

/**
 * Repasse Service (Financial Transfers to Professionals)
 * - Automatic calculation of amount owed to each professional
 * - 100% of payment value (no fees, no interest)
 * - Tracks transfer status and audit trail
 */

class RepasseService {
  /**
   * Create repasse from approved payment
   * Called automatically when payment is approved via webhook
   */
  static async createRepasseFromPayment(paymentId) {
    try {
      // Fetch payment details
      const payment = await Payment.findById(paymentId)
        .populate('userId', 'name email')
        .populate('professionalId', 'name email');

      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.mercadoPagoStatus !== 'approved') {
        throw new Error('Payment is not approved yet');
      }

      // Check if repasse already exists
      const existingRepasse = await Repasse.findOne({ paymentId });
      if (existingRepasse) {
        console.log(`[REPASSE] Repasse already exists for payment ${paymentId}`);
        return existingRepasse;
      }

      // Create repasse with 100% of payment value
      const repasse = new Repasse({
        paymentId: payment._id,
        professionalId: payment.professionalId._id,
        userId: payment.userId._id,
        planName: payment.planName,
        grossAmount: payment.planPrice,
        netAmount: payment.planPrice, // 100% - NO DEDUCTIONS
        status: 'approved',
        approvedAt: payment.approvedAt || new Date(),
        notes: `Repasse for subscription ${payment.planName} - ${payment.paymentMethod.toUpperCase()}`
      });

      await repasse.save();

      // Log to audit trail
      await AuditService.logAccess(
        payment.userId._id,
        'repasse',
        repasse._id,
        'create',
        {
          reason: 'payment_processing',
          fieldsAccessed: ['grossAmount', 'netAmount', 'professionalId']
        }
      );

      console.log(`[REPASSE] Created repasse ${repasse._id} for professional ${payment.professionalId._id}`);
      console.log(`[REPASSE] Amount: R$ ${repasse.netAmount.toFixed(2)} (100% of payment)`);

      return repasse;
    } catch (error) {
      console.error('Error creating repasse:', error);
      throw error;
    }
  }

  /**
   * Process all pending repassess and transfer funds
   * Should be called daily (via cron job)
   */
  static async processPendingRepassess() {
    try {
      const pendingRepassess = await Repasse.find({ status: 'pending' })
        .populate('professionalId', 'name email');

      console.log(`[REPASSE] Processing ${pendingRepassess.length} pending repassess`);

      for (const repasse of pendingRepassess) {
        await this.processRepasse(repasse._id);
      }

      return {
        processed: pendingRepassess.length,
        totalAmount: pendingRepassess.reduce((sum, r) => sum + r.netAmount, 0)
      };
    } catch (error) {
      console.error('Error processing repassess:', error);
      throw error;
    }
  }

  /**
   * Process single repasse transfer
   */
  static async processRepasse(repasseId) {
    try {
      const repasse = await Repasse.findById(repasseId)
        .populate('professionalId')
        .populate('userId');

      if (!repasse) {
        throw new Error('Repasse not found');
      }

      if (repasse.status === 'transferred') {
        console.log(`[REPASSE] Repasse ${repasseId} already transferred`);
        return repasse;
      }

      // Update status to processing
      repasse.status = 'processing';
      repasse.processedAt = new Date();
      await repasse.save();

      // TODO: Integrate with your payment provider (Mercado Pago, Stripe, etc.)
      // For now, simulate successful transfer
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mark as transferred
      repasse.status = 'transferred';
      repasse.transferredAt = new Date();
      await repasse.save();

      // Update professional's balance
      const professional = repasse.professionalId;
      professional.balance = (professional.balance || 0) + repasse.netAmount;
      await professional.save();

      // Log to audit
      await AuditService.logAccess(
        repasse.userId._id,
        'repasse',
        repasse._id,
        'update',
        {
          reason: 'payment_processing',
          changes: {
            before: { status: 'processing' },
            after: { status: 'transferred' }
          }
        }
      );

      console.log(`[REPASSE] ✅ Transferred R$ ${repasse.netAmount.toFixed(2)} to ${professional.name}`);

      return repasse;
    } catch (error) {
      console.error('Error processing repasse:', error);

      // Update repasse with failure details
      const repasse = await Repasse.findById(repasseId);
      repasse.status = 'failed';
      repasse.failureReason = error.message;
      await repasse.save();

      throw error;
    }
  }

  /**
   * Get professional's repasse history
   */
  static async getProfessionalRepasseHistory(professionalId) {
    try {
      const repassess = await Repasse.find({ professionalId })
        .sort({ createdAt: -1 })
        .populate('userId', 'name email')
        .populate('paymentId');

      return repassess;
    } catch (error) {
      console.error('Error fetching repasse history:', error);
      return [];
    }
  }

  /**
   * Get repasse statistics for professional
   */
  static async getProfessionalRepasseStats(professionalId) {
    try {
      const repassess = await Repasse.find({ professionalId });

      const stats = {
        totalTransferred: 0,
        totalPending: 0,
        totalFailed: 0,
        averagePerTransaction: 0,
        transactionCount: 0
      };

      for (const repasse of repassess) {
        stats.transactionCount++;

        if (repasse.status === 'transferred') {
          stats.totalTransferred += repasse.netAmount;
        } else if (repasse.status === 'pending') {
          stats.totalPending += repasse.netAmount;
        } else if (repasse.status === 'failed') {
          stats.totalFailed += repasse.netAmount;
        }
      }

      if (stats.transactionCount > 0) {
        stats.averagePerTransaction = stats.totalTransferred / stats.transactionCount;
      }

      return stats;
    } catch (error) {
      console.error('Error calculating repasse stats:', error);
      return null;
    }
  }

  /**
   * Verify no fees are deducted (security check)
   */
  static async verifyNoFeesDeducted(repasseId) {
    try {
      const repasse = await Repasse.findById(repasseId)
        .populate('paymentId');

      if (repasse.grossAmount !== repasse.netAmount) {
        console.warn(`[SECURITY] ⚠️ Fee detected in repasse ${repasseId}!`);
        console.warn(`Gross: R$ ${repasse.grossAmount}, Net: R$ ${repasse.netAmount}`);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error verifying repasse integrity:', error);
      return false;
    }
  }
}

module.exports = RepasseService;
