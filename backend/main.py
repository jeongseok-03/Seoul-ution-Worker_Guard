import os
import sqlite3
import io
import bcrypt
import pandas as pd
from datetime import datetime, timedelta

from fastapi import (
    FastAPI, UploadFile, File, Form, HTTPException,
    Depends, Request
)
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional, Dict, Any

from jose import JWTError, jwt  # JWT 토큰 발급/검증

# ==============================
# 설정 / 상수
# ==============================

DB_PATH = os.getenv("DB_PATH", "worker_data_v22.db")

SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-me")  # 실제 서비스에선 반드시 환경변수로
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60  # 1시간

PAYROLL_DELAY_DAYS = 3   # 일용직 급여 지급 지연 일수 (D-3)
MAX_UPLOAD_SIZE = 5 * 1024 * 1024  # 5MB

# 개발/해커톤용: 실제 서비스에선 허용 도메인만 명시
ORIGINS = [
    "http://localhost:3000",
]

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()  # Authorization: Bearer <token>

# 로그인 시도 제한 (인메모리)
login_attempts: Dict[str, Dict[str, Any]] = {}
MAX_LOGIN_ATTEMPTS = 5
BLOCK_DURATION_SECONDS = 300  # 5분

# ==============================
# 공통 유틸 / DB
# ==============================

def get_db():
    conn = sqlite3.connect(DB_PATH)
    return conn

def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return token

def calc_pay(slot: str, hours: float, wage: int):
    is_night = (
        ("18:00~02:00" in slot and "(후반)" in slot) or
        ("02:00~10:00" in slot and "(전반)" in slot)
    )
    return (hours if is_night else 0), int(hours * wage * (1.5 if is_night else 1.0))

# ==============================
# DB 초기화
# ==============================

def init_db():
    conn = get_db()
    try:
        c = conn.cursor()

        # 계정 테이블
        c.execute('''CREATE TABLE IF NOT EXISTS accounts (
            company_code TEXT,
            username TEXT,
            secret_key TEXT,
            role INTEGER,
            company_name TEXT,
            PRIMARY KEY (company_code, username)
        )''')

        # 직원 명단
        c.execute('''CREATE TABLE IF NOT EXISTS workers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            phone TEXT,
            center TEXT,
            shift TEXT,
            cert TEXT,
            worker_type TEXT,
            valid_date TEXT
        )''')

        # 직무 설정
        c.execute('''CREATE TABLE IF NOT EXISTS job_settings (
            job_name TEXT PRIMARY KEY,
            intensity REAL,
            hourly_wage INTEGER,
            ratio INTEGER,
            required_cert TEXT
        )''')

        # 근무 기록
        c.execute('''CREATE TABLE IF NOT EXISTS work_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            location TEXT,
            job_name TEXT,
            time_slot TEXT,
            work_hours REAL,
            night_hours REAL,
            total_pay INTEGER,
            intensity REAL,
            score REAL,
            work_date TEXT,
            worker_type TEXT
        )''')

        # 초기 계정
        c.execute("SELECT count(*) FROM accounts")
        if c.fetchone()[0] == 0:
            pw_hash = get_password_hash("1234")  # 데모용 비밀번호
            c.execute("INSERT INTO accounts VALUES ('WMS01', 'admin', ?, 1, '대한통운 서울센터')", (pw_hash,))
            c.execute("INSERT INTO accounts VALUES ('WMS01', 'staff', ?, 2, '대한통운 서울센터')", (pw_hash,))

        # 초기 직무
        c.execute("SELECT count(*) FROM job_settings")
        if c.fetchone()[0] == 0:
            jobs = [
                ('상하차', 1.9, 15000, 20, None),
                ('포장', 1.0, 12000, 20, None),
                ('재고관리', 0.8, 13000, 20, None),
                ('특수용접', 1.7, 25000, 10, '용접기능사'),
                ('전기설비', 1.5, 22000, 10, '전기기사'),
                ('지게차', 1.4, 18000, 20, '지게차면허')
            ]
            c.executemany("INSERT INTO job_settings VALUES (?,?,?,?,?)", jobs)

        conn.commit()
    finally:
        conn.close()

init_db()

# ==============================
# Pydantic 모델
# ==============================

class LoginReq(BaseModel):
    code: str
    username: str
    key: str

class EditLog(BaseModel):
    id: int
    job_name: str
    work_hours: float

class EditWorker(BaseModel):
    id: int
    name: str
    phone: str
    center: str

class DeleteWorker(BaseModel):
    id: int

