import { type GameData, type PlayerState, type ObstacleData, type PowerUpData, type ParticleData, GameStatus, Lane, PowerUpType } from './types'
import { InputManager } from './InputManager'
import { AudioManager } from './AudioManager'
import { StorageManager } from './StorageManager'
import { WorldManager } from './WorldManager'
import { SpawnSystem } from './SpawnSystem'
import { Renderer } from './Renderer'
import { LANE_POSITIONS, PLAYER_Y_FRACTION, PLAYER_WIDTH, PLAYER_HEIGHT, BASE_GAME_SPEED, MAX_GAME_SPEED, SPEED_INCREMENT, INITIAL_LIVES, MAX_LIVES, INVULNERABILITY_DURATION, POWERUP_DURATION, SCORE_PER_METER } from './constants'
import { aabbOverlap } from './utils'

export class Game {
  private canvas!: HTMLCanvasElement;private ctx!: CanvasRenderingContext2D
  private input: InputManager;private audio: AudioManager;private storage: StorageManager
  private world: WorldManager;private spawn: SpawnSystem;private renderer: Renderer
  private animFrameId=0;private lastTime=0
  private onStateChange:((d:GameData)=>void)|null=null;private onGameOver:((s:number)=>void)|null=null

  data: GameData
  private player: PlayerState
  private obstacles: ObstacleData[]=[]
  private powerups: PowerUpData[]=[]
  private particles: ParticleData[]=[]

  constructor(){
    this.input=new InputManager();this.audio=new AudioManager();this.storage=new StorageManager()
    this.world=new WorldManager();this.spawn=new SpawnSystem();this.renderer=new Renderer()
    this.data={status:GameStatus.Menu,score:0,highScore:this.storage.getHighScore(),distance:0,speed:BASE_GAME_SPEED,baseSpeed:BASE_GAME_SPEED,lives:INITIAL_LIVES,maxLives:MAX_LIVES,difficulty:0,worldIndex:0,worldTransition:1,shakeIntensity:0,shakeTimer:0,comboCount:0,dodgesCount:0,timePlayed:0,multiplier:1}
    this.player={lane:Lane.Center,targetLane:Lane.Center,x:0,y:0,lives:INITIAL_LIVES,shield:false,invulnerable:false,invulnerableTimer:0,shieldTimer:0,slowMotion:false,slowMotionTimer:0,magnet:false,magnetTimer:0,doublePoints:false,doublePointsTimer:0,speedBoost:false,speedBoostTimer:0,rollAngle:0,engineFlicker:6,hitFlash:0}
  }

  init(canvasId:string){
    this.canvas=document.getElementById(canvasId) as HTMLCanvasElement
    if(!this.canvas)throw new Error('Canvas not found: '+canvasId)
    this.ctx=this.canvas.getContext('2d')!
    this.resize();window.addEventListener('resize',()=>this.resize())
    this.input.attach(this.canvas)
    this.input.setOnLeft(()=>{if(this.data.status===GameStatus.Playing)this.moveLeft()})
    this.input.setOnRight(()=>{if(this.data.status===GameStatus.Playing)this.moveRight()})
    this.input.setOnPause(()=>{if(this.data.status===GameStatus.Playing)this.pause();else if(this.data.status===GameStatus.Paused)this.resume()})
    this.input.setOnAnyKey(()=>{if(this.data.status===GameStatus.Menu)this.start();else if(this.data.status===GameStatus.GameOver)this.restart()})
    this.loop(0)
  }

  destroy(){this.input.detach();window.removeEventListener('resize',()=>this.resize());cancelAnimationFrame(this.animFrameId);this.audio.stopMusic()}
  setOnStateChange(cb:(d:GameData)=>void){this.onStateChange=cb}
  setOnGameOver(cb:(s:number)=>void){this.onGameOver=cb}

  private resize(){if(!this.canvas)return;this.canvas.width=window.innerWidth;this.canvas.height=window.innerHeight}

  private start(){if(this.data.status===GameStatus.Menu){
    this.reset();
    this.data.status=GameStatus.Playing;
    this.audio.startMusic();
    this.emitState()}}

