import React, { useState } from 'react';
import { Save } from 'lucide-react';

const Ledger = () => {
  const getToday = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const [date, setDate] = useState(getToday());
  const [dineIn, setDineIn] = useState('');
  const [delivery, setDelivery] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    if (!dineIn && !delivery) {
      alert('매출액을 입력해주세요!');
      return;
    }

    const salesData = {
      date,
      dineIn: Number(dineIn || 0),
      delivery: Number(delivery || 0),
      total: Number(dineIn || 0) + Number(delivery || 0)
    };

    localStorage.setItem(`maratang_sales_${date}`, JSON.stringify(salesData));
    
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
    alert(`${date} 매출이 저장되었습니다!`);
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', flex: 1 }}>
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', padding: '3rem', border: 'none', boxShadow: 'var(--shadow-md)' }}>
        
        <div>
          <label style={{ display: 'block', fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--color-text-muted)' }}>
            매출 기록 날짜
          </label>
          <input 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)}
            style={{ 
              fontSize: '1.75rem', 
              padding: '1.5rem', 
              width: '100%', 
              borderRadius: '1.25rem', 
              border: '3px solid var(--color-border)', 
              textAlign: 'center',
              backgroundColor: '#f8fafc',
              fontWeight: 900
            }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--color-primary)' }}>
              🏠 홀 / 포장 매출
            </label>
            <input 
              type="number" 
              value={dineIn} 
              placeholder="0"
              onChange={(e) => setDineIn(e.target.value)}
              style={{ fontSize: '2.5rem', padding: '1.5rem', width: '100%', borderRadius: '1.5rem', border: '4px solid var(--color-primary-light)', textAlign: 'center', fontWeight: 900, color: 'var(--color-primary)', backgroundColor: '#fff' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', color: '#0ea5e9' }}>
              🛵 배달 매출
            </label>
            <input 
              type="number" 
              value={delivery} 
              placeholder="0"
              onChange={(e) => setDelivery(e.target.value)}
              style={{ fontSize: '2.5rem', padding: '1.5rem', width: '100%', borderRadius: '1.5rem', border: '4px solid #bae6fd', textAlign: 'center', fontWeight: 900, color: '#0ea5e9', backgroundColor: '#fff' }}
            />
          </div>
        </div>

      </div>

      <button 
        className="btn" 
        onClick={handleSave}
        style={{ 
          width: '100%', 
          padding: '2.5rem', 
          fontSize: '2rem', 
          fontWeight: 900, 
          borderRadius: '2rem', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          gap: '1.5rem', 
          backgroundColor: isSaved ? 'var(--color-success)' : 'var(--color-primary)',
          color: 'white',
          boxShadow: 'var(--shadow-lg)',
          transition: 'all 0.3s'
        }}
      >
        <Save size={48} /> {isSaved ? '저장 완료!' : '오늘 매출 저장하기'}
      </button>
    </div>
  );
};

export default Ledger;
