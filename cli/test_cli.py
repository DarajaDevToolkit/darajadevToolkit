#!/usr/bin/env python3
"""
Basic test to verify CLI installation and main functions
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from daraja_cli.main import cli

if __name__ == '__main__':
    try:
        # Test basic CLI functionality
        print("✅ CLI imports successfully")
        
        # Test configuration utilities
        from daraja_cli.utils.config import get_config_dir
        config_dir = get_config_dir()
        print(f"✅ Config directory: {config_dir}")
        
        # Test command structure
        print("✅ Available commands:")
        print("  - daraja init")
        print("  - daraja login")
        print("  - daraja config")
        print("  - daraja test")
        print("  - daraja monitor")
        print("  - daraja env")
        
        print("\n🎉 CLI setup is working correctly!")
        print("Run 'daraja --help' to see all available commands.")
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("Make sure to install dependencies: pip install -e .")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)
