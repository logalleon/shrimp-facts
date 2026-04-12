import express from 'express';
import { pool } from '../db/connection.js';
import { sendOptInMessage } from '../services/twilio.js';

const router = express.Router();

/**
 * POST /api/subscribe
 * Accepts a phone number, validates it, sends opt-in SMS, and stores in database
 */
router.post('/', async (req, res) => {
  const { phoneNumber } = req.body;

  // Validate phone number exists
  if (!phoneNumber) {
    return res.status(400).json({ 
      success: false, 
      error: 'Phone number is required' 
    });
  }

  // Basic E.164 format validation (+1XXXXXXXXXX)
  const phoneRegex = /^\+\d{1,15}$/;
  if (!phoneRegex.test(phoneNumber)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid phone number format. Please use E.164 format (e.g., +1234567890)' 
    });
  }

  let conn;
  try {
    conn = await pool.getConnection();

    // Check if phone number already exists
    const existing = await conn.query(
      'SELECT * FROM subscribers WHERE phone_number = ?',
      [phoneNumber]
    );

    if (existing.length > 0) {
      const subscriber = existing[0];
      
      if (subscriber.opted_out) {
        return res.status(400).json({ 
          success: false, 
          error: 'This number has opted out and cannot resubscribe at this time.' 
        });
      }

      if (subscriber.opted_in) {
        return res.status(200).json({ 
          success: true, 
          message: 'This number is already subscribed!' 
        });
      }

      // Pending opt-in - resend confirmation
      await sendOptInMessage(phoneNumber);
      return res.status(200).json({ 
        success: true, 
        message: 'Confirmation message resent! Please reply YES to confirm.' 
      });
    }

    // Insert new subscriber (pending opt-in)
    await conn.query(
      'INSERT INTO subscribers (phone_number, opted_in, opted_out) VALUES (?, ?, ?)',
      [phoneNumber, false, false]
    );

    // Send opt-in confirmation via Twilio
    await sendOptInMessage(phoneNumber);

    res.status(201).json({ 
      success: true, 
      message: 'Success! Check your phone for a confirmation message.' 
    });

  } catch (error) {
    console.error('Error in /api/subscribe:', error);
    res.status(500).json({ 
      success: false, 
      error: 'An error occurred. Please try again later.' 
    });
  } finally {
    if (conn) conn.release();
  }
});

export default router;
