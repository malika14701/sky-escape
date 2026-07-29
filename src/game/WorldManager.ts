import{type WorldConfig,WorldType}from'./types';import{WORLDS}from'./constants';import{lerpColor}from'./utils'
export class WorldManager{
  private wc:WorldConfig[]=WORLDS;currentIndex=0;private prev=0;transition=1
  update(d:number){const z=2000,r=Math.floor(d/z);this.prev=this.currentIndex;this.currentIndex=Math.min(r,this.wc.length-1);this.transition=Math.min(1,(d%z)/z)}
  get current(){return this.wc[this.currentIndex]}get previous(){return this.wc[this.prev]}
  get skyTop(){return this.currentIndex===this.prev||this.currentIndex===0?this.current.skyTop:lerpColor(this.previous.skyTop,this.current.skyTop,this.transition)}
  get skyBottom(){return this.currentIndex===this.prev||this.currentIndex===0?this.current.skyBottom:lerpColor(this.previous.skyBottom,this.current.skyBottom,this.transition)}
  get cloudColor(){return this.currentIndex===this.prev||this.currentIndex===0?this.current.cloudColor:lerpColor(this.previous.cloudColor,this.current.cloudColor,this.transition)}
  get cloudColor2(){return this.currentIndex===this.prev||this.currentIndex===0?this.current.cloudColor2:lerpColor(this.previous.cloudColor2,this.current.cloudColor2,this.transition)}
  get groundColor(){return this.currentIndex===this.prev||this.currentIndex===0?this.current.groundColor:lerpColor(this.previous.groundColor,this.current.groundColor,this.transition)}
  get fogColor(){return this.current.fogColor}get sunColor(){return this.current.sunColor}get lightColor(){return this.current.lightColor}
  getTimeOfDay(){const t=this.current.type;return(t===WorldType.NightCity||t===WorldType.Space||t===WorldType.ThunderStorm)?1:0}
}
