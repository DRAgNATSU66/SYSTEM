import React, { useState, useMemo } from 'react';
import PageWrapper from '../../components/layout/PageWrapper/PageWrapper';
import ProgressBar from '../../components/ui/ProgressBar/ProgressBar';
import SubRadar from '../../components/charts/SubRadar/SubRadar';
import { useWorkoutStore } from '../../store/workoutStore';
import { useAuraStore } from '../../store/auraStore';
import { getTodayStr } from '../../utils/dateUtils';
import { calculateVO2Max } from '../../utils/vo2MaxCalculator';
import styles from './Workout.module.css';

// ─── Day-of-week workout schedule ────────────────────────────────────────────
const getScheduledType = () => {
  const day = new Date().getDay();
  return (day >= 1 && day <= 3) ? 'cardio' : 'hypertrophy';
};

// ─── Weekly date range helpers ────────────────────────────────────────────────
const getWeekDates = () => {
  const today = new Date();
  const day = today.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
};

// ─── Muscle Volume Card ───────────────────────────────────────────────────────
const MuscleGroupCard = ({ title, subGroups, logs, pbs, onLog, onLogAll }) => {
  const [selectedSub, setSelectedSub] = useState(subGroups[0]);
  const [sets,   setSets]   = useState('3');
  const [reps,   setReps]   = useState('10');
  const [weight, setWeight] = useState('20');

  const radarData = subGroups.map(sg => {
    const subLogs = logs[sg] || [];
    const totalVolume = subLogs.reduce((acc, e) => acc + (e.sets * e.reps * e.weight), 0);
    const REFERENCE_VOLUME = 3000;
    return {
      label: sg,
      value: Math.min(100, Math.round((totalVolume / REFERENCE_VOLUME) * 100))
    };
  });

  const selectedLogs  = logs[selectedSub] || [];
  const selectedVolume = selectedLogs.reduce((acc, e) => acc + (e.sets * e.reps * e.weight), 0);

  return (
    <div className={styles.muscleCard}>
      <div className={styles.cardHeader}>
        <h3>{title.toUpperCase()}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div className={styles.pbTag}>VOL: {selectedVolume.toLocaleString()} KG</div>
          <button
            className={styles.btnLogAll}
            onClick={() => onLogAll(title, subGroups)}
            title={`Log all exercises in ${title}`}
          >
            LOG ALL
          </button>
        </div>
      </div>

      <SubRadar data={radarData} />

      <div className={styles.controls}>
        <select
          value={selectedSub}
          onChange={e => setSelectedSub(e.target.value)}
          className={styles.select}
        >
          {subGroups.map(sg => <option key={sg} value={sg}>{sg}</option>)}
        </select>

        <div className={styles.volumeEngine}>
          <div className={styles.field}>
            <label>SETS</label>
            <input type="number" value={sets} onChange={e => setSets(e.target.value)} min="1" max="20" />
          </div>
          <div className={styles.field}>
            <label>REPS</label>
            <input type="number" value={reps} onChange={e => setReps(e.target.value)} min="1" max="100" />
          </div>
          <div className={styles.field}>
            <label>KG</label>
            <input type="number" value={weight} onChange={e => setWeight(e.target.value)} min="0" max="500" />
          </div>
        </div>

        <div className={styles.volumePreview}>
          Volume: <strong>{((parseInt(sets) || 0) * (parseInt(reps) || 0) * (parseInt(weight) || 0)).toLocaleString()} kg</strong>
        </div>

        <button
          className={styles.btnLog}
          onClick={() => onLog(title, selectedSub, Math.max(1, parseInt(sets) || 1), Math.max(1, parseInt(reps) || 1), Math.max(0, parseInt(weight) || 0))}
        >
          LOG VOLUME
        </button>
      </div>
    </div>
  );
};

