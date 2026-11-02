export const BUILTIN_QUESTIONS = [
  {id:'chron-1',type:'chronology',prompt:'Order these events from earliest to latest.',items:['Printing press spreads in Europe','American Revolution','First Moon landing'],answer:['Printing press spreads in Europe','American Revolution','First Moon landing']},
  {id:'match-1',type:'matchmaker',prompt:'Match each idea to its definition.',pairs:[['Scarcity','Limited resources and unlimited wants'],['Inflation','A general rise in prices'],['Opportunity cost','The next-best alternative given up']]},
  {id:'class-1',type:'classification',prompt:'Sort each item.',categories:['Renewable','Nonrenewable'],items:[['Solar','Renewable'],['Coal','Nonrenewable'],['Wind','Renewable'],['Oil','Nonrenewable']]},
  {id:'logic-1',type:'systems',prompt:'Continue the sequence.',items:['2','4','8','?'],options:['10','12','16','18'],answer:'16'},
  {id:'mc-1',type:'multiple-choice',prompt:'Which branch interprets U.S. laws?',options:['Executive','Judicial','Legislative','Local'],answer:'Judicial'}
];

export function publicQuestion(q){ const {answer,pairs,items,...rest}=q; return {...rest,items:q.type==='chronology'?[...q.items].reverse():q.type==='classification'?q.items.map(x=>x[0]):items,pairs:q.type==='matchmaker'?q.pairs.map(([a])=>a):pairs,options:q.type==='matchmaker'?q.pairs.map(([,v])=>v).reverse():q.options}; }
export function validateAnswer(q,a){
  if(!q) return false;
  if(q.type==='chronology') return JSON.stringify(a)===JSON.stringify(q.answer);
  if(q.type==='matchmaker') return q.pairs.every(([k,v])=>a?.[k]===v);
  if(q.type==='classification') return q.items.every(([k,v])=>a?.[k]===v);
  return a===q.answer;
}



