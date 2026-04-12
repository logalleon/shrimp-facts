#!/usr/bin/env node

/**
 * Weekly Shrimp Facts Cron Job
 * 
 * This script should be run weekly via cron job to send a random shrimp fact
 * to all opted-in subscribers.
 * 
 * Example crontab entry (runs every Monday at 9 AM):
 * 0 9 * * 1 cd /path/to/shrimp-facts && node src/cron/sendWeeklyFact.js
 */

import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { pool } from '../db/connection.js';
import { sendSMS } from '../services/twilio.js';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const facts = JSON.parse(readFileSync(new URL('./facts.json', import.meta.url), 'utf-8'));

async function sendWeeklyFacts() {
  console.log('\n🦐 Starting Weekly Shrimp Facts Distribution...');
  console.log(`📅 ${new Date().toLocaleString()}\n`);

  let conn;
  try {
    // Connect to database
    conn = await pool.getConnection();
    console.log('✅ Connected to database');

    // Get all opted-in subscribers
    const subscribers = await conn.query(
      'SELECT phone_number FROM subscribers WHERE opted_in = ? AND opted_out = ?',
      [true, false]
    );

    if (subscribers.length === 0) {
      console.log('📭 No opted-in subscribers found. Exiting.');
      return;
    }

    console.log(`📱 Found ${subscribers.length} opted-in subscriber(s)`);

    // Select a random shrimp fact
    const randomFact = facts[Math.floor(Math.random() * facts.length)];
    console.log(`\n📝 Selected fact: "${randomFact}"\n`);

    // Send fact to each subscriber
    let successCount = 0;
    let failureCount = 0;

    for (const subscriber of subscribers) {
      const phoneNumber = subscriber.phone_number;
      
      try {
        const message = `🦐 Shrimp Fact of the Week 🦐\n\n${randomFact}\n\n(Reply STOP to unsubscribe)`;
        await sendSMS(phoneNumber, message);
        successCount++;
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`❌ Failed to send to ${phoneNumber}:`, error.message);
        failureCount++;
      }
    }

    console.log('\n📊 Distribution Summary:');
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${failureCount}`);
    console.log(`   📱 Total: ${subscribers.length}`);
    console.log('\n🎉 Weekly fact distribution complete!\n');

  } catch (error) {
    console.error('\n❌ Error during fact distribution:', error);
    process.exit(1);
  } finally {
    if (conn) {
      conn.release();
      await pool.end();
    }
  }
}

// Run the script
sendWeeklyFacts()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
