# 🏗️ Daraja Developer Toolkit - Architecture Guide

> **"It's simpler than it looks!"** - A developer-friendly guide to understanding our M-Pesa webhook solution

---

## 🤔 "What Problem Are We Actually Solving?"

Every Kenyan developer integrating M-Pesa has experienced this pain:

```
You: "Please send webhooks to https://myapp.com/webhook"
M-Pesa: "Sure!" 📤
*Your server goes down for 2 minutes*
M-Pesa: "No response? Webhook lost forever!" 🗑️
You: "Wait, what?! Where's my payment data?!" 😱
```

**Our solution:** Put a bulletproof proxy between M-Pesa and your app that never loses webhooks and routes them intelligently.

---

## 🎯 "What Does Our Solution Actually Do?"

### The Magic Flow:

```
M-Pesa → [OUR permanent URL] → [Smart Processing] → [YOUR app]
         ↑                                        ↑
   Never changes                            Can be localhost, staging, prod (yes!)
```

### What Developers Get:

1. **One permanent URL** - Set with M-Pesa once, never change again
2. **Environment switching** - Route to dev/staging/prod with a click
3. **Never lose webhooks** - We queue, retry, and track everything
4. **Full visibility** - See what's happening in real-time
5. **Easy integration** - Simple SDK: `npm install @daraja-toolkit/sdk`

---

## 🏠 "How Is This Project Organized?"

Just like most youtube tutorials, I will use the analogy of city (since its a webhook proxy anyway)

Think of this like Nairobi, with each service being a different part of the city:

```
daraja-developer-toolkit/
├── 🏪 webhook-service/      # The "Post Office" - receives all M-Pesa mail
├── 🚚 delivery-worker/      # The "Delivery Service" - ensures packages reach you
├── 🏢 dashboard/           # The "Control Center" - where you manage everything
├── 🔧 cli/                 # The "Developer Toolkit" - command-line superpowers
├── 📚 shared/              # The "Library" - common code everyone uses
└── 📦 packages/ (future)   # The "SDK Store" - easy integration packages(we will start with npm and pip)
```

### Why This Structure?

- **Each service has one job** - easier to understand and maintain
- **Teams can work independently** - frontend team doesn't block backend team
- **Easy to scale** - need more webhook processing? Scale just that service (that has been the idea all along), because what if we have 1000 webhooks per second? We can scale the webhook service independently of the dashboard or CLI.
- **Clear boundaries** - you know exactly where to look for specific functionality

---

## 🎮 "How Do All These Pieces Work Together?"

- At this point I am hoping you have a good understanding of webhooks generally, and how Mpesa webhooks work, so I will not go into too much detail about the flow of the webhook, but rather how the different services interact with each other.

### The Journey of a Webhook (Step by Step):

#### 1. 📨 M-Pesa Sends Webhook

```
POST https://api.daraja-toolkit.com/webhook/user123
{
  "Body": {
    "stkCallback": {
      "ResultCode": 0,
      "Amount": 1000,
      // ... M-Pesa data
    }
  }
}
```

#### 2. 🏪 Webhook Service (The Bouncer)

- (Dont freak out) Bouncer is a just a fancy name for the webhook service, which is the first point of contact for the webhook.

```typescript
// webhook-service/src/server.ts
app.post("/webhook/:userId", async (req, res) => {
  // ✅ Validate: "Is this really from M-Pesa?"
  // ✅ Respond quickly: "Got it!" (within 30 seconds) - Looking at the docs I noticed we should respond within 30 seconds, so we will do that)
  // ✅ Queue safely: "Store this so we don't lose it"

  res.json({ ResultCode: 0, ResultDesc: "Success" });
});
```

- That above is how mpesa expects us to respond.

#### 3. 🚚 Delivery Worker (The Persistent Deliverer)

```typescript
// delivery-worker/src/worker.ts
async function deliverWebhook(webhook) {
  // 🎯 Look up: "Where should this go? Dev? Prod?"
  // 🔄 Try delivery: "Sending to user's endpoint..."
  // 💪 Retry if failed: "Didn't work? Try again!"
  // 📊 Track everything: "Log success/failure"
}
```

#### 4. 🏢 Dashboard (The Control Center) - Or Observability you get the point?

```tsx
// dashboard/src/app/status/page.tsx
function StatusPage() {
  // 📊 Show: "1,247 webhooks processed, 98.5% success rate"
  // 🔄 Control: "Switch from dev to prod environment"
  // 👀 Monitor: "Real-time webhook activity"
}
```

#### 5. 🔧 CLI (The Developer's Best Friend) - Well of coz! We all work in the terminal

```bash
# Quick webhook testing
daraja test webhook --environment dev

# Real-time monitoring
daraja logs --tail

# Environment switching
daraja env switch production
```

---

## 🤝 "Which Team Should I Join?"

