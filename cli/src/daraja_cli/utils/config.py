"""
Configuration management utilities
"""

import json
import os
from pathlib import Path
from typing import Dict, Any, Optional, List
try:
    import keyring
except ImportError:
    keyring = None  # type: ignore

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
    # Remove all stored credentials for all profiles
    # Remove all stored credentials for all profiles
    if keyring:
        try:
            all_conf = load_all_config()
            for name in all_conf.get('profiles', {}):
                keyring.delete_password('daraja-cli', name)
        except ConfigError:
            pass

def load_all_config() -> Dict[str, Any]:
    """Load the entire configuration including all profiles."""
    config_file = get_config_file()
    if not config_file.exists():
        raise ConfigError("Configuration file not found.")
    try:
        with open(config_file, 'r') as f:
            return json.load(f)
    except Exception as e:
        raise ConfigError(f"Failed to load configuration: {e}")

def save_all_config(all_conf: Dict[str, Any]) -> None:
    """Save the entire configuration including all profiles."""
    config_file = get_config_file()
    try:
        with open(config_file, 'w') as f:
            json.dump(all_conf, f, indent=2)
    except Exception as e:
        raise ConfigError(f"Failed to save configuration: {e}")

def list_profiles() -> List[str]:
    """Return a list of saved profile names."""
    all_conf = load_all_config()
    return list(all_conf.get('profiles', {}).keys())

def get_current_profile_name() -> str:
    """Return the name of the currently active profile."""
    all_conf = load_all_config()
    return all_conf.get('current_profile', 'default')

def switch_profile(profile_name: str) -> None:
    """Switch active profile to the given name."""
    all_conf = load_all_config()
    if profile_name not in all_conf.get('profiles', {}):
        raise ConfigError(f"Profile '{profile_name}' not found.")
    all_conf['current_profile'] = profile_name
    save_all_config(all_conf)

def load_profile(profile_name: Optional[str] = None) -> Dict[str, Any]:
    """Load a single profile, including credentials."""
    all_conf = load_all_config()
    name = profile_name or all_conf.get('current_profile')
    profiles = all_conf.get('profiles', {})
    if name not in profiles:
        raise ConfigError(f"Profile '{name}' not found.")
    data = profiles[name].copy()
    # retrieve api_key from secure store
    if keyring:
        api_key = keyring.get_password('daraja-cli', name)
    else:
        raise ConfigError("Secure storage (keyring) is not available. Please install 'keyring'.")
    data['api_key'] = api_key
    data['profile'] = name
    return data

def save_profile(profile_name: str, config: Dict[str, Any]) -> None:
    """Save a single profile, storing credentials securely."""
    try:
        all_conf = load_all_config()
    except ConfigError:
        all_conf = {'profiles': {}, 'current_profile': profile_name}
    profiles = all_conf.get('profiles', {})
    # store api_key securely
    api_key = config.pop('api_key', None)
    if api_key is not None:
        if keyring:
            keyring.set_password('daraja-cli', profile_name, api_key)
        else:
            raise ConfigError("Secure storage (keyring) is not available. Please install 'keyring'.")
    # save metadata
    profiles[profile_name] = config.copy()
    all_conf['profiles'] = profiles
    all_conf['current_profile'] = profile_name
    save_all_config(all_conf)
    # Optionally clear profiles in secure store (e.g., keyring) if implemented
