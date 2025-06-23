"""
Authentication commands for Daraja CLI
Feel free to add more but these are the basic ones needed for user login/logout and checking current user info.
"""

import click
from rich.console import Console
from rich.prompt import Prompt, Confirm
from rich.panel import Panel

from ..utils.config import save_config, ConfigError
from ..utils.api import DarajaAPI, APIError
from typing import Optional # this is so because we can use None as a default value for email and api_key, otherwise you'll run into issues with CI

console = Console()

@click.group()
def auth() -> None:
    """Authentication commands."""
    pass

@auth.command()
@click.option('--email', help='Your email address')
@click.option('--api-key', help='Your API key (if you have one)')

def login(email: Optional[str] = None, api_key: Optional[str] = None) -> None:
    """Login to your Daraja account."""
    console.print("[bold blue]🔐 Login to Daraja[/bold blue]")
    
    if not email:
        email = Prompt.ask("Email address")
    
    if not api_key:
        console.print("\n[dim]You can find your API key in the Daraja dashboard.[/dim]")
        api_key = Prompt.ask("API Key", password=True)
    
    # Validate credentials
    try:
        console.print("\n[dim]Validating credentials...[/dim]")
        
        # Create temporary API client to test credentials
        temp_config = {
            'email': email,
            'api_key': api_key,
            'api_url': 'https://api.daraja-toolkit.com'  # TODO: Make configurable
        }
        
        api = DarajaAPI(temp_config)
        user_info = api.get_user_info()
        
        # Save configuration
        config = {
            'email': email,
            'api_key': api_key,
            'api_url': temp_config['api_url'],
            'user_id': user_info['id'],
            'user_name': user_info['name'],
            'permanent_url': user_info['permanent_url'],
            'current_environment': 'dev',
            'endpoints': {}
        }
        
        save_config(config)
        
        console.print(Panel.fit(
            f"[bold green]✅ Successfully logged in![/bold green]\n\n"
            f"[bold]Name:[/bold] {user_info['name']}\n"
            f"[bold]Email:[/bold] {email}\n"
            f"[bold]User ID:[/bold] {user_info['id']}\n\n"
            f"[bold]Your permanent webhook URL:[/bold]\n"
            f"[cyan]{user_info['permanent_url']}[/cyan]\n\n"
            f"[dim]Use this URL in your M-Pesa developer portal.[/dim]",
            title="Login Successful"
        ))
        
    except APIError as e:
        console.print(f"[bold red]❌ Login failed:[/bold red] {e}")
        raise click.Abort()
    except Exception as e:
        console.print(f"[bold red]❌ Unexpected error:[/bold red] {e}")
        raise click.Abort()

@auth.command()
def logout() -> None:
    """Logout from Daraja."""
    if not Confirm.ask("Are you sure you want to logout?"):
        return
    
    try:
        # TODO: Clear saved configuration
        console.print("[green]✅ Successfully logged out![/green]")
    except Exception as e:
        console.print(f"[red]❌ Error during logout: {e}[/red]")
        raise click.Abort()

@auth.command()
@click.pass_context
def whoami(ctx: click.Context) -> None:
    """Show current user information."""
    config = ctx.obj.get('config')
    if not config:
        console.print("[red]❌ Not logged in. Run 'daraja login' first.[/red]")
        return
    
    console.print(Panel.fit(
        f"[bold]Name:[/bold] {config.get('user_name', 'Unknown')}\n"
        f"[bold]Email:[/bold] {config.get('email', 'Unknown')}\n"
        f"[bold]User ID:[/bold] {config.get('user_id', 'Unknown')}\n"
        f"[bold]Current Environment:[/bold] {config.get('current_environment', 'dev')}\n\n"
        f"[bold]Permanent Webhook URL:[/bold]\n"
        f"[cyan]{config.get('permanent_url', 'Not available')}[/cyan]",
        title="Current User"
    ))
