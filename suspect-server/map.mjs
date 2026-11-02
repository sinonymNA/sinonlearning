const rooms=[
  ['Communications',60,50,360,230],['Bridge',520,50,360,180],['Observation Deck',980,50,360,230],
  ['Engine Room',60,335,360,230],['Central Hub',520,300,360,300],['Laboratory',980,335,360,230],
  ['Cargo Bay',60,620,360,230],['Reactor',520,660,360,190],['Medical Bay',980,620,360,230]
];
const corridors=[
  {x:390,y:85,w:160,h:160},{x:850,y:85,w:160,h:160},{x:390,y:370,w:160,h:160},{x:850,y:370,w:160,h:160},{x:390,y:680,w:160,h:160},{x:850,y:680,w:160,h:160},
  {x:160,y:250,w:160,h:115},{x:160,y:535,w:160,h:115},{x:620,y:200,w:160,h:130},{x:620,y:570,w:160,h:120},{x:1080,y:250,w:160,h:115},{x:1080,y:535,w:160,h:115}
];
const floors=[...rooms.map(([,x,y,w,h])=>({x,y,w,h})),...corridors];
export const WORLD={width:1400,height:900,spawn:{x:700,y:455},rooms,corridors,stations:[
  {id:'t1',x:700,y:130,type:'multiple-choice'},{id:'t2',x:240,y:150,type:'matchmaker'},{id:'t3',x:1160,y:150,type:'chronology'},{id:'t4',x:1160,y:445,type:'classification'},{id:'t5',x:1160,y:740,type:'systems'},
  {id:'emergency',x:700,y:450,type:'meeting'},{id:'lights',x:240,y:445,type:'repair'},{id:'comms',x:340,y:150,type:'repair'},{id:'reactorA',x:635,y:750,type:'repair'},{id:'reactorB',x:765,y:750,type:'repair'}
]};
const inside=(x,y,r=0)=>floors.some(q=>x-r>=q.x&&x+r<=q.x+q.w&&y-r>=q.y&&y+r<=q.y+q.h);
export function collides(x,y,r=20){
 if(x-r<20||y-r<20||x+r>WORLD.width-20||y+r>WORLD.height-20)return true;
 const pts=[[x-r,y],[x+r,y],[x,y-r],[x,y+r],[x-r*.7,y-r*.7],[x+r*.7,y-r*.7],[x-r*.7,y+r*.7],[x+r*.7,y+r*.7]];
 return pts.some(([px,py])=>!inside(px,py));
}
export function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
export function lineBlocked(a,b){const steps=Math.ceil(distance(a,b)/12);for(let i=1;i<steps;i++){const t=i/steps;if(collides(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t,5))return true}return false}
export function nextStep(a,b){
 const cell=35,key=(x,y)=>`${x},${y}`,toCell=p=>({x:Math.round(p.x/cell),y:Math.round(p.y/cell)}),start=toCell(a),goal=toCell(b),open=[start],came=new Map(),seen=new Set([key(start.x,start.y)]),dirs=[[1,0],[-1,0],[0,1],[0,-1]];
 while(open.length){
  open.sort((p,q)=>(Math.abs(p.x-goal.x)+Math.abs(p.y-goal.y))-(Math.abs(q.x-goal.x)+Math.abs(q.y-goal.y)));
  const cur=open.shift();
  if(Math.abs(cur.x-goal.x)+Math.abs(cur.y-goal.y)<=1){let step=cur,k=key(cur.x,cur.y),parent=came.get(k);while(parent&&key(parent.x,parent.y)!==key(start.x,start.y)){step=parent;k=key(parent.x,parent.y);parent=came.get(k)}return {x:step.x*cell,y:step.y*cell}}
  for(const [dx,dy] of dirs){const n={x:cur.x+dx,y:cur.y+dy},nk=key(n.x,n.y);if(seen.has(nk)||collides(n.x*cell,n.y*cell,8))continue;seen.add(nk);came.set(nk,cur);open.push(n)}
 }
 return b;
}
