import { bot } from '../config/bot.js';
import * as activityService from '../services/activityService.js';
import * as teamService from '../services/teamService.js';
import * as statisticsService from '../services/statisticsService.js';
import * as exportService from '../services/exportService.js';
import * as feedbackService from '../services/feedbackService.js';
import * as timeService from '../services/timeService.js';


// Fonction utilitaire pour gérer les erreurs
const handleError = (chatId, error) => {
  console.error('Error:', error);
  bot.sendMessage(chatId, "Une erreur s'est produite. Veuillez réessayer plus tard.");
};

// Fonction utilitaire pour valider les paramètres
const validateParams = (chatId, params, expectedCount) => {
  if (params.length !== expectedCount) {
    bot.sendMessage(chatId, `Nombre de paramètres incorrect. Attendu : ${expectedCount}`);
    return false;
  }
  return true;
};


const commands = {
start: async (msg) => {
  const chatId = msg.chat.id;
  const welcomeMessage = `
Bienvenue sur Scory Bot!

Voici comment démarrer rapidement :

1. Créez une activité : /createactivity Nom de l'activité
2. Ajoutez un participant : /addparticipant ID_activité Nom du participant
3. Attribuez un score : /score ID_activité Nom_participant Score
4. Consultez le classement : /ranking ID_activité

Astuce : Pour les noms avec espaces, utilisez des guillemets. Ex : /createactivity "Course de relais"

Utilisez /help pour voir toutes les commandes disponibles.

Bon jeu !
  `;
  bot.sendMessage(chatId, welcomeMessage);
},


 createactivity: async (msg, match) => {
  const chatId = msg.chat.id;
  const activityName = match[1];
  
  if (!activityName) {
    return bot.sendMessage(chatId, "Veuillez fournir un nom pour l'activité.");
  }
  
  try {
    const newActivity = {
      name: activityName,
      participants: [],
      teams: [],
      subActivities: [],
      scores: {},
      duration: { type: 'indefinite' }
    };
    const result = await activityService.saveActivity(newActivity, chatId);
    bot.sendMessage(chatId, `Activité "${activityName}" créée avec succès! Son ID est ${result._id}`);
  } catch (error) {
    console.error('Error creating activity:', error);
    bot.sendMessage(chatId, "Désolé, une erreur s'est produite lors de la création de l'activité.");
  }
},

  addparticipant: async (msg, match) => {
    const chatId = msg.chat.id;
    const [activityId, participantName] = match.slice(1);
    
    if (!validateParams(chatId, [activityId, participantName], 2)) return;

    
    if (!activityId || !participantName) {
      return bot.sendMessage(chatId, "Veuillez fournir l'ID de l'activité et le nom du participant.");
    }
    
    try {
      const activity = await activityService.getActivity(activityId);
      if (!activity) {
        return bot.sendMessage(chatId, "Activité non trouvée.");
      }
      
      activity.participants.push(participantName);
      activity.scores[participantName] = 0;
      await activityService.updateActivity(activityId, { participants: activity.participants, scores: activity.scores });
      bot.sendMessage(chatId, `${participantName} a été ajouté à l'activité "${activity.name}".`);
    } catch (error) {
      console.error('Error adding participant:', error);
      bot.sendMessage(chatId, "Désolé, une erreur s'est produite lors de l'ajout du participant.");
    }
  },

 addsubactivity: async (msg, match) => {
    const chatId = msg.chat.id;
    const [activityId, subActivityName] = match.slice(1);
    
    if (!validateParams(chatId, [activityId, subActivityName], 2)) return;
    
    try {
      await activityService.addSubActivity(activityId, subActivityName, chatId);
      bot.sendMessage(chatId, `Sous-activité "${subActivityName}" ajoutée avec succès.`);
    } catch (error) {
      handleError(chatId, error);
    }
  },

 score: async (msg, match) => {
    const chatId = msg.chat.id;
    const [activityId, participantName, score] = match.slice(1);
    
    if (!validateParams(chatId, [activityId, participantName, score], 3)) return;
    
    try {
      await activityService.addScore(activityId, participantName, null, parseInt(score), chatId);
      bot.sendMessage(chatId, `Score de ${score} attribué à ${participantName}.`);
    } catch (error) {
      handleError(chatId, error);
    }
  },
  
   subscore: async (msg, match) => {
    const chatId = msg.chat.id;
    const [activityId, subActivityName, participantName, score] = match.slice(1);
    
    if (!validateParams(chatId, [activityId, subActivityName, participantName, score], 4)) return;
    
    try {
      await activityService.addScore(activityId, participantName, subActivityName, parseInt(score), chatId);
      bot.sendMessage(chatId, `Score de ${score} attribué à ${participantName} pour ${subActivityName}.`);
    } catch (error) {
      handleError(chatId, error);
    }
  },

ranking: async (msg, match) => {
    const chatId = msg.chat.id;
    const activityId = match[1];
    
    if (!validateParams(chatId, [activityId], 1)) return;
    
    try {
      const activity = await activityService.getActivity(activityId, chatId);
      const ranking = Object.entries(activity.scores)
        .sort((a, b) => b[1] - a[1])
        .map(([name, score], index) => `${index + 1}. ${name}: ${score}`);
      bot.sendMessage(chatId, `Classement pour "${activity.name}":\n\n${ranking.join('\n')}`);
    } catch (error) {
      handleError(chatId, error);
    }
  },
  
    subranking: async (msg, match) => {
    const chatId = msg.chat.id;
    const [, activityId, subActivityName] = match;
    
    if (!activityId || !subActivityName) {
      return bot.sendMessage(chatId, "Veuillez fournir l'ID de l'activité et le nom de la sous-activité.");
    }
    
    try {
      const activity = await getActivity(activityId);
      if (!activity) {
        return bot.sendMessage(chatId, "Activité non trouvée.");
      }
      
      const subActivity = activity.subActivities.find(sa => sa.name === subActivityName);
      
      if (!subActivity) {
        return bot.sendMessage(chatId, "Sous-activité non trouvée.");
      }
      
      let ranking = Object.entries(subActivity.scores)
        .sort((a, b) => b[1] - a[1])
        .map(([name, score], index) => `${index + 1}. ${name}: ${score}`);
      
      bot.sendMessage(chatId, `Classement pour la sous-activité "${subActivityName}":\n\n${ranking.join('\n')}`);
    } catch (error) {
      console.error('Error getting sub-activity ranking:', error);
      bot.sendMessage(chatId, "Désolé, une erreur s'est produite lors de la récupération du classement de la sous-activité.");
    }
  },

  activities: async (msg) => {
    const chatId = msg.chat.id;
    try {
      const activities = await activityService.getAllActivities(chatId);
      if (activities.length === 0) {
        return bot.sendMessage(chatId, "Aucune activité n'a été créée.");
      }
      const activityList = activities.map(a => `${a.name} (ID: ${a._id})`).join('\n');
      bot.sendMessage(chatId, `Liste des activités:\n\n${activityList}`);
    } catch (error) {
      handleError(chatId, error);
    }
  },


  createteam: async (msg, match) => {
    const chatId = msg.chat.id;
    const [activityId, teamName] = match.slice(1);
    
    if (!validateParams(chatId, [activityId, teamName], 2)) return;
    
    try {
      await teamService.createTeam(activityId, teamName, chatId);
      bot.sendMessage(chatId, `Équipe "${teamName}" créée avec succès!`);
    } catch (error) {
      handleError(chatId, error);
    }
  },

  addtoteam: async (msg, match) => {
    const chatId = msg.chat.id;
    const [activityId, teamName, participantName] = match.slice(1);
    
    if (!validateParams(chatId, [activityId, teamName, participantName], 3)) return;
    
    try {
      await teamService.addToTeam(activityId, teamName, participantName, chatId);
      bot.sendMessage(chatId, `${participantName} a été ajouté à l'équipe "${teamName}".`);
    } catch (error) {
      handleError(chatId, error);
    }
  },
  
  teamranking: async (msg, match) => {
    const chatId = msg.chat.id;
    const activityId = match[1];
    
    if (!validateParams(chatId, [activityId], 1)) return;
    
    try {
      const ranking = await teamService.getTeamRanking(activityId, chatId);
      const rankingString = ranking.map(({rank, name, score}) => `${rank}. ${name}: ${score}`).join('\n');
      bot.sendMessage(chatId, `Classement des équipes:\n\n${rankingString}`);
    } catch (error) {
      handleError(chatId, error);
    }
  },

  stats: async (msg, match) => {
    const chatId = msg.chat.id;
    const activityId = match[1];
    
    if (!validateParams(chatId, [activityId], 1)) return;
    
    try {
      const stats = await statisticsService.generateStatistics(activityId, chatId);
      const graph = await statisticsService.generateGraph(activityId, chatId);
      bot.sendMessage(chatId, `Statistiques de l'activité:\n\n${stats}`);
      bot.sendPhoto(chatId, graph);
    } catch (error) {
      handleError(chatId, error);
    }
  },

  export: async (msg, match) => {
    const chatId = msg.chat.id;
    const activityId = match[1];
    
    if (!validateParams(chatId, [activityId], 1)) return;
    
    try {
      const exportData = await exportService.exportActivityData(activityId, chatId);
      bot.sendDocument(chatId, Buffer.from(JSON.stringify(exportData)), {
        filename: `activity_${activityId}_export.json`
      });
    } catch (error) {
      handleError(chatId, error);
    }
  },

  feedback: async (msg, match) => {
    const chatId = msg.chat.id;
    const [activityId, feedbackMessage] = match.slice(1);
    
    if (!validateParams(chatId, [activityId, feedbackMessage], 2)) return;
    
    try {
      await feedbackService.saveFeedback(activityId, msg.from.username, feedbackMessage, chatId);
      bot.sendMessage(chatId, "Merci pour votre feedback!");
    } catch (error) {
      handleError(chatId, error);
    }
  },

  history: async (msg) => {
    const chatId = msg.chat.id;
    try {
      const history = await activityService.getCompletedActivities(chatId);
      const historyString = history.map(a => `${a.name} (ID: ${a._id})`).join('\n');
      bot.sendMessage(chatId, `Historique des activités terminées:\n\n${historyString}`);
    } catch (error) {
      handleError(chatId, error);
    }
  },

  starttimer: async (msg, match) => {
    const chatId = msg.chat.id;
    const [activityId, duration] = match.slice(1);
    
    if (!validateParams(chatId, [activityId, duration], 2)) return;
    
    try {
      await timeService.startTimer(activityId, parseInt(duration), chatId);
      bot.sendMessage(chatId, `Minuteur démarré pour ${duration} minutes.`);
    } catch (error) {
      handleError(chatId, error);
    }
  },

  stoptimer: async (msg, match) => {
    const chatId = msg.chat.id;
    const activityId = match[1];
    
    if (!validateParams(chatId, [activityId], 1)) return;
    
    try {
      await timeService.stopTimer(activityId, chatId);
      bot.sendMessage(chatId, "Minuteur arrêté.");
    } catch (error) {
      handleError(chatId, error);
    }
  },


  help: async (msg) => {
    const chatId = msg.chat.id;
    const helpMessage = `
Guide utilisateur Scory Bot

Commandes principales :

Gestion des activités :
/createactivity - Créer une activité
/addsubactivity - Ajouter une sous-activité
/activities - Lister toutes les activités

Participants et scores :
/addparticipant - Ajouter un participant
/score - Attribuer un score (activité principale)
/subscore - Attribuer un score (sous-activité)

Classements :
/ranking - Classement général
/subranking - Classement d'une sous-activité

Équipes :
/createteam - Créer une équipe
/addtoteam - Ajouter un participant à une équipe
/teamranking - Voir le classement des équipes

Outils supplémentaires :
/stats - Statistiques d'une activité
/export - Exporter les données
/feedback - Donner un feedback
/history - Historique des activités
/starttimer - Démarrer un minuteur
/stoptimer - Arrêter le minuteur

Astuce : Pour les noms avec espaces, utilisez des guillemets. Ex : /createactivity "Course de relais"
    `;
    bot.sendMessage(chatId, helpMessage);
  },
};

