import React from 'react';
import { Radar, RadarChart as RechartsRadar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useTaskStore } from '../../../store/taskStore';
import { useMetricsStore } from '../../../store/metricsStore';
import { useStudyStore } from '../../../store/studyStore';
import { useWorkoutStore } from '../../../store/workoutStore';
import { useAuraStore } from '../../../store/auraStore';
import { getTodayStr } from '../../../utils/dateUtils';
import { NEURAL_PENTAGRAM_CAPS } from '../../../constants/neuralStats';
import styles from './RadarChart.module.css';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;

    const formatValue = (val, sub) => {
      if (sub === 'IQ') return Math.floor(70 + (val * 0.9)) + ' IQ';
      if (sub === 'MUSCLE') return (70 + (val * 0.15)).toFixed(1) + ' KG';
      if (sub === 'MOOD') return ((val / 5) - 10).toFixed(1) + ' PT';
      return val + '%';
    };

    return (
      <div className={styles.tooltip}>
        <div className={styles.tooltipHeader}>
          <span className={styles.subject}>{data.subject}</span>
          <span className={styles.value}>{formatValue(data.A, data.subject)}</span>
        </div>
        <div className={styles.tooltipDivider} />
        <p className={styles.tooltipDesc}>{data.desc}</p>
      </div>
    );
  }
  return null;
};

const RadarChart = () => {
  const { tasks, completions } = useTaskStore();
  const { dailyMetrics } = useMetricsStore();
  const { accumulatedIQ, accumulatedKnowledge } = useStudyStore();
  const { logs: workoutLogs } = useWorkoutStore();
  const { streakDays, dailyCategoryAP } = useAuraStore();
  const today = getTodayStr();

  const getCompletionRate = (type) => {
    const domainTasks = tasks.filter(t => t.type === type);
    if (domainTasks.length === 0) return 0;
    const completed = domainTasks.filter(t => completions[t.id]?.[today]).length;
    return Math.floor((completed / domainTasks.length) * 100);
  };

  // IQ: accumulated from all study sessions — extremely hard to increase
  // Maps accumulated IQ points to 0-100 scale for radar
  const getIQProgress = () => {
    return Math.min(100, Math.floor((accumulatedIQ / NEURAL_PENTAGRAM_CAPS.IQ_MAX) * 100));
  };

  // KNOWLEDGE: accumulated from all study sessions — faster than IQ but still controlled
  // Maps accumulated Knowledge points to 0-100 scale for radar
  const getKnowledgeProgress = () => {
    return Math.min(100, Math.floor((accumulatedKnowledge / NEURAL_PENTAGRAM_CAPS.KNOWLEDGE_MAX) * 100));
  };

  const getWorkoutProgress = () => {
    const groups = Object.keys(workoutLogs[today] || {}).length;
    return Math.min(100, Math.floor((groups / 3) * 100)); // 3 group target
  };

  // Discipline: based on streaks + daily completion consistency
  const getDisciplineScore = () => {
    const taskCompletion = getCompletionRate('PERMANENT_DAILY');
    // Streak component: each streak day contributes up to 50% of discipline score
    const streakScore = Math.min(50, Math.floor((streakDays / 30) * 50)); // 30 day streak = max streak bonus

    // Daily activity consistency: check how many categories logged today
    const todayCats = dailyCategoryAP[today] || {};
    const catsLogged = Object.keys(todayCats).filter(k => !k.startsWith('NUTRITION_')).length;
    const consistencyScore = Math.min(20, catsLogged * 4); // up to 5 categories * 4 = 20

    // Combine: 50% task completion + 30% streak + 20% consistency
    return Math.min(100, Math.floor(taskCompletion * 0.5 + streakScore + consistencyScore));
  };

  const metrics = dailyMetrics[today] || {};

  const data = [
    { subject: 'MUSCLE', A: getWorkoutProgress(), unit: 'KG', fullMark: 100, desc: 'Hypertrophy volume and lean mass index.' },
    { subject: 'IQ', A: getIQProgress(), unit: 'IQ', fullMark: 100, desc: `Accumulated: ${accumulatedIQ.toFixed(1)} IQ pts. HIGH tier: 1/hr, MED: 0.5/hr, LOW: 0.1/hr.` },
    { subject: 'MOBILITY', A: 0, unit: '%', fullMark: 100, desc: 'Structural integrity and flexibility.' },
    { subject: 'MOOD', A: Math.min(100, ((metrics.mood || 5) * 10)), unit: 'PT', fullMark: 100, desc: 'Emotional equilibrium.' },
    { subject: 'KNOWLEDGE', A: getKnowledgeProgress(), unit: '%', fullMark: 100, desc: `Accumulated: ${accumulatedKnowledge.toFixed(1)} pts. All subjects contribute 2 pts/hr.` },
    { subject: 'DISCIPLINE', A: getDisciplineScore(), unit: '%', fullMark: 100, desc: `Streaks (${streakDays}d), task completion & daily consistency.` },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>NEURAL PENTAGRAM</h3>
        <div className={styles.statusLine} />
      </div>
      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsRadar cx="50%" cy="50%" outerRadius="80%" data={data}>
            <PolarGrid stroke="rgba(255,255,255,0.06)" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: 900, fontFamily: 'Outfit', letterSpacing: '0.12em' }}
            />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Radar name="SYSTEM" dataKey="A" stroke="var(--rank-alpha)" fill="var(--rank-alpha)" fillOpacity={0.3} />
          </RechartsRadar>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
export default RadarChart;
