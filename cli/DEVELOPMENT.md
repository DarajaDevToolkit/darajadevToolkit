# CLI Development Setup Guide

## 🐍 Python CLI for Daraja Developer Toolkit

## 📁 Structure Overview

```
cli/
├── pyproject.toml          # Modern Python packaging config
├── README.md              # CLI-specific documentation
├── test_cli.py           # Basic functionality test
└── src/
    └── daraja_cli/
        ├── __init__.py           # Package initialization
        ├── main.py              # Main CLI entry point
        ├── commands/            # Command modules
        │   ├── __init__.py
        │   ├── auth.py         # Login/logout commands
        │   ├── config.py       # Configuration management
        │   ├── test.py         # Testing commands
        │   ├── monitor.py      # Monitoring/logs
        │   └── env.py          # Environment management
        └── utils/              # Utility modules
            ├── __init__.py
            ├── config.py       # Configuration handling
            └── api.py          # API client
```

## 🚀 Quick Start for CLI Developers

### 1. Setup Development Environment

```bash
cd cli
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -e ".[dev]"
```

### 2. Verify Installation

```bash
python test_cli.py
daraja --help
```

### 3. Test Basic Commands

```bash
# These will show help/errors until backend is implemented
daraja init
daraja config list
daraja test --help
```

## 🛠️ Development Workflow

### Key Technologies Used

- **Click**: Modern CLI framework (better than argparse)
- **Rich**: Beautiful terminal output with colors, tables, progress bars
- **Requests**: HTTP client for API calls.
- **Pydantic**: Data validation and parsing.
- **pytest**: Testing framework.

### Command Structure

Each command group is in its own file:

```python
# commands/auth.py
@click.group()
def auth():
    """Authentication commands."""
    pass

@auth.command()
def login():
    """Login to Daraja."""
    # Implementation here
```

### Adding New Commands

1. **Create command file** in `commands/`
2. **Import in main.py**: `from .commands import your_command`
3. **Add to CLI**: `cli.add_command(your_command.your_command)`

### Configuration Management

```python
from ..utils.config import load_config, save_config

# Load user config
config = load_config()  # ~/.daraja/config.json

# Save updates
save_config(updated_config)
```

### API Integration

```python
from ..utils.api import DarajaAPI

api = DarajaAPI(config)
result = api.get_user_info()
```

## 📋 Priority Tasks for CLI Team

- To make goals clear and manageable, use this as guide to prioritize tasks for the CLI development.

### Week 1-2: Core Foundation

- [ ] **Fix import issues** (path resolution)
- [ ] **Implement config management** (save/load JSON)
- [ ] **Create mock API client** (placeholder responses)
- [ ] **Basic auth flow** (login/logout commands)

### Week 3-4: Command Implementation

- [ ] **Config commands** (set-endpoint, list, get-url)
- [ ] **Environment commands** (list, switch, status)
- [ ] **Test commands** (webhook, endpoint validation)
- [ ] **Rich formatting** (tables, panels, colors)

### Week 5-6: Advanced Features

- [ ] **Real-time log following** (monitor logs --tail)
- [ ] **Progress indicators** (spinners, progress bars)
- [ ] **Error handling** (user-friendly messages)
- [ ] **Configuration validation** (URL format, etc.)

### Week 7-8: Polish & Integration

- [ ] **API integration** (connect to real backend)
- [ ] **Comprehensive testing** (unit tests, integration)
- [ ] **Installation packaging** (PyPI publishing)
- [ ] **Documentation** (usage examples, troubleshooting)

## 🎨 CLI Design Principles

### User Experience

- **Beautiful output** using Rich library
- **Intuitive commands** following common CLI patterns
- **Helpful error messages** with suggestions
- **Progress feedback** for long operations

### Example Command Outputs

- You can also adopt other design patterns so long as the information is clear and actionable.

```bash
$ daraja status
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                 Webhook Status                  ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

Total Webhooks: 1,247
Successful: 1,198 ✅
Failed: 49 ❌
Success Rate: 96.1%

┏━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━┓
┃ Environment ┃                  Status                   ┃   Success Rate  ┃
┡━━━━━━━━━━━━━╇━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╇━━━━━━━━━━━━━━━━━┩
│     dev     │                    🟢                     │      98.2%      │
│    prod     │                    🟢                     │      94.1%      │
└─────────────┴───────────────────────────────────────────┴─────────────────┘
```

## 🧪 Testing Strategy

### Unit Tests

```python
# tests/test_config.py
def test_save_and_load_config():
    config = {"user_id": "test123"}
    save_config(config)
    loaded = load_config()
    assert loaded["user_id"] == "test123"
```

### Integration Tests

```python
# tests/test_commands.py
def test_login_command():
    result = runner.invoke(cli, ['login', '--email', 'test@example.com'])
    assert result.exit_code == 0
```

### Manual Testing

```bash
# Test all commands work
daraja --help
daraja init
daraja config list
daraja test webhook --environment dev
```

## 🚨 Common Issues & Solutions

### Import Path Issues

```python
# If imports fail, check:
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))
```

### Configuration Location

```python
# Config stored in ~/.daraja/config.json
config_dir = Path.home() / '.daraja'
```

### API Errors

```python
# Always handle API errors gracefully
try:
    result = api.call_endpoint()
except APIError as e:
    console.print(f"[red]❌ {e}[/red]")
    return
```

## 📦 Distribution & Installation

### Development Installation

```bash
pip install -e .  # Editable install for development
```

### User Installation (future)

```bash
pip install daraja-cli  # From PyPI when published
```

### Binary Distribution (future)

```bash
# Using PyInstaller for standalone executables
pip install pyinstaller
pyinstaller --onefile src/daraja_cli/main.py
```

## 🤝 Team Coordination

### CLI Team Structure

- **CLI Lead**: Architecture decisions, API integration
- **Command Developers**: Individual command implementation
- **UX Developer**: Rich formatting, user experience
- **Testing Developer**: Test coverage, validation

### Integration Points

- **Backend API**: Webhook service endpoints
- **Configuration**: User settings, environment management
- **Dashboard**: Consistent data display
- **Documentation**: User guides, troubleshooting
