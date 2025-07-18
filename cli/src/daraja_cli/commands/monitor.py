"""
Monitoring and logging commands for Daraja CLI
"""

import click
import json
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.live import Live
from rich.spinner import Spinner
import time
from datetime import datetime, timedelta

from ..utils.config import load_config, ConfigError
from ..utils.api import DarajaAPI, APIError

console = Console()

@click.group()
def monitor() -> None:
    """Monitoring and logging commands."""
    pass

@monitor.command()
@click.pass_context
def status(ctx: click.Context) -> None:
    """Show webhook status summary."""
    config_data = ctx.obj.get('config')
    api = ctx.obj.get('api')
    
    if not config_data or not api:
        console.print("[red]❌ Not configured. Run 'daraja login' first.[/red]")
        return
    
    try:
        with console.status("[bold blue]Fetching webhook status..."):
            status_data = api.get_webhook_status()
        
        # Display status summary
        console.print(Panel.fit(
            f"[bold]Webhook Status Summary[/bold]\n\n"
            f"[bold]Total Webhooks:[/bold] {status_data.get('total_webhooks', 0)}\n"
            f"[bold]Successful:[/bold] [green]{status_data.get('successful', 0)}[/green]\n"
            f"[bold]Failed:[/bold] [red]{status_data.get('failed', 0)}[/red]\n"
            f"[bold]Pending:[/bold] [yellow]{status_data.get('pending', 0)}[/yellow]\n\n"
            f"[bold]Success Rate:[/bold] {status_data.get('success_rate', 0):.1f}%\n"
            f"[bold]Avg Response Time:[/bold] {status_data.get('avg_response_time', 0):.0f}ms",
            title="Status"
        ))
        
        # Show environment status
        environments = status_data.get('environments', {})
        if environments:
            console.print("\n[bold]Environment Status:[/bold]")
            table = Table(show_header=True, header_style="bold magenta")
            table.add_column("Environment", style="dim")
            table.add_column("Status", justify="center")
            table.add_column("Last Success", style="dim")
            table.add_column("Success Rate", justify="right")
            
            for env, data in environments.items():
                status_icon = "🟢" if data.get('status') == 'healthy' else "🔴"
                last_success = data.get('last_success', 'Never')
                success_rate = f"{data.get('success_rate', 0):.1f}%"
                
                table.add_row(env, status_icon, last_success, success_rate)
            
            console.print(table)
        
    except APIError as e:
        console.print(f"[red]❌ Failed to fetch status: {e}[/red]")
    except Exception as e:
        console.print(f"[red]❌ Unexpected error: {e}[/red]")

@monitor.command()
@click.option('--tail', '-f', is_flag=True, help='Follow logs in real-time')
@click.option('--limit', '-n', default=20, help='Number of log entries to show')
@click.option('--environment', '-e', help='Filter by environment')
@click.option('--status', '-s', help='Filter by status (delivered, failed, pending)')
@click.option('--webhook-id', '-w', help='Filter by specific webhook ID')
@click.option('--start-date', help='Filter from start date (YYYY-MM-DD)')
@click.option('--end-date', help='Filter until end date (YYYY-MM-DD)')
@click.pass_context
def logs(ctx: click.Context, tail: bool, limit: int, environment: str, 
         status: str, webhook_id: str, start_date: str, end_date: str) -> None:
    """Show webhook delivery logs with advanced filtering."""
    config_data = ctx.obj.get('config')
    api = ctx.obj.get('api')
    
    if not config_data or not api:
        console.print("[red]❌ Not configured. Run 'daraja login' first.[/red]")
        return
    
    # Validate status if provided
    if status and status not in ['delivered', 'failed', 'pending']:
        console.print("[red]❌ Invalid status. Must be one of: delivered, failed, pending[/red]")
        return
    
    # Validate date formats if provided
    if start_date:
        try:
            datetime.strptime(start_date, '%Y-%m-%d')
        except ValueError:
            console.print("[red]❌ Invalid start date format. Use YYYY-MM-DD[/red]")
            return
    
    if end_date:
        try:
            datetime.strptime(end_date, '%Y-%m-%d')
        except ValueError:
            console.print("[red]❌ Invalid end date format. Use YYYY-MM-DD[/red]")
            return
    
    if tail:
        _follow_logs(api, environment)
    else:
        _show_logs(api, limit, environment, status, webhook_id, start_date, end_date)

