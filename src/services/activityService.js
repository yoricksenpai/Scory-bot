import { Activity } from '../models/activity.js';

export const saveActivity = async (activityData, chatId) => {
  const activity = new Activity({ ...activityData, chatId });
  return await activity.save();
};

export const getActivity = async (id, chatId) => {
  return await Activity.findOne({ _id: id, chatId });
};

export const getAllActivities = async (chatId) => {
  return await Activity.find({ chatId });
};

export const updateActivity = async (id, updateData, chatId) => {
  return await Activity.findOneAndUpdate({ _id: id, chatId }, updateData, { new: true });
};

export const addParticipant = async (activityId, participantName, chatId) => {
  const activity = await Activity.findOne({ _id: activityId, chatId });
  if (!activity) {
    throw new Error('Activity not found');
  }
  if (!activity.participants.includes(participantName)) {
    activity.participants.push(participantName);
    return await activity.save();
  }
  return activity;
};

export const addSubActivity = async (activityId, subActivityName, chatId) => {
  const activity = await Activity.findOne({ _id: activityId, chatId });
  if (!activity) {
    throw new Error('Activity not found');
  }
  activity.subActivities.push({ name: subActivityName, scores: new Map() });
  return await activity.save();
};

export const addScore = async (activityId, participantName, subActivityName, score, chatId) => {
  const activity = await Activity.findOne({ _id: activityId, chatId });
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

export const createTeam = async (activityId, teamName, chatId) => {
  const activity = await Activity.findOne({ _id: activityId, chatId });
  if (!activity) {
    throw new Error('Activity not found');
  }
  if (!activity.teams) {
    activity.teams = [];
  }
  activity.teams.push({ name: teamName, members: [] });
  return await activity.save();
};

export const addParticipantToTeam = async (activityId, teamName, participantName, chatId) => {
  const activity = await Activity.findOne({ _id: activityId, chatId });
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

export const getTeamRanking = async (activityId, chatId) => {
  const activity = await Activity.findOne({ _id: activityId, chatId });
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

export const addFeedback = async (activityId, username, message, chatId) => {
  const activity = await Activity.findOne({ _id: activityId, chatId });
  if (!activity) {
    throw new Error('Activity not found');
  }
  if (!activity.feedback) {
    activity.feedback = [];
  }
  activity.feedback.push({ user: username, message, date: new Date() });
  return await activity.save();
};

export const completeActivity = async (activityId, chatId) => {
  const activity = await Activity.findOne({ _id: activityId, chatId });
  if (!activity) {
    throw new Error('Activity not found');
  }
  activity.status = 'completed';
  activity.endDate = new Date();
  return await activity.save();
};

export const getCompletedActivities = async (chatId) => {
  return await Activity.find({ status: 'completed', chatId }).sort({ endDate: -1 });
};