  private reset(){
    this.data={status:GameStatus.Playing,score:0,highScore:this.storage.getHighScore(),distance:0,speed:BASE_GAME_SPEED,baseSpeed:BASE_GAME_SPEED,lives:INITIAL_LIVES,maxLives:MAX_LIVES,difficulty:0,worldIndex:0,worldTransition:1,shakeIntensity:0,shakeTimer:0,comboCount:0,dodgesCount:0,timePlayed:0,multiplier:1}
    this.player={lane:Lane.Center,targetLane:Lane.Center,x:this.canvas.width*LANE_POSITIONS[Lane.Center],y:this.canvas.height*PLAYER_Y_FRACTION,lives:INITIAL_LIVES,shield:false,invulnerable:false,invulnerableTimer:0,shieldTimer:0,slowMotion:false,slowMotionTimer:0,magnet:false,magnetTimer:0,doublePoints:false,doublePointsTimer:0,speedBoost:false,speedBoostTimer:0,rollAngle:0,engineFlicker:6,hitFlash:0}
    this.obstacles=[];this.powerups=[];this.particles=[]
    this.world=new WorldManager();this.spawn=new SpawnSystem()
  }

  restart(){this.reset();this.emitState()}

  private pause(){this.data.status=GameStatus.Paused;this.audio.stopMusic();this.emitState()}
  private resume(){this.data.status=GameStatus.Playing;this.audio.startMusic();this.lastTime=performance.now();this.emitState()}

  private moveLeft(){const l=this.player.targetLane;if(l>Lane.Left){this.player.targetLane=l-1 as Lane;this.player.rollAngle=-0.3;this.data.dodgesCount++}}
  private moveRight(){const l=this.player.targetLane;if(l<Lane.Right){this.player.targetLane=l+1 as Lane;this.player.rollAngle=0.3;this.data.dodgesCount++}}

  private emitState(){this.onStateChange?.({...this.data})}

  private loop=(now:number)=>{
    const dt=this.lastTime?Math.min((now-this.lastTime)/1000,0.05):0.016;this.lastTime=now
    if(this.data.status===GameStatus.Playing)this.update(dt)
    this.render()
    this.animFrameId=requestAnimationFrame(this.loop)
  }

