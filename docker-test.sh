# Set default GitHub Container Registry credentials if not already set
export GHCR_USERNAME="${GHCR_USERNAME:-<your username>}"
export GHCR_TOKEN="${GHCR_TOKEN:-<github personal access token>}"

docker_build_and_push() {
  if [[ -z "$GHCR_USERNAME" || -z "$GHCR_TOKEN" ]]; then
    echo "❌ GHCR_USERNAME and GHCR_TOKEN must be set as environment variables."
    return 1
  fi

  GHCR_REPO="ghcr.io/$GHCR_USERNAME"

  echo "🔑 Logging in to GitHub Container Registry (ghcr.io)..."
  echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USERNAME" --password-stdin || {
    echo "❌ GHCR login failed"; return 1;
  }

  # Monorepo root should be context for all builds
 
  echo "🐳 Building and pushing webhook-service image..."
  docker build -f webhook-service/Dockerfile \
    -t "$GHCR_REPO/darajadev-webhook-service:latest" . || return 1
  docker push "$GHCR_REPO/darajadev-webhook-service:latest" || return 1

  # echo "🐳 Building and pushing dashboard image..."
  # # docker builder prune --all
  # docker build -f dashboard/Dockerfile \
  #   -t "$GHCR_REPO/darajadev-dashboard:latest" . || return 1
  # docker push "$GHCR_REPO/darajadev-dashboard:latest" || return 1

  # echo "🐳 Building and pushing delivery-worker image..."
  # docker build -f delivery-worker/Dockerfile \
  #   -t "$GHCR_REPO/darajadev-delivery-worker:latest" . || return 1
  # docker push "$GHCR_REPO/darajadev-delivery-worker:latest" || return 1

#   echo "🐳 Building and pushing CLI image..."
#   docker build -f cli/Dockerfile \
#     -t "$GHCR_REPO/darajadev-cli:latest" . || return 1
#   docker push "$GHCR_REPO/darajadev-cli:latest" || return 1

  echo "✅ Docker images built and pushed to ghcr.io successfully."
}

docker_build_and_push

