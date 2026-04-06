import React, { useState, useEffect } from 'react';
import { Users, Plus, Trash2, Save, ArrowLeft, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Staff = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [name, setName] = useState('');
  const [role, setRole] = useState('알바');
  const [wage, setWage] = useState('10030');

  // 보안 인증 상태
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [inputPin, setInputPin] = useState('');
  const CORRECT_PIN = "1234";

  // 데이터 불러오기
  useEffect(() => {
    try {
      const saved = localStorage.getItem('maratang_staff');
      if (saved) {
        let parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
           setEmployees(parsed);
        } else {
           throw new Error('Not an array');
        }
      } else {
        const initial = [
          { id: 1, name: '김알바', role: '알바', wage: '10030' },
          { id: 2, name: '이매니저', role: '매니저', wage: '12000' },
        ];
        setEmployees(initial);
        localStorage.setItem('maratang_staff', JSON.stringify(initial));
      }
    } catch (e) {
      console.error('Staff load error:', e);
      setEmployees([]);
    }
  }, []);

  // 데이터 저장하기
  const saveEmployees = (newEmployees) => {
    setEmployees(newEmployees);
    localStorage.setItem('maratang_staff', JSON.stringify(newEmployees));
  };

  const addEmployee = () => {
    if (!name.trim()) return;
    const newEmp = { id: Date.now(), name, role, wage };
    saveEmployees([...employees, newEmp]);
    setName(''); setRole('알바'); setWage('10030');
  };

  const removeEmployee = (id, empName) => {
    if (window.confirm(`[${empName}] 직원을 명단에서 삭제하시겠습니까?`)) {
      saveEmployees(employees.filter(e => e.id !== id));
    }
  };

  const updateEmployee = (id, field, value) => {
    const updated = employees.map(e => e.id === id ? { ...e, [field]: value } : e);
    saveEmployees(updated);
  };

  const handlePinInput = (num) => {
    if (inputPin.length < 4) setInputPin(prev => prev + num);
  };

  const checkPin = () => {
    if (inputPin === CORRECT_PIN) {
      setIsAuthenticated(true);
    } else {
      alert('비밀번호가 틀렸습니다!');
      setInputPin('');
    }
  };

  // 1. 보안 인증 화면 (PIN 패드)
  if (!isAuthenticated) {
    return (
      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '2rem' }}>
        <div className="card" style={{ padding: '3rem', maxWidth: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem', animation: 'scaleUp 0.15s ease-out' }}>
          <h2 style={{ fontSize: '2rem', margin: 0, fontWeight: 900, color: '#f43f5e' }}>직원 관리 전용 🔓</h2>
          <p style={{ fontSize: '1.25rem', color: 'var(--color-text-muted)', margin: 0 }}>보안 암호를 입력하세요.</p>
          
          <div style={{ fontSize: '3rem', letterSpacing: '1rem', fontWeight: 900, color: '#f43f5e', background: '#f8fafc', padding: '1rem 2rem', borderRadius: '1rem' }}>
             {'●'.repeat(inputPin.length)}{'○'.repeat(4 - inputPin.length)}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', width: '100%' }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, 'OK'].map(val => (
              <button 
                key={val} 
                onClick={() => {
                  if (val === 'C') setInputPin('');
                  else if (val === 'OK') checkPin();
                  else handlePinInput(val.toString());
                }}
                className="btn"
                style={{ 
                  height: '80px', fontSize: '1.5rem', fontWeight: 900, borderRadius: '1rem', 
                  backgroundColor: val === 'OK' ? '#f43f5e' : (val === 'C' ? '#94a3b8' : 'white'),
                  color: (val === 'OK' || val === 'C') ? 'white' : 'inherit',
                  border: '2px solid #e2e8f0', cursor: 'pointer'
                }}
              >
                {val}
              </button>
            ))}
          </div>
          
          <button onClick={() => navigate('/')} style={{ border: 'none', background: 'none', color: '#94a3b8', fontSize: '1.25rem', fontWeight: 800, cursor: 'pointer' }}>대시보드로 나가기</button>
        </div>
      </div>
    );
  }

  // 2. 인증 후 실제 관리 화면
  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 2rem', fontSize: '1.5rem', fontWeight: 800, background: '#f1f5f9', border: 'none', borderRadius: '1rem', cursor: 'pointer' }}>
          <ArrowLeft size={32} /> 뒤로
        </button>
        <h2 style={{ fontSize: '2.5rem', color: '#f43f5e', margin: 0, fontWeight: 900, display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Users size={48} /> 2026년 직원 명단 관리
        </h2>
        <div style={{ width: '120px' }}></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', flex: 1 }}>
        <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', alignSelf: 'start' }}>
          <h3 style={{ fontSize: '1.75rem', margin: 0, fontWeight: 800 }}>새 직원 등록</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '1.2rem', fontWeight: 700 }}>이름</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="이름을 입력하세요" style={{ width: '100%', padding: '1.25rem', fontSize: '1.25rem', borderRadius: '1rem', border: '2px solid #e2e8f0' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '1.2rem', fontWeight: 700 }}>역할 (직급)</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} style={{ width: '100%', padding: '1.25rem', fontSize: '1.25rem', borderRadius: '1rem', border: '2px solid #e2e8f0', background: 'white' }}>
                <option value="매니저">매니저</option>
                <option value="알바">알바</option>
                <option value="주방">주방</option>
                <option value="홀">홀</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '1.2rem', fontWeight: 700 }}>시급 (원)</label>
              <input type="number" value={wage} onChange={(e) => setWage(e.target.value)} placeholder="2026년 시급" style={{ width: '100%', padding: '1.25rem', fontSize: '1.25rem', borderRadius: '1rem', border: '2px solid #e2e8f0' }} />
            </div>
            <button className="btn btn-primary" onClick={addEmployee} style={{ width: '100%', padding: '1.5rem', fontSize: '1.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1rem', background: '#f43f5e' }}>
              <Plus size={32} /> 직원 추가하기
            </button>
          </div>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="data-table" style={{ fontSize: '1.25rem' }}>
              <thead>
                <tr>
                  <th style={{ width: '25%', padding: '1.5rem' }}>이름</th>
                  <th style={{ width: '20%', padding: '1.5rem', textAlign: 'center' }}>역할</th>
                  <th style={{ width: '30%', padding: '1.5rem', textAlign: 'center' }}>2026년 시급</th>
                  <th style={{ width: '25%', padding: '1.5rem', textAlign: 'center' }}>관리</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => (
                  <tr key={emp.id}>
                    <td>
                      <input type="text" value={emp.name} onChange={(e) => updateEmployee(emp.id, 'name', e.target.value)} style={{ width: '100%', padding: '0.75rem', fontSize: '1.25rem', border: 'none', background: 'transparent', fontWeight: 800 }} />
                    </td>
                    <td>
                      <select value={emp.role} onChange={(e) => updateEmployee(emp.id, 'role', e.target.value)} style={{ width: '100%', padding: '0.75rem', fontSize: '1.25rem', border: 'none', background: 'transparent', textAlignLast: 'center', fontWeight: 700 }}>
                        <option value="매니저">매니저</option>
                        <option value="알바">알바</option>
                        <option value="주방">주방</option>
                        <option value="홀">홀</option>
                      </select>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <input type="number" value={emp.wage} onChange={(e) => updateEmployee(emp.id, 'wage', e.target.value)} style={{ width: '120px', padding: '0.75rem', fontSize: '1.5rem', border: 'none', background: 'transparent', color: 'var(--color-primary)', fontWeight: 900, textAlign: 'center' }} />
                        <span style={{ fontWeight: 800 }}>원</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button onClick={() => removeEmployee(emp.id, emp.name)} style={{ padding: '0.75rem', background: '#fff1f2', color: '#f43f5e', border: '2px solid #fecaca', borderRadius: '0.75rem', cursor: 'pointer' }}>
                        <Trash2 size={24} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Staff;