def _show_logs(api: DarajaAPI, limit: int, environment: str, status: str = None, 
               webhook_id: str = None, start_date: str = None, end_date: str = None) -> None:
    """Show recent logs with advanced filtering."""
    try:
        filter_desc = []
        if environment:
            filter_desc.append(f"environment: {environment}")
        if status:
            filter_desc.append(f"status: {status}")
        if webhook_id:
            filter_desc.append(f"webhook ID: {webhook_id}")
        if start_date:
            filter_desc.append(f"from: {start_date}")
        if end_date:
            filter_desc.append(f"to: {end_date}")
        
        filter_text = f" ({', '.join(filter_desc)})" if filter_desc else ""
        
        with console.status(f"[bold blue]Fetching logs{filter_text}..."):
            logs_data = api.get_webhook_logs(limit, environment, status, webhook_id, start_date, end_date)
        
        if not logs_data:
            console.print(f"[yellow]📝 No logs found{filter_text}[/yellow]")
            return
        
        # Display logs table
        table = Table(show_header=True, header_style="bold magenta")
        table.add_column("Time", style="dim", width=20)
        table.add_column("Environment", width=10)
        table.add_column("Status", justify="center", width=8)
        table.add_column("Response", justify="right", width=8)
        table.add_column("Duration", justify="right", width=10)
        table.add_column("Webhook ID", style="dim")
        
        for log in logs_data:
            timestamp = datetime.fromisoformat(log.get('timestamp', ''))
            time_str = timestamp.strftime('%H:%M:%S %d/%m')
            
            status = log.get('status', 'unknown')
            if status == 'delivered':
                status_icon = "✅"
                status_color = "green"
            elif status == 'failed':
                status_icon = "❌"
                status_color = "red"
            elif status == 'pending':
                status_icon = "⏳"
                status_color = "yellow"
            else:
                status_icon = "❓"
                status_color = "dim"
            
            response_code = log.get('response_code', '-')
            duration = f"{log.get('duration_ms', 0)}ms"
            webhook_id_display = log.get('webhook_id', 'N/A')
            if len(webhook_id_display) > 12:
                webhook_id_display = webhook_id_display[:12] + '...'
            
            table.add_row(
                time_str,
                log.get('environment', 'N/A'),
                f"[{status_color}]{status_icon}[/{status_color}]",
                str(response_code),
                duration,
                webhook_id_display
            )
        
        console.print(table)
        
        # Show filter summary
        summary_parts = [f"Showing {len(logs_data)} entries"]
        if filter_desc:
            summary_parts.append(f"filtered by {', '.join(filter_desc)}")
        console.print(f"\n[dim]{' '.join(summary_parts)}[/dim]")
        
        # Show helpful commands
        if logs_data:
            console.print(f"\n[dim]💡 Tips:[/dim]")
            console.print(f"[dim]  • Use --webhook-id to see specific webhook details[/dim]")
            console.print(f"[dim]  • Use 'daraja test replay' to replay a webhook[/dim]")
        
    except APIError as e:
        console.print(f"[red]❌ Failed to fetch logs: {e}[/red]")
    except Exception as e:
        console.print(f"[red]❌ Unexpected error: {e}[/red]")

