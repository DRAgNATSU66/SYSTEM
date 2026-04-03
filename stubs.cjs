const fs = require('fs');
const path = require('path');

const files = {
  // Constants
  'src/constants/ranks.js': `export const RANKS = {\n  ALPHA: { min: 900, title: 'IM HIM', color: '#00BFFF' },\n  SIGMA: { min: 700, title: 'Grinder', color: '#39FF14' },\n  DREAMER: { min: 500, title: 'Dreamer', color: '#FFD700' },\n  SLACKING: { min: 300, title: 'Caught Lacking', color: '#FF3131' },\n  BETA: { min: 0, title: 'Normie', color: '#9E9E9E' }\n};\n`,
  'src/constants/taskTypes.js': `export const TASK_TYPES = { PERMANENT_DAILY: 'PERMANENT_DAILY', SIDE_HUSTLE: 'SIDE_HUSTLE', MONTHLY: 'MONTHLY', TEMPORARY: 'TEMPORARY', SINGLE_DAY: 'SINGLE_DAY' };\n`,
  'src/constants/colors.js': `export const COLORS = { primary: '#00BFFF', secondary: '#39FF14' };\n`,
  'src/constants/scoreWeights.js': `export const DEFAULT_WEIGHTS = { workout: 200, study: 200, habits: 200, sleep: 200, sides: 200 };\n`,
  'src/constants/auraPoints.js': `export const AURA_RULES = { MAX_EARN: 1000, MAX_LOSE: -1000 };\n`,
  'src/constants/multipliers.js': `export const MULTIPLIERS = {};\n`,
  'src/constants/penalties.js': `export const PENALTIES = {};\n`,
  'src/constants/leaderboardRanks.js': `export const LEADERBOARD_RANKS = { 1: 'AURA FARMER', 2: 'THE ALPHA AND THE OMEGA', 3: 'SIGMA' };\n`,

  // Utils
  'src/utils/scoreCalculator.js': `export const computeDailyScore = (tasks) => { return 0; };\n`,
  'src/utils/rankResolver.js': `import { RANKS } from '../constants/ranks';\nexport const resolveRank = (score) => { return Object.values(RANKS).find(r => score >= r.min) || RANKS.BETA; };\n`,
  'src/utils/dateUtils.js': `export const getTodayStr = () => new Date().toISOString().split('T')[0];\n`,
  'src/utils/chartHelpers.js': `export const formatChartData = () => [];\n`,
  'src/utils/auraCalculator.js': `export const computeAuraPoints = () => 0;\n`,
  'src/utils/multiplierResolver.js': `export const resolveMultiplier = (streakDays) => 1.0;\n`,
  'src/utils/penaltyEngine.js': `export const computePenalties = () => 0;\n`,

  // Hooks
  'src/hooks/useTasks.js': `export const useTasks = () => [];\n`,
  'src/hooks/useScore.js': `export const useScore = () => 0;\n`,
  'src/hooks/useRank.js': `export const useRank = () => ({ title: 'Normie' });\n`,
  'src/hooks/useStreak.js': `export const useStreak = () => 0;\n`,
  'src/hooks/useHeatmap.js': `export const useHeatmap = () => [];\n`,
  'src/hooks/useLocalStorage.js': `export const useLocalStorage = () => [];\n`,
  'src/hooks/useAuraPoints.js': `export const useAuraPoints = () => 0;\n`,
  'src/hooks/useMultiplier.js': `export const useMultiplier = () => 1;\n`,
  'src/hooks/useLeaderboard.js': `export const useLeaderboard = () => [];\n`,

  // Stores (Zustand)
  'src/store/taskStore.js': `import { create } from 'zustand';\nexport const useTaskStore = create((set) => ({ tasks: [], completions: {}, addTask: () => set() }));\n`,
  'src/store/userStore.js': `import { create } from 'zustand';\nexport const useUserStore = create((set) => ({ profile: { name: 'User', avatar: '' }, preferences: {} }));\n`,
  'src/store/scoreStore.js': `import { create } from 'zustand';\nexport const useScoreStore = create((set) => ({ dailyScores: {}, todayScore: 0, weeklyScores: [] }));\n`,
  'src/store/uiStore.js': `import { create } from 'zustand';\nexport const useUiStore = create((set) => ({ sidebarOpen: true, activeModal: null, theme: 'dark', toggleSidebar: () => set(state => ({ sidebarOpen: !state.sidebarOpen })) }));\n`,
  'src/store/auraStore.js': `import { create } from 'zustand';\nexport const useAuraStore = create((set) => ({ totalAuraPoints: 0, todayNet: 0, multiplier: 1.0, streakDays: 0, penaltyLog: [], auraHistory: [] }));\n`,

  // Services
  'src/services/supabaseClient.js': `// export const supabase = createClient(URL, KEY);\n`,
  'src/services/taskService.js': `export const taskService = { getTasks: async () => [] };\n`,
  'src/services/scoreService.js': `export const scoreService = { getScores: async () => [] };\n`,
  'src/services/userService.js': `export const userService = { getProfile: async () => ({}) };\n`,
  'src/services/auraService.js': `export const auraService = { getTotalAP: async () => 0 };\n`,

  // Routing
  'src/router/routes.jsx': `import { createBrowserRouter } from 'react-router-dom';\nimport App from '../App';\nimport DashboardPage from '../pages/Dashboard/DashboardPage';\n// Stubs for other routes\nexport const router = createBrowserRouter([\n  { path: '/', element: <App />, children: [\n    { index: true, element: <DashboardPage /> }\n  ]}\n]);\n`,

  // Example Page Stub
  'src/pages/Dashboard/DashboardPage.jsx': `import React from 'react';\n\nconst DashboardPage = () => {\n  return (\n    <div className="dashboard">\n      <h1>Dashboard</h1>\n      <p>Score: 847 | Rank: GRINDER</p>\n    </div>\n  );\n};\nexport default DashboardPage;\n`,

  // App & Main updates
  'src/App.jsx': `import { Outlet } from 'react-router-dom';\nimport './index.css';\n\nfunction App() {\n  return (\n    <div className="app-layout">\n      <aside>Sidebar</aside>\n      <main>\n        <header>Header</header>\n        <Outlet />\n      </main>\n    </div>\n  );\n}\nexport default App;\n`,
  'src/main.jsx': `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport { RouterProvider } from 'react-router-dom';\nimport { router } from './router/routes';\nimport './index.css';\n\nReactDOM.createRoot(document.getElementById('root')).render(\n  <React.StrictMode>\n    <RouterProvider router={router} />\n  </React.StrictMode>\n);\n`
};

Object.keys(files).forEach(file => {
  const fullPath = path.join(__dirname, file);
  fs.writeFileSync(fullPath, files[file]);
  console.log(`Created file: ${file}`);
});
