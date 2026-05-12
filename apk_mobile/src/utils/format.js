export const fmtNum = (n,d=0) => (typeof n==='number'&&Number.isFinite(n)) ? n.toFixed(d) : '—';
export const fmtKwh = (n) => { if(typeof n!=='number'||!Number.isFinite(n))return'—'; return `${fmtNum(n,1)} kWh`; };
export const fmtWh  = (n) => { if(typeof n!=='number'||!Number.isFinite(n))return'—'; if(n>=1000)return`${fmtNum(n/1000,1)} kWh`; return`${fmtNum(n,0)} Wh`; };
export const fmtPct = (part,total) => { if(typeof part!=='number'||typeof total!=='number'||total<=0)return'0%'; return`${Math.round((part/total)*100)}%`; };
export const fmtPctNum = (part,total) => { if(typeof part!=='number'||typeof total!=='number'||total<=0)return 0; return Math.round((part/total)*100); };
export const fmtDate = (s) => { if(!s)return'—'; try{return new Date(s).toLocaleDateString('fr-FR');}catch{return'—';} };
export const fmtDateTime = (s) => { if(!s)return'—'; try{return new Date(s).toLocaleString('fr-FR');}catch{return'—';} };