class TokenData(BaseModel):
    username: str
    company_code: str
    role: int
    company_name: str

# ==============================
# 인증/인가 의존성
# ==============================

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> TokenData:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        company_code: str = payload.get("code")
        role: int = payload.get("role")
        company_name: str = payload.get("company")
        if username is None or company_code is None:
            raise HTTPException(status_code=401, detail="토큰이 유효하지 않습니다.")
        return TokenData(
            username=username,
            company_code=company_code,
            role=role,
            company_name=company_name
        )
    except JWTError:
        raise HTTPException(status_code=401, detail="토큰 검증 실패")

def admin_required(user: TokenData = Depends(get_current_user)) -> TokenData:
    if user.role != 1:
        raise HTTPException(status_code=403, detail="관리자 권한이 필요합니다.")
    return user

# ==============================
# 로그인 시도 제한
# ==============================

def check_login_rate_limit(request: Request):
    ip = request.client.host if request.client else "unknown"
    now = datetime.utcnow()

    info = login_attempts.get(ip)
    if info:
        blocked_until = info.get("blocked_until")
        if blocked_until and blocked_until > now:
            raise HTTPException(
                status_code=429,
                detail="로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요."
            )

def register_login_fail(request: Request):
    ip = request.client.host if request.client else "unknown"
    now = datetime.utcnow()
    info = login_attempts.get(ip, {"count": 0, "blocked_until": None})
    info["count"] += 1
    if info["count"] >= MAX_LOGIN_ATTEMPTS:
        info["blocked_until"] = now + timedelta(seconds=BLOCK_DURATION_SECONDS)
        info["count"] = 0
    login_attempts[ip] = info

def reset_login_fail(request: Request):
    ip = request.client.host if request.client else "unknown"
    if ip in login_attempts:
        del login_attempts[ip]

# ==============================
# 파일 업로드 검증
# ==============================

def validate_excel_file(file: UploadFile, content: bytes, required_columns):
    if len(content) > MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=413, detail="파일이 너무 큽니다. 최대 5MB까지 허용됩니다.")

    if file.content_type not in (
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
        "application/octet-stream"  # 일부 브라우저
    ):
        raise HTTPException(status_code=400, detail="엑셀 파일만 업로드 가능합니다.")

    df = pd.read_excel(io.BytesIO(content))
    missing = [col for col in required_columns if col not in df.columns]
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"필수 컬럼이 없습니다: {', '.join(missing)}"
        )
    return df

# ==============================
# API: 인증
# ==============================

@app.post("/auth/login")
async def login(req: LoginReq, request: Request):
    check_login_rate_limit(request)

    conn = get_db()
    try:
        c = conn.cursor()
        c.execute(
            "SELECT secret_key, role, company_name FROM accounts WHERE company_code=? AND username=?",
            (req.code, req.username)
        )
        row = c.fetchone()
        if not row:
            register_login_fail(request)
            return {"success": False, "msg": "로그인 정보가 올바르지 않습니다."}

        stored_hash, role, company_name = row
        try:
            if verify_password(req.key, stored_hash):
                reset_login_fail(request)
                access_token = create_access_token(
                    data={
                        "sub": req.username,
                        "code": req.code,
                        "role": role,
                        "company": company_name
                    }
                )
                return {
                    "success": True,
                    "access_token": access_token,
                    "token_type": "bearer",
                    "role": role,
                    "company": company_name,
                    "username": req.username
                }
        except Exception:
            pass

        register_login_fail(request)
        return {"success": False, "msg": "로그인 정보가 올바르지 않습니다."}
    finally:
        conn.close()

# ==============================
# API: 업로드
# ==============================

