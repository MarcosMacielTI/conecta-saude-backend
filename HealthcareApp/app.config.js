require('dotenv').config();
const appJson = require('./app.json');

// 🚀 Altere o valor abaixo para sua URL do Railway
// Exemplo: 'https://seu-projeto-railway.up.railway.app'
const apiUrl = process.env.API_URL || appJson.expo?.extra?.API_URL || 'http://10.0.0.172:3000';

module.exports = {
  expo: {
    ...appJson.expo,
    extra: {
      API_URL: apiUrl,
    },
  },
};
