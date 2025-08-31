import React, { useMemo, useState, useEffect } from "react";

// 번개런 포털 – 데모 버전 (클라이언트 상태/로컬스토리지 사용)
// - 이벤트 목록, 생성, 참여/취소, 검색/필터, 정원/대기 표시
// - 실제 배포/공유는 차후 백엔드 연결만 추가하면 됩니다.
// - Tailwind 사용 (미리보기에서 자동 적용)

// 타입 정의
const paceOptions = [
  "4:00~4:30", "4:30~5:00", "5:00~5:30", "5:30~6:00", "6:00~6:30", "6:30+"
];

function classNames(...c) { return c.filter(Boolean).join(" "); }

const sampleEvents = [
  {
    id: "E-250901-2000",
    title: "정릉천 8km · 6:00",
    date: "2025-09-01",
    time: "20:00",
    course: "정릉천 왕복",
    distanceKm: 8,
    paceBand: "5:30~6:00",
    host: "민규",
    capacity: 12,
    note: "초보 환영, 헤드램프 권장",
    participants: ["준우", "현수", "지우", "도윤"],
  },
  {
    id: "E-250903-0600",
    title: "트랙 인터벌 5x800m",
    date: "2025-09-03",
    time: "06:00",
    course: "교내 트랙",
    distanceKm: 6,
    paceBand: "4:30~5:00",
    host: "서현",
    capacity: 8,
    note: "400m 조깅 휴식",
    participants: ["준우", "태윤"],
  },
  {
    id: "E-250906-0900",
    title: "북악 스카이웨이 업힐 10km",
    date: "2025-09-06",
    time: "09:00",
    course: "정릉로-북악",
    distanceKm: 10,
    paceBand: "6:00~6:30",
    host: "다연",
    capacity: 20,
    note: "업힐 경험자 권장, 물 필수",
    participants: ["준우", "민서", "하윤", "지호", "시우", "연우"],
  },
];

const STORAGE_KEY = "spark-run-events-v1";
const ME_KEY = "spark-run-me";