@app.post("/upload/workers")
async def upload_workers(
    type: str = Form(...),
    file: UploadFile = File(...),
    user: TokenData = Depends(get_current_user)  # 인증 필요
):
    content = await file.read()
    required_cols = ['이름', '전화번호', '소속센터', '고정교대조', '자격증']
    df = validate_excel_file(file, content, required_cols)

    conn = get_db()
    try:
        c = conn.cursor()
        if type == 'DAILY':
            target_date = str(df.iloc[0].get('기준일')).split()[0]
            if not target_date:
                raise HTTPException(status_code=400, detail="기준일 컬럼이 필요합니다.")
            c.execute(
                "SELECT count(*) FROM workers WHERE worker_type='DAILY' AND valid_date=?",
                (target_date,)
            )
            if c.fetchone()[0] > 0:
                raise HTTPException(
                    status_code=409,
                    detail=f"❌ {target_date} 일용직 명단이 이미 존재합니다."
                )

            for _, r in df.iterrows():
                c.execute(
                    "INSERT INTO workers (name, phone, center, shift, cert, worker_type, valid_date) "
                    "VALUES (?,?,?,?,?,?,?)",
                    (
                        r['이름'],
                        r['전화번호'],
                        r['소속센터'],
                        r['고정교대조'],
                        r['자격증'],
                        type,
                        target_date
                    )
                )
        else:
            # 정규직 명단은 관리자만 덮어쓰기 허용
            if user.role != 1:
                raise HTTPException(status_code=403, detail="정규직 명단 업로드는 관리자만 가능합니다.")

            c.execute("DELETE FROM workers WHERE worker_type='REGULAR'")
            for _, r in df.iterrows():
                c.execute(
                    "INSERT INTO workers (name, phone, center, shift, cert, worker_type, valid_date) "
                    "VALUES (?,?,?,?,?,?,?)",
                    (
                        r['이름'],
                        r['전화번호'],
                        r['소속센터'],
                        r['고정교대조'],
                        r['자격증'],
                        type,
                        ''
                    )
                )
        conn.commit()
    finally:
        conn.close()
    return {"msg": "명단 업로드 완료"}

@app.post("/upload/logs")
async def upload_logs(
    type: str = Form(...),
    file: UploadFile = File(...),
    user: TokenData = Depends(get_current_user)  # 인증 필요
):
    content = await file.read()
    required_cols = ['날짜', '이름', '근무지', '직무', '시간대', '근무시간']
    df = validate_excel_file(file, content, required_cols)

    conn = get_db()
    try:
        c = conn.cursor()
        dates = df['날짜'].astype(str).apply(lambda x: x.split()[0]).unique()
        for d in dates:
            c.execute(
                "SELECT count(*) FROM work_logs WHERE work_date=? AND worker_type=?",
                (d, type)
            )
            if c.fetchone()[0] > 0:
                raise HTTPException(
                    status_code=409,
                    detail=f"❌ {d} 근무 기록이 이미 존재합니다. (수정 탭 이용)"
                )

        c.execute("SELECT job_name, intensity, hourly_wage FROM job_settings")
        job_map = {r[0]: {'int': r[1], 'wage': r[2]} for r in c.fetchall()}

        for _, r in df.iterrows():
            j_info = job_map.get(r['직무'], {'int': 1.0, 'wage': 10000})
            night_h, pay = calc_pay(r['시간대'], r['근무시간'], j_info['wage'])
            work_date = str(r['날짜']).split()[0]
            score = j_info['int'] * r['근무시간'] * 10
            c.execute(
                "INSERT INTO work_logs (name, location, job_name, time_slot, work_hours, night_hours, "
                "total_pay, intensity, score, work_date, worker_type) "
                "VALUES (?,?,?,?,?,?,?,?,?,?,?)",
                (
                    r['이름'], r['근무지'], r['직무'], r['시간대'],
                    r['근무시간'], night_h, pay, j_info['int'],
                    score, work_date, type
                )
            )
        conn.commit()
    finally:
        conn.close()
    return {"msg": "기록 업로드 완료"}

# ==============================
# API: 다운로드 (인증 필요)
# ==============================

@app.get("/download")
async def download(
    target: str,
    type: str,
    user: TokenData = Depends(get_current_user)
):
    conn = get_db()
    try:
        table = "workers" if target == "workers" else "work_logs"
        df = pd.read_sql_query(
            f"SELECT * FROM {table} WHERE worker_type=?",
            conn,
            params=(type,)
        )
    finally:
        conn.close()

    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False)
    output.seek(0)
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f"attachment; filename={target}_{type}.xlsx"
        }
    )

# ==============================
# API: 명단 조회/수정/삭제
# ==============================

@app.get("/workers/list")
async def get_workers_list(
    type: str,
    date: Optional[str] = None,
    user: TokenData = Depends(get_current_user)
):
    conn = get_db()
    conn.row_factory = sqlite3.Row
    try:
        c = conn.cursor()
        if type == 'DAILY' and date:
            c.execute(
                "SELECT * FROM workers WHERE worker_type='DAILY' AND valid_date=?",
                (date,)
            )
        else:
            c.execute("SELECT * FROM workers WHERE worker_type=?", (type,))
        return [dict(r) for r in c.fetchall()]
    finally:
        conn.close()

