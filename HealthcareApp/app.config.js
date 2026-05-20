require('dotenv').config();
const appJson = require('./app.json');

// Use explicit API_URL when present.
// In development, prefer a dynamic runtime fallback to the local host or emulator address.
const envApiUrl = process.env.API_URL?.trim();
const isProduction = process.env.NODE_ENV === 'production';
const apiUrl = envApiUrl || (isProduction ? appJson.expo?.extra?.API_URL : undefined);

module.exports = {
  expo: {
    ...appJson.expo,
    extra: {
      API_URL: apiUrl,
    },
  },
};
