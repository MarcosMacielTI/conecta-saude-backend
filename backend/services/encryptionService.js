const crypto = require('crypto');

/**
 * Encryption Service
 * Handles encryption/decryption of sensitive data (CPF, documents, etc)
 * Uses AES-256-GCM for authenticated encryption
 */

class EncryptionService {
  constructor() {
    const encryptionKey = process.env.ENCRYPTION_KEY;
    
    if (!encryptionKey) {
      throw new Error('ENCRYPTION_KEY not set in environment variables');
    }

    // Convert hex string to Buffer (must be 32 bytes for AES-256)
    if (encryptionKey.length !== 64) {
      throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
    }
    
    this.encryptionKey = Buffer.from(encryptionKey, 'hex');
  }

  /**
   * Generate a random ENCRYPTION_KEY for .env
   */
  static generateEncryptionKey() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Encrypt sensitive data
   * @param {string} plaintext - Data to encrypt
   * @returns {string} iv:authTag:encryptedData (all in hex)
   */
  encrypt(plaintext) {
    try {
      // Generate random IV (Initialization Vector)
      const iv = crypto.randomBytes(12);

      // Create cipher
      const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);

      // Encrypt data
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Get authentication tag
      const authTag = cipher.getAuthTag();

      // Return iv:authTag:encrypted (all in hex for easy storage)
      return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt sensitive data
   * @param {string} encryptedData - Format: iv:authTag:encrypted (all in hex)
   * @returns {string} Decrypted plaintext
   */
  decrypt(encryptedData) {
    try {
      // Parse encrypted data
      const [ivHex, authTagHex, encrypted] = encryptedData.split(':');

      if (!ivHex || !authTagHex || !encrypted) {
        throw new Error('Invalid encrypted data format');
      }

      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');

      // Create decipher
      const decipher = crypto.createDecipheriv('aes-256-gcm', this.encryptionKey, iv);
      decipher.setAuthTag(authTag);

      // Decrypt data
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Hash sensitive data (one-way, for verification)
   * @param {string} plaintext - Data to hash
   * @returns {string} SHA-256 hash
   */
  hash(plaintext) {
    return crypto
      .createHash('sha256')
      .update(plaintext)
      .digest('hex');
  }

  /**
   * Generate secure random token
   * @param {number} length - Token length in bytes
   * @returns {string} Random hex token
   */
  static generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }
}

module.exports = EncryptionService;