export const setupCommands = () => {
  bot.onText(/\/start/, commands.start);
  bot.onText(/\/createactivity (.+)/, commands.createactivity);
  bot.onText(/\/addparticipant (\S+) (.+)/, commands.addparticipant);
  bot.onText(/\/addsubactivity (\S+) (.+)/, commands.addsubactivity);
  bot.onText(/\/score (\S+) (\S+) (\d+)/, commands.score);
  bot.onText(/\/subscore (\S+) (\S+) (\S+) (\d+)/, commands.subscore);
  bot.onText(/\/ranking (\S+)/, commands.ranking);
  bot.onText(/\/activities/, commands.activities);
  bot.onText(/\/createteam (\S+) (.+)/, commands.createteam);
  bot.onText(/\/addtoteam (\S+) (\S+) (.+)/, commands.addtoteam);
  bot.onText(/\/teamranking (\S+)/, commands.teamranking);
  bot.onText(/\/stats (\S+)/, commands.stats);
  bot.onText(/\/export (\S+)/, commands.export);
  bot.onText(/\/feedback (\S+) (.+)/, commands.feedback);
  bot.onText(/\/history/, commands.history);
  bot.onText(/\/starttimer (\S+) (\d+)/, commands.starttimer);
  bot.onText(/\/stoptimer (\S+)/, commands.stoptimer);
  bot.onText(/\/help/, commands.help);
};