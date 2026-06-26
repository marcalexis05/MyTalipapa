const G = require('./gen');
const { proc, entity, store, link, edge, label } = G;
const VB = [1440, 820];
const R = 54;
const P = { p1:{x:420,y:330,t:['2.1','Submit /','Resubmit']}, p2:{x:680,y:330,t:['2.2','Review &','Validate']},
  p3:{x:940,y:330,t:['2.3','Record','Decision']}, p5:{x:1200,y:330,t:['2.5','Payment &','Occupy']}, p4:{x:250,y:560,t:['2.4','Handle','Appeal']} };
const SY = 730;
let body = '';
const ed = a => body += edge(a.map(([x,y])=>({x,y})));
// renter -> 2.1
ed([[244,310],[366,310]]);
// chain
ed([[474,330],[626,330]]);
ed([[734,330],[886,330]]);
ed([[994,322],[1146,322]]);
// 2.3 -> renter (outcome)
ed([[940,384],[940,432],[180,432],[180,338]]);
// renter -> 2.4 (appeal)
ed([[160,342],[160,560],[196,560]]);
// 2.4 -> 2.1 (resubmit)
ed([[250,506],[250,462],[420,462],[420,384]]);
// contractor / admin -> 2.2
ed([[610,178],[610,250],[662,250],[662,278]]);
ed([[770,178],[770,250],[698,250],[698,278]]);
// 2.3 -> 6.0 ; 2.5 -> 5.0
ed([[940,384],[940,466]]);
ed([[1200,384],[1200,466]]);
// stores
ed([[420,384],[420,690],[560,690],[560,707]]);    // 2.1 -> D3 save
ed([[665,384],[665,662],[330,662],[330,707]]);    // 2.2 -> D1 applicant
ed([[695,384],[695,682],[840,682],[840,707]]);    // 2.2 -> D2 check
ed([[925,384],[925,702],[575,702],[575,707]]);    // 2.3 -> D3 update
ed([[1185,384],[1185,672],[855,672],[855,707]]);  // 2.5 -> D2 occupy
// labels
body += label(305,294,'form');
body += label(550,314,'submitted');
body += label(810,314,'decision');
body += label(1070,306,'approved');
body += label(430,415,'outcome + reason');
body += label(230,470,'appeal');
body += label(335,447,'resubmit');
body += label(610,250,'review'); body += label(770,250,'review');
body += label(976,430,'notify'); body += label(1236,430,'payment');
body += label(486,640,'save'); body += label(470,648,'');
body += label(420,600,'applicant'); body += label(760,640,'check'); body += label(700,665,'update'); body += label(960,635,'occupy');
// nodes
body += entity(160,300,168,56,['Renter / Applicant']);
body += entity(610,150,150,56,['Contractor']);
body += entity(770,150,140,56,['Admin']);
for (const k in P) body += proc(P[k].x, P[k].y, R, P[k].t);
body += link(940,500,46,['6.0','Notify']);
body += link(1200,500,46,['5.0','Payments']);
body += store(330,SY,150,'D1','Accounts');
body += store(560,SY,160,'D3','Applications');
body += store(840,SY,140,'D2','Stalls');
G.render('l2', VB, body, 'DFD Level 2 — Process 2.0 Applications & Approval');
