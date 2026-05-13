const { MercadoPagoConfig, Payment: MercadoPagoPayment, PaymentRefund } = require('mercadopago');
const Payment = require('../models/Payment');
const User = require('../models/User');
const Professional = require('../models/Professional');
const Subscription = require('../models/Subscription');
const Connection = require('../models/Connection');
const RepasseService = require('./repasseService');
const AuditService = require('./auditService');

const mpConfig = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN,
  options: {
    timeout: 10000,
  },
});

const mpPayment = new MercadoPagoPayment(mpConfig);
const mpRefund = new PaymentRefund(mpConfig);

/**
 * Create a payment request and return QR code for Pix
 */
async function createPixPayment(paymentData) {
  const {
    userId,
    professionalId,
    subscriptionId,
    planName,
    planPrice,
    planDuration = 'mensal',
    userEmail,
  } = paymentData;

  try {
    const backendUrl = process.env.BACKEND_BASE_URL || 'http://localhost:3000';
    
    // Create payment request body
    const paymentRequest = {
      transaction_amount: parseFloat(planPrice),
      description: `Plano ${planName} - Consultas com Profissional`,
      external_reference: subscriptionId.toString(),
      payment_method_id: 'pix',
      payer: {
        email: userEmail,
        first_name: userId.toString(),
      },
      notification_url: `${backendUrl}/api/payments/webhook`,
    };

    // Create payment in Mercado Pago
    const response = await mpPayment.create({ body: paymentRequest });

    if (!response) {
      throw new Error('Empty response from Mercado Pago');
    }

    // Extract QR Code data (Pix specific)
    const qrCodeData = response.point_of_interaction?.transaction_data?.qr_code;
    const qrCodeUrl = response.point_of_interaction?.transaction_data?.qr_code_url;
    const paymentId = response.id;
    const paymentStatus = response.status || 'pending';

    // Save payment record
    const payment = new Payment({
      userId,
      professionalId,
      subscriptionId,
      planName,
      planPrice,
      planDuration,
      paymentMethod: 'pix',
      mercadoPagoId: paymentId,
      mercadoPagoStatus: paymentStatus,
      qrCodeData,
      qrCodeUrl,
      transactionId: paymentId,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours expiration
    });

    await payment.save();

    return {
      success: true,
      paymentId: payment._id,
      mercadoPagoId: paymentId,
      qrCodeData,
      qrCodeUrl,
      expiresAt: payment.expiresAt,
      message: 'Pagamento criado com sucesso. Escaneie o QR code para pagar.',
    };
  } catch (error) {
    console.error('Error creating Pix payment:', error);
    throw new Error(`Erro ao criar pagamento: ${error.message}`);
  }
}

/**
 * Create credit/debit card payment
 */
async function createCardPayment(paymentData) {
  const {
    userId,
    professionalId,
    subscriptionId,
    planName,
    planPrice,
    planDuration = 'mensal',
    userEmail,
    token, // Card token from frontend
    installments = 1,
  } = paymentData;

  try {
    const backendUrl = process.env.BACKEND_BASE_URL || 'http://localhost:3000';

    const paymentRequest = {
      transaction_amount: parseFloat(planPrice),
      description: `Plano ${planName} - Consultas com Profissional`,
      external_reference: subscriptionId.toString(),
      payment_method_id: 'credit_card',
      token,
      installments,
      payer: {
        email: userEmail,
        first_name: userId.toString(),
      },
      notification_url: `${backendUrl}/api/payments/webhook`,
    };

    const response = await mpPayment.create({ body: paymentRequest });

    // Save payment record
    const payment = new Payment({
      userId,
      professionalId,
      subscriptionId,
      planName,
      planPrice,
      planDuration,
      paymentMethod: 'credit_card',
      mercadoPagoId: response.id,
      mercadoPagoStatus: response.status || 'pending',
      transactionId: response.id,
    });

    await payment.save();

    return {
      success: true,
      paymentId: payment._id,
      mercadoPagoId: response.id,
      status: response.status,
      message: response.status === 'approved' ? 'Pagamento aprovado!' : 'Pagamento em processamento.',
    };
  } catch (error) {
    console.error('Error creating card payment:', error);
    throw new Error(`Erro ao processar pagamento: ${error.message}`);
  }
}

/**
 * Get payment status from Mercado Pago
 */
async function getPaymentStatus(mercadoPagoId) {
  try {
    const response = await mpPayment.get({ id: mercadoPagoId });
    return {
      id: response.id,
      status: response.status,
      statusDetail: response.status_detail,
      amount: response.transaction_amount,
      paymentMethod: response.payment_method?.type,
    };
  } catch (error) {
    console.error('Error fetching payment status:', error);
    throw new Error(`Erro ao verificar status: ${error.message}`);
  }
}

/**
 * Process webhook notification from Mercado Pago
 */
