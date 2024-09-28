import { Activity } from '../models/activity.js';

export const saveActivity = async (activityData) => {
  const activity = new Activity(activityData);
  return await activity.save();
};

export const getActivity = async (id) => {
  return await Activity.findById(id);
};

export const getAllActivities = async () => {
  return await Activity.find();
};

export const updateActivity = async (id, updateData) => {
  return await Activity.findByIdAndUpdate(id, updateData, { new: true });
};

export const addParticipant = async (activityId, participantName) => {
  const activity = await Activity.findById(activityId);
  if (!activity) {
    throw new Error('Activity not found');
  }
  if (!activity.participants.includes(participantName)) {
    activity.participants.push(participantName);
    return await activity.save();
  }
  return activity;
};

export const addSubActivity = async (activityId, subActivityName) => {
  const activity = await Activity.findById(activityId);
  if (!activity) {
    throw new Error('Activity not found');
  }
  activity.subActivities.push({ name: subActivityName, scores: new Map() });
  return await activity.save();
};

export const addScore = async (activityId, participantName, subActivityName, score) => {
  const activity = await Activity.findById(activityId);
  if (!activity) {
    throw new Error('Activity not found');
  }
  const subActivity = activity.subActivities.find(sa => sa.name === subActivityName);
  if (!subActivity) {
    throw new Error('Sub-activity not found');
  }
  subActivity.scores.set(participantName, score);
  return await activity.save();
};

// Nouvelles fonctions pour la gestion des équipes
export const createTeam = async (activityId, teamName) => {
  const activity = await Activity.findById(activityId);
  if (!activity) {
    throw new Error('Activity not found');
  }
  if (!activity.teams) {
    activity.teams = [];
  }
  activity.teams.push({ name: teamName, members: [] });
  return await activity.save();
};

export const addParticipantToTeam = async (activityId, teamName, participantName) => {
  const activity = await Activity.findById(activityId);
  if (!activity) {
    throw new Error('Activity not found');
  }
  const team = activity.teams.find(t => t.name === teamName);
  if (!team) {
    throw new Error('Team not found');
  }
  if (!team.members.includes(participantName)) {
    team.members.push(participantName);
  }
  return await activity.save();
};

// Fonction pour obtenir le classement des équipes
export const getTeamRanking = async (activityId) => {
  const activity = await Activity.findById(activityId);
  if (!activity) {
    throw new Error('Activity not found');
  }
  
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
};

// Fonction pour ajouter un feedback
export const addFeedback = async (activityId, username, message) => {
  const activity = await Activity.findById(activityId);
  if (!activity) {
    throw new Error('Activity not found');
  }
  if (!activity.feedback) {
    activity.feedback = [];
  }
  activity.feedback.push({ user: username, message, date: new Date() });
  return await activity.save();
};

// Fonction pour marquer une activité comme terminée
export const completeActivity = async (activityId) => {
  const activity = await Activity.findById(activityId);
  if (!activity) {
    throw new Error('Activity not found');
  }
  activity.status = 'completed';
  activity.endDate = new Date();
  return await activity.save();
};

// Fonction pour obtenir l'historique des activités terminées
export const getCompletedActivities = async () => {
  return await Activity.find({ status: 'completed' }).sort({ endDate: -1 });
};