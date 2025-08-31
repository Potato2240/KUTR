import React, { useMemo, useState, useEffect } from "react";

import React from "react";

export default function Home() {
  return (
    <div style={{padding: 24, fontFamily: "system-ui"}}>
      <h1>배포 연결 OK</h1>
      <p>이 화면이 보이면 라우팅은 정상입니다.</p>
    </div>
  );
}

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
}
