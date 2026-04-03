// Computation logic for daily score from 0 to 1000
export const computeDailyScore = (tasks, defaultWeights) => {
  let score = 0;
  tasks.forEach(t => {
    let completionRate = 0;
    if (t.method === 'checkbox') completionRate = t.completed ? 1 : 0;
    if (t.method === 'numeric') completionRate = Math.min(t.progress / t.target, 1);
    const weight = t.weight || defaultWeights[t.type] || 100;
    score += weight * completionRate;
  });
  return Math.floor(Math.min(score, 1000));
};
