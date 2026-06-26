const G = require('./gen');
const { proc, link, store, edge, label } = G;
const VB = [980, 1060];
const X = 480, R = 58;
const N = { p1:{y:250,t:['4.3.1','Snap Endpoints','onto Aisles']}, p2:{y:440,t:['4.3.2','Build Aisle /','Corridor Graph']},
  p3:{y:630,t:['4.3.3','Run Dijkstra','Shortest Path']}, p4:{y:820,t:['4.3.4','Simplify to','Waypoints']} };
let body = '';
// chain edges (straight vertical)
const seg = [[120,192],[250-58+192-58,0]]; // unused
const chain = [
  [[X,140],[X,250-R]],        // from4.2 -> p1
  [[X,250+R],[X,440-R]],      // p1->p2
  [[X,440+R],[X,630-R]],      // p2->p3
  [[X,630+R],[X,820-R]],      // p3->p4
  [[X,820+R],[X,930]],        // p4 -> to4.4
];
// store D7 side feeds
const D7X = 175, D7Y = 545;
body += edge([{x:D7X+73,y:440},{x:X-R-30,y:440},{x:X-R,y:440}]);     // D7 -> p2 (grid)
body += edge([{x:D7X,y:D7Y-23},{x:D7X,y:250},{x:X-R,y:250}]);        // D7 -> p1 (columns)
for (const c of chain) body += edge(c.map(([x,y])=>({x,y})));
// labels
body += label(X+96,196,'start + destination');
body += label(X+86,345,'aisle entry points');
body += label(X+92,535,'nodes + edges');
body += label(X+96,725,'shortest path');
body += label(X+96,880,'waypoint list');
body += label(305,440,'aisle / corridor grid');
body += label(300,250,'columns · aisles');
// nodes
body += link(X,110,46,['from 4.2','Select Dest.']);
for (const k in N) body += proc(X, N[k].y, R, N[k].t);
body += link(X,962,52,['to 4.4 / 4.5','Guidance']);
body += store(D7X, D7Y, 150, 'D7', 'Map Data');
G.render('navl3', VB, body, 'DFD Level 3 — Process 4.3 Compute Walking Route');
