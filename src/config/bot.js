import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;

export const bot = new TelegramBot(token, { polling: true });

bot.setMyCommands([
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
]);