  private update(dt:number){
    const cw=this.canvas.width,ch=this.canvas.height
    const slow=this.player.slowMotion?0.4:1
    const spd=this.player.speedBoost?this.data.speed*1.5:this.data.speed
    const effectiveDt=dt*slow
    const baseSpeedScaled=spd*effectiveDt*((cw<500)?0.5:1)
    this.data.distance+=baseSpeedScaled*0.01
    this.data.score+=Math.floor(baseSpeedScaled*SCORE_PER_METER*(this.player.doublePoints?2:1)*this.data.multiplier)
    this.data.timePlayed+=effectiveDt
    this.data.difficulty=Math.min(this.data.distance/600,1.5)
    this.data.baseSpeed=BASE_GAME_SPEED+this.data.distance*SPEED_INCREMENT
    this.data.speed=Math.min(this.data.baseSpeed,MAX_GAME_SPEED)
    this.data.multiplier=1+(this.data.comboCount*0.1)
    this.data.worldIndex=this.world.currentIndex;this.data.worldTransition=this.world.transition

    // World update
    this.world.update(this.data.distance)

    // Player lane interpolation
    this.player.lane+=(this.player.targetLane-this.player.lane)*0.15
    this.player.x=cw*LANE_POSITIONS[Math.round(this.player.lane)]
    // Actually smooth - let's interpolate properly
    this.player.x+=((cw*LANE_POSITIONS[this.player.targetLane])-this.player.x)*0.18
    this.player.y=ch*PLAYER_Y_FRACTION

    // Roll recovery
    this.player.rollAngle*=0.92
    if(Math.abs(this.player.rollAngle)<0.01)this.player.rollAngle=0

    // Timers
    if(this.player.invulnerable){this.player.invulnerableTimer-=effectiveDt;if(this.player.invulnerableTimer<=0){this.player.invulnerable=false;this.player.invulnerableTimer=0;this.player.hitFlash=0}}
    if(this.player.shield){this.player.shieldTimer=(this.player.shieldTimer||POWERUP_DURATION)-effectiveDt;if(this.player.shieldTimer<=0){this.player.shield=false;this.player.shieldTimer=0}}
    if(this.player.slowMotion){this.player.slowMotionTimer-=effectiveDt;if(this.player.slowMotionTimer<=0){this.player.slowMotion=false;this.player.slowMotionTimer=0}}
    if(this.player.magnet){this.player.magnetTimer-=effectiveDt;if(this.player.magnetTimer<=0){this.player.magnet=false;this.player.magnetTimer=0}}
    if(this.player.doublePoints){this.player.doublePointsTimer-=effectiveDt;if(this.player.doublePointsTimer<=0){this.player.doublePoints=false;this.player.doublePointsTimer=0}}
    if(this.player.speedBoost){this.player.speedBoostTimer-=effectiveDt;if(this.player.speedBoostTimer<=0){this.player.speedBoost=false;this.player.speedBoostTimer=0}}
    if(this.player.hitFlash>0)this.player.hitFlash-=effectiveDt
    this.player.engineFlicker=4+Math.random()*4

    // Shake
    if(this.data.shakeTimer>0){this.data.shakeIntensity*=0.9;this.data.shakeTimer-=effectiveDt;if(this.data.shakeTimer<=0){this.data.shakeIntensity=0;this.data.shakeTimer=0}}

    // Update obstacles
    this.obstacles.forEach(o=>{
      if(!o.active)return
      if(o.warningTimer<o.warningDuration){o.warningTimer+=effectiveDt;if(o.warningTimer>=o.warningDuration){o.warningTimer=o.warningDuration;this.audio.playWarning()}return}
      o.y+=o.speed*effectiveDt
      if(o.y>ch+50){o.active=false;return}
      // Drone lateral movement
      if(o.type==='drone'){o.x+=Math.sin(this.data.distance*0.05)*2*effectiveDt*60}
    })
    this.obstacles=this.obstacles.filter(o=>o.active)

    // Update powerups
    this.powerups.forEach(p=>{
      if(!p.active||p.collected)return
      p.y+=p.speed*effectiveDt
      if(p.y>ch+50){p.active=false}
    })
    this.powerups=this.powerups.filter(p=>p.active)

    // Magnet
    if(this.player.magnet){this.powerups.forEach(p=>{if(!p.active||p.collected)return;const dx=this.player.x-p.x,dy=this.player.y-p.y;const dist=Math.sqrt(dx*dx+dy*dy);if(dist<200){const spd=300*effectiveDt;p.x+=((this.player.x-p.x)/dist)*spd;p.y+=((this.player.y-p.y)/dist)*spd}})}
    // Collision detection
    this.checkCollisions()

    // Particles
    this.particles.forEach(p=>{
      if(!p.active)return;p.x+=p.vx*effectiveDt;p.y+=p.vy*effectiveDt;p.vy+=100*effectiveDt;p.life-=effectiveDt;p.vx*=0.98;if(p.life<=0)p.active=false
    })
    this.particles=this.particles.filter(p=>p.active)
    // Trail particles
    if(this.data.status===GameStatus.Playing){
      this.particles.push({x:this.player.x+(Math.random()-0.5)*5,y:this.player.y+PLAYER_HEIGHT*0.4,vx:(Math.random()-0.5)*10,vy:20+Math.random()*30,life:0.4,maxLife:0.4,size:3+Math.random()*4,color:'rgba(255,200,100,0.5)',type:'trail',active:true})
      if(this.particles.length>150)this.particles=this.particles.slice(-100)
    }

    // Spawn
    this.spawn.update(effectiveDt,this.data.speed,this.data.difficulty,this.obstacles,this.powerups,cw,ch)
    this.emitState()
  }

