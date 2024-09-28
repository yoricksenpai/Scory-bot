import { Activity } from '../models/activity.js';

export const saveFeedback = async (activityId, username, message) => {
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

export const getFeedback = async (activityId) => {
  const activity = await Activity.findById(activityId);
  if (!activity) {
    throw new Error('Activity not found');
  }
  return activity.feedback || [];
};