// ─── VO2 Max Card ─────────────────────────────────────────────────────────────
const VO2MaxCard = ({ onLog }) => {
  const [bpm,     setBpm]     = useState(160);
  const [distKm,  setDistKm]  = useState(3.5);
  const [timeMins, setTimeMins] = useState(10);
  const [age,     setAge]     = useState(22);
  const [result,  setResult]  = useState(null);

  const handleCalc = () => {
    const res = calculateVO2Max({ bpm, distKm, timeMins, age });
    setResult(res);
    onLog(res);
  };

  return (
    <div className={styles.engineCard}>
      <h3>VO2 MAX — AIRBIKE (10 MIN)</h3>
      <p className={styles.engineSubtitle}>10-minute maximum intensity Airbike session inputs</p>
      <div className={styles.engineControls}>
        <div className={styles.vo2Grid}>
          <div className={styles.field}>
            <label>AVG BPM</label>
            <input type="number" value={bpm} onChange={e => setBpm(parseInt(e.target.value) || 0)} min="60" max="220" />
          </div>
          <div className={styles.field}>
            <label>DISTANCE (KM)</label>
            <input type="number" step="0.1" value={distKm} onChange={e => setDistKm(parseFloat(e.target.value) || 0)} min="0" max="20" />
          </div>
          <div className={styles.field}>
            <label>TIME (MIN)</label>
            <input type="number" value={timeMins} onChange={e => setTimeMins(parseInt(e.target.value) || 10)} min="1" max="60" />
          </div>
          <div className={styles.field}>
            <label>AGE</label>
            <input type="number" value={age} onChange={e => setAge(parseInt(e.target.value) || 20)} min="10" max="100" />
          </div>
        </div>

        {result && (
          <div className={styles.vo2Result}>
            <div className={styles.vo2Score}>{result.score}<span>/100</span></div>
            <div className={styles.vo2Raw}>{result.rawVO2} ml/kg/min</div>
          </div>
        )}

        <button className={styles.btnPrimary} onClick={handleCalc}>CALCULATE & LOG</button>
      </div>
    </div>
  );
};