  private checkCollisions(){
    if(this.player.invulnerable)return
    const px=this.player.x,py=this.player.y,pw=PLAYER_WIDTH*0.5,ph=PLAYER_HEIGHT*0.4
    for(const o of this.obstacles){
      if(!o.active||o.warningTimer<o.warningDuration)continue
      if(aabbOverlap(px,py,pw,ph,o.x,o.y,o.w*0.8,o.h*0.8)){
        o.active=false
        if(this.player.shield){this.player.shield=false;this.player.shieldTimer=0;this.audio.playCollection();this.spawnExplosion(o.x,o.y,6,o.color);continue}
        this.hit(o)
        break
      }
    }
    for(const p of this.powerups){
      if(!p.active||p.collected)continue
      const pw=PLAYER_WIDTH*0.6,ph=PLAYER_HEIGHT*0.5
      if(aabbOverlap(px,py,pw,ph,p.x,p.y,p.w+10,p.h+10)){
        p.collected=true;p.active=false;this.collectPowerUp(p)
      }
    }
  }

  private hit(o:ObstacleData){
    this.player.lives--;this.data.lives=this.player.lives;this.data.score=Math.max(0,this.data.score-100);this.data.comboCount=0;this.data.multiplier=1
    this.player.invulnerable=true;this.player.invulnerableTimer=INVULNERABILITY_DURATION;this.player.hitFlash=0.3
    this.player.shield=false;this.player.shieldTimer=0
    this.data.shakeIntensity=15;this.data.shakeTimer=0.4
    this.audio.playHit();this.spawnExplosion(o.x,o.y,10,o.color)
    if(this.player.lives<=0){this.data.lives=0;this.gameOver()}
  }

  private gameOver(){
    this.data.status=GameStatus.GameOver;this.audio.stopMusic();this.audio.playExplosion()
    this.storage.setHighScore(this.data.score);this.data.highScore=this.storage.getHighScore()
    this.onGameOver?.(this.data.score)
    this.emitState()
  }

  private collectPowerUp(p:PowerUpData){
    this.audio.playCollection()
    switch(p.type){
      case PowerUpType.Shield:this.player.shield=true;this.player.shieldTimer=POWERUP_DURATION;break
      case PowerUpType.ExtraLife:this.player.lives=Math.min(this.player.lives+1,MAX_LIVES);this.data.lives=this.player.lives;break
      case PowerUpType.SlowMotion:this.player.slowMotion=true;this.player.slowMotionTimer=POWERUP_DURATION;break
      case PowerUpType.Magnet:this.player.magnet=true;this.player.magnetTimer=POWERUP_DURATION;break
      case PowerUpType.DoublePoints:this.player.doublePoints=true;this.player.doublePointsTimer=POWERUP_DURATION;break
      case PowerUpType.SpeedBoost:this.player.speedBoost=true;this.player.speedBoostTimer=POWERUP_DURATION;break
    }
    this.data.comboCount++
    this.spawnExplosion(p.x,p.y,8,'#2ecc71')
    this.emitState()
  }

  private spawnExplosion(x:number,y:number,count:number,color:string){
    for(let i=0;i<count;i++){this.particles.push({x,y,vx:(Math.random()-0.5)*200,vy:(Math.random()-0.5)*200,life:0.5+Math.random()*0.5,maxLife:1,size:3+Math.random()*4,color,type:'explosion',active:true})}
  }

  private render(){
    const cw=this.canvas.width,ch=this.canvas.height
    const s=this.data.shakeIntensity||0,stx=(Math.random()-0.5)*s,sty=(Math.random()-0.5)*s
    this.ctx.save();this.ctx.translate(stx,sty)
    this.renderer.render(this.ctx,this.world,this.player,this.obstacles,this.powerups,this.particles,this.data.distance,this.data.difficulty,this.data.speed,this.data.comboCount,cw,ch,this.data.timePlayed,this.data.status)
    this.ctx.restore()
    // Game over overlay in canvas
    if(this.data.status===GameStatus.Paused){this.ctx.fillStyle='rgba(0,0,0,0.5)';this.ctx.fillRect(0,0,cw,ch);this.ctx.fillStyle='#fff';this.ctx.font='48px Orbitron,sans-serif';this.ctx.textAlign='center';this.ctx.fillText('PAUSED',cw/2,ch/2)}
  }
}
