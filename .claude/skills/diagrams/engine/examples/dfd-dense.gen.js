const G = require('../gen');
const { entity, proc, store, edge, label } = G;
const VB = [1580, 1000];
const R = 52;
const P = { p4:{x:150,y:380}, p1:{x:490,y:380}, p2:{x:830,y:380}, p3:{x:1170,y:380}, p5:{x:600,y:620}, p6:{x:1010,y:620} };
const E = { shopper:{x:150,y:120,t:['Shopper']}, renter:{x:490,y:120,t:['Renter / Applicant']}, admin:{x:830,y:120,t:['Admin']}, contractor:{x:1170,y:120,t:['Contractor']}, notif:{x:1390,y:620,t:['Notification','Gateway']} };
const SY = 900;
const S = { D7:{x:150,id:'D7',n:'Map / Pathway'}, D1:{x:430,id:'D1',n:'Accounts'}, D2:{x:660,id:'D2',n:'Stalls'}, D3:{x:890,id:'D3',n:'Applications'}, D4:{x:1120,id:'D4',n:'Payments'}, D5:{x:1300,id:'D5',n:'Contracts'}, D6:{x:1460,id:'D6',n:'Notifications'} };

const EDGES = [
  // shopper <-> 4.0
  { p:[[142,148],[142,328]], l:'search / select', at:[110,250] },
  { p:[[158,328],[158,148]], l:'route · 360 · AR', at:[214,235] },
  // renter -> 1.0
  { p:[[482,148],[482,300],[490,300],[490,328]], l:'register / login', at:[470,205] },
  // renter <-> 2.0
  { p:[[528,148],[528,252],[822,252],[822,328]], l:'apply / appeal', at:[675,252] },
  { p:[[838,328],[838,288],[512,288],[512,148]], l:'status / reason', at:[675,288] },
  // admin -> 1.0
  { p:[[822,148],[822,218],[498,218],[498,328]], l:'approve accounts', at:[650,218] },
  // admin -> 3.0
  { p:[[842,148],[842,252],[1162,252],[1162,328]], l:'records', at:[1010,252] },
  // contractor -> 2.0
  { p:[[1162,148],[1162,218],[842,218],[842,328]], l:'review', at:[1040,218] },
  // contractor -> 3.0
  { p:[[1186,148],[1186,328]], l:'manage stall', at:[1262,250] },
  // 2.0 -> 5.0
  { p:[[814,430],[814,500],[600,500],[600,568]], l:'proceed to payment', at:[707,500] },
  // 3.0 -> 6.0
  { p:[[1154,430],[1154,532],[1010,532],[1010,568]], l:'notify', at:[1098,532] },
  // 2.0 -> 6.0
  { p:[[846,430],[846,558],[1010,558],[1010,568]], l:'notify', at:[930,558] },
  // 6.0 -> notif
  { p:[[1062,620],[1306,620]], l:'email / SMS', at:[1184,620] },
  // stores
  { p:[[150,432],[150,877]], l:'graph', at:[186,700] },
  { p:[[474,432],[474,822],[430,822],[430,877]], l:'read / write', at:[438,660] },
  { p:[[846,432],[846,770],[890,770],[890,877]], l:'applications', at:[812,640] },
  { p:[[168,430],[168,560],[656,560],[656,877]], l:'read stalls', at:[392,560] },
  { p:[[1154,432],[1154,712],[666,712],[666,877]], l:'stalls', at:[916,712] },
  { p:[[1186,432],[1186,842],[1300,842],[1300,877]], l:'contracts', at:[1224,720] },
  { p:[[616,672],[616,766],[1120,766],[1120,877]], l:'payments', at:[864,766] },
  { p:[[1024,672],[1024,820],[1460,820],[1460,877]], l:'log', at:[1252,820] },
];

let body = '';
for (const e of EDGES) body += edge(e.p.map(([x,y])=>({x,y}))) + '\n';
for (const e of EDGES) if (e.l) body += label(e.at[0], e.at[1], e.l);
for (const k in E) { const e = E[k]; body += entity(e.x, e.y, k==='notif'?150:e.t[0].length>10?184:168, 56, e.t); }
for (const k in P) { const p = P[k]; body += proc(p.x, p.y, R, lbl(k)); }
for (const k in S) { const s = S[k]; body += store(s.x, SY, 152, s.id, s.n); }
function lbl(k){return {p4:['4.0','Navigate &','Find Stalls'],p1:['1.0','Manage','Accounts'],p2:['2.0','Applications','& Approval'],p3:['3.0','Stalls &','Contracts'],p5:['5.0','Process','Payments'],p6:['6.0','Send','Notifications']}[k];}
G.render('l1', VB, body, 'MyTalipapa — DFD Level 1 (System Decomposition)');
