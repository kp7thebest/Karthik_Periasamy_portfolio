/* ============================================================
   Home-page 3D hero only. The model now loads from a separate
   .glb so the browser caches it once rather than re-parsing a
   base64 blob on every page.
   ============================================================ */
(function(){
"use strict";
if(typeof THREE==="undefined") return;
var cvs=document.getElementById("scene");
if(!cvs) return;

var reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;

var renderer;
try{
  renderer=new THREE.WebGLRenderer({canvas:cvs,antialias:true,alpha:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
}catch(e){
  console.warn("WebGL unavailable; hero falls back to its gradient.",e);
  return;
}

var scene=new THREE.Scene();
var camera=new THREE.PerspectiveCamera(42,1,0.1,100);
camera.position.set(0,0,7.4);
var root=new THREE.Group(); scene.add(root);

/* --- wafer disc behind the aircraft, drawn to a canvas texture --- */
function dieTexture(){
  var c=document.createElement("canvas"); c.width=c.height=1024;
  var x=c.getContext("2d");
  x.fillStyle="#1B1E23"; x.fillRect(0,0,1024,1024);
  var cols=["rgba(222,138,78,.30)","rgba(111,166,214,.28)","rgba(192,200,210,.20)"];
  var rowH=26;
  for(var r=0;r<1024/rowH;r++){
    var y=r*rowH, px=Math.random()*40;
    while(px<1024){
      var w=8+Math.random()*44;
      if(Math.random()<0.6){
        x.fillStyle="rgba(192,200,210,"+(0.04+Math.random()*0.07).toFixed(3)+")";
        x.fillRect(px,y+4,w,rowH-11);
      }
      px+=w+3+Math.random()*22;
    }
  }
  for(var k=0;k<60;k++){
    var cx=Math.random()*1024, cy=Math.random()*1024, horiz=Math.random()<0.5;
    x.strokeStyle=cols[k%3]; x.lineWidth=1.5; x.beginPath(); x.moveTo(cx,cy);
    for(var s=0;s<4+Math.floor(Math.random()*3);s++){
      if(horiz) cx+=(Math.random()<0.5?-1:1)*(60+Math.random()*200);
      else      cy+=(Math.random()<0.5?-1:1)*(50+Math.random()*160);
      x.lineTo(cx,cy); horiz=!horiz;
    }
    x.stroke();
  }
  x.strokeStyle="rgba(20,22,26,.75)"; x.lineWidth=3;
  for(var g=0;g<=1024;g+=128){
    x.beginPath(); x.moveTo(g,0); x.lineTo(g,1024); x.stroke();
    x.beginPath(); x.moveTo(0,g); x.lineTo(1024,g); x.stroke();
  }
  var gr=x.createRadialGradient(512,512,140,512,512,512);
  gr.addColorStop(0,"rgba(20,22,26,0)");
  gr.addColorStop(1,"rgba(20,22,26,.55)");
  x.fillStyle=gr; x.fillRect(0,0,1024,1024);
  return c;
}
var wafer=new THREE.Mesh(
  new THREE.CircleGeometry(3.5,96),
  new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(dieTexture()),transparent:true,opacity:.55})
);
wafer.position.set(-.55,.15,-3.1); root.add(wafer);
var waferRim=new THREE.Mesh(
  new THREE.TorusGeometry(3.5,.016,8,120),
  new THREE.MeshBasicMaterial({color:0x7F8894,transparent:true,opacity:.45})
);
waferRim.position.copy(wafer.position); root.add(waferRim);

/* --- aircraft --- */
var body=new THREE.Group(); body.position.z=-2.15;
var jet=new THREE.Group(); jet.add(body); root.add(jet);

var PLUME_LEN=3.4;
function glowTex(){
  var c=document.createElement("canvas"); c.width=c.height=256;
  var x=c.getContext("2d");
  var g=x.createRadialGradient(128,128,0,128,128,128);
  g.addColorStop(0,"rgba(255,255,255,1)");
  g.addColorStop(0.15,"rgba(206,231,255,.96)");
  g.addColorStop(0.38,"rgba(108,163,255,.78)");
  g.addColorStop(0.66,"rgba(126,96,236,.30)");
  g.addColorStop(1,"rgba(104,72,214,0)");
  x.fillStyle=g; x.fillRect(0,0,256,256);
  return new THREE.CanvasTexture(c);
}
function plumeTex(){
  var c=document.createElement("canvas"); c.width=16; c.height=256;
  var x=c.getContext("2d");
  var g=x.createLinearGradient(0,256,0,0);
  g.addColorStop(0,"rgba(255,255,255,.95)");
  g.addColorStop(0.09,"rgba(198,226,255,.88)");
  g.addColorStop(0.30,"rgba(96,152,255,.55)");
  g.addColorStop(0.58,"rgba(139,96,238,.24)");
  g.addColorStop(1,"rgba(120,70,200,0)");
  x.fillStyle=g; x.fillRect(0,0,16,256);
  return new THREE.CanvasTexture(c);
}
var GLOW_TEX=glowTex(), PLUME_TEX=plumeTex();

function makeBurner(){
  var g=new THREE.Group();
  var disc=new THREE.Mesh(new THREE.CircleGeometry(0.30,36),
    new THREE.MeshBasicMaterial({map:GLOW_TEX,transparent:true,
      blending:THREE.AdditiveBlending,depthWrite:false}));
  disc.position.z=0.04; g.add(disc);
  var plume=new THREE.Mesh(new THREE.ConeGeometry(0.17,PLUME_LEN,26,1,true),
    new THREE.MeshBasicMaterial({map:PLUME_TEX,transparent:true,opacity:.6,
      blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
  plume.rotation.x=Math.PI/2; g.add(plume);
  var dias=[];
  for(var d=0;d<4;d++){
    var dm=new THREE.Mesh(new THREE.SphereGeometry(0.085,14,10),
      new THREE.MeshBasicMaterial({color:0xD6E7FF,transparent:true,opacity:0,
        blending:THREE.AdditiveBlending,depthWrite:false}));
    dm.scale.set(1,1,2.1); g.add(dm); dias.push(dm);
  }
  var light=new THREE.PointLight(0x74A6FF,0.4,7);
  light.position.z=0.26; g.add(light);
  g.userData={disc:disc,plume:plume,dias:dias,light:light};
  return g;
}
var burners=[makeBurner()];
burners[0].position.set(0,0,4.62); body.add(burners[0]);

/* lighting */
scene.add(new THREE.AmbientLight(0xFFFFFF,.55));
var warm=new THREE.DirectionalLight(0xDE8A4E,1.00); warm.position.set(4.5,2.0,3.0);
var cold=new THREE.DirectionalLight(0x6FA6D6,1.05); cold.position.set(-4.2,-1.4,2.6);
var key=new THREE.PointLight(0xFFFFFF,.45); key.position.set(0,1.4,4.4);
scene.add(warm); scene.add(cold); scene.add(key);

/* pose */
jet.position.set(0.55,0.35,0);
jet.scale.setScalar(1.15);
var BASE={x:0.60,y:0.55,z:0.25};
jet.rotation.set(BASE.x,BASE.y,BASE.z);

/* --- load the model --- */
if(THREE.GLTFLoader){
  new THREE.GLTFLoader().load("assets/rafale.glb",function(gltf){
    var m=gltf.scene;
    m.rotation.y=-Math.PI/2; m.updateMatrixWorld(true);
    var box=new THREE.Box3().setFromObject(m);
    var k=4.34/box.getSize(new THREE.Vector3()).z;
    m.scale.setScalar(k); m.updateMatrixWorld(true);
    box.setFromObject(m);
    var ctr=box.getCenter(new THREE.Vector3());
    m.position.x-=ctr.x; m.position.y-=ctr.y; m.position.z-=box.min.z;

    /* open, single-sided shells would otherwise be see-through */
    m.traverse(function(o){
      if(o.isMesh&&o.material){
        o.material.side=THREE.DoubleSide;
        o.material.depthWrite=true; o.material.transparent=false;
        o.material.opacity=1; o.material.needsUpdate=true;
      }
    });

    var keep=burners.slice();
    for(var c=body.children.length-1;c>=0;c--){
      if(keep.indexOf(body.children[c])===-1) body.remove(body.children[c]);
    }
    body.add(m);

    /* twin M88 nozzles, measured from the model in body space */
    body.remove(burners[0]);
    burners=[makeBurner(),makeBurner()];
    burners[0].position.set(-0.166,-0.272,3.94);
    burners[1].position.set( 0.166,-0.272,3.94);
    burners[0].scale.setScalar(0.62);
    burners[1].scale.setScalar(0.62);
    body.add(burners[0]); body.add(burners[1]);
  },undefined,function(err){
    console.warn("Rafale model failed to load.",err);
  });
}

/* --- state --- */
var burn=0.12, burnT=0.12, lastY=window.scrollY, running=true, clock=0;
var mx=0,my=0,tmx=0,tmy=0;

function resize(){
  var r=cvs.getBoundingClientRect();
  if(!r.width||!r.height) return;
  renderer.setSize(r.width,r.height,false);
  camera.aspect=r.width/r.height;
  var narrow=r.width<760;
  camera.position.z = narrow ? 10.6 : 7.4;
  root.position.y   = narrow ? 0.55 : 0;
  root.scale.setScalar(narrow ? 0.88 : 1);
  camera.updateProjectionMatrix();
}
resize();
window.addEventListener("resize",resize);

window.addEventListener("scroll",function(){
  var d=Math.abs(window.scrollY-lastY); lastY=window.scrollY;
  burnT=Math.min(0.12+d*0.030,1);
},{passive:true});

if(window.matchMedia("(hover:hover) and (pointer:fine)").matches){
  window.addEventListener("mousemove",function(e){
    tmx=(e.clientX/window.innerWidth-.5);
    tmy=(e.clientY/window.innerHeight-.5);
  });
}

function setBurn(b,t){
  var flick=0.93+0.07*Math.sin(t*29)+0.04*Math.sin(t*47.3);
  var len=0.34+b*1.25;
  for(var n=0;n<burners.length;n++){
    var u=burners[n].userData;
    u.plume.scale.set(0.72+b*0.55,len,0.72+b*0.55);
    u.plume.position.z=0.06+(PLUME_LEN*len)/2;
    u.plume.material.opacity=(0.14+b*0.80)*flick;
    u.disc.scale.setScalar(0.72+b*0.62);
    u.disc.material.opacity=(0.42+b*0.58)*flick;
    u.light.intensity=(0.30+b*2.6)*flick/burners.length;
    u.light.color.setHSL(0.615-b*0.030,0.92,0.44+b*0.24);
    var vis=Math.max(0,(b-0.42))*1.7;
    for(var i=0;i<u.dias.length;i++){
      u.dias[i].position.z=0.22+i*0.46*(0.6+b);
      u.dias[i].material.opacity=vis*(1-i*0.2)*flick;
      u.dias[i].scale.set(0.8+b*0.5,0.8+b*0.5,(0.8+b*0.5)*2.1);
    }
  }
}

function frame(){
  if(!running) return;
  requestAnimationFrame(frame);
  clock+=1/60;
  if(!reduced){
    burnT+=(0.12-burnT)*0.026;
    burn +=(burnT-burn)*0.085;
    mx+=(tmx-mx)*0.045; my+=(tmy-my)*0.045;
    jet.rotation.z=BASE.z+Math.sin(clock*0.42)*0.075+mx*0.16-burn*0.16;
    jet.rotation.x=BASE.x+Math.sin(clock*0.31)*0.035+my*0.14+burn*0.10;
    jet.rotation.y=BASE.y+mx*0.26;
    jet.position.y=0.35+Math.sin(clock*0.55)*0.075+burn*0.10;
    jet.position.z=burn*0.42;
    wafer.rotation.z+=0.00050;
    root.rotation.y=mx*0.10;
    setBurn(burn,clock);
  }
  renderer.render(scene,camera);
}
if(reduced){ setBurn(0.38,0); renderer.render(scene,camera); }
else frame();

/* only render while the hero is actually on screen */
if("IntersectionObserver" in window){
  new IntersectionObserver(function(en){
    if(en[0].isIntersecting){ if(!running&&!reduced){ running=true; frame(); } }
    else running=false;
  },{threshold:0}).observe(cvs);
}
document.addEventListener("visibilitychange",function(){
  if(document.hidden) running=false;
  else if(!reduced&&!running){ running=true; frame(); }
});
})();
