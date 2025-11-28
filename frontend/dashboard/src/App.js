// src/App.js
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  ShieldCheck,
  LayoutDashboard,
  Users,
  AlertTriangle,
  Banknote,
  Send,
  Settings,
  LogOut,
  UploadCloud,
  Download,
  Edit2,
  Trash2,
  CheckCircle,
  FileText,
  Loader,
  Plus,
  X,
} from "lucide-react";

// --- 디자인 테마 ---
const theme = {
  primary: "#1e3a8a", // Dark Blue
  secondary: "#10b981", // Emerald
  danger: "#e11d48", // Rose
  dark: "#0f172a", // Slate 900
  textMain: "#334155", // Slate 700
  textSub: "#64748b", // Slate 500
  bg: "#f1f5f9", // Slate 100
  card: "#ffffff",
  border: "#e2e8f0",
  shadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
};

// --- 스타일 객체 ---
const styles = {
  container: {
    display: "flex",
    height: "100vh",
    background: theme.bg,
    fontFamily: "'Inter', sans-serif",
    color: theme.textMain,
  },
  sidebar: {
    width: "260px",
    background: theme.dark,
    color: "white",
    display: "flex",
    flexDirection: "column",
    boxShadow: "4px 0 10px rgba(0,0,0,0.1)",
  },
  logoArea: {
    padding: "24px 20px",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  logoText: {
    fontSize: "20px",
    fontWeight: "800",
    letterSpacing: "-0.5px",
    color: "#fff",
  },
  modeSwitcher: {
    padding: "16px 16px 8px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  modeBtn: (active) => ({
    padding: "10px",
    cursor: "pointer",
    background: active ? theme.primary : "#374151",
    color: "white",
    borderRadius: "6px",
    textAlign: "center",
    fontWeight: "bold",
    transition: "0.3s",
  }),
  menuArea: {
    padding: "8px 12px 16px",
    flex: 1,
  },
  tab: (active) => ({
    padding: "12px",
    cursor: "pointer",
    background: active ? "rgba(255,255,255,0.1)" : "transparent",
    borderRadius: "6px",
    marginBottom: "4px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: active ? "#fff" : "#94a3b8",
    transition: "0.2s",
  }),
  main: {
    flex: 1,
    padding: "30px 40px",
    overflowY: "auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
  },
  title: {
    fontSize: "26px",
    fontWeight: "700",
    color: theme.dark,
    marginBottom: "6px",
  },
  subtitle: {
    fontSize: "14px",
    color: theme.textSub,
  },
  select: {
    padding: "8px 10px",
    borderRadius: "8px",
    border: `1px solid ${theme.border}`,
    color: theme.textMain,
    fontWeight: "500",
    outline: "none",
    fontSize: "14px",
  },
  card: {
    background: theme.card,
    padding: "20px",
    borderRadius: "16px",
    marginBottom: "20px",
    boxShadow: theme.shadow,
    border: `1px solid ${theme.border}`,
  },
  btn: {
    padding: "8px 12px",
    background: theme.primary,
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    marginRight: "5px",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "13px",
    fontWeight: "600",
  },
  btnOutline: {
    padding: "8px 12px",
    background: "white",
    color: theme.primary,
    border: `1px solid ${theme.primary}`,
    borderRadius: "6px",
    cursor: "pointer",
    marginRight: "5px",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "13px",
    fontWeight: "600",
  },
  redBtn: {
    padding: "8px",
    background: theme.danger,
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "11px",
    marginTop: "4px",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
  },
  btnIcon: {
    padding: "6px",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: "0",
  },
  th: {
    textAlign: "left",
    padding: "12px",
    borderBottom: `2px solid ${theme.border}`,
    color: theme.textSub,
    fontSize: "13px",
    fontWeight: "600",
  },
  td: {
    padding: "12px",
    borderBottom: `1px solid ${theme.border}`,
    fontSize: "14px",
    color: theme.textMain,
  },
  input: {
    padding: "8px",
    border: `1px solid ${theme.border}`,
    borderRadius: "6px",
    fontSize: "14px",
  },
  loginBox: {
    width: "350px",
    padding: "40px",
    background: "white",
    borderRadius: "16px",
    boxShadow: theme.shadow,
    textAlign: "center",
    margin: "auto",
  },
  loginInput: {
    width: "100%",
    padding: "12px",
    marginBottom: "15px",
    border: `1px solid ${theme.border}`,
    borderRadius: "8px",
    boxSizing: "border-box",
  },
  modal: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  modalContent: {
    background: "white",
    padding: "30px",
    borderRadius: "16px",
    width: "400px",
    maxHeight: "80vh",
    overflowY: "auto",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
  },
};

