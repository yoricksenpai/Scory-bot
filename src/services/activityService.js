import { Activity } from '../models/activity.js';

// Fonction utilitaire pour gérer les erreurs
const handleError = (error, customMessage) => {
  console.error(customMessage, error);
  throw new Error(customMessage);
};

// Fonction utilitaire pour vérifier si une activité existe
const checkActivityExists = async (id, chatId) => {
  const activity = await Activity.findOne({ _id: id, chatId });
  if (!activity) {
    throw new Error('Activity not found');
  }
  return activity;
};

export const saveActivity = async (activityData, chatId) => {
  try {
    const activity = new Activity({ ...activityData, chatId });
    return await activity.save();
  } catch (error) {
    handleError(error, 'Error saving activity');
  }
};

export const getActivity = async (id, chatId) => {
  try {
    return await checkActivityExists(id, chatId);
  } catch (error) {
    handleError(error, 'Error getting activity');
  }
};

export const getAllActivities = async (chatId) => {
  try {
    return await Activity.find({ chatId });
  } catch (error) {
    handleError(error, 'Error getting all activities');
  }
};

export const updateActivity = async (id, updateData, chatId) => {
  try {
    const activity = await checkActivityExists(id, chatId);
    Object.assign(activity, updateData);
    return await activity.save();
  } catch (error) {
    handleError(error, 'Error updating activity');
  }
};

export const addParticipant = async (activityId, participantName, chatId) => {
  try {
    const activity = await checkActivityExists(activityId, chatId);
    if (!activity.participants.includes(participantName)) {
      activity.participants.push(participantName);
      activity.scores.set(participantName, 0);
      return await activity.save();
    }
    return activity;
  } catch (error) {
    handleError(error, 'Error adding participant');
  }
};

export const addSubActivity = async (activityId, subActivityName, chatId) => {
  try {
    const activity = await checkActivityExists(activityId, chatId);
    activity.subActivities.push({ name: subActivityName, scores: new Map() });
    return await activity.save();
  } catch (error) {
    handleError(error, 'Error adding sub-activity');
  }
};

export const addScore = async (activityId, participantName, subActivityName, score, chatId) => {
  try {
    const activity = await checkActivityExists(activityId, chatId);
    const subActivity = activity.subActivities.find(sa => sa.name === subActivityName);
    if (!subActivity) {
      throw new Error('Sub-activity not found');
    }
    subActivity.scores.set(participantName, score);
    return await activity.save();
  } catch (error) {
    handleError(error, 'Error adding score');
  }
};

export const createTeam = async (activityId, teamName, chatId) => {
  try {
    const activity = await checkActivityExists(activityId, chatId);
    if (!activity.teams) {
      activity.teams = [];
    }
    activity.teams.push({ name: teamName, members: [] });
    return await activity.save();
  } catch (error) {
    handleError(error, 'Error creating team');
  }
};

export const addParticipantToTeam = async (activityId, teamName, participantName, chatId) => {
  try {
    const activity = await checkActivityExists(activityId, chatId);
    const team = activity.teams.find(t => t.name === teamName);
    if (!team) {
      throw new Error('Team not found');
    }
    if (!team.members.includes(participantName)) {
      team.members.push(participantName);
    }
    return await activity.save();
  } catch (error) {
    handleError(error, 'Error adding participant to team');
  }
};

export const getTeamRanking = async (activityId, chatId) => {
  try {
    const activity = await checkActivityExists(activityId, chatId);
    let teamScores = new Map();
    activity.subActivities.forEach(sa => {
      sa.scores.forEach((score, participant) => {
        const team = activity.teams.find(t => t.members.includes(participant));
        if (team) {
          teamScores.set(team.name, (teamScores.get(team.name) || 0) + score);
        }
      });
    });
    return Array.from(teamScores.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, score], index) => ({ rank: index + 1, name, score }));
  } catch (error) {
    handleError(error, 'Error getting team ranking');
  }
};

export const addFeedback = async (activityId, username, message, chatId) => {
  try {
    const activity = await checkActivityExists(activityId, chatId);
    if (!activity.feedback) {
      activity.feedback = [];
    }
    activity.feedback.push({ user: username, message, date: new Date() });
    return await activity.save();
  } catch (error) {
    handleError(error, 'Error adding feedback');
  }
};

export const completeActivity = async (activityId, chatId) => {
  try {
    const activity = await checkActivityExists(activityId, chatId);
    activity.status = 'completed';
    activity.endDate = new Date();
    return await activity.save();
  } catch (error) {
    handleError(error, 'Error completing activity');
  }
};

export const getCompletedActivities = async (chatId) => {
  try {
    return await Activity.find({ status: 'completed', chatId }).sort({ endDate: -1 });
  } catch (error) {
    handleError(error, 'Error getting completed activities');
  }
};