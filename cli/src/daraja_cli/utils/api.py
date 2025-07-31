"""
API client for Daraja Developer Toolkit
"""

import requests
from typing import Dict, Any, Optional, List
import json


class APIError(Exception):
    """API related errors"""

    pass


class DarajaAPI:
    """Client for Daraja API"""

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.api_url = config.get("api_url", "https://api.daraja-toolkit.com")
        self.api_key = config.get("api_key")
        self.user_id = config.get("user_id")

        if not self.api_key:
            raise APIError("API key not configured")

    def _get_headers(self) -> Dict[str, str]:
        """Get standard headers for API requests."""
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "User-Agent": "Daraja-CLI/0.1.0",
        }

    def _make_request(
        self, method: str, endpoint: str, data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Make an API request."""
        url = f"{self.api_url}{endpoint}"
        headers = self._get_headers()

        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=headers, timeout=30)
            elif method.upper() == "POST":
                response = requests.post(url, headers=headers, json=data, timeout=30)
            elif method.upper() == "PUT":
                response = requests.put(url, headers=headers, json=data, timeout=30)
            elif method.upper() == "DELETE":
                response = requests.delete(url, headers=headers, timeout=30)
            else:
                raise APIError(f"Unsupported HTTP method: {method}")

            # Handle response
            if response.status_code == 401:
                raise APIError("Authentication failed. Please check your API key.")
            elif response.status_code == 403:
                raise APIError("Access forbidden. Please check your permissions.")
            elif response.status_code == 404:
                raise APIError("Resource not found.")
            elif response.status_code >= 500:
                raise APIError("Server error. Please try again later.")
            elif response.status_code >= 400:
                try:
                    error_data = response.json()
                    error_message = error_data.get("message", "Unknown error")
                    raise APIError(f"API error: {error_message}")
                except json.JSONDecodeError:
                    raise APIError(f"API error: HTTP {response.status_code}")

            # Success response
            if response.status_code == 204:
                return {}

            return response.json()

        except requests.exceptions.ConnectionError:
            raise APIError("Connection failed. Please check your internet connection.")
        except requests.exceptions.Timeout:
            raise APIError("Request timed out. Please try again.")
        except requests.exceptions.RequestException as e:
            raise APIError(f"Network error: {e}")

    def get_user_info(self) -> Dict[str, Any]:
        """Get current user information."""
        return self._make_request("GET", "/user/me")

    def get_webhook_status(self) -> Dict[str, Any]:
        """Get webhook status and statistics."""
        return self._make_request("GET", f"/user/{self.user_id}/webhook/status")

    def get_webhook_logs(
        self, limit: int = 50, environment: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get webhook delivery logs."""
        params = {"limit": limit}
        if environment:
            params["environment"] = environment

        endpoint = f"/user/{self.user_id}/webhook/logs"
        if params:
            query_string = "&".join([f"{k}={v}" for k, v in params.items()])
            endpoint += f"?{query_string}"

        response = self._make_request("GET", endpoint)
        return response.get("logs", [])

    def send_test_webhook(
        self, environment: str, payload: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Send a test webhook to the specified environment."""
        data = {"environment": environment, "payload": payload}
        return self._make_request("POST", f"/user/{self.user_id}/webhook/test", data)

    def update_endpoint(self, environment: str, url: str) -> Dict[str, Any]:
        """Update endpoint URL for an environment."""
        data = {"environment": environment, "url": url}
        return self._make_request("PUT", f"/user/{self.user_id}/endpoints", data)

    def get_environments(self) -> List[Dict[str, Any]]:
        """Get all configured environments."""
        response = self._make_request("GET", f"/user/{self.user_id}/environments")
        return response.get("environments", [])

    def get_metrics(self, days: int = 7) -> Dict[str, Any]:
        """Get webhook metrics for the specified number of days."""
        endpoint = f"/user/{self.user_id}/metrics?days={days}"
        return self._make_request("GET", endpoint)

    def replay_webhook(self, webhook_id: str) -> Dict[str, Any]:
        """Replay a specific webhook delivery."""
        data = {"webhook_id": webhook_id}
        return self._make_request("POST", f"/user/{self.user_id}/webhook/replay", data)
