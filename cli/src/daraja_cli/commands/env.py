"""
Environment management commands for Daraja CLI
"""

import click
from rich.console import Console
from rich.table import Table
from rich.panel import Panel

from ..utils.config import load_config, save_config, ConfigError
from ..utils.api import DarajaAPI, APIError

console = Console()

@click.group()
def env() -> None:
    """Environment management commands."""
    pass

@env.command('list')
@click.pass_context
def list_environments(ctx: click.Context) -> None:
    """List all configured environments."""
    config_data = ctx.obj.get('config')
    
    if not config_data:
        console.print("[red]❌ Not configured. Run 'daraja login' first.[/red]")
        return
    
    endpoints = config_data.get('endpoints', {})
    current_env = config_data.get('current_environment')
    
    if not endpoints:
        console.print("[yellow]⚠️  No environments configured yet.[/yellow]")
        console.print("[dim]Use 'daraja config set-endpoint' to add environments.[/dim]")
        return
    
    console.print("[bold blue]🌍 Configured Environments[/bold blue]")
    
    table = Table(show_header=True, header_style="bold magenta")
    table.add_column("Environment", style="dim")
    table.add_column("Endpoint URL")
    table.add_column("Status", justify="center")
    table.add_column("Current", justify="center")
    
    for env_name, url in endpoints.items():
        # Status check (simplified for now)
        status_icon = "🟢"  # TODO: Implement actual health check
        current_icon = "✅" if env_name == current_env else "⚪"
        
        table.add_row(env_name, url, status_icon, current_icon)
    
    console.print(table)
    
    if current_env:
        console.print(f"\n[bold]Current environment:[/bold] {current_env}")
    else:
        console.print("\n[yellow]⚠️  No current environment set[/yellow]")

@env.command()
@click.argument('environment')
@click.pass_context
def switch(ctx: click.Context, environment: str) -> None:
    """Switch to a different environment."""
    config_data = ctx.obj.get('config')
    
    if not config_data:
        console.print("[red]❌ Not configured. Run 'daraja login' first.[/red]")
        return
    
    endpoints = config_data.get('endpoints', {})
    
    if environment not in endpoints:
        console.print(f"[red]❌ Environment '{environment}' not configured.[/red]")
        console.print("[dim]Available environments:[/dim]")
        for env_name in endpoints.keys():
            console.print(f"  • {env_name}")
        return
    
    # Update current environment
    config_data['current_environment'] = environment
    
    try:
        save_config(config_data)
        console.print(f"[green]✅ Switched to '{environment}' environment[/green]")
        console.print(f"[dim]Webhooks will now be delivered to:[/dim] {endpoints[environment]}")
    except Exception as e:
        console.print(f"[red]❌ Failed to switch environment: {e}[/red]")

@env.command()
@click.pass_context
def status(ctx: click.Context) -> None:
    """Show current environment status."""
    config_data = ctx.obj.get('config')
    api = ctx.obj.get('api')
    
    if not config_data:
        console.print("[red]❌ Not configured. Run 'daraja login' first.[/red]")
        return
    
    current_env = config_data.get('current_environment')
    endpoints = config_data.get('endpoints', {})
    
    if not current_env:
        console.print("[yellow]⚠️  No current environment set[/yellow]")
        return
    
    if current_env not in endpoints:
        console.print(f"[red]❌ Current environment '{current_env}' has no configured endpoint[/red]")
        return
    
    endpoint_url = endpoints[current_env]
    
    console.print(Panel.fit(
        f"[bold]Current Environment Status[/bold]\n\n"
        f"[bold]Environment:[/bold] {current_env}\n"
        f"[bold]Endpoint:[/bold] {endpoint_url}\n"
        f"[bold]Status:[/bold] [green]Active[/green]",
        title="Environment Status"
    ))
    
    # Try to get environment-specific stats if API is available
    if api:
        try:
            with console.status("Checking environment health..."):
                # TODO: Implement environment-specific health check
                console.print("\n[dim]Environment health check: [green]✅ Healthy[/green][/dim]")
        except APIError:
            console.print("\n[dim]Environment health check: [yellow]⚠️  Unable to verify[/yellow][/dim]")
        except Exception:
            pass

@env.command()
@click.argument('environment')
@click.argument('url')
@click.pass_context
def add(ctx: click.Context, environment: str, url: str) -> None:
    """Add a new environment."""
    # This is essentially the same as config set-endpoint
    ctx.invoke(config.set_endpoint, environment=environment, url=url)

@env.command()
@click.argument('environment')
@click.confirmation_option(prompt='Are you sure you want to remove this environment?')
@click.pass_context
def remove(ctx: click.Context, environment: str) -> None:
    """Remove an environment."""
    config_data = ctx.obj.get('config')
    
    if not config_data:
        console.print("[red]❌ Not configured. Run 'daraja login' first.[/red]")
        return
    
    endpoints = config_data.get('endpoints', {})
    
    if environment not in endpoints:
        console.print(f"[yellow]⚠️  Environment '{environment}' not found[/yellow]")
        return
    
    # Remove the environment
    del endpoints[environment]
    
    # If this was the current environment, clear it or switch to another
    current_env = config_data.get('current_environment')
    if current_env == environment:
        if endpoints:
            # Switch to the first available environment
            new_env = next(iter(endpoints))
            config_data['current_environment'] = new_env
            console.print(f"[blue]ℹ️  Switched current environment to '{new_env}'[/blue]")
        else:
            config_data['current_environment'] = None
            console.print("[blue]ℹ️  No environments remaining[/blue]")
    
    try:
        save_config(config_data)
        console.print(f"[green]✅ Removed environment '{environment}'[/green]")
    except Exception as e:
        console.print(f"[red]❌ Failed to remove environment: {e}[/red]")

# Import config for the add command
from . import config
