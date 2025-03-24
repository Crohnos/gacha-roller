# Gacha Roller Web App

A React-based web client for the Gacha Roller game, built with TypeScript, TailwindCSS, and Zustand.

## Features

- Roll for unique AI-generated cards featuring famous AI characters
- View your card collection
- Check the global leaderboard
- Responsive design with beautiful animations

## Tech Stack

- **React** - UI library
- **TypeScript** - Type safety
- **TailwindCSS** - Styling
- **Zustand** - State management
- **Framer Motion** - Animations
- **Axios** - API client
- **Vite** - Build tool

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) runtime
- Gacha Roller backend running

### Installation

```bash
cd gacha-web
bun install
```

### Running the Development Server

```bash
bun run dev
```

### Building for Production

```bash
bun run build
```

## Project Structure

- `/src` - Source code
  - `/components` - UI components
  - `/store.ts` - Zustand store
  - `App.tsx` - Main application component
  - `index.css` - Global styles with TailwindCSS

## Environment Variables

No environment variables are required for the web app directly, but the backend URL is configured in the store.ts file. By default, it connects to http://localhost:3000.

## Backend API

The web app communicates with the Gacha Roller backend API:

- `POST /roll` - Roll a new card
- `GET /collection/:user_id` - Get user's collection
- `GET /leaderboard` - Get global leaderboard