// ─── Main WorkoutPage ─────────────────────────────────────────────────────────
const WorkoutPage = () => {
  const { muscles, logVolume, logCardio, logs, personalBests } = useWorkoutStore();
  const { addAuraPoints } = useAuraStore();
  const today     = getTodayStr();
  const todayLogs = logs[today] || {};
  const weekDates = useMemo(() => getWeekDates(), []);

  const scheduledType = getScheduledType();
  const [activeTab, setActiveTab] = useState('hypertrophy');
  const [lss, setLss] = useState({ minutes: 30, bpm: 135 });

  // Muscle groups split by category
  const hypertrophyGroups = Object.entries(muscles).filter(([key]) => key !== 'mobility');
  const mobilityGroups = Object.entries(muscles).filter(([key]) => key === 'mobility');

  // ── Weekly Progress ──────────────────────────────────────────
  const weeklyProgress = useMemo(() => {
    const hypertrophyDays = weekDates.filter((_, i) => i >= 3);
    const cardioDays      = weekDates.filter((_, i) => i < 3);

    const hypertrophyDone = hypertrophyDays.filter(d => {
      const dayLog = logs[d] || {};
      return Object.keys(dayLog).some(g => g !== 'mobility' && Object.keys(dayLog[g]).length > 0);
    }).length;

    const cardioDone = cardioDays.filter(d => {
      const cardio = useWorkoutStore.getState().cardio;
      return !!cardio.lss?.[d] || !!cardio.vo2max?.[d];
    }).length;

    const mobilityDone = weekDates.some(d => {
      const dayLog = logs[d] || {};
      return dayLog.mobility && Object.keys(dayLog.mobility).length > 0;
    }) ? 1 : 0;

    const total = hypertrophyDone + cardioDone + mobilityDone;
    const max   = hypertrophyDays.length + cardioDays.length + 1;
    return Math.min(100, Math.round((total / max) * 100));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logs, weekDates]);

  const handleLogVolume = (g, s, sets, reps, weight) => {
    const oldPB  = personalBests?.[g]?.[s] || 0;
    logVolume(g, s, sets, reps, weight);
    const new1RM = weight * (1 + reps / 30);
    if (new1RM > oldPB && oldPB > 0) {
      addAuraPoints(50, `NEW PERSONAL BEST: ${s} (${Math.floor(new1RM)}kg 1RM)`);
    } else {
      addAuraPoints(10, `VOLUME LOGGED: ${s}`);
    }
  };

  const handleLogAllGroup = (group, subGroups) => {
    subGroups.forEach(sub => {
      logVolume(group, sub, 3, 10, 20);
      addAuraPoints(10, `VOLUME LOGGED: ${sub}`);
    });
  };

  const handleLogAllTab = () => {
    let groups;
    if (activeTab === 'hypertrophy') groups = hypertrophyGroups;
    else if (activeTab === 'mobility') groups = mobilityGroups;
    else return; // cardio has its own log mechanism

    groups.forEach(([group, subs]) => {
      subs.forEach(sub => {
        logVolume(group, sub, 3, 10, 20);
        addAuraPoints(10, `VOLUME LOGGED: ${sub}`);
      });
    });
  };

  const handleVO2Log = ({ rawVO2, score }) => {
    logCardio('vo2max', { value: rawVO2, score, date: today });
    addAuraPoints(20, `VO2 MAX LOGGED: ${rawVO2} ml/kg/min (Score ${score}/100)`);
  };

  return (
    <PageWrapper className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <h1>WORKOUT ENGINE</h1>
            <p className={styles.subtitle}>
              Today: <strong style={{ color: 'var(--rank-alpha)' }}>
                {scheduledType === 'cardio' ? 'CARDIO + MOBILITY' : 'HYPERTROPHY'}
              </strong>
            </p>
          </div>
          <div className={styles.overallProgress}>
            <ProgressBar value={weeklyProgress} label="WEEKLY PROGRESS" />
            <p className={styles.progressCaption}>Resets Sunday midnight · Mon–Wed: Cardio · Thu–Sun: Hypertrophy</p>
          </div>
        </div>
      </header>

      {/* ── Sub-Tab Switcher ─────────────────────────────────────── */}
      <div className={styles.tabBar}>
        <button
          className={`${styles.tabPill} ${activeTab === 'hypertrophy' ? styles.tabPillActive : ''}`}
          onClick={() => setActiveTab('hypertrophy')}
        >
          HYPERTROPHY
        </button>
        <button
          className={`${styles.tabPill} ${activeTab === 'mobility' ? styles.tabPillActive : ''}`}
          onClick={() => setActiveTab('mobility')}
        >
          MOBILITY
        </button>
        <button
          className={`${styles.tabPill} ${activeTab === 'cardio' ? styles.tabPillActive : ''}`}
          onClick={() => setActiveTab('cardio')}
        >
          CARDIO
        </button>
      </div>

      {/* ── Log All (top-level) ───────────────────────────────────── */}
      {activeTab !== 'cardio' && (
        <div className={styles.logAllBar}>
          <button className={styles.btnLogAllTop} onClick={handleLogAllTab}>
            LOG ALL {activeTab.toUpperCase()}
          </button>
        </div>
      )}

      {/* ── Hypertrophy Tab ──────────────────────────────────────── */}
      {activeTab === 'hypertrophy' && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>MUSCLE MATRIX — VOLUME PENTAGRAM</h2>
          <p className={styles.sectionSubtitle}>Radar shows total volume (Sets × Reps × Weight) per sub-group today</p>
          <div className={styles.muscleGrid}>
            {hypertrophyGroups.map(([group, subs]) => (
              <MuscleGroupCard
                key={group}
                title={group}
                subGroups={subs}
                logs={todayLogs[group] || {}}
                pbs={personalBests[group] || {}}
                onLog={handleLogVolume}
                onLogAll={handleLogAllGroup}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Mobility Tab ─────────────────────────────────────────── */}
      {activeTab === 'mobility' && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>MOBILITY & FLEXIBILITY</h2>
          <p className={styles.sectionSubtitle}>Track rotator cuff, hip flexors, glutes, and ankle mobility work</p>
          <div className={styles.muscleGrid}>
            {mobilityGroups.map(([group, subs]) => (
              <MuscleGroupCard
                key={group}
                title={group}
                subGroups={subs}
                logs={todayLogs[group] || {}}
                pbs={personalBests[group] || {}}
                onLog={handleLogVolume}
                onLogAll={handleLogAllGroup}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Cardio Tab ───────────────────────────────────────────── */}
      {activeTab === 'cardio' && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>CARDIO ENGINE</h2>
          <div className={styles.cardioGrid}>
            <div className={styles.engineCard}>
              <h3>LSS (Low Intensity Steady State)</h3>
              <div className={styles.engineControls}>
                <div className={styles.field}>
                  <label>MINUTES</label>
                  <input
                    type="number"
                    value={lss.minutes}
                    onChange={e => setLss({ ...lss, minutes: parseInt(e.target.value) || 0 })}
                    min="1" max="300"
                  />
                </div>
                <div className={styles.field}>
                  <label>AVG BPM</label>
                  <input
                    type="number"
                    value={lss.bpm}
                    onChange={e => setLss({ ...lss, bpm: parseInt(e.target.value) || 0 })}
                    min="60" max="220"
                  />
                </div>
                <button className={styles.btnPrimary} onClick={() => {
                  logCardio('lss', lss);
                  addAuraPoints(15, `LSS CARDIO LOGGED: ${lss.minutes}min @ ${lss.bpm}bpm`);
                }}>SYNC DATA</button>
              </div>
            </div>

            <VO2MaxCard onLog={handleVO2Log} />
          </div>
        </section>
      )}

      <div className={styles.anatomicalCues}>
        <h3>ANATOMICAL BIAS REGISTRY</h3>
        <p>• <b>Volume Formula</b>: Sets × Reps × Weight — all pentagram values reflect total tonnage lifted.</p>
        <p>• <b>Weekly Cycle</b>: Mon/Tue/Wed = Cardio + Mobility · Thu/Fri/Sat/Sun = Hypertrophy.</p>
        <p>• <b>VO2 Max</b>: Based on 10-min max intensity Airbike session. Enter BPM, distance, time and age.</p>
      </div>
    </PageWrapper>
  );
};

export default WorkoutPage;
