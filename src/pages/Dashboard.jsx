import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, Package, Clock, CalendarDays, Database, Plus, Users } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();

  const menuItems = [
    { title: '매출 입력', icon: <Wallet size={60} />, path: '/ledger', color: '#2563eb' },
    { title: '재고 및 발주', icon: <Package size={60} />, path: '/inventory', color: '#10b981' },
    { title: '출퇴근 관리', icon: <Clock size={60} />, path: '/attendance', color: '#f59e0b' },
    { title: '스케쥴 관리', icon: <CalendarDays size={60} />, path: '/schedule', color: '#ef4444' },
    { title: '데이터 센터', icon: <Database size={60} />, path: '/datacenter', color: '#8b5cf6' },
    { title: '직원 관리', icon: <Users size={60} />, path: '/staff', color: '#f43f5e' },
  ];

  return (
    <div className="fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="grid-responsive">
        {menuItems.map((item, idx) => {
          const isEmpty = item.color === '#f1f5f9';
          return (
            <button 
              key={idx} 
              onClick={() => { if(item.path !== '/') navigate(item.path); }}
              style={{
                backgroundColor: 'white',
                border: `4px solid ${item.color}`,
                borderRadius: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1.5rem 1rem',
                gap: '1rem',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-sm)',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                borderBottom: `8px solid ${item.color}`, // Accent bottom for tactile feel
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
              onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.95) translateY(0)'; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; }}
            >
              <div style={{ color: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {React.cloneElement(item.icon, { size: 'clamp(40px, 8vw, 60px)' })}
              </div>
              <h2 style={{ 
                fontSize: 'clamp(1rem, 2.5vw, 1.5rem)', 
                color: 'var(--color-text)', 
                margin: 0, 
                fontWeight: 900,
                textAlign: 'center',
                lineHeight: 1.2
              }}>
                {item.title}
              </h2>
            </button>
          )
        })}
      </div>
    </div>
  );
};

export default Dashboard;
