"""
Monitoring and logging commands for Daraja CLI
"""

import click
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
    config_data = ctx.obj.get("config")
    api = ctx.obj.get("api")

    if not config_data or not api:
        console.print("[red]❌ Not configured. Run 'daraja login' first.[/red]")
        return

    try:
        with console.status("[bold blue]Fetching webhook status..."):
            status_data = api.get_webhook_status()

        # Display status summary
        console.print(
            Panel.fit(
                f"[bold]Webhook Status Summary[/bold]\n\n"
                f"[bold]Total Webhooks:[/bold] {status_data.get('total_webhooks', 0)}\n"
                f"[bold]Successful:[/bold] [green]{status_data.get('successful', 0)}[/green]\n"
                f"[bold]Failed:[/bold] [red]{status_data.get('failed', 0)}[/red]\n"
                f"[bold]Pending:[/bold] [yellow]{status_data.get('pending', 0)}[/yellow]\n\n"
                f"[bold]Success Rate:[/bold] {status_data.get('success_rate', 0):.1f}%\n"
                f"[bold]Avg Response Time:[/bold] {status_data.get('avg_response_time', 0):.0f}ms",
                title="Status",
            )
        )

        # Show environment status
        environments = status_data.get("environments", {})
        if environments:
            console.print("\n[bold]Environment Status:[/bold]")
            table = Table(show_header=True, header_style="bold magenta")
            table.add_column("Environment", style="dim")
            table.add_column("Status", justify="center")
            table.add_column("Last Success", style="dim")
            table.add_column("Success Rate", justify="right")

            for env, data in environments.items():
                status_icon = "🟢" if data.get("status") == "healthy" else "🔴"
                last_success = data.get("last_success", "Never")
                success_rate = f"{data.get('success_rate', 0):.1f}%"

                table.add_row(env, status_icon, last_success, success_rate)

            console.print(table)

    except APIError as e:
        console.print(f"[red]❌ Failed to fetch status: {e}[/red]")
    except Exception as e:
        console.print(f"[red]❌ Unexpected error: {e}[/red]")


@monitor.command("test")
@click.option(
    "--environment", "-e", required=True, help="Environment to send test webhook"
)
@click.option(
    "--payload-file",
    "-p",
    type=click.Path(exists=True),
    help="JSON file with payload for test",
)
@click.pass_context
def test_webhook(ctx: click.Context, environment: str, payload_file: str) -> None:
    """Send a test webhook to the specified environment."""
    config_data = ctx.obj.get("config")
    api = ctx.obj.get("api")
    if not config_data or not api:
        console.print("[red]❌ Not configured. Run 'daraja login' first.[/red]")
        return
    payload = None
    if payload_file:
        try:
            import json

            with open(payload_file, "r") as f:
                payload = json.load(f)
        except Exception as e:
            console.print(f"[red]❌ Failed to load payload: {e}[/red]")
            return
    try:
        with console.status(f"[bold blue]Sending test webhook to {environment}..."):
            result = api.send_test_webhook(environment, payload)
        console.print(
            Panel.fit(
                f"✅ Test webhook sent. Response:\n{result}", title="Test Webhook"
            )
        )
    except APIError as e:
        console.print(f"[red]❌ Failed to send test webhook: {e}[/red]")
    except Exception as e:
        console.print(f"[red]❌ Unexpected error: {e}[/red]")


@monitor.command("replay")
@click.option("--webhook-id", "-w", required=True, help="ID of the webhook to replay")
@click.pass_context
def replay(ctx: click.Context, webhook_id: str) -> None:
    """Replay a specific webhook delivery."""
    config_data = ctx.obj.get("config")
    api = ctx.obj.get("api")
    if not config_data or not api:
        console.print("[red]❌ Not configured. Run 'daraja login' first.[/red]")
        return
    try:
        with console.status(f"[bold blue]Replaying webhook {webhook_id}..."):
            result = api.replay_webhook(webhook_id)
        console.print(Panel.fit(f"✅ Replay result:\n{result}", title="Replay Webhook"))
    except APIError as e:
        console.print(f"[red]❌ Failed to replay webhook: {e}[/red]")
    except Exception as e:
        console.print(f"[red]❌ Unexpected error: {e}[/red]")


@monitor.command("history")
@click.option("--limit", "-n", default=50, help="Number of history entries to show")
@click.option("--environment", "-e", help="Filter by environment")
@click.pass_context
def history(ctx: click.Context, limit: int, environment: str) -> None:
    """Browse webhook history."""
    config_data = ctx.obj.get("config")
    api = ctx.obj.get("api")
    if not config_data or not api:
        console.print("[red]❌ Not configured. Run 'daraja login' first.[/red]")
        return
    try:
        with console.status(f"[bold blue]Fetching webhook history..."):
            logs_data = api.get_webhook_logs(limit, environment)
        if not logs_data:
            console.print("[yellow]📝 No history entries found[/yellow]")
            return
        # Display reversed chronological history
        table = Table(show_header=True, header_style="bold magenta")
        table.add_column("Timestamp", style="dim", width=20)
        table.add_column("Environment", width=10)
        table.add_column("Status", justify="center", width=8)
        table.add_column("Webhook ID", style="dim")
        for log in reversed(logs_data):
            ts = datetime.fromisoformat(log.get("timestamp", ""))
            table.add_row(
                ts.strftime("%Y-%m-%d %H:%M:%S"),
                log.get("environment", "N/A"),
                log.get("status", "unknown"),
                log.get("webhook_id", "N/A"),
            )
        console.print(table)
        console.print(f"\n[dim]Showing {len(logs_data)} history entries[/dim]")
    except APIError as e:
        console.print(f"[red]❌ Failed to fetch history: {e}[/red]")
    except Exception as e:
        console.print(f"[red]❌ Unexpected error: {e}[/red]")


