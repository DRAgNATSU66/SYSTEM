import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import styles from './DomainPieChart.module.css';

const DomainPieChart = ({ value, label, color = 'var(--rank-alpha)' }) => {
  const data = [
    { name: 'Progress', value: value },
    { name: 'Remaining', value: Math.max(0, 100 - value) }
  ];

  return (
    <div className={styles.container}>
      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="75%"
              outerRadius="90%"
              paddingAngle={0}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              stroke="none"
            >
              <Cell fill={color} />
              <Cell fill="rgba(255,255,255,0.05)" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className={styles.labelOverlay}>
          <div className={styles.val}>{Math.floor(value)}%</div>
          <div className={styles.label}>{label}</div>
        </div>
      </div>
    </div>
  );
};

export default DomainPieChart;
