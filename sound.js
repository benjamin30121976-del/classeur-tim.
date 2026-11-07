/* Sons originaux synthétisés par Web Audio, sans ressources externes. */
(()=>{'use strict';let ctx=null;
 const KEY='tim_click_sfx_v1';let mode='bulle',on=true;
 try{const v=JSON.parse(localStorage.getItem(KEY)||'{}');if(['bulle','arcade','muet'].includes(v.mode))mode=v.mode;if(typeof v.on==='boolean')on=v.on;}catch(e){}
 function store(){try{localStorage.setItem(KEY,JSON.stringify({mode,on}));}catch(e){}document.dispatchEvent(new Event('tim-sound-change'));}
 function audio(){if(!on||mode==='muet')return null;try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return null;if(!ctx)ctx=new A();if(ctx.state==='suspended')ctx.resume();return ctx;}catch(e){return null;}}
 function note(f1,f2,dur,delay=0,type='sine',gain=.038){const c=audio();if(!c)return;const t=c.currentTime+delay+.01,o=c.createOscillator(),v=c.createGain();o.type=type;o.frequency.setValueAtTime(f1,t);o.frequency.exponentialRampToValueAtTime(Math.max(40,f2),t+dur);v.gain.setValueAtTime(.0001,t);v.gain.exponentialRampToValueAtTime(gain,t+.012);v.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(v).connect(c.destination);o.start(t);o.stop(t+dur+.03);}
 function click(){if(mode==='arcade'){note(920,190,.15,0,'sawtooth',.025);note(450,110,.17,.02,'triangle',.018);}else{note(480,810,.12,0,'sine',.037);note(770,1040,.08,.055,'sine',.02);}}
 function play(name){if(name==='tap')click();if(name==='intro'){[0,.34,.7,1.08,1.45,1.8,2.2,2.55].forEach((d,i)=>note(390+i*24,710+i*15,.17,d,'sine',.019));}if(name==='welcome'){[523,659,784,1046].forEach((n,i)=>note(n,n*1.03,.23,i*.125,'triangle',.038));}if(name==='win'){[510,660,830].forEach((n,i)=>note(n,n*1.05,.18,i*.10,'sine',.035));}if(name==='lose'){[370,290,220].forEach((n,i)=>note(n,n*.78,.16,i*.11,'triangle',.03));}}
 function setMode(v){if(['bulle','arcade','muet'].includes(v)){mode=v;store();if(mode!=='muet')play('tap');}}
 function setOn(v){on=!!v;store();if(on)play('tap');}
 // Les sons des touches sont joués sur un geste utilisateur et ne bloquent pas la navigation.
 document.addEventListener('click',e=>{const b=e.target.closest('button,[role="button"],label.choose');if(!b||b.disabled||b.id==='intro-play'||b.id==='intro-silent'||b.id==='sound-toggle')return;play('tap');},true);
 window.TIM_SOUND={play,get mode(){return mode;},get on(){return on;},setMode,setOn,unlock:audio};
})();
