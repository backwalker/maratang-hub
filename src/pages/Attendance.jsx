import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

const Attendance = () => {
  const [employees, setEmployees] = useState([]);
  
  // 영업 일자 계산 (새벽 8시 기준 초기화)
  const getBusinessDate = () => {
    const now = new Date();
    // 00:00 ~ 07:59 사이면 어제 날짜 반환
    if (now.getHours() < 8) {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      return yesterday.toISOString().split('T')[0];
    }
    return now.toISOString().split('T')[0];
  };

  const today = getBusinessDate();
  const STORAGE_KEY = `maratang_attendance_${today}`;

  useEffect(() => {
    try {
      const savedStaff = localStorage.getItem('maratang_staff');
      const savedAttendance = localStorage.getItem(STORAGE_KEY);
      
      if (savedStaff) {
        let staffList = JSON.parse(savedStaff);
        if (!Array.isArray(staffList)) staffList = []; // Array 검증 추가
        
        let attendanceData = savedAttendance ? JSON.parse(savedAttendance) : {};
        if (typeof attendanceData !== 'object' || Array.isArray(attendanceData)) attendanceData = {}; // Object 검증 추가

        // 명단과 실제 오늘의 기록을 병합
        const merged = staffList.map(emp => {
          const record = attendanceData[emp.id] || { checkIn: '-', checkOut: '-', status: '출근 전' };
          return {
            id: emp.id,
            name: emp.name,
            ...record
          };
        });
        setEmployees(merged);
      }
    } catch (e) {
      console.error('Attendance load error:', e);
      setEmployees([]);
    }
  }, []);

  const saveAttendance = (newEmployees) => {
    setEmployees(newEmployees);
    const dataToSave = {};
    newEmployees.forEach(emp => {
      dataToSave[emp.id] = { checkIn: emp.checkIn, checkOut: emp.checkOut, status: emp.status };
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  };

  const [modalData, setModalData] = useState(null); // { emp, type: 'IN' | 'OUT' }

  const handleClockIn = (id) => {
    const now = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
    const updated = employees.map(emp => 
      emp.id === id ? { ...emp, checkIn: now, status: '근무 중' } : emp
    );
    saveAttendance(updated);
    setModalData(null);
  };

  const handleClockOut = (id) => {
    const now = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
    const updated = employees.map(emp => 
      emp.id === id ? { ...emp, checkOut: now, status: '퇴근 완료' } : emp
    );
    saveAttendance(updated);
    setModalData(null);
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', flex: 1 }}>
      <div className="card" style={{ padding: '2rem', flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
          <h3 style={{ fontSize: '2.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '1rem', fontWeight: 900 }}>
            <Clock size={48} color="var(--color-primary)" /> {today} 출퇴근 현황
          </h3>
          <div style={{ background: '#f1f5f9', padding: '0.75rem 1.5rem', borderRadius: '1rem', fontSize: '1.25rem', fontWeight: 800 }}>
             오늘 근무 인원: <span style={{ color: 'var(--color-primary)' }}>{employees.filter(e => e.status !== '출근 전').length}</span>명
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
          {employees.map(emp => {
             const isWorking = emp.status === '근무 중';
             const isDone = emp.status === '퇴근 완료';
             const isBefore = emp.status === '출근 전';

             return (
              <div key={emp.id} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '2rem', backgroundColor: isWorking ? '#f0f9ff' : (isDone ? '#f8fafc' : 'white'), borderRadius: '2rem', border: isWorking ? '4px solid #0ea5e9' : '2px solid #e2e8f0', boxShadow: isWorking ? '0 10px 20px rgba(14,165,233,0.1)' : 'none', transition: 'all 0.2s' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '2.25rem', fontWeight: 900, color: isWorking ? '#0369a1' : 'inherit' }}>{emp.name}</span>
                    <span style={{ fontSize: '1rem', padding: '0.4rem 1.25rem', borderRadius: '2rem', background: isWorking ? '#0ea5e9' : (isDone ? '#94a3b8' : '#e2e8f0'), color: 'white', fontWeight: 900 }}>
                      {emp.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '1.4rem', color: isWorking ? '#0284c7' : '#64748b', fontWeight: 800, marginTop: '0.5rem' }}>
                    출근: <span style={{ color: emp.checkIn !== '-' ? '#0ea5e9' : 'inherit' }}>{emp.checkIn}</span> 
                    <span style={{ margin: '0 0.5rem', opacity: 0.3 }}>|</span> 
                    퇴근: <span style={{ color: emp.checkOut !== '-' ? '#f43f5e' : 'inherit' }}>{emp.checkOut}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  {isBefore && (
                    <button 
                      onClick={() => setModalData({ emp, type: 'IN' })} 
                      className="btn btn-primary" 
                      style={{ width: '100%', padding: '1.25rem', fontSize: '1.75rem', fontWeight: 900, borderRadius: '1.25rem', boxShadow: '0 4px 12px rgba(37,99,235,0.2)' }}
                    >
                      출근하기
                    </button>
                  )}
                  {isWorking && (
                    <button 
                      onClick={() => setModalData({ emp, type: 'OUT' })} 
                      className="btn" 
                      style={{ width: '100%', padding: '1.25rem', fontSize: '1.75rem', fontWeight: 900, borderRadius: '1.25rem', backgroundColor: '#f43f5e', color: 'white', boxShadow: '0 4px 12px rgba(244,63,94,0.2)' }}
                    >
                      퇴근하기
                    </button>
                  )}
                  {isDone && (
                    <div style={{ width: '100%', textAlign: 'center', color: '#94a3b8', fontSize: '1.4rem', fontWeight: 800, padding: '0.75rem', background: '#f1f5f9', borderRadius: '1.25rem' }}>
                      오늘 수고하셨습니다 👏
                    </div>
                  )}
                </div>
              </div>
             )
          })}
        </div>
      </div>

      {/* 🛑 출퇴근 전용 커스텀 컨펌 팝업 (모달) */}
      {modalData && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, backdropFilter: 'blur(8px)' }}>
          <div className="card" style={{ width: '90%', maxWidth: '550px', padding: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2.5rem', animation: 'scaleUp 0.15s ease-out', textAlign: 'center', borderRadius: '2.5rem' }}>
            <div style={{ width: '100px', height: '100px', backgroundColor: modalData.type === 'IN' ? 'var(--color-primary-light)' : '#fff1f2', borderRadius: '3.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <Clock size={65} color={modalData.type === 'IN' ? 'var(--color-primary)' : '#f43f5e'} />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <h2 style={{ fontSize: '2.75rem', margin: 0, fontWeight: 900, color: 'var(--color-text)' }}>{modalData.emp.name}님</h2>
              <p style={{ fontSize: '1.75rem', margin: 0, fontWeight: 800, color: modalData.type === 'IN' ? 'var(--color-primary)' : '#f43f5e' }}>
                정말로 {modalData.type === 'IN' ? '출근' : '퇴근'} 처리하시겠습니까?
              </p>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', width: '100%' }}>
              <button 
                onClick={() => setModalData(null)}
                className="btn" 
                style={{ flex: 1, padding: '1.5rem', fontSize: '1.5rem', fontWeight: 800, background: '#f1f5f9', border: 'none', borderRadius: '1.25rem' }}
              >
                취소
              </button>
              <button 
                onClick={() => modalData.type === 'IN' ? handleClockIn(modalData.emp.id) : handleClockOut(modalData.emp.id)}
                className="btn" 
                style={{ flex: 2, padding: '1.5rem', fontSize: '1.75rem', fontWeight: 900, color: 'white', background: modalData.type === 'IN' ? 'var(--color-primary)' : '#f43f5e', border: 'none', borderRadius: '1.25rem', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}
              >
                네, {modalData.type === 'IN' ? '출근' : '퇴근'}합니다!
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
};

export default Attendance;
