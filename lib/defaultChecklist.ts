import { CheckSection } from '@/types'

export const DEFAULT_SECTIONS: CheckSection[] = [
  {
    id: 'commute',
    name: '출퇴근',
    color: '#4fa3e0',
    cards: [
      {
        id: 'morning-commute',
        title: '출근길',
        timeRange: '07:30 – 09:00',
        icon: '🌅',
        items: [
          { id: 'c1', name: 'LLM / 개발 관련 유튜브 or 팟캐스트', timeTag: '30분', tip: '이동 시간을 지식으로 — 이어폰만 꽂으면 됨', done: false },
          { id: 'c2', name: '오늘 할 일 3가지 메모', timeTag: '5분', tip: 'MIT 3개만 — 많으면 안 됨', done: false },
          { id: 'c3', name: '책 읽기 or 머더 미스터리 구상', timeTag: '20분', tip: '스마트폰 대신 독서 or 메모장', done: false },
        ],
      },
      {
        id: 'evening-commute',
        title: '퇴근길',
        timeRange: '18:00 – 19:00',
        icon: '🌙',
        items: [
          { id: 'c4', name: '오늘 회고 — 잘한 것 1가지 떠올리기', timeTag: '5분', tip: '자책 말고 칭찬 먼저', done: false },
          { id: 'c5', name: '머더 미스터리 / 소설 아이디어 메모', timeTag: '15분', tip: '뇌가 비어있는 퇴근길 — 창의력 폭발 타임', done: false },
          { id: 'c6', name: '팟캐스트 / 유튜브 공부', timeTag: '30분', done: false },
        ],
      },
    ],
  },
  {
    id: 'after',
    name: '퇴근 후 4시간',
    color: '#3ecfae',
    cards: [
      {
        id: 'dinner',
        title: '저녁 식사',
        timeRange: '19:00 – 19:30',
        icon: '🥚',
        items: [
          { id: 'a1', name: '저녁 식사 (9시 이전 완료)', timeTag: '필수', tip: '맵고 짠 것, 튀긴 것 자제', done: false },
          { id: 'a2', name: '물 한 컵 + 비타민 챙기기', timeTag: '2분', done: false },
        ],
      },
      {
        id: 'workout',
        title: '홈트 타임',
        timeRange: '19:30 – 20:00',
        icon: '🏃',
        items: [
          { id: 'a3', name: '홈트 20분', timeTag: '핵심', tip: '운동복만 입어도 절반 성공 — 유튜브 따라하기', done: false },
          { id: 'a4', name: '폼롤러 5분', timeTag: '5분', tip: '허벅지 → 종아리 → 등 순서로', done: false },
          { id: 'a5', name: '샤워', done: false },
        ],
      },
      {
        id: 'creative',
        title: '창작 집중',
        timeRange: '20:30 – 22:00',
        icon: '✍️',
        items: [
          { id: 'a6', name: '머더 미스터리 작업 or 소설 쓰기', timeTag: '60분', tip: '핸드폰 뒤집어 놓기 — 이 시간만큼은 온전히 내 것', done: false },
          { id: 'a7', name: 'LLM / 개발 공부', timeTag: '30분', tip: '창작 후 뇌 전환 — 기술 쪽으로', done: false },
        ],
      },
      {
        id: 'wind-down',
        title: '마무리 루틴',
        timeRange: '22:00 – 00:00',
        icon: '🌛',
        items: [
          { id: 'a8', name: '내일 할 일 3가지 메모', timeTag: '5분', done: false },
          { id: 'a9', name: '감사 일기 3줄', timeTag: '5분', tip: '오늘 있었던 작은 좋은 일 3가지', done: false },
          { id: 'a10', name: '핸드폰 내려놓기 + 자정 전 취침', timeTag: '필수', tip: '9시 이후 금식 확인', done: false },
        ],
      },
    ],
  },
  {
    id: 'house',
    name: '집안일',
    color: '#f5a623',
    cards: [
      {
        id: 'daily-chores',
        title: '매일',
        icon: '📅',
        items: [
          { id: 'h1', name: '설거지', timeTag: '10분', tip: '밥 먹고 바로 — 쌓이면 더 싫음', done: false },
          { id: 'h2', name: '책상 / 식탁 정리', timeTag: '5분', done: false },
          { id: 'h3', name: '쓰레기 분리수거 확인', timeTag: '2분', done: false },
        ],
      },
      {
        id: 'weekly-chores',
        title: '주 2–3회',
        icon: '🗓',
        items: [
          { id: 'h4', name: '청소기 / 바닥 닦기', timeTag: '20분', tip: '화 / 금 루틴으로 고정 추천', done: false },
          { id: 'h5', name: '빨래 돌리기 + 널기', timeTag: '15분', tip: '홈트 시작할 때 같이 돌리면 끝날 때 완료', done: false },
          { id: 'h6', name: '화장실 청소', timeTag: '10분', done: false },
          { id: 'h7', name: '냉장고 / 식재료 체크', timeTag: '5분', tip: '콩물 / 달걀 재고 확인', done: false },
        ],
      },
    ],
  },
]
