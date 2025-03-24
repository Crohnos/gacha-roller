// index.ts
import serverPromise from './server';

// Start the server and properly handle errors
console.log('Starting Gacha Roller server...');

// Explicitly catch and log server startup errors
serverPromise.catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1); // Exit with error code
});

// Handle any other unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});