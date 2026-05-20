const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Payment = require('../models/Payment');
const Subscription = require('../models/Subscription');
const paymentService = require('../services/paymentService');

const router = express.Router();

// Middleware to verify token
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Access denied' });
  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid token' });
  }
};

const normalizePlanName = (planName) => {
  if (!planName) return planName;
  const normalized = String(planName).trim().toLowerCase();
  const map = {
    basico: 'Básico',
    'básico': 'Básico',
    basic: 'Básico',
    intermediario: 'Intermediário',
    'intermediário': 'Intermediário',
    intermediate: 'Intermediário',
    premium: 'Premium',
    teste: 'Premium',
    'teste premium': 'Premium',
  };
  return map[normalized] || planName;
};

const createPendingSubscription = async ({ userId, professionalId, planName, planDuration, planPrice, paymentMethod }) => {
  const subscription = new Subscription({
    user: userId,
    professional: professionalId,
    plan: normalizePlanName(planName),
    duration: planDuration || 'mensal',
    price: planPrice,
    paymentMethod,
    status: 'inactive',
  });
  await subscription.save();
  return subscription;
};

/**
 * POST /api/payments/create-pix
 * Create Pix payment and return QR code
 */
router.post('/create-pix', verifyToken, async (req, res) => {
  try {
    const { professionalId, subscriptionId, planName, planPrice, planDuration } = req.body;

    if (!professionalId || !planName || !planPrice) {
      return res.status(400).json({
        error: 'Missing required fields: professionalId, planName, planPrice'
      });
    }

    // Get user email
    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    let subscriptionRecord = null;
    if (subscriptionId) {
      subscriptionRecord = await Subscription.findById(subscriptionId);
    }

    if (!subscriptionRecord) {
      subscriptionRecord = await createPendingSubscription({
        userId: req.user.id,
        professionalId,
        planName,
        planDuration,
        planPrice,
        paymentMethod: 'pix',
      });
    }

    const paymentResult = await paymentService.createPixPayment({
      userId: req.user.id,
      professionalId,
      subscriptionId: subscriptionRecord._id,
      planName: subscriptionRecord.plan,
      planPrice,
      planDuration: subscriptionRecord.duration,
      userEmail: user.email,
    });

    res.status(201).json(paymentResult);
  } catch (error) {
    console.error('Error creating Pix payment:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/payments/create-card
 * Create credit/debit card payment
 */
router.post('/create-card', verifyToken, async (req, res) => {
  try {
    const {
      professionalId,
      subscriptionId,
      planName,
      planPrice,
      planDuration,
      token,
      installments = 1
    } = req.body;

    if (!professionalId || !planName || !planPrice || !token) {
      return res.status(400).json({
        error: 'Missing required fields: professionalId, planName, planPrice, token'
      });
    }

    // Get user email
    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    let subscriptionRecord = null;
    if (subscriptionId) {
      subscriptionRecord = await Subscription.findById(subscriptionId);
    }

    if (!subscriptionRecord) {
      subscriptionRecord = await createPendingSubscription({
        userId: req.user.id,
        professionalId,
        planName,
        planDuration,
        planPrice,
        paymentMethod: 'credit_card',
      });
    }

    const paymentResult = await paymentService.createCardPayment({
      userId: req.user.id,
      professionalId,
      subscriptionId: subscriptionRecord._id,
      planName: subscriptionRecord.plan,
      planPrice,
      planDuration: subscriptionRecord.duration,
      userEmail: user.email,
      token,
      installments,
    });

    res.status(201).json(paymentResult);
  } catch (error) {
    console.error('Error creating card payment:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/payments/:paymentId
 * Get payment status
 */
router.get('/:paymentId', verifyToken, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.paymentId);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    // Verify user owns this payment
    if (payment.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Get latest status from Mercado Pago
    const status = await paymentService.getPaymentStatus(payment.mercadoPagoId);
    payment.mercadoPagoStatus = status.status;
    await payment.save();

    if (status.status === 'approved' && payment.subscriptionId) {
      const subscription = await Subscription.findById(payment.subscriptionId);
      if (subscription && subscription.status !== 'active') {
        await paymentService.activateSubscription(payment.subscriptionId, payment.userId, payment.professionalId);
      }
    }

    res.json({
      paymentId: payment._id,
      mercadoPagoId: payment.mercadoPagoId,
      status: status.status,
      statusDetail: status.statusDetail,
      planName: payment.planName,
      planPrice: payment.planPrice,
      paymentMethod: payment.paymentMethod,
      qrCodeData: payment.qrCodeData,
      qrCodeUrl: payment.qrCodeUrl,
      createdAt: payment.createdAt,
      expiresAt: payment.expiresAt,
    });
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/payments/:paymentId/cancel
 * Cancel payment and refund
 */
router.post('/:paymentId/cancel', verifyToken, async (req, res) => {
  try {
    const { reason } = req.body;
    const payment = await Payment.findById(req.params.paymentId);

    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    // Verify user owns this payment
    if (payment.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Cancel payment
    const result = await paymentService.cancelPayment(req.params.paymentId, reason);
    res.json(result);
  } catch (error) {
    console.error('Error cancelling payment:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/payments/webhook
 * Mercado Pago webhook endpoint (NO AUTH REQUIRED)
 */
router.post('/webhook', async (req, res) => {
  try {
    // Verify webhook signature (optional but recommended)
    // const signature = req.header('X-Signature');
    // const requestId = req.header('X-Request-Id');
    // Implement signature verification if needed

    // Process webhook
    const result = await paymentService.processWebhook(req.body);

    res.status(200).json({
      received: true,
      processed: result.processed,
      status: result.status,
      message: result.message,
    });
  } catch (error) {
    console.error('Webhook error:', error);
    // Always respond with 200 to Mercado Pago to prevent retries
    res.status(200).json({
      received: true,
      error: error.message,
    });
  }
});

/**
 * GET /api/payments
 * Get user's payment history
 */
router.get('/', verifyToken, async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .populate('professionalId', 'name email specialty');

    res.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
