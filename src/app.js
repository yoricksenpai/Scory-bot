// Main application file
import { setupCommands } from './commands/index.js';
import { bot } from './config/bot.js';
import { connectToDatabase} from './config/database.js';

setupCommands();
connectToDatabase();
bot.on('polling_error', (error) => {
  console.log(error);
});

console.log('Bot is running...');