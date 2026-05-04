import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateCritique } from '../utils/critiqueEngine';
import { useAuraStore } from './auraStore';
import { useTaskStore } from './taskStore';

export const useCommandStore = create(
  persist(
    (set, get) => ({
      history: [
        { id: 'boot-1', type: 'system', text: 'SYSTEM_BOOT . . . [V9.0.1 ALPHA]' },
        { id: 'boot-2', type: 'system', text: 'SCANNING_ENVIRONMENT . . . [SECURE_ENCLAVE]' },
        { id: 'boot-3', type: 'update', text: 'SYNCING_USER_BIOMETRICS . . . [SUCCESS]' }
      ],
      timerStart: null,
      
      addEntry: (entry) => set((state) => ({
        history: [...state.history, { ...entry, id: crypto.randomUUID() }]
      })),
      
      processCommand: (command, dailyScore, rankTitle) => {
        const { addEntry } = get();
        addEntry({ type: 'user', text: '> ' + command.toUpperCase() });
        
        // Command Logic
        const cmd = command.toLowerCase().trim();
        
        if (cmd === 'critique' || cmd === 'status') {
          const lines = generateCritique(dailyScore, rankTitle);
          lines.forEach((line, index) => {
            setTimeout(() => {
              get().addEntry({ type: 'ai', text: line });
            }, (index + 1) * 400);
          });
        } else if (cmd === 'commend') {
          const strengths = [
            'STRENGTH_DETECTED: HYPERTROPHY_EFFICIENCY_AT_115%',
            'STRENGTH_DETECTED: DEEP_WORK_CONSISTENCY_HIGH',
            'STRENGTH_DETECTED: CIRCADIAN_RHYTHM_LOCKED',
            'STRENGTH_DETECTED: NEURAL_NET_STABILITY_OPTIMAL'
          ];
          const randomStrength = strengths[Math.floor(Math.random() * strengths.length)];
          get().addEntry({ type: 'ai', text: 'ANALYZING_BIOMETRICS . . .' });
          setTimeout(() => {
            get().addEntry({ type: 'ai', text: randomStrength });
            get().addEntry({ type: 'ai', text: 'CONCLUSION: YOU_ARE_HIM.' });
          }, 800);
        } else if (cmd === 'reward') {
          const { totalAuraPoints, streakDays, multiplier } = useAuraStore.getState();
          const MILESTONES = [10000, 50000, 100000, 250000, 500000, 1000000];
          const next = MILESTONES.find(m => m > totalAuraPoints) || MILESTONES[MILESTONES.length - 1];
          get().addEntry({ type: 'ai', text: `CURRENT_AP: ${totalAuraPoints.toLocaleString()} AP` });
          get().addEntry({ type: 'ai', text: `STREAK: ${streakDays} DAYS · MULTIPLIER: ${multiplier.toFixed(2)}×` });
          get().addEntry({ type: 'ai', text: `NEXT_MILESTONE: ${next.toLocaleString()} AP (${(next - totalAuraPoints).toLocaleString()} remaining)` });
          get().addEntry({ type: 'ai', text: 'SHOP_REWARDS_UNLOCKED_AT_EACH_MILESTONE.' });
        } else if (cmd === 'redeem') {
          get().addEntry({ type: 'ai', text: 'EXCHANGE_RATE: 1000_AP = $0.10' });
          get().addEntry({ type: 'ai', text: 'STATUS: SHOP_MODULE_INITIALIZED.' });
          get().addEntry({ type: 'ai', text: 'NAVIGATE_TO_SHOP_TO_CONVERT_AURA_TO_REAL_WORLD_VAL.' });
        } else if (cmd.startsWith('complete')) {
          const target = cmd.replace(/^complete\s*/i, '').trim();
          if (!target) {
            get().addEntry({ type: 'ai', text: 'USAGE: complete <task name>' });
          } else {
            const tasks = useTaskStore.getState().tasks;
            const match = tasks.find(t => (t.title || t.name || '').toUpperCase().includes(target.toUpperCase()));
            if (!match) {
              get().addEntry({ type: 'ai', text: `UNKNOWN_TASK: "${target.toUpperCase()}" NOT FOUND IN REGISTRY.` });
              get().addEntry({ type: 'ai', text: `REGISTERED_TASKS: ${tasks.map(t => t.title || t.name).join(', ') || 'none'}` });
            } else {
              const { addCategoryAP, checkAndUpdateStreak } = useAuraStore.getState();
              addCategoryAP('MISC', 50, `COMMAND: COMPLETED ${match.title || match.name}`);
              checkAndUpdateStreak();
              get().addEntry({ type: 'ai', text: `TASK_COMPLETED: ${(match.title || match.name).toUpperCase()} [+50_AP]` });
            }
          }
        } else if (cmd.startsWith('timer')) {
          const sub = cmd.replace(/^timer\s*/i, '').trim();
          if (sub === 'start') {
            set({ timerStart: Date.now() });
            get().addEntry({ type: 'ai', text: 'TIMER_STARTED. EXECUTE [TIMER STOP] TO LOG SESSION.' });
          } else if (sub === 'stop') {
            const { timerStart } = get();
            if (!timerStart) {
              get().addEntry({ type: 'ai', text: 'ERROR: NO_ACTIVE_TIMER. EXECUTE [TIMER START] FIRST.' });
            } else {
              const elapsed = Math.max(1, Math.round((Date.now() - timerStart) / 60000));
              set({ timerStart: null });
              const { addCategoryAP, checkAndUpdateStreak } = useAuraStore.getState();
              const ap = Math.min(200, Math.round((elapsed / 120) * 200));
              addCategoryAP('STUDY', ap, `COMMAND: STUDY SESSION ${elapsed}m`);
              checkAndUpdateStreak();
              get().addEntry({ type: 'ai', text: `TIMER_STOPPED. SESSION: ${elapsed}m. +${ap}_AP_AWARDED.` });
            }
          } else {
            get().addEntry({ type: 'ai', text: 'USAGE: [TIMER START] | [TIMER STOP]' });
          }
        } else if (cmd === 'help') {
          get().addEntry({ type: 'ai', text: 'AVAILABLE_COMMANDS: [CRITIQUE, STATUS, COMMEND, REWARD, REDEEM, COMPLETE <task>, TIMER START, TIMER STOP, HELP, CLEAR]' });
        } else if (cmd === 'clear') {
          const { history } = get();
          const permanentTypes = ['system', 'update', 'permanent'];
          set({ history: history.filter(item => permanentTypes.includes(item.type)) });
        } else {
          get().addEntry({ type: 'ai', text: 'COMMAND_UNKNOWN. TYPE [HELP] FOR_LIST.' });
        }
      }
    }),
    { name: 'antigravity-command-store' }
  )
);
