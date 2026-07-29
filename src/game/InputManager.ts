export class InputManager{
  private _l=false;_r=false;_p=false;_a=false
  private ol:(()=>void)|null=null;or:(()=>void)|null=null;op:(()=>void)|null=null;oa:(()=>void)|null=null
  private c:HTMLCanvasElement|null=null;tx=0;th=30
  private kd=(e:KeyboardEvent)=>{if(e.key==='ArrowLeft'||e.key==='a'||e.key==='A'){this._l=true;this.ol?.()}if(e.key==='ArrowRight'||e.key==='d'||e.key==='D'){this._r=true;this.or?.()}if(e.key==='Escape'||e.key==='p'){this._p=true;this.op?.()}this._a=true;this.oa?.()}
  private ku=(e:KeyboardEvent)=>{if(e.key==='ArrowLeft'||e.key==='a'||e.key==='A')this._l=false;if(e.key==='ArrowRight'||e.key==='d'||e.key==='D')this._r=false;if(e.key==='Escape'||e.key==='p')this._p=false}
  private ts=(e:TouchEvent)=>{if(e.touches.length)this.tx=e.touches[0].clientX;this._a=true;this.oa?.()}
  private tm=(e:TouchEvent)=>{e.preventDefault();if(!e.touches.length)return;const d=e.touches[0].clientX-this.tx;if(d>this.th){this._r=true;this._l=false;this.or?.();this.tx=e.touches[0].clientX}else if(d<-this.th){this._l=true;this._r=false;this.ol?.();this.tx=e.touches[0].clientX}}
  private te=()=>{this._l=false;this._r=false}
  attach(c:HTMLCanvasElement){this.c=c;window.addEventListener('keydown',this.kd);window.addEventListener('keyup',this.ku);c.addEventListener('touchstart',this.ts,{passive:true});c.addEventListener('touchmove',this.tm,{passive:false});c.addEventListener('touchend',this.te)}
  detach(){window.removeEventListener('keydown',this.kd);window.removeEventListener('keyup',this.ku);if(this.c){this.c.removeEventListener('touchstart',this.ts);this.c.removeEventListener('touchmove',this.tm);this.c.removeEventListener('touchend',this.te)}}
  get leftPressed(){return this._l}get rightPressed(){return this._r}
  setOnLeft(c:()=>void){this.ol=c}setOnRight(c:()=>void){this.or=c}setOnPause(c:()=>void){this.op=c}setOnAnyKey(c:()=>void){this.oa=c}
}