export default function SparkRunPortal() {
  const [events, setEvents] = useState([]);
  const [me, setMe] = useState("");
  const [q, setQ] = useState("");
  const [paceFilter, setPaceFilter] = useState("");
  const [dayFilter, setDayFilter] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setEvents(parsed);
      } catch {
        setEvents(sampleEvents);
      }
    } else {
      setEvents(sampleEvents);
    }
    const savedMe = localStorage.getItem(ME_KEY) || "";
    setMe(savedMe);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 1800);
    return () => clearTimeout(t);
  }, [toast]);

  const filtered = useMemo(() => {
    const now = new Date();
    return events
      .filter(e => new Date(e.date + "T" + e.time) >= new Date(now.getTime() - 1000*60*60*24))
      .filter(e => (q ? (e.title+e.course+e.note).toLowerCase().includes(q.toLowerCase()) : true))
      .filter(e => (paceFilter ? e.paceBand === paceFilter : true))
      .filter(e => (dayFilter ? new Date(e.date).getDay().toString() === dayFilter : true))
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  }, [events, q, paceFilter, dayFilter]);

  function dowToKorean(dow) {
    return ["일","월","화","수","목","금","토"][dow];
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}(${dowToKorean(d.getDay())})`;
  }

  function onJoin(e) {
    if (!me) { setToast("먼저 상단에서 이름을 입력하세요"); return; }
    const isIn = e.participants.includes(me);
    setEvents(prev => prev.map(x => x.id===e.id ? ({
      ...x,
      participants: isIn ? x.participants.filter(p => p!==me) : [...x.participants, me],
    }) : x));
  }

  function capacityText(e) {
    const remain = e.capacity - e.participants.length;
    if (remain > 0) return `남은자리 ${remain} / ${e.capacity}`;
    if (remain === 0) return `정원 마감 (대기 신청)`;
    return `대기 ${Math.abs(remain)}명`;
  }

  function Badge({ children, tone="" }) {
    const map = {
      green: "bg-green-100 text-green-700",
      red: "bg-red-100 text-red-700",
      slate: "bg-slate-100 text-slate-700",
      blue: "bg-blue-100 text-blue-700",
      amber: "bg-amber-100 text-amber-800",
    };
    return <span className={classNames("px-2 py-0.5 rounded-full text-xs font-medium", map[tone] || map.slate)}>{children}</span>;
  }

  function NewEventModal() {
    const [form, setForm] = useState({
      title: "",
      date: "",
      time: "",
      course: "",
      distanceKm: "",
      paceBand: "",
      host: me || "",
      capacity: 10,
      note: "",
    });

    function submit() {
      if (!form.date || !form.time || !form.course || !form.paceBand) {
        setToast("날짜/시간/코스/페이스는 필수입니다");
        return;
      }
      setCreating(true);
      const id = `E-${form.date.replaceAll('-','').slice(2)}-${form.time.replace(':','')}`;
      const title = `${form.course} ${form.distanceKm?form.distanceKm+"km ":""}· ${form.paceBand.split("~")[0]}`;
      const ev = {
        id,
        title,
        date: form.date,
        time: form.time,
        course: form.course,
        distanceKm: form.distanceKm? Number(form.distanceKm): undefined,
        paceBand: form.paceBand,
        host: form.host || me || "호스트",
        capacity: Number(form.capacity)||10,
        note: form.note,
        participants: me? [me] : [],
      };
      setEvents(prev => [...prev, ev]);
      setShowNew(false);
      setCreating(false);
      setToast("번개가 등록됐습니다");
    }

    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" role="dialog" aria-modal>
        <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">번개 만들기</h3>
            <p className="text-sm text-slate-500">날짜/시간/코스/페이스를 채우면 됩니다.</p>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-600 mb-1">날짜*</label>
              <input type="date" className="w-full border rounded-lg px-3 py-2" value={form.date} onChange={e=>setForm(f=>({...f, date:e.target.value}))}/>
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">시간*</label>
              <input type="time" className="w-full border rounded-lg px-3 py-2" value={form.time} onChange={e=>setForm(f=>({...f, time:e.target.value}))}/>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-slate-600 mb-1">코스/집결지*</label>
              <input type="text" placeholder="정릉천 왕복, 교내 트랙 등" className="w-full border rounded-lg px-3 py-2" value={form.course} onChange={e=>setForm(f=>({...f, course:e.target.value}))}/>
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">거리(km)</label>
              <input type="number" min={1} step={0.5} className="w-full border rounded-lg px-3 py-2" value={form.distanceKm} onChange={e=>setForm(f=>({...f, distanceKm:e.target.value}))}/>
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">평균 페이스*</label>
              <select className="w-full border rounded-lg px-3 py-2" value={form.paceBand} onChange={e=>setForm(f=>({...f, paceBand:e.target.value}))}>
                <option value="">선택</option>
                {paceOptions.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">정원</label>
              <input type="number" min={1} className="w-full border rounded-lg px-3 py-2" value={form.capacity} onChange={e=>setForm(f=>({...f, capacity:e.target.value}))}/>
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">호스트</label>
              <input type="text" className="w-full border rounded-lg px-3 py-2" value={form.host} onChange={e=>setForm(f=>({...f, host:e.target.value}))}/>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-slate-600 mb-1">비고</label>
              <input type="text" className="w-full border rounded-lg px-3 py-2" value={form.note} onChange={e=>setForm(f=>({...f, note:e.target.value}))}/>
            </div>
          </div>
          <div className="p-6 border-t flex gap-2 justify-end">
            <button className="px-4 py-2 rounded-lg bg-slate-100" onClick={()=>setShowNew(false)}>취소</button>
            <button className={classNames("px-4 py-2 rounded-lg text-white", creating?"bg-slate-400":"bg-blue-600 hover:bg-blue-700")} disabled={creating} onClick={submit}>{creating?"등록 중…":"등록"}</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] w-full bg-gradient-to-b from-white to-slate-50">
      <header className="sticky top-0 z-40 backdrop-blur bg-white/70 border-b">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-blue-600 text-white grid place-items-center font-bold">R</div>
            <div>
              <h1 className="text-lg font-semibold leading-tight">번개런 포털</h1>
              <p className="text-xs text-slate-500 -mt-0.5">모집 · 참여 · 공지 한 곳에서</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="내 이름 (참여용)"
              className="border rounded-lg px-3 py-1.5 text-sm w-36"
              value={me}
              onChange={e=>{ setMe(e.target.value); localStorage.setItem(ME_KEY, e.target.value); }}
            />
            <button className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm" onClick={()=>setShowNew(true)}>
              번개 만들기
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="검색: 코스/메모/제목"
                className="w-full border rounded-xl px-4 py-2"
                value={q}
                onChange={e=>setQ(e.target.value)}
              />
            </div>
            <select className="border rounded-xl px-3 py-2" value={paceFilter} onChange={e=>setPaceFilter(e.target.value)}>
              <option value="">페이스 전체</option>
              {paceOptions.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select className="border rounded-xl px-3 py-2" value={dayFilter} onChange={e=>setDayFilter(e.target.value)}>
              <option value="">요일 전체</option>
              {Array.from({length:7}).map((_,i) => <option key={i} value={i.toString()}>{dowToKorean(i)}</option>)}
            </select>
          </div>
          <div className="text-sm text-slate-500">총 {filtered.length}개의 다가오는 번개</div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mt-4">
          {filtered.map(e => {
            const dateLabel = `${formatDate(e.date)} ${e.time}`;
            const remain = e.capacity - e.participants.length;
            return (
              <article key={e.id} className="rounded-2xl border bg-white shadow-sm hover:shadow-md transition overflow-hidden">
                <div className="p-4 border-b flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-base">{e.title}</h3>
                    <p className="text-sm text-slate-500">{dateLabel}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge tone={remain>0?"green":"amber"}>{capacityText(e)}</Badge>
                    <Badge tone="blue">호스트 {e.host}</Badge>
                  </div>
                </div>
                <div className="p-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="space-y-1">
                    <div className="text-slate-500">코스</div>
                    <div className="font-medium">{e.course}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-slate-500">평균 페이스</div>
                    <div className="font-medium">{e.paceBand}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-slate-500">정원</div>
                    <div className="font-medium">{e.capacity}명</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-slate-500">비고</div>
                    <div className="font-medium truncate" title={e.note}>{e.note || '-'}</div>
                  </div>
                </div>
                <div className="px-4 pb-3 text-sm text-slate-500">참가자 ({e.participants.length})</div>
                <div className="px-4 pb-4 flex flex-wrap gap-2">
                  {e.participants.length ? e.participants.map(p => (
                    <span key={p} className="px-2 py-1 rounded-full bg-slate-100 text-slate-700 text-xs">{p}</span>
                  )) : <span className="text-slate-400 text-sm">아직 없습니다</span>}
                </div>
                <div className="p-4 border-t flex items-center justify-between">
                  <button
                    className={classNames(
                      "px-4 py-2 rounded-lg text-white",
                      e.participants.includes(me) ? "bg-slate-600 hover:bg-slate-700" : (remain>0?"bg-blue-600 hover:bg-blue-700":"bg-amber-600 hover:bg-amber-700")
                    )}
                    onClick={()=>onJoin(e)}
                  >
                    {e.participants.includes(me) ? "참여 취소" : (remain>0?"참여":"대기 신청")}
                  </button>
                  <div className="flex items-center gap-2 text-sm">
                    <button
                      className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200"
                      onClick={()=>{
                        navigator.clipboard?.writeText(window.location.href + "#" + e.id);
                        setToast("링크가 복사되었습니다");
                      }}
                    >링크 복사</button>
                    <button
                      className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200"
                      onClick={()=>{
                        const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:${e.title}\nDTSTART:${e.date.replaceAll('-','')}T${e.time.replace(':','')}00\nDTEND:${e.date.replaceAll('-','')}T${e.time.replace(':','')}00\nEND:VEVENT\nEND:VCALENDAR`;
                        const blob = new Blob([ics], {type:'text/calendar'});
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url; a.download = `${e.id}.ics`; a.click();
                        URL.revokeObjectURL(url);
                      }}
                    >캘린더 추가(.ics)</button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {filtered.length===0 && (
          <div className="text-center text-slate-500 py-24">일치하는 번개가 없습니다</div>
        )}
      </main>

      <footer className="max-w-5xl mx-auto px-4 pb-10 pt-6 text-xs text-slate-500">
        <div className="flex items-center justify-between">
          <div>© {new Date().getFullYear()} Run Club – Spark(번개) Portal · 데모</div>
          <div className="space-x-2">
            <button className="underline" onClick={()=>{ localStorage.removeItem(STORAGE_KEY); setEvents(sampleEvents); setToast("데모 데이터가 초기화되었습니다"); }}>데모 데이터 초기화</button>
          </div>
        </div>
      </footer>

      {showNew && <NewEventModal/>}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-black text-white text-sm px-4 py-2 rounded-full shadow-lg">{toast}</div>
      )}
    </div>
  );
}
