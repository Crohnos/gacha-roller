# Gacha Roller Project

This is a monorepo containing all components of the Gacha Roller game project:

## Project Structure

- `gacha-roller/` - Backend server (Express, SQLite)
- `gacha-web/` - Web frontend (React, TypeScript, TailwindCSS)
- `gacha-bot/` - Discord bot (Discord.js)

## Quick Start

1. Make sure you have [Bun](https://bun.sh/) installed
2. Add your API keys to the .env files:
   - `gacha-roller/.env` - Backend API keys
   - `gacha-bot/.env` - Discord bot token
3. Run the start script:
   ```bash
   ./gacha-roller/start-all.sh
   ```
4. Access the web app at http://localhost:5173

## API Keys Required

- Anthropic API key for generating card descriptions and CSS
- Hugging Face API key for generating card images
- Discord Bot token, ID, and public key

See each component's individual README for more detailed information:
- [Backend README](gacha-roller/README.md)
- [Web App README](gacha-web/README.md)
- [Discord Bot README](gacha-bot/README.md)