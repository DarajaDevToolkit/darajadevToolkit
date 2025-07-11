#!/usr/bin/env python3
"""
Basic test to verify CLI installation and main functions
I think we can do all integration tests here, But feel free to split them if you want
"""

import sys
import os
from click.testing import CliRunner

# Add the src directory to Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
# print(f"Adding source directory to path: {current_dir}/src")
src_dir = os.path.join(current_dir, 'src')
# print(f"Source directory: {src_dir}")
sys.path.insert(0, src_dir)

# Import pytest only when needed just in case you dont want to install it
try:
    import pytest
except ImportError:
    print("⚠️ pytest not available, running basic tests only")
    pytest = None

def test_cli_import():
    """Test that CLI can be imported successfully"""
    try:
        from daraja_cli.main import cli
        assert cli is not None
        print("✅ CLI imported successfully")
    except ImportError as e:
        print(f"❌ Failed to import CLI: {e}")
        assert False, f"CLI import failed: {e}"

def test_cli_basic_functionality():
    """Test basic CLI functionality"""
    try:
        from daraja_cli.main import cli
        # Test that CLI is callable (Click command)
        assert callable(cli)
        print("✅ CLI is callable")
    except Exception as e:
        print(f"❌ CLI basic functionality test failed: {e}")
        assert False, f"CLI functionality test failed: {e}"

def test_cli_config():
    """Test CLI configuration utilities"""
    try:
        from daraja_cli.utils.config import get_config_dir
        config_dir = get_config_dir()
        print(f"✅ Config directory: {config_dir}")
    except Exception as e:
        print(f"❌ Config test failed: {e}")
        assert False, f"Config test failed: {e}"

# New tests for auth commands and profiles
def test_auth_commands_registered():
    """Test that auth group has expected subcommands"""
    runner = CliRunner()
    from daraja_cli.main import cli
    result = runner.invoke(cli, ['auth', '--help'])
    assert result.exit_code == 0
    for cmd in ['login', 'logout', 'whoami', 'profiles', 'use']:
        assert cmd in result.output
    print("✅ Auth subcommands are registered")

def test_profiles_command_error_without_config():
    """Test that listing profiles without config errors out"""
    runner = CliRunner()
    from daraja_cli.main import cli
    result = runner.invoke(cli, ['auth', 'profiles'])
    assert result.exit_code != 0
    assert 'not found' in result.output.lower() or 'error' in result.output.lower()
    print("✅ Profiles command errors appropriately without config")

def run_all_tests():
    """Run all tests and return success status"""
    print("🧪 Running CLI tests...")
    
    tests = [
        test_cli_import,
        test_cli_basic_functionality,
        test_cli_config,
        test_auth_commands_registered,
        test_profiles_command_error_without_config
    ]
    
    passed = 0
    failed = 0
    
    for test in tests:
        try:
            # pytest-style tests return None and use assert statements
            test()  # If no exception is raised, test passed
            passed += 1
        except AssertionError as e:
            print(f"❌ Test {test.__name__} failed: {e}")
            failed += 1
        except Exception as e:
            print(f"❌ Test {test.__name__} crashed: {e}")
            failed += 1
    
    print(f"\n📊 Test Results: {passed} passed, {failed} failed")
    
    if failed == 0:
        print("🎉 All CLI tests passed!")
        print("✅ Available commands:")
        print("  - daraja init")
        print("  - daraja login") 
        print("  - daraja config")
        print("  - daraja test")
        print("  - daraja monitor")
        print("  - daraja env")
        print("\nRun 'daraja --help' to see all available commands.")
        return True
    else:
        print("❌ Some tests failed!")
        return False

if __name__ == "__main__":
    # Run tests directly when script is executed
    success = run_all_tests()
    print(f"\n{'🎉' if success else '💥'} Test run {'completed successfully' if success else 'failed'}!")
    sys.exit(0 if success else 1)
