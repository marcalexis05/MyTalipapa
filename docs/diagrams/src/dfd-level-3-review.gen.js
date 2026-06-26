const G = require('./gen');
const { proc, link, store, entity, edge, label } = G;
const VB = [1500, 640];
const Y = 380, R = 58;
const P = { p1:{x:340,t:['2.2.1','Check','Applicant']}, p2:{x:610,t:['2.2.2','Verify Stall','Availability']},
  p3:{x:880,t:['2.2.3','Present to','Reviewer']}, p4:{x:1150,t:['2.2.4','Capture','Decision']} };
let body = '';
// horizontal chain
const chain = [
  [[200,Y],[340-R,Y]],
  [[340+R,Y],[610-R,Y]],
  [[610+R,Y],[880-R,Y]],
  [[880+R,Y],[1150-R,Y]],
  [[1150+R,Y],[1300,Y]],
];
for (const c of chain) body += edge(c.map(([x,y])=>({x,y})));
// entities -> 2.2.3
body += edge([{x:800,y:178},{x:800,y:300},{x:854,y:300},{x:854,y:Y-R+6}]);   // contractor
body += edge([{x:1000,y:178},{x:1000,y:300},{x:906,y:300},{x:906,y:Y-R+6}]); // admin
// store reads
body += edge([{x:316,y:Y+R},{x:316,y:540}]);                 // p1 -> D1
body += edge([{x:364,y:Y+R},{x:364,y:500},{x:560,y:500},{x:560,y:540}]); // p1 -> D3
body += edge([{x:610,y:Y+R},{x:610,y:500},{x:840,y:500},{x:840,y:540}]); // p2 -> D2
// labels
body += label(250,Y-16,'application');
body += label(475,Y-16,'applicant OK');
body += label(745,Y-16,'+ stall status');
body += label(1015,Y-16,'raw decision');
body += label(1262,Y-16,'decision + reason');
body += label(800,250,'decision'); body += label(1000,250,'decision');
body += label(316,475,'applicant'); body += label(470,475,'application'); body += label(720,475,'stall status');
// nodes
body += link(120,Y,52,['from 2.1','Submit']);
for (const k in P) body += proc(P[k].x, Y, R, P[k].t);
body += link(1380,Y,52,['to 2.3','Decision']);
body += entity(800,150,150,56,['Contractor']);
body += entity(1000,150,140,56,['Admin']);
body += store(280,563,150,'D1','Accounts');
body += store(490,563,160,'D3','Applications');
body += store(840,563,140,'D2','Stalls');
G.render('l3', VB, body, 'DFD Level 3 — Process 2.2 Review & Validate');
