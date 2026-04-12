const express = require('express');
const router = express.Router();
const { pool } = require('../db/connection');
const twilio = require('twilio');

/**
 * POST /api/webhook
 * Twilio webhook for incoming SMS messages
 * Handles YES (opt-in) and STOP/NO (opt-out) responses
 */
router.post('/', async (req, res) => {
  const { From, Body } = req.body;
  const phoneNumber = From;
  const message = (Body || '').trim().toUpperCase();

  let conn;
  try {
    conn = await pool.getConnection();

    // Check if subscriber exists
    const existing = await conn.query(
      'SELECT * FROM subscribers WHERE phone_number = ?',
      [phoneNumber]
    );

    if (existing.length === 0) {
      // Unknown number - ignore or log
      console.log(`📱 Message from unknown number: ${phoneNumber}`);
      return res.status(200).send(''); // Return 200 to Twilio
    }

    const twiml = new twilio.twiml.MessagingResponse();

    // Handle YES - opt in
    if (message === 'YES' || message === 'Y') {
      await conn.query(
        'UPDATE subscribers SET opted_in = ?, opted_out = ? WHERE phone_number = ?',
        [true, false, phoneNumber]
      );
      console.log(`✅ ${phoneNumber} opted in`);
      twiml.message('🦐 You\'re subscribed! You\'ll receive weekly shrimp facts. Reply STOP to unsubscribe.');
    }
    // Handle STOP/NO - opt out
    else if (message === 'STOP' || message === 'NO' || message === 'UNSUBSCRIBE') {
      await conn.query(
        'UPDATE subscribers SET opted_in = ?, opted_out = ? WHERE phone_number = ?',
        [false, true, phoneNumber]
      );
      console.log(`❌ ${phoneNumber} opted out`);
      twiml.message('You\'ve been unsubscribed from Shrimp Facts.');
    }
    // Unknown response
    else {
      console.log(`❓ Unknown message from ${phoneNumber}: ${message}`);
      twiml.message('Reply YES to subscribe or STOP to unsubscribe.');
    }

    res.type('text/xml');
    res.send(twiml.toString());

  } catch (error) {
    console.error('Error in /api/webhook:', error);
    res.status(500).send('');
  } finally {
    if (conn) conn.release();
  }
});

module.exports = router;
