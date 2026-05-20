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
  const appUrl = (process.env.FRONTEND_URL || 'https://planodeassinatura-production.up.railway.app').replace(/\/+$/, '');
  const appDeepLink = process.env.APP_DEEP_LINK || 'meusistema://reset-password';
  const webLink = `${appUrl}/reset-password?token=${encodeURIComponent(token)}`;
  const appLink = `${appDeepLink}?token=${encodeURIComponent(token)}`;

  const html = `
    <p>Olá ${name || 'usuário'},</p>
    <p>Recebemos uma solicitação para redefinir a sua senha.</p>
    <p>Se estiver usando o app móvel, tente abrir o link abaixo:</p>
    <p><a href="${appLink}">${appLink}</a></p>
    <p>Se o app não abrir, use este link no navegador:</p>
    <p><a href="${webLink}">${webLink}</a></p>
    <p>Esse link expira em 15 minutos.</p>
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
