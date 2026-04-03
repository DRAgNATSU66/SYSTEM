import React from 'react';
import { Radar, RadarChart as RechartsRadar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useTaskStore } from '../../../store/taskStore';
import { useMetricsStore } from '../../../store/metricsStore';
import { useStudyStore } from '../../../store/studyStore';
import { useWorkoutStore } from '../../../store/workoutStore';
import { getTodayStr } from '../../../utils/dateUtils';
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
  const { sessions: studySessions } = useStudyStore();
  const { logs: workoutLogs } = useWorkoutStore();
  const today = getTodayStr();

  const getCompletionRate = (type) => {
    const domainTasks = tasks.filter(t => t.type === type);
    if (domainTasks.length === 0) return 50;
    const completed = domainTasks.filter(t => completions[t.id]?.[today]).length;
    return Math.floor((completed / domainTasks.length) * 100);
  };

  const getStudyProgress = () => {
    const minutes = Object.values(studySessions[today] || {}).reduce((a, b) => a + b, 0);
    return Math.min(100, Math.floor((minutes / 240) * 100)); // 4h target
  };

  const getWorkoutProgress = () => {
    const groups = Object.keys(workoutLogs[today] || {}).length;
    return Math.min(100, Math.floor((groups / 3) * 100)); // 3 group target
  };

  const metrics = dailyMetrics[today] || {};
  
  const data = [
    { subject: 'MUSCLE', A: getWorkoutProgress(), unit: 'KG', fullMark: 100, desc: 'Hypertrophy volume and lean mass index.' },
    { subject: 'IQ', A: getStudyProgress(), unit: 'IQ', fullMark: 100, desc: 'Deep work cognitive throughput.' },
    { subject: 'MOBILITY', A: 70, unit: '%', fullMark: 100, desc: 'Structural integrity and flexibility.' },
    { subject: 'MOOD', A: Math.min(100, ((metrics.mood || 5) * 10)), unit: 'PT', fullMark: 100, desc: 'Emotional equilibrium.' },
    { subject: 'KNOWLEDGE', A: Math.min(100, ((metrics.sleep || 7) / 8) * 100), unit: '%', fullMark: 100, desc: 'Synaptic recovery and data retention.' },
    { subject: 'DISCIPLINE', A: getCompletionRate('PERMANENT_DAILY'), unit: '%', fullMark: 100, desc: 'Core habit consistency.' },
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
              tick={{ fill: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: 900, fontFamily: 'Outfit', letterSpacing: '0.15em' }} 
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
