import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout: React.FC = () => (
  <div className="app-wrapper">
    <Sidebar />
    <main className="main-content">
      <Header />
      <div className="content-area" style={{ padding: '32px' }}>
        <Outlet />
      </div>
    </main>
  </div>
);

export default Layout;
