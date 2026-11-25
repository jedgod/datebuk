import {createHash} from 'node:crypto';
export const hash = x => createHash('sha256').update(JSON.stringify(x)).digest('hex');
export const canManage = i => i?.role === 'admin' && i.stepUp === true;
export const canRead = i => ['admin','staff'].includes(i?.role);
export function nextState(old, incoming){
 const rank={queued:0,dispatching:1,uncertain:1,accepted:2,scheduled:2,sending:3,sent:4,delivered:5,undelivered:5,failed:5,canceled:5};
 return Object.hasOwn(rank,incoming) && (rank[incoming]> (rank[old]??99)) ? incoming : old;
}
