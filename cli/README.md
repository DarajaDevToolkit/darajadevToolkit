# Daraja CLI

Command-line interface for the Daraja Developer Toolkit.

## Features

- 🔧 **Setup & Configuration** - Initialize and configure your Daraja webhooks
- 📊 **Monitoring** - Real-time webhook status and analytics
- 🧪 **Testing** - Send test webhooks and validate your endpoints
- 🔄 **Environment Management** - Switch between dev/staging/prod environments
- 📝 **Logs** - View detailed webhook delivery logs.

## Installation

### Option 1: Install from PyPI (when released)

```bash
pip install daraja-cli
```

### Option 2: Install from source (development)

```bash
git clone https://github.com/daraja-toolkit/daraja-developer-toolkit.git
cd daraja-developer-toolkit/cli
pip install -e .
```

## Quick Start

### 1. Initialize your project

```bash
daraja init
```

### 2. Configure your webhook endpoints

```bash
daraja config set-endpoint dev http://localhost:3000/webhook
daraja config set-endpoint prod https://yourapp.com/webhook
```

### 3. Test your webhook

```bash
daraja test webhook --environment dev
```

### 4. Monitor webhook status

```bash
daraja status
daraja logs --tail
```

## Commands

### Setup Commands

```bash
daraja init                    # Initialize Daraja in current project
daraja login                   # Login to your Daraja account
daraja logout                  # Logout from Daraja
```

### Configuration Commands

```bash
daraja config list             # Show current configuration
daraja config set-endpoint ENV URL  # Set webhook endpoint for environment
daraja config get-url          # Get your permanent webhook URL
```

### Testing Commands

```bash
daraja test webhook            # Send test webhook
daraja test endpoint URL       # Test if endpoint is reachable
daraja validate config         # Validate your configuration
```

### Monitoring Commands

```bash
daraja status                  # Show webhook status summary
daraja logs                    # Show recent webhook logs
daraja logs --tail             # Follow logs in real-time
daraja metrics                 # Show detailed metrics
```

### Environment Commands

```bash
daraja env list                # List all environments
daraja env switch ENV          # Switch active environment
daraja env status              # Show current environment status
```

## Configuration

The CLI stores configuration in `~/.daraja/config.json`:

```json
{
  "api_key": "your-api-key",
  "api_url": "https://api.daraja-toolkit.com",
  "user_id": "your-user-id",
  "current_environment": "dev",
  "endpoints": {
    "dev": "http://localhost:3000/webhook",
    "staging": "https://staging.yourapp.com/webhook",
    "production": "https://yourapp.com/webhook"
  }
}
```

## Development

### Setup development environment

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -e ".[dev]"
```

### Run tests

```bash
pytest
```

### Code formatting

```bash
black src/
flake8 src/
mypy src/
```

## Examples

### Complete workflow

```bash
# Initialize new project
daraja init

# Set up environments
daraja config set-endpoint dev http://localhost:3000/webhook
daraja config set-endpoint prod https://api.yourapp.com/webhook

# Get your permanent URL for M-Pesa configuration
daraja config get-url

# Test your development endpoint
daraja test webhook --environment dev

# Monitor webhook activity
daraja logs --tail

# Switch to production when ready
daraja env switch prod
```
