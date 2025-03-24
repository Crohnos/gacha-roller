# Gacha Project GitHub Pages Deployment

This repository is set up to automatically deploy the Gacha Web application to GitHub Pages at https://crohnos.github.io/gacha-roller/ whenever changes are pushed to the master branch.

## Deployment Details

- The web application is built using Vite and React
- Deployment is handled by GitHub Actions
- The workflow is defined in `.github/workflows/deploy-gh-pages.yml`
- The deployed site is available at https://crohnos.github.io/gacha-roller/

## Configuration

- The base path is set to `/gacha-roller/` in the Vite configuration
- API URLs are configured via environment variables:
  - Development: Uses `http://localhost:3000`
  - Production: Uses the URL configured in `.env.production`

## Development Setup

1. Clone the repository
2. Install dependencies:
   ```
   cd gacha-web
   bun install
   ```
3. Start the development server:
   ```
   bun run dev
   ```

## Manual Deployment

While the GitHub Actions workflow automatically handles deployment, you can also manually trigger it:

1. Go to the GitHub repository
2. Click on "Actions"
3. Select the "Deploy to GitHub Pages" workflow
4. Click "Run workflow"