### 🔧 Backend Team (We are using Node js)

**What you'll build:**

- Webhook receiving and validation
- Queue systems and retry logic
- Database design and APIs
- Performance and reliability

**Tech stack:**

- **Webhook Service**: Bun + Hono (super fast JavaScript runtime)
- **Delivery Worker**: Node.js + TypeScript
- **Database**: PostgreSQL + Redis (Or we may entirely use postgres for everything, but we will see)
- **Deploy**: Docker + cloud services

**Perfect if you:**

- Love building reliable, high-performance systems
- Enjoy solving concurrency and scaling challenges
- Want to master webhook architecture
- Like working with modern JavaScript/TypeScript

### 🎨 Frontend Team (React/Next)

**What you'll build:**

- Beautiful, intuitive dashboard
- Real-time webhook monitoring
- User onboarding and management
- Developer documentation sites

**Tech stack:**

- **Framework**: Next.js 15
- **Styling**: Tailwind CSS
- **Components**: React + TypeScript
- **Real-time**: WebSockets for live updates

**Perfect if you:**

- Love creating beautiful, user-friendly interfaces
- Enjoy React/Next.js development
- Want to design developer-focused UX
- Like seeing immediate visual results

### 🐍 CLI Team

**What you'll build:**

- Command-line interface for developers
- Developer workflow automation
- Testing and validation tools
- Local development helpers

**Tech stack:**

- **Language**: Python 3.8+ (accessible to everyone)
- **CLI Framework**: Click (modern, powerful)
- **Output**: Rich (beautiful terminal formatting)
- **API**: Requests + error handling

**Perfect if you:**

- Love making developers' lives easier 😅
- Enjoy Python development
- Want to build tools that developers use daily
- Like focusing on developer experience

### 📦 SDK Team - Still A grey area

**What you'll build:**

- JavaScript/TypeScript SDK packages
- Framework integrations (Express, Next.js, etc.)
- Developer documentation and examples
- Multi-language SDKs (Python, Go, PHP)

**Tech stack:**

- **Core**: TypeScript for type safety
- **Publishing**: npm packages
- **Testing**: Jest + integration tests
- **Docs**: Documentation sites

**Perfect if you:**

- Love making complex things simple
- Enjoy library/package development
- Want to impact thousands of developers
- Like writing great documentation

---

## 🚀 "How Do I Get Started Contributing?"

- Read CONTRIBUTING.md for our contribution guidelines, but here's a quick start guide to get you up and running:

### Step 1: Set Up Your Development Environment

```bash
# Clone the repository
git clone https://github.com/daraja-toolkit/daraja-developer-toolkit.git
cd daraja-developer-toolkit

# Install dependencies (this handles all services)
npm install

# Start development services
npm run dev
```

That's it! You now have:

- ✅ Webhook service running on http://localhost:3001
- ✅ Dashboard running on http://localhost:3000
- ✅ CLI ready to use: `cd cli && daraja --help`

### Step 2: Pick Your Service and Dive In

```bash
# Backend developers
cd webhook-service
# Look at: src/server.ts (main webhook handler)

# Frontend developers
cd dashboard
# Look at: src/app/page.tsx (landing page)

# CLI developers
cd cli
# Look at: src/daraja_cli/main.py (main CLI entry)
```

### Step 3: Make Your First Contribution

1. **Find an issue** labeled "good first issue"
2. **Read the code** in your chosen service
3. **Make a small change** (fix a bug, add a feature)
4. **Test it works** using our development setup
5. **Submit a PR** - we review quickly!

---

## 🤓 "What Technologies Should I Know?"

### Core Technologies (You'll Need These)

- **Git/GitHub** - Version control and collaboration
- **Docker** - For databases and local development
- **REST APIs** - How services communicate
- **JSON** - Data format for everything
- **Environment Variables** - Configuration management

### By Team:

#### Backend Team:

- **JavaScript/TypeScript** - Main development language
- **Node.js/Bun** - Runtime environments
- **PostgreSQL** - Primary database
- **Redis** - Queue and caching
- **HTTP/Webhooks** - Core communication protocol

#### Frontend Team:

- **React** - UI framework
- **Next.js** - Full-stack React framework
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first styling
- **WebSockets** - Real-time updates

#### CLI Team:

- **Python 3.8+** - Main development language
- **Click** - CLI framework
- **Requests** - HTTP client
- **Rich** - Terminal formatting
- **JSON** - Configuration and API data

### Don't Know Something? No Problem!

- **We have mentors** in each team to help you learn, just ask a question in our Discord channel.
- **Start small** - you don't need to know everything
- **Learn as you go** - best way to learn is by doing
- **Ask questions** - we love helping team members grow

---

## 📊 "How Do We Handle Data?"

- I'll try to simplify this as much as possible.

