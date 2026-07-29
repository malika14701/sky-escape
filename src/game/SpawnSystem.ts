import { type ObstacleData, type PowerUpData, ObstacleType, PowerUpType, Lane } from './types'
import { randItem, randInt } from './utils'
import { OBSTACLE_BASE_SPEED, POWERUP_SPEED, WARNING_DURATION, LANE_POSITIONS } from './constants'
const OBT = [ObstacleType.Bomb, ObstacleType.Missile, ObstacleType.Laser, ObstacleType.Lightning, ObstacleType.Turbulence, ObstacleType.Mine, ObstacleType.Drone]
const PUT = [PowerUpType.Shield, PowerUpType.ExtraLife, PowerUpType.SlowMotion, PowerUpType.Magnet, PowerUpType.DoublePoints, PowerUpType.SpeedBoost]
const colors:{[k:string]:string} = {bomb:'#e74c3c', missile:'#e67e22', laser:'#f1c40f', lightning:'#9b59b6', turbulence:'#3498db', mine:'#2c3e50', drone:'#e91e63'}
const sizes:{[k:string]:[number,number]} = {bomb:[30,30], missile:[25,50], laser:[20,60], lightning:[20,50], turbulence:[80,40], mine:[32,32], drone:[40,45]}
export class SpawnSystem{
  private timer=0;private pTimer=0
  update(dt:number,speed:number,difficulty:number,obstacles:ObstacleData[],powerups:PowerUpData[],canvasW:number,_canvasH:number){
    this.timer+=dt;this.pTimer+=dt
    const oi=Math.max(0.3,1.2-difficulty*0.06);if(this.timer>=oi){this.timer=0;this.spawn(speed,difficulty,obstacles,canvasW)}
    const pi=Math.max(2,8-difficulty*0.4);if(this.pTimer>=pi){this.pTimer=0;this.spawnPowerUp(speed,powerups,canvasW)}
  }
  private spawn(s:number,d:number,o:ObstacleData[],cw:number){
    const t=this.pickWeighted(d),lane=randInt(0,2) as Lane
    const sz=sizes[t],w=sz[0],h=sz[1]
    const x=cw*LANE_POSITIONS[lane],y=-h-20,spd=OBSTACLE_BASE_SPEED+s*0.3
    o.push({type:t,lane,x,y,w,h,speed:spd,active:true,warningTimer:0,warningDuration:WARNING_DURATION,hit:false,color:colors[t]})
  }
  private pickWeighted(d:number):ObstacleType{
    const r=Math.random()
    if(d<0.3)return OBT[0];if(d<0.5)return r<0.5?OBT[0]:OBT[1];if(d<0.7)return OBT[[0,1,2][randInt(0,2)]];if(d<0.9){const opts=[OBT[0],OBT[1],OBT[2],OBT[3]];return opts[randInt(0,3)]}if(d<1.2)return OBT[randInt(0,4)]
    return OBT[randInt(0,OBT.length-1)]
  }
  private spawnPowerUp(s:number,p:PowerUpData[],cw:number){
    const t=randItem(PUT),lane=randInt(0,2) as Lane
    const x=cw*LANE_POSITIONS[lane],y=-30,w=28,h=28,sp=POWERUP_SPEED+s*0.15
    p.push({type:t,lane,x,y,w,h,speed:sp,active:true,collected:false})
  }
}
