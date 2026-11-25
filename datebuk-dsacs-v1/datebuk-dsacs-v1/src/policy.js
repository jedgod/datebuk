export const plans=['free','plus','premium','elite'];
export const limits={
 'match.likes':[20,100,300,-1], 'match.advanced':[0,1,1,1], 'match.concierge':[0,0,0,1], 'chat.send':[100,500,-1,-1], 'video.start':[3,10,30,-1], 'video.extend':[0,3,10,-1], 'video.icebreaker':[3,20,100,300], 'video.followup':[1,10,30,-1], 'ai.reflection':[0,5,30,100], 'profile.boost':[0,1,3,10], 'match.insights':[0,0,1,1]};
export const safety=['safety.report','safety.block','safety.exit','safety.appeal','privacy.settings','account.cancel','account.delete'];
export function limit(plan,feature){if(safety.includes(feature))return -1;return limits[feature]?.[plans.indexOf(plan)]??0}
export function effective(row,now=new Date()){return row&&['active','trialing'].includes(row.status)&&new Date(row.period_end)>now&&plans.includes(row.plan)?row.plan:'free'}
export const roles={admin:['policy.read','billing.read','billing.reconcile'],support:['billing.read'],moderator:[],customer:[]};
