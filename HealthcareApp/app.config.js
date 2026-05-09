require('dotenv').config();
const appJson = require('./app.json');

const apiUrl = process.env.API_URL || 'http://192.168.0.86:3000';

module.exports = {
  expo: {
    ...appJson.expo,
    extra: {
      API_URL: apiUrl,
    },
  },
};
