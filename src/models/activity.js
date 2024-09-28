import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  participants: [{
    type: String,
    trim: true
  }],
  subActivities: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    scores: {
      type: Map,
      of: Number,
      default: new Map()
    }
  }],
  teams: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    members: [{
      type: String,
      trim: true
    }]
  }],
  feedback: [{
    user: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    date: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['active', 'completed'],
    default: 'active'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: Date,
  scores: {
    type: Map,
    of: Number,
    default: new Map()
  }
});

export const Activity = mongoose.model('Activity', activitySchema);