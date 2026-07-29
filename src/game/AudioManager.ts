export class AudioManager{
  private actx:AudioContext|null=null;private musicOsc:OscillatorNode|null=null;private musicGain:GainNode|null=null;private musicPlaying=false
  private getCtx():AudioContext{if(!this.actx)this.actx=new AudioContext();if(this.actx.state==='suspended')this.actx.resume();return this.actx}
  private node(freq:number,type:OscillatorType='square',dur:number=0.1,vol:number=0.12){
    const c=this.getCtx(),o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(vol,c.currentTime);g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+dur);o.connect(g);g.connect(c.destination);o.start(c.currentTime);o.stop(c.currentTime+dur)}
  private noise(dur:number,vol:number=0.08){const c=this.getCtx(),buf=c.createBuffer(1,c.sampleRate*dur,c.sampleRate),d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;const s=c.createBufferSource(),g=c.createGain();s.buffer=buf;g.gain.setValueAtTime(vol,c.currentTime);g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+dur);s.connect(g);g.connect(c.destination);s.start()}
  playLaser(){this.node(880,'square',0.08,0.08);this.node(660,'square',0.1,0.06)}
  playBomb(){this.node(120,'sawtooth',0.25,0.15);this.noise(0.2,0.1)}
  playExplosion(){this.node(80,'sawtooth',0.3,0.18);this.noise(0.25,0.12)}
  playMissile(){this.node(300,'sawtooth',0.15,0.08);this.node(200,'sawtooth',0.2,0.06)}
  playCollection(){this.node(1000,'sine',0.08,0.08);setTimeout(()=>this.node(1400,'sine',0.1,0.08),60)}
  playPowerUp(){this.node(600,'sine',0.1,0.1);setTimeout(()=>this.node(900,'sine',0.1,0.1),80);setTimeout(()=>this.node(1200,'sine',0.15,0.1),160)}
  playHit(){this.node(150,'sawtooth',0.15,0.15);this.noise(0.12,0.1)}
  playWarning(){this.node(500,'triangle',0.05,0.06)}
  playThunder(){this.node(60,'sawtooth',0.5,0.2);this.noise(0.45,0.15)}
  startMusic(){if(this.musicPlaying)return;try{const c=this.getCtx();this.musicGain=c.createGain();this.musicGain.gain.value=0.06;this.musicGain.connect(c.destination);const bpm=140,sp=60/bpm;const play=()=>{if(this.musicOsc)this.musicOsc.disconnect();this.musicOsc=c.createOscillator();this.musicOsc.type='triangle';this.musicOsc.frequency.value=262;this.musicOsc.connect(this.musicGain!);this.musicOsc.start();const seq=[262,294,330,349,392,349,330,294,262,294,330,392,440,392,330,294];let i=0;const step=()=>{if(!this.musicPlaying||!this.musicOsc)return;this.musicOsc.frequency.setValueAtTime(seq[i%seq.length],c.currentTime);i++;const j=()=>{if(this.musicPlaying)step()};setTimeout(j,sp*1000*0.8)};setTimeout(step,sp*1000*0.8)};play();this.musicPlaying=true}catch{}}
  stopMusic(){this.musicPlaying=false;if(this.musicOsc){try{this.musicOsc.stop()}catch{}this.musicOsc.disconnect();this.musicOsc=null}if(this.musicGain){this.musicGain.disconnect();this.musicGain=null}}
}
