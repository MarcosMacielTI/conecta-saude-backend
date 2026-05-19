const nodemailer = require('nodemailer');

const getTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT, 10) || 587;
  const secure = process.env.SMTP_SECURE === 'true';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
};

const sendPasswordResetEmail = async ({ to, name, token }) => {
  const transporter = getTransporter();
  if (!transporter) {
    return {
      success: false,
      error: 'Configuração de SMTP incompleta. Configure SMTP_HOST, SMTP_PORT, SMTP_USER e SMTP_PASS.',
    };
  }

  const from = process.env.EMAIL_FROM || process.env.SMTP_USER;
  const appUrl = process.env.FRONTEND_URL || 'https://planodeassinatura-production.up.railway.app';
  const resetLink = `${appUrl}/reset-password?token=${token}`;

  const html = `
    <p>Olá ${name || 'usuário'},</p>
    <p>Recebemos uma solicitação para redefinir a sua senha.</p>
    <p>Use o código abaixo no app ou acesse o link de redefinição:</p>
    <p><strong>${token}</strong></p>
    <p>Link de redefinição: <a href="${resetLink}">${resetLink}</a></p>
    <p>Esse código expira em 1 hora.</p>
    <p>Se você não solicitou essa alteração, ignore esta mensagem.</p>
  `;

  try {
    await transporter.sendMail({
      from,
      to,
      subject: 'Redefinição de senha - Conecta Saúde',
      html,
    });

    return { success: true };
  } catch (error) {
    console.error('Erro ao enviar email de redefinição:', error);
    return {
      success: false,
      error: 'Erro ao enviar email de redefinição. Verifique as configurações de SMTP.',
    };
  }
};

module.exports = {
  sendPasswordResetEmail,
};
