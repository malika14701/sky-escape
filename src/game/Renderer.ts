import { type PlayerState, type ObstacleData, type PowerUpData, type ParticleData } from './types'
import { type WorldManager } from './WorldManager'
import { hexToRgba } from './utils'
import { LANE_POSITIONS } from './constants'

export class Renderer {
  private stars:{x:number;y:number;size:number;speed:number;brightness:number}[]=[]
  private clouds:{x:number;y:number;w:number;h:number;speed:number;alpha:number}[]=[]
  private bgBuildings:{x:number;w:number;h:number;color:string;lit:boolean}[]=[]
  private groundSegments:{x:number;w:number;color:string}[]=[]
  private initDone=false
  private totalDist=0

  private init(cw:number,ch:number){
    if(this.initDone)return;this.initDone=true
    for(let i=0;i<60;i++)this.stars.push({x:Math.random()*cw,y:Math.random()*ch*0.6,size:Math.random()*2+0.5,speed:20+Math.random()*40,brightness:0.3+Math.random()*0.7})
    for(let i=0;i<12;i++)this.clouds.push({x:Math.random()*cw,y:Math.random()*ch*0.55,w:80+Math.random()*200,h:30+Math.random()*60,speed:15+Math.random()*30,alpha:0.15+Math.random()*0.25})
    for(let i=0;i<30;i++)this.bgBuildings.push({x:i*(cw/30),w:cw/30+20,h:40+Math.random()*120,color:['#1a1a2e','#16213e','#0f3460'][Math.floor(Math.random()*3)],lit:Math.random()>0.5})
    for(let i=0;i<40;i++)this.groundSegments.push({x:i*(cw/40),w:cw/40+5,color:['#3a5a2a','#4a6a3a','#2a4a1a'][Math.floor(Math.random()*3)]})
  }

