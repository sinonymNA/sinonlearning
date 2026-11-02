export const BUILTIN_QUESTIONS = [
  {id:'chron-1',type:'chronology',prompt:'Order these events from earliest to latest.',items:['Printing press spreads in Europe','American Revolution','First Moon landing'],answer:['Printing press spreads in Europe','American Revolution','First Moon landing']},
  {id:'match-1',type:'matchmaker',prompt:'Match each idea to its definition.',pairs:[['Scarcity','Limited resources and unlimited wants'],['Inflation','A general rise in prices'],['Opportunity cost','The next-best alternative given up']]},
  {id:'class-1',type:'classification',prompt:'Sort each item.',categories:['Renewable','Nonrenewable'],items:[['Solar','Renewable'],['Coal','Nonrenewable'],['Wind','Renewable'],['Oil','Nonrenewable']]},
  {id:'logic-1',type:'systems',prompt:'Continue the sequence.',items:['2','4','8','?'],options:['10','12','16','18'],answer:'16'},
  {id:'mc-1',type:'multiple-choice',prompt:'Which branch interprets U.S. laws?',options:['Executive','Judicial','Legislative','Local'],answer:'Judicial'},
  {id:'mc-2',type:'multiple-choice',prompt:'What is the chemical symbol for gold?',options:['Ag','Au','Gd','Go'],answer:'Au'},
  {id:'mc-3',type:'multiple-choice',prompt:'Which process converts sunlight into chemical energy?',options:['Respiration','Photosynthesis','Fermentation','Transpiration'],answer:'Photosynthesis'},
  {id:'logic-2',type:'systems',prompt:'Decode the navigation sequence: 3, 6, 12, 24, ?',items:['3','6','12','24','?'],options:['30','36','42','48'],answer:'48'},
  {id:'logic-3',type:'systems',prompt:'Restore the signal: A, C, F, J, ?',items:['A','C','F','J','?'],options:['M','N','O','P'],answer:'O'},
  {id:'chron-2',type:'chronology',prompt:'Order these U.S. events from earliest to latest.',items:['Declaration of Independence','Constitution ratified','Louisiana Purchase'],answer:['Declaration of Independence','Constitution ratified','Louisiana Purchase']},
  {id:'match-2',type:'matchmaker',prompt:'Match each science term to its meaning.',pairs:[['Atom','Smallest unit of an element'],['Velocity','Speed in a direction'],['Ecosystem','Organisms interacting with their environment']]},
  {id:'class-2',type:'classification',prompt:'Classify each form of government.',categories:['Democratic','Authoritarian'],items:[['Constitutional republic','Democratic'],['Absolute dictatorship','Authoritarian'],['Direct democracy','Democratic'],['Totalitarian state','Authoritarian']]}
];

export const CLASSIC_TASKS = [
  {id:'ship-1',type:'multiple-choice',prompt:'Calibrate the star tracker to the brightest signal.',options:['12 kHz','48 kHz','96 kHz','144 kHz'],answer:'96 kHz'},
  {id:'ship-2',type:'systems',prompt:'Complete the reactor pulse pattern.',items:['1','2','4','8','?'],options:['10','12','16','18'],answer:'16'},
  {id:'ship-3',type:'chronology',prompt:'Route power through the relays in order.',items:['Prime core','Stabilizer','Output grid'],answer:['Prime core','Stabilizer','Output grid']},
  {id:'ship-4',type:'matchmaker',prompt:'Reconnect each subsystem to its control bus.',pairs:[['Navigation','Vector bus'],['Life support','Atmosphere bus'],['Engines','Thrust bus']]},
  {id:'ship-5',type:'classification',prompt:'Sort cargo by containment protocol.',categories:['Cryogenic','Standard'],items:[['Bio sample','Cryogenic'],['Tool crate','Standard'],['Coolant cell','Cryogenic'],['Rations','Standard']]}
];

export function publicQuestion(q){ const {answer,pairs,items,...rest}=q; return {...rest,items:q.type==='chronology'?[...q.items].reverse():q.type==='classification'?q.items.map(x=>x[0]):items,pairs:q.type==='matchmaker'?q.pairs.map(([a])=>a):pairs,options:q.type==='matchmaker'?q.pairs.map(([,v])=>v).reverse():q.options}; }
export function validateAnswer(q,a){
  if(!q) return false;
  if(q.type==='chronology') return JSON.stringify(a)===JSON.stringify(q.answer);
  if(q.type==='matchmaker') return q.pairs.every(([k,v])=>a?.[k]===v);
  if(q.type==='classification') return q.items.every(([k,v])=>a?.[k]===v);
  return a===q.answer;
}



