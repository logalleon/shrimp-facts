import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Twilio client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

/**
 * Send an SMS message via Twilio
 * @param {string} to - Recipient phone number (E.164 format)
 * @param {string} body - Message content
 * @returns {Promise} Twilio message object
 */
async function sendSMS(to, body) {
  try {
    const message = await client.messages.create({
      body: body,
      from: TWILIO_PHONE_NUMBER,
      to: to
    });
    console.log(`📱 SMS sent to ${to}: ${message.sid}`);
    return message;
  } catch (error) {
    console.error(`❌ Failed to send SMS to ${to}:`, error.message);
    throw error;
  }
}

/**
 * Send opt-in confirmation message
 * @param {string} phoneNumber - Phone number to send to
 * @returns {Promise} Twilio message object
 */
async function sendOptInMessage(phoneNumber) {
  const message = `🦐 Welcome to Shrimp Facts!\n\nReply YES to subscribe to weekly shrimp facts, or reply STOP to opt out.`;
  return sendSMS(phoneNumber, message);
}

export {
  sendSMS,
  sendOptInMessage
};
