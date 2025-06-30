# Dockerfile for darajadevToolkit CLI
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies (if any needed for your CLI)
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy CLI source code
COPY . .

# Install Python dependencies globally
RUN pip install --upgrade pip \
    && pip install -e .

# Set entrypoint for the CLI (replace 'daraja' with your actual CLI command if different)
ENTRYPOINT ["python", "-m", "daraja_cli.main"]
