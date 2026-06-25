const fs = require('fs');
const path = require('path');
const name = process.argv[2];
const def = fs.readFileSync(name + '.mmd', 'utf8');
const cwd = process.cwd().split(path.sep).join('/');
const mjs = 'file:///' + cwd + '/node_modules/mermaid/dist/mermaid.min.js';
const html = `<!doctype html><html><head><meta charset="utf-8"><script src="${mjs}"></script>
<style>*{margin:0}body{background:#fff;padding:18px;font-family:'Segoe UI',Roboto,sans-serif}</style></head>
<body><div id="o"></div><script>
const def=${JSON.stringify(def)};
mermaid.initialize({startOnLoad:false,theme:'base',securityLevel:'loose',
  flowchart:{htmlLabels:true,useMaxWidth:false,curve:'basis',nodeSpacing:70,rankSpacing:85,padding:14},
  er:{useMaxWidth:false,entityPadding:14},
  themeVariables:{fontFamily:"Segoe UI, Roboto, sans-serif",fontSize:'15px',lineColor:'#5b6b7f',
    primaryColor:'#e7f0fe',primaryBorderColor:'#2563eb',primaryTextColor:'#16357a'}});
function toDeMarcoStores(){
  // Convert amber 'data store' rectangles into DeMarco parallel lines (open data store).
  var target=[251,246,233]; // #fbf6e9
  document.querySelectorAll('#o svg rect').forEach(function(r){
    var f=getComputedStyle(r).fill, m=f&&f.match(/\\d+/g);
    if(!m) return;
    if(Math.abs(m[0]-target[0])>10||Math.abs(m[1]-target[1])>10||Math.abs(m[2]-target[2])>10) return;
    var b=r.getBBox(), ns='http://www.w3.org/2000/svg';
    function line(x1,y1,x2,y2){var l=document.createElementNS(ns,'line');
      l.setAttribute('x1',x1);l.setAttribute('y1',y1);l.setAttribute('x2',x2);l.setAttribute('y2',y2);
      l.setAttribute('stroke','#b08423');l.setAttribute('stroke-width','2.4');return l;}
    var p=r.parentNode;
    p.insertBefore(line(b.x,b.y,b.x+b.width,b.y),r);                       // top
    p.insertBefore(line(b.x,b.y+b.height,b.x+b.width,b.y+b.height),r);     // bottom
    p.insertBefore(line(b.x+24,b.y,b.x+24,b.y+b.height),r);                // left ID divider
    r.remove();
  });
}
mermaid.render('g',def).then(function(res){
  document.getElementById('o').innerHTML=res.svg;
  try{toDeMarcoStores();}catch(e){}
  document.title='DONE';
}).catch(function(e){document.getElementById('o').textContent='ERR '+e.message;document.title='ERR';});
</script></body></html>`;
fs.writeFileSync(name + '.html', html);
console.log('built ' + name + '.html');
