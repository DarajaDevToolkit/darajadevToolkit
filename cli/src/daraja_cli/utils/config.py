"""
Configuration management utilities
"""

import json
import os
from pathlib import Path
from typing import Dict, Any, Optional

class ConfigError(Exception):
    """Configuration related errors"""
    pass

def get_config_dir() -> Path:
    """Get the configuration directory path."""
    config_dir = Path.home() / '.daraja'
    config_dir.mkdir(exist_ok=True)
    return config_dir

def get_config_file() -> Path:
    """Get the configuration file path."""
    return get_config_dir() / 'config.json'

def load_config() -> Dict[str, Any]:
    """Load configuration from file."""
    config_file = get_config_file()
    
    if not config_file.exists():
        raise ConfigError("Configuration file not found. Run 'daraja login' first.")
    
    try:
        with open(config_file, 'r') as f:
            return json.load(f)
    except json.JSONDecodeError as e:
        raise ConfigError(f"Invalid configuration file: {e}")
    except Exception as e:
        raise ConfigError(f"Failed to load configuration: {e}")

def save_config(config: Dict[str, Any]) -> None:
    """Save configuration to file."""
    config_file = get_config_file()
    
    try:
        with open(config_file, 'w') as f:
            json.dump(config, f, indent=2)
    except Exception as e:
        raise ConfigError(f"Failed to save configuration: {e}")

def get_config_value(key: str, default: Any = None) -> Any:
    """Get a specific configuration value."""
    try:
        config = load_config()
        return config.get(key, default)
    except ConfigError:
        return default

def set_config_value(key: str, value: Any) -> None:
    """Set a specific configuration value."""
    try:
        config = load_config()
    except ConfigError:
        config = {}
    
    config[key] = value
    save_config(config)

def clear_config() -> None:
    """Clear all configuration."""
    config_file = get_config_file()
    if config_file.exists():
        config_file.unlink()
