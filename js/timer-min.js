class Timer{constructor(a,b,c=!1){this.callback=a,this.remainingTime=b,this.startedTime=0,this.pausedTime=0,this.timerId=0,c&&this.start()}pause(){this.pausedTime=new Date,this.destroy(),this.remainingTime=this.remainingTime-(this.pausedTime-this.startedTime)}resume(){this.startedTime=new Date,this.destroy(),this.timerId=setTimeout(()=>this.callback(),this.remainingTime)}start(){this.startedTime=new Date,this.timerId=setTimeout(()=>this.callback(),this.remainingTime)}destroy(){clearTimeout(this.timerId)}}
