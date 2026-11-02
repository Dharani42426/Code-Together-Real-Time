import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import DashTopbar from '../components/DashTopbar';
import './DashboardLayout.css';

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="dash-layout">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <div className="dash-main">
        <DashTopbar onMenuClick={() => setCollapsed(c => !c)} />
        <main className="dash-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