def _follow_logs(api: DarajaAPI, environment: str) -> None:
    """Follow logs in real-time."""
    console.print("[bold blue]📝 Following logs... (Press Ctrl+C to stop)[/bold blue]")
    
    try:
        last_timestamp = datetime.now()
        
        while True:
            try:
                # Fetch recent logs since last check
                logs_data = api.get_webhook_logs(10, environment)
                
                # Filter for new logs
                new_logs = []
                for log in logs_data:
                    log_time = datetime.fromisoformat(log.get('timestamp', ''))
                    if log_time > last_timestamp:
                        new_logs.append(log)
                        last_timestamp = log_time
                
                # Display new logs
                for log in reversed(new_logs):  # Show in chronological order
                    timestamp = datetime.fromisoformat(log.get('timestamp', ''))
                    time_str = timestamp.strftime('%H:%M:%S')
                    
                    status = log.get('status', 'unknown')
                    if status == 'delivered':
                        status_icon = "✅"
                        status_color = "green"
                    elif status == 'failed':
                        status_icon = "❌"
                        status_color = "red"
                    else:
                        status_icon = "⏳"
                        status_color = "yellow"
                    
                    env = log.get('environment', 'N/A')
                    response_code = log.get('response_code', '-')
                    duration = log.get('duration_ms', 0)
                    
                    console.print(
                        f"[dim]{time_str}[/dim] "
                        f"[bold]{env}[/bold] "
                        f"[{status_color}]{status_icon}[/{status_color}] "
                        f"HTTP {response_code} "
                        f"[dim]({duration}ms)[/dim]"
                    )
                
                time.sleep(2)  # Poll every 2 seconds
                
            except KeyboardInterrupt:
                console.print("\n[yellow]📝 Stopped following logs[/yellow]")
                break
            except APIError as e:
                console.print(f"[red]❌ Error fetching logs: {e}[/red]")
                time.sleep(5)  # Wait longer on error
            except Exception as e:
                console.print(f"[red]❌ Unexpected error: {e}[/red]")
                time.sleep(5)
                
    except KeyboardInterrupt:
        console.print("\n[yellow]📝 Stopped following logs[/yellow]")

@monitor.command()
@click.option('--days', '-d', default=7, help='Number of days to show metrics for')
@click.pass_context
def metrics(ctx: click.Context, days: int) -> None:
    """Show detailed webhook metrics."""
    config_data = ctx.obj.get('config')
    api = ctx.obj.get('api')
    
    if not config_data or not api:
        console.print("[red]❌ Not configured. Run 'daraja login' first.[/red]")
        return
    
    try:
        with console.status(f"[bold blue]Fetching metrics for last {days} days..."):
            metrics_data = api.get_metrics(days)
        
        # Summary metrics
        console.print(Panel.fit(
            f"[bold]Metrics Summary (Last {days} days)[/bold]\n\n"
            f"[bold]Total Webhooks:[/bold] {metrics_data.get('total_webhooks', 0):,}\n"
            f"[bold]Successful:[/bold] [green]{metrics_data.get('successful', 0):,}[/green]\n"
            f"[bold]Failed:[/bold] [red]{metrics_data.get('failed', 0):,}[/red]\n"
            f"[bold]Success Rate:[/bold] {metrics_data.get('success_rate', 0):.2f}%\n\n"
            f"[bold]Avg Response Time:[/bold] {metrics_data.get('avg_response_time', 0):.0f}ms\n"
            f"[bold]Fastest Response:[/bold] {metrics_data.get('min_response_time', 0):.0f}ms\n"
            f"[bold]Slowest Response:[/bold] {metrics_data.get('max_response_time', 0):.0f}ms",
            title="Performance Metrics"
        ))
        
        # Error breakdown
        errors = metrics_data.get('error_breakdown', {})
        if errors:
            console.print("\n[bold]Error Breakdown:[/bold]")
            error_table = Table(show_header=True, header_style="bold red")
            error_table.add_column("Error Type", style="dim")
            error_table.add_column("Count", justify="right")
            error_table.add_column("Percentage", justify="right")
            
            total_errors = sum(errors.values())
            for error_type, count in errors.items():
                percentage = (count / total_errors * 100) if total_errors > 0 else 0
                error_table.add_row(error_type, str(count), f"{percentage:.1f}%")
            
            console.print(error_table)
        
        # Daily breakdown
        daily_stats = metrics_data.get('daily_stats', [])
        if daily_stats:
            console.print("\n[bold]Daily Activity:[/bold]")
            daily_table = Table(show_header=True, header_style="bold magenta")
            daily_table.add_column("Date", style="dim")
            daily_table.add_column("Webhooks", justify="right")
            daily_table.add_column("Success Rate", justify="right")
            daily_table.add_column("Avg Response", justify="right")
            
            for day_data in daily_stats[-7:]:  # Show last 7 days
                date = day_data.get('date', 'N/A')
                webhooks = day_data.get('total_webhooks', 0)
                success_rate = day_data.get('success_rate', 0)
                avg_response = day_data.get('avg_response_time', 0)
                
                daily_table.add_row(
                    date,
                    str(webhooks),
                    f"{success_rate:.1f}%",
                    f"{avg_response:.0f}ms"
                )
            
            console.print(daily_table)
        
    except APIError as e:
        console.print(f"[red]❌ Failed to fetch metrics: {e}[/red]")
    except Exception as e:
        console.print(f"[red]❌ Unexpected error: {e}[/red]")

