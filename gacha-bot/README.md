# Gacha Roller Discord Bot

A Discord bot interface for the Gacha Roller game, allowing users to roll for AI-generated cards, view their collections, and check the leaderboard directly in Discord.

## Features

- Use slash commands to interact with the Gacha Roller game
- Roll for unique AI-generated cards featuring famous AI characters
- View your card collection
- Check the global leaderboard
- Beautiful embeds with card images and descriptions

## Tech Stack

- **Discord.js** - Discord API integration
- **TypeScript** - Type safety
- **Axios** - API client
- **Bun** - Runtime

## Commands

- `/roll` - Roll a new card
- `/collection` - View your collected cards
- `/leaderboard` - See the top collectors

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) runtime
- Discord Bot Token (from [Discord Developer Portal](https://discord.com/developers/applications))
- Gacha Roller backend running

### Installation

```bash
cd gacha-bot
bun install
```

### Environment Setup

Create a `.env` file in the bot directory:

```
DISCORD_BOT_ID=your_discord_bot_id
DISCORD_PUBLIC_KEY=your_discord_public_key
DISCORD_BOT_TOKEN=your_discord_bot_token
```

### Running the Bot

```bash
bun run index.ts
```

## Adding to a Discord Server

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your application
3. Go to the "OAuth2" tab
4. In "URL Generator", select:
   - Scopes: `bot`, `applications.commands`
   - Bot Permissions: `Send Messages`, `Embed Links`, `Attach Files`
5. Copy the generated URL and open it in your browser
6. Select the server to add the bot to

## Backend API

The Discord bot communicates with the Gacha Roller backend API:

- `POST /roll` - Roll a new card
- `GET /collection/:user_id` - Get user's collection
- `GET /leaderboard` - Get global leaderboard