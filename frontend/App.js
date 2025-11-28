import React, { useState } from 'react';

function App() {
  // 1. 입력값을 저장할 변수들
  const [formData, setFormData] = useState({
    name: '',
    work_hours: 0,
    job_intensity: 1.0,
    age: 30,
    has_disease: false
  });
  
  // 2. 서버에서 받은 결과를 저장할 변수
  const [result, setResult] = useState(null);

  // 3. 입력값 변경 처리
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // 4. "계산하기" 버튼 클릭 시 서버로 데이터 전송
  const handleSubmit = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      setResult(data); // 결과 받아서 화면 갱신
    } catch (error) {
      console.error("서버 연결 실패:", error);
    }
  };

  return (
    <div style={{ padding: '50px', fontFamily: 'Arial' }}>
      <h1>🏭 WorkerGuard 관리자 대시보드</h1>
      
      {/* 입력 폼 */}
      <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '10px' }}>
        <h3>작업자 정보 입력</h3>
        <p>이름: <input name="name" onChange={handleChange} /></p>
        <p>근무 시간: <input type="number" name="work_hours" onChange={handleChange} /> 시간</p>
        <p>작업 강도: 
          <select name="job_intensity" onChange={handleChange}>
            <option value="1.0">보통 (1.0)</option>
            <option value="1.5">상하차 (1.5)</option>
            <option value="0.8">포장 (0.8)</option>
          </select>
        </p>
        <p>나이: <input type="number" name="age" defaultValue={30} onChange={handleChange} /></p>
        <p>
          <input type="checkbox" name="has_disease" onChange={handleChange} /> 기저질환 있음
        </p>
        <button onClick={handleSubmit} style={{ padding: '10px 20px', background: 'blue', color: 'white' }}>
          피로도 분석 실행
        </button>
      </div>

      {/* 결과 화면 (서버 응답이 오면 표시) */}
      {result && (
        <div style={{ marginTop: '30px', padding: '20px', background: '#f9f9f9' }}>
          <h2>분석 결과</h2>
          <div style={{ 
            width: '100px', height: '100px', borderRadius: '50%', 
            background: result.status === 'RED' ? 'red' : result.status === 'YELLOW' ? 'orange' : 'green',
            margin: '20px 0'
          }}></div>
          <h3>{result.worker_name} 님의 피로도: {result.score}점</h3>
          <p><strong>진단: {result.message}</strong></p>
        </div>
      )}
    </div>
  );
}

export default App;