import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useWorkoutStore = create(persist((set) => ({
  // Cardio Engine
  cardio: {
    lss: {}, // { date: { minutes: number, bpm: number } }
    vo2max: {} // { date: { value: number } }
  },
  
  // Muscle Matrix (Hypertrophy)
  muscles: {
    chest: ['Upper Chest', 'Middle Chest', 'Lower Chest', 'Pec Minor'],
    shoulders: ['Front Delt', 'Side Delt', 'Rear Delt'],
    biceps: ['Long Head', 'Short Head', 'Brachialis'],
    triceps: ['Long Head', 'Lateral Head', 'Medial Head'],
    back: ['Lats (Upper/Mid/Lower)', 'Traps (Upper/Mid/Lower)', 'Rhomboids', 'Erector Spinae', 'Teres Major/Minor'],
    core: ['Upper Abs', 'Lower Abs', 'Obliques', 'Transversus'],
    legs: ['Rectus Femoris', 'Vastus Lateralis', 'Vastus Medialis', 'Vastus Intermedius', 'Biceps Femoris', 'Semitendinosus/Semimembranosus'],
    calves: ['Gastrocnemius', 'Soleus'],
    forearms: ['Flexors', 'Extensors', 'Brachioradialis'],
    mobility: ['Rotator Cuff', 'Hip Flexors', 'Glutes (Max/Med/Min)', 'Ankle Mobility']
  },
  
  logs: {}, // { date: { muscleGroupId: { subGroupId: [{ sets, reps, weight }] } } }
  personalBests: {}, // { muscleGroupId: { subGroupId: number (1RM) } }
  
  logCardio: (type, data, date = new Date().toISOString().split('T')[0]) => set((state) => ({
    cardio: {
      ...state.cardio,
      [type]: { ...state.cardio[type], [date]: data }
    }
  })),
  
  // Volume Engine (Workout 2.0)
  logVolume: (muscleGroup, subGroup, sets, reps, weight, date = new Date().toISOString().split('T')[0]) => set((state) => {
    const dayLog = state.logs[date] || {};
    const groupLog = dayLog[muscleGroup] || {};
    const subLog = groupLog[subGroup] || [];
    
    const newEntry = { sets, reps, weight };
    const oneRM = weight * (1 + reps / 30);
    
    // PB Logic
    const oldPB = state.personalBests?.[muscleGroup]?.[subGroup] || 0;
    const isNewPB = oneRM > oldPB;
    const newPB = isNewPB ? oneRM : oldPB;

    return {
      logs: {
        ...state.logs,
        [date]: {
          ...dayLog,
          [muscleGroup]: { ...groupLog, [subGroup]: [...subLog, newEntry] }
        }
      },
      personalBests: {
        ...state.personalBests,
        [muscleGroup]: { ...state.personalBests[muscleGroup], [subGroup]: newPB }
      },
      // Points will be handled by the caller or a side effect
      _lastPbAchieved: isNewPB ? { subGroup, oneRM, oldPB } : null
    };
  }),

  hydrateFromServer: (serverData) => set(serverData),
  lastSyncedAt: null,
}), { name: 'antigravity-workout-engine' }));
