"""
Configuration commands for Daraja CLI
"""

import click
from rich.console import Console
from rich.table import Table
from rich.panel import Panel

from ..utils.config import save_config

console = Console()


@click.group()
def config() -> None:
    """Configuration management commands."""
    pass


@config.command("list")
@click.pass_context
def list_config(ctx: click.Context) -> None:
    """Show current configuration."""
    config_data = ctx.obj.get("config")
    if not config_data:
        console.print("[red]❌ Not configured. Run 'daraja login' first.[/red]")
        return

    # User info
    console.print(
        Panel.fit(
            f"[bold]User:[/bold] {config_data.get('user_name', 'Unknown')}\n"
            f"[bold]Email:[/bold] {config_data.get('email', 'Unknown')}\n"
            f"[bold]Current Environment:[/bold] {config_data.get('current_environment', 'dev')}",
            title="User Configuration",
        )
    )

    # Permanent URL
    console.print("\n[bold]Permanent Webhook URL:[/bold]")
    console.print(f"[cyan]{config_data.get('permanent_url', 'Not available')}[/cyan]")

    # Endpoints table
    endpoints = config_data.get("endpoints", {})
    if endpoints:
        console.print("\n[bold]Configured Endpoints:[/bold]")
        table = Table(show_header=True, header_style="bold magenta")
        table.add_column("Environment", style="dim")
        table.add_column("Endpoint URL")
        table.add_column("Status", justify="center")

        for env, url in endpoints.items():
            status = "✅" if env == config_data.get("current_environment") else "⚪"
            table.add_row(env, url, status)

        console.print(table)
    else:
        console.print("\n[yellow]⚠️  No endpoints configured yet.[/yellow]")
        console.print("[dim]Use 'daraja config set-endpoint' to add endpoints.[/dim]")


@config.command("set-endpoint")
@click.argument("environment")
@click.argument("url")
@click.pass_context
def set_endpoint(ctx: click.Context, environment: str, url: str) -> None:
    """Set webhook endpoint for an environment."""
    config_data = ctx.obj.get("config")
    if not config_data:
        console.print("[red]❌ Not configured. Run 'daraja login' first.[/red]")
        return

    # Validate URL format (basic), Obviously we will need more robust validation in production
    if not url.startswith(("http://", "https://")):
        console.print("[red]❌ URL must start with http:// or https://[/red]")
        return

    # Update configuration
    if "endpoints" not in config_data:
        config_data["endpoints"] = {}

    config_data["endpoints"][environment] = url

    try:
        save_config(config_data)
        console.print(f"[green]✅ Set {environment} endpoint to:[/green] {url}")

        # If this is the first endpoint, make it current
        if config_data.get("current_environment") is None:
            config_data["current_environment"] = environment
            save_config(config_data)
            console.print(f"[blue]ℹ️  Set {environment} as current environment[/blue]")

    except Exception as e:
        console.print(f"[red]❌ Failed to save configuration: {e}[/red]")


@config.command("get-url")
@click.pass_context
def get_url(ctx: click.Context) -> None:
    """Get your permanent webhook URL."""
    config_data = ctx.obj.get("config")
    if not config_data:
        console.print("[red]❌ Not configured. Run 'daraja login' first.[/red]")
        return

    permanent_url = config_data.get("permanent_url")
    if not permanent_url:
        console.print("[red]❌ Permanent URL not available[/red]")
        return

    console.print(
        Panel.fit(
            f"[bold]Your Permanent Webhook URL:[/bold]\n\n"
            f"[cyan]{permanent_url}[/cyan]\n\n"
            f"[dim]Use this URL in your M-Pesa developer portal.\n"
            f"It will route webhooks to your configured environments.[/dim]",
            title="Permanent Webhook URL",
        )
    )


@config.command("remove-endpoint")
@click.argument("environment")
@click.pass_context
def remove_endpoint(ctx: click.Context, environment: str) -> None:
    """Remove webhook endpoint for an environment."""
    config_data = ctx.obj.get("config")
    if not config_data:
        console.print("[red]❌ Not configured. Run 'daraja login' first.[/red]")
        return

    endpoints = config_data.get("endpoints", {})
    if environment not in endpoints:
        console.print(f"[yellow]⚠️  No endpoint configured for '{environment}'[/yellow]")
        return

    # Confirm removal
    if not click.confirm(f"Remove endpoint for '{environment}'?"):
        return

    del endpoints[environment]

    # If we removed the current environment, switch to another one
    if config_data.get("current_environment") == environment:
        if endpoints:
            new_env = next(iter(endpoints))
            config_data["current_environment"] = new_env
            console.print(f"[blue]ℹ️  Switched to '{new_env}' environment[/blue]")
        else:
            config_data["current_environment"] = None

    try:
        save_config(config_data)
        console.print(f"[green]✅ Removed endpoint for '{environment}'[/green]")
    except Exception as e:
        console.print(f"[red]❌ Failed to save configuration: {e}[/red]")
