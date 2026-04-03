import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateCritique } from '../utils/critiqueEngine';

export const useCommandStore = create(
  persist(
    (set, get) => ({
      history: [
        { id: 'boot-1', type: 'system', text: 'SYSTEM_BOOT . . . [V9.0.1 ALPHA]' },
        { id: 'boot-2', type: 'system', text: 'SCANNING_ENVIRONMENT . . . [SECURE_ENCLAVE]' },
        { id: 'boot-3', type: 'update', text: 'SYNCING_USER_BIOMETRICS . . . [SUCCESS]' }
      ],
      
      addEntry: (entry) => set((state) => ({ 
        history: [...state.history, { ...entry, id: Date.now().toString() }] 
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
          get().addEntry({ type: 'ai', text: 'UPCOMING_REWARDS:' });
          get().addEntry({ type: 'ai', text: '• 500 AP -> NEXT_RANK_UP' });
          get().addEntry({ type: 'ai', text: '• 1000 AP -> REDEEMABLE_CREDIT_VOUCHER' });
          get().addEntry({ type: 'ai', text: '• 3_DAY_STREAK -> 1.25X_MULTIPLIER' });
        } else if (cmd === 'redeem') {
          get().addEntry({ type: 'ai', text: 'EXCHANGE_RATE: 1000_AP = $0.10' });
          get().addEntry({ type: 'ai', text: 'STATUS: SHOP_MODULE_INITIALIZED.' });
          get().addEntry({ type: 'ai', text: 'NAVIGATE_TO_SHOP_TO_CONVERT_AURA_TO_REAL_WORLD_VAL.' });
        } else if (cmd === 'help') {
          get().addEntry({ type: 'ai', text: 'AVAILABLE_COMMANDS: [CRITIQUE, STATUS, COMMEND, REWARD, REDEEM, HELP, CLEAR]' });
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