### Database Design (Simple but Powerful)

#### Users Table

```sql
-- Who's using our service
users (
  id          UUID PRIMARY KEY,
  email       VARCHAR NOT NULL,
  name        VARCHAR NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW()
)
```

#### Webhooks Table

```sql
-- Every webhook we receive
webhooks (
  id           UUID PRIMARY KEY,
  user_id      UUID REFERENCES users(id),
  payload      JSONB,              -- Raw M-Pesa data
  event_type   VARCHAR,            -- 'stk_push', 'c2b', etc.
  received_at  TIMESTAMP DEFAULT NOW()
)
```

#### Delivery Attempts Table

```sql
-- Every delivery attempt we make
delivery_attempts (
  id            UUID PRIMARY KEY,
  webhook_id    UUID REFERENCES webhooks(id),
  target_url    VARCHAR,
  status        VARCHAR,           -- 'delivered', 'failed', 'retrying'
  response_code INTEGER,
  attempted_at  TIMESTAMP DEFAULT NOW()
)
```

### Why This Design?

- **Simple**: Easy to understand and query
- **Scalable**: Can handle millions of webhooks
- **Debuggable**: Full audit trail of what happened
- **Fast**: Proper indexes for quick lookups
- Plus hakuna vitu mingi and all that.

---

## 🔧 "How Do We Deploy and Run This?"

### Development (Your Laptop)

```bash
npm run dev  # Starts everything locally
```

### Production (The Cloud)

```bash
# Each service runs independently
docker run webhook-service
docker run delivery-worker
docker run dashboard
```

### Why Microservices?

- **Independent scaling**: Scale webhook processing without affecting dashboard
- **Independent deployment**: Update CLI without touching backend
- **Team autonomy**: Teams can deploy their services independently
- **Fault isolation**: If dashboard crashes, webhooks still work

---

## 🔒 "How Do We Handle Security?"

### M-Pesa Webhook Validation

- I have looked at the daraja docs and its unclear how many ip ranges M-Pesa uses, so we will use a multi-layered approach to security just to be safe.

```typescript
// Multi-layer security approach
function validateWebhook(req) {
  // Layer 1: IP validation (is it from M-Pesa servers?)
  // Layer 2: Payload structure (does it look like M-Pesa data?)
  // Layer 3: Rate limiting (prevent spam/abuse) - yeah obviously we will limit the number of requests from a single IP because we don't want to be DDoS'd by M-Pesa
  // Layer 4: User authentication (is this user valid?)
}
```

### User Authentication

- **API Keys**: For programmatic access (CLI, SDK)
- **Session tokens**: For dashboard access
- **Environment isolation**: Dev webhooks can't access prod data

### Data Protection

- **Encryption**: Sensitive data encrypted at rest
- **Audit logs**: Track who did what when
- **Rate limiting**: Prevent abuse and DoS attacks

---

## 🧪 "How Do We Test Everything?"

### Testing Strategy by Service:

#### Webhook Service Testing

```typescript
// Unit tests: Individual functions
test("validates M-Pesa STK payload", () => {
  expect(validateSTKPayload(validPayload)).toBe(true);
});

// Integration tests: Full webhook flow
test("processes webhook end-to-end", async () => {
  const response = await sendWebhook(mockPayload);
  expect(response.status).toBe(200);
});
```

#### Dashboard Testing

- Naah we dont need dashboard tests, I myself have never seen a dashboard test, but if you want to write them, be my guest.

#### CLI Testing

```python
# Command tests: CLI commands
def test_login_command():
    result = runner.invoke(cli, ['login', '--email', 'test@example.com'])
    assert result.exit_code == 0

# Integration tests: API communication
def test_webhook_status():
    api = DarajaAPI(test_config)
    status = api.get_webhook_status()
    assert 'total_webhooks' in status
```

---

## 📈 "How Will This Scale?"

### Current Capacity (Single Server)

- **~1,000 webhooks/second** - More than enough for beta (we are not Facebook)
- **~10,000 users** - Covers most Kenyan fintech startups
- **~100GB storage** - Years of webhook history (we prolly might never reach this, but we will see)

### Future Scaling (When We're Successful)

```
Load Balancer
├── Webhook Service (3 instances)
├── Delivery Worker (5 instances)
└── Dashboard (2 instances)

Database Cluster
├── Primary PostgreSQL (writes)
├── Read Replicas (reads)
└── Redis Cluster (queues)
```

### Why We're Not Over-Engineering Now

- **YAGNI Principle**: "You Ain't Gonna Need It" (yet)
- **Solve real problems first**: Get webhooks working reliably
- **Scale when needed**: Better to have real usage data
- **Premature optimization**: Often hurts more than helps

---

## 🔄 "How Do We Handle Errors?"

### Error Handling Philosophy: "Fail Gracefully, Recover Quickly"

