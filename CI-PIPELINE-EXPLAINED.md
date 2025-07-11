# CI Pipeline Documentation

This document explains the CI pipeline defined in `.github/workflows/ci.yml` for the darajadevToolkit monorepo. It covers the workflow structure, requirements for a successful run, and common reasons for Docker build/push failures.

---

## Pipeline Overview

The pipeline is triggered on any push to any branch and on pull requests to `main` or `develop`.

### Main Jobs
- **test**: Runs all tests, linting, and builds for all services (dashboard, webhook-service, cli, delivery-worker).
- **lint-and-format**: Checks code formatting and linting for JS/TS and Python code.
- **detect-changes**: Detects which top-level service directories have changed since the last commit.
- **build-and-push-docker**: Builds and pushes Docker images for only the changed services, but only on the `main` or `CI/CD-Pipeline` branches.

---

## What Developers Need for the Pipeline to Succeed

### 1. **Dockerfiles**
- Each service (`dashboard`, `webhook-service`, `cli`, `delivery-worker`) must have a valid `Dockerfile` at the root of its directory (e.g., `dashboard/Dockerfile`).

### 2. **Build Context**
- The build context is the monorepo root (`.`). Each Dockerfile must be written to expect this context, or copy only what it needs from the context.

### 3. **Lockfiles**
- Node projects must have both `package.json` and `package-lock.json` (or `bun.lock` for Bun projects) committed.
- Python projects must have `requirements.txt` or equivalent.

### 4. **GitHub Secrets**
- The repository must have a secret named `GHCR_TOKEN` with `write:packages` scope for pushing to GitHub Container Registry (ghcr.io).

### 5. **Repository Owner**
- The pipeline automatically converts the repository owner to lowercase for Docker image tags and registry login, as required by ghcr.io.

### 6. **Branch**
- Docker build and push only runs on `main` or `CI/CD-Pipeline` branches.

---

## Pipeline Steps (Image Build & Push)

1. **detect-changes** job determines which services have changed.
2. **build-and-push-docker** job runs for each service in a matrix, but only if that service changed.
3. The job:
   - Checks out the code.
   - Sets up Docker Buildx.
   - Converts the repository owner to lowercase for image naming.
   - Logs in to GitHub Container Registry using the lowercase owner and `GHCR_TOKEN`.
   - Builds the Docker image for the service using its Dockerfile and the monorepo root as context.
   - Pushes the image to `ghcr.io/<owner>/darajadev-<service>:latest`.

---

## Common Reasons Docker Build/Push May Fail

1. **Missing or Invalid Dockerfile**
   - The service directory must contain a valid `Dockerfile`.
   - The build step will fail if the Dockerfile is missing or has errors.

2. **Missing Lockfiles**
   - For Node projects, `package-lock.json` (or `bun.lock`) must exist and be in sync with `package.json`.
   - For Python, `requirements.txt` or equivalent must exist.

3. **Build Context Issues**
   - If the Dockerfile expects files that are not present in the build context, the build will fail.
   - Make sure all necessary files are included and not excluded by `.dockerignore`.

4. **Dependency Installation Errors**
   - Errors in `npm ci`, `bun install`, or `pip install` will cause the build to fail.
   - Out-of-sync lockfiles or missing dependencies are common culprits.

5. **Authentication Issues**
   - If `GHCR_TOKEN` is missing, invalid, or lacks `write:packages` scope, Docker login or push will fail.

6. **Image Tag/Name Issues**
   - ghcr.io requires lowercase image names and owner. The pipeline handles this, but manual overrides may cause issues.

7. **Branch Restrictions**
   - The build-and-push-docker job only runs on `main` or `CI/CD-Pipeline`. Other branches will not trigger image builds/pushes.

8. **Rate Limiting or Quota**
   - GitHub Container Registry may rate-limit or block pushes if quota is exceeded.

---

## Troubleshooting
- Check the Actions tab for detailed logs if a build or push fails.
- Ensure all required files and secrets are present and up to date.
- Test Docker builds locally using the same context and Dockerfile as the pipeline.

---

For further help, contact the repository maintainers or check the GitHub Actions and Docker documentation.