// API 기본 주소
const API_BASE = "http://127.0.0.1:8000";

// ------------------- Login Component -------------------
function Login({ onLogin }) {
  const [code, setCode] = useState("");
  const [username, setUsername] = useState("");
  const [key, setKey] = useState("");

  const handleSubmit = async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, username, key }),
      });
      const data = await res.json();
      if (data.success) {
        onLogin({
          role: data.role,
          company: data.company,
          username: data.username,
          access_token: data.access_token || null,
        });
      } else {
        alert(data.msg || "로그인 실패");
      }
    } catch (e) {
      console.error(e);
      alert("서버 연결 실패");
    }
  };

  return (
    <div
      style={{
        height: "100vh",
        background: theme.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={styles.loginBox}>
        <ShieldCheck
          size={48}
          color={theme.primary}
          style={{ marginBottom: "20px" }}
        />
        <h2 style={{ marginBottom: "30px", color: theme.dark }}>
          WorkerGuard Login
        </h2>
        <input
          style={styles.loginInput}
          placeholder="Company Code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <input
          style={styles.loginInput}
          placeholder="ID"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          style={styles.loginInput}
          type="password"
          placeholder="Password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
        />
        <button
          style={{
            ...styles.btn,
            width: "100%",
            justifyContent: "center",
            padding: "12px",
            fontSize: "16px",
          }}
          onClick={handleSubmit}
        >
          로그인
        </button>
      </div>
    </div>
  );
}

// ------------------- Main App -------------------
function App() {
  const [user, setUser] = useState(null);
  const [mode, setMode] = useState("REGULAR");
  const [activeTab, setActiveTab] = useState("risk");
  const [center, setCenter] = useState("서울 센터");

  const TODAY = new Date().toISOString().split("T")[0];
  const [targetMonth, setTargetMonth] = useState("2025-11");
  const [targetDate, setTargetDate] = useState("2025-11-30"); // 데모용

  const [data, setData] = useState({
    risk: {},
    payroll: [],
    analytics: [],
    sms: [],
    settings: [],
    workers: [],
  });
  const [loading, setLoading] = useState(false);

  const [editLog, setEditLog] = useState(null);
  const [editWorker, setEditWorker] = useState(null);
  const [detailLogs, setDetailLogs] = useState(null);
  const [selectedName, setSelectedName] = useState(null);

  // Settings용 직무 추가 입력값
  const [newJobName, setNewJobName] = useState("");
  const [newJobWage, setNewJobWage] = useState(12000);
  const [newJobIntensity, setNewJobIntensity] = useState(1.0);
  const [newJobCert, setNewJobCert] = useState("");

  const isAdmin = user?.role === 1;
  const isStaffRestricted = user?.role === 2 && mode === "REGULAR";

  // auth header
  const authHeaders = useMemo(
    () =>
      user?.access_token
        ? { Authorization: `Bearer ${user.access_token}` }
        : {},
    [user?.access_token]
  );

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Risk
      if (activeTab === "risk") {
        const res = await fetch(`${API_BASE}/risk?type=${mode}`, {
          headers: authHeaders,
        });
        const json = res.ok ? await res.json() : {};
        setData((d) => ({ ...d, risk: json }));
      }
      // Payroll
      if (activeTab === "payroll") {
        const dateParam = mode === "REGULAR" ? targetMonth : targetDate;
        const res = await fetch(
          `${API_BASE}/payroll?center=${encodeURIComponent(
            center
          )}&date_filter=${dateParam}&type=${mode}`,
          { headers: authHeaders }
        );
        const json = res.ok ? await res.json() : [];
        if (mode === "REGULAR")
          setData((d) => ({ ...d, payroll: json || [] }));
        else setData((d) => ({ ...d, payroll: json.list || [] }));
      }
      // Workers
      if (activeTab === "workers") {
        const res = await fetch(
          `${API_BASE}/workers/list?type=${mode}&date=${targetDate}`,
          { headers: authHeaders }
        );
        const json = res.ok ? await res.json() : [];
        setData((d) => ({ ...d, workers: json }));
      }
      // Analytics
      if (activeTab === "analytics") {
        const res = await fetch(`${API_BASE}/analytics?type=${mode}`, {
          headers: authHeaders,
        });
        const json = res.ok ? await res.json() : [];
        setData((d) => ({ ...d, analytics: json }));
      }
      // SMS
      if (activeTab === "sms" && isAdmin) {
        const res = await fetch(
          `${API_BASE}/sms?center=${encodeURIComponent(center)}&type=${mode}`,
          { headers: authHeaders }
        );
        const json = res.ok ? await res.json() : [];
        setData((d) => ({ ...d, sms: json }));
      }
      // Settings
      if (activeTab === "settings" && isAdmin) {
        const res = await fetch(`${API_BASE}/settings`, {
          headers: authHeaders,
        });
        const json = res.ok ? await res.json() : [];
        setData((d) => ({ ...d, settings: json }));
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [
    user,
    mode,
    activeTab,
    center,
    targetMonth,
    targetDate,
    isAdmin,
    authHeaders,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (!user) return <Login onLogin={setUser} />;

  // ------------------- Handlers -------------------
  const handleUpload = async (e, type) => {
    if (isStaffRestricted && type === "workers") {
      alert("권한 없음");
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("type", mode);
    setLoading(true);
    const res = await fetch(`${API_BASE}/upload/${type}`, {
      method: "POST",
      body: fd,
      headers: authHeaders,
    });
    const json = await res.json();
    setLoading(false);
    alert(res.ok ? `✅ ${json.msg}` : `❌ ${json.detail || "업로드 실패"}`);
    fetchData();
  };

  const handleDownload = (target) => {
    window.location.href = `${API_BASE}/download?target=${target}&type=${mode}`;
  };

  const saveEditLog = async () => {
    await fetch(`${API_BASE}/edit/log`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify(editLog),
    });
    alert("수정 완료");
    setEditLog(null);
    fetchData();
  };

  const saveEditWorker = async () => {
    await fetch(`${API_BASE}/edit/worker`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify(editWorker),
    });
    alert("명단 수정 완료");
    setEditWorker(null);
    fetchData();
  };

  const deleteWorker = async (id) => {
    if (window.confirm("삭제하시겠습니까?")) {
      await fetch(`${API_BASE}/delete/worker`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ id }),
      });
      fetchData();
    }
  };

  const showDetail = async (name) => {
    const dateParam = mode === "REGULAR" ? targetMonth : targetDate;
    const res = await fetch(
      `${API_BASE}/workforce/detail?name=${encodeURIComponent(
        name
      )}&date_filter=${dateParam}&type=${mode}`,
      { headers: authHeaders }
    );
    const json = await res.json();
    setDetailLogs(json);
    setSelectedName(name);
  };

  // Settings: ratio 변경
  const commitRatioChange = async (job, val) => {
    await fetch(`${API_BASE}/settings/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({ job_name: job, ratio: Number(val) }),
    });
    fetchData();
  };

  const handleSliderChange = (idx, newVal) => {
    const newSettings = [...data.settings];
    newSettings[idx] = { ...newSettings[idx], ratio: Number(newVal) };
    setData({ ...data, settings: newSettings });
  };

  const handleAddJob = async () => {
    if (!newJobName.trim()) {
      alert("직무명을 입력해주세요.");
      return;
    }
    const body = {
      job_name: newJobName.trim(),
      intensity: Number(newJobIntensity) || 1.0,
      hourly_wage: Number(newJobWage) || 10000,
      ratio: 0,
      required_cert: newJobCert.trim() || null,
    };
    const res = await fetch(`${API_BASE}/settings/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) {
      alert(json.detail || "추가 실패");
      return;
    }
    setNewJobName("");
    setNewJobWage(12000);
    setNewJobIntensity(1.0);
    setNewJobCert("");
    fetchData();
  };

  const handleDeleteJob = async (job_name) => {
    if (!window.confirm(`${job_name} 직무를 삭제할까요?`)) return;
    const res = await fetch(`${API_BASE}/settings/delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({ job_name }),
    });
    const json = await res.json();
    if (!res.ok) {
      alert(json.detail || "삭제 실패");
      return;
    }
    fetchData();
  };

  // ------------------- JSX -------------------
  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.logoArea}>
          <ShieldCheck size={28} color={theme.secondary} />
          <span style={styles.logoText}>WorkerGuard</span>
        </div>
        <div style={styles.modeSwitcher}>
          <div
            style={styles.modeBtn(mode === "REGULAR")}
            onClick={() => setMode("REGULAR")}
          >
            정규직
          </div>
          <div
            style={styles.modeBtn(mode === "DAILY")}
            onClick={() => setMode("DAILY")}
          >
            일용직
          </div>
        </div>
        <div style={styles.menuArea}>
          <div
            style={styles.tab(activeTab === "risk")}
            onClick={() => setActiveTab("risk")}
          >
            <AlertTriangle size={18} /> 리스크 모니터링
          </div>
          <div
            style={styles.tab(activeTab === "analytics")}
            onClick={() => setActiveTab("analytics")}
          >
            <LayoutDashboard size={18} /> 센터 분석
          </div>
          <div
            style={styles.tab(activeTab === "workers")}
            onClick={() => setActiveTab("workers")}
          >
            <Users size={18} /> 명단 관리
          </div>
          <div
            style={styles.tab(activeTab === "payroll")}
            onClick={() => setActiveTab("payroll")}
          >
            <Banknote size={18} /> 급여 정산
          </div>
          {isAdmin && (
            <>
              <div
                style={{
                  height: "1px",
                  background: "rgba(255,255,255,0.1)",
                  margin: "10px 0",
                }}
              />
              <div
                style={styles.tab(activeTab === "sms")}
                onClick={() => setActiveTab("sms")}
              >
                <Send size={18} /> 업무 지시 (SMS)
              </div>
              <div
                style={styles.tab(activeTab === "settings")}
                onClick={() => setActiveTab("settings")}
              >
                <Settings size={18} /> 관리자 설정
              </div>
            </>
          )}
        </div>
        <div
          style={{
            padding: "20px",
            borderTop: "1px solid rgba(255,255,255,0.1)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            cursor: "pointer",
          }}
          onClick={() => window.location.reload()}
        >
          <LogOut size={16} color="#94a3b8" />
          <span style={{ fontSize: "13px", color: "#94a3b8" }}>
            로그아웃 ({user.username})
          </span>
        </div>
      </div>

      {/* Main */}
      <div style={styles.main}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>
              {activeTab === "risk" && "리스크 모니터링"}
              {activeTab === "analytics" && "센터별 데이터 분석"}
              {activeTab === "workers" && "인력 명단 관리"}
              {activeTab === "payroll" && "급여 및 정산"}
              {activeTab === "sms" && "업무 배치 및 발송"}
              {activeTab === "settings" && "환경 설정"}
            </h1>
            <p style={styles.subtitle}>
              {user.company} /{" "}
              {mode === "REGULAR" ? "정규직(상시)" : "일용직(단기)"} 관리 모드
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            {loading && (
              <Loader
                size={20}
                color={theme.primary}
                className="animate-spin"
              />
            )}
            {activeTab !== "settings" && (
              <select
                value={center}
                onChange={(e) => setCenter(e.target.value)}
                style={styles.select}
              >
                {["서울 센터", "경기 센터", "부산 센터"].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}
            <button
              style={styles.btnOutline}
              onClick={() => handleDownload("workers")}
            >
              <Download size={16} /> 명단 다운
            </button>
            <button
              style={styles.btnOutline}
              onClick={() => handleDownload("work_logs")}
            >
              <Download size={16} /> 기록 다운
            </button>
            {!isStaffRestricted && (
              <label style={styles.btn}>
                <UploadCloud size={16} /> 명단 업로드
                <input
                  type="file"
                  style={{ display: "none" }}
                  onChange={(e) => handleUpload(e, "workers")}
                />
              </label>
            )}
            <label style={styles.btn}>
              <UploadCloud size={16} /> 기록 업로드
              <input
                type="file"
                style={{ display: "none" }}
                onChange={(e) => handleUpload(e, "logs")}
              />
            </label>
          </div>
        </div>

        {/* Risk */}
        {activeTab === "risk" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "24px",
            }}
          >
            {["서울 센터", "경기 센터", "부산 센터"].map((c) => (
              <div key={c} style={styles.card}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "16px",
                    borderBottom: `2px solid ${theme.danger}`,
                    paddingBottom: "8px",
                  }}
                >
                  <span style={{ fontWeight: "700" }}>{c}</span>
                  <span
                    style={{
                      color: theme.danger,
                      fontWeight: "bold",
                    }}
                  >
                    {data.risk[c]?.length || 0}명 위험
                  </span>
                </div>
                <div style={{ maxHeight: "500px", overflowY: "auto" }}>
                  {!data.risk[c] || data.risk[c].length === 0 ? (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "40px 0",
                        color: "#cbd5e1",
                      }}
                    >
                      <CheckCircle size={32} />
                      <br />
                      위험군 없음
                    </div>
                  ) : (
                    data.risk[c].map((w, i) => (
                      <div
                        key={i}
                        style={{
                          padding: "12px",
                          background: "#fff1f2",
                          borderRadius: "8px",
                          marginBottom: "8px",
                          border: "1px solid #fecdd3",
                        }}
                      >
                        <div style={{ fontWeight: "bold" }}>{w.name}</div>
                        <div
                          style={{
                            fontSize: "12px",
                            color: theme.danger,
                            margin: "5px 0",
                          }}
                        >
                          오늘 피로도{" "}
                          {Math.round(w.today_int * 10) / 10} / 어제 피로도{" "}
                          {Math.round(w.prev_int * 10) / 10}
                        </div>
                        <button
                          style={{
                            ...styles.redBtn,
                            width: "100%",
                            justifyContent: "center",
                          }}
                          onClick={() => alert("SMS 발송 완료")}
                        >
                          <Send size={12} /> 휴식 권고
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Analytics */}
        {activeTab === "analytics" && (
          <div style={styles.card}>
            <h3>📉 센터별 월간 피로도 추이</h3>
            <div style={{ height: 400, marginTop: "20px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.analytics}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e2e8f0"
                  />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    domain={[0, 150]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: theme.shadow,
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: "20px" }} />
                  <Line
                    type="monotone"
                    dataKey="서울 센터"
                    stroke={theme.danger}
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="경기 센터"
                    stroke={theme.primary}
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="부산 센터"
                    stroke={theme.secondary}
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Workers */}
        {activeTab === "workers" && (
          <div style={styles.card}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>이름</th>
                  <th style={styles.th}>전화번호</th>
                  <th style={styles.th}>센터</th>
                  {mode === "REGULAR" && (
                    <>
                      <th style={styles.th}>자격증</th>
                      <th style={styles.th}>한달 피로도 평균</th>
                    </>
                  )}
                  <th style={styles.th}>관리</th>
                </tr>
              </thead>
              <tbody>
                {data.workers.map((w, i) => (
                  <tr key={i}>
                    <td style={{ ...styles.td, fontWeight: "600" }}>
                      {w.name}
                    </td>
                    <td style={styles.td}>{w.phone}</td>
                    <td style={styles.td}>
                      <span
                        style={{
                          background: "#eff6ff",
                          color: theme.primary,
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontSize: "12px",
                          fontWeight: "600",
                        }}
                      >
                        {w.center}
                      </span>
                    </td>
                    {mode === "REGULAR" && (
                      <>
                        <td style={styles.td}>{w.cert || "-"}</td>
                        <td style={styles.td}>
                          {w.month_fatigue != null
                            ? (Math.round(w.month_fatigue * 10) / 10).toFixed(1)
                            : "-"}
                        </td>
                      </>
                    )}
                    <td style={styles.td}>
                      {!isStaffRestricted && (
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            style={{
                              ...styles.btnIcon,
                              background: "#f1f5f9",
                              color: theme.textMain,
                            }}
                            onClick={() => setEditWorker(w)}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            style={{
                              ...styles.btnIcon,
                              background: "#fee2e2",
                              color: theme.danger,
                            }}
                            onClick={() => deleteWorker(w.id)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Payroll */}
        {activeTab === "payroll" && (
          <div style={styles.card}>
            <div
              style={{
                display: "flex",
                justifyContent: "spaceBetween",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <Banknote size={20} color={theme.primary} />
                <span style={{ fontWeight: "700" }}>
                  지급 내역 ({mode === "REGULAR" ? targetMonth : targetDate})
                </span>
              </div>
              <div>
                {mode === "REGULAR" ? (
                  <input
                    type="month"
                    value={targetMonth}
                    onChange={(e) => setTargetMonth(e.target.value)}
                    style={styles.input}
                  />
                ) : (
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    style={styles.input}
                  />
                )}
              </div>
            </div>
            <table style={styles.table}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  <th style={styles.th}>이름</th>
                  {mode === "DAILY" && (
                    <>
                      <th style={styles.th}>직무</th>
                      <th style={styles.th}>시간</th>
                    </>
                  )}
                  <th style={styles.th}>급여(세전)</th>
                  <th style={styles.th}>관리</th>
                </tr>
              </thead>
              <tbody>
                {data.payroll.map((w, i) => (
                  <tr key={i}>
                    <td style={{ ...styles.td, fontWeight: "bold" }}>
                      {w.name}
                    </td>
                    {mode === "DAILY" && (
                      <>
                        <td style={styles.td}>{w.job_name}</td>
                        <td style={styles.td}>{w.hours}h</td>
                      </>
                    )}
                    <td
                      style={{
                        ...styles.td,
                        color: theme.primary,
                        fontWeight: "700",
                      }}
                    >
                      {(w.payment_amount || 0).toLocaleString()}원
                    </td>
                    <td style={styles.td}>
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          alignItems: "center",
                        }}
                      >
                        <button
                          style={{
                            ...styles.btnOutline,
                            padding: "6px 10px",
                            fontSize: "12px",
                          }}
                          onClick={() => showDetail(w.name)}
                        >
                          <FileText size={12} /> 명세서
                        </button>
                        {mode === "DAILY" && targetDate === TODAY && (
                          <button
                            style={{
                              ...styles.btnIcon,
                              background: "#f1f5f9",
                            }}
                            onClick={() =>
                              setEditLog({
                                id: w.id,
                                job_name: w.job_name,
                                work_hours: w.hours,
                              })
                            }
                          >
                            <Edit2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* SMS */}
        {activeTab === "sms" && (
          <div style={styles.card}>
            <div
              style={{
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Send size={20} color={theme.primary} />
              <span style={{ fontWeight: "700" }}>
                SMS 자동 배정 시뮬레이션
              </span>
            </div>
            {mode === "DAILY" && (
              <div
                style={{
                  marginBottom: "12px",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  background: "#ecfeff",
                  border: "1px solid #bae6fd",
                  fontSize: "13px",
                  color: theme.textSub,
                }}
              >
                일용직 업무 가중치: <b>상하차 40%</b> / <b>포장 40%</b> /{" "}
                <b>재고관리 20%</b>
              </div>
            )}
            <div
              style={{
                background: "#1e293b",
                color: "#4ade80",
                padding: "24px",
                borderRadius: "12px",
                height: "450px",
                overflowY: "auto",
                fontFamily: "monospace",
                fontSize: "13px",
                lineHeight: 1.6,
              }}
            >
              {data.sms.map((s, i) => (
                <div
                  key={i}
                  style={{
                    marginBottom: "8px",
                    borderBottom: "1px solid rgba(255,255,255,0.1)",
                    paddingBottom: "4px",
                  }}
                >
                  <span style={{ color: "#94a3b8" }}>[{i + 1}]</span> To:{" "}
                  {s.phone}
                  <br />
                  <span style={{ color: "#fff" }}>{`>> ${s.text}`}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Settings */}
        {activeTab === "settings" && (
          <div style={styles.card}>
            <div
              style={{
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Settings size={20} color={theme.primary} />
                <span style={{ fontWeight: "700" }}>직무 가중치 설정</span>
              </div>
            </div>

            {/* 직무 추가 폼 */}
            <div
              style={{
                marginBottom: "20px",
                padding: "12px",
                borderRadius: "12px",
                border: `1px dashed ${theme.border}`,
                background: "#f8fafc",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  alignItems: "center",
                  marginBottom: "8px",
                  fontSize: "13px",
                  color: theme.textSub,
                }}
              >
                <Plus size={16} />
                <span>새 직무 추가</span>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <input
                  style={{ ...styles.input, flex: "1 1 120px" }}
                  placeholder="직무명 (예: 피킹)"
                  value={newJobName}
                  onChange={(e) => setNewJobName(e.target.value)}
                />
                <input
                  style={{ ...styles.input, width: "90px" }}
                  type="number"
                  placeholder="시급"
                  value={newJobWage}
                  onChange={(e) => setNewJobWage(e.target.value)}
                />
                <input
                  style={{ ...styles.input, width: "80px" }}
                  type="number"
                  step="0.1"
                  placeholder="강도"
                  value={newJobIntensity}
                  onChange={(e) => setNewJobIntensity(e.target.value)}
                />
                <input
                  style={{ ...styles.input, flex: "1 1 120px" }}
                  placeholder="필요 자격증 (선택)"
                  value={newJobCert}
                  onChange={(e) => setNewJobCert(e.target.value)}
                />
                <button
                  style={{
                    ...styles.btn,
                    padding: "8px 14px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                  onClick={handleAddJob}
                >
                  <Plus size={14} />
                  추가
                </button>
              </div>
            </div>

            <table style={styles.table}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  <th style={styles.th}>직무명</th>
                  <th style={styles.th}>강도(Intensity)</th>
                  <th style={styles.th}>시급</th>
                  <th style={styles.th}>현재 비율 (Ratio)</th>
                  <th style={styles.th}>조정</th>
                  <th style={styles.th}>삭제</th>
                </tr>
              </thead>
              <tbody>
                {data.settings.map((s, i) => (
                  <tr key={s.job_name}>
                    <td style={{ ...styles.td, fontWeight: "bold" }}>
                      {s.job_name}
                    </td>
                    <td style={styles.td}>{s.intensity}</td>
                    <td style={styles.td}>
                      {(s.hourly_wage || 0).toLocaleString()}원
                    </td>
                    <td
                      style={{
                        ...styles.td,
                        color: theme.primary,
                        fontWeight: "700",
                      }}
                    >
                      {s.ratio}%
                    </td>
                    <td style={styles.td}>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={s.ratio}
                        style={{
                          width: "150px",
                          marginRight: "10px",
                          verticalAlign: "middle",
                        }}
                        onChange={(e) =>
                          handleSliderChange(i, e.target.value)
                        }
                        onMouseUp={(e) =>
                          commitRatioChange(s.job_name, e.target.value)
                        }
                      />
                      <input
                        type="number"
                        value={s.ratio}
                        style={{
                          ...styles.input,
                          width: "60px",
                          textAlign: "center",
                        }}
                        readOnly
                      />
                    </td>
                    <td style={styles.td}>
                      <button
                        style={{
                          ...styles.btnIcon,
                          background: "#fee2e2",
                          color: theme.danger,
                        }}
                        onClick={() => handleDeleteJob(s.job_name)}
                      >
                        <X size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Detail Modal */}
        {selectedName && (
          <div style={styles.modal}>
            <div style={styles.modalContent}>
              <h3 style={{ marginBottom: "16px" }}>
                📜 {selectedName}님 상세 내역
              </h3>
              <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                <table style={{ ...styles.table, fontSize: "13px" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      <th style={styles.th}>날짜</th>
                      <th style={styles.th}>직무</th>
                      <th style={styles.th}>시간</th>
                      <th style={styles.th}>급여</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailLogs &&
                      detailLogs.map((l, idx) => (
                        <tr key={idx}>
                          <td style={styles.td}>{l.work_date}</td>
                          <td style={styles.td}>{l.job_name}</td>
                          <td style={styles.td}>{l.work_hours}h</td>
                          <td
                            style={{
                              ...styles.td,
                              fontWeight: "bold",
                            }}
                          >
                            {(l.total_pay || 0).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              <button
                style={{
                  ...styles.btn,
                  width: "100%",
                  justifyContent: "center",
                  marginTop: "20px",
                }}
                onClick={() => setSelectedName(null)}
              >
                닫기
              </button>
            </div>
          </div>
        )}

        {/* Edit Log Modal */}
        {editLog && (
          <div style={styles.modal}>
            <div
              style={{
                ...styles.modalContent,
                width: "350px",
              }}
            >
              <h4 style={{ marginBottom: "16px" }}>기록 수정</h4>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "13px",
                  fontWeight: "600",
                }}
              >
                직무명
              </label>
              <input
                style={{
                  ...styles.input,
                  width: "100%",
                  marginBottom: "16px",
                }}
                value={editLog.job_name}
                onChange={(e) =>
                  setEditLog({ ...editLog, job_name: e.target.value })
                }
              />
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "13px",
                  fontWeight: "600",
                }}
              >
                근무 시간
              </label>
              <input
                type="number"
                style={{
                  ...styles.input,
                  width: "100%",
                  marginBottom: "24px",
                }}
                value={editLog.work_hours}
                onChange={(e) =>
                  setEditLog({
                    ...editLog,
                    work_hours: Number(e.target.value),
                  })
                }
              />
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  style={{
                    ...styles.btn,
                    flex: 1,
                    justifyContent: "center",
                  }}
                  onClick={saveEditLog}
                >
                  저장
                </button>
                <button
                  style={{
                    ...styles.btnOutline,
                    flex: 1,
                    justifyContent: "center",
                  }}
                  onClick={() => setEditLog(null)}
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Worker Modal */}
        {editWorker && (
          <div style={styles.modal}>
            <div
              style={{
                ...styles.modalContent,
                width: "350px",
              }}
            >
              <h4 style={{ marginBottom: "16px" }}>명단 정보 수정</h4>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "13px",
                  fontWeight: "600",
                }}
              >
                전화번호
              </label>
              <input
                style={{
                  ...styles.input,
                  width: "100%",
                  marginBottom: "16px",
                }}
                value={editWorker.phone}
                onChange={(e) =>
                  setEditWorker({ ...editWorker, phone: e.target.value })
                }
              />
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "13px",
                  fontWeight: "600",
                }}
              >
                소속 센터
              </label>
              <input
                style={{
                  ...styles.input,
                  width: "100%",
                  marginBottom: "24px",
                }}
                value={editWorker.center}
                onChange={(e) =>
                  setEditWorker({ ...editWorker, center: e.target.value })
                }
              />
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  style={{
                    ...styles.btn,
                    flex: 1,
                    justifyContent: "center",
                  }}
                  onClick={saveEditWorker}
                >
                  저장
                </button>
                <button
                  style={{
                    ...styles.btnOutline,
                    flex: 1,
                    justifyContent: "center",
                  }}
                  onClick={() => setEditWorker(null)}
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
