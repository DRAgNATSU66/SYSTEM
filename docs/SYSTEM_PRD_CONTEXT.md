# ⚛️ SYSTEM: Antigravity Life OS — PRD & System Context

**Version:** 5.2 "Atmospheric Sync"  
**Focus:** High-Performance Habit Tracking, Gamification, and Physiological Analysis.  
**Tech Stack:** React 19, Vite, Supabase, Zustand, Framer Motion, Three.js, Recharts.

---

## 1. Core Vision
SYSTEM is a premium, high-performance "Life OS" designed to track every facet of a user's life—Habits, Fitness, Study, Nutrition, Mood, and Sleep—through a gamified lens. It leverages **Aura Points (AP)** and **Ranking Tiers** to drive high-intensity personal growth.

## 2. Global UI/UX Principles
The system follows a strict **"Neural/Digital Noir"** aesthetic:
- **Glassmorphism**: High-blur backdrops (`backdrop-filter: blur(12px)`) with subtle borders.
- **Electric Blue Accents**: Primary color `#00e5ff` (Global Electric Blue).
- **Rhythmic Breathing Protocol**: A 12-second visual pulse (Cube/Circle morphing) for focus.
- **Micro-Animations**: Smooth Framer Motion transitions for every interaction.
- **PWA Ready**: Mobile-first, offline-ready Progressive Web App.

---

## 3. Core Features & Systems

### 3.1 Aura Points (AP) & Gamification
The heart of the SYSTEM. AP is earned through habit completion and lost via penalties (e.g., missed habits, midnight crunch).
- **Ranking System**: Top-3 users earn named tiers (Alpha, Beta, Gamma). All others are "Unranked #N".
- **Streak Multiplier**: Daily completion streaks scale AP earnings (up to 4.0x).
- **Aura Marketplace (Shop)**: Spend AP on professional, full-bleed assets and rewards.

### 3.2 Dashboard & Neural Pentagram
The command center of the system.
- **Neural Pentagram**: A radar chart visualizing performance across 5 key domains (Physical, Mental, Spiritual, Social, Vocational).
- **Heatmap**: View habit consistency across a 365-day grid.
- **Dynamic Greeting**: Time-aware greetings (e.g., "Good morning, Early Riser", "Hi, Midnight Owl").

### 3.3 Physiological & Performance Tracking
- **Workout Engine**: Track volume (Sets × Reps × Weight) and muscle distribution.
- **VO2 Max Calculator**: RPC-driven calculation using BPM, Distance, Time, and Age.
- **Study Pulse**: 2-hour Pomodoro/Focus sessions with real-time progress bars.
- **Sleep Quality**: Logs total duration and deep-sleep percentage.
- **Nutrition Hub**: Tracks 16 micronutrients and baseline macros.

---

## 4. Technical Architecture

### 4.1 Frontend (React/Vite)
- **Routing**: React Router v7 with protected routes (Auth gated).
- **State**: Zustand for global stores (User, UI, Habits, Scores).
- **Sync**: Offline-first `useCloudSync` hook that queues changes for Supabase.

### 4.2 Backend (Supabase/PostgreSQL)
- **RLS (Row Level Security)**: Strict isolation—users can only read/write their own data.
- **Database Functions (RPC)**:
  - `calculate_vo2max`: Computes physiological scores.
  - `compute_midnight_penalties`: Cron-triggered AP deduction for incomplete tasks.
- **Triggers**: AP updates trigger rank recalculations and streak adjustments.

---

## 5. Testable Scenarios for TestSprite

### A. Authentication & Onboarding
1. **Flow**: Signup → Player Name Prompt → Land on Dashboard.
2. **Success**: Profiles row created with initial AP = 0.

### B. Habit Completion & AP Sync
1. **Flow**: Mark "Morning Ritual" complete → Trigger AP Earned.
2. **Success**: Dashboard AP count increments; Heatmap point lights up; Supabase `aura_logs` row added.

### C. Ranking & Leaderboard
1. **Flow**: Gain AP until surpassing Rank #3.
2. **Success**: Rank changes from "Unranked" to "Gamma Rank"; Podium updates in real-time.

### D. Shop Transactions
1. **Flow**: Purchase "Elite Card Frame" for 500 AP.
2. **Success**: Transaction fails if balance < 500; Transaction succeeds if balance ≥ 500; AP deducted.

---

## 6. Critical Security & Performance Specs
- **Data Privacy**: No data is shared between users unless explicitly "Dueled".
- **Offline Reliability**: All local changes must persist via `localStorage` until `useCloudSync` resolves.
- **Performance**: Dashboard must render in < 250ms (Core Web Vitals emphasis).

---
> [!NOTE]
> This document is optimized for TestSprite AI analysis. It focuses on functional boundaries, data structures, and expected user outcomes.