#### Webhook Processing Errors

```typescript
try {
  await deliverWebhook(webhook)
} catch (NetworkError) {
  // Retry with exponential backoff (fancy term for waiting longer each time, eg 1s, 2s, 4s, 8s)
  await scheduleRetry(webhook, delay)
} catch (TimeoutError) {
  // User endpoint too slow - circuit break (of course we will not keep retrying forever)
  await circuitBreak(webhook.userId)
} catch (ValidationError) {
  // Log and alert - might be M-Pesa format change (we will handle this later)
  await alertTeam(error)
}
```

#### User-Facing Errors

- **Dashboard**: Friendly error messages with next steps
- **CLI**: Helpful suggestions and troubleshooting tips
- **SDK**: Clear error types with documentation links

#### Monitoring and Alerts

- **Real-time dashboards**: See errors as they happen
- **Smart alerting**: Only alert on actionable issues
- **Error aggregation**: Group similar errors for easier debugging

---

## 🎓 "Learning Resources for New Contributors"

### Quick Learning Paths:

#### New to Webhooks?

1. **Practice**: Set up a simple Express server that receives webhooks
2. **Understand**: Why webhooks are better than polling

#### New to M-Pesa Development?

1. **Read**: [M-Pesa API Documentation](https://developer.safaricom.co.ke)
2. **Understand**: STK Push vs C2B vs B2C flows
3. **Practice**: Set up M-Pesa sandbox account

---

## 🤝 "How Do We Work Together?"

### Development Workflow

1. **Pick an issue** from GitHub (or create one)
2. **Create a branch** with descriptive name
3. **Write code** following our style guides
4. **Test locally** using our development setup
5. **Submit PR** with clear description
6. **Code review** by team members
7. **Merge and deploy** after approval

### Communication

- **Discord**: Daily chat and quick questions
- **GitHub Issues**: Bug reports and feature requests
- **Weekly sync**: Progress updates and blockers
- **Documentation**: Always update docs when adding features

### Code Style

- **Consistent formatting**: We use automated tools (Prettier)
- **Clear naming**: Functions and variables should be self-documenting
- **Small commits**: Easy to review and understand
- **Good tests**: Write tests for new functionality

---

## 🎯 "What Makes This Project Special?"

### For Contributors:

- **Real impact**: Solving actual pain points for Kenyan developers
- **Modern tech**: Latest tools and best practices
- **Great mentorship**: Learn from experienced developers
- **Portfolio project**: Something impressive to show employers
- **Team experience**: Work in a real software team

### For Users:

- **Solves real problems**: Never lose M-Pesa webhooks again
- **Easy to use**: Simple SDK integration
- **Reliable**: Built for production use
- **Kenyan-made**: By developers who understand the local context

### For the Ecosystem:

- **Open source**: Free for everyone to use and contribute
- **Standards-setting**: How webhook infrastructure should be done
- **Community building**: Bringing Kenyan developers together
- **Knowledge sharing**: Learning and growing together

---

## ❓ "Common Questions & Answers"

### Q: "This seems complex. Where should I start?"

**A:** Start with the component that matches your skills:

- Know JavaScript? → `webhook-service` or `dashboard`
- Know Python? → `cli`
- New to everything? → Pick up any "good first issue"

### Q: "What if I break something?"

**A:** You won't break production! We have:

- Separate development environment
- Code review process
- Automated tests
- Rollback capabilities

### Q: "Do I need to know M-Pesa integration?"

**A:** Helpful but not required. We have(or will be having):

- Documentation explaining M-Pesa concepts
- Mock data for testing
- Team members who can explain things

### Q: "How much time commitment is expected?"

**A:** Flexible! You can contribute:

- A few hours per week (evenings/weekends)
- Full-time (if you have the time)
- Sporadically (when you can)

### Q: "Will this help my career?"

**A:** Absolutely! You'll gain:

- Experience with modern tech stacks
- Real-world project experience
- Team collaboration skills
- Open source contributions for your resume

### Q: "What if I have an idea for a new feature?"

**A:** Great! We love new ideas:

1. Create a GitHub issue describing the idea
2. Discuss with the team
3. Get approval before starting work
4. Build it with team support

---

## 🚀 "Ready to Get Started?"

### Your Next Steps:

1. **Join our Discord** (link in README)
2. **Set up development environment** (follow Quick Start)
3. **Pick a team** based on your interests
4. **Grab your first issue** (look for "good first issue" label)
5. **Ask questions** - we're here to help!

### Remember:

- **Start small** - even fixing typos is valuable contribution
- **Ask questions** - no question is too basic
- **Learn as you go** - perfect opportunity to grow skills
- **Have fun** - we're building something amazing together!

---

**Welcome to the Daraja Developer Toolkit team! Let's make M-Pesa development actually enjoyable! 🇰🇪✨**
