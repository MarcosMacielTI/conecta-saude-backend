const crypto = require('crypto');

/**
 * Service for managing video consultations
 * Using Jitsi Meet for free, open-source video conferencing
 */

/**
 * Generate unique Jitsi room name for a consultation
 */
function generateVideoLink(professionalId, patientId) {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  const roomName = `conecta-${professionalId.toString().slice(-4)}-${patientId.toString().slice(-4)}-${randomString}`;
  
  return {
    roomName,
    jitsiUrl: `https://meet.jit.si/${roomName}`,
    // Optional: Self-hosted Jitsi instance
    // jitsiUrl: `https://your-jitsi-domain.com/${roomName}`
  };
}

/**
 * Validate video link (check if format is correct)
 */
function validateVideoLink(link) {
  try {
    new URL(link);
    return link.includes('jit.si') || link.includes('meet.');
  } catch {
    return false;
  }
}

/**
 * Generate HTML embed code for Jitsi iframe
 */
function generateEmbedCode(roomName, userName = 'User', userEmail = '') {
  const iframeHtml = `
<iframe 
  allow='camera; microphone; fullscreen; display-capture' 
  src='https://meet.jit.si/${roomName}?userInfo.displayName=${encodeURIComponent(userName)}&userInfo.email=${encodeURIComponent(userEmail)}'
  style='width: 100%; height: 100%; border-radius: 8px;'
></iframe>
  `.trim();

  return iframeHtml;
}

/**
 * Get access link for patient to join video call
 */
function getPatientAccessLink(appointmentId, patientName, videoLink) {
  return {
    videoLink,
    accessUrl: `${videoLink}?userInfo.displayName=${encodeURIComponent(patientName)}`,
    type: 'patient'
  };
}

/**
 * Get access link for professional to start video call
 */
function getProfessionalAccessLink(appointmentId, professionalName, videoLink) {
  return {
    videoLink,
    accessUrl: `${videoLink}?userInfo.displayName=${encodeURIComponent(professionalName)}`,
    type: 'professional',
    startUrl: videoLink // Professional starts the call
  };
}

/**
 * Alternative: Generate meet.google.com link (requires Google Workspace)
 * Not implemented but available for future use
 */
function generateGoogleMeetLink() {
  // Requires: npm install @google-cloud/meet
  // Implementation would go here
  return null;
}

module.exports = {
  generateVideoLink,
  validateVideoLink,
  generateEmbedCode,
  getPatientAccessLink,
  getProfessionalAccessLink,
  generateGoogleMeetLink,
};
