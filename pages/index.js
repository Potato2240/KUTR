import React, { useMemo, useState, useEffect } from "react";

const paceOptions = [
  "4:00~4:30","4:30~5:00","5:00~5:30","5:30~6:00","6:00~6:30","6:30+"
];

const sampleEvents = [
  { id: "E-250901-2000", title: "정릉천 8km · 6:00", date: "2025-09-01", time: "20:00", course: "정릉천 왕복", distanceKm: 8, paceBand: "5:30~6:00", host: "민규", capacity: 12, note: "초보 환영, 헤드램프 권장", participants: ["준우","현수","지우","도윤"] },
  { id: "E-250903-0600", title: "트랙 인터벌 5x800m", date: "2025-09-03", time: "06:00", course: "교내 트랙", distanceKm: 6, paceBand: "4:30~5:00", host: "서현", capacity: 8, note: "400m 조깅 휴식", participants: ["준우","태윤"] },
  { id: "E-250906-0900", title: "북악 스카이웨이 업힐 10km", date: "2025-09-06", time: "09:00", course: "정릉로-북악", distanceKm: 10, paceBand: "6:00~6:30", host: "다연", capacity: 20, note: "업힐 경험자 권장, 물 필수", participants: ["준우","민서","하윤","지호","시우","연우"] }
];

const STORAGE_KEY = "spark-run-events-v1";
const ME_KEY = "spark-run-me";

