/* 확률과 점수 설정
   tables : n 이름, w 뽑힐 비율(합이 100이면 그대로 %로 보여요), c 글자 색
   score  : 등급·레어도는 [최소, 최대] 점수, 에그 인첸트·축복은 곱하는 배수
   점수 = (등급 점수 + 레어도 점수) × 에그 인첸트 배수 × 축복 배수 */
window.EGG_CONFIG = {
  tables: {
    grade: [
      { n: 'S', w: 4, c: '#ffc94a' }, { n: 'A', w: 10, c: '#ff8a5c' }, { n: 'B', w: 22, c: '#6fd0ff' },
      { n: 'C', w: 30, c: '#8fe388' }, { n: 'D', w: 34, c: '#a8a1cf' }
    ],
    rarity: [
      { n: '마이스', w: 2.5, c: '#ff2d3d' }, { n: '레전더리', w: 5, c: '#ffc94a' }, { n: '에픽', w: 10, c: '#b57bff' },
      { n: '레어', w: 18, c: '#5aa9ff' }, { n: '언커먼', w: 28.5, c: '#5fd6a0' }, { n: '커먼', w: 36, c: '#b4afd3' }
    ],
    enchant: [
      { n: '니트로', w: 36, c: '#ff7a4d' }, { n: '오메가', w: 28, c: '#c58bff' }, { n: '코스믹', w: 18, c: '#6de3ff' },
      { n: '스크램블드', w: 12, c: '#ff5ec4' }, { n: '골든', w: 6, c: '#ffd24a' }
    ],
    blessing: [
      { n: 'Holy', w: 24, c: '#fff0a8' }, { n: 'Divine', w: 20, c: '#8ee8ff' }, { n: 'Hallowed', w: 17, c: '#c7b3ff' },
      { n: 'Saintly', w: 14, c: '#ffc2e0' }, { n: 'Inferno', w: 11, c: '#ff7a33' }, { n: 'Infinity', w: 8, c: '#ff4fa8' },
      { n: 'Godly', w: 6, c: '#ffd24a' }
    ]
  },
  score: {
    grade: { D: [1000, 1500], C: [1500, 2500], B: [2500, 4000], A: [3500, 5500], S: [5500, 10000] },
    rarity: { '커먼': [1000, 1500], '언커먼': [1500, 2500], '레어': [2500, 3500], '에픽': [2500, 5000], '레전더리': [5000, 9500], '마이스': [9000, 15000] },
    enchant: { '니트로': 1.2, '오메가': 1.5, '코스믹': 1.7, '스크램블드': 2, '골든': 3 },
    blessing: { Holy: 1.2, Divine: 1.5, Hallowed: 1.7, Saintly: 2, Inferno: 2.5, Infinity: 3, Godly: 4 }
  }
};
