# CLAUDE.md - Gacha Project Guide

## Commands
- **Project Startup**: `./gacha-roller/start-all.sh` (starts all components)
- **Backend**: `cd gacha-roller && bun run index.ts`
- **Web App**: `cd gacha-web && bun run dev`
- **Discord Bot**: `cd gacha-bot && bun run index.ts`
- **Web Build/Lint**: `cd gacha-web && bun run build` / `bun run lint`

## Code Style Guidelines
- **TypeScript**: Strict type checking enabled, avoid `any` and use proper interfaces
- **React**: Function components with hooks, export as named exports
- **Imports**: Group by type (React, libraries, local modules)
- **Formatting**: 2-space indentation, semicolons required
- **Error Handling**: Use try/catch in async functions, proper error logging
- **Logging**: Use logger instances (winston in backend) with appropriate levels
- **Naming**: camelCase for variables/functions, PascalCase for components/classes
- **State Management**: Zustand for global state, React hooks for component state
- **CSS**: PicoCSS for basic styling, with custom CSS in global stylesheet

## Architecture
- Monorepo with microservices (backend, web app, Discord bot)
- Backend: Express + SQLite using Bun runtime
- Frontend: React, TypeScript, PicoCSS with Vite
- Discord Bot: Discord.js with TypeScript

## AI Integration Notes
- **Image paths**: Card images are stored in `/cards` directory and served via both `/cards` and `/images` routes
- **Text generation**: When requesting text from Claude, be explicit about wanting ONLY the content with no commentary
- **Styling**: Cards use PicoCSS with custom styles defined in index.css (no AI-generated CSS)