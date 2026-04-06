import React, { useState } from 'react';
import { ClipboardEdit, ShoppingCart, ArrowLeft, Save, Plus, BarChart3, Trash2, CheckCircle2, PackageSearch } from 'lucide-react';

const Inventory = () => {
  const [mode, setMode] = useState('select'); // 'select', 'usage', 'stock', 'order'

  const [items, setItems] = useState([
    { id: 1, name: '사골육수 팩', stock: '10', used: '', orderAmount: '', supplier: '서울', minStock: '5', price: '12000', isOrdered: false, pendingAmount: '' },
    { id: 2, name: '넙적당면', stock: '5', used: '', orderAmount: '', supplier: '대구', minStock: '10', price: '8000', isOrdered: false, pendingAmount: '' },
    { id: 3, name: '푸주', stock: '2', used: '', orderAmount: '', supplier: '서울', minStock: '3', price: '15000', isOrdered: false, pendingAmount: '' },
  ]);

  const handleChange = (id, field, value) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const addNewItem = () => {
    setItems([...items, { id: Date.now(), name: '상 품 명', stock: '', used: '', orderAmount: '', supplier: '서울', minStock: '', price: '', isOrdered: false, pendingAmount: '' }]);
  };

  const deleteItem = (id, name) => {
    if (window.confirm(`[${name}] 품목을 정말로 삭제하시겠습니까?`)) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  // 1단계: 사용량 반영 (재고에서 차감 + 소비 히스토리 기록)
  const saveUsage = () => {
    const usageToLog = items.filter(item => Number(item.used || 0) > 0);
    if (usageToLog.length === 0) {
      alert('입력된 사용량이 없습니다.');
      return;
    }

    if (!window.confirm('입력하신 사용량을 실제 재고에서 차감하시겠습니까?')) return;
    
    // 소비 히스토리 저장 (데이터 센터용)
    try {
      const history = JSON.parse(localStorage.getItem('maratang_usage_history') || '[]');
      const newRecords = usageToLog.map(item => ({
        id: Date.now() + Math.random(),
        itemId: item.id,
        name: item.name,
        amount: Number(item.used),
        date: new Date().toISOString().split('T')[0]
      }));
      localStorage.setItem('maratang_usage_history', JSON.stringify([...history, ...newRecords]));
    } catch (e) {
      console.error('Usage history save error:', e);
    }

    setItems(items.map(item => {
      const usedVal = Number(item.used || 0);
      const currentStock = Number(item.stock || 0);
      return { 
        ...item, 
        stock: String(Math.max(0, currentStock - usedVal)), 
        used: '' // 차감 후 초기화
      };
    }));
    alert('사용량이 재고에 반영되고 분석 장부에 기록되었습니다.');
    setMode('select');
  };

  // 2단계: 발주 처리 (대기 상태로 전환)
  const completeOrder = (id) => {
    setItems(items.map(item => {
      if (item.id !== id) return item;
      return { 
        ...item, 
        isOrdered: true, 
        pendingAmount: item.orderAmount 
      };
    }));
  };

  // 3단계: 물건 수령 (재고에 합산 + 금융 장부에 기록)
  const receiveOrder = (id) => {
    setItems(items.map(item => {
      if (item.id !== id) return item;
      const currentStock = Number(item.stock || 0);
      const receivedAmount = Number(item.pendingAmount || 0);
      const unitPrice = Number(item.price || 0);
      
      // 금융 데이터 센터를 위해 발주 내역 기록 저장
      try {
        const history = JSON.parse(localStorage.getItem('maratang_order_history') || '[]');
        const newRecord = {
          id: Date.now(),
          itemId: item.id,
          name: item.name,
          amount: receivedAmount,
          price: unitPrice,
          total: receivedAmount * unitPrice,
          date: new Date().toISOString().split('T')[0] // 'YYYY-MM-DD'
        };
        localStorage.setItem('maratang_order_history', JSON.stringify([...history, newRecord]));
        console.log('Order history logged:', newRecord);
      } catch (e) {
        console.error('Order history save error:', e);
      }

      return { 
        ...item, 
        stock: String(currentStock + receivedAmount), 
        isOrdered: false, 
        pendingAmount: '',
        orderAmount: '' 
      };
    }));
    alert('물건을 수령하여 재고에 반영했습니다!');
  };

  // 공통 커스텀 입력 컴포넌트 (텍스트용: 품목명 등)
  const SimpleTextInput = ({ value, onChange, placeholder, color, bold = false }) => {
    const [isEditing, setIsEditing] = React.useState(false);

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%' }}>
        <input 
          type="text" 
          value={value} 
          placeholder={placeholder}
          disabled={!isEditing}
          style={{ 
            fontSize: bold ? '1.5rem' : '1.25rem', 
            padding: '0.75rem', 
            fontWeight: bold ? '800' : '600', 
            color: color, 
            width: '100%', 
            border: isEditing ? `3px solid var(--color-primary)` : '3px solid transparent', 
            borderRadius: '0.75rem', 
            background: isEditing ? 'white' : 'transparent',
            flex: 1 
          }}
          onChange={e => onChange(e.target.value)} 
        />
        <button 
          onClick={() => setIsEditing(!isEditing)}
          style={{ 
            padding: '0.5rem 1rem', 
            fontSize: '1rem', 
            fontWeight: 800, 
            background: isEditing ? 'var(--color-primary)' : '#e2e8f0', 
            color: isEditing ? 'white' : 'var(--color-text)', 
            border: 'none', 
            borderRadius: '0.75rem', 
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          {isEditing ? '완료' : '수정'}
        </button>
      </div>
    );
  };


  // 공통 커스텀 입력 컴포넌트 (수정하기 버튼 포함: 숫자용)
  const SimpleStockInput = ({ value, onChange, placeholder, color, disabled = false }) => {
    const [isEditing, setIsEditing] = React.useState(false);

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <input 
          type="number" 
          step="0.5"
          value={value} 
          placeholder={placeholder}
          disabled={disabled || !isEditing}
          style={{ 
            fontSize: '1.5rem', 
            padding: '0.75rem', 
            textAlign: 'center', 
            fontWeight: '900', 
            color: color, 
            width: '100%', 
            border: isEditing ? `3px solid ${color}` : '3px solid transparent', 
            borderRadius: '1rem', 
            background: isEditing ? 'white' : disabled ? '#f1f5f9' : '#f8fafc',
            flex: 1 
          }}
          onChange={e => onChange(e.target.value)} 
        />
        {!disabled && (
          <button 
            onClick={() => setIsEditing(!isEditing)}
            style={{ 
              padding: '0.5rem 1rem', 
              fontSize: '1rem', 
              fontWeight: 800, 
              background: isEditing ? 'var(--color-primary)' : '#e2e8f0', 
              color: isEditing ? 'white' : 'var(--color-text)', 
              border: 'none', 
              borderRadius: '0.75rem', 
              cursor: 'pointer',
              minWidth: '60px'
            }}
          >
            {isEditing ? 'ok' : '..'}
          </button>
        )}
      </div>
    );
  };

  const [isMarketModalOpen, setIsMarketModalOpen] = useState(false);
  const [marketAmount, setMarketAmount] = useState('');
  const [marketMemo, setMarketMemo] = useState('');

  const saveMarketReceipt = () => {
    if (!marketAmount) {
      alert('금액을 입력해주세요!');
      return;
    }

    try {
      const history = JSON.parse(localStorage.getItem('maratang_order_history') || '[]');
      const newRecord = {
        id: Date.now(),
        type: 'MARKET',
        name: marketMemo || '기타 장보기 (야채 등)',
        amount: 1,
        price: Number(marketAmount),
        total: Number(marketAmount),
        date: new Date().toISOString().split('T')[0]
      };
      localStorage.setItem('maratang_order_history', JSON.stringify([...history, newRecord]));
      alert('장보기 지출이 장부에 기록되었습니다!');
      setIsMarketModalOpen(false);
      setMarketAmount('');
      setMarketMemo('');
    } catch (e) {
      console.error('Market save error:', e);
    }
  };

  if (mode === 'select') {
    return (
      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', flex: 1 }}>
          <button 
            onClick={() => setMode('stock')}
            style={{ 
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', 
              border: '6px solid #8b5cf6', borderRadius: '1.5rem', cursor: 'pointer', background: 'white', 
              transition: 'transform 0.1s', boxShadow: 'var(--shadow-md)' 
            }}
          >
            <BarChart3 size={70} color="#8b5cf6" />
            <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#8b5cf6', margin: 0 }}>현 재고 관리</h2>
          </button>

          <button 
            onClick={() => setMode('usage')}
            style={{ 
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', 
              border: '6px solid #f59e0b', borderRadius: '1.5rem', cursor: 'pointer', background: 'white', 
              transition: 'transform 0.1s', boxShadow: 'var(--shadow-md)' 
            }}
          >
            <ClipboardEdit size={70} color="#f59e0b" />
            <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#f59e0b', margin: 0 }}>사용량 입력</h2>
          </button>

          <button 
            onClick={() => setMode('order')}
            style={{ 
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', 
              border: '6px solid #10b981', borderRadius: '1.5rem', cursor: 'pointer', background: 'white', 
              transition: 'transform 0.1s', boxShadow: 'var(--shadow-md)' 
            }}
          >
            <ShoppingCart size={70} color="#10b981" />
            <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#10b981', margin: 0 }}>발주 준비</h2>
          </button>

          <button 
            onClick={() => setIsMarketModalOpen(true)}
            style={{ 
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', 
              border: '6px solid #f43f5e', borderRadius: '1.5rem', cursor: 'pointer', background: 'white', 
              transition: 'transform 0.1s', boxShadow: 'var(--shadow-md)' 
            }}
          >
            <ShoppingCart size={70} color="#f43f5e" />
            <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#f43f5e', margin: 0 }}>마트 장보기</h2>
          </button>
        </div>

        {/* 장보기(영수증) 입력 모달 */}
        {isMarketModalOpen && (
          <div style={{ position: 'fixed', top:0, left:0, width:'100vw', height:'100vh', background:'rgba(0,0,0,0.6)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:2000 }}>
            <div className="card" style={{ width:'90%', maxWidth:'500px', padding:'3rem', display:'flex', flexDirection:'column', gap:'2rem', animation: 'scaleUp 0.1s ease-out' }}>
              <h2 style={{ fontSize: '2.5rem', margin: 0, fontWeight: 900, color: '#f43f5e', textAlign: 'center' }}>🛒 장보기 비용 입력</h2>
              <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>
                <div>
                  <label style={{ fontSize:'1.25rem', fontWeight:800, marginBottom:'0.5rem', display:'block' }}>결제 금액 (원)</label>
                  <input type="number" value={marketAmount} onChange={e => setMarketAmount(e.target.value)} placeholder="금액을 입력하세요" style={{ width:'100%', padding:'1.5rem', fontSize:'2rem', borderRadius:'1rem', border:'3px solid #fecaca', textAlign:'center', fontWeight:900 }} />
                </div>
                <div>
                  <label style={{ fontSize:'1.25rem', fontWeight:800, marginBottom:'0.5rem', display:'block' }}>메모 (선택)</label>
                  <input type="text" value={marketMemo} onChange={e => setMarketMemo(e.target.value)} placeholder="예: 야채, 일회용품 등" style={{ width:'100%', padding:'1rem', fontSize:'1.5rem', borderRadius:'1rem', border:'2px solid #e2e8f0', textAlign:'center' }} />
                </div>
              </div>
              <div style={{ display:'flex', gap:'1rem' }}>
                <button onClick={() => setIsMarketModalOpen(false)} className="btn" style={{ flex:1, padding:'1.5rem', fontSize:'1.5rem', background:'#f1f5f9', fontWeight:800 }}>취소</button>
                <button onClick={saveMarketReceipt} className="btn" style={{ flex:2, padding:'1.5rem', fontSize:'1.75rem', background:'#f43f5e', color:'white', fontWeight:900 }}>장부에 기록하기</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const getPageTitle = () => {
    if (mode === 'usage') return '사용량 입력 (매장 소모분)';
    if (mode === 'stock') return '현재 매장 재고 현황 관리';
    return '발주할 물량 결정하기 (발주 준비)';
  };

  const getThemeColor = () => {
    if (mode === 'usage') return '#f59e0b';
    if (mode === 'stock') return '#8b5cf6';
    return '#10b981';
  };

  const themeColor = getThemeColor();

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', flex: 1 }}>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button 
          onClick={() => setMode('select')}
          style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 2rem', fontSize: '1.5rem', fontWeight: 800, background: '#f1f5f9', border: 'none', borderRadius: '1rem', cursor: 'pointer' }}
        >
          <ArrowLeft size={32} /> 뒤로
        </button>
        <h2 style={{ fontSize: '2rem', color: themeColor, margin: 0, fontWeight: 900 }}>{getPageTitle()}</h2>
        <button 
          onClick={addNewItem}
          style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 2rem', fontSize: '1.5rem', fontWeight: 800, background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '1rem', cursor: 'pointer' }}
        >
          <Plus size={32} /> 새 품목 추가
        </button>
      </div>

      <div className="card" style={{ padding: 0, flex: 1, overflowY: 'auto' }}>
        <div className="table-container mobile-table-card" style={{ border: 'none', borderRadius: 0 }}>
          <table className="data-table" style={{ fontSize: '1rem' }}>
            <thead>
                <tr>
                <th style={{ width: mode === 'stock' ? '18%' : '20%', padding: '1rem' }}>품목 명</th>
                {(mode === 'stock' || mode === 'order') && (
                  <th style={{ width: '15%', padding: '1rem', textAlign: 'center' }}>발주처</th>
                )}
                {mode === 'stock' && (
                  <>
                    <th style={{ width: '12%', padding: '1rem', textAlign: 'center' }}>알림 기준</th>
                    <th style={{ width: '15%', padding: '1rem', textAlign: 'center' }}>단가 (원)</th>
                  </>
                )}
                {(mode === 'stock' || mode === 'order') && (
                  <th style={{ width: mode === 'stock' ? '15%' : '15%', padding: '1rem', textAlign: 'center' }}>현재 재고</th>
                )}
                {(mode === 'usage' || mode === 'order') && (
                  <th style={{ width: mode === 'order' ? '25%' : '40%', padding: '1rem', textAlign: 'center' }}>
                    {mode === 'usage' ? '사용량' : '발주수량'}
                  </th>
                )}
                <th style={{ width: '15%', padding: '1rem', textAlign: 'center' }}>작업</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const filteredItems = items.filter(item => {
                  if (mode !== 'order') return true;
                  if (item.stock === '' || item.minStock === '') return false;
                  return Number(item.stock) < Number(item.minStock) || item.isOrdered;
                });

                if (filteredItems.length === 0 && mode === 'order') {
                  return (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', fontSize: '1.2rem', color: 'var(--color-text-muted)' }}>
                        ✅ 현재 발주가 필요한 품목이 없습니다!
                      </td>
                    </tr>
                  );
                }

                return filteredItems.map(item => (
                  <tr key={item.id} style={{ opacity: item.isOrdered && mode === 'order' ? 0.7 : 1 }}>
                    <td data-label="품목 명">
                      <SimpleTextInput 
                        value={item.name} 
                        onChange={(val) => handleChange(item.id, 'name', val)} 
                        placeholder="상 품 명" 
                        color="var(--color-text)"
                        bold={true}
                      />
                    </td>

                    {(mode === 'stock' || mode === 'order') && (
                      <td data-label="발주처">
                        <div style={{ display: 'flex', gap: '0.2rem', justifyContent: 'center', width: '100%' }}>
                          <button 
                            onClick={() => handleChange(item.id, 'supplier', '서울')}
                            style={{ padding: '0.6rem', flex: 1, fontSize: '0.9rem', fontWeight: 800, borderRadius: '0.5rem', border: 'none', background: item.supplier === '서울' ? 'var(--color-primary)' : '#e2e8f0', color: item.supplier === '서울' ? 'white' : 'var(--color-text)' }}
                          >서울</button>
                          <button 
                            onClick={() => handleChange(item.id, 'supplier', '대구')}
                            style={{ padding: '0.6rem', flex: 1, fontSize: '0.9rem', fontWeight: 800, borderRadius: '0.5rem', border: 'none', background: item.supplier === '대구' ? 'var(--color-primary)' : '#e2e8f0', color: item.supplier === '대구' ? 'white' : 'var(--color-text)' }}
                          >대구</button>
                        </div>
                      </td>
                    )}

                    {mode === 'stock' && (
                      <>
                        <td data-label="알림 기준"><SimpleStockInput value={item.minStock} onChange={(val) => handleChange(item.id, 'minStock', val)} placeholder="기준" color="var(--color-danger)" /></td>
                        <td data-label="단가 (원)"><SimpleStockInput value={item.price} onChange={(val) => handleChange(item.id, 'price', val)} placeholder="단가" color="var(--color-primary)" /></td>
                      </>
                    )}
                    
                    {(mode === 'stock' || mode === 'order') && (
                      <td data-label="현재 재고" style={{ backgroundColor: (item.stock !== '' && item.minStock !== '' && Number(item.stock) < Number(item.minStock)) ? '#fee2e2' : 'transparent' }}>
                        <SimpleStockInput value={item.stock} onChange={(val) => handleChange(item.id, 'stock', val)} placeholder="재고량" color={mode === 'stock' ? '#8b5cf6' : 'var(--color-text-muted)'} />
                      </td>
                    )}
                    
                    {(mode === 'usage' || mode === 'order') && (
                      <td data-label={mode === 'usage' ? '오늘 사용량' : '발주할 수량'}>
                        <SimpleStockInput 
                          value={item.isOrdered ? item.pendingAmount : (mode === 'usage' ? item.used : item.orderAmount)} 
                          onChange={(val) => handleChange(item.id, mode === 'usage' ? 'used' : 'orderAmount', val)} 
                          placeholder={mode === 'usage' ? '사용량' : '발주수량'} 
                          color={themeColor}
                          disabled={item.isOrdered}
                        />
                      </td>
                    )}

                    <td data-label="작업" style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', width: '100%' }}>
                        {mode === 'order' ? (
                          item.isOrdered ? (
                            <button 
                              onClick={() => receiveOrder(item.id)}
                              style={{ padding: '0.8rem 1rem', flex: 1, background: 'var(--color-success)', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 800, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                            >
                              <CheckCircle2 size={18} /> 수령
                            </button>
                          ) : (
                            <button 
                              onClick={() => completeOrder(item.id)}
                              style={{ padding: '0.8rem 1rem', flex: 1, background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 800, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                            >
                              <Save size={18} /> 발주
                            </button>
                          )
                        ) : (
                          <button onClick={() => deleteItem(item.id, item.name)} style={{ padding: '0.8rem', background: '#fff1f2', color: 'var(--color-danger)', border: '1px solid #fecaca', borderRadius: '0.5rem' }}><Trash2 size={22} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
      </div>
      
      {mode === 'usage' && (
        <button 
          onClick={saveUsage}
          className="btn" 
          style={{ width: '100%', padding: '2rem', fontSize: '1.75rem', fontWeight: 800, borderRadius: '1.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', background: themeColor, color: 'white', boxShadow: 'var(--shadow-lg)' }}
        >
          <Save size={40} /> 사용량 만큼 재고에서 빼기 (장부 저장)
        </button>
      )}

      {mode === 'stock' && (
        <button 
          onClick={() => { alert('전체 재고 설정이 저장되었습니다.'); setMode('select'); }}
          className="btn" 
          style={{ width: '100%', padding: '2rem', fontSize: '1.75rem', fontWeight: 800, borderRadius: '1.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', background: themeColor, color: 'white', boxShadow: 'var(--shadow-lg)' }}
        >
          <Save size={40} /> 현재 재고 현황 저장하기
        </button>
      )}

    </div>
  );
};

export default Inventory;
