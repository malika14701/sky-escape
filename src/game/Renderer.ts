import { type PlayerState, type ObstacleData, type PowerUpData, type ParticleData, type BgElement, type CameraState } from './types'
import { type WorldManager } from './WorldManager'
import { hexToRgba, clamp } from './utils'
import { LANE_POSITIONS } from './constants'

export class Renderer {
  private stars:{x:number;y:number;size:number;speed:number;brightness:number;twinkle:number;twinkleSpeed:number}[]=[]
  private clouds:{x:number;y:number;w:number;h:number;speed:number;alpha:number;layer:number}[]=[]
  private bgBuildings:{x:number;w:number;h:number;color:string;lit:boolean;windows:{wx:number;wy:number}[]}[]=[]
  private groundSegments:{x:number;w:number;color:string;detail:number}[]=[]
  private bgElements:BgElement[]=[]
  private initDone=false
  private totalDist=0
  private frameCount=0
  private init(cw:number,ch:number){
    if(this.initDone)return;this.initDone=true
    for(let i=0;i<80;i++)this.stars.push({x:Math.random()*cw,y:Math.random()*ch*0.6,size:Math.random()*2.5+0.5,speed:15+Math.random()*45,brightness:0.3+Math.random()*0.7,twinkle:Math.random()*Math.PI*2,twinkleSpeed:0.5+Math.random()*3})
    for(let i=0;i<24;i++){const layer=i<8?0:i<16?1:2;this.clouds.push({x:Math.random()*cw*1.5-cw*0.25,y:Math.random()*ch*(0.55-layer*0.12),w:80+Math.random()*250,h:25+Math.random()*60,speed:10+Math.random()*20+layer*12,alpha:0.08+Math.random()*0.15+(1-layer)*0.08,layer})}
    for(let i=0;i<35;i++){const w=cw/35+Math.random()*15;this.bgBuildings.push({x:i*w-10,w,h:35+Math.random()*150,color:['#1a1a2e','#16213e','#0f3460','#1a2744'][Math.floor(Math.random()*4)],lit:Math.random()>0.6,windows:[]});for(let j=0;j<Math.floor(this.bgBuildings[i].h/18);j++){if(Math.random()>0.3)this.bgBuildings[i].windows.push({wx:3+Math.random()*(w-10),wy:5+j*18+Math.random()*8})}}
    for(let i=0;i<50;i++)this.groundSegments.push({x:i*(cw/50),w:cw/50+3+Math.random()*8,color:['#3a5a2a','#4a6a3a','#2a4a1a','#5a7a4a'][Math.floor(Math.random()*4)],detail:Math.random()*20})
    // Background elements
    this.spawnBgElements(cw,ch)
  }

  private spawnBgElements(cw:number,ch:number){
    this.bgElements=[]
    for(let i=0;i<5;i++)this.bgElements.push({x:Math.random()*cw*1.5-cw*0.25,y:ch*(0.55+Math.random()*0.1),w:40+Math.random()*80,h:20+Math.random()*40,speed:8+Math.random()*15,type:'mountain',active:true,color:['#2a4530','#1a3520','#3a5540','#4a6540'][Math.floor(Math.random()*4)]})
    for(let i=0;i<4;i++)this.bgElements.push({x:Math.random()*cw*1.5-cw*0.25,y:ch*(0.4+Math.random()*0.08),w:30+Math.random()*60,h:20+Math.random()*30,speed:12+Math.random()*20,type:'island',active:true,color:['#3a5530','#4a6540','#2a4525'][Math.floor(Math.random()*3)],bobOffset:Math.random()*Math.PI*2})
    for(let i=0;i<6;i++)this.bgElements.push({x:Math.random()*cw*1.5-cw*0.25,y:ch*(0.15+Math.random()*0.25),w:14+Math.random()*10,h:10+Math.random()*6,speed:20+Math.random()*30,type:'bird',active:true,wingPhase:Math.random()*Math.PI*2,bobOffset:Math.random()*Math.PI*2})
    for(let i=0;i<2;i++)this.bgElements.push({x:Math.random()*cw*1.5-cw*0.25,y:ch*(0.2+Math.random()*0.1),w:25+Math.random()*15,h:35+Math.random()*15,speed:5+Math.random()*8,type:'balloon',active:true,color:['#e74c3c','#3498db','#f1c40f','#9b59b6','#2ecc71'][Math.floor(Math.random()*5)],bobOffset:Math.random()*Math.PI*2})
    for(let i=0;i<1;i++)this.bgElements.push({x:Math.random()*cw*1.5-cw*0.25,y:ch*(0.15+Math.random()*0.05),w:60+Math.random()*30,h:25+Math.random()*15,speed:3+Math.random()*5,type:'airship',active:true,color:'#8e44ad',bobOffset:Math.random()*Math.PI*2})
  }

