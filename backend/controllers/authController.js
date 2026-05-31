const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const PasswordResetToken = require('../models/PasswordResetToken');
const { sendPasswordResetEmail } = require('../services/emailService');

const generateResetToken = () => crypto.randomBytes(20).toString('hex');

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const normalizedEmail = email.toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (user) {
      await PasswordResetToken.updateMany(
        { userId: user._id, used: false },
        { used: true }
      );

      const resetToken = generateResetToken();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      await PasswordResetToken.create({
        userId: user._id,
        token: resetToken,
        expiresAt,
      });

      await sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        token: resetToken,
      });
    }

    return res.json({ message: 'Se o e-mail existir, um link foi enviado.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.json({ message: 'Se o e-mail existir, um link foi enviado.' });
  }
};

const resetPassword = async (req, res) => {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ error: 'Token and password are required' });
    }

    try {
      const resetRecord = await PasswordResetToken.findOne({
        token,
        used: false,
        expiresAt: { $gt: new Date() },
      });

      if (!resetRecord) {
        return res.status(400).json({ error: 'Invalid or expired reset token' });
      }

      const user = await User.findById(resetRecord.userId);
      if (!user) {
        return res.status(400).json({ error: 'Invalid or expired reset token' });
      }

      user.password = await bcrypt.hash(password, 10);
      await user.save();

      resetRecord.used = true;
      resetRecord.usedAt = new Date();
      await resetRecord.save();

      return res.json({ message: 'Senha alterada com sucesso' });
    } catch (err) {
      console.error('Reset password error:', err);
      return res.status(400).json({ error: err.message });
    }
  };

  module.exports = {
    forgotPassword,
    resetPassword,
  };
