# 🦐 Shrimp Facts

A QR-code-driven SMS subscription service that sends weekly shrimp facts via Twilio. Users scan a QR code, subscribe with their phone number, and receive fascinating shrimp facts every week!

## 📋 Features

- **QR Code Landing Page**: Mobile-friendly subscription form
- **SMS Opt-In Flow**: Twilio-powered confirmation via SMS
- **Database Management**: MariaDB tracking of subscribers and opt-in status
- **Weekly Cron Job**: Automated delivery of random shrimp facts
- **Opt-Out Support**: Users can reply STOP to unsubscribe
- **Environment Variables**: Secure credential management via `.env`

## 🛠️ Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express.js
- **Database**: MariaDB
- **SMS Service**: Twilio SDK
- **Deployment**: DigitalOcean (Linux server)

## 📁 Project Structure

```
shrimp-facts/
├── public/                     # Frontend static files
│   ├── index.html              # Landing page
│   ├── styles.css              # Styling
│   └── script.js               # Client-side logic
├── src/
│   ├── server.js               # Express server entry point
│   ├── routes/
│   │   ├── subscribe.js        # POST /api/subscribe
│   │   └── webhook.js          # POST /api/webhook (Twilio incoming)
│   ├── db/
│   │   ├── connection.js       # MariaDB connection pool
│   │   └── schema.sql          # Database schema
│   ├── services/
│   │   └── twilio.js           # Twilio client wrapper
│   └── cron/
│       ├── sendWeeklyFact.js   # Weekly fact distribution script
│       └── facts.json          # Array of shrimp facts
├── .env.example                # Environment variables template
├── .gitignore                  # Git ignore rules
├── package.json                # Dependencies and scripts
└── README.md                   # This file
```

## 🚀 Getting Started

### Prerequisites

- **Node.js v20 LTS or higher** (v22 also supported)
  - ⚠️ **Important:** Node.js v18 is NOT compatible (missing import assertion support)
  - See `NODE-UPGRADE.md` for upgrade instructions
- MariaDB (v10.5 or higher)
- Twilio account with:
  - Account SID
  - Auth Token
  - Phone number (SMS-enabled)

### 1. Clone the Repository

```bash
git clone https://github.com/logalleon/shrimp-facts.git
cd shrimp-facts
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example environment file and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env` with your actual values:

```env
PORT=3000

# Twilio Configuration
TWILIO_ACCOUNT_SID=your_actual_account_sid
TWILIO_AUTH_TOKEN=your_actual_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# MariaDB Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=shrimp_user
DB_PASSWORD=your_secure_password
DB_NAME=shrimp_facts
```

### 4. Set Up MariaDB Database

#### Create Database and User

```bash
# Log into MariaDB as root
sudo mariadb -u root -p
```

```sql
-- Create database
CREATE DATABASE shrimp_facts CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user and grant privileges
CREATE USER 'shrimp_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON shrimp_facts.* TO 'shrimp_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### Initialize Database Schema

```bash
mariadb -u shrimp_user -p shrimp_facts < src/db/schema.sql
```

### 5. Start the Server

**Development mode (with auto-reload):**

```bash
npm run dev
```

**Production mode:**

```bash
npm start
```

The server will start at `http://localhost:3000`

## 🔧 Twilio Configuration

### Set Up Webhook for Incoming Messages

