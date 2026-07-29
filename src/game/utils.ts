export function lerp(a:number,b:number,t:number):number{return a+(b-a)*t}
export function rand(min:number,max:number):number{return min+Math.random()*(max-min)}
export function randInt(min:number,max:number):number{return Math.floor(rand(min,max+1))}
export function randItem<T>(a:T[]):T{return a[Math.floor(Math.random()*a.length)]}
export function aabbOverlap(ax:number,ay:number,aw:number,ah:number,bx:number,by:number,bw:number,bh:number):boolean{
  return ax-aw/2<bx+bw/2 && ax+aw/2>bx-bw/2 && ay-ah/2<by+bh/2 && ay+ah/2>by-bh/2}
export function hexToRgba(h:string,a:number):string{
  return `rgba(${parseInt(h.slice(1,3),16)},${parseInt(h.slice(3,5),16)},${parseInt(h.slice(5,7),16)},${a})`}
export function clamp(v:number,min:number,max:number):number{return Math.max(min,Math.min(max,v))}
export function lerpColor(a:string,b:string,t:number):string{
  const ar=parseInt(a.slice(1,3),16),ag=parseInt(a.slice(3,5),16),ab=parseInt(a.slice(5,7),16)
  const br=parseInt(b.slice(1,3),16),bg=parseInt(b.slice(3,5),16),bb=parseInt(b.slice(5,7),16)
  const rr=Math.round(lerp(ar,br,t)),gg=Math.round(lerp(ag,bg,t)),bbv=Math.round(lerp(ab,bb,t))
  return `#${rr.toString(16).padStart(2,'0')}${gg.toString(16).padStart(2,'0')}${bbv.toString(16).padStart(2,'0')}`}
