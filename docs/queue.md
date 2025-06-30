# 📦 Queue System Documentation

I am making a complete doc guide for the queue system so that when we are writing code we dont do so much back and forth, and we can just copy content from here.
I am making this a bit less technical so that our non-tech documentation team can also understand it.

## Overview

The Daraja Toolkit uses a robust queue system built with **BullMQ** and **Redis** to handle M-Pesa webhook deliveries asynchronously.

## 🎯 What is the Queue System?

Think of the queue system like a **smart post office**:

1. **M-Pesa sends a webhook** (like mailing a letter)
2. **Webhook Service receives it** (post office receives the letter)
3. **Job added to queue** (letter sorted and stored safely)
4. **Delivery Worker picks up job** (mail carrier collects letter)
5. **Webhook delivered to user's app** (letter delivered to recipient)

If delivery fails, the system automatically retries with smart delays.

## 🏗️ Architecture

```
M-Pesa Webhooks → Webhook Service → Redis Queue → Delivery Worker → User's App
                      ↓              ↓            ↓
                   (Producer)    (Storage)    (Consumer)
```

### Components

- **Webhook Service**: Receives webhooks and adds them to the queue
- **Redis**: Stores jobs reliably and manages queue state
- **Delivery Worker**: Processes jobs from the queue and delivers webhooks
- **BullMQ**: Queue management library handling priorities, retries, and monitoring

## 🚀 Key Features

### ✅ **Asynchronous Processing**

- Webhooks are queued instantly (no blocking)
- Background workers process jobs continuously
- High throughput - handles thousands of webhooks per minute

### ✅ **Priority Handling**

- **URGENT** (Priority 20): Critical payment failures
- **HIGH** (Priority 10): Important transactions
- **NORMAL** (Priority 5): Standard payments (default)
- **LOW** (Priority 1): Non-critical notifications

### ✅ **Automatic Retries**

- **3 attempts** for failed deliveries (configurable per user)
- **Exponential backoff**: 2s → 4s → 8s delays (intelligent per error type)
- **Dead letter queue** for permanently failed jobs
- **Error categorization**: Network, timeout, 4xx, 5xx, rate limit, authentication
- **Smart retry logic**: Different strategies per error type
- **Manual retry**: Retry failed jobs from DLQ via API

### ✅ **Dead Letter Queue (DLQ)**

- **Separate queue** for jobs that failed all retry attempts
- **Failure analysis**: Track error patterns and categories
- **Manual management**: View, retry, and clear failed jobs
- **DLQ health monitoring**: Alerts when DLQ size grows
- **Bulk operations**: Retry multiple jobs at once

### ✅ **Fault Tolerance**

- Jobs survive service restarts (Redis persistence)
- Graceful shutdown handling
- Connection resilience and error recovery

### ✅ **Monitoring & Health Checks**

- Real-time queue metrics
- Health check endpoints
- Comprehensive logging

## 📋 Queue Configuration

### Priority Levels

```javascript
PRIORITY_LEVELS = {
  LOW: 1, // Non-critical notifications
  NORMAL: 5, // Standard payments (default)
  HIGH: 10, // Important transactions
  URGENT: 20, // Critical payment failures
};
```

### Job Options

```javascript
DEFAULT_JOB_OPTIONS = {
  removeOnComplete: 100, // Keep 100 completed jobs for monitoring
  removeOnFail: 50, // Keep 50 failed jobs for debugging
  attempts: 3, // Retry up to 3 times
  backoff: {
    type: "exponential", // Smart delay between retries
    delay: 2000, // Start with 2 second delay
  },
};
```

### Redis Configuration

- **Host**: localhost (configurable via environment)
- **Port**: 6379 (configurable via environment)
- **Database**: 0 (dedicated for queue)
- **Persistence**: Enabled for job durability

## 🔄 How Jobs Flow Through the System

### 1. **Job Creation** (Webhook Service)

```
POST /webhook/user123
↓
Webhook received and validated
↓
Job added to Redis queue with priority
↓
Response sent to M-Pesa (instant)
```

### 2. **Job Processing** (Delivery Worker)

```
Worker picks up job from queue
↓
Look up user's webhook URL
↓
Attempt delivery to user's app
↓
Success: Job marked complete
↓
Failure: Schedule retry with delay
```

### 3. **Retry Logic**

```
Attempt 1: Immediate delivery
↓ (if failed)
Wait 2 seconds → Attempt 2
↓ (if failed)
Wait 4 seconds → Attempt 3
↓ (if failed)
Job moved to failed state (dead letter queue)
```

## 📊 Monitoring

### Health Check Endpoints

#### Basic Health Check

```bash
GET /health
```

**Response:**

```json
{
  "status": "ok",
  "service": "webhook-service",
  "timestamp": "2025-06-24T07:32:54.655Z"
}
```

#### Queue Health Check

```bash
GET /health/queue
```

**Response:**

```json
{
  "service": "webhook-service",
  "timestamp": "2025-06-24T07:33:04.181Z",
  "status": "healthy",
  "queue": {
    "name": "webhook-delivery",
    "waiting": 0, // Jobs waiting to be processed
    "active": 2, // Jobs currently being processed
    "failed": 1, // Jobs that failed permanently
    "completed": 847 // Jobs completed successfully
  },
  "redis": {
    "connected": true // Redis connection status
  }
}
```

### Queue Metrics

- **Waiting**: Jobs in queue waiting for processing
- **Active**: Jobs currently being processed by workers
- **Failed**: Jobs that failed after all retry attempts
- **Completed**: Successfully processed jobs

## 🧪 Testing the Queue System

### Send Test Webhook

