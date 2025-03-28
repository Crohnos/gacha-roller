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
- Client-side storage: Collections stored in localStorage with 24-hour expiry

## AI Integration Notes
- **Image Generation**: Uses a simplified 4-element prompt structure:
  1. Character Name (e.g., "T-800")
  2. Character's Franchise (e.g., "The Terminator")
  3. Single Wacky Alternate-Universe Twist (e.g., "wearing a cowboy hat")
  4. Positive/Negative Language (e.g., "highly detailed, ultra realistic, not cartoonish, not colorful")
- **Image Display**: Cards now show the full image using 'object-fit: contain' with an adjusted aspect ratio
- **Text Generation**: Uses Claude 3.5 Sonnet model with creative writing-focused prompts
- **Error Handling**: Proper error handling with custom error images and retry mechanisms
- **No Fallbacks**: All content is generated via AI - no fallback texts or placeholder images

## Recent Architectural Changes
- Removed authentication mechanism in favor of simplified client-side storage
- Enhanced card display for better visibility of full images
- Simplified image generation prompts for more direct and effective results
- Added custom error images instead of generic placeholders
- Implemented retry mechanisms instead of fallbacks for AI generation