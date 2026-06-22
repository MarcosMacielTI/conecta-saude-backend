const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Subscription = require('../models/Subscription');

const NO_PLAN_VALUES = new Set(['sem plano', 'semplano', 'nenhum', 'none', 'no plan']);

function normalizePlan(plan) {
  if (!plan) return '';
  return String(plan).trim().toLowerCase();
}

function hasActivePlan(plan) {
  const normalized = normalizePlan(plan);
  return normalized && !NO_PLAN_VALUES.has(normalized);
}

/**
 * Verify JWT token
 */
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Verify user has active plan
 * Blocks access if:
 * - User doesn't have a plan
 * - Plan is inactive
 * - No consultations left (optional check)
 */
const verifyActivePlan = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Check if user has a valid plan
    if (!hasActivePlan(user.plan)) {
      return res.status(403).json({
        error: 'No active plan. Please purchase a plan to access this feature.',
        code: 'NO_PLAN'
      });
    }

    // Check subscription status in database
    const subscription = await Subscription.findOne({
      user: req.user.id,
      status: 'active'
    });

    if (!subscription) {
      // Clear plan if no active subscription found
      await User.findByIdAndUpdate(req.user.id, {
        plan: null,
        consultationsLeft: 0
      });
      return res.status(403).json({
        error: 'No active subscription found. Please purchase a plan.',
        code: 'NO_SUBSCRIPTION'
      });
    }

    // Plan is active, continue
    req.userSubscription = subscription;
    next();
  } catch (error) {
    console.error('Error verifying plan:', error);
    res.status(400).json({ error: error.message });
  }
};

/**
 * Verify user has consultations left
 */
const verifyConsultationsLeft = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!hasActivePlan(user.plan)) {
      return res.status(403).json({
        error: 'No active plan. Please purchase a plan to access this feature.',
        code: 'NO_PLAN'
      });
    }

    if (!user.consultationsLeft || user.consultationsLeft <= 0) {
      return res.status(403).json({
        error: 'No consultations left in your plan. Please upgrade or renew.',
        code: 'NO_CONSULTATIONS_LEFT',
        consultationsLeft: user.consultationsLeft || 0
      });
    }

    next();
  } catch (error) {
    console.error('Error verifying consultations:', error);
    res.status(400).json({ error: error.message });
  }
};

/**
 * Verify user is professional
 */
const verifyProfessional = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.role !== 'professional') {
      return res.status(403).json({
        error: 'This feature is only available for professionals.',
        code: 'NOT_PROFESSIONAL'
      });
    }

    next();
  } catch (error) {
    console.error('Error verifying professional:', error);
    res.status(400).json({ error: error.message });
  }
};

/**
 * Verify user is patient
 */
const verifyPatient = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.role !== 'patient') {
      return res.status(403).json({
        error: 'This feature is only available for patients.',
        code: 'NOT_PATIENT'
      });
    }

    next();
  } catch (error) {
    console.error('Error verifying patient:', error);
    res.status(400).json({ error: error.message });
  }
};

/**
 * Optional: Less strict plan verification
 * Allows access but returns plan info
 */
const getPlanInfo = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (user) {
      req.planInfo = {
        plan: user.plan,
        consultationsLeft: user.consultationsLeft,
        professionalId: user.professionalId,
      };
    }
    next();
  } catch (error) {
    console.error('Error getting plan info:', error);
    next();
  }
};

module.exports = {
  verifyToken,
  verifyActivePlan,
  verifyConsultationsLeft,
  verifyProfessional,
  verifyPatient,
  getPlanInfo,
  hasActivePlan,
};
