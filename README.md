# Gacha Roller Project

A gacha-style game where players roll for uniquely generated AI cards featuring famous AI characters from fiction. Each card has AI-generated images and descriptions that reimagine these characters in alternate universes with creative twists.

## Project Structure

This monorepo contains all components of the Gacha Roller game project:

- `gacha-roller/` - Backend server (Express, SQLite, Bun runtime)
- `gacha-web/` - Web frontend (React, TypeScript, PicoCSS, Vite)
- `gacha-bot/` - Discord bot (Discord.js)

## Key Features

- **AI-Generated Content**: Images via Stable Diffusion and descriptions via Claude AI
- **Rarity System**: Common (90%), Rare (9%), Epic (0.9%), Legendary (0.1%), Mythic (0.0001%)
- **Client-Side Storage**: Collections stored in localStorage with 24-hour session tracking
- **Responsive UI**: Full-screen card display with animations
- **Discord Integration**: Roll cards directly through a Discord bot

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

- **Anthropic API Key** (Claude 3.5 Sonnet): For generating card descriptions and enhancements
- **Hugging Face API Key**: For generating card images using Stable Diffusion 3.5
- **Discord Bot Credentials**: Token, ID, and public key (for Discord bot only)

## Recent Updates

- Simplified image generation with a focused 4-element prompt structure
- Enhanced card display to show full images with improved scrollable content
- Switched to client-side storage with 24-hour sessions
- Improved error handling with custom error images

See each component's individual README for more detailed information:
- [Backend README](gacha-roller/README.md)
- [Web App README](gacha-web/README.md)
- [Discord Bot README](gacha-bot/README.md)