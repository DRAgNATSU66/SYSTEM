/* eslint-disable react-refresh/only-export-components */
import { createBrowserRouter, Navigate } from 'react-router-dom';
import App from '../App';
import DashboardPage from '../pages/Dashboard/DashboardPage';
import HabitsPage from '../pages/Habits/HabitsPage';
import WorkoutPage from '../pages/Workout/WorkoutPage';
import StudyPage from '../pages/Study/StudyPage';
import LeaderboardPage from '../pages/Leaderboard/LeaderboardPage';
import SettingsPage from '../pages/Settings/SettingsPage';
import AuraHistoryPage from '../pages/History/AuraHistoryPage';
import SleepPage from '../pages/Sleep/SleepPage';
import MoodPage from '../pages/Mood/MoodPage';
import NutritionPage from '../pages/Nutrition/NutritionPage';
import CalendarPage from '../pages/Calendar/CalendarPage';
import GoalsPage from '../pages/Goals/GoalsPage';
import ProjectsPage from '../pages/SideHustles/ProjectsPage';
import CommandPage from '../pages/Command/CommandPage';
import FriendsPage from '../pages/Social/FriendsPage';
import DuelPage from '../pages/Duels/DuelPage';
import ShopPage from '../pages/Shop/ShopPage';
import AuthPage from '../pages/Auth/AuthPage';
import { useUserStore } from '../store/userStore';

const ProtectedRoute = ({ children }) => {
  const user = useUserStore((state) => state.user);
  const authLoading = useUserStore((state) => state.authLoading);
  if (authLoading) return null;
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  return children;
};

// Generic placeholder for missing pages
const Placeholder = ({ title }) => (
  <div style={{padding: '5rem', color: '#fff'}}>
    <h2 style={{fontFamily: 'Outfit', color: 'var(--rank-alpha)'}}>{title} Engine</h2>
    <p style={{color: 'var(--text-secondary)'}}>Neural pathways initializing... System sync in progress.</p>
  </div>
);

export const router = createBrowserRouter([
  { path: '/auth', element: <AuthPage /> },
  { 
    path: '/', 
    element: <ProtectedRoute><App /></ProtectedRoute>, 
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'command', element: <CommandPage /> },
      { path: 'habits', element: <HabitsPage /> },
      { path: 'workout', element: <WorkoutPage /> },
      { path: 'study', element: <StudyPage /> },
      { path: 'nutrition', element: <NutritionPage /> },
      { path: 'sleep', element: <SleepPage /> },
      { path: 'mood', element: <MoodPage /> },
      { path: 'goals', element: <GoalsPage /> },
      { path: 'sidehustles', element: <ProjectsPage /> },
      { path: 'social', element: <FriendsPage /> },
      { path: 'duels', element: <DuelPage /> },
      { path: 'leaderboard', element: <LeaderboardPage /> },
      { path: 'history', element: <AuraHistoryPage /> },
      { path: 'calendar', element: <CalendarPage /> },
      { path: 'shop', element: <ShopPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: '*', element: <Navigate to="/" replace /> }
    ]
  }
]);
