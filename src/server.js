import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { testConnection } from './db/connection.js';
import subscribeRoute from './routes/subscribe.js';
import webhookRoute from './routes/webhook.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
