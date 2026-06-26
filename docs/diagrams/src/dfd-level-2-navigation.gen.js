const G = require('./gen');
const { proc, entity, store, edge, label } = G;
const VB = [1260, 900];
const R = 56;
const P = { p1:{x:300,y:310,t:['4.1','Browse 360','Panorama']}, p2:{x:700,y:310,t:['4.2','Select','Destination']},
  p3:{x:500,y:540,t:['4.3','Compute','Walking Route']}, p4:{x:300,y:760,t:['4.4','Guide via','Panorama']}, p5:{x:700,y:760,t:['4.5','Guide via','AR + QR']} };
let body = '';
const ed = a => body += edge(a.map(([x,y])=>({x,y})));
// shopper -> 4.1 / 4.2
ed([[468,168],[468,230],[300,230],[300,254]]);
ed([[532,168],[532,230],[700,230],[700,254]]);
// 4.1 / 4.2 -> 4.3
ed([[300,366],[300,440],[456,440],[456,490]]);
ed([[700,366],[700,440],[544,440],[544,490]]);
// 4.3 -> 4.4 / 4.5
ed([[470,592],[470,690],[300,690],[300,704]]);
ed([[530,592],[530,690],[700,690],[700,704]]);
// 4.4 / 4.5 -> shopper (return)
ed([[256,760],[150,760],[150,140],[416,140]]);
ed([[744,760],[1130,760],[1130,140],[584,140]]);
// shopper -> 4.5 (scan QR)
ed([[560,168],[820,168],[820,760],[756,760]]);
// store reads
ed([[756,310],[902,310]]);                 // 4.2 -> D2
ed([[556,540],[896,540]]);                 // 4.3 -> D7
// labels
body += label(380,222,'drag / look');
body += label(625,222,'search / pick');
body += label(372,455,'location');
body += label(632,455,'destination');
body += label(372,672,'waypoints');
body += label(630,672,'waypoints');
body += label(250,128,'panorama + arrows');
body += label(1000,128,'camera + steps');
body += label(820,200,'scan QR');
body += label(852,300,'read stall');
body += label(752,540,'graph');
// nodes
body += entity(500,120,150,56,['Shopper / Visitor']);
for (const k in P) body += proc(P[k].x, P[k].y, R, P[k].t);
body += store(980,310,150,'D2','Stalls');
body += store(980,540,168,'D7','Map / Pathway');
G.render('navl2', VB, body, 'DFD Level 2 — Process 4.0 Navigate & Find Stalls');
