import { Activity } from '../models/activity.js';
import QuickChart from 'quickchart-js';

export const generateStatistics = async (activityId) => {
  const activity = await Activity.findById(activityId);
  if (!activity) {
    throw new Error('Activity not found');
  }

  let totalScores = {};
  let participationCount = {};

  activity.subActivities.forEach(sa => {
    sa.scores.forEach((score, participant) => {
      totalScores[participant] = (totalScores[participant] || 0) + score;
      participationCount[participant] = (participationCount[participant] || 0) + 1;
    });
  });

  const stats = {
    totalParticipants: activity.participants.length,
    averageScore: Object.values(totalScores).reduce((a, b) => a + b, 0) / activity.participants.length,
    highestScore: Math.max(...Object.values(totalScores)),
    lowestScore: Math.min(...Object.values(totalScores)),
    mostActiveParticipant: Object.entries(participationCount).sort((a, b) => b[1] - a[1])[0][0],
  };

  return `
    Statistiques pour l'activité "${activity.name}":
    Nombre total de participants: ${stats.totalParticipants}
    Score moyen: ${stats.averageScore.toFixed(2)}
    Score le plus élevé: ${stats.highestScore}
    Score le plus bas: ${stats.lowestScore}
    Participant le plus actif: ${stats.mostActiveParticipant}
  `;
};

export const generateGraph = async (activityId) => {
  const activity = await Activity.findById(activityId);
  if (!activity) {
    throw new Error('Activity not found');
  }

  let totalScores = {};
  activity.subActivities.forEach(sa => {
    sa.scores.forEach((score, participant) => {
      totalScores[participant] = (totalScores[participant] || 0) + score;
    });
  });

  const participants = Object.keys(totalScores);
  const scores = Object.values(totalScores);

  const chart = new QuickChart();
  chart.setConfig({
    type: 'bar',
    data: {
      labels: participants,
      datasets: [{
        label: 'Scores totaux',
        data: scores,
        backgroundColor: 'rgba(54, 162, 235, 0.8)'
      }]
    },
    options: {
      title: {
        display: true,
        text: `Scores de l'activité "${activity.name}"`
      },
      scales: {
        yAxes: [{
          ticks: {
            beginAtZero: true
          }
        }]
      }
    }
  });

  return chart.getUrl();
};