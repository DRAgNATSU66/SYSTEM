import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import styles from './SubRadar.module.css';

const SubRadar = ({ data, color = 'var(--rank-alpha)' }) => {
  // data: [{ label: string, value: number }]
  
  return (
    <div className={styles.container}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="rgba(255,255,255,0.05)" />
          <PolarAngleAxis 
            dataKey="label" 
            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 7, fontWeight: 900, fontFamily: 'Outfit' }} 
          />
          <Radar
            name="SubMetric"
            dataKey="value"
            stroke={color}
            fill={color}
            fillOpacity={0.2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SubRadar;