async function processWebhook(webhookData) {
  const { action, data } = webhookData;

  // Only process payment notifications
  if (action !== 'payment.created' && action !== 'payment.updated') {
    return { processed: false, reason: 'Not a payment notification' };
  }

  const mercadoPagoId = data?.id;
  if (!mercadoPagoId) {
    throw new Error('Missing payment ID in webhook');
  }

  try {
    // Get payment details from Mercado Pago
    const mpPayment = await getPaymentStatus(mercadoPagoId);
    
    // Find payment record
    const payment = await Payment.findOne({ mercadoPagoId });
    if (!payment) {
      console.warn(`Payment not found for Mercado Pago ID: ${mercadoPagoId}`);
      return { processed: false, reason: 'Payment not found' };
    }

    // Update payment status
    payment.mercadoPagoStatus = mpPayment.status;
    
    // If approved, activate subscription
    if (mpPayment.status === 'approved') {
      payment.approvedAt = new Date();
      await payment.save();

      // Activate subscription
      await activateSubscription(payment.subscriptionId, payment.userId, payment.professionalId);
      
      return {
        processed: true,
        status: 'approved',
        message: 'Subscription activated successfully',
      };
    } else if (mpPayment.status === 'rejected' || mpPayment.status === 'cancelled') {
      payment.mercadoPagoStatus = mpPayment.status;
      await payment.save();
      return {
        processed: true,
        status: mpPayment.status,
        message: `Payment ${mpPayment.status}`,
      };
    } else {
      // Status is 'pending'
      await payment.save();
      return {
        processed: true,
        status: 'pending',
        message: 'Payment pending confirmation',
      };
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
    throw error;
  }
}

/**
 * Activate subscription after successful payment
 */
async function activateSubscription(subscriptionId, userId, professionalId) {
  try {
    // Find subscription
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) throw new Error('Subscription not found');

    // Mark as active
    subscription.status = 'active';
    await subscription.save();

    // Map plan to consultations
    const consultationMap = {
      'Básico': 1,
      'Intermediário': 2,
      'Premium': 3,
    };

    const consultations = consultationMap[subscription.plan] || 1;

    // Update user with plan and consultations
    const user = await User.findByIdAndUpdate(userId, {
      plan: subscription.plan,
      consultationsLeft: consultations,
      professionalId,
    }, { new: true });

    // Update professional (add client)
    await Professional.findByIdAndUpdate(professionalId, {
      $addToSet: { clients: userId },
    });

    // Create connection if doesn't exist
    const existingConnection = await Connection.findOne({ patientId: userId, professionalId });
    if (!existingConnection) {
      const connection = new Connection({
        patientId: userId,
        professionalId,
      });
      await connection.save();
    }

    // Find payment to create repasse
    const payment = await Payment.findOne({ subscriptionId });
    if (payment) {
      try {
        // Create repasse (100% transfer to professional, no fees)
        await RepasseService.createRepasseFromPayment(payment._id);
        
        console.log(`[PAYMENT] ✅ Repasse created for payment ${payment._id}`);
        console.log(`[PAYMENT] 💰 R$ ${payment.planPrice.toFixed(2)} will be transferred to professional (100% - no fees)`);

        // Log to audit trail
        await AuditService.logAccess(
          userId,
          'subscription',
          subscriptionId,
          'create',
          {
            reason: 'payment_processing',
            fieldsAccessed: ['plan', 'consultationsLeft']
          }
        );
      } catch (error) {
        console.error('Error creating repasse:', error);
        // Don't fail subscription activation if repasse creation fails
      }
    }

    return {
      success: true,
      user,
      message: 'Subscription activated successfully',
    };
  } catch (error) {
    console.error('Error activating subscription:', error);
    throw error;
  }
}

/**
 * Cancel payment (refund)
 */
async function cancelPayment(paymentId, reason = 'Customer requested') {
  try {
    const payment = await Payment.findById(paymentId);
    if (!payment) throw new Error('Payment not found');

    // Cancel in Mercado Pago
    const response = await mpRefund.create({
      payment_id: payment.mercadoPagoId,
      body: {}
    });

    // Update payment record
    payment.mercadoPagoStatus = 'cancelled';
    payment.refundedAt = new Date();
    payment.refundReason = reason;
    await payment.save();

    // Deactivate subscription if exists
    if (payment.subscriptionId) {
      await Subscription.findByIdAndUpdate(payment.subscriptionId, {
        status: 'inactive',
      });

      // Clear user plan
      await User.findByIdAndUpdate(payment.userId, {
        plan: null,
        consultationsLeft: 0,
      });
    }

    return {
      success: true,
      message: 'Payment cancelled successfully',
    };
  } catch (error) {
    console.error('Error cancelling payment:', error);
    throw error;
  }
}

module.exports = {
  createPixPayment,
  createCardPayment,
  getPaymentStatus,
  processWebhook,
  activateSubscription,
  cancelPayment,
};