  render(ctx:CanvasRenderingContext2D,wm:WorldManager,player:PlayerState,obstacles:ObstacleData[],powerups:PowerUpData[],particles:ParticleData[],distance:number,_difficulty:number,_speed:number,_comboCount:number,cw:number,ch:number,_timePlayed:number,_status:any){
    if(!this.initDone)this.init(cw,ch)
    this.totalDist=distance
    const g=ctx.createLinearGradient(0,0,0,ch);g.addColorStop(0,wm.skyTop);g.addColorStop(0.7,wm.skyBottom);g.addColorStop(1,wm.groundColor)
    ctx.fillStyle=g;ctx.fillRect(0,0,cw,ch)
    ctx.fillStyle=wm.fogColor;ctx.fillRect(0,0,cw,ch*0.6)
    ctx.beginPath();ctx.arc(cw*0.85,ch*0.08,45,0,Math.PI*2);ctx.fillStyle=hexToRgba(wm.sunColor,0.9);ctx.fill()
    ctx.beginPath();ctx.arc(cw*0.85,ch*0.08,55,0,Math.PI*2);ctx.fillStyle=hexToRgba(wm.sunColor,0.13);ctx.fill()
    if(wm.getTimeOfDay()>0)this.stars.forEach(s=>{
      s.y+=s.speed*0.016;if(s.y>ch*0.6){s.y=0;s.x=Math.random()*cw}
      ctx.fillStyle=`rgba(255,255,255,${s.brightness*wm.getTimeOfDay()})`;ctx.fillRect(s.x,s.y,s.size,s.size)
    })
    this.clouds.forEach(c=>{
      c.x-=c.speed*0.016;if(c.x+c.w<0){c.x=cw+Math.random()*200;c.y=Math.random()*ch*0.5}
      ctx.fillStyle=hexToRgba(wm.cloudColor,c.alpha);ctx.beginPath()
      ctx.ellipse(c.x,c.y,c.w/2,c.h/2,0,0,Math.PI*2);ctx.fill()
      ctx.fillStyle=hexToRgba(wm.cloudColor2,c.alpha*0.7);ctx.beginPath()
      ctx.ellipse(c.x-c.w*0.2,c.y-c.h*0.1,c.w/3,c.h/3,0,0,Math.PI*2);ctx.fill()
    })
    if(wm.current.type==='nightCity')this.bgBuildings.forEach(b=>{
      b.x-=50*0.016;if(b.x+cw/30+20<0){b.x=cw+10;b.h=40+Math.random()*120;b.lit=Math.random()>0.5}
      ctx.fillStyle=b.color;ctx.fillRect(b.x,ch*0.62-b.h,b.w,b.h)
      if(b.lit){ctx.fillStyle='#ffdd55';const wy=ch*0.62-b.h+5+Math.random()*(b.h-15);ctx.fillRect(b.x+3,wy,4,4);ctx.fillRect(b.x+b.w-7,wy,4,4)}
    })
    this.groundSegments.forEach(s=>{
      s.x-=50*0.016;if(s.x+s.w<0){s.x=cw+5}
      ctx.fillStyle=s.color;ctx.fillRect(s.x,ch*0.87,s.w,ch*0.2)
    })
    ctx.strokeStyle='rgba(255,255,255,0.08)';ctx.lineWidth=2;ctx.setLineDash([10,15])
    for(let i=0;i<3;i+=2){const lx=cw*LANE_POSITIONS[i];ctx.beginPath();ctx.moveTo(lx,ch*0.1);ctx.lineTo(lx,ch*0.85);ctx.stroke()}
    ctx.setLineDash([])
    obstacles.forEach(o=>{
      if(!o.active)return
      if(o.warningTimer<o.warningDuration){
        const wf=Math.sin(o.warningTimer*20)*0.5+0.5
        ctx.strokeStyle=`rgba(255,50,50,${wf*0.7})`;ctx.lineWidth=3;ctx.strokeRect(o.x-o.w/2-4,o.y-o.h/2-4,o.w+8,o.h+8)
        if(o.warningTimer%0.3<0.15){ctx.fillStyle=`rgba(255,200,50,${wf*0.4})`;ctx.font='bold 14px monospace';ctx.textAlign='center';ctx.fillText('⚠',o.x,o.y)}
        return
      }
      ctx.save();ctx.translate(o.x,o.y)
      const r=Math.sin(this.totalDist*0.05+o.x)*0.05;ctx.rotate(r)
      switch(o.type){
        case 'bomb':ctx.fillStyle='#e74c3c';ctx.beginPath();ctx.arc(0,0,o.w/2,0,Math.PI*2);ctx.fill();ctx.fillStyle='#2c3e50';ctx.beginPath();ctx.arc(0,0,o.w/4,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ff0';ctx.fillRect(-1,-1,2,2);break
        case 'missile':ctx.fillStyle='#e67e22';ctx.fillRect(-o.w/4,-o.h/2,o.w/2,o.h);ctx.fillStyle='#c0392b';ctx.beginPath();ctx.moveTo(0,o.h/2);ctx.lineTo(-o.w/4,o.h/4);ctx.lineTo(o.w/4,o.h/4);ctx.closePath();ctx.fill();break
        case 'laser':const lg=ctx.createLinearGradient(0,-o.h/2,0,o.h/2);lg.addColorStop(0,'rgba(241,196,15,0)');lg.addColorStop(0.3,'rgba(241,196,15,0.9)');lg.addColorStop(0.5,'#fff');lg.addColorStop(0.7,'rgba(241,196,15,0.9)');lg.addColorStop(1,'rgba(241,196,15,0)');ctx.fillStyle=lg;ctx.fillRect(-o.w/2,-o.h/2,o.w,o.h);break
        case 'lightning':ctx.strokeStyle='#9b59b6';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,-o.h/2);for(let i=0;i<5;i++)ctx.lineTo((Math.random()-0.5)*15,-o.h/2+(o.h/5)*(i+1));ctx.stroke();ctx.fillStyle='rgba(155,89,182,0.3)';ctx.beginPath();ctx.arc(0,0,o.w/2,0,Math.PI*2);ctx.fill();break
        case 'turbulence':ctx.strokeStyle='#3498db';ctx.lineWidth=3;ctx.setLineDash([5,5]);ctx.beginPath();for(let i=0;i<360;i+=10){const a=i*Math.PI/180,rad=o.w/2+Math.sin(i*0.5)*8;ctx.lineTo(Math.cos(a)*rad,Math.sin(a)*rad)}ctx.closePath();ctx.stroke();ctx.setLineDash([]);break
        case 'mine':ctx.fillStyle='#2c3e50';ctx.beginPath();ctx.arc(0,0,o.w/2,0,Math.PI*2);ctx.fill();ctx.fillStyle='#e74c3c';ctx.fillRect(-o.w/6,-2,o.w/3,4);ctx.fillRect(-2,-o.w/6,4,o.w/3);break
        case 'drone':ctx.fillStyle='#e91e63';ctx.fillRect(-o.w/2,-o.h/2,o.w,o.h*0.6);ctx.fillRect(-o.w/4,o.h*0.1,o.w/2,o.h*0.4);ctx.fillStyle='#ff0';ctx.beginPath();ctx.arc(-o.w/4,o.h*0.3,3,0,Math.PI*2);ctx.arc(o.w/4,o.h*0.3,3,0,Math.PI*2);ctx.fill();break
      }
      ctx.restore()
    })
    powerups.forEach(p=>{
      if(!p.active||p.collected)return
      ctx.save();ctx.translate(p.x,p.y)
      const bob=Math.sin(this.totalDist*0.1+p.x)*3;ctx.translate(0,bob)
      ctx.fillStyle='#2ecc71';ctx.beginPath();ctx.arc(0,0,p.w/2,0,Math.PI*2);ctx.fill()
      ctx.fillStyle='#fff';ctx.font='bold 14px monospace';ctx.textAlign='center';ctx.textBaseline='middle'
      const icons:{[k:string]:string}={shield:'S',extraLife:'♥',slowMotion:'T',magnet:'M',doublePoints:'×2',speedBoost:'⚡'}
      ctx.fillText(icons[p.type]||'?',0,0);ctx.restore()
    })
    particles.forEach(p=>{
      if(!p.active)return;const a=p.life/p.maxLife
      ctx.globalAlpha=a;ctx.fillStyle=p.color;ctx.fillRect(p.x-p.size/2,p.y-p.size/2,p.size*a,p.size*a);ctx.globalAlpha=1
    })
    ctx.save();ctx.translate(player.x,player.y)
    const roll=player.rollAngle;ctx.rotate(roll)
    if(player.hitFlash>0&&Math.floor(player.hitFlash*10)%2){}else if(player.invulnerable&&Math.floor(player.invulnerableTimer*10)%2){ctx.globalAlpha=0.5}
    const pw=50,ph=60
    ctx.fillStyle=wm.lightColor;ctx.beginPath();ctx.moveTo(0,-ph/2);ctx.lineTo(-pw/2,ph/4);ctx.lineTo(-pw/3,ph/2);ctx.lineTo(pw/3,ph/2);ctx.lineTo(pw/2,ph/4);ctx.closePath();ctx.fill()
    ctx.fillStyle='#e74c3c';ctx.beginPath();ctx.moveTo(0,-ph/2);ctx.lineTo(-pw/4,0);ctx.lineTo(0,ph/6);ctx.lineTo(pw/4,0);ctx.closePath();ctx.fill()
    ctx.fillStyle='#85c1e9';ctx.beginPath();ctx.arc(0,-ph/6,pw/6,0,Math.PI);ctx.fill()
    ctx.fillStyle='#34495e';ctx.beginPath();ctx.moveTo(-pw/3,ph*0.1);ctx.lineTo(-pw*0.7,ph*0.3);ctx.lineTo(-pw/3,ph*0.25);ctx.closePath();ctx.fill()
    ctx.beginPath();ctx.moveTo(pw/3,ph*0.1);ctx.lineTo(pw*0.7,ph*0.3);ctx.lineTo(pw/3,ph*0.25);ctx.closePath();ctx.fill()
    const flicker=Math.random()*player.engineFlicker+4
    ctx.fillStyle='#ff6b35';ctx.beginPath();ctx.moveTo(-pw/6,ph/2);ctx.lineTo(0,ph/2+flicker+8);ctx.lineTo(pw/6,ph/2);ctx.closePath();ctx.fill()
    ctx.fillStyle='#f1c40f';ctx.beginPath();ctx.moveTo(-pw/8,ph/2);ctx.lineTo(0,ph/2+flicker);ctx.lineTo(pw/8,ph/2);ctx.closePath();ctx.fill()
    if(player.shield){ctx.strokeStyle='rgba(46,204,113,0.6)';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,pw*0.7,0,Math.PI*2);ctx.stroke();ctx.strokeStyle='rgba(46,204,113,0.2)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(0,0,pw*0.9,0,Math.PI*2);ctx.stroke()}
    ctx.globalAlpha=1;ctx.restore()
    const vg=ctx.createRadialGradient(cw/2,ch/2,ch*0.3,cw/2,ch/2,ch*0.8);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,0.35)')
    ctx.fillStyle=vg;ctx.fillRect(0,0,cw,ch)
  }
}
