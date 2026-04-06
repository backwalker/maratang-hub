import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X, Save, Clock, Plus, Trash2, Users, UserPlus, CheckCircle2 } from 'lucide-react';

const Schedule = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null); // 'YYYY-MM-DD'
  
  // 데이터 로드 시 단일 문자열을 배열로 변환하는 헬퍼
  const ensureArray = (data) => {
    const newData = {};
    Object.entries(data).forEach(([dateKey, timeSlots]) => {
      newData[dateKey] = {};
      Object.entries(timeSlots).forEach(([timeKey, names]) => {
        newData[dateKey][timeKey] = Array.isArray(names) ? names : (names ? [names] : []);
      });
    });
    return newData;
  };

  const [shifts, setShifts] = useState(() => {
    try {
      const saved = localStorage.getItem('maratang_shifts');
      return saved ? ensureArray(JSON.parse(saved)) : {};
    } catch (e) {
      console.error('Shifts load error:', e);
      return {};
    }
  });

  const [fixedShifts, setFixedShifts] = useState(() => {
    try {
      const saved = localStorage.getItem('maratang_fixed_shifts');
      const base = { 0:{}, 1:{}, 2:{}, 3:{}, 4:{}, 5:{}, 6:{} };
      if (!saved) return base;
      const parsed = JSON.parse(saved);
      const mig = { ...base };
      Object.entries(parsed).forEach(([day, slots]) => {
        mig[day] = {};
        Object.entries(slots).forEach(([time, names]) => {
          mig[day][time] = Array.isArray(names) ? names : (names ? [names] : []);
        });
      });
      return mig;
    } catch (e) {
      return { 0:{}, 1:{}, 2:{}, 3:{}, 4:{}, 5:{}, 6:{} };
    }
  });
  
  const [isFixedModalOpen, setIsFixedModalOpen] = useState(false);
  const [selectedFixedDay, setSelectedFixedDay] = useState(1); 

  const [tempShifts, setTempShifts] = useState({}); 
  const [editHour, setEditHour] = useState(null); 
  const [autoName, setAutoName] = useState('');
  const [autoDuration, setAutoDuration] = useState('1');
  
  const [employees, setEmployees] = useState([]);
  const [isEmpSelectOpen, setIsEmpSelectOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('maratang_staff');
    if (saved) {
      setEmployees(JSON.parse(saved).map(e => e.name));
    }
  }, [selectedDate, isFixedModalOpen]);

  useEffect(() => {
    localStorage.setItem('maratang_shifts', JSON.stringify(shifts));
  }, [shifts]);

  useEffect(() => {
    localStorage.setItem('maratang_fixed_shifts', JSON.stringify(fixedShifts));
  }, [fixedShifts]);

  const hours = [];
  for (let i = 9; i <= 24; i++) hours.push(i);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const days = new Date(year, month + 1, 0).getDate();
    return { firstDay, days, year, month };
  };

  const { firstDay, days, year, month } = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleString('ko-KR', { month: 'long', year: 'numeric' });

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const handleDateClick = (day) => {
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const d = new Date(year, month, day);
    const weekday = d.getDay();
    
    setSelectedDate(dateKey);
    setTempShifts(shifts[dateKey] || fixedShifts[weekday] || {});
    setEditHour(null);
  };

  const applyAutoFill = (isFixed = false) => {
    if (!autoName.trim()) return;
    const duration = parseInt(autoDuration);
    const start = editHour;
    
    let newTemp = isFixed ? { ...fixedShifts[selectedFixedDay] } : { ...tempShifts };
    for (let i = 0; i < duration; i++) {
        const currentH = start + i;
        if (currentH > 24) break;
        const timeKey = `${String(currentH).padStart(2, '0')}:00`;
        const currentNames = Array.isArray(newTemp[timeKey]) ? newTemp[timeKey] : [];
        if (!currentNames.includes(autoName)) {
           newTemp[timeKey] = [...currentNames, autoName];
        }
    }
    
    if (isFixed) {
      setFixedShifts({ ...fixedShifts, [selectedFixedDay]: newTemp });
    } else {
      setTempShifts(newTemp);
    }
    
    setEditHour(null);
    setAutoName('');
    setAutoDuration('1');
    setIsEmpSelectOpen(false);
  };

  const removePersonFromHour = (h, nameToRemove, isFixed = false) => {
    const timeKey = `${String(h).padStart(2, '0')}:00`;
    if (isFixed) {
      let newFixed = { ...fixedShifts[selectedFixedDay] };
      const names = Array.isArray(newFixed[timeKey]) ? newFixed[timeKey] : [];
      newFixed[timeKey] = names.filter(n => n !== nameToRemove);
      setFixedShifts({ ...fixedShifts, [selectedFixedDay]: newFixed });
    } else {
      let newTemp = { ...tempShifts };
      const names = Array.isArray(newTemp[timeKey]) ? newTemp[timeKey] : [];
      newTemp[timeKey] = names.filter(n => n !== nameToRemove);
      setTempShifts(newTemp);
    }
  };

  const saveShift = () => {
    setShifts({ ...shifts, [selectedDate]: tempShifts });
    setSelectedDate(null);
  };

  const getDailySummary = (dateKey) => {
    const d = new Date(dateKey);
    const weekday = d.getDay();
    const dayData = shifts[dateKey] || fixedShifts[weekday];
    const isOverride = !!shifts[dateKey];
    
    if (!dayData) return null;
    
    const employeeShifts = {}; 
    Object.entries(dayData).forEach(([time, names]) => {
      if (!names || names.length === 0) return;
      const hour = parseInt(time.split(':')[0]);
      const nameList = Array.isArray(names) ? names : [names];
      nameList.forEach(name => {
        if (!employeeShifts[name]) employeeShifts[name] = [];
        employeeShifts[name].push(hour);
      });
    });

    const summary = Object.entries(employeeShifts).map(([name, hours]) => {
      hours.sort((a, b) => a - b);
      const ranges = [];
      if (hours.length === 0) return null;
      let start = hours[0];
      let prev = hours[0];

      for (let i = 1; i <= hours.length; i++) {
        if (hours[i] === prev + 1) {
          prev = hours[i];
        } else {
          ranges.push(`${String(start).padStart(2, '0')}-${String(prev + 1).padStart(2, '0')}`);
          start = hours[i];
          prev = hours[i];
        }
      }
      return { name, rangeStr: ranges.join(', ') };
    }).filter(Boolean);

    return { data: summary.length > 0 ? summary : null, isOverride };
  };

  // 직원별 일관된 색상 부여를 위한 헬퍼
  const getStaffColor = (name) => {
    const colors = [
      { bg: '#dbeafe', text: '#1e40af', border: '#bfdbfe' }, // Blue
      { bg: '#fef3c7', text: '#92400e', border: '#fde68a' }, // Amber
      { bg: '#dcfce7', text: '#166534', border: '#bbf7d0' }, // Green
      { bg: '#f3e8ff', text: '#6b21a8', border: '#e9d5ff' }, // Purple
      { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' }, // Red
      { bg: '#e0f2fe', text: '#075985', border: '#bae6fd' }, // Sky
      { bg: '#ffedd5', text: '#9a3412', border: '#fed7aa' }, // Orange
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(<div key={`empty-${i}`} style={{ height: '150px', background: '#f8fafc', border: '1px solid #e2e8f0' }} />);
  }
  for (let day = 1; day <= days; day++) {
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const d = new Date(year, month, day);
    const isToday = new Date().toDateString() === d.toDateString();
    const summaryResult = getDailySummary(dateKey);
    const summaries = summaryResult?.data;
    const isOverride = summaryResult?.isOverride;

    calendarDays.push(
      <div key={day} onClick={() => handleDateClick(day)} className="calendar-day" style={{ height: '150px', padding: '0.6rem', background: isToday ? '#eff6ff' : 'white', border: isToday ? '2px solid var(--color-primary)' : '1px solid #e2e8f0', cursor: 'pointer', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px', position: 'relative', transition: 'all 0.2s' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
          <span style={{ fontSize: '1.3rem', fontWeight: 900, color: d.getDay() === 0 ? '#ef4444' : d.getDay() === 6 ? '#3b82f6' : (isToday ? 'var(--color-primary)' : '#1e293b') }}>{day}</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            {isOverride && <div style={{ fontSize: '0.65rem', background: '#fef3c7', color: '#92400e', padding: '1px 5px', borderRadius: '4px', fontWeight: 900, border: '1px solid #fde68a' }}>변동</div>}
            {summaries && <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', background: '#f1f5f9', padding: '1px 5px', borderRadius: '4px' }}>👤 {summaries.length}</div>}
          </div>
        </div>
        {summaries && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {summaries.map((s, idx) => {
              const colors = getStaffColor(s.name);
              return (
                <div key={idx} style={{ fontSize: '0.75rem', background: colors.bg, color: colors.text, padding: '3px 6px', borderRadius: '6px', fontWeight: 800, border: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</span>
                  <span style={{ fontSize: '0.65rem', opacity: 0.8, fontWeight: 700 }}>{s.rangeStr}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  const navigate = useNavigate();

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>
      
      {/* 컨트롤 바 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem' }}>
           <button 
            onClick={() => navigate('/staff')}
            className="card" 
            style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', border: '3px solid #f43f5e', borderRadius: '1.5rem', background: '#fff' }}
          >
            <Users size={32} color="#f43f5e" />
            <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#f43f5e' }}>직원 정보</span>
          </button>
          
          <button 
            onClick={() => setIsFixedModalOpen(true)}
            className="card" 
            style={{ flex: 2, padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', border: '4px solid var(--color-primary)', borderRadius: '1.5rem', background: '#fff' }}
          >
            <CalendarIcon size={38} color="var(--color-primary)" />
            <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--color-primary)' }}>주간 고정 설정</span>
          </button>
        </div>

        <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '1.5rem' }}>
          <button className="btn" onClick={prevMonth} style={{ padding: '1.5rem', background: '#f1f5f9', borderRadius: '1rem' }}><ChevronLeft size={40} /></button>
          <h2 style={{ fontSize: '2.25rem', margin: 0, fontWeight: 900 }}>{monthName}</h2>
          <button className="btn" onClick={nextMonth} style={{ padding: '1.5rem', background: '#f1f5f9', borderRadius: '1rem' }}><ChevronRight size={40} /></button>
        </div>
      </div>

      {/* 달력 본체 */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column', borderRadius: '1.5rem', border: '3px solid #e2e8f0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
          {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
            <div key={d} style={{ padding: '1.25rem', fontSize: '1.4rem', fontWeight: 900, color: i === 0 ? '#ef4444' : i === 6 ? '#3b82f6' : '#475569' }}>{d}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', flex: 1, backgroundColor: '#e2e8f0', gap: '1px' }}>
          {calendarDays}
        </div>
      </div>

      {/* [모달 1] 주간 고정 설정 */}
      {isFixedModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' }}>
          <div className="card" style={{ width: '95%', maxWidth: '900px', maxHeight: '90vh', padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', borderRadius: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '2rem', margin: 0, fontWeight: 900 }}>🗓️ 원터치 고정 스케쥴 배정</h3>
              <button onClick={() => setIsFixedModalOpen(false)} style={{ border: 'none', background: '#f1f5f9', padding: '0.75rem', borderRadius: '1.25rem', cursor: 'pointer' }}><X size={40} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
              {['일','월','화','수','목','금','토'].map((d, i) => (
                <button 
                  key={d} 
                  onClick={() => setSelectedFixedDay(i)}
                  style={{
                    padding: '1.25rem 0.5rem', fontSize: '1.5rem', fontWeight: 900, borderRadius: '1.25rem', 
                    border: '3px solid', borderColor: selectedFixedDay === i ? 'var(--color-primary)' : '#e2e8f0',
                    background: selectedFixedDay === i ? 'var(--color-primary-light)' : 'white',
                    color: i === 0 ? 'red' : i === 6 ? 'blue' : (selectedFixedDay === i ? 'var(--color-primary)' : 'inherit')
                  }}
                >
                  {d}
                </button>
              ))}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {hours.map(h => {
                  const timeKey = `${String(h).padStart(2, '0')}:00`;
                  const names = fixedShifts[selectedFixedDay]?.[timeKey] || [];
                  return (
                    <div key={h} className="shift-row" style={{ display: 'flex', alignItems: 'center', padding: '1rem 1.5rem', background: '#f8fafc', borderRadius: '1.5rem', border: '2px solid #e2e8f0' }}>
                      <div style={{ width: '80px', fontSize: '1.4rem', fontWeight: 900, color: '#64748b' }}>{timeKey}</div>
                      <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: '0.5rem', minHeight: '50px', alignItems: 'center' }}>
                        {names.map(name => (
                          <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-primary-light)', color: 'var(--color-primary)', padding: '0.5rem 1rem', borderRadius: '1rem', fontWeight: 900, fontSize: '1.2rem', border: '2px solid var(--color-primary)' }}>
                            {name}
                            <button onClick={(e) => { e.stopPropagation(); removePersonFromHour(h, name, true); }} style={{ border: 'none', background: 'none', color: 'var(--color-primary)', padding: 0 }}><Trash2 size={22} /></button>
                          </div>
                        ))}
                        <button onClick={() => setEditHour(h)} style={{ background: '#e2e8f0', border: 'none', padding: '0.75rem 1.25rem', borderRadius: '1rem', fontWeight: 900, color: '#64748b', fontSize: '1.1rem' }}>+ 인원 추가</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <button className="btn btn-primary" onClick={() => setIsFixedModalOpen(false)} style={{ width: '100%', padding: '1.75rem', fontSize: '2rem', borderRadius: '1.5rem' }}>설정 종료</button>
          </div>
        </div>
      )}

      {/* [모달 2] 개별 날짜 수정 */}
      {selectedDate && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' }}>
          <div className="card" style={{ width: '95%', maxWidth: '850px', maxHeight: '90vh', padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', borderRadius: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '2rem', margin: 0, fontWeight: 900 }}>🕒 {selectedDate} 특수 변동 수정</h3>
              <button onClick={() => setSelectedDate(null)} style={{ border: 'none', background: '#f1f5f9', padding: '0.75rem', borderRadius: '1.25rem', cursor: 'pointer' }}><X size={40} /></button>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {hours.map(h => {
                  const timeKey = `${String(h).padStart(2, '0')}:00`;
                  const names = tempShifts[timeKey] || [];
                  return (
                    <div key={h} className="shift-row" style={{ display: 'flex', alignItems: 'center', padding: '1rem 1.5rem', background: '#f8fafc', borderRadius: '1.5rem', border: '2px solid #e2e8f0' }}>
                      <div style={{ width: '80px', fontSize: '1.5rem', fontWeight: 900, color: '#64748b' }}>{timeKey}</div>
                      <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: '0.75rem', minHeight: '60px', alignItems: 'center' }}>
                        {names.map(name => (
                          <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#dbeafe', color: '#1d4ed8', padding: '0.75rem 1.25rem', borderRadius: '1rem', fontWeight: 900, fontSize: '1.3rem', border: '2px solid #3b82f6' }}>
                            {name}
                            <button onClick={(e) => { e.stopPropagation(); removePersonFromHour(h, name); }} style={{ border: 'none', background: 'none', color: '#1e40af', padding: 0 }}><Trash2 size={24} /></button>
                          </div>
                        ))}
                        <button onClick={() => setEditHour(h)} style={{ background: '#e2e8f0', border: 'none', padding: '1rem 1.5rem', borderRadius: '1rem', fontWeight: 900, color: '#475569', fontSize: '1.2rem' }}>+ 인원 추가</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <button className="btn btn-primary" onClick={saveShift} style={{ width: '100%', padding: '2rem', fontSize: '2.25rem', borderRadius: '1.75rem' }}><Save size={40} /> 스케쥴 저장하기</button>
          </div>
        </div>
      )}

      {/* 직원 선택 서브 팝업 */}
      {editHour !== null && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1200 }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }} onClick={() => setEditHour(null)} />
          <div style={{ position: 'relative', width: '90%', maxWidth: '500px', background: 'white', padding: '2.5rem', borderRadius: '2rem', boxShadow: 'var(--shadow-lg)', zIndex: 1300, border: '4px solid var(--color-primary)', animation: 'scaleUp 0.1s ease-out' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <h4 style={{ fontSize: '1.75rem', margin: 0, textAlign: 'center', fontWeight: 900 }}>👨‍🍳 스케쥴에 직원 추가</h4>
              <div style={{ border: '3px solid #e2e8f0', borderRadius: '1.25rem', overflow: 'hidden' }}>
                <button onClick={() => setIsEmpSelectOpen(!isEmpSelectOpen)} style={{ width: '100%', padding: '1.5rem', fontSize: '1.75rem', background: '#f8fafc', border: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 900 }}>{autoName || '직원 선택'}</button>
                {isEmpSelectOpen && (
                  <div style={{ background: 'white', borderTop: '3px solid #e2e8f0', maxHeight: '250px', overflowY: 'auto' }}>
                    {employees.map(emp => (
                      <div key={emp} onClick={() => { setAutoName(emp); setIsEmpSelectOpen(false); }} style={{ padding: '1.25rem', fontSize: '1.5rem', borderBottom: '2px solid #f1f5f9', cursor: 'pointer', fontWeight: 800 }}>👤 {emp}</div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: '#f0fdf4', padding: '1.5rem', borderRadius: '1.25rem' }}>
                <span style={{ fontSize: '1.4rem', fontWeight: 900, flex: 1, color: '#166534' }}>⏱️ 근무 시간 (1 = 1시간)</span>
                <input type="number" value={autoDuration} onChange={(e) => setAutoDuration(e.target.value)} style={{ width: '100px', fontSize: '1.75rem', textAlign: 'center', fontWeight: 900, border: '3px solid #bbf7d0', borderRadius: '1rem' }} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button className="btn" onClick={() => setEditHour(null)} style={{ flex: 1, padding: '1.5rem', fontSize: '1.5rem', background: '#f1f5f9' }}>취소</button>
                <button className="btn btn-primary" onClick={() => applyAutoFill(!!isFixedModalOpen)} style={{ flex: 2, padding: '1.5rem', fontSize: '1.75rem' }}>배정 완료</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scaleUp { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .shift-row:hover { background-color: #f1f5f9 !important; border-color: #cbd5e1 !important; }
      `}</style>
    </div>
  );
};

export default Schedule;