  render(ctx:CanvasRenderingContext2D,wm:WorldManager,player:PlayerState,obstacles:ObstacleData[],powerups:PowerUpData[],particles:ParticleData[],distance:number,_difficulty:number,speed:number,_comboCount:number,cw:number,ch:number,_timePlayed:number,_status:any,camera?:CameraState){
    if(!this.initDone)this.init(cw,ch)
    this.totalDist=distance;this.frameCount++

    // === CAMERA ===
    const cz=camera?.zoom||1;const cox=camera?.offsetX||0;const coy=camera?.offsetY||0;const croll=camera?.roll||0
    ctx.save()
    const pivX=cw/2,pivY=ch/2;ctx.translate(pivX,pivY);ctx.scale(cz,cz);ctx.rotate(croll);ctx.translate(-pivX+cox,-pivY+coy)

    // === SKY (HDRI multi-layer) ===
    const sg=ctx.createLinearGradient(0,0,0,ch)
    sg.addColorStop(0,wm.skyTop);sg.addColorStop(0.3,wm.skyMid);sg.addColorStop(0.6,wm.skyBottom);sg.addColorStop(0.85,wm.horizonColor);sg.addColorStop(1,wm.groundColor)
    ctx.fillStyle=sg;ctx.fillRect(0,0,cw,ch)

    // Fog overlay
    const fg=ctx.createLinearGradient(0,ch*0.5,0,ch);fg.addColorStop(0,'rgba(0,0,0,0)');fg.addColorStop(1,wm.fogColor2)
    ctx.fillStyle=fg;ctx.fillRect(0,ch*0.5,cw,ch*0.5)

    // === STARS (night) ===
    if(wm.getTimeOfDay()>0.3){this.stars.forEach(s=>{
      s.y+=s.speed*0.016;if(s.y>ch*0.6){s.y=0;s.x=Math.random()*cw}
      s.twinkle+=s.twinkleSpeed*0.016;const twinkleFactor=Math.sin(s.twinkle)*0.5+0.5
      ctx.fillStyle=`rgba(255,255,255,${s.brightness*(0.5+twinkleFactor*0.5)*wm.getTimeOfDay()})`;ctx.fillRect(s.x,s.y,s.size,s.size)
      if(s.size>1.5){ctx.fillStyle=`rgba(200,220,255,${s.brightness*0.3*twinkleFactor*wm.getTimeOfDay()})`;ctx.beginPath();ctx.arc(s.x,s.y,s.size*1.5,0,Math.PI*2);ctx.fill()}
    })}

    // === SUN with GOD RAYS ===
    const sunX=cw*0.85,sunY=ch*0.08
    // God rays
    const gr=ctx.createRadialGradient(sunX,sunY,0,sunX,sunY,ch*0.8)
    gr.addColorStop(0,hexToRgba(wm.sunGlow,0.08))
    gr.addColorStop(0.3,hexToRgba(wm.sunGlow,0.04))
    gr.addColorStop(0.6,'rgba(255,200,100,0.015)')
    gr.addColorStop(1,'rgba(255,200,100,0)')
    ctx.fillStyle=gr;ctx.beginPath();ctx.arc(sunX,sunY,ch*0.8,0,Math.PI*2);ctx.fill()
    // Sun corona
    for(let i=0;i<8;i++){const a=i/8*Math.PI*2+this.totalDist*0.001;ctx.fillStyle=hexToRgba(wm.sunGlow,0.03+Math.sin(this.totalDist*0.005+i)*0.02);ctx.beginPath();ctx.arc(sunX+Math.cos(a)*60,sunY+Math.sin(a)*60,40+Math.sin(this.totalDist*0.003+i*2)*15,0,Math.PI*2);ctx.fill()}
    // Sun body
    ctx.beginPath();ctx.arc(sunX,sunY,42,0,Math.PI*2);ctx.fillStyle=hexToRgba(wm.sunGlow,0.3);ctx.fill()
    ctx.beginPath();ctx.arc(sunX,sunY,28,0,Math.PI*2);ctx.fillStyle=hexToRgba(wm.sunColor,0.8);ctx.fill()
    ctx.beginPath();ctx.arc(sunX,sunY,18,0,Math.PI*2);ctx.fillStyle=wm.sunColor;ctx.fill()
    // Lens flare
    this.drawLensFlare(ctx,sunX,sunY,cw,ch,wm)

    // === CLOUDS (3 layers volumetric) ===
    this.clouds.forEach(c=>{
      c.x-=c.speed*0.016;if(c.x+c.w<-50){c.x=cw+Math.random()*100;c.y=Math.random()*ch*(0.5-c.layer*0.1)}
      const col=c.layer===0?wm.cloudColor:c.layer===1?wm.cloudColor2:wm.cloudColor3
      const alpha=c.alpha*(1-wm.getTimeOfDay()*0.6)
      ctx.fillStyle=hexToRgba(col,alpha);ctx.beginPath()
      ctx.ellipse(c.x,c.y,c.w/2,c.h/2,0,0,Math.PI*2);ctx.fill()
      ctx.fillStyle=hexToRgba(c.layer===0?wm.cloudColor2:wm.cloudColor3,alpha*0.6);ctx.beginPath()
      ctx.ellipse(c.x-c.w*0.25,c.y-c.h*0.1,c.w*0.35,c.h*0.4,0,0,Math.PI*2);ctx.fill()
      ctx.fillStyle=hexToRgba(wm.cloudColor,alpha*0.3);ctx.beginPath()
      ctx.ellipse(c.x+c.w*0.2,c.y-c.h*0.05,c.w*0.25,c.h*0.3,0,0,Math.PI*2);ctx.fill()
    })

    // === BACKGROUND ELEMENTS (mountain/island) ===
    this.bgElements.forEach(el=>{
      if(el.type!=='mountain'&&el.type!=='island')return
      el.x-=el.speed*0.016;if(el.x+el.w*2<0){el.x=cw+Math.random()*100;el.y=ch*(0.45+Math.random()*0.12);el.w=40+Math.random()*100;el.h=20+Math.random()*50}
      ctx.fillStyle=el.color||wm.groundColor2
      if(el.type==='mountain'){
        ctx.beginPath();ctx.moveTo(el.x,ch*0.87);ctx.lineTo(el.x+el.w/2,ch*0.87-el.h);ctx.lineTo(el.x+el.w,ch*0.87);ctx.closePath();ctx.fill()
        ctx.fillStyle=hexToRgba('#ffffff',0.06);ctx.beginPath();ctx.moveTo(el.x+el.w*0.3,ch*0.87-el.h*0.5);ctx.lineTo(el.x+el.w/2,ch*0.87-el.h);ctx.lineTo(el.x+el.w*0.7,ch*0.87-el.h*0.5);ctx.closePath();ctx.fill()
      }else{
        const bob=el.bobOffset?Math.sin(this.totalDist*0.01+el.bobOffset)*3:0
        ctx.beginPath();ctx.ellipse(el.x+el.w/2,el.y+bob+el.h/2,el.w/2,el.h/4,0,0,Math.PI*2);ctx.fill()
        ctx.fillStyle='#5a7a3a';ctx.beginPath();ctx.moveTo(el.x+el.w/2-5,el.y+bob+el.h/2);ctx.lineTo(el.x+el.w/2+5,el.y+bob+el.h/2);ctx.lineTo(el.x+el.w/2,el.y+bob+el.h/2+15);ctx.closePath();ctx.fill()
      }
    })

    // === BUILDINGS (city) ===
    if(wm.current.type==='nightCity'||wm.current.type==='thunderStorm')this.bgBuildings.forEach(b=>{
      b.x-=50*0.016;if(b.x+b.w<0){b.x=cw+Math.random()*20;b.h=35+Math.random()*150;b.lit=Math.random()>0.4}
      ctx.fillStyle=b.color;ctx.fillRect(b.x,ch*0.85-b.h,b.w,b.h)
      b.windows.forEach(w=>{if(b.lit){ctx.fillStyle=`rgba(255,221,85,${0.3+Math.random()*0.3})`;ctx.fillRect(b.x+w.wx,w.wy,4,4)}})
    })

    // === GROUND ===
    this.groundSegments.forEach(s=>{
      s.x-=speed*0.016*0.5;if(s.x+s.w<0){s.x=cw+Math.random()*10;s.color=randColor(['#3a5a2a','#4a6a3a','#2a4a1a','#5a7a4a']);s.detail=Math.random()*20}
      ctx.fillStyle=s.color;ctx.fillRect(s.x,ch*0.87,s.w,ch*0.2)
      // Ground detail (grass tufts)
      if(s.detail>15){ctx.fillStyle='rgba(80,140,60,0.3)';ctx.beginPath();ctx.moveTo(s.x+5,ch*0.87);ctx.lineTo(s.x+8,ch*0.87-5);ctx.lineTo(s.x+11,ch*0.87);ctx.fill()}
    })

    // === LANE MARKERS ===
    ctx.strokeStyle='rgba(255,255,255,0.06)';ctx.lineWidth=2;ctx.setLineDash([12,18])
    for(let i=0;i<3;i+=2){const lx=cw*LANE_POSITIONS[i];ctx.beginPath();ctx.moveTo(lx,ch*0.1);ctx.lineTo(lx,ch*0.85);ctx.stroke()}
    ctx.setLineDash([])

    // === BIRDS, BALLOONS, AIRSHIPS ===
    this.bgElements.forEach(el=>{
      if(el.type!=='bird'&&el.type!=='balloon'&&el.type!=='airship')return
      el.x-=el.speed*0.016;if(el.x+el.w*2<0){el.x=cw+Math.random()*200;if(el.type==='bird')el.y=ch*(0.12+Math.random()*0.2);else el.y=ch*(0.12+Math.random()*0.15)}
      const bob=el.bobOffset?Math.sin(this.totalDist*0.008+el.bobOffset)*4:0
      const yy=el.y+bob
      if(el.type==='bird'){
        const wp=el.wingPhase||0;const wingA=Math.sin(this.totalDist*0.05+wp)*0.5+0.5
        ctx.fillStyle='#2a2a2a';ctx.beginPath();ctx.arc(el.x,yy,el.w/4,0,Math.PI*2);ctx.fill()
        ctx.fillStyle='rgba(40,40,40,0.7)';ctx.beginPath();ctx.ellipse(el.x-el.w/3,yy-wingA*4,el.w/3,2+wingA*3,-0.3,0,Math.PI*2);ctx.fill()
        ctx.beginPath();ctx.ellipse(el.x+el.w/3,yy-wingA*4,el.w/3,2+wingA*3,0.3,0,Math.PI*2);ctx.fill()
      }else if(el.type==='balloon'){
        ctx.fillStyle=el.color||'#e74c3c';ctx.beginPath();ctx.ellipse(el.x+el.w/2,yy,el.w/2,el.h/2,0,0,Math.PI*2);ctx.fill()
        ctx.fillStyle=hexToRgba('#ffffff',0.15);ctx.beginPath();ctx.ellipse(el.x+el.w/2-el.w/6,yy-el.h/6,el.w/6,el.h/4,0,0,Math.PI*2);ctx.fill()
        // Basket
        ctx.fillStyle='#8B4513';ctx.fillRect(el.x+el.w/2-5,yy+el.h/2,10,8)
        ctx.strokeStyle='rgba(100,50,20,0.5)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(el.x+el.w/2-3,yy+el.h/2-2);ctx.lineTo(el.x+el.w/2-2,yy-el.h/2+2);ctx.moveTo(el.x+el.w/2+3,yy+el.h/2-2);ctx.lineTo(el.x+el.w/2+2,yy-el.h/2+2);ctx.stroke()
      }else if(el.type==='airship'){
        ctx.fillStyle=el.color||'#8e44ad';ctx.beginPath();ctx.ellipse(el.x+el.w/2,yy,el.w/2,el.h/2,0,0,Math.PI*2);ctx.fill()
        ctx.fillStyle='rgba(255,255,255,0.12)';ctx.beginPath();ctx.ellipse(el.x+el.w/2-el.w/8,yy-el.h/8,el.w/4,el.h/3,0,0,Math.PI*2);ctx.fill()
        ctx.fillStyle='#666';ctx.fillRect(el.x+el.w/2-3,el.y+el.h/2-3,6,12)
        ctx.fillStyle='#888';ctx.fillRect(el.x+el.w/2-4,el.y+el.h/2+8,8,5)
      }
    })

    // === LIGHTNING (thunderstorm) ===
    if(wm.current.type==='thunderStorm'&&Math.sin(this.totalDist*0.003)*Math.sin(this.totalDist*0.007+1)>0.995){
      const lx=Math.random()*cw;ctx.strokeStyle='rgba(255,255,255,0.8)';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(lx,0)
      for(let i=0;i<8;i++)ctx.lineTo(lx+(Math.random()-0.5)*60,ch/7+(ch/8)*(i+1));ctx.stroke()
      ctx.strokeStyle='rgba(200,220,255,0.4)';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(lx,0)
      for(let i=0;i<6;i++)ctx.lineTo(lx+(Math.random()-0.5)*40,ch/7+(ch/6)*(i+1));ctx.stroke()
    }

    // === OBSTACLES ===
    obstacles.forEach(o=>{
      if(!o.active)return
      if(o.warningTimer<o.warningDuration){
        const wf=Math.sin(o.warningTimer*20)*0.5+0.5
        ctx.strokeStyle=`rgba(255,50,50,${wf*0.8})`;ctx.lineWidth=3;ctx.shadowColor='rgba(255,0,0,0.5)';ctx.shadowBlur=15;ctx.strokeRect(o.x-o.w/2-4,o.y-o.h/2-4,o.w+8,o.h+8)
        ctx.shadowBlur=0
        if(o.warningTimer%0.3<0.15){ctx.fillStyle=`rgba(255,200,50,${wf*0.5})`;ctx.font='bold 16px monospace';ctx.textAlign='center';ctx.fillText('⚠',o.x,o.y-10)}
        return
      }
      ctx.save();ctx.translate(o.x,o.y)
      const r=Math.sin(this.totalDist*0.05+o.x)*0.05;ctx.rotate(r)
      // Glow for obstacles
      ctx.shadowColor=hexToRgba(o.color,0.4);ctx.shadowBlur=12
      switch(o.type){
        case 'bomb':ctx.fillStyle='#e74c3c';ctx.beginPath();ctx.arc(0,0,o.w/2,0,Math.PI*2);ctx.fill();ctx.fillStyle='#2c3e50';ctx.beginPath();ctx.arc(0,0,o.w/4,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ff0';ctx.fillRect(-1,-1,2,2);ctx.shadowBlur=20;ctx.fillStyle='rgba(255,0,0,0.15)';ctx.beginPath();ctx.arc(0,0,o.w/2+8,0,Math.PI*2);ctx.fill();break
        case 'missile':ctx.fillStyle='#e67e22';ctx.fillRect(-o.w/4,-o.h/2,o.w/2,o.h);ctx.fillStyle='#c0392b';ctx.beginPath();ctx.moveTo(0,o.h/2);ctx.lineTo(-o.w/4,o.h/4);ctx.lineTo(o.w/4,o.h/4);ctx.closePath();ctx.fill();ctx.fillStyle='rgba(255,100,0,0.2)';ctx.beginPath();ctx.arc(0,o.h/4,o.w/2+6,0,Math.PI*2);ctx.fill();break
        case 'laser':const lg=ctx.createLinearGradient(0,-o.h/2,0,o.h/2);lg.addColorStop(0,'rgba(241,196,15,0)');lg.addColorStop(0.2,'rgba(241,196,15,0.7)');lg.addColorStop(0.5,'#fff');lg.addColorStop(0.8,'rgba(241,196,15,0.7)');lg.addColorStop(1,'rgba(241,196,15,0)');ctx.shadowBlur=20;ctx.fillStyle=lg;ctx.fillRect(-o.w/2,-o.h/2,o.w,o.h);break
        case 'lightning':ctx.strokeStyle='#9b59b6';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,-o.h/2);for(let i=0;i<5;i++)ctx.lineTo((Math.random()-0.5)*15,-o.h/2+(o.h/5)*(i+1));ctx.stroke();ctx.fillStyle='rgba(155,89,182,0.2)';ctx.beginPath();ctx.arc(0,0,o.w/2,0,Math.PI*2);ctx.fill();break
        case 'turbulence':ctx.strokeStyle='#3498db';ctx.lineWidth=2;ctx.setLineDash([6,6]);ctx.beginPath();for(let i=0;i<360;i+=12){const a=i*Math.PI/180,rad=o.w/2+Math.sin(i*0.5+this.totalDist*0.03)*10;ctx.lineTo(Math.cos(a)*rad,Math.sin(a)*rad)}ctx.closePath();ctx.stroke();ctx.setLineDash([]);break
        case 'mine':ctx.fillStyle='#2c3e50';ctx.beginPath();ctx.arc(0,0,o.w/2,0,Math.PI*2);ctx.fill();ctx.fillStyle='#e74c3c';ctx.fillRect(-o.w/6,-2,o.w/3,4);ctx.fillRect(-2,-o.w/6,4,o.w/3);ctx.fillStyle='rgba(231,76,60,0.15)';ctx.beginPath();ctx.arc(0,0,o.w/2+5,0,Math.PI*2);ctx.fill();break
        case 'drone':ctx.fillStyle='#e91e63';ctx.fillRect(-o.w/2,-o.h/2,o.w,o.h*0.6);ctx.fillRect(-o.w/4,o.h*0.1,o.w/2,o.h*0.4);ctx.fillStyle='#ff0';ctx.beginPath();ctx.arc(-o.w/4,o.h*0.3,3,0,Math.PI*2);ctx.arc(o.w/4,o.h*0.3,3,0,Math.PI*2);ctx.fill();ctx.shadowBlur=15;ctx.fillStyle='rgba(233,30,99,0.15)';ctx.beginPath();ctx.arc(0,0,o.w/2+5,0,Math.PI*2);ctx.fill();break
      }
      ctx.shadowBlur=0;ctx.restore()
    })

    // === POWER-UPS with glow ===
    powerups.forEach(p=>{
      if(!p.active||p.collected)return
      ctx.save();ctx.translate(p.x,p.y)
      const bob=Math.sin(this.totalDist*0.1+p.x)*3;ctx.translate(0,bob)
      ctx.shadowColor='rgba(46,204,113,0.6)';ctx.shadowBlur=20
      ctx.fillStyle='#2ecc71';ctx.beginPath();ctx.arc(0,0,p.w/2,0,Math.PI*2);ctx.fill()
      ctx.shadowBlur=30;ctx.fillStyle='rgba(46,204,113,0.3)';ctx.beginPath();ctx.arc(0,0,p.w/2+6,0,Math.PI*2);ctx.fill()
      ctx.shadowBlur=0;ctx.fillStyle='#fff';ctx.font='bold 14px monospace';ctx.textAlign='center';ctx.textBaseline='middle'
      const icons:{[k:string]:string}={shield:'S',extraLife:'♥',slowMotion:'T',magnet:'M',doublePoints:'×2',speedBoost:'⚡'}
      ctx.fillText(icons[p.type]||'?',0,0);ctx.restore()
    })

    // === PARTICLES ===
    particles.forEach(p=>{
      if(!p.active)return;const a=clamp(p.life/p.maxLife,0,1)
      ctx.globalAlpha=a
      if(p.type==='leaf'){ctx.fillStyle=p.color;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.vx*0.1);ctx.fillRect(-p.size/2,-p.size/4,p.size,p.size/2);ctx.restore()}
      else if(p.type==='dust'){ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.size*a,0,Math.PI*2);ctx.fill()}
      else if(p.type==='smoke'){ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.size*(1.5-a*0.5),0,Math.PI*2);ctx.fill()}
      else if(p.type==='trail'){ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.size*a,0,Math.PI*2);ctx.fill()}
      else{ctx.fillStyle=p.color;ctx.fillRect(p.x-p.size/2,p.y-p.size/2,p.size*a*2,p.size*a*2)}
      ctx.globalAlpha=1
    })

    // === PLAYER with dynamic lighting ===
    ctx.save();ctx.translate(player.x,player.y)
    const roll=player.rollAngle+croll*2
    ctx.rotate(roll)
    if(player.hitFlash>0&&Math.floor(player.hitFlash*10)%2){}else if(player.invulnerable&&Math.floor(player.invulnerableTimer*8)%2){ctx.globalAlpha=0.4}
    const pw=50,ph=60
    // Player shadow
    ctx.fillStyle='rgba(0,0,0,0.15)';ctx.beginPath();ctx.ellipse(0,ph/2+5,pw*0.5,8,0,0,Math.PI*2);ctx.fill()
    // Rim light
    ctx.fillStyle=hexToRgba(wm.rimColor,0.12);ctx.beginPath();ctx.moveTo(0,-ph/2-3);ctx.lineTo(-pw/2-2,ph/4-2);ctx.lineTo(-pw/3-2,ph/2-2);ctx.lineTo(pw/3+2,ph/2-2);ctx.lineTo(pw/2+2,ph/4-2);ctx.closePath();ctx.fill()
    // Fuselage with shading
    const pg=ctx.createLinearGradient(-pw/2,0,pw/2,0);pg.addColorStop(0,hexToRgba(wm.lightColor,0.7));pg.addColorStop(0.5,wm.lightColor);pg.addColorStop(1,hexToRgba(wm.lightColor,0.8))
    ctx.fillStyle=pg;ctx.beginPath();ctx.moveTo(0,-ph/2);ctx.lineTo(-pw/2,ph/4);ctx.lineTo(-pw/3,ph/2);ctx.lineTo(pw/3,ph/2);ctx.lineTo(pw/2,ph/4);ctx.closePath();ctx.fill()
    // Ambient tint
    ctx.fillStyle=hexToRgba(wm.ambientColor,0.15);ctx.beginPath();ctx.moveTo(0,-ph/2);ctx.lineTo(-pw/4,0);ctx.lineTo(0,ph/6);ctx.lineTo(pw/4,0);ctx.closePath();ctx.fill()
    ctx.fillStyle='#e74c3c';ctx.beginPath();ctx.moveTo(0,-ph/2);ctx.lineTo(-pw/4,0);ctx.lineTo(0,ph/6);ctx.lineTo(pw/4,0);ctx.closePath();ctx.fill()
    // Cockpit with gloss
    ctx.fillStyle='#85c1e9';ctx.beginPath();ctx.arc(0,-ph/6,pw/6,0,Math.PI);ctx.fill()
    ctx.fillStyle='rgba(255,255,255,0.2)';ctx.beginPath();ctx.ellipse(-pw/12,-ph/6-2,pw/12,ph/12,0,0,Math.PI*2);ctx.fill()
    // Wings
    ctx.fillStyle='#34495e';ctx.beginPath();ctx.moveTo(-pw/3,ph*0.1);ctx.lineTo(-pw*0.7,ph*0.3);ctx.lineTo(-pw/3,ph*0.25);ctx.closePath();ctx.fill()
    ctx.beginPath();ctx.moveTo(pw/3,ph*0.1);ctx.lineTo(pw*0.7,ph*0.3);ctx.lineTo(pw/3,ph*0.25);ctx.closePath();ctx.fill()
    // Speed effect (trails)
    if(player.speedEffect>0.5||player.speedBoost){
      ctx.strokeStyle=hexToRgba(wm.accentColor,0.2*player.speedEffect);ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-pw/2,ph/4);ctx.lineTo(-pw/2-20-player.speedEffect*30,ph/4+Math.sin(this.totalDist*0.1)*5);ctx.stroke()
      ctx.beginPath();ctx.moveTo(pw/2,ph/4);ctx.lineTo(pw/2+20+player.speedEffect*30,ph/4+Math.sin(this.totalDist*0.1+1)*5);ctx.stroke()
    }
    // Engine flame
    const flicker=Math.random()*player.engineFlicker+4
    ctx.shadowColor='rgba(255,107,53,0.5)';ctx.shadowBlur=15
    ctx.fillStyle='#ff6b35';ctx.beginPath();ctx.moveTo(-pw/6,ph/2);ctx.lineTo(0,ph/2+flicker+12);ctx.lineTo(pw/6,ph/2);ctx.closePath();ctx.fill()
    ctx.shadowColor='rgba(241,196,15,0.4)';ctx.shadowBlur=10
    ctx.fillStyle='#f1c40f';ctx.beginPath();ctx.moveTo(-pw/8,ph/2);ctx.lineTo(0,ph/2+flicker+4);ctx.lineTo(pw/8,ph/2);ctx.closePath();ctx.fill()
    ctx.shadowBlur=0
    // Shield
    if(player.shield){
      ctx.strokeStyle='rgba(46,204,113,0.5)';ctx.lineWidth=3;ctx.shadowColor='rgba(46,204,113,0.4)';ctx.shadowBlur=20;ctx.beginPath();ctx.arc(0,0,pw*0.7,0,Math.PI*2);ctx.stroke();ctx.shadowBlur=0
      ctx.strokeStyle='rgba(46,204,113,0.15)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(0,0,pw*0.9,0,Math.PI*2);ctx.stroke()
      ctx.fillStyle='rgba(46,204,113,0.05)';ctx.beginPath();ctx.arc(0,0,pw*0.7,0,Math.PI*2);ctx.fill()
    }
    ctx.globalAlpha=1;ctx.restore()

    // === BLOOM POST-EFFECT ===
    this.applyBloom(ctx,cw,ch,wm)

    // === VIGNETTE ===
    const vg=ctx.createRadialGradient(cw/2,ch/2,ch*0.25,cw/2,ch/2,ch*0.85)
    vg.addColorStop(0,'rgba(0,0,0,0)')
    vg.addColorStop(0.6,'rgba(0,0,0,0)')
    vg.addColorStop(0.85,'rgba(0,0,0,0.1)')
    vg.addColorStop(1,`rgba(0,0,0,${0.35+wm.getTimeOfDay()*0.25})`)
    ctx.fillStyle=vg;ctx.fillRect(0,0,cw,ch)

    // === COLOR ADJUSTMENTS (tone mapping) ===
    ctx.fillStyle=hexToRgba(wm.ambientColor,0.04);ctx.fillRect(0,0,cw,ch)

    ctx.restore()
  }

  private drawLensFlare(ctx:CanvasRenderingContext2D,sx:number,sy:number,cw:number,ch:number,wm:WorldManager){
    const cx=cw/2,cy=ch/2,dx=sx-cx,dy=sy-cy
    for(let i=0;i<5;i++){const t=0.15+i*0.18;const fx=cx+dx*t,fy=cy+dy*t;const fs=12-i*2;const fa=0.04-i*0.007;ctx.fillStyle=hexToRgba(wm.sunColor,Math.max(0,fa));ctx.beginPath();ctx.arc(fx,fy,Math.max(1,fs),0,Math.PI*2);ctx.fill()}
  }

  private applyBloom(ctx:CanvasRenderingContext2D,cw:number,ch:number,wm:WorldManager){
    if(wm.getTimeOfDay()>0.5)return
    const intensity=0.15
    ctx.fillStyle=`rgba(255,220,180,${intensity})`
    ctx.fillRect(0,0,cw,ch*0.12)
    ctx.fillRect(0,ch*0.65,cw,ch*0.05)
  }
}
function randColor(a:string[]):string{return a[Math.floor(Math.random()*a.length)]}