1. Log into your [Twilio Console](https://console.twilio.com/)
2. Go to **Phone Numbers** → **Manage** → **Active Numbers**
3. Click on your SMS-enabled phone number
4. Scroll to **Messaging Configuration**
5. Under **A MESSAGE COMES IN**, set:
   - **Webhook URL**: `https://yourdomain.com/api/webhook`
   - **HTTP Method**: `POST`
6. Save your changes

**For local testing**, use [ngrok](https://ngrok.com/):

```bash
ngrok http 3000
# Use the HTTPS URL: https://xxxx.ngrok.io/api/webhook
```

## 📱 User Flow

1. **Scan QR Code** → User lands on the subscription page
2. **Enter Phone Number** → User submits their number (E.164 format)
3. **Receive Opt-In SMS** → Twilio sends: _"Reply YES to subscribe..."_
4. **Reply YES** → User is marked as opted-in in the database
5. **Weekly Facts** → Every Monday at 9 AM, opted-in users receive a random shrimp fact
6. **Opt-Out** → User can reply STOP at any time to unsubscribe

## 🕐 Setting Up the Weekly Cron Job

### Test the Script Manually

```bash
npm run send-facts
```

### Schedule with Cron (Linux Server)

Edit your crontab:

```bash
crontab -e
```

Add this line to run every Monday at 9:00 AM:

```cron
0 9 * * 1 cd /path/to/shrimp-facts && /usr/bin/node src/cron/sendWeeklyFact.js >> /var/log/shrimp-facts-cron.log 2>&1
```

**Cron Schedule Examples:**

- `0 9 * * 1` - Every Monday at 9:00 AM
- `0 12 * * 5` - Every Friday at 12:00 PM
- `0 9 * * *` - Every day at 9:00 AM

### Using PM2 (Alternative)

```bash
npm install -g pm2

# Start server with PM2
pm2 start src/server.js --name shrimp-facts

# Schedule cron job
pm2 start src/cron/sendWeeklyFact.js --cron "0 9 * * 1" --no-autorestart --name weekly-facts
```

## 🖥️ Deployment to DigitalOcean

### 1. Provision a Droplet

- Create a Ubuntu 22.04 LTS droplet
- Choose appropriate size (Basic $6/month is sufficient)
- Add SSH keys for access

### 2. Install Node.js and MariaDB

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js (v18 LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MariaDB
sudo apt install -y mariadb-server mariadb-client

# Secure MariaDB installation
sudo mysql_secure_installation
```

### 3. Deploy Application

```bash
# Clone repository
cd /var/www
sudo git clone https://github.com/logalleon/shrimp-facts.git
cd shrimp-facts

# Install dependencies
sudo npm install --production

# Set up environment
sudo cp .env.example .env
sudo nano .env  # Edit with your credentials
```

### 4. Use PM2 for Process Management

```bash
sudo npm install -g pm2

# Start application
sudo pm2 start src/server.js --name shrimp-facts

# Configure PM2 to start on boot
sudo pm2 startup systemd
sudo pm2 save
```

### 5. Set Up Nginx as Reverse Proxy

```bash
sudo apt install -y nginx

# Create Nginx config
sudo nano /etc/nginx/sites-available/shrimp-facts
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/shrimp-facts /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 6. Set Up SSL with Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## 🔐 Security Considerations

- ✅ Never commit `.env` to version control
- ✅ Use strong database passwords
- ✅ Keep Twilio credentials secure
- ✅ Enable firewall (UFW) on server
- ✅ Keep dependencies updated: `npm audit fix`
- ✅ Use HTTPS in production

## 📊 API Endpoints

### `POST /api/subscribe`

Subscribe a phone number.

**Request:**

```json
{
  "phoneNumber": "+1234567890"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Success! Check your phone for a confirmation message."
}
```

### `POST /api/webhook`

Twilio webhook for incoming SMS messages.

**Handles:**

- `YES` → Opt-in confirmation
- `STOP` → Opt-out

### `GET /api/health`

Health check endpoint.

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2026-04-11T21:45:00.000Z"
}
```

## 🎨 Creating QR Codes

Generate QR codes pointing to your landing page:

1. Use a free service like [QR Code Generator](https://www.qr-code-generator.com/)
2. Enter your URL: `https://yourdomain.com`
3. Customize design if desired
4. Download and print on flyers

## 📄 Legal Pages

The project includes Privacy Policy and Terms & Conditions pages required for Twilio A2P Brand registration:

- **Privacy Policy**: `/privacy-policy.html` - Details data collection and usage
- **Terms & Conditions**: `/terms-and-conditions.html` - Service terms and user agreement

These pages are:

- Accessible from the main landing page footer
- Text-only and compliant with SMS regulations
- Customizable for your specific needs

**Note:** When registering your A2P Brand with Twilio, you'll need to provide:

- Privacy Policy URL: `https://yourdomain.com/privacy-policy.html`
- Terms & Conditions URL: `https://yourdomain.com/terms-and-conditions.html`

## 🐛 Troubleshooting

### Database Connection Fails

```bash
# Check MariaDB is running
sudo systemctl status mariadb

# Test connection
mariadb -u shrimp_user -p shrimp_facts
```

### Twilio Messages Not Sending

- Verify credentials in `.env`
- Check Twilio console for errors
- Ensure phone number is SMS-enabled
- Check balance/credits

### Webhook Not Receiving Messages

- Ensure webhook URL is publicly accessible
- Check Twilio webhook configuration
- Verify webhook URL uses HTTPS (required by Twilio)
- Check server logs: `pm2 logs shrimp-facts`

## 📝 License

ISC

## 🤝 Contributing

Contributions welcome! Please open an issue or submit a pull request.

## 📧 Support

For issues, please open a GitHub issue at:
https://github.com/logalleon/shrimp-facts/issues

---

Made with 🦐 and ❤️
