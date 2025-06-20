# Daraja Developer Toolkit 🇰🇪

> **Never lose another M-Pesa webhook again**

A reliable webhook proxy service that sits between M-Pesa and your application, solving the most common pain points in Kenyan fintech development.

## 🎯 The Problem We're Solving

Every Kenyan developer integrating M-Pesa has experienced:

- **Lost webhooks** when dev servers go down
- **Zero visibility** into webhook delivery status
- **Manual testing** in production environments
- **No retry mechanism** when webhooks fail

## 🚀 Our Solution

**One permanent URL + Intelligent routing + Reliability**

```
M-Pesa → [Your Permanent URL] → [Smart Validation] → [Queue] → [Environment Router] → [Your App]
```

### Key Features

- ✅ **Permanent webhook URLs** - Set once with M-Pesa, never change
- ✅ **Environment routing** - Dev/staging/prod from one URL
- ✅ **Reliable delivery** - Retries, queuing, circuit breakers
- ✅ **Full observability** - Real-time dashboard and detailed logs
- ✅ **M-Pesa compliance** - Proper validation and response handling

## 🏗️ Architecture

### Services

```
├── webhook-service/     # Receives M-Pesa webhooks (Bun + Hono)
├── delivery-worker/     # Handles webhook delivery with retries (Node.js)
├── dashboard/          # User interface (Next.js + React)
├── cli/               # Command-line interface (Python)
└── shared/            # Common types and utilities
```

### Flow

1. **M-Pesa sends webhook** → `webhook-service` (permanent URL)
2. **Validate & queue** → Ensure it's real M-Pesa, store safely
3. **Environment routing** → Determine dev/staging/prod destination
4. **Reliable delivery** → `delivery-worker` handles retries & failures
5. **Monitor & observe** → `dashboard` shows real-time status

## 🛠️ Quick Start

### Prerequisites

- Node.js 18+
- Bun (for webhook service)

### Installation

```bash
# Clone the repository
git clone https://github.com/DarajaDevToolkit/darajadevToolkit.git
cd darajadevToolkit

# Install dependencies
npm install

# Start development services
npm run dev
```

### Services will be running on:

- **Webhook Service**: http://localhost:3001
- **Dashboard**: http://localhost:3000
- **Health Check**: http://localhost:3001/health

### CLI Installation (for developers):

```bash
cd cli
pip install -e .
daraja --help
```

## 📚 Usage

### Option A: CLI (Recommended for developers)

```bash
# Initialize and login
daraja init

# Configure environments
daraja config set-endpoint dev http://localhost:3000/webhook
daraja config set-endpoint prod https://yourapp.com/webhook

# Get your permanent URL for M-Pesa
daraja config get-url

# Test your setup
daraja test webhook --environment dev

# Monitor in real-time
daraja logs --tail
```

### Option B: Dashboard (Web interface)

### 1. Get Your Permanent URL

```
https://api.daraja-toolkit.com/webhook/your-user-id
```

### 2. Configure M-Pesa

Use your permanent URL in M-Pesa developer portal - never change it again!

### 3. Set Environment Routes

Configure where webhooks should be delivered:

```json
{
  "dev": "http://localhost:3000/mpesa/webhook",
  "staging": "https://staging.yourapp.com/mpesa/webhook",
  "production": "https://yourapp.com/mpesa/webhook"
}
```

### 4. Monitor & Debug

Real-time dashboard shows:

- Webhook delivery status
- Response times and success rates
- Detailed error logs
- Environment switching controls

## 🧪 Development

### Project Structure

```
daraja-developer-toolkit/
├── webhook-service/        # M-Pesa webhook receiver
│   ├── src/server.ts      # Main webhook server
│   └── package.json
├── delivery-worker/        # Async webhook delivery
│   ├── src/worker.ts      # Delivery logic with retries
│   └── package.json
├── dashboard/             # Next.js dashboard
│   ├── src/app/          # App router pages
│   └── package.json
├── shared/               # Common types & utilities
│   ├── src/types/        # TypeScript interfaces
│   ├── src/utils/        # Validation utilities
│   └── package.json
└── package.json          # Workspace root
```

### Available Scripts

```bash
npm run dev         # Start all services in development
npm run build       # Build all services
npm run build:shared # Build shared package only
npm run lint        # Lint all services
npm run clean       # Clean all build artifacts
```

### Testing Webhooks

```bash
# Test webhook endpoint
curl -X POST http://localhost:3001/test/your-user-id

# Health check
curl http://localhost:3001/health
```

## 🤝 Team & Contributing

We're a focused team of ~10 Kenyan developers building this in the open.

### Current Team Leads Needed

- **Backend** (Webhook proxy service) - _Available_
- **Frontend** (Dashboard) - _Available_
- **DevOps** (Infrastructure) - _Available_
- **CLI tooling** - _Available_

### Development Timeline

- **Week 1-2**: Architecture & team setup ✅
- **Week 3-4**: Core webhook service MVP
- **Week 5-6**: Dashboard & delivery worker
- **Week 7-8**: Integration testing & polish
- **Week 8+**: Public beta launch 🚀

### Contributing

1. Join our Discord server (link coming soon)
2. Check open issues for tasks
3. Fork, develop, test, PR
4. We review & merge quickly

<!-- ## 📄 License

MIT License - See [LICENSE](LICENSE) file -->

## 🙏 Acknowledgments

Built by developers who have felt the M-Pesa integration pain. Special thanks to the Kenyan fintech community for inspiration and feedback.

---

**Made with ❤️ in Kenya 🇰🇪**
