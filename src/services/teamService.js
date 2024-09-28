import { Activity } from '../models/activity.js';

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

export const addToTeam = async (activityId, teamName, participantName) => {
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
    .map(([name, score], index) => `${index + 1}. ${name}: ${score}`);
};