@app.post("/edit/worker")
async def edit_worker(
    data: EditWorker,
    user: TokenData = Depends(get_current_user)
):
    conn = get_db()
    try:
        c = conn.cursor()
        c.execute("SELECT worker_type FROM workers WHERE id=?", (data.id,))
        row = c.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="대상 근로자를 찾을 수 없습니다.")
        worker_type = row[0]
        if worker_type == 'REGULAR' and user.role != 1:
            raise HTTPException(status_code=403, detail="정규직 명단 수정은 관리자만 가능합니다.")

        c.execute(
            "UPDATE workers SET name=?, phone=?, center=? WHERE id=?",
            (data.name, data.phone, data.center, data.id)
        )
        conn.commit()
    finally:
        conn.close()
    return {"msg": "명단 수정 완료"}

@app.post("/delete/worker")
async def delete_worker(
    data: DeleteWorker,
    user: TokenData = Depends(get_current_user)
):
    conn = get_db()
    try:
        c = conn.cursor()
        c.execute("SELECT worker_type FROM workers WHERE id=?", (data.id,))
        row = c.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="대상 근로자를 찾을 수 없습니다.")
        worker_type = row[0]
        if worker_type == 'REGULAR' and user.role != 1:
            raise HTTPException(status_code=403, detail="정규직 명단 삭제는 관리자만 가능합니다.")

        c.execute("DELETE FROM workers WHERE id=?", (data.id,))
        conn.commit()
    finally:
        conn.close()
    return {"msg": "삭제 완료"}

# ==============================
# API: 기록 수정
# ==============================

@app.post("/edit/log")
async def edit_log(
    data: EditLog,
    user: TokenData = Depends(get_current_user)
):
    conn = get_db()
    try:
        c = conn.cursor()
        c.execute(
            "SELECT intensity, hourly_wage FROM job_settings WHERE job_name=?",
            (data.job_name,)
        )
        j = c.fetchone()
        if not j:
            raise HTTPException(status_code=400, detail="직무 설정이 존재하지 않습니다.")

        c.execute("SELECT time_slot FROM work_logs WHERE id=?", (data.id,))
        row = c.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="근무 기록을 찾을 수 없습니다.")
        slot = row[0]

        night_h, pay = calc_pay(slot, data.work_hours, j[1])
        score = j[0] * data.work_hours * 10

        c.execute(
            "UPDATE work_logs SET job_name=?, work_hours=?, night_hours=?, total_pay=?, intensity=?, score=? "
            "WHERE id=?",
            (data.job_name, data.work_hours, night_h, pay, j[0], score, data.id)
        )
        conn.commit()
    finally:
        conn.close()
    return {"msg": "수정 완료"}

# ==============================
# API: 급여 관리
# ==============================

@app.get("/payroll")
async def get_payroll(
    center: str,
    date_filter: str,
    type: str,
    user: TokenData = Depends(get_current_user)
):
    conn = get_db()
    conn.row_factory = sqlite3.Row
    try:
        c = conn.cursor()
        if type == 'REGULAR':
            c.execute(
                """
                SELECT name,
                       COUNT(DISTINCT work_date) as days,
                       SUM(work_hours) as hours,
                       SUM(total_pay) as payment_amount
                FROM work_logs
                WHERE location=? AND work_date LIKE ? AND worker_type='REGULAR'
                GROUP BY name
                """,
                (center, f"{date_filter}%")
            )
            return [dict(r) for r in c.fetchall()]
        else:
            target_date = (
                datetime.strptime(date_filter, "%Y-%m-%d") -
                timedelta(days=PAYROLL_DELAY_DAYS)
            ).strftime("%Y-%m-%d")
            c.execute(
                """
                SELECT id, name, job_name, time_slot, work_hours as hours,
                       total_pay as payment_amount, work_date
                FROM work_logs
                WHERE location=? AND work_date=? AND worker_type='DAILY'
                """,
                (center, target_date)
            )
            return {"target_date": target_date, "list": [dict(r) for r in c.fetchall()]}
    finally:
        conn.close()

@app.get("/workforce/detail")
async def get_detail(
    name: str,
    date_filter: str,
    type: str,
    user: TokenData = Depends(get_current_user)
):
    conn = get_db()
    conn.row_factory = sqlite3.Row
    try:
        c = conn.cursor()
        if type == 'REGULAR':
            c.execute(
                "SELECT * FROM work_logs WHERE name=? AND work_date LIKE ? ORDER BY work_date DESC",
                (name, f"{date_filter}%")
            )
        else:
            target_date = (
                datetime.strptime(date_filter, "%Y-%m-%d") -
                timedelta(days=PAYROLL_DELAY_DAYS)
            ).strftime("%Y-%m-%d")
            c.execute(
                "SELECT * FROM work_logs WHERE name=? AND work_date=? ORDER BY time_slot",
                (name, target_date)
            )
        return [dict(r) for r in c.fetchall()]
    finally:
        conn.close()

