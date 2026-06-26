const G = require('../gen');
const { terminator, action, diamond, edge, label } = G;
const VB = [940, 1440];
const X = 430;
let body = '';
const ed = a => body += edge(a.map(([x,y])=>({x,y})));
// nodes (cx,cy)
const start=[X,80], a1=[X,180], a2=[X,272], a3=[X,372], a4=[X,476], d1=[X,600],
      a5=[X,742], d2=[X,866], a6=[X,1000], d3=[X,1126], a7=[X,1252], end=[X,1356];
const pan=[170,742], qr=[720,866];
// spine
ed([[X,108],[X,156]]);          // start->a1
ed([[X,204],[X,248]]);          // a1->a2
ed([[X,296],[X,348]]);          // a2->a3
ed([[X,396],[X,452]]);          // a3->a4
ed([[X,500],[X,560]]);          // a4->d1
ed([[X,640],[X,716]]);          // d1 yes ->a5
ed([[X,766],[X,826]]);          // a5->d2
ed([[X,906],[X,972]]);          // d2 no ->a6
ed([[X,1030],[X,1086]]);        // a6->d3
ed([[X,1166],[X,1226]]);        // d3 yes ->a7
ed([[X,1278],[X,1328]]);        // a7->end
// d1 No -> pan (left) -> d3
ed([[X-78,600],[170,600],[170,716]]);            // d1 -> pan
ed([[170,768],[170,1126],[X-78,1126]]);          // pan -> d3 (left vertex)
// d2 Yes -> qr (right) -> a6
ed([[X+78,866],[720,866],[720,1000],[X+58,1000]]); // qr branch into a6 right
ed([[X+78,866],[720,866]]);                       // d2->qr (drawn above; keep)
// d3 No -> loop back to a6
ed([[X+78,1126],[560,1126],[560,1000],[X+58,1000]]);
// labels
body += label(X+24,580,'Yes'); body += label(X-104,580,'No');
body += label(X+24,846,'Yes'); body += label(X+24,948,'No');
body += label(X+24,1106,'Yes'); body += label(595,1106,'No — keep moving');
// nodes
body += terminator(start[0],start[1],150,48,'Start');
body += action(a1[0],a1[1],260,48,['Open 360° Tour']);
body += action(a2[0],a2[1],300,48,['Search / select destination']);
body += action(a3[0],a3[1],320,60,['Compute shortest route','(Dijkstra over aisle graph)']);
body += action(a4[0],a4[1],300,48,['Show route on panorama + map']);
body += diamond(d1[0],d1[1],190,84,['Open AR','view?']);
body += action(a5[0],a5[1],260,48,['Open AR Finder (camera)']);
body += diamond(d2[0],d2[1],180,84,['Scan QR','code?']);
body += action(a6[0],a6[1],280,58,['Track position','(steps + compass)']);
body += diamond(d3[0],d3[1],190,84,['Arrived at','stall?']);
body += action(a7[0],a7[1],300,58,['Show stall info','(products · hours · vendor)']);
body += terminator(end[0],end[1],150,48,'End');
body += action(pan[0],pan[1],190,58,['Follow panorama','arrows']);
body += action(qr[0],qr[1],240,58,['Scan QR · recognize','· set position']);
G.render('flow', VB, body, 'Process Flowchart — Shopper Wayfinding');
