const K='sky_escape_highScore'
export class StorageManager{
  getHighScore():number{try{return parseInt(localStorage.getItem(K)||'0',10)}catch{return 0}}
  setHighScore(s:number):void{try{const c=this.getHighScore();if(s>c)localStorage.setItem(K,s.toString())}catch{}}
}