function dowToKorean(dow){ return ["일","월","화","수","목","금","토"][dow]; }
function formatDate(dateStr){
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}(${dowToKorean(d.getDay())})`;
}

export default function Home(){
  const [events, setEvents] = useState([]);
  const [me, setMe] = useState("");
  const [q, setQ] = useState("");
  const [paceFilter, setPaceFilter] = useState("");
  const [dayFilter, setDayFilter] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (saved) {
      try { setEvents(JSON.parse(saved)); } catch { setEvents(sampleEvents); }
    } else { setEvents(sampleEvents); }
    const savedMe = typeof window !== "undefined" ? localStorage.getItem(ME_KEY) : "";
    setMe(savedMe || "");
  }, []);

  useEffect(() => { if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, JSON.stringify(events)); }, [events]);
  useEffect(() => {
    if(!toast) return;
    const t = setTimeout(()=>setToast(""),1800);
    return () => clearTimeout(t);
  }, [toast]);

  const filtered = useMemo(() => {
    const now = new Date();
    return events
      .filter(e => new Date(e.date + "T" + e.time) >= new Date(now.getTime() - 1000*60*60*24))
      .filter(e => (q ? (e.title+e.course+e.note).toLowerCase().includes(q.toLowerCase()) : true))
      .filter(e => (paceFilter ? e.paceBand === paceFilter : true))
      .filter(e => (dayFilter ? new Date(e.date).getDay().toString() === dayFilter : true))
      .sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
  }, [events,q,paceFilter,dayFilter]);

  function onJoin(e){
    if(!me){ setToast("먼저 상단에서 이름을 입력하세요"); return; }
    const isIn = e.participants.includes(me);
    setEvents(prev => prev.map(x => x.id===e.id ? {...x, participants: isIn ? x.participants.filter(p=>p!==me) : [...x.participants, me]} : x));
  }
  function capacityText(e){
    const remain = e.capacity - e.participants.length;
    if (remain > 0) return `남은자리 ${remain} / ${e.capacity}`;
    if (remain === 0) return `정원 마감 (대기 신청)`;
    return `대기 ${Math.abs(remain)}명`;
  }

  return (
    <div style={{minHeight:"100vh", background:"#f6f7fb"}}>
      <div style={{position:"sticky",top:0,background:"white",borderBottom:"1px solid #e5e7eb",padding:"10px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:36,height:36,borderRadius:12,background:"#2563eb",color:"white",display:"grid",placeItems:"center",fontWeight:700}}>R</div>
          <div>
            <div style={{fontWeight:600}}>번개런 포털</div>
            <div style={{fontSize:12,color:"#6b7280",marginTop:-2}}>모집 · 참여 · 공지 한 곳에서</div>
          </div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <input value={me} onChange={e=>{ setMe(e.target.value); if (typeof window !== "undefined") localStorage.setItem(ME_KEY,e.target.value); }} placeholder="내 이름 (참여용)" style={{border:"1px solid #e5e7eb",borderRadius:8,padding:"8px 10px"}}/>
          <button onClick={()=>setShowNew(true)} style={{background:"#2563eb",color:"white",border:"none",borderRadius:8,padding:"8px 10px"}}>번개 만들기</button>
        </div>
      </div>

      <div style={{maxWidth:900, margin:"16px auto", padding:"0 16px"}}>
        <div style={{display:"flex",gap:8,alignItems:"center",justifyContent:"space-between",flexWrap:"wrap"}}>
          <div style={{display:"flex",gap:8,flex:1}}>
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="검색: 코스/메모/제목" style={{flex:1, border:"1px solid #e5e7eb", borderRadius:12, padding:"10px 12px"}}/>
            <select value={paceFilter} onChange={e=>setPaceFilter(e.target.value)} style={{border:"1px solid #e5e7eb",borderRadius:12,padding:"10px 12px"}}>
              <option value="">페이스 전체</option>
              {paceOptions.map(p=> <option key={p} value={p}>{p}</option>)}
            </select>
            <select value={dayFilter} onChange={e=>setDayFilter(e.target.value)} style={{border:"1px solid #e5e7eb",borderRadius:12,padding:"10px 12px"}}>
              <option value="">요일 전체</option>
              {Array.from({length:7}).map((_,i)=>(<option key={i} value={i.toString()}>{["일","월","화","수","목","금","토"][i]}</option>))}
            </select>
          </div>
          <div style={{fontSize:12,color:"#6b7280"}}>총 {filtered.length}개의 다가오는 번개</div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:16, marginTop:16}}>
          {filtered.map(e=>{
            const dateLabel = `${formatDate(e.date)} ${e.time}`;
            const remain = e.capacity - e.participants.length;
            const joinLabel = e.participants.includes(me) ? "참여 취소" : (remain>0?"참여":"대기 신청");
            const joinColor = e.participants.includes(me) ? "#334155" : (remain>0?"#2563eb":"#d97706");
            return (
              <div key={e.id} style={{background:"white",border:"1px solid #e5e7eb",borderRadius:16,boxShadow:"0 1px 2px rgba(0,0,0,0.04)",overflow:"hidden"}}>
                <div style={{padding:16, borderBottom:"1px solid #e5e7eb", display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <div style={{fontWeight:600}}>{e.title}</div>
                    <div style={{fontSize:12,color:"#6b7280"}}>{dateLabel}</div>
                  </div>
                  <div style={{display:"flex",gap:6, flexWrap:"wrap", justifyContent:"end"}}>
                    <span style={{background:remain>0?"#dcfce7":"#fef3c7", color:remain>0?"#166534":"#92400e", fontSize:12, padding:"3px 8px", borderRadius:999}}>{capacityText(e)}</span>
                    <span style={{background:"#dbeafe", color:"#1e40af", fontSize:12, padding:"3px 8px", borderRadius:999}}>호스트 {e.host}</span>
                  </div>
                </div>

                <div style={{padding:16, display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, fontSize:14}}>
                  <div><div style={{color:"#6b7280"}}>코스</div><div style={{fontWeight:500}}>{e.course}</div></div>
                  <div><div style={{color:"#6b7280"}}>평균 페이스</div><div style={{fontWeight:500}}>{e.paceBand}</div></div>
                  <div><div style={{color:"#6b7280"}}>정원</div><div style={{fontWeight:500}}>{e.capacity}명</div></div>
                  <div><div style={{color:"#6b7280"}}>비고</div><div style={{fontWeight:500, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}} title={e.note}>{e.note||"-"}</div></div>
                </div>

                <div style={{padding:"0 16px 6px", fontSize:12, color:"#6b7280"}}>참가자 ({e.participants.length})</div>
                <div style={{padding:"0 16px 16px", display:"flex", flexWrap:"wrap", gap:6}}>
                  {e.participants.length? e.participants.map(p=>(<span key={p} style={{fontSize:12, background:"#f1f5f9", color:"#334155", padding:"4px 8px", borderRadius:999}}>{p}</span>)) : <span style={{color:"#94a3b8", fontSize:13}}>아직 없습니다</span>}
                </div>

                <div style={{padding:16, borderTop:"1px solid #e5e7eb", display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                  <button onClick={()=>onJoin(e)} style={{background:joinColor, color:"white", border:"none", borderRadius:8, padding:"8px 12px"}}>{joinLabel}</button>
                  <div style={{display:"flex", gap:8}}>
                    <button onClick={()=>{ navigator.clipboard?.writeText(window.location.href + "#" + e.id); setToast("링크가 복사되었습니다"); }} style={{background:"#f1f5f9", border:"none", borderRadius:8, padding:"8px 10px"}}>링크 복사</button>
                    <button onClick={()=>{ const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:${e.title}\nDTSTART:${e.date.replaceAll('-','')}T${e.time.replace(':','')}00\nDTEND:${e.date.replaceAll('-','')}T${e.time.replace(':','')}00\nEND:VEVENT\nEND:VCALENDAR`; const blob = new Blob([ics],{type:"text/calendar"}); const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=`${e.id}.ics`; a.click(); URL.revokeObjectURL(url);} } style={{background:"#f1f5f9", border:"none", borderRadius:8, padding:"8px 10px"}}>캘린더 추가(.ics)</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {!filtered.length && <div style={{textAlign:"center",color:"#6b7280", padding:"60px 0"}}>일치하는 번개가 없습니다</div>}
      </div>

      <div style={{maxWidth:900, margin:"0 auto", padding:"16px", fontSize:12, color:"#6b7280"}}>
        <div style={{display:"flex", justifyContent:"space-between"}}>
          <div>© {new Date().getFullYear()} Run Club – Spark Portal · 데모</div>
          <button onClick={()=>{ if (typeof window !== "undefined") { localStorage.removeItem(STORAGE_KEY); } setEvents(sampleEvents); setToast("데모 데이터가 초기화되었습니다"); }} style={{textDecoration:"underline", background:"transparent", border:"none", color:"#334155"}}>데모 데이터 초기화</button>
        </div>
      </div>

      {showNew && <NewEventModal me={me} setShowNew={setShowNew} setEvents={setEvents} setToast={setToast} />}
      {toast && <div style={{position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)", background:"black", color:"white", fontSize:13, padding:"8px 12px", borderRadius:999}}>{toast}</div>}
    </div>
  );
}

