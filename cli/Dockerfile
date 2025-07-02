# syntax=docker/dockerfile:1
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies for building Python packages (e.g., for psycopg2, numpy, etc.)
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy only the CLI project and shared packages (assuming monorepo structure)
COPY ./cli /app

# Optionally copy shared modules if CLI depends on them
# COPY ./shared /app/shared

# Install Python dependencies
RUN pip install --upgrade pip && \
    pip install -e .

# Set entrypoint (adjust `daraja_cli.main` if needed)
ENTRYPOINT ["python", "-m", "daraja_cli.main"]
