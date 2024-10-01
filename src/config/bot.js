import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Charger les variables d'environnement
dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error('TELEGRAM_BOT_TOKEN is not set in the environment variables');
  process.exit(1);
}

// Options du bot
const botOptions = {
  polling: true,
  // Vous pouvez ajouter d'autres options ici si nécessaire
};

// Créer le bot
export const bot = new TelegramBot(token, botOptions);

// Définir les commandes du bot
const commands = [
  { command: '/start', description: 'Démarrer le bot' },
  { command: '/createactivity', description: 'Créer une nouvelle activité' },
  { command: '/addparticipant', description: 'Ajouter un participant à une activité' },
  { command: '/addsubactivity', description: 'Ajouter une sous-activité' },
  { command: '/score', description: 'Attribuer un score à une activité' },
  { command: '/subscore', description: 'Attribuer un score à une sous-activité' },
  { command: '/ranking', description: "Voir le classement d'une activité" },
  { command: '/subranking', description: "Voir le classement d'une sous-activité" },
  { command: '/activities', description: 'Lister toutes les activités' },
  { command: '/createteam', description: 'Créer une équipe' },
  { command: '/addtoteam', description: 'Ajouter un participant à une équipe' },
  { command: '/teamranking', description: 'Voir le classement des équipes' },
  { command: '/stats', description: 'Générer des statistiques sur une activité' },
  { command: '/export', description: "Exporter les données d'une activité" },
  { command: '/feedback', description: 'Donner un feedback sur une activité' },
  { command: '/history', description: "Voir l'historique des activités terminées" },
  { command: '/starttimer', description: 'Démarrer un minuteur pour une activité' },
  { command: '/stoptimer', description: "Arrêter le minuteur d'une activité" },
  { command: '/help', description: "Afficher l'aide" }
];

// Fonction pour configurer le bot
export async function setupBot() {
  try {
    // Définir les commandes du bot
    await bot.setMyCommands(commands);
    console.log('Bot commands set successfully');

    // Configurer les gestionnaires d'erreurs
    bot.on('polling_error', (error) => {
      console.error('Polling error:', error);
    });

    bot.on('error', (error) => {
      console.error('Bot error:', error);
    });

    console.log('Bot setup completed successfully');
  } catch (error) {
    console.error('Error setting up bot:', error);
    throw error;
  }
}

// Fonction pour obtenir la liste des commandes
export function getCommands() {
  return commands;
}

// Fonction pour sauvegarder les commandes dans un fichier JSON
export function saveCommandsToFile() {
  const commandsJson = JSON.stringify(commands, null, 2);
  const filePath = path.join(process.cwd(), 'bot_commands.json');
  
  fs.writeFile(filePath, commandsJson, (err) => {
    if (err) {
      console.error('Error saving commands to file:', err);
    } else {
      console.log('Commands saved to bot_commands.json');
    }
  });
}