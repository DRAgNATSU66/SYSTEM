import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar/Sidebar';
import Header from './components/layout/Header/Header';
import { useCloudSync } from './hooks/useCloudSync';
import './index.css';

function App() {
  // Mount the global background syncer
  useCloudSync();

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="content-area">
        <Header />
        <Outlet />
      </main>
    </div>
  );
}

export default App;
