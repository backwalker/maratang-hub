import React, { useState, useEffect, useMemo } from 'react';
import { Database, TrendingUp, TrendingDown, Users, Package, CreditCard, Calendar, Calculator, Save } from 'lucide-react';

const DataCenter = () => {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // 고정 비용 및 설정 상태 (localStorage 연동)
  const [financeConfig, setFinanceConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('maratang_finance_config');
      return saved ? JSON.parse(saved) : {
        rent: 2000000,
        utilities: 500000,
        deliveryFeeRate: 15, // 배달 수수료 %
        otherExpenses: 0,
        manualTax: 0 // 고지서 세금 직접 입력
      };
    } catch (e) {
      return { rent: 2000000, utilities: 500000, deliveryFeeRate: 15, otherExpenses: 0, manualTax: 0 };
    }
  });

  const [calcData, setCalcData] = useState({
    totalSales: 0,
    deliverySales: 0,
    dineInSales: 0,
    laborCost: 0,
    materialCost: 0,
    staffDetails: [],
    topUsage: [] // [{ name, amount }]
  });

  // 데이터 집계 로직
  useEffect(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const prefix = `maratang_attendance_${year}-${String(month).padStart(2, '0')}`;
    const salesPrefix = `maratang_sales_${year}-${String(month).padStart(2, '0')}`;

    let totalLabor = 0;
    let totalDineIn = 0;
    let totalDelivery = 0;
    let totalMaterials = 0;
    let staffHoursDict = {}; // { staffName: totalMinutes }
    let usageDict = {}; // { itemName: totalQty }

    // 1. 매출 집계
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(salesPrefix)) {
        try {
          const sales = JSON.parse(localStorage.getItem(key));
          totalDineIn += Number(sales.dineIn || 0);
          totalDelivery += Number(sales.delivery || 0);
        } catch (e) {}
      }
    });

    // 2. 인건비 집계
    let staffWages = {};
    try {
      const staffList = JSON.parse(localStorage.getItem('maratang_staff') || '[]');
      staffList.forEach(s => staffWages[s.id] = { name: s.name, wage: Number(s.wage) });
    } catch (e) {}

    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(prefix)) {
        try {
          const attendance = JSON.parse(localStorage.getItem(key));
          Object.entries(attendance).forEach(([empId, record]) => {
            if (record.checkIn !== '-' && record.checkOut !== '-') {
              const [inH, inM] = record.checkIn.split(':').map(Number);
              const [outH, outM] = record.checkOut.split(':').map(Number);
              let durationMinutes = (outH * 60 + outM) - (inH * 60 + inM);
              if (durationMinutes < 0) durationMinutes += 1440;
              if (!staffHoursDict[empId]) staffHoursDict[empId] = 0;
              staffHoursDict[empId] += durationMinutes;
            }
          });
        } catch (e) {}
      }
    });

    const staffDetails = Object.entries(staffHoursDict).map(([id, mins]) => {
      const info = staffWages[id] || { name: '알 수 없음', wage: 10030 };
      const hours = mins / 60;
      const cost = hours * info.wage;
      totalLabor += cost;
      return { name: info.name, hours: hours.toFixed(1), total: cost };
    });

    // 3. 재료비 및 소비량 집계
    try {
      const history = JSON.parse(localStorage.getItem('maratang_order_history') || '[]');
      history.forEach(order => {
        if (order.date.startsWith(selectedMonth)) {
          totalMaterials += Number(order.total || 0);
        }
      });

      const usageHistory = JSON.parse(localStorage.getItem('maratang_usage_history') || '[]');
      usageHistory.forEach(log => {
        if (log.date.startsWith(selectedMonth)) {
          if (!usageDict[log.name]) usageDict[log.name] = 0;
          usageDict[log.name] += Number(log.amount || 0);
        }
      });
    } catch (e) {}

    const topUsage = Object.entries(usageDict)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    setCalcData({
      totalSales: totalDineIn + totalDelivery,
      dineInSales: totalDineIn,
      deliverySales: totalDelivery,
      laborCost: Math.round(totalLabor),
      materialCost: totalMaterials,
      staffDetails,
      topUsage
    });
  }, [selectedMonth]);

  const saveConfig = () => {
    localStorage.setItem('maratang_finance_config', JSON.stringify(financeConfig));
    alert('비용 설정이 저장되었습니다.');
  };

  const deliveryFee = useMemo(() => {
    return Math.round(calcData.deliverySales * (financeConfig.deliveryFeeRate / 100));
  }, [calcData.deliverySales, financeConfig.deliveryFeeRate]);

  const estimatedVat = useMemo(() => {
    return Math.round(calcData.totalSales / 11);
  }, [calcData.totalSales]);

  const totalExpense = useMemo(() => {
    return calcData.laborCost + calcData.materialCost + 
           Number(financeConfig.rent) + Number(financeConfig.utilities) + 
           Number(financeConfig.otherExpenses) + deliveryFee + (Number(financeConfig.manualTax) || estimatedVat);
  }, [calcData, financeConfig, deliveryFee, estimatedVat]);

  const netProfit = calcData.totalSales - totalExpense;

  const FormatWon = (val) => Number(val).toLocaleString('ko-KR') + '원';

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', flex: 1 }}>
      
      {/* 상단 월 선택 및 매출 요약 */}
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'stretch' }}>
        <div className="card" style={{ flex: 1, padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Calendar size={40} color="var(--color-primary)" />
            <input 
              type="month" 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{ fontSize: '1.75rem', padding: '0.75rem 1.25rem', borderRadius: '1rem', border: '3px solid var(--color-border)', fontWeight: 900, color: 'var(--color-primary)' }}
            />
          </div>
          <h2 style={{ fontSize: '2.5rem', margin: 0, fontWeight: 900 }}>{selectedMonth.split('-')[1]}월 재무 리포트</h2>
        </div>

        <div className="card" style={{ flex: 2, background: 'var(--color-primary)', color: 'white', padding: '2.5rem', display: 'flex', justifyContent: 'space-around', alignItems: 'center', boxShadow: '0 15px 40px rgba(37,99,235,0.2)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', opacity: 0.9, marginBottom: '0.5rem' }}>총 매출</div>
            <div style={{ fontSize: '3rem', fontWeight: 900 }}>{FormatWon(calcData.totalSales)}</div>
          </div>
          <div style={{ width: '2px', height: '80px', background: 'rgba(255,255,255,0.2)' }}></div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', opacity: 0.9, marginBottom: '0.5rem' }}>지출 합계</div>
            <div style={{ fontSize: '3rem', fontWeight: 900 }}>{FormatWon(totalExpense)}</div>
          </div>
          <div style={{ width: '2px', height: '80px', background: 'rgba(255,255,255,0.2)' }}></div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', opacity: 0.9, marginBottom: '0.5rem' }}>이번 달 순수익</div>
            <div style={{ fontSize: '3.5rem', fontWeight: 900, textDecoration: 'underline', color: '#fcd34d' }}>{FormatWon(netProfit)}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        
        {/* 지출 상세 설정 */}
        <div className="card" style={{ padding: '2.5rem' }}>
          <h3 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Calculator size={40} color="var(--color-primary)" /> 비용 및 수수료 설정
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontWeight: 800, fontSize: '1.25rem' }}>
                상가 임대료 (원)
                <input type="number" value={financeConfig.rent} onChange={e => setFinanceConfig({...financeConfig, rent: e.target.value})} style={{ padding: '1.25rem', fontSize: '1.5rem', borderRadius: '1rem', border: '3px solid #e2e8f0', fontWeight: 700 }} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontWeight: 800, fontSize: '1.25rem' }}>
                공과금/보험 (원)
                <input type="number" value={financeConfig.utilities} onChange={e => setFinanceConfig({...financeConfig, utilities: e.target.value})} style={{ padding: '1.25rem', fontSize: '1.5rem', borderRadius: '1rem', border: '3px solid #e2e8f0', fontWeight: 700 }} />
              </label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontWeight: 800, fontSize: '1.25rem' }}>
                배달 수수료율 (%)
                <input type="number" value={financeConfig.deliveryFeeRate} onChange={e => setFinanceConfig({...financeConfig, deliveryFeeRate: e.target.value})} style={{ padding: '1.25rem', fontSize: '1.5rem', borderRadius: '1rem', border: '3px solid #e2e8f0', fontWeight: 700 }} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontWeight: 800, fontSize: '1.25rem' }}>
                고지서 세금 (직접)
                <input type="number" value={financeConfig.manualTax} placeholder={`예상: ${FormatWon(estimatedVat)}`} onChange={e => setFinanceConfig({...financeConfig, manualTax: e.target.value})} style={{ padding: '1.25rem', fontSize: '1.5rem', borderRadius: '1rem', border: '3px solid #e2e8f0', fontWeight: 700 }} />
              </label>
            </div>
            <button className="btn btn-primary" onClick={saveConfig} style={{ marginTop: '1rem', padding: '1.5rem', fontSize: '1.75rem', fontWeight: 900 }}>
              <Save size={32} style={{ marginRight: '10px' }} /> 설정 저장하기
            </button>
          </div>
        </div>

        {/* 항목별 지출 분석 */}
        <div className="card" style={{ padding: '2.5rem' }}>
          <h3 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '2.5rem' }}>비용 집계 (상세)</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1.75rem', background: '#f0f9ff', borderRadius: '1.5rem', borderLeft: '10px solid var(--color-primary)' }}>
               <span style={{ fontSize: '1.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '15px' }}><Users size={32} /> 인건비 (총 급여)</span>
               <span style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--color-primary)' }}>{FormatWon(calcData.laborCost)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1.75rem', background: '#f0fdf4', borderRadius: '1.5rem', borderLeft: '10px solid #10b981' }}>
               <span style={{ fontSize: '1.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '15px' }}><Package size={32} /> 재료비 (발주/마트)</span>
               <span style={{ fontSize: '1.75rem', fontWeight: 900, color: '#10b981' }}>{FormatWon(calcData.materialCost)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1.75rem', background: '#f0f9ff', borderRadius: '1.5rem', borderLeft: '10px solid #0ea5e9' }}>
               <span style={{ fontSize: '1.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '15px' }}>🛵 배달 수수료</span>
               <span style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0ea5e9' }}>{FormatWon(deliveryFee)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1.75rem', background: '#f8fafc', borderRadius: '1.5rem', borderLeft: '10px solid #94a3b8' }}>
               <span style={{ fontSize: '1.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '15px' }}><CreditCard size={32} /> 예상 세금(VAT)</span>
               <span style={{ fontSize: '1.75rem', fontWeight: 900, color: '#64748b' }}>{FormatWon(financeConfig.manualTax || estimatedVat)}</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem' }}>
        {/* 가장 많이 쓴 식재료 Top 5 */}
        <div className="card" style={{ padding: '2.5rem' }}>
          <h3 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            🔥 이번 달 식재료 소비 Top 5
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {calcData.topUsage.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.25rem', background: '#fffbeb', borderRadius: '1rem', border: '2px solid #fef3c7' }}>
                <span style={{ fontSize: '2rem', fontWeight: 900, color: '#f59e0b', minWidth: '40px' }}>{idx + 1}</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, flex: 1 }}>{item.name}</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#d97706' }}>{item.amount}개</span>
              </div>
            ))}
            {calcData.topUsage.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', fontSize: '1.25rem' }}>입력된 사용 기록이 없습니다.</div>
            )}
          </div>
        </div>

        {/* 직원별 급여 상세 */}
        <div className="card" style={{ padding: '2.5rem' }}>
          <h3 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '2rem' }}>👥 직원별 급여 정산</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {calcData.staffDetails.map((staff, idx) => (
              <div key={idx} style={{ padding: '1.5rem', background: 'white', border: '3px solid #e2e8f0', borderRadius: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--color-primary)' }}>{staff.name}</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>월 총 <span style={{ color: 'var(--color-text)' }}>{staff.hours}시간</span> 근무</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 900, borderTop: '2px dashed #e2e8f0', paddingTop: '1rem', color: 'var(--color-text)' }}>{FormatWon(staff.total)}</div>
              </div>
            ))}
            {calcData.staffDetails.length === 0 && (
              <div style={{ gridColumn: 'span 2', textAlign: 'center', padding: '3rem', color: '#94a3b8', fontSize: '1.25rem' }}>데이터 없음</div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default DataCenter;
