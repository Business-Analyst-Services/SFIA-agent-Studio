/* The crew menagerie: a low-poly Australian animal for every SFIA role family, in Muster's art style.
   Menagerie.still(id,family) → cached dataURL portrait (one shared offscreen renderer, no context growth).
   Menagerie.guest → the single live "guest cam": .show(container,id,family), .park(). */
window.Menagerie=(function(){
 if(!window.THREE)return{ready:false,still:()=>null,guest:{show(){},park(){}},species:()=>''};
 const T=THREE;
 // family → [species name, plan, options]
 const FAM={
  'Agile Delivery':['quokka','quad',{base:0x9a7d52,belly:0xd8c09a,ears:'round',muzzle:'short',tail:'stub',smileUp:1}],
  'Application Platform':['wombat','quad',{base:0x7d6a58,belly:0xb3a28c,ears:'stub',muzzle:'broad',tail:'none',stocky:1.25}],
  'Architecture':['bowerbird','bird',{base:0x3d55a8,belly:0x5f79cc,beak:.32,tail:'flat'}],
  'Audio-Visual':['lyrebird','bird',{base:0x6b5d52,belly:0x9c8a76,beak:.3,tail:'lyre'}],
  'Business Analysis':['bilby','quad',{base:0x8d9196,belly:0xd9d3c8,ears:'long',muzzle:'long',tail:'long'}],
  'Change Management':['galah','bird',{base:0x9aa0a6,belly:0xe88a9a,beak:.26,crest:0xe88a9a,tail:'flat'}],
  'Computational Science':['platypus','quad',{base:0x6f553e,belly:0xc9a06a,ears:'none',muzzle:'bill',tail:'paddle'}],
  'Data & Analytics':['echidna','quad',{base:0x6e5a44,belly:0xb59a72,ears:'stub',muzzle:'needle',tail:'none',spikes:1}],
  'DevOps':['dingo','quad',{base:0xc08a4a,belly:0xe8cda0,ears:'point',muzzle:'dog',tail:'long'}],
  'Digital Product Development, Sales & Marketing':['kookaburra','bird',{base:0x8a7a68,belly:0xe8dcc8,beak:.5,headBig:1,tail:'flat'}],
  'Experience Design':['sugar glider','quad',{base:0x9fb3c8,belly:0xe8eef4,ears:'round',muzzle:'short',tail:'long',eyeBig:1,stripe:0x3a4654}],
  'Finance & Procurement':['numbat','quad',{base:0xb06a3a,belly:0xe0b07c,ears:'point',muzzle:'needle',tail:'brush',bands:1}],
  'Human Resource & Workforce Management':['koala','quad',{base:0x9aa0a0,belly:0xd8dcd8,ears:'fluff',muzzle:'nose',tail:'none',stocky:1.15}],
  'Information & Cyber Security':['tasmanian devil','quad',{base:0x2a2522,belly:0xe8e0d4,ears:'round',muzzle:'broad',tail:'stub',earSkin:0xc96a5a}],
  'Learning & Development':['cockatoo','bird',{base:0xf2eee4,belly:0xffffff,beak:.3,crest:0xf2c14e,tail:'flat',dark:0x8a8272}],
  'Product Management':['ringtail possum','quad',{base:0x8a6e55,belly:0xd8c0a4,ears:'round',muzzle:'short',tail:'curl',eyeBig:1}],
  'Project Delivery':['blue heeler','quad',{base:0x5f6d78,belly:0xc9b492,ears:'point',muzzle:'dog',tail:'long',mottle:1}],
  'Service Management':['quoll','quad',{base:0x7a5c40,belly:0xdcc49e,ears:'round',muzzle:'short',tail:'long',spots:1}],
  'Software Engineering':['green tree frog','quad',{base:0x5f9e4a,belly:0xcfe8a8,ears:'none',muzzle:'frog',tail:'none',eyeTop:1,squat:1}],
  'Technology Executive':['wedge-tailed eagle','bird',{base:0x4a3a2c,belly:0x6e5742,beak:.34,hook:1,tail:'flat'}],
  'Testing':['magpie','bird',{base:0x1d2226,belly:0xf2f2ee,beak:.3,tail:'flat'}]};
 FAM['Technology Infrastructure Platform']=['kangaroo','roo',{base:0xa97f52,belly:0xdec09a,ears:'long',muzzle:'long'}];
 const hash=s=>{let h=0;for(const c of s)h=(h*31+c.charCodeAt(0))>>>0;return h};
 const mat=(c,tint)=>{const col=new T.Color(c);if(tint)col.offsetHSL(tint,0,0);return new T.MeshStandardMaterial({color:col,flatShading:true,roughness:.85})};
 const DK=new T.MeshStandardMaterial({color:0x17100c,roughness:.3});
 function add(g,geo,m,x,y,z,s){const o=new T.Mesh(geo,m);o.position.set(x,y,z);if(s)o.scale.set(s[0],s[1],s[2]);g.add(o);return o}
 /* build an animal; returns {g, head, tail, wings[], jawish} for animation */
 function build(id,family){
  const [name,plan,o]=FAM[family]||FAM['Business Analysis'];
  const tint=((hash(id)%100)/100-.5)*.07;
  const base=mat(o.base,tint),belly=mat(o.belly,tint),dark=mat(o.dark||0x5a4636,tint);
  const earM=o.earSkin?mat(o.earSkin,0):belly;
  const g=new T.Group();const parts={g,name,wings:[]};
  const collarC=[0x0f6e64,0xc2410c,0x3d55a8,0x8a2f6b,0xb7791f][hash(id)%5];
  const collar=(y,r,z)=>{const c=add(g,new T.TorusGeometry(r,.075,8,14),mat(collarC,0),0,y,z||.2);c.rotation.x=1.4;
   add(g,new T.CylinderGeometry(.09,.09,.04,8),new T.MeshStandardMaterial({color:0xf2c14e,metalness:.5,roughness:.3}),0,y-.14,(z||.2)+.28).rotation.x=1.2};
  if(plan==='bird'){
   const body=add(g,new T.SphereGeometry(.62,7,5),base,0,.95,0,[0.9,1.15,1]);body.rotation.x=.25;
   add(g,new T.SphereGeometry(.4,6,4),belly,0,.8,.3,[.8,.95,.6]);
   parts.wings.push(add(g,new T.SphereGeometry(.42,6,4),dark,.52,1.0,-.05,[.35,.95,.7]));
   parts.wings.push(add(g,new T.SphereGeometry(.42,6,4),dark,-.52,1.0,-.05,[.35,.95,.7]));
   if(o.tail==='lyre'){add(g,new T.TorusGeometry(.32,.045,6,10,Math.PI),dark,.12,1.15,-.62).rotation.y=.4;add(g,new T.TorusGeometry(.32,.045,6,10,Math.PI),dark,-.12,1.15,-.62).rotation.y=-.4}
   else{parts.tail=add(g,new T.BoxGeometry(.3,.08,.7),dark,0,.85,-.62);parts.tail.rotation.x=-.5}
   const head=new T.Group();head.position.set(0,1.75,.18);g.add(head);parts.head=head;
   const hs=o.headBig?.44:.36;
   add(head,new T.SphereGeometry(hs,7,5),base,0,0,0);
   const bk=add(head,new T.ConeGeometry(.14,o.beak+.25,5),mat(0x5a4636,0),0,-.04,hs+(o.beak+.25)/2-.1);bk.rotation.x=Math.PI/2;
   if(o.hook)add(head,new T.SphereGeometry(.07,5,4),mat(0x5a4636,0),0,-.1,hs+o.beak+.1);
   if(o.crest){for(let i=0;i<3;i++){const c=add(head,new T.ConeGeometry(.07,.42,4),mat(o.crest,0),-.08+i*.08,hs+.12,-.05+i*.02);c.rotation.z=-.4+i*.25;c.rotation.x=-.35}}
   parts.eyes=[add(head,new T.SphereGeometry(.07,8,6),DK,.2,.08,hs*.75),add(head,new T.SphereGeometry(.07,8,6),DK,-.2,.08,hs*.75)];
   [-.14,.14].forEach(x=>{add(g,new T.CylinderGeometry(.035,.035,.5,5),mat(0x5a4636,0),x,.3,.1);add(g,new T.BoxGeometry(.16,.04,.22),mat(0x5a4636,0),x,.05,.16)});
   collar(1.45,.3,.14);parts.cam={y:1.25,z:4.4,ly:1.1}
  }else if(plan==='roo'){
   add(g,new T.SphereGeometry(.72,7,5),base,0,.6,-.3,[1.2,.8,1]);
   const torso=add(g,new T.SphereGeometry(.5,7,5),base,0,1.35,.05,[.85,1.3,.8]);
   add(g,new T.SphereGeometry(.34,6,4),belly,0,1.2,.33,[.75,1.1,.55]);
   parts.tail=add(g,new T.CylinderGeometry(.1,.22,1.6,6),base,0,.35,-1.0);parts.tail.rotation.x=1.15;
   [-.42,.42].forEach(x=>{add(g,new T.SphereGeometry(.3,6,4),base,x,.42,.1,[.8,1,1.4]);add(g,new T.BoxGeometry(.2,.09,.62),belly,x,.08,.42)});
   [-.26,.26].forEach(x=>add(g,new T.CylinderGeometry(.06,.05,.55,5),base,x,1.25,.38));
   const head=new T.Group();head.position.set(0,2.2,.22);g.add(head);parts.head=head;
   add(head,new T.SphereGeometry(.34,7,5),base,0,0,0);
   const mz=add(head,new T.CylinderGeometry(.1,.2,.5,6),base,0,-.06,.38);mz.rotation.x=Math.PI/2;
   add(head,new T.DodecahedronGeometry(.07),DK,0,0,.62);
   [-.17,.17].forEach(x=>{const e=add(head,new T.ConeGeometry(.12,.52,4),base,x,.42,-.05,[1,1,.5]);e.rotation.z=x>0?-.2:.2;add(head,new T.ConeGeometry(.06,.3,4),earM,x,.38,.02,[1,1,.5]).rotation.z=x>0?-.2:.2});
   parts.eyes=[add(head,new T.SphereGeometry(.08,8,6),DK,.16,.1,.28),add(head,new T.SphereGeometry(.08,8,6),DK,-.16,.1,.28)];
   collar(1.85,.33,.2);parts.cam={y:1.5,z:5.2,ly:1.25}
  }else{ // quad, sitting like Muster
   const sq=o.squat?.75:1,stock=o.stocky||1;
   add(g,new T.SphereGeometry(.62,7,5),base,0,.5*sq,-.4,[1.15*stock,.8*sq,1]);
   add(g,new T.SphereGeometry(.5,7,5),base,0,.88*sq,.1,[.9*stock,1.1*sq,.85]);
   add(g,new T.SphereGeometry(.33,6,4),belly,0,.8*sq,.42,[.75,1,.55]);
   if(o.spikes)for(let i=0;i<11;i++){const a=(i/11)*Math.PI*1.15-.08;const sp=add(g,new T.ConeGeometry(.09,.62,4),mat(0xf2e8cc,0),Math.sin(a)*.52,.6+Math.cos(a)*.42,-.42);sp.lookAt(Math.sin(a)*4,1.8+Math.cos(a)*3.2,-2.2)}
   if(o.spots)for(let i=0;i<7;i++){const h2=hash(id+'s'+i);add(g,new T.SphereGeometry(.05,5,4),belly,((h2%100)/100-.5)*.9,.45+((h2>>3)%100)/100*.6,-.35+((h2>>6)%100)/100*.5)}
   if(o.bands)for(let i=0;i<4;i++)add(g,new T.BoxGeometry(.7,.05,.1),belly,0,.68+i*.1,-.55-i*.07);
   if(o.stripe)add(g,new T.BoxGeometry(.08,.9,.06),mat(o.stripe,0),0,.95,.47).rotation.x=-.15;
   [-.25,.25].forEach(x=>{add(g,new T.CylinderGeometry(.08,.1,.8*sq,6),base,x,.4*sq,.38);add(g,new T.SphereGeometry(.13,6,4),belly,x,.07,.5,[1,.5,1.5])});
   [-.46,.46].forEach(x=>add(g,new T.SphereGeometry(.15,6,4),belly,x,.07,.18,[1,.5,1.6]));
   if(o.tail==='long'){parts.tail=add(g,new T.CylinderGeometry(.05,.09,.9,6),base,.45,.35,-.8);parts.tail.rotation.z=-.9}
   else if(o.tail==='curl'){parts.tail=add(g,new T.TorusGeometry(.26,.06,6,12,Math.PI*1.5),base,.4,.6,-.75);parts.tail.rotation.y=.5}
   else if(o.tail==='brush'){parts.tail=add(g,new T.ConeGeometry(.14,.8,5),base,.45,.55,-.75);parts.tail.rotation.z=-1.1}
   else if(o.tail==='paddle'){parts.tail=add(g,new T.BoxGeometry(.34,.09,.7),mat(0x4a3a2c,0),0,.35,-.95);parts.tail.rotation.x=.15}
   else if(o.tail==='stub'){parts.tail=add(g,new T.SphereGeometry(.12,5,4),base,0,.55,-.85)}
   const hy=o.squat?1.15:1.55;
   const head=new T.Group();head.position.set(0,hy*sq+(o.stocky?.08:0),.3);g.add(head);parts.head=head;
   add(head,new T.SphereGeometry(.42,7,5),base,0,0,0,[1,.9,.95]);
   if(o.muzzle==='dog'){const b2=add(head,new T.CylinderGeometry(.09,.2,.5,6),base,0,.02,.45);b2.rotation.x=Math.PI/2;add(head,new T.SphereGeometry(.18,6,4),belly,0,-.08,.42,[1,.7,1.3]);add(head,new T.DodecahedronGeometry(.06),DK,0,.05,.72)}
   else if(o.muzzle==='long'){const b2=add(head,new T.CylinderGeometry(.06,.16,.62,6),base,0,-.02,.5);b2.rotation.x=Math.PI/2;add(head,new T.DodecahedronGeometry(.05),DK,0,.02,.82)}
   else if(o.muzzle==='needle'){const b2=add(head,new T.ConeGeometry(.09,.66,5),base,0,-.04,.56);b2.rotation.x=Math.PI/2;add(head,new T.DodecahedronGeometry(.04),DK,0,-.02,.9)}
   else if(o.muzzle==='bill'){add(head,new T.CylinderGeometry(.22,.26,.36,7),mat(0x3f3630,0),0,-.1,.5,[1.15,.35,1]);}
   else if(o.muzzle==='broad'){add(head,new T.SphereGeometry(.26,6,4),belly,0,-.12,.3,[1.1,.75,1]);add(head,new T.DodecahedronGeometry(.07),DK,0,.02,.5)}
   else if(o.muzzle==='nose'){add(head,new T.SphereGeometry(.17,6,4),DK,0,-.04,.4,[.85,1.25,.7])}
   else if(o.muzzle==='frog'){add(head,new T.SphereGeometry(.3,6,4),base,0,-.12,.25,[1.1,.6,1]);add(head,new T.BoxGeometry(.4,.03,.3),DK,0,-.14,.35)}
   else{add(head,new T.SphereGeometry(.2,6,4),belly,0,-.1,.3,[1,.8,1]);add(head,new T.DodecahedronGeometry(.055),DK,0,.02,.48)}
   const eo=o.eyeBig?.11:(o.eyeTop?.13:.085);
   const ey=o.eyeTop?[.3,.18]:[.17,.12];
   parts.eyes=[add(head,new T.SphereGeometry(eo,8,6),DK,ey[1]+.08,ey[0],o.eyeTop?.18:.3),add(head,new T.SphereGeometry(eo,8,6),DK,-(ey[1]+.08),ey[0],o.eyeTop?.18:.3)];
   if(o.ears==='point'){[-.22,.22].forEach(x=>{const e=add(head,new T.ConeGeometry(.14,.4,4),base,x,.42,-.02,[1,1,.55]);e.rotation.z=x>0?-.15:.15;add(head,new T.ConeGeometry(.07,.24,4),earM,x,.38,.04,[1,1,.5]).rotation.z=x>0?-.15:.15})}
   else if(o.ears==='long'){[-.18,.18].forEach(x=>{const e=add(head,new T.ConeGeometry(.11,.72,4),base,x,.6,-.06,[1,1,.45]);e.rotation.z=x>0?-.22:.22;add(head,new T.ConeGeometry(.055,.44,4),earM,x,.56,0,[1,1,.4]).rotation.z=x>0?-.22:.22})}
   else if(o.ears==='round'){[-.26,.26].forEach(x=>{add(head,new T.SphereGeometry(.14,6,4),base,x,.36,-.02,[1,1,.5]);add(head,new T.SphereGeometry(.08,5,4),earM,x,.34,.05,[1,1,.4])})}
   else if(o.ears==='fluff'){[-.34,.34].forEach(x=>{add(head,new T.SphereGeometry(.2,6,4),base,x,.26,-.04,[1,1,.55]);add(head,new T.SphereGeometry(.12,5,4),belly,x,.25,.04,[1,1,.45])})}
   else if(o.ears==='stub'){[-.22,.22].forEach(x=>add(head,new T.SphereGeometry(.09,5,4),base,x,.38,-.02,[1,1,.5]))}
   collar(hy*sq-.28,.34,.26);parts.cam={y:1.25,z:4.3,ly:1.0}
  }
  return parts;
 }
 /* shared offscreen renderer for stills */
 let srend=null;const cache={};
 function frame(parts,cam,yaw){ // 3/4 portrait, auto-framed on the model's bounds
  parts.g.rotation.y=yaw;
  const box=new T.Box3().setFromObject(parts.g),c=new T.Vector3(),sz=new T.Vector3();
  box.getCenter(c);box.getSize(sz);
  const r=Math.max(sz.x,sz.y,sz.z)*.62;
  const d=r/Math.tan((cam.fov*Math.PI/180)/2)*1.12;
  cam.position.set(c.x+Math.sin(.0)*0, c.y+r*.35, c.z+d);
  cam.lookAt(c.x,c.y+sz.y*.06,c.z);
 }
 function scene(parts){const sc=new T.Scene();
  sc.add(new T.HemisphereLight(0xffe9c9,0x2a2216,.95));
  const k=new T.DirectionalLight(0xfff2dc,1.15);k.position.set(2.5,4,4);sc.add(k);
  const r2=new T.DirectionalLight(0xffb15c,.5);r2.position.set(-3,2,-3);sc.add(r2);
  sc.add(parts.g);return sc}
 function still(id,family,size=192){
  const key=id+'|'+size;if(cache[key])return cache[key];
  try{
   if(!srend){srend=new T.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});srend.setPixelRatio(1)}
   srend.setSize(size,size);
   const parts=build(id,family),sc=scene(parts);
   const cam=new T.PerspectiveCamera(32,1,.1,40);
   frame(parts,cam,(hash(id)%2?1:-1)*.5);
   parts.head&&(parts.head.rotation.y=(hash(id)%2?-1:1)*.35);
   srend.render(sc,cam);
   const url=srend.domElement.toDataURL('image/png');
   sc.traverse(ob=>{if(ob.geometry)ob.geometry.dispose()});
   cache[key]=url;return url;
  }catch(e){return null}
 }
 /* the one live guest cam */
 const guest={rend:null,sc:null,cam:null,parts:null,home:null,raf:0,t:0,
  show(container,id,family){
   try{
    if(!this.rend){this.rend=new T.WebGLRenderer({antialias:true,alpha:true});this.rend.setPixelRatio(Math.min(devicePixelRatio||1,2));this.rend.setSize(160,160,false);this.rend.domElement.className='guestcam'}
    if(this.home)this.park();
    this.parts=build(id,family);this.sc=scene(this.parts);
    this.cam=new T.PerspectiveCamera(32,1,.1,40);
    frame(this.parts,this.cam,.35);
    container.insertBefore(this.rend.domElement,container.querySelector('b'));this.home=container;
    if(!this.raf)this.loop();
   }catch(e){}
  },
  park(){if(this.home){this.rend.domElement.remove();this.home=null}},
  loop(){const self=this;this.raf=requestAnimationFrame(()=>self.loop());
   if(!this.home||!this.sc)return;
   const t=(this.t+=.016),p=this.parts;
   p.g.position.y=Math.sin(t*1.6)*.03;
   if(p.head){p.head.rotation.y=.2+Math.sin(t*.8)*.12;p.head.rotation.x=Math.sin(t*1.3)*.05}
   if(p.tail)p.tail.rotation.y=Math.sin(t*9)*.3;
   p.wings.forEach((w,i)=>w.rotation.z=(i?-1:1)*(.15+Math.sin(t*10)*.12));
   if(p.eyes){const bl=(t%3.4)>3.25?.1:1;p.eyes.forEach(e=>e.scale.y=bl)}
   this.rend.render(this.sc,this.cam)}
 };
 const species=(family)=>((FAM[family]||[])[0]||'');
 return {ready:true,still,guest,species};
})();