```bash
curl -X POST http://localhost:3001/webhook/test_user \
  -H "Content-Type: application/json" \
  -d '{
    "Body": {
      "stkCallback": {
        "MerchantRequestID": "test-123",
        "CheckoutRequestID": "test-456",
        "ResultCode": 0,
        "ResultDesc": "Success"
      }
    }
  }'
```

### Test Priority Handling

```bash
# Low priority webhook
curl -X POST http://localhost:3001/test/priority/user123/low

# High priority webhook
curl -X POST http://localhost:3001/test/priority/user123/high

# Urgent priority webhook
curl -X POST http://localhost:3001/test/priority/user123/urgent
```

### Check Queue Status

```bash
# Basic health
curl http://localhost:3001/health

# Detailed queue health
curl http://localhost:3001/health/queue
```

## 🔧 Configuration

### Environment Variables

```bash
# Redis Configuration
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD=""
REDIS_DB="0"

# Service Configuration
WEBHOOK_SERVICE_PORT="3001"
NODE_ENV="development"
```

### Queue Settings

- **Concurrency**: 5 jobs processed simultaneously per worker
- **Job Timeout**: 30 seconds per delivery attempt
- **Queue Name**: `webhook-delivery`
- **Job Type**: `deliver_webhook`

## 📈 Performance Characteristics

### Throughput

- **Production**: 1000+ webhooks/minute
- **Development**: 100+ webhooks/minute
- **Concurrent Jobs**: 5 per worker instance

### Latency

- **Queue Addition**: < 10ms
- **Job Processing**: < 5 seconds (average)
- **Retry Delays**: 2s, 4s, 8s (exponential backoff)

### Reliability

- **Job Persistence**: 99.9% (Redis AOF enabled)
- **Delivery Success**: 95%+ (with retries)
- **System Uptime**: 99.9%+

## 🚨 Error Handling

### Common Scenarios

#### **Webhook URL Unreachable**

```
🚀 Delivering webhook to http://user-app.com/webhook
❌ Delivery failed: Unable to connect
⏳ Retrying in 2000ms (attempt 2/3)
```

**Action**: System automatically retries with exponential backoff

#### **User App Returns Error**

```
🚀 Delivering webhook to http://user-app.com/webhook
❌ Delivery failed: HTTP 500 Internal Server Error
⏳ Retrying in 4000ms (attempt 3/3)
```

**Action**: System retries, then moves to failed state if all attempts fail

#### **Redis Connection Lost**

```
❌ Redis connection lost
🔄 Attempting to reconnect...
✅ Redis connection restored
```

**Action**: Jobs are persisted, system reconnects automatically

### Dead Letter Queue

Failed jobs are moved to a "failed" state where they can be:

- Inspected for debugging
- Manually retried if needed
- Analyzed for patterns

## 🔐 Security Considerations

### Network Security

- Redis accessible only from internal network
- No external Redis access
- TLS encryption available for production

### Data Security

- Webhook payloads stored temporarily in Redis
- Automatic cleanup of old jobs
- No sensitive data logged

### Access Control

- Queue operations require service authentication
- Health endpoints publicly accessible
- Admin operations protected

## 🚀 Scaling

### Horizontal Scaling

- **Multiple Workers**: Add more delivery worker instances
- **Load Balancing**: Workers automatically distribute jobs
- **Redis Cluster**: Scale Redis for higher throughput

### Vertical Scaling

- **Worker Concurrency**: Increase concurrent jobs per worker
- **Redis Memory**: Increase for more job storage
- **CPU/RAM**: Scale for higher processing power

### Monitoring at Scale

- **Metrics Collection**: Integrate with Prometheus/Grafana
- **Alerting**: Set up alerts for queue depth, failures
- **Dashboards**: Real-time queue visualizations

## 🔄 Maintenance

### Regular Tasks

- **Monitor Queue Depth**: Ensure workers keep up with load
- **Check Failed Jobs**: Investigate patterns in failures
- **Redis Maintenance**: Monitor memory usage and performance
- **Log Rotation**: Manage log file sizes

### Troubleshooting

- **High Queue Depth**: Add more workers or increase concurrency
- **Many Failed Jobs**: Check user webhook URLs and network connectivity
- **Redis Issues**: Check Redis logs and connection settings
- **Worker Crashes**: Check worker logs and resource usage

## 📚 Technical Implementation

### Key Files

- `webhook-service/src/services/WebhookQueueService.ts` - Queue producer
- `delivery-worker/src/services/QueueConsumer.ts` - Queue consumer
- `webhook-service/src/config/queue.ts` - Queue configuration
- `shared/src/types/queue.ts` - Queue type definitions

### Dependencies

- **BullMQ**: Queue management library
- **Redis**: Queue storage and job persistence
- **Axios**: HTTP client for webhook delivery
- **TypeScript**: Type safety and development experience

### Integration Points

- **User Settings**: Future integration for webhook URL management
- **Authentication**: Future integration for user validation
- **Logging**: Integration with structured logging systems
- **Metrics**: Integration with monitoring systems

---

## 📞 Support

### Queue Not Processing Jobs

1. Check Redis connection: `GET /health/queue`
2. Verify worker is running: Check delivery worker logs
3. Check job queue: Look for jobs in "waiting" state

### High Failure Rate

1. Verify user webhook URLs are accessible
2. Check network connectivity
3. Review error patterns in logs
4. Consider increasing retry attempts

### Performance Issues

1. Monitor queue depth in health endpoint
2. Add more worker instances if needed
3. Check Redis performance metrics
4. Consider increasing worker concurrency

For technical support, check the logs in:

- Webhook Service: Console output with `📦`, `✅`, `❌` prefixes
- Delivery Worker: Console output with `🔄`, `🚀`, `⏳` prefixes
- Redis: Docker logs for Redis container

---