@monitor.command()
@click.argument('webhook_id')
@click.pass_context 
def webhook(ctx: click.Context, webhook_id: str) -> None:
    """Show detailed information about a specific webhook."""
    config_data = ctx.obj.get('config')
    api = ctx.obj.get('api')
    
    if not config_data or not api:
        console.print("[red]❌ Not configured. Run 'daraja login' first.[/red]")
        return
    
    try:
        with console.status(f"[bold blue]Fetching webhook details..."):
            webhook_data = api.get_webhook_by_id(webhook_id)
        
        # Basic information
        console.print(Panel.fit(
            f"[bold]Webhook Details[/bold]\n\n"
            f"[bold]ID:[/bold] {webhook_data.get('id', 'N/A')}\n"
            f"[bold]Environment:[/bold] {webhook_data.get('environment', 'N/A')}\n"
            f"[bold]Status:[/bold] {webhook_data.get('status', 'N/A')}\n"
            f"[bold]Created:[/bold] {webhook_data.get('created_at', 'N/A')}\n"
            f"[bold]Last Updated:[/bold] {webhook_data.get('updated_at', 'N/A')}\n"
            f"[bold]Response Code:[/bold] {webhook_data.get('response_code', 'N/A')}\n"
            f"[bold]Response Time:[/bold] {webhook_data.get('response_time_ms', 'N/A')}ms\n"
            f"[bold]Retry Count:[/bold] {webhook_data.get('retry_count', 0)}\n"
            f"[bold]Endpoint URL:[/bold] {webhook_data.get('endpoint_url', 'N/A')}",
            title="Webhook Information"
        ))
        
        # Payload information
        payload = webhook_data.get('payload', {})
        if payload:
            payload_str = json.dumps(payload, indent=2)
            if len(payload_str) > 500:
                payload_str = payload_str[:500] + "\n... (truncated)"
            
            console.print("\n[bold]Payload:[/bold]")
            console.print(Panel(payload_str, title="Request Payload", border_style="dim"))
        
        # Response information
        response = webhook_data.get('response', {})
        if response:
            response_str = json.dumps(response, indent=2)
            if len(response_str) > 300:
                response_str = response_str[:300] + "\n... (truncated)"
                
            console.print("\n[bold]Response:[/bold]")
            console.print(Panel(response_str, title="Response Data", border_style="dim"))
        
        # Error information
        error = webhook_data.get('error')
        if error:
            console.print(f"\n[bold red]Error:[/bold red]")
            console.print(Panel(error, title="Error Details", border_style="red"))
        
        # Show available actions
        console.print(f"\n[dim]💡 Available actions:[/dim]")
        console.print(f"[dim]  • daraja test replay {webhook_id} - Replay this webhook[/dim]")
        console.print(f"[dim]  • daraja monitor logs --webhook-id {webhook_id} - Show related logs[/dim]")
        
    except APIError as e:
        console.print(f"[red]❌ Failed to fetch webhook details: {e}[/red]")
    except Exception as e:
        console.print(f"[red]❌ Unexpected error: {e}[/red]")
