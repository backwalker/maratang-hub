import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Topbar from './components/layout/Topbar';
import Dashboard from './pages/Dashboard';
import Ledger from './pages/Ledger';
import Schedule from './pages/Schedule';
import Attendance from './pages/Attendance';
import Inventory from './pages/Inventory';
import DataCenter from './pages/DataCenter';
import Staff from './pages/Staff';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app-container" style={{ flexDirection: 'column' }}>
        <Topbar />
        <div className="page-content" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/ledger" element={<Ledger />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/datacenter" element={<DataCenter />} />
            <Route path="/staff" element={<Staff />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
