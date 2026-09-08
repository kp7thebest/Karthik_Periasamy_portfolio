/* ============================================================
   Shared behaviour across all pages.
   Cached once by the browser instead of re-parsed per page.
   ============================================================ */
(function(){
"use strict";
var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- generated wafer / die backdrop ---------- */
function drawFloorplan(x,W,H,o){
  o=o||{};
  var hue0=o.hue0!==undefined?o.hue0:210, span=o.span!==undefined?o.span:120;
  var sat=o.sat!==undefined?o.sat:10, light=o.light!==undefined?o.light:34;
  var minCell=o.min||54, depth=o.depth||6;
  var scribe=o.scribe||"rgba(16,18,21,.96)", detail=o.detail!==undefined?o.detail:.24;

  function hueAt(cx,cy){ return (hue0+((cx/W)*0.62+(cy/H)*0.38)*span)%360; }

  var blocks=[];
  (function split(bx,by,bw,bh,d){
    var canSplit=(bw>minCell*2||bh>minCell*2);
    if(d<=0||!canSplit||(d<depth-2&&Math.random()<0.10)){ blocks.push([bx,by,bw,bh]); return; }
    var vertical;
    if(bw/bh>1.30) vertical=true; else if(bh/bw>1.30) vertical=false;
    else vertical=Math.random()<0.5;
    var f=0.30+Math.random()*0.40;
    if(vertical){
      var cw=Math.round(bw*f);
      if(cw<minCell||bw-cw<minCell){ blocks.push([bx,by,bw,bh]); return; }
      split(bx,by,cw,bh,d-1); split(bx+cw,by,bw-cw,bh,d-1);
    }else{
      var ch=Math.round(bh*f);
      if(ch<minCell||bh-ch<minCell){ blocks.push([bx,by,bw,bh]); return; }
      split(bx,by,bw,ch,d-1); split(bx,by+ch,bw,bh-ch,d-1);
    }
  })(0,0,W,H,depth);

  x.fillStyle=scribe; x.fillRect(0,0,W,H);
  for(var i=0;i<blocks.length;i++){
    var b=blocks[i], bx=b[0]+1.5, by=b[1]+1.5, bw=b[2]-3, bh=b[3]-3;
    if(bw<=2||bh<=2) continue;
    var hu=hueAt(b[0]+b[2]/2,b[1]+b[3]/2);
    var li=light+(Math.random()*6-3), sa=sat+(Math.random()*7-3.5);
    x.fillStyle="hsl("+hu.toFixed(1)+","+Math.max(sa,0).toFixed(1)+"%,"+li.toFixed(1)+"%)";
    x.fillRect(bx,by,bw,bh);

    var kind=Math.random();
    x.save(); x.beginPath(); x.rect(bx,by,bw,bh); x.clip();
    x.fillStyle="hsla("+hu.toFixed(1)+","+Math.max(sa,0).toFixed(1)+"%,"+Math.max(li-11,8).toFixed(1)+"%,"+detail+")";
    if(kind<0.34){
      var p=3+Math.floor(Math.random()*4);
      for(var vx=bx+1;vx<bx+bw;vx+=p) x.fillRect(vx,by+1,Math.max(1,p-2),bh-2);
    }else if(kind<0.66){
      var q=3+Math.floor(Math.random()*4);
      for(var hy=by+1;hy<by+bh;hy+=q) x.fillRect(bx+1,hy,bw-2,Math.max(1,q-2));
    }else if(kind<0.86){
      var s=4+Math.floor(Math.random()*5);
      for(var ay=by+2;ay<by+bh-1;ay+=s)
        for(var ax=bx+2;ax<bx+bw-1;ax+=s) x.fillRect(ax,ay,s-2,s-2);
    }else{
      var n=1+Math.floor(Math.random()*3);
      for(var m=0;m<n;m++) x.fillRect(bx+bw*0.08,by+bh*(m+0.35)/n,bw*0.84,bh/(n*1.9));
    }
    x.fillStyle="hsla("+hu.toFixed(1)+",14%,62%,.20)";
    x.fillRect(bx,by,bw,1.1);
    x.restore();
  }
}

(function waferBackground(){
  var c=document.getElementById("waferBg");
  if(!c) return;
  var ctx=c.getContext("2d");
  function paint(){
    var dpr=Math.min(window.devicePixelRatio||1,2);
    var w=window.innerWidth, h=window.innerHeight;
    c.width=Math.round(w*dpr); c.height=Math.round(h*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    drawFloorplan(ctx,w,h,{
      hue0:206, span:120, sat:11, light:32,
      min:Math.max(26,Math.round(Math.min(w,h)/24)),
      depth:9, detail:.24, scribe:"rgba(16,18,21,.96)"
    });
  }
  paint();
  var t=null;
  window.addEventListener("resize",function(){ clearTimeout(t); t=setTimeout(paint,220); });
})();

/* ---------- scroll progress bar ---------- */
(function progress(){
  var bar=document.getElementById("progress");
  if(!bar) return;
  var ticking=false;
  function update(){
    ticking=false;
    var h=document.documentElement;
    var max=h.scrollHeight-h.clientHeight;
    var p=max>0 ? (window.scrollY/max)*100 : 0;
    bar.style.width=Math.min(Math.max(p,0),100).toFixed(2)+"%";
  }
  update();
  window.addEventListener("scroll",function(){
    if(!ticking){ ticking=true; requestAnimationFrame(update); }
  },{passive:true});
  window.addEventListener("resize",update);
})();

/* ---------- mobile nav ---------- */
(function nav(){
  var btn=document.getElementById("navtoggle"), menu=document.getElementById("topnav");
  if(!btn||!menu) return;
  function set(on){
    btn.classList.toggle("on",on);
    menu.classList.toggle("on",on);
    btn.setAttribute("aria-expanded",on?"true":"false");
  }
  btn.addEventListener("click",function(){ set(!menu.classList.contains("on")); });
  menu.querySelectorAll("a").forEach(function(a){ a.addEventListener("click",function(){ set(false); }); });
  document.addEventListener("keydown",function(e){ if(e.key==="Escape") set(false); });
})();

/* ---------- tabs ---------- */
(function tabs(){
  document.querySelectorAll("[data-tabs]").forEach(function(group){
    var btns=group.querySelectorAll(".tab");
    var panels=group.querySelectorAll(".tabpanel");
    function select(i){
      btns.forEach(function(b,j){ b.setAttribute("aria-selected", j===i?"true":"false"); });
      panels.forEach(function(p,j){ p.hidden = j!==i; });
    }
    btns.forEach(function(b,i){
      b.addEventListener("click",function(){ select(i); });
      b.addEventListener("keydown",function(e){
        if(e.key==="ArrowRight"||e.key==="ArrowLeft"){
          e.preventDefault();
          var n=(i+(e.key==="ArrowRight"?1:-1)+btns.length)%btns.length;
          btns[n].focus(); select(n);
        }
      });
    });
    select(0);
  });
})();

/* ---------- coverage bar, animated once in view ---------- */
(function coverage(){
  var fill=document.getElementById("covFill"), num=document.getElementById("covNum");
  if(!fill) return;
  var to=parseFloat(fill.dataset.to);
  function run(){
    fill.style.width=to+"%";
    if(reduce||!num){ if(num) num.textContent=to.toFixed(2)+"%"; return; }
    var s=performance.now();
    (function tick(n){
      var p=Math.min((n-s)/1200,1);
      num.textContent=(to*(1-Math.pow(1-p,3))).toFixed(2)+"%";
      if(p<1) requestAnimationFrame(tick);
    })(s);
  }
  if("IntersectionObserver" in window){
    var io=new IntersectionObserver(function(en){
      if(en[0].isIntersecting){ run(); io.disconnect(); }
    },{threshold:.35});
    io.observe(fill.closest(".proj")||fill);
  } else run();
})();

/* ---------- experience detail panel ---------- */
(function roles(){
  var readout=document.getElementById("readout");
  if(!readout || !window.ROLE_DATA) return;
  var pulses=[].slice.call(document.querySelectorAll(".pulse"));
  function show(id){
    var d=window.ROLE_DATA[id];
    if(!d) return;
    pulses.forEach(function(p){ p.setAttribute("aria-pressed", p.id===id?"true":"false"); });
    var ul=d.b.map(function(x){ return "<li></li>"; }).join("");
    readout.innerHTML="<div class='tl-when'></div><h3></h3><div class='tl-where'></div><ul class='marks work'>"+ul+"</ul>";
    readout.querySelector(".tl-when").textContent=d.when;
    readout.querySelector("h3").textContent=d.t;
    readout.querySelector(".tl-where").textContent=d.s;
    var lis=readout.querySelectorAll("li");
    d.b.forEach(function(x,i){ lis[i].textContent=x; });
  }
  pulses.forEach(function(p){
    p.addEventListener("click",function(){ show(p.id); });
    p.addEventListener("keydown",function(e){
      if(e.key==="Enter"||e.key===" "){ e.preventDefault(); show(p.id); }
    });
  });
  show(pulses.length?pulses[0].id:null);
})();

})();
