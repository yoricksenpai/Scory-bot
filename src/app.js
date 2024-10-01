import { setupCommands } from './commands/index.js';
import { bot } from './config/bot.js';
import { connectToDatabase } from './config/database.js';

async function startApp() {
  try {
    await connectToDatabase();
    console.log('Connected to database successfully');

    setupCommands();
    console.log('Commands set up successfully');

    bot.on('polling_error', (error) => {
      console.error('Polling error:', error);
    });

    console.log('Bot is running...');
  } catch (error) {
    console.error('Failed to start the application:', error);
    process.exit(1);
  }
}

startApp();

// Gestion des erreurs non capturées
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});