function NewEventModal({me, setShowNew, setEvents, setToast}){
  const [form, setForm] = useState({ title:"", date:"", time:"", course:"", distanceKm:"", paceBand:"", host: me || "", capacity: 10, note:"" });
  const [creating, setCreating] = useState(false);

  function submit(){
    if(!form.date || !form.time || !form.course || !form.paceBand){
      setToast("날짜/시간/코스/페이스는 필수입니다"); return;
    }
    setCreating(true);
    const id = `E-${form.date.replaceAll('-','').slice(2)}-${form.time.replace(':','')}`;
    const title = `${form.course} ${form.distanceKm?form.distanceKm+"km ":""}· ${form.paceBand.split("~")[0]}`;
    const ev = {
      id, title, date: form.date, time: form.time, course: form.course,
      distanceKm: form.distanceKm? Number(form.distanceKm): undefined,
      paceBand: form.paceBand, host: form.host || me || "호스트",
      capacity: Number(form.capacity)||10, note: form.note, participants: me? [me]:[]
    };
    setEvents(prev => [...prev, ev]);
    setShowNew(false); setCreating(false); setToast("번개가 등록됐습니다");
  }

  const inputStyle = {border:"1px solid #e5e7eb", borderRadius:8, padding:"8px 10px", width:"100%"};

  return (
    <div role="dialog" aria-modal style={{position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", display:"grid", placeItems:"center", padding:16, zIndex:50}}>
      <div style={{background:"white", width:"100%", maxWidth:560, borderRadius:16, boxShadow:"0 10px 30px rgba(0,0,0,0.12)"}}>
        <div style={{padding:16, borderBottom:"1px solid #e5e7eb"}}>
          <div style={{fontWeight:600}}>번개 만들기</div>
          <div style={{fontSize:12, color:"#6b7280"}}>날짜/시간/코스/페이스를 채우면 됩니다.</div>
        </div>
        <div style={{padding:16, display:"grid", gridTemplateColumns:"1fr 1fr", gap:12}}>
          <div><div style={{fontSize:12, color:"#6b7280", marginBottom:4}}>날짜*</div><input type="date" value={form.date} onChange={e=>setForm(f=>({...f, date:e.target.value}))} style={inputStyle}/></div>
          <div><div style={{fontSize:12, color:"#6b7280", marginBottom:4}}>시간*</div><input type="time" value={form.time} onChange={e=>setForm(f=>({...f, time:e.target.value}))} style={inputStyle}/></div>
          <div style={{gridColumn:"1/3"}}><div style={{fontSize:12, color:"#6b7280", marginBottom:4}}>코스/집결지*</div><input placeholder="정릉천 왕복, 교내 트랙 등" value={form.course} onChange={e=>setForm(f=>({...f, course:e.target.value}))} style={inputStyle}/></div>
          <div><div style={{fontSize:12, color:"#6b7280", marginBottom:4}}>거리(km)</div><input type="number" min={1} step={0.5} value={form.distanceKm} onChange={e=>setForm(f=>({...f, distanceKm:e.target.value}))} style={inputStyle}/></div>
          <div><div style={{fontSize:12, color:"#6b7280", marginBottom:4}}>평균 페이스*</div><select value={form.paceBand} onChange={e=>setForm(f=>({...f, paceBand:e.target.value}))} style={inputStyle}><option value="">선택</option>{paceOptions.map(p=> <option key={p} value={p}>{p}</option>)}</select></div>
          <div><div style={{fontSize:12, color:"#6b7280", marginBottom:4}}>정원</div><input type="number" min={1} value={form.capacity} onChange={e=>setForm(f=>({...f, capacity:e.target.value}))} style={inputStyle}/></div>
          <div><div style={{fontSize:12, color:"#6b7280", marginBottom:4}}>호스트</div><input value={form.host} onChange={e=>setForm(f=>({...f, host:e.target.value}))} style={inputStyle}/></div>
          <div style={{gridColumn:"1/3"}}><div style={{fontSize:12, color:"#6b7280", marginBottom:4}}>비고</div><input value={form.note} onChange={e=>setForm(f=>({...f, note:e.target.value}))} style={inputStyle}/></div>
        </div>
        <div style={{padding:16, borderTop:"1px solid #e5e7eb", display:"flex", justifyContent:"flex-end", gap:8}}>
          <button onClick={()=>setShowNew(false)} style={{background:"#f1f5f9", border:"none", borderRadius:8, padding:"8px 12px"}}>취소</button>
          <button onClick={submit} disabled={creating} style={{background: creating?"#9ca3af":"#2563eb", color:"white", border:"none", borderRadius:8, padding:"8px 12px"}}>{creating?"등록 중…":"등록"}</button>
        </div>
      </div>
    </div>
  );
}