# ==============================
# API: 리스크 분석
# ==============================

@app.get("/risk")
async def get_risk(
    type: str,
    user: TokenData = Depends(get_current_user)
):
    conn = get_db()
    conn.row_factory = sqlite3.Row
    try:
        c = conn.cursor()
        c.execute("SELECT MAX(work_date) FROM work_logs WHERE worker_type=?", (type,))
        today_row = c.fetchone()
        today = today_row[0] if today_row else None
        if not today:
            return {}

        prev = (
            datetime.strptime(today, "%Y-%m-%d") -
            timedelta(days=1)
        ).strftime("%Y-%m-%d")

        query = """
            SELECT w.name, w.phone, w.center,
                AVG(CASE WHEN l.work_date=? THEN l.intensity ELSE NULL END) as today_int,
                AVG(CASE WHEN l.work_date=? THEN l.intensity ELSE NULL END) as prev_int
            FROM workers w
            JOIN work_logs l ON w.name = l.name
            WHERE l.work_date IN (?, ?)
              AND w.worker_type=?
              AND l.worker_type=?
            GROUP BY w.name
            HAVING today_int >= 1.5 AND prev_int >= 1.5
        """
        c.execute(query, (today, prev, today, prev, type, type))
        data = {}
        for r in c.fetchall():
            center = r['center']
            if center not in data:
                data[center] = []
            data[center].append(dict(r))
        return data
    finally:
        conn.close()

# ==============================
# API: 센터 분석 (그래프)
# ==============================

@app.get("/analytics")
async def get_analytics(
    type: str,
    user: TokenData = Depends(get_current_user)
):
    conn = get_db()
    conn.row_factory = sqlite3.Row
    try:
        c = conn.cursor()
        c.execute(
            """
            SELECT strftime('%Y-%m', work_date) as month,
                   location,
                   AVG(score) as avg_score
            FROM work_logs
            WHERE worker_type=?
            GROUP BY month, location
            ORDER BY month
            """,
            (type,)
        )
        data = {}
        for r in c.fetchall():
            if r['month']:
                if r['month'] not in data:
                    data[r['month']] = {"month": r['month']}
                data[r['month']][r['location']] = r['avg_score']
        return list(data.values())
    finally:
        conn.close()

# ==============================
# API: SMS 업무 배정 (Admin 전용)
# ==============================

@app.get("/sms")
async def get_sms(
    center: str,
    type: str,
    user: TokenData = Depends(admin_required)  # 관리자만
):
    conn = get_db()
    conn.row_factory = sqlite3.Row
    try:
        c = conn.cursor()
        c.execute(
            "SELECT name, phone FROM workers WHERE center=? AND worker_type=?",
            (center, type)
        )
        workers = c.fetchall()
        c.execute("SELECT job_name, ratio, required_cert FROM job_settings")
        settings = c.fetchall()

        pool = []
        for r in settings:
            if type == 'DAILY' and r['required_cert']:
                continue
            pool.extend([r['job_name']] * r['ratio'])

        import random
        res = []
        if pool:
            for w in workers:
                j1, j2 = random.choice(pool), random.choice(pool)
                res.append({"phone": w['phone'], "text": f"{w['name']} 배정: {j1}/{j2}"})
        return res[:20]
    finally:
        conn.close()

# ==============================
# API: 설정 관리 (Admin 전용)
# ==============================

@app.get("/settings")
async def get_settings(
    user: TokenData = Depends(admin_required)
):
    conn = get_db()
    conn.row_factory = sqlite3.Row
    try:
        c = conn.cursor()
        c.execute("SELECT * FROM job_settings")
        return [dict(r) for r in c.fetchall()]
    finally:
        conn.close()

@app.post("/settings/update")
async def update_s(
    data: dict,
    user: TokenData = Depends(admin_required)
):
    conn = get_db()
    try:
        c = conn.cursor()
        c.execute(
            "UPDATE job_settings SET ratio=? WHERE job_name=?",
            (data['ratio'], data['job_name'])
        )
        conn.commit()
    finally:
        conn.close()
    return {"msg": "ok"}

# 헬스체크용 엔드포인트 (인증 없이)
@app.get("/health")
def health():
    return {"status": "ok"}
