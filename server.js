require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

// Middleware
app.use(cors({
  origin: '*',  // Autoriser toutes les origines pour faciliter les tests
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Créer un favicon.ico vide pour éviter les erreurs 404
app.get('/favicon.ico', (req, res) => {
  res.status(204).end(); // No content
});

// Route pour générer un token
app.get('/api/token', (req, res) => {
  res.status(200).json({ 
    appId: process.env.AGORA_APP_ID,
    appVersion: '1.0.0'
  });
});

// Route de diagnostic réseau
app.get('/api/network-test', (req, res) => {
  const networkInfo = {
    timestamp: new Date().toISOString(),
    status: 'ok'
  };
  res.status(200).json(networkInfo);
});

// Route principale
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route pour les logs clients (utile pour le débogage)
app.post('/api/logs', (req, res) => {
  const logData = req.body;
  console.log('Log client:', logData);
  res.status(200).json({ received: true });
});

// Port du serveur
const PORT = process.env.PORT || 3000;

// Démarrer le serveur sur toutes les interfaces réseau
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n=== SERVEUR WEBRTC AGORA ===`);
  console.log(`Serveur démarré sur le port ${PORT}`);
  
  // Afficher les informations de connexion
  console.log('\n=== INFORMATIONS DE CONNEXION ===');
  console.log(`• Local: http://localhost:${PORT}`);
  console.log('• Réseau: Utilisez ngrok ou votre adresse IP locale');
  
  // Vérifier la configuration Agora
  if (!process.env.AGORA_APP_ID) {
    console.log('\n⚠️  ATTENTION: Variable AGORA_APP_ID non définie dans le fichier .env');
    console.log('   L\'application ne fonctionnera pas correctement.');
  } else {
    console.log('\n✅ Configuration Agora détectée');
  }
  
  console.log('\n=== INSTRUCTIONS ===');
  console.log('1. Accédez à l\'application via http://localhost:3000');
  console.log('2. Pour tester entre deux ordinateurs, utilisez ngrok:');
  console.log('   ngrok http 3000');
  console.log('3. Partagez l\'URL ngrok générée avec l\'autre participant');
  console.log('\n=== LOGS SERVEUR ===');
});