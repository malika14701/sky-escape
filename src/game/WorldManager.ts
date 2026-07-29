import { type WorldConfig } from './types'
import { WORLDS } from './constants'
import { lerpColor } from './utils'
export class WorldManager{
  private wc:WorldConfig[]=WORLDS;currentIndex=0;private prev=0;transition=1
  update(d:number){const z=2000,r=Math.floor(d/z);this.prev=this.currentIndex;this.currentIndex=Math.min(r,this.wc.length-1);this.transition=Math.min(1,(d%z)/z)}
  get current(){return this.wc[this.currentIndex]}get previous(){return this.wc[this.prev]}
  private l(a:keyof WorldConfig){const p=this.previous[a],c=this.current[a];if(typeof p==='string'&&p.startsWith('#'))return lerpColor(p as string,c as string,this.transition);return this.currentIndex===0||this.currentIndex===this.prev?c:this.transition<0.5?p:c}
  get skyTop(){return this.l('skyTop')as string}
  get skyMid(){return this.l('skyMid')as string}
  get skyBottom(){return this.l('skyBottom')as string}
  get horizonColor(){return this.l('horizonColor')as string}
  get cloudColor(){return this.l('cloudColor')as string}
  get cloudColor2(){return this.l('cloudColor2')as string}
  get cloudColor3(){return this.l('cloudColor3')as string}
  get groundColor(){return this.l('groundColor')as string}
  get groundColor2(){return this.l('groundColor2')as string}
  get sunColor(){return this.l('sunColor')as string}
  get sunGlow(){return this.l('sunGlow')as string}
  get lightColor(){return this.l('lightColor')as string}
  get ambientColor(){return this.l('ambientColor')as string}
  get rimColor(){return this.l('rimColor')as string}
  get accentColor(){return this.l('accentColor')as string}
  get fogColor(){return this.current.fogColor}get fogColor2(){return this.current.fogColor2}
  getTimeOfDay(){const t=this.current.type;return(t==='nightCity'||t==='space'||t==='thunderStorm')?1:0}
}
