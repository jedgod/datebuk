export type DateBukUser={id:string;email:string;role:'USER'|'ADMIN'|'MODERATOR'};
export type MatchRecommendation={id:string;name:string;age:number;city:string;score:number;interests:string[]};
export type ChatMessage={id:string;senderId:string;receiverId:string;body:string;createdAt:string;read:boolean};
