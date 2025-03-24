# Gacha Roller

A unique gacha-style game where players roll for cards with extremely low probabilities for certain outcomes, mimicking a lottery system. Each card is uniquely generated using AI technologies and features famous AI characters from movies, TV, and fiction (e.g., C-3PO, HAL 9000) reimagined in alternate universes with creative twists.

## Project Structure

The project consists of three main components:

1. **Backend**: A Bun/Express API server with SQLite database
2. **Web App**: A React frontend using TypeScript, TailwindCSS, and Zustand
3. **Discord Bot**: A Discord.js bot for interacting with the game through Discord

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) runtime
- Discord Bot credentials
- Anthropic API key
- Hugging Face API key

### Environment Setup

Create `.env` files in the appropriate directories:

#### Backend (.env)
```
DISCORD_BOT_ID=your_discord_bot_id
DISCORD_PUBLIC_KEY=your_discord_public_key
DISCORD_BOT_TOKEN=your_discord_bot_token
ANTHROPIC_API_KEY=your_anthropic_key
HUGGING_FACE_API_KEY=your_hugging_face_key
```

#### Discord Bot (.env)
```
DISCORD_BOT_ID=your_discord_bot_id
DISCORD_PUBLIC_KEY=your_discord_public_key
DISCORD_BOT_TOKEN=your_discord_bot_token
```

### Installation & Running

#### Backend
```bash
cd gacha-roller
bun install
bun run index.ts
```

#### Web App
```bash
cd gacha-web
bun install
bun run dev
```

#### Discord Bot
```bash
cd gacha-bot
bun install
bun run index.ts
```

## Features

### Card Content
- **AI-Generated Image**: Via Hugging Face's Stable Diffusion API with random enhancements
- **AI-Generated Description**: Via Anthropic's API, crafting alternate-universe stories
- **AI-Generated TailwindCSS**: Via Anthropic's API, creating unique card frames
- **Rarity System**: Extreme probabilities for certain cards (1 in a million for mythic)

### Web App
- Interactive UI with animations
- Roll cards with a single click
- View your collection
- Check the global leaderboard

### Discord Bot
- `/roll` - Roll a new card
- `/collection` - View your collected cards
- `/leaderboard` - See the top collectors

## Rarity Tiers

| Rarity    | Probability | Points   | Enhancements |
|-----------|-------------|----------|--------------|
| Common    | 90%         | 1        | 2            |
| Rare      | 9%          | 10       | 3            |
| Epic      | 0.9%        | 100      | 4            |
| Legendary | 0.1%        | 1,000    | 5            |
| Mythic    | 0.0001%     | 10,000   | 6            |

## Technologies Used

- **Backend**: Bun, Express, SQLite, Winston (logging)
- **Web App**: React, TypeScript, TailwindCSS, Zustand, Framer Motion
- **Discord Bot**: Discord.js
- **AI APIs**: Anthropic Claude, Hugging Face Stable Diffusion

## License

This project is for educational purposes only.