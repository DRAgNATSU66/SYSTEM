import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── Default micronutrient baselines ─────────────────────────────────────────
// Based on general adult RDA / optimal performance targets
export const DEFAULT_MICROS = [
  { id: 'vitd3',  name: 'Vitamin D3',  minLimit: 2000, unit: 'IU' },
  { id: 'vitb12', name: 'Vitamin B12', minLimit: 2.4,  unit: 'mcg' },
  { id: 'vitc',   name: 'Vitamin C',   minLimit: 90,   unit: 'mg' },
  { id: 'vite',   name: 'Vitamin E',   minLimit: 15,   unit: 'mg' },
  { id: 'vitk2',  name: 'Vitamin K2',  minLimit: 120,  unit: 'mcg' },
  { id: 'calcium',name: 'Calcium',     minLimit: 1000, unit: 'mg' },
  { id: 'mag',    name: 'Magnesium',   minLimit: 400,  unit: 'mg' },
  { id: 'potass', name: 'Potassium',   minLimit: 3500, unit: 'mg' },
  { id: 'sodium', name: 'Sodium',      minLimit: 2300, unit: 'mg' },
  { id: 'zinc',   name: 'Zinc',        minLimit: 11,   unit: 'mg' },
  { id: 'iron',   name: 'Iron',        minLimit: 8,    unit: 'mg' },
  { id: 'iodine', name: 'Iodine',      minLimit: 150,  unit: 'mcg' },
  { id: 'copper', name: 'Copper',      minLimit: 0.9,  unit: 'mg' },
  { id: 'omega3', name: 'Omega-3',     minLimit: 1.6,  unit: 'g' },
  { id: 'fiber',  name: 'Fiber',       minLimit: 30,   unit: 'g' },
  { id: 'water',  name: 'Water',       minLimit: 3000, unit: 'ml' },
];

export const DEFAULT_MACROS = [
  { id: 'pro',  name: 'Protein',   minLimit: 180,  unit: 'g' },
  { id: 'carb', name: 'Carbs',     minLimit: 250,  unit: 'g' },
  { id: 'fat',  name: 'Fats',      minLimit: 70,   unit: 'g' },
  { id: 'cal',  name: 'Calories',  minLimit: 2500, unit: 'kcal' },
];

export const useMetricsStore = create(
  persist(
    (set, get) => ({
      // ── Macros ──────────────────────────────────────────────────────────
      customMacros: [...DEFAULT_MACROS],

      // ── Micronutrients ──────────────────────────────────────────────────
      // Stored alongside macros in the UI; separate key for clarity
      customMicros: [...DEFAULT_MICROS],

      // ── Daily metrics ───────────────────────────────────────────────────
      // { date: { sleep, deepSleep, mood, macros: { id: val }, micros: { id: val } } }
      dailyMetrics: {},

      // ── Baseline quick-log ───────────────────────────────────────────────
      // Snapshot of current macro/micro limits saved as one-click defaults
      savedBaseline: null,

      // ── Macro actions ───────────────────────────────────────────────────
      addMacro: (name, minLimit, unit = 'g') => set((state) => ({
        customMacros: [
          ...state.customMacros,
          { id: name.toLowerCase().replace(/\s/g, '_') + '_' + Date.now(), name, minLimit: parseFloat(minLimit), unit }
        ]
      })),

      deleteMacro: (id) => set((state) => ({
        customMacros: state.customMacros.filter(m => m.id !== id)
      })),

      setMacroLimit: (id, minLimit) => set((state) => ({
        customMacros: state.customMacros.map(m => m.id === id ? { ...m, minLimit: parseFloat(minLimit) } : m)
      })),

      // ── Micro actions ────────────────────────────────────────────────────
      setMicroLimit: (id, minLimit) => set((state) => ({
        customMicros: state.customMicros.map(m => m.id === id ? { ...m, minLimit: parseFloat(minLimit) } : m)
      })),

      // ── Daily log actions ────────────────────────────────────────────────
      logMetrics: (data, date = new Date().toISOString().split('T')[0]) => set((state) => ({
        dailyMetrics: {
          ...state.dailyMetrics,
          [date]: { ...state.dailyMetrics[date], ...data }
        }
      })),

      logMacroValue: (id, value, date = new Date().toISOString().split('T')[0]) => set((state) => {
        const dayData  = state.dailyMetrics[date] || {};
        const dayMacros = dayData.macros || {};
        return {
          dailyMetrics: {
            ...state.dailyMetrics,
            [date]: { ...dayData, macros: { ...dayMacros, [id]: parseFloat(value) || 0 } }
          }
        };
      }),

      logMicroValue: (id, value, date = new Date().toISOString().split('T')[0]) => set((state) => {
        const dayData  = state.dailyMetrics[date] || {};
        const dayMicros = dayData.micros || {};
        return {
          dailyMetrics: {
            ...state.dailyMetrics,
            [date]: { ...dayData, micros: { ...dayMicros, [id]: parseFloat(value) || 0 } }
          }
        };
      }),

      // ── One-click baseline log ───────────────────────────────────────────
      // Saves a snapshot of all current limits as "baseline" defaults
      saveBaseline: () => {
        const { customMacros, customMicros } = get();
        const macroBaseline = Object.fromEntries(customMacros.map(m => [m.id, m.minLimit]));
        const microBaseline = Object.fromEntries(customMicros.map(m => [m.id, m.minLimit]));
        set({ savedBaseline: { macros: macroBaseline, micros: microBaseline } });
      },

      // Apply current threshold limits to today's log
      logBaselineToday: () => {
        const { customMacros, customMicros, logMacroValue, logMicroValue } = get();
        const today = new Date().toISOString().split('T')[0];
        customMacros.forEach(m => logMacroValue(m.id, m.minLimit, today));
        customMicros.forEach(m => logMicroValue(m.id, m.minLimit, today));
      },

      hydrateFromServer: (serverData) => set(serverData),
      lastSyncedAt: null,
    }),
    { name: 'antigravity-metrics-engine' }
  )
);
