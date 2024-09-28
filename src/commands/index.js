import { bot } from '../config/bot.js';
import { saveActivity, getActivity, updateActivity, getAllActivities, getCompletedActivities } from '../services/activityService.js';
import { createTeam, addToTeam, getTeamRanking } from '../services/teamService.js';
import { generateStatistics, generateGraph } from '../services/statisticsService.js';
import { exportActivityData } from '../services/exportService.js';
import { saveFeedback } from '../services/feedbackService.js';
import { startTimer, stopTimer } from '../services/timeService.js';


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
      const result = await saveActivity(newActivity);
      bot.sendMessage(chatId, `Activité "${activityName}" créée avec succès! Son ID est ${result._id}`);
    } catch (error) {
      console.error('Error creating activity:', error);
      bot.sendMessage(chatId, "Désolé, une erreur s'est produite lors de la création de l'activité.");
    }
  },

  addparticipant: async (msg, match) => {
    const chatId = msg.chat.id;
    const [ activityId, participantName] = match;
    
    if (!activityId || !participantName) {
      return bot.sendMessage(chatId, "Veuillez fournir l'ID de l'activité et le nom du participant.");
    }
    
    try {
      const activity = await getActivity(activityId);
      if (!activity) {
        return bot.sendMessage(chatId, "Activité non trouvée.");
      }
      
      activity.participants.push(participantName);
      activity.scores[participantName] = 0;
      await updateActivity(activityId, { participants: activity.participants, scores: activity.scores });
      bot.sendMessage(chatId, `${participantName} a été ajouté à l'activité "${activity.name}".`);
    } catch (error) {
      console.error('Error adding participant:', error);
      bot.sendMessage(chatId, "Désolé, une erreur s'est produite lors de l'ajout du participant.");
    }
  },

  addsubactivity: async (msg, match) => {
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
      
      activity.subActivities.push({ name: subActivityName, scores: {} });
      await updateActivity(activityId, { subActivities: activity.subActivities });
      bot.sendMessage(chatId, `Sous-activité "${subActivityName}" ajoutée à l'activité "${activity.name}".`);
    } catch (error) {
      console.error('Error adding sub-activity:', error);
      bot.sendMessage(chatId, "Désolé, une erreur s'est produite lors de l'ajout de la sous-activité.");
    }
  },

  score: async (msg, match) => {
    const chatId = msg.chat.id;
    const [, activityId, participantName, score] = match;
    
    if (!activityId || !participantName || !score) {
      return bot.sendMessage(chatId, "Veuillez fournir l'ID de l'activité, le nom du participant et le score.");
    }
    
    try {
      const activity = await getActivity(activityId);
      if (!activity) {
        return bot.sendMessage(chatId, "Activité non trouvée.");
      }
      
      if (!activity.participants.includes(participantName)) {
        return bot.sendMessage(chatId, "Participant non trouvé dans cette activité.");
      }
      
      activity.scores[participantName] = parseInt(score);
      await updateActivity(activityId, { scores: activity.scores });
      bot.sendMessage(chatId, `Score de ${score} attribué à ${participantName} pour l'activité "${activity.name}".`);
    } catch (error) {
      console.error('Error scoring:', error);
      bot.sendMessage(chatId, "Désolé, une erreur s'est produite lors de l'attribution du score.");
    }
    },
  
    subscore: async (msg, match) => {
    const chatId = msg.chat.id;
    const [, activityId, subActivityName, participantName, score] = match;
    
    if (!activityId || !subActivityName || !participantName || !score) {
      return bot.sendMessage(chatId, "Veuillez fournir tous les paramètres nécessaires.");
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
      
      if (!activity.participants.includes(participantName)) {
        return bot.sendMessage(chatId, "Participant non trouvé dans cette activité.");
      }
      
      subActivity.scores[participantName] = parseInt(score);
      await updateActivity(activityId, { subActivities: activity.subActivities });
      bot.sendMessage(chatId, `Score de ${score} attribué à ${participantName} pour ${subActivityName}.`);
    } catch (error) {
      console.error('Error scoring sub-activity:', error);
      bot.sendMessage(chatId, "Désolé, une erreur s'est produite lors de l'attribution du score pour la sous-activité.");
    }
  },

  ranking: async (msg, match) => {
    const chatId = msg.chat.id;
    const activityId = match[1];
    
    if (!activityId) {
      return bot.sendMessage(chatId, "Veuillez fournir l'ID de l'activité.");
    }
    
    try {
      const activity = await getActivity(activityId);
      if (!activity) {
        return bot.sendMessage(chatId, "Activité non trouvée.");
      }
      
      let totalScores = { ...activity.scores };
      activity.subActivities.forEach(sa => {
        Object.entries(sa.scores).forEach(([participant, score]) => {
          totalScores[participant] = (totalScores[participant] || 0) + score;
        });
      });
      
      let ranking = Object.entries(totalScores)
        .sort((a, b) => b[1] - a[1])
        .map(([name, score], index) => `${index + 1}. ${name}: ${score}`);
      
      bot.sendMessage(chatId, `Classement pour "${activity.name}":\n\n${ranking.join('\n')}`);
    } catch (error) {
      console.error('Error getting ranking:', error);
      bot.sendMessage(chatId, "Désolé, une erreur s'est produite lors de la récupération du classement.");
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
      const activities = await getAllActivities();
      if (activities.length === 0) {
        return bot.sendMessage(chatId, "Aucune activité n'a été créée.");
      }
      const activityList = activities.map(a => `${a.name} (ID: ${a._id})`).join('\n');
      bot.sendMessage(chatId, `Liste des activités:\n\n${activityList}`);
    } catch (error) {
      console.error('Error listing activities:', error);
      bot.sendMessage(chatId, "Désolé, une erreur s'est produite lors de la récupération des activités.");
    }
  },

  createteam: async (msg, match) => {
    const chatId = msg.chat.id;
    const teamName = match[1];
    
    if (!teamName) {
      return bot.sendMessage(chatId, "Veuillez fournir un nom pour l'équipe.");
    }
    
    try {
      const result = await createTeam(teamName);
      bot.sendMessage(chatId, `Équipe "${teamName}" créée avec succès! Son ID est ${result._id}`);
    } catch (error) {
      console.error('Error creating team:', error);
      bot.sendMessage(chatId, "Désolé, une erreur s'est produite lors de la création de l'équipe.");
    }
  },

  addtoteam: async (msg, match) => {
    const chatId = msg.chat.id;
    const [, teamId, participantName] = match;
    
    if (!teamId || !participantName) {
      return bot.sendMessage(chatId, "Veuillez fournir l'ID de l'équipe et le nom du participant.");
    }
    
    try {
      await addToTeam(teamId, participantName);
      bot.sendMessage(chatId, `${participantName} a été ajouté à l'équipe.`);
    } catch (error) {
      console.error('Error adding to team:', error);
      bot.sendMessage(chatId, "Désolé, une erreur s'est produite lors de l'ajout du participant à l'équipe.");
    }
  },

  teamranking: async (msg, match) => {
    const chatId = msg.chat.id;
    const activityId = match[1];
    
    if (!activityId) {
      return bot.sendMessage(chatId, "Veuillez fournir l'ID de l'activité.");
    }
    
    try {
      const ranking = await getTeamRanking(activityId);
      bot.sendMessage(chatId, `Classement des équipes:\n\n${ranking.join('\n')}`);
    } catch (error) {
      console.error('Error getting team ranking:', error);
      bot.sendMessage(chatId, "Désolé, une erreur s'est produite lors de la récupération du classement des équipes.");
    }
  },

  stats: async (msg, match) => {
    const chatId = msg.chat.id;
    const activityId = match[1];
    
    if (!activityId) {
      return bot.sendMessage(chatId, "Veuillez fournir l'ID de l'activité.");
    }
    
    try {
      const stats = await generateStatistics(activityId);
      const graph = await generateGraph(activityId);
      bot.sendMessage(chatId, `Statistiques de l'activité:\n\n${stats}`);
      bot.sendPhoto(chatId, graph);
    } catch (error) {
      console.error('Error generating stats:', error);
      bot.sendMessage(chatId, "Désolé, une erreur s'est produite lors de la génération des statistiques.");
    }
  },

  export: async (msg, match) => {
    const chatId = msg.chat.id;
    const activityId = match[1];
    
    if (!activityId) {
      return bot.sendMessage(chatId, "Veuillez fournir l'ID de l'activité.");
    }
    
    try {
      const exportData = await exportActivityData(activityId);
      bot.sendDocument(chatId, Buffer.from(JSON.stringify(exportData)), {
        filename: `activity_${activityId}_export.json`
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      bot.sendMessage(chatId, "Désolé, une erreur s'est produite lors de l'exportation des données.");
    }
  },

  feedback: async (msg, match) => {
    const chatId = msg.chat.id;
    const [, activityId, feedbackMessage] = match;
    
    if (!activityId || !feedbackMessage) {
      return bot.sendMessage(chatId, "Veuillez fournir l'ID de l'activité et votre feedback.");
    }
    
    try {
      await saveFeedback(activityId, feedbackMessage);
      bot.sendMessage(chatId, "Merci pour votre feedback!");
    } catch (error) {
      console.error('Error saving feedback:', error);
      bot.sendMessage(chatId, "Désolé, une erreur s'est produite lors de l'enregistrement du feedback.");
    }
  },

  history: async (msg) => {
    const chatId = msg.chat.id;
    try {
      const history = await getCompletedActivities();
      bot.sendMessage(chatId, `Historique des activités terminées:\n\n${history.join('\n')}`);
    } catch (error) {
      console.error('Error getting activity history:', error);
      bot.sendMessage(chatId, "Désolé, une erreur s'est produite lors de la récupération de l'historique des activités.");
    }
  },

  starttimer: async (msg, match) => {
    const chatId = msg.chat.id;
    const [, activityId, duration] = match;
    
    if (!activityId || !duration) {
      return bot.sendMessage(chatId, "Veuillez fournir l'ID de l'activité et la durée en minutes.");
    }
    
    try {
      await startTimer(activityId, parseInt(duration));
      bot.sendMessage(chatId, `Minuteur démarré pour ${duration} minutes.`);
    } catch (error) {
      console.error('Error starting timer:', error);
      bot.sendMessage(chatId, "Désolé, une erreur s'est produite lors du démarrage du minuteur.");
    }
  },

  stoptimer: async (msg, match) => {
    const chatId = msg.chat.id;
    const activityId = match[1];
    
    if (!activityId) {
      return bot.sendMessage(chatId, "Veuillez fournir l'ID de l'activité.");
    }
    
    try {
      await stopTimer(activityId);
      bot.sendMessage(chatId, "Minuteur arrêté.");
    } catch (error) {
      console.error('Error stopping timer:', error);
      bot.sendMessage(chatId, "Désolé, une erreur s'est produite lors de l'arrêt du minuteur.");
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
  bot.onText(/\/score (\S+) (\S+) (\S+) (\d+)/, commands.score);
  bot.onText(/\/ranking (\S+)/, commands.ranking);
  bot.onText(/\/activities/, commands.activities);
  bot.onText(/\/createteam (.+)/, commands.createteam);
  bot.onText(/\/addtoteam (\S+) (.+)/, commands.addtoteam);
  bot.onText(/\/teamranking (\S+)/, commands.teamranking);
  bot.onText(/\/stats (\S+)/, commands.stats);
  bot.onText(/\/export (\S+)/, commands.export);
  bot.onText(/\/feedback (\S+) (.+)/, commands.feedback);
  bot.onText(/\/history/, commands.history);
  bot.onText(/\/starttimer (\S+) (\d+)/, commands.starttimer);
  bot.onText(/\/stoptimer (\S+)/, commands.stoptimer);
  bot.onText(/\/help/, commands.help);
};