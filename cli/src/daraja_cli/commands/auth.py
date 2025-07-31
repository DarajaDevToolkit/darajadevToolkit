"""
Authentication commands for Daraja CLI
Feel free to add more but these are the basic ones needed for user login/logout and checking current user info.
"""

import click
from rich.console import Console
from rich.prompt import Prompt, Confirm
from rich.panel import Panel

from ..utils.config import (
    save_profile,
    list_profiles,
    switch_profile,
    get_current_profile_name,
    clear_config,
)
from ..utils.config import ConfigError
from ..utils.api import DarajaAPI, APIError
from typing import (
    Optional,
)  # this is so because we can use None as a default value for email and api_key, otherwise you'll run into issues with CI

console = Console()


@click.group()
def auth() -> None:
    """Authentication commands."""
    pass


@auth.command()
@click.option("--profile", "-p", default=None, help="Profile name to use")
@click.option("--email", help="Your email address")
@click.option("--api-key", help="Your API key (if you have one)")
def login(
    profile: Optional[str],
    email: Optional[str] = None,
    api_key: Optional[str] = None,
) -> None:
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
            "email": email,
            "api_key": api_key,
            "api_url": "https://api.daraja-toolkit.com",  # TODO: Make configurable
        }

        api = DarajaAPI(temp_config)
        user_info = api.get_user_info()

        # Save configuration under profile
        config = {
            "email": email,
            "api_key": api_key,
            "api_url": temp_config["api_url"],
            "user_id": user_info["id"],
            "user_name": user_info["name"],
            "permanent_url": user_info["permanent_url"],
            "current_environment": "dev",
            "endpoints": {},
        }
        prof = profile or "default"
        save_profile(prof, config)

        console.print(
            Panel.fit(
                f"[bold green]✅ Successfully logged in![/bold green]\n\n"
                f"[bold]Name:[/bold] {user_info['name']}\n"
                f"[bold]Email:[/bold] {email}\n"
                f"[bold]User ID:[/bold] {user_info['id']}\n\n"
                f"[bold]Your permanent webhook URL:[/bold]\n"
                f"[cyan]{user_info['permanent_url']}[/cyan]\n\n"
                f"[dim]Use this URL in your M-Pesa developer portal.[/dim]",
                title="Login Successful",
            )
        )
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
        # Clear saved configuration
        clear_config()
        console.print("[green]✅ Successfully logged out![/green]")
    except Exception as e:
        console.print(f"[red]❌ Error during logout: {e}[/red]")
        raise click.Abort()


@auth.command()
@click.pass_context
def whoami(ctx: click.Context) -> None:
    """Show current user information."""
    config = ctx.obj.get("config")
    if not config:
        console.print("[red]❌ Not logged in. Run 'daraja login' first.[/red]")
        return

    console.print(
        Panel.fit(
            f"[bold]Name:[/bold] {config.get('user_name', 'Unknown')}\n"
            f"[bold]Email:[/bold] {config.get('email', 'Unknown')}\n"
            f"[bold]User ID:[/bold] {config.get('user_id', 'Unknown')}\n"
            f"[bold]Current Environment:[/bold] {config.get('current_environment', 'dev')}\n\n"
            f"[bold]Permanent Webhook URL:[/bold]\n"
            f"[cyan]{config.get('permanent_url', 'Not available')}[/cyan]",
            title="Current User",
        )
    )


@auth.command("profiles")
def profiles_cmd() -> None:
    """List all saved profiles."""
    try:
        profiles = list_profiles()
        current = get_current_profile_name()
        for p in profiles:
            prefix = "✔️" if p == current else "  "
            console.print(f"{prefix} {p}")
    except ConfigError as e:
        console.print(f"[red]❌ {e}[/red]")
        raise click.Abort()


@auth.command("use")
@click.argument("profile")
def use_cmd(profile: str) -> None:
    """Switch active profile."""
    try:
        switch_profile(profile)
        console.print(f"[green]✅ Switched to profile '{profile}'[/green]")
    except ConfigError as e:
        console.print(f"[red]❌ {e}[/red]")
        raise click.Abort()


@auth.command("delete")
@click.argument("profile")
@click.option("--force", is_flag=True, help="Delete without confirmation")
def delete_cmd(profile: str, force: bool) -> None:
    """Delete a saved profile."""
    try:
        profiles = list_profiles()
        if profile not in profiles:
            console.print(f"[red]❌ Profile '{profile}' not found[/red]")
            raise click.Abort()

        current = get_current_profile_name()
        if profile == current and len(profiles) == 1:
            console.print("[red]❌ Cannot delete the only remaining profile[/red]")
            raise click.Abort()

        if not force:
            if not Confirm.ask(f"Delete profile '{profile}'?"):
                return

        from ..utils.config import delete_profile

        delete_profile(profile)
        console.print(f"[green]✅ Deleted profile '{profile}'[/green]")

        # If we deleted the current profile, switch to another one
        if profile == current and len(profiles) > 1:
            remaining = [p for p in profiles if p != profile]
            new_current = remaining[0]
            switch_profile(new_current)
            console.print(f"[blue]ℹ️  Switched to profile '{new_current}'[/blue]")

    except ConfigError as e:
        console.print(f"[red]❌ {e}[/red]")
        raise click.Abort()


@auth.command("rename")
@click.argument("old_name")
@click.argument("new_name")
def rename_cmd(old_name: str, new_name: str) -> None:
    """Rename a saved profile."""
    try:
        profiles = list_profiles()
        if old_name not in profiles:
            console.print(f"[red]❌ Profile '{old_name}' not found[/red]")
            raise click.Abort()

        if new_name in profiles:
            console.print(f"[red]❌ Profile '{new_name}' already exists[/red]")
            raise click.Abort()

        from ..utils.config import rename_profile

        rename_profile(old_name, new_name)
        console.print(f"[green]✅ Renamed profile '{old_name}' to '{new_name}'[/green]")

    except ConfigError as e:
        console.print(f"[red]❌ {e}[/red]")
        raise click.Abort()
