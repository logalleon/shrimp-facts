const express = require('express');
const path = require('path');
require('dotenv').config();

const { testConnection } = require('./db/connection');
const subscribeRoute = require('./routes/subscribe');
const webhookRoute = require('./routes/webhook');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api/subscribe', subscribeRoute);
app.use('/api/webhook', webhookRoute);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
async function startServer() {
  // Test database connection
  const dbConnected = await testConnection();
  if (!dbConnected) {
    console.error('⚠️  Warning: Database connection failed. Server starting anyway...');
  }

  app.listen(PORT, () => {
    console.log(`\n🦐 Shrimp Facts Server Running`);
    console.log(`📡 Server: http://localhost:${PORT}`);
    console.log(`📱 Webhook: http://localhost:${PORT}/api/webhook`);
    console.log(`\n💡 Make sure to:`);
    console.log(`   1. Copy .env.example to .env and fill in your credentials`);
    console.log(`   2. Set up your Twilio webhook to point to /api/webhook`);
    console.log(`   3. Run the database schema: src/db/schema.sql\n`);
  });
}

startServer();
