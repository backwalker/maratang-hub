import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import './Topbar.css';

const Topbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const getPageTitle = () => {
    switch(location.pathname) {
      case '/': return '춘리마라탕 자은점 매장관리';
      case '/ledger': return '매출 입력';
      case '/inventory': return '재고 및 발주 관리';
      case '/attendance': return '직원 출퇴근 관리';
      case '/schedule': return '직원 스케쥴 관리';
      case '/datacenter': return '데이터 센터';
      default: return 'Maratang POS';
    }
  };

  const isHome = location.pathname === '/';

  return (
    <header className="topbar" style={{ 
      backgroundColor: 'var(--color-primary)', 
      display: 'flex', 
      alignItems: 'center', 
      padding: '0 var(--padding-page)', 
      position: 'relative', 
      height: 'clamp(70px, 12vh, 100px)',
      boxShadow: 'var(--shadow-md)',
      zIndex: 100
    }}>
      {!isHome && (
        <button 
          onClick={() => navigate('/')}
          className="back-btn"
          style={{ 
            position: 'absolute', left: 'var(--padding-page)',
            background: 'transparent', border: 'none', color: 'white',
            display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer',
            fontSize: '1.25rem', fontWeight: 800
          }}
        >
          <ArrowLeft size={32} strokeWidth={3} /> 
          <span className="hidden-mobile">뒤로가기</span>
        </button>
      )}
      <h1 style={{ 
        margin: '0 auto', 
        fontWeight: 900, 
        color: 'white', 
        fontSize: 'clamp(1rem, 4vw, 1.75rem)',
        textAlign: 'center',
        padding: '0 3rem', // Avoid button overlap
        lineHeight: 1.2
      }}>
        {getPageTitle()}
      </h1>
    </header>
  );
};

export default Topbar;
