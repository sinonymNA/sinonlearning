export const WORLD={width:2200,height:1450,spawn:{x:1100,y:720},walls:[
  {x:0,y:0,w:2200,h:40},{x:0,y:1410,w:2200,h:40},{x:0,y:0,w:40,h:1450},{x:2160,y:0,w:40,h:1450},
  {x:420,y:40,w:24,h:390},{x:420,y:560,w:24,h:330},{x:420,y:1020,w:24,h:390},
  {x:820,y:40,w:24,h:310},{x:820,y:480,w:24,h:310},{x:820,y:920,w:24,h:490},
  {x:1360,y:40,w:24,h:310},{x:1360,y:480,w:24,h:310},{x:1360,y:920,w:24,h:490},
  {x:1760,y:40,w:24,h:390},{x:1760,y:560,w:24,h:330},{x:1760,y:1020,w:24,h:390}
],rooms:[
  ['Bridge',60,60,340,350],['Communications',460,60,340,290],['Observation Deck',860,60,480,290],['Laboratory',1400,60,340,350],['Medical Bay',1800,60,340,350],
  ['Cargo Bay',60,1040,340,340],['Engine Room',460,940,340,440],['Central Hub',860,400,480,600],['Reactor',1400,940,340,440]
],stations:[
  {id:'t1',x:230,y:210,type:'multiple-choice'},{id:'t2',x:620,y:190,type:'matchmaker'},{id:'t3',x:1090,y:190,type:'chronology'},{id:'t4',x:1570,y:210,type:'classification'},{id:'t5',x:1980,y:210,type:'systems'},
  {id:'emergency',x:1100,y:700,type:'meeting'},{id:'lights',x:620,y:1160,type:'repair'},{id:'comms',x:620,y:250,type:'repair'},{id:'reactorA',x:1500,y:1130,type:'repair'},{id:'reactorB',x:1650,y:1240,type:'repair'}
]};
export function collides(x,y,r=22){return x-r<40||y-r<40||x+r>2160||y+r>1410||WORLD.walls.some(w=>x+r>w.x&&x-r<w.x+w.w&&y+r>w.y&&y-r<w.y+w.h)}
export function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
export function lineBlocked(a,b){const steps=Math.ceil(distance(a,b)/15);for(let i=1;i<steps;i++){const t=i/steps;if(collides(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t,5))return true}return false}



