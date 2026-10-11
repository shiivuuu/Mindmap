import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AppSidebar from './AppSidebar';
import Topbar from './Topbar';

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Determine current page title from pathname
  const path = location.pathname.replace(/^\//, '');
  const pageTitles = {
    dashboard: 'Dashboard',
    documents: 'Document Library',
    chat: 'AI Research Chat',
    graph: 'Interactive Knowledge Graph',
    'learning-paths': 'Personalized Learning Roadmaps',
    quizzes: 'Quizzes & Assessments',
    analytics: 'Performance & Mastery Analytics',
    settings: 'Account & Platform Settings',
    admin: 'Administrative Console',
  };
  const pageTitle = pageTitles[path] || 'MindMesh AI';

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex">
      {/* Sidebar */}
      <AppSidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          collapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        <Topbar setMobileOpen={setMobileOpen} pageTitle={pageTitle} />
        
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
