// Main application file
import { setupCommands } from './commands/index.js';
import { bot } from './config/bot.js';
import './config/database.js';

setupCommands();

bot.on('polling_error', (error) => {
  console.log(error);
});

console.log('Bot is running...');