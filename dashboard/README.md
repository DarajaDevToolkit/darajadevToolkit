# 🎛️ Daraja Developer Toolkit - Dashboard

> **The control center for your M-Pesa webhook infrastructure** - Monitor, manage, and debug your webhook flows with real-time insights.

[![Next.js](https://img.shields.io/badge/Next.js-15.1-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green)](../LICENSE)

## 🚀 What is This?

The Dashboard is the web interface for the Daraja Developer Toolkit - a bulletproof M-Pesa webhook proxy that ensures you never lose payment notifications again. This frontend provides:

- **Real-time webhook monitoring** - See every webhook as it flows through the system
- **Environment management** - Switch between dev, staging, and production with a click
- **Delivery analytics** - Track success rates, response times, and failure patterns
- **Debug tools** - Inspect webhook payloads, retry failed deliveries, and troubleshoot issues
- **Configuration dashboard** - Manage your permanent URLs and endpoint routing.

## ⚡ Quick Start

### Prerequisites 

- Node.js 18+ (we recommend using [fnm](https://github.com/Schniz/fnm) or [nvm](https://github.com/nvm-sh/nvm))
- Basic knowledge of React/Next.js
- Understanding of webhooks and M-Pesa integration

### 1. Clone & Install

```bash
# Clone the entire Daraja toolkit
git clone https://github.com/DarajaDevToolkit/darajadevToolkit.git
cd darajadevToolkit

# Install all dependencies (installs shared packages too)
npm install

# Navigate to dashboard
cd dashboard
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env.local

# Edit with your configuration
# NEXT_PUBLIC_API_URL=http://localhost:3001  # Webhook service URL
# NEXT_PUBLIC_WS_URL=ws://localhost:3001     # WebSocket for real-time updates
```

### 3. Start Development

```bash
# From the dashboard directory
npm run dev

# Or from the root directory (starts all services)
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the dashboard.

## 🏗️ Architecture & Folder Structure

```
dashboard/
├── public/                     # Static assets
│   └── assets/
│       └── logo.svg
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── layout.tsx         # Root layout with providers
│   │   ├── page.tsx           # Landing page
│   │   ├── dashboard/         # Main dashboard routes
│   │   │   ├── page.tsx       # Dashboard overview
│   │   │   ├── webhooks/      # Webhook monitoring
│   │   │   ├── environments/  # Environment management  
│   │   │   ├── analytics/     # Performance analytics
│   │   │   └── settings/      # Configuration
│   │   └── globals.css        # Global styles
│   ├── components/            # Reusable UI components
│   │   ├── ui/                # Atomic design system components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── badge.tsx
│   │   │   └── ...
│   │   ├── layout/            # Layout components
│   │   │   ├── sidebar.tsx
│   │   │   ├── header.tsx
│   │   │   └── navigation.tsx
│   │   └── features/          # Feature-specific components
│   │       ├── webhook-monitor/
│   │       ├── environment-switcher/
│   │       └── analytics-dashboard/
│   ├── lib/                   # Utilities and configuration
│   │   ├── api.ts             # API client setup
│   │   ├── websocket.ts       # Real-time connection
│   │   ├── utils.ts           # Helper functions
│   │   └── constants.ts       # App constants
│   ├── hooks/                 # Custom React hooks
│   │   ├── useWebhooks.ts     # Webhook data management
│   │   ├── useRealtime.ts     # WebSocket connection
│   │   └── useEnvironments.ts # Environment switching
│   ├── context/               # React Context providers
│   │   ├── auth-context.tsx   # Authentication state
│   │   ├── theme-context.tsx  # Dark/light mode
│   │   └── webhook-context.tsx # Global webhook state
│   ├── types/                 # TypeScript definitions
│   │   ├── webhook.ts         # Webhook-related types
│   │   ├── environment.ts     # Environment types
│   │   └── api.ts             # API response types
│   └── styles/                # Styling
│       └── globals.css        # Global CSS + Tailwind imports
├── package.json               # Dependencies and scripts
├── next.config.ts             # Next.js configuration
├── tailwind.config.ts         # Tailwind CSS setup
├── tsconfig.json              # TypeScript configuration
└── README.md                  # You are here!
```

### Design Principles

- **Component-driven development** - Atomic design with reusable UI components
- **Type-safe everywhere** - Full TypeScript coverage with strict mode
- **Real-time first** - WebSocket integration for live webhook monitoring
- **Mobile-responsive** - Works seamlessly on all device sizes
- **Performance optimized** - Code splitting, lazy loading, and efficient re-renders

## 🛠️ Tech Stack

### Core Framework
- **[Next.js 15](https://nextjs.org/)** - React framework with App Router
- **[React 19](https://react.dev/)** - UI library with latest features
- **[TypeScript 5](https://www.typescriptlang.org/)** - Type safety and developer experience

### Styling & UI
- **[Tailwind CSS 3.4](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Lucide React](https://lucide.dev/)** - Beautiful, consistent icons
- **[Radix UI](https://www.radix-ui.com/)** - Accessible, unstyled UI primitives (planned)

### State Management & Data
- **React Context** - Global state management
- **Custom hooks** - Encapsulated business logic
- **WebSocket** - Real-time webhook notifications
- **REST API** - Communication with webhook service

### Developer Experience
- **ESLint** - Code linting and formatting
- **Prettier** - Code formatting (when added)
- **TypeScript strict mode** - Maximum type safety
- **Hot reload** - Instant development feedback

## 📱 Key Features

### 🔍 Real-time Webhook Monitor
- Live feed of incoming M-Pesa webhooks
- Color-coded status indicators (success/failed/pending)
- Webhook payload inspection and formatting
- Search and filter capabilities

### 🌍 Environment Management
- Visual environment switcher (dev/staging/production)
- Quick endpoint configuration
- Environment-specific analytics
- One-click routing changes

### 📊 Analytics Dashboard
- Success/failure rates over time
- Response time monitoring  
- Volume analytics and trends
- Error pattern detection

### 🔧 Configuration Hub
- Permanent URL management
- API key generation and rotation
- Webhook retry configuration
- Notification preferences

## 🧪 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler check
```

### Local Development with Full Stack

```bash
# From project root - starts all services
npm run dev

# Services will be available at:
# - Dashboard: http://localhost:3000
# - Webhook Service: http://localhost:3001  
# - WebSocket: ws://localhost:3001/ws
```

### Environment Variables

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_POSTHOG_KEY=your-posthog-key # Optional analytics
```

### Testing Webhook Flow

```bash
# Test webhook reception (from another terminal)
curl -X POST http://localhost:3001/webhook/test-user-id \
  -H "Content-Type: application/json" \
  -d '{"TransactionType":"Pay Bill","TransID":"ABC123","Amount":"100"}'
```

## 🤝 Contributing

We welcome contributions! This dashboard is part of a larger open-source effort to improve M-Pesa development in Kenya.

### Development Workflow

1. **Pick a task** - Check [GitHub Issues](https://github.com/DarajaDevToolkit/darajadevToolkit/issues) for `dashboard` or `frontend` labels
2. **Fork & branch** - Create a feature branch from `main`
3. **Develop** - Follow our coding standards and use TypeScript
4. **Test** - Ensure your changes work with the full stack
5. **Pull request** - Submit with clear description and screenshots

### Code Standards

- **TypeScript strict mode** - No `any` types, proper interfaces
- **Component patterns** - Functional components with hooks
- **Naming conventions** - PascalCase for components, camelCase for functions
- **File organization** - Feature-based folder structure
- **Commit messages** - Follow [Conventional Commits](https://www.conventionalcommits.org/)

```bash
# Examples
feat(dashboard): add real-time webhook status indicators
fix(webhooks): resolve payload parsing edge case  
docs(readme): update installation instructions
```

### Getting Help

- **Discord** - Join our community server (link in main README)
- **GitHub Discussions** - Ask architectural questions
- **Issues** - Report bugs or request features
- **Mentoring** - Frontend team leads available for guidance

## 🚀 Deployment

###  TBC!!

```bash
# Connect to Vercel (Sample not the agreed)
npx vercel

# Deploy
npx vercel --prod
```

### Self-hosted

```bash
# Build for production
npm run build

# Start production server
npm start
```

### Environment Configuration

Ensure these environment variables are set in production:

```bash
NEXT_PUBLIC_API_URL=https://api.your-domain.com
NEXT_PUBLIC_WS_URL=wss://api.your-domain.com
NEXT_PUBLIC_APP_ENV=production
```

## 📖 Related Documentation

- **[Main Project README](../README.md)** - Overall project overview
- **[Architecture Guide](../ARCHITECTURE-GUIDE.md)** - System design and data flow
- **[Contributing Guide](../CONTRIBUTING.md)** - Contribution workflow
- **[Webhook Service](../webhook-service/README.md)** - Backend API documentation

## 🤔 Questions or Issues?

- **Bug reports** - [Create an issue](https://github.com/DarajaDevToolkit/darajadevToolkit/issues/new)
- **Feature requests** - [Start a discussion](https://github.com/DarajaDevToolkit/darajadevToolkit/discussions)
- **General help** - Join our Discord community
- **Security concerns** - Email security@daraja-toolkit.com (LOL!)
- **Technical support** - Email support@daraja-toolkit.com

---

**Built with ❤️ by Kenyan developers, for Kenyan developers.** 🇰🇪

*Making M-Pesa development actually enjoyable, one webhook at a time.*