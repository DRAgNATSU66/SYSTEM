import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar/Sidebar';
import Header from './components/layout/Header/Header';
import { useCloudSync } from './hooks/useCloudSync';
import { useUiStore } from './store/uiStore';
import './index.css';

function App() {
  useCloudSync();
  const sidebarOpen = useUiStore(state => state.sidebarOpen);

  return (
    <div className="app-layout">
      <Sidebar />
      <main
        className="content-area"
        style={!sidebarOpen ? { marginLeft: 0, width: '100%' } : undefined}
      >
        <Header />
        <Outlet />
      </main>
    </div>
  );
}

export default App;
