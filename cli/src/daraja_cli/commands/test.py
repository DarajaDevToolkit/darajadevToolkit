"""
Testing commands for Daraja CLI
For now leave these out until we implement backend fully
But this should be a good starting point for testing webhooks and endpoints
"""

import click
import json
from rich.console import Console
from rich.panel import Panel
from rich.progress import Progress, SpinnerColumn, TextColumn

from ..utils.config import load_config, ConfigError
from ..utils.api import DarajaAPI, APIError

from typing import Optional

console = Console()

@click.group()
def test() -> None:
    """Testing and validation commands."""
    pass

@test.command()
@click.option('--environment', '-e', help='Environment to test (dev/staging/prod)')
@click.option('--payload', help='Custom JSON payload file')
@click.pass_context
def webhook(ctx: click.Context, environment: str, payload: str) -> None:
    """Send a test webhook to our endpoint."""
    config_data = ctx.obj.get('config')
    api = ctx.obj.get('api')
    
    if not config_data or not api:
        console.print("[red]❌ Not configured. Run 'daraja login' first.[/red]")
        return
    
    # Determine environment
    if not environment:
        environment = config_data.get('current_environment', 'dev')
    
    endpoints = config_data.get('endpoints', {})
    if environment not in endpoints:
        console.print(f"[red]❌ No endpoint configured for '{environment}'[/red]")
        console.print("[dim]Use 'daraja config set-endpoint' to configure endpoints.[/dim]")
        return
    
    endpoint_url = endpoints[environment]
    
    # Load custom payload if provided
    test_payload = None
    if payload:
        try:
            with open(payload, 'r') as f:
                test_payload = json.load(f)
        except Exception as e:
            console.print(f"[red]❌ Failed to load payload file: {e}[/red]")
            return
    
    console.print(f"[bold blue]🧪 Testing webhook delivery[/bold blue]")
    console.print(f"[dim]Environment:[/dim] {environment}")
    console.print(f"[dim]Endpoint:[/dim] {endpoint_url}")
    
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console
    ) as progress:
        task = progress.add_task("Sending test webhook...", total=None)
        
        try:
            # Send test webhook via API
            result = api.send_test_webhook(environment, test_payload)
            
            progress.update(task, description="✅ Webhook sent successfully!")
            progress.stop()
            
            # Display results
            console.print(Panel.fit(
                f"[bold green]✅ Test webhook sent successfully![/bold green]\n\n"
                f"[bold]Webhook ID:[/bold] {result.get('webhook_id', 'N/A')}\n"
                f"[bold]Status:[/bold] {result.get('status', 'Unknown')}\n"
                f"[bold]Response Time:[/bold] {result.get('response_time_ms', 'N/A')}ms\n"
                f"[bold]Response Code:[/bold] {result.get('response_code', 'N/A')}\n\n"
                f"[dim]Check 'daraja logs' for detailed delivery information.[/dim]",
                title="Test Results"
            ))
            
        except APIError as e:
            progress.update(task, description="❌ Test failed")
            progress.stop()
            console.print(f"[red]❌ Test failed: {e}[/red]")
        except Exception as e:
            progress.update(task, description="❌ Unexpected error")
            progress.stop()
            console.print(f"[red]❌ Unexpected error: {e}[/red]")

@test.command()
@click.argument('url')
def endpoint(url: str) -> None:
    """Test if an endpoint is reachable."""
    console.print(f"[bold blue]🔍 Testing endpoint reachability[/bold blue]")
    console.print(f"[dim]URL:[/dim] {url}")
    
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console
    ) as progress:
        task = progress.add_task("Testing endpoint...", total=None)
        
        try:
            import requests
            import time
            
            start_time = time.time()
            response = requests.get(url, timeout=10)
            end_time = time.time()
            
            response_time = int((end_time - start_time) * 1000)
            
            progress.update(task, description="✅ Endpoint tested")
            progress.stop()
            
            if response.status_code == 200:
                status_color = "green"
                status_icon = "✅"
            elif response.status_code < 500:
                status_color = "yellow"  
                status_icon = "⚠️"
            else:
                status_color = "red"
                status_icon = "❌"
            
            console.print(Panel.fit(
                f"[bold {status_color}]{status_icon} Endpoint Response[/bold {status_color}]\n\n"
                f"[bold]Status Code:[/bold] {response.status_code}\n"
                f"[bold]Response Time:[/bold] {response_time}ms\n"
                f"[bold]Content Length:[/bold] {len(response.content)} bytes\n\n"
                f"[dim]Endpoint is {'reachable' if response.status_code < 500 else 'having issues'}[/dim]",
                title="Endpoint Test"
            ))
            
        except requests.exceptions.ConnectionError:
            progress.update(task, description="❌ Connection failed")
            progress.stop()
            console.print("[red]❌ Connection failed - endpoint not reachable[/red]")
        except requests.exceptions.Timeout:
            progress.update(task, description="❌ Request timed out")
            progress.stop()
            console.print("[red]❌ Request timed out - endpoint too slow[/red]")
        except Exception as e:
            progress.update(task, description="❌ Test failed")
            progress.stop()
            console.print(f"[red]❌ Test failed: {e}[/red]")

@test.command()
@click.pass_context
def validate(ctx: click.Context) -> None:
    """Validate your current configuration."""
    config_data = ctx.obj.get('config')
    
    if not config_data:
        console.print("[red]❌ Not configured. Run 'daraja login' first.[/red]")
        return
    
    console.print("[bold blue]🔍 Validating configuration[/bold blue]")
    
    issues = []
    warnings = []
    
    # Check required fields
    required_fields = ['user_id', 'api_key', 'permanent_url']
    for field in required_fields:
        if not config_data.get(field):
            issues.append(f"Missing required field: {field}")
    
    # Check endpoints
    endpoints = config_data.get('endpoints', {})
    if not endpoints:
        warnings.append("No endpoints configured")
    else:
        for env, url in endpoints.items():
            if not url.startswith(('http://', 'https://')):
                issues.append(f"Invalid URL format for {env}: {url}")
    
    # Check current environment
    current_env = config_data.get('current_environment')
    if current_env and current_env not in endpoints:
        issues.append(f"Current environment '{current_env}' has no configured endpoint")
    
    # Display results
    if not issues and not warnings:
        console.print(Panel.fit(
            "[bold green]✅ Configuration is valid![/bold green]\n\n"
            "All required fields are present and properly formatted.",
            title="Validation Results"
        ))
    else:
        result_text = ""
        
        if issues:
            result_text += "[bold red]❌ Issues found:[/bold red]\n"
            for issue in issues:
                result_text += f"  • {issue}\n"
        
        if warnings:
            if result_text:
                result_text += "\n"
            result_text += "[bold yellow]⚠️  Warnings:[/bold yellow]\n"
            for warning in warnings:
                result_text += f"  • {warning}\n"
        
        console.print(Panel.fit(result_text.strip(), title="Validation Results"))
