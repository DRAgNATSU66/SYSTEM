const fs = require('fs');
const path = require('path');

const folders = [
  'src/router',
  'src/assets/fonts',
  'src/assets/icons',
  'src/constants',
  'src/utils',
  'src/hooks',
  'src/store',
  'src/services',
  'src/components/layout/Sidebar',
  'src/components/layout/Header',
  'src/components/layout/PageWrapper',
  'src/components/layout/BottomNav',
  'src/components/charts/BarLineChart',
  'src/components/charts/RadarChart',
  'src/components/charts/PieChart',
  'src/components/charts/WaveChart',
  'src/components/charts/CircularProgress',
  'src/components/charts/CalendarHeatmap',
  'src/components/tasks/TaskCard',
  'src/components/tasks/TaskList',
  'src/components/tasks/TaskModal',
  'src/components/tasks/TaskForm',
  'src/components/tasks/SubTaskPanel',
  'src/components/tasks/TaskBadge',
  'src/components/gamification/RankCard',
  'src/components/gamification/ScoreDisplay',
  'src/components/gamification/StreakCounter',
  'src/components/gamification/XPBar',
  'src/components/gamification/AchievementBadge',
  'src/components/gamification/AuraPointsDisplay',
  'src/components/gamification/MultiplierBadge',
  'src/components/gamification/PenaltyAlert',
  'src/components/leaderboard/LeaderboardTable',
  'src/components/leaderboard/TopThreePodium',
  'src/components/leaderboard/SelfRankCard',
  'src/components/leaderboard/AuraHistory',
  'src/components/ui/Button',
  'src/components/ui/Modal',
  'src/components/ui/Card',
  'src/components/ui/Badge',
  'src/components/ui/Tooltip',
  'src/components/ui/Toggle',
  'src/components/ui/Loader',
  'src/components/ui/Divider',
  'src/components/three/ParticleBackground',
  'src/components/three/GlobeStats',
  'src/components/three/FloatingOrbs',
  'src/pages/Dashboard',
  'src/pages/Workout/subgroups',
  'src/pages/Study/subjects',
  'src/pages/Nutrition',
  'src/pages/Sleep',
  'src/pages/Habits',
  'src/pages/SideHustles',
  'src/pages/Goals',
  'src/pages/Mood',
  'src/pages/Calendar',
  'src/pages/Settings',
  'src/pages/Leaderboard'
];

folders.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});