@monitor.command()
@click.option("--tail", "-f", is_flag=True, help="Follow logs in real-time")
@click.option("--limit", "-n", default=20, help="Number of log entries to show")
@click.option("--environment", "-e", help="Filter by environment")
@click.pass_context
def logs(ctx: click.Context, tail: bool, limit: int, environment: str) -> None:
    """Show webhook delivery logs."""
    config_data = ctx.obj.get("config")
    api = ctx.obj.get("api")

    if not config_data or not api:
        console.print("[red]❌ Not configured. Run 'daraja login' first.[/red]")
        return

    if tail:
        _follow_logs(api, environment)
    else:
        _show_logs(api, limit, environment)


def _show_logs(api: DarajaAPI, limit: int, environment: str) -> None:
    """Show recent logs."""
    try:
        with console.status("[bold blue]Fetching logs..."):
            logs_data = api.get_webhook_logs(limit, environment)

        if not logs_data:
            console.print("[yellow]📝 No logs found[/yellow]")
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
            timestamp = datetime.fromisoformat(log.get("timestamp", ""))
            time_str = timestamp.strftime("%H:%M:%S %d/%m")

            status = log.get("status", "unknown")
            if status == "delivered":
                status_icon = "✅"
                status_color = "green"
            elif status == "failed":
                status_icon = "❌"
                status_color = "red"
            elif status == "pending":
                status_icon = "⏳"
                status_color = "yellow"
            else:
                status_icon = "❓"
                status_color = "dim"

            response_code = log.get("response_code", "-")
            duration = f"{log.get('duration_ms', 0)}ms"
            webhook_id = log.get("webhook_id", "N/A")[:12] + "..."

            table.add_row(
                time_str,
                log.get("environment", "N/A"),
                f"[{status_color}]{status_icon}[/{status_color}]",
                str(response_code),
                duration,
                webhook_id,
            )

        console.print(table)
        console.print(f"\n[dim]Showing {len(logs_data)} most recent entries[/dim]")

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
                    log_time = datetime.fromisoformat(log.get("timestamp", ""))
                    if log_time > last_timestamp:
                        new_logs.append(log)
                        last_timestamp = log_time

                # Display new logs
                for log in reversed(new_logs):  # Show in chronological order
                    timestamp = datetime.fromisoformat(log.get("timestamp", ""))
                    time_str = timestamp.strftime("%H:%M:%S")

                    status = log.get("status", "unknown")
                    if status == "delivered":
                        status_icon = "✅"
                        status_color = "green"
                    elif status == "failed":
                        status_icon = "❌"
                        status_color = "red"
                    else:
                        status_icon = "⏳"
                        status_color = "yellow"

                    env = log.get("environment", "N/A")
                    response_code = log.get("response_code", "-")
                    duration = log.get("duration_ms", 0)

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
@click.option("--days", "-d", default=7, help="Number of days to show metrics for")
@click.pass_context
def metrics(ctx: click.Context, days: int) -> None:
    """Show detailed webhook metrics."""
    config_data = ctx.obj.get("config")
    api = ctx.obj.get("api")

    if not config_data or not api:
        console.print("[red]❌ Not configured. Run 'daraja login' first.[/red]")
        return

    try:
        with console.status(f"[bold blue]Fetching metrics for last {days} days..."):
            metrics_data = api.get_metrics(days)

        # Summary metrics
        console.print(
            Panel.fit(
                f"[bold]Metrics Summary (Last {days} days)[/bold]\n\n"
                f"[bold]Total Webhooks:[/bold] {metrics_data.get('total_webhooks', 0):,}\n"
                f"[bold]Successful:[/bold] [green]{metrics_data.get('successful', 0):,}[/green]\n"
                f"[bold]Failed:[/bold] [red]{metrics_data.get('failed', 0):,}[/red]\n"
                f"[bold]Success Rate:[/bold] {metrics_data.get('success_rate', 0):.2f}%\n\n"
                f"[bold]Avg Response Time:[/bold] {metrics_data.get('avg_response_time', 0):.0f}ms\n"
                f"[bold]Fastest Response:[/bold] {metrics_data.get('min_response_time', 0):.0f}ms\n"
                f"[bold]Slowest Response:[/bold] {metrics_data.get('max_response_time', 0):.0f}ms",
                title="Performance Metrics",
            )
        )

        # Error breakdown
        errors = metrics_data.get("error_breakdown", {})
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
        daily_stats = metrics_data.get("daily_stats", [])
        if daily_stats:
            console.print("\n[bold]Daily Activity:[/bold]")
            daily_table = Table(show_header=True, header_style="bold magenta")
            daily_table.add_column("Date", style="dim")
            daily_table.add_column("Webhooks", justify="right")
            daily_table.add_column("Success Rate", justify="right")
            daily_table.add_column("Avg Response", justify="right")

            for day_data in daily_stats[-7:]:  # Show last 7 days
                date = day_data.get("date", "N/A")
                webhooks = day_data.get("total_webhooks", 0)
                success_rate = day_data.get("success_rate", 0)
                avg_response = day_data.get("avg_response_time", 0)

                daily_table.add_row(
                    date, str(webhooks), f"{success_rate:.1f}%", f"{avg_response:.0f}ms"
                )

            console.print(daily_table)

    except APIError as e:
        console.print(f"[red]❌ Failed to fetch metrics: {e}[/red]")
    except Exception as e:
        console.print(f"[red]❌ Unexpected error: {e}[/red]")
