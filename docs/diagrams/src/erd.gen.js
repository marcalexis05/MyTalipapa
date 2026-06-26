const G = require('./gen');
const { erEntity, rel, label } = G;
const VB = [1360, 1360];
let body = '';
const ents = {};
function E(key, x, y, title, rows) { const e = erEntity(x, y, title, rows); ents[key] = e.box; body += e.svg; }

// relationships first (under boxes)
const R = [
  { p:[[520,254],[520,720],[590,720],[590,770]], l:'submits', at:[560,720] },     // ACCOUNT -> APPLICATION
  { p:[[480,120],[198,120],[198,380]], l:'receives', at:[300,108] },               // ACCOUNT -> NOTIFICATION
  { p:[[756,120],[1148,120],[1148,420]], l:'holds', at:[950,108] },                // ACCOUNT -> CONTRACT
  { p:[[660,254],[660,360],[678,360],[678,410]], l:'manages / occupies', at:[760,360] }, // ACCOUNT -> STALL
  { p:[[700,614],[700,770]], l:'is target of', at:[770,690] },                     // STALL -> APPLICATION
  { p:[[816,500],[1010,500]], l:'covered by', at:[913,500] },                      // STALL -> CONTRACT
  { p:[[608,974],[608,1120]], l:'settled by', at:[678,1047] },                     // APPLICATION -> PAYMENT
];
for (const r of R) body += rel(r.p.map(([x,y])=>({x,y})));
for (const r of R) body += label(r.at[0], r.at[1], r.l);

// entities on top
E('account', 480, 50, 'ACCOUNT', [
  {type:'string',name:'id',key:'PK'},{type:'string',name:'firstName'},{type:'string',name:'lastName'},
  {type:'string',name:'email'},{type:'string',name:'role'},{type:'string',name:'status'}]);
E('notif', 60, 380, 'NOTIFICATION', [
  {type:'string',name:'id',key:'PK'},{type:'string',name:'recipientId',key:'FK'},{type:'string',name:'type'},
  {type:'string',name:'message'},{type:'bool',name:'isRead'}]);
E('stall', 540, 410, 'STALL', [
  {type:'string',name:'id',key:'PK'},{type:'string',name:'number'},{type:'string',name:'zone'},
  {type:'string',name:'category'},{type:'string',name:'status'},{type:'string',name:'tenantId',key:'FK'}]);
E('contract', 1010, 420, 'CONTRACT', [
  {type:'string',name:'id',key:'PK'},{type:'string',name:'tenantId',key:'FK'},{type:'string',name:'stallId',key:'FK'},
  {type:'date',name:'leaseStart'},{type:'date',name:'leaseEnd'},{type:'date',name:'deadline'}]);
E('app', 470, 770, 'APPLICATION', [
  {type:'string',name:'id',key:'PK'},{type:'string',name:'applicantId',key:'FK'},{type:'string',name:'stallId',key:'FK'},
  {type:'string',name:'status'},{type:'string',name:'rejectReason'},{type:'int',name:'appealCount'}]);
E('pay', 470, 1120, 'PAYMENT', [
  {type:'string',name:'id',key:'PK'},{type:'string',name:'applicationId',key:'FK'},{type:'decimal',name:'amount'},
  {type:'string',name:'status'},{type:'date',name:'paidAt'}]);

G.render('erd', VB, body, 'MyTalipapa — Entity-Relationship Diagram');
