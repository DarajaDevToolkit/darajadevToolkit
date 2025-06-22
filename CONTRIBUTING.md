# Contributing to Daraja Developer Toolkit

Thanks for your interest in contributing! This guide will help you get started.

## 🎯 Development Setup

### Prerequisites

- Node.js 18+
- Bun (for webhook service)
- Docker & Docker Compose (for local services)

### Quick Start

```bash
# 1. Clone and install
git clone https://github.com/DarajaDevToolkit/darajadevToolkit.git
cd darajadevToolkit
npm install

# 2. Start local services (Redis & PostgreSQL)
docker compose up -d

# 3. Copy environment variables
cp .env.example .env

# 4. Start development servers
npm run dev
```

### Optional Dev setup scripts

```bash
# Run dev.sh script to set up your development environment
./dev.sh setup

# Make sure to have the necessary permissions to execute the script
chmod +x dev.sh

# Available commands:
  setup   - Install all dependencies and set up the project
  start   - Start all development services
  stop    - Stop all development services
  status  - Check status of all services
  test    - Test that everything is working
  clean   - Clean all build artifacts and dependencies

```

## 🏗️ Architecture Overview

### Services

- **webhook-service/** - Receives M-Pesa webhooks (Bun + Hono)
- **delivery-worker/** - Handles webhook delivery with retries (Node.js)
- **dashboard/** - User interface (Next.js + React)
- **shared/** - Common types and utilities (TypeScript)

### Key Technologies

- **Bun** - Fast webhook service runtime
- **Next.js** - Modern React framework
- **TypeScript** - Type safety across all services
- **Redis** - Queue management
- **PostgreSQL** - Data persistence

## 📋 Team Roles & Responsibilities

### Available Lead Positions

- **Backend Lead** (webhook-service + delivery-worker)
- **Frontend Lead** (dashboard)
- **DevOps Lead** (infrastructure + deployment)
- **CLI Lead** (developer tooling)

### Responsibilities

- **Leads**: Architecture decisions, code review, team coordination
- **Contributors**: Feature development, bug fixes, testing
- **Reviewers**: Code quality, documentation, testing

## 🛠️ Development Workflow

### 1. Pick a Task

- Check GitHub Issues for available tasks
- Comment on issue to claim it
- Ask questions if anything is unclear

### 2. Development

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make your changes
# Test your changes
npm run dev # Test locally

# Commit with clear messages
git commit -m "feat: add webhook validation middleware"
```

### 3. Submit PR

- Push to your fork
- Create Pull Request with clear description
- Link to relevant issue
- Add screenshots if UI changes

## 🧪 Testing

### Manual Testing

```bash
# Test webhook endpoint
curl -X POST http://localhost:3001/test/user123

# Health check
curl http://localhost:3001/health

# Test dashboard
open http://localhost:3000
```

### Future: Automated Testing

- Unit tests for shared utilities
- Integration tests for webhook flow
- E2E tests for dashboard

## 📝 Code Standards

### TypeScript

- Use strict mode
- Export types from `shared/` package
- Prefer interfaces over types
- Use meaningful variable names

### Commit Messages

```
feat: add new feature
fix: bug fix
docs: documentation changes
style: formatting, missing semi colons, etc
refactor: code refactoring
test: adding tests
chore: updating build tasks, package manager configs, etc
```

### File Structure

```
service-name/
├── src/
│   ├── types/      # Local type definitions
│   ├── utils/      # Utility functions
│   ├── handlers/   # Route handlers/business logic
│   └── index.ts    # Entry point
├── package.json
└── README.md
```

## 🚀 Deployment

### Development

- Services run locally on different ports
- Docker Compose for dependencies
- Hot reload enabled

### Staging (Coming Soon)

- Deployed on Railway/Vercel
- Staging database
- Real M-Pesa sandbox testing

### Production (Coming Soon)

- Production-ready infrastructure
- Monitoring & alerting
- Real M-Pesa integration

## 🤝 Communication

### Discord Server

- #general - General discussion
- #backend - Webhook service & delivery worker
- #frontend - Dashboard development
- #devops - Infrastructure & deployment
- #daily-updates - Daily progress updates

### GitHub

- Use issues for bugs and feature requests
- Use discussions for architectural questions
- Tag relevant team leads in PRs

## 📚 Resources

### M-Pesa Documentation

- [Safaricom Developer Portal](https://developer.safaricom.co.ke/)
- [M-Pesa Express API](https://developer.safaricom.co.ke/APIs/MpesaExpressAPI)

### Technical Docs

- [Bun Documentation](https://bun.sh/docs)
- [Hono Framework](https://hono.dev/)
- [Next.js 15](https://nextjs.org/docs)

## ❓ Questions?

- Ask in Discord #general channel
- Create GitHub Discussion

Let's build something amazing together! 🇰🇪
