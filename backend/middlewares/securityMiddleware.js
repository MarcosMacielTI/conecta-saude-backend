const rateLimit = require('express-rate-limit');
const AuditService = require('../services/auditService');

/**
 * Security Middleware
 * Implements best practices:
 * - Rate limiting
 * - Data validation
 * - LGPD/GDPR compliance
 * - Suspicious activity detection
 * - Input sanitization
 */

// Rate limiting for general API calls
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 attempts per 15 minutes
  skipSuccessfulRequests: true,
  message: 'Too many login attempts, please try again later'
});

// Rate limiting for payment endpoints
const paymentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3, // 3 payment attempts per minute
  message: 'Too many payment attempts, please try again later'
});

/**
 * Middleware to capture request info for audit logs
 */
const captureRequestInfo = (req, res, next) => {
  req.audit = {
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent')
  };
  next();
};

/**
 * Middleware to check for suspicious activity
 */
const checkSuspiciousActivity = async (req, res, next) => {
  try {
    if (req.user && req.user.id) {
      const isSuspicious = await AuditService.detectSuspiciousActivity(req.user.id);
      
      if (isSuspicious) {
        console.warn(`[SECURITY] 🚨 Suspicious activity detected for user ${req.user.id}`);
        
        await AuditService.logUnauthorizedAccess(
          req.user.id,
          'user',
          req.user.id,
          'multiple_failed_attempts',
          {
            ipAddress: req.audit.ipAddress,
            userAgent: req.audit.userAgent
          }
        );

        return res.status(429).json({
          error: 'Suspicious activity detected. Please try again later.',
          code: 'SUSPICIOUS_ACTIVITY'
        });
      }
    }
    next();
  } catch (error) {
    console.error('Error checking suspicious activity:', error);
    next(); // Don't block on error
  }
};

/**
 * Middleware to validate sensitive data format
 */
const validateSensitiveData = (req, res, next) => {
  // Validate CPF format (11 digits)
  if (req.body.cpf) {
    const cpfRegex = /^\d{11}$/;
    if (!cpfRegex.test(req.body.cpf.replace(/\D/g, ''))) {
      return res.status(400).json({ error: 'Invalid CPF format' });
    }
  }

  // Validate email format
  if (req.body.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(req.body.email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
  }

  // Validate phone format (optional but if provided)
  if (req.body.phone) {
    const phoneRegex = /^\d{10,11}$/;
    if (!phoneRegex.test(req.body.phone.replace(/\D/g, ''))) {
      return res.status(400).json({ error: 'Invalid phone format' });
    }
  }

  next();
};

/**
 * Middleware to sanitize user input (prevent XSS)
 */
const sanitizeInput = (req, res, next) => {
  const sanitize = (str) => {
    if (typeof str !== 'string') return str;
    return str
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .trim();
  };

  // Sanitize string fields in body
  if (req.body) {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitize(req.body[key]);
      }
    }
  }

  // Sanitize query parameters
  for (const key in req.query) {
    if (typeof req.query[key] === 'string') {
      req.query[key] = sanitize(req.query[key]);
    }
  }

  next();
};

/**
 * Middleware to enforce HTTPS in production
 */
const enforceHTTPS = (req, res, next) => {
  if (process.env.NODE_ENV === 'production' && req.header('x-forwarded-proto') !== 'https') {
    return res.status(403).json({ error: 'HTTPS required' });
  }
  next();
};

/**
 * Middleware to prevent CSRF
 */
const preventCSRF = (req, res, next) => {
  // Allow GET, HEAD, OPTIONS without CSRF check
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // For POST/PUT/DELETE, verify Origin header matches host
  const origin = req.get('origin');
  const host = req.get('host');

  if (origin && !origin.includes(host)) {
    console.warn(`[SECURITY] CSRF attempt detected from ${origin}`);
    return res.status(403).json({ error: 'CSRF validation failed' });
  }

  next();
};

/**
 * Middleware to validate API key (for service-to-service calls)
 */
const validateApiKey = (req, res, next) => {
  const apiKey = req.get('X-API-Key');
  const validKey = process.env.INTERNAL_API_KEY;

  if (validKey && apiKey !== validKey) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  next();
};

/**
 * Middleware to log sensitive operations
 */
const logSensitiveOperation = (resourceType, action) => {
  return async (req, res, next) => {
    // Capture original json method
    const originalJson = res.json;

    // Override json to log after response
    res.json = function(data) {
      if (req.user && res.statusCode < 400) {
        AuditService.logAccess(
          req.user.id,
          resourceType,
          req.body._id || data._id || req.params.id,
          action,
          {
            ipAddress: req.audit.ipAddress,
            userAgent: req.audit.userAgent,
            reason: 'api_call'
          }
        ).catch(err => console.error('Error logging operation:', err));
      }
      return originalJson.call(this, data);
    };

    next();
  };
};

module.exports = {
  apiLimiter,
  authLimiter,
  paymentLimiter,
  captureRequestInfo,
  checkSuspiciousActivity,
  validateSensitiveData,
  sanitizeInput,
  enforceHTTPS,
  preventCSRF,
  validateApiKey,
  logSensitiveOperation
};
