/* 月汐小岛 · sea.js — 果冻海、海床、戳一戳的涟漪 */
"use strict";
// ---------- jelly sea + seabed ----------
var bed = new THREE.Mesh(new THREE.CircleGeometry(90, 48), new THREE.MeshStandardMaterial({ color: lc(0xc4cbd8), roughness: 1 }));
bed.rotation.x = -Math.PI / 2; bed.position.y = -1.28; scene.add(bed);

var rip = []; for (var r = 0; r < 6; r++) rip.push(new THREE.Vector4(0, 0, -99, 0));
var seaU = {
  uTime: timeU, uNight: nightU, uRip: { value: rip }, uWave: { value: reduce ? 0.35 : 1 },
  uSun: { value: SUN_DIR.clone() }, uFog: { value: DAY.bot.clone() }, uSky: { value: DAY.top.clone() },
  // pre-blend colors so the sea over the sand reads mint #7FD8CB near shore, #3FA6BC outside
  uShallow: { value: lc(0x4fe0e0) }, uDeep: { value: lc(0x1f63c0) }
};
var seaG = new THREE.RingGeometry(0.001, 42, 180, 90);
(function densify() {
  var p = seaG.attributes.position;
  for (var k = 0; k < p.count; k++) {
    var x = p.getX(k), y = p.getY(k), d = Math.hypot(x, y); if (d < 1e-4) continue;
    var nd = 42 * Math.pow(d / 42, 1.7); p.setXY(k, x / d * nd, y / d * nd);
  }
})();
seaG.rotateX(-Math.PI / 2);
var sea = new THREE.Mesh(seaG, new THREE.ShaderMaterial({
  uniforms: seaU, transparent: true, depthWrite: false,
  vertexShader: [
    "uniform float uTime,uWave; uniform vec4 uRip[6]; varying vec3 vW; varying vec3 vN;",
    "float insideV(vec2 p){ return min(5.0-length(p),length(p-vec2(2.4,0.))-3.3); }",
    "float H(vec2 p){ float t=uTime;",
    " float far=smoothstep(4.,14.,length(p)); float calm=mix(0.25,1.,smoothstep(0.,2.5,0.12-min(5.0-length(p),length(p-vec2(2.4,0.))-2.95))); // swells settle over the shallow beach (2026-10-23)",
    " float h=calm*uWave*(0.07*sin(0.45*p.x+0.8*t)+0.06*sin(0.38*p.y-0.65*t+1.3)+0.045*sin(0.3*(p.x+p.y)+1.1*t)+far*(0.06*sin(0.9*p.x-0.6*p.y+1.6*t)+0.035*sin(1.7*p.y+0.8*p.x-2.1*t)));",
    " for(int i=0;i<6;i++){ vec4 r=uRip[i]; float a=t-r.z;",
    "  if(r.w>0.0 && a>0.0 && a<7.0){ float d=distance(p,r.xy);",
    "   float front=smoothstep(a*3.2+0.8,a*3.2-0.8,d);",
    "   h+=r.w*0.3*exp(-0.85*a)*exp(-0.16*d)*sin(7.0*a-2.3*d)*front;",
    "   h-=r.w*0.38*exp(-2.0*a)*cos(9.0*a)*exp(-d*d*0.7); } }",
    " return h; }",
    "void main(){ vec4 w=modelMatrix*vec4(position,1.); vec2 p=w.xz; float e=0.15; float h=H(p);",
    " vN=normalize(vec3(H(p-vec2(e,0.))-H(p+vec2(e,0.)),2.0*e,H(p-vec2(0.,e))-H(p+vec2(0.,e))));",
    " w.y+=h; vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }"
  ].join("\n"),
  fragmentShader: [
    "uniform float uTime,uNight; uniform vec3 uSun,uFog,uSky,uShallow,uDeep; varying vec3 vW; varying vec3 vN;",
    "float inside(vec2 p){ return min(5.0-length(p),length(p-vec2(2.4,0.))-3.3); }",
    BEACH_GLSL,
    "void main(){ vec3 n=normalize(vN); vec3 v=normalize(cameraPosition-vW); float r=length(vW.xz);",
    " float s=max(0.,0.12-beachD(vW.xz)); float dep=vW.y-beachY(beachD(vW.xz)); // real water depth over the sloped sand (2026-10-23)",
    " float lag=(1.-smoothstep(2.4,3.6,length(vW.xz-vec2(2.4,0.))))*(1.-smoothstep(4.4,5.6,length(vW.xz))); float sd=s*(1.-0.25*lag);",
    " vec3 c=mix(uShallow,uDeep,smoothstep(0.15,2.2,sd)); c=mix(c,vec3(0.008,0.0497,0.2542),smoothstep(4.,18.,sd)*0.75);",
    " float dif=max(dot(n,uSun),0.);",
    " c*=(0.62+0.38*dif)*mix(vec3(1.),vec3(0.18,0.23,0.56),uNight);",
    " vec3 hv=normalize(uSun+v); float sp=pow(max(dot(n,hv),0.),110.)*1.5+pow(max(dot(n,hv),0.),14.)*0.18;",
    " float fr=pow(1.-max(dot(n,v),0.),3.);",
    " c+=fr*mix(0.15,0.3,uNight)*mix(uSky,vec3(0.5,0.65,1.),uNight);",
    " float wob=sin(atan(vW.z,vW.x)*14.+uTime*1.4)*0.08;",
    " float clear=1.-smoothstep(0.0,0.3+wob,dep); // shallow water over the real sand goes clear aqua (was a painted pale band till 2026-10-23)",
    " c=mix(c,mix(uShallow,vec3(0.75,0.95,0.92),0.55)*mix(1.,0.45,uNight),clear*0.6);",
    " float ang=atan(vW.z,vW.x); float wv=0.05*sin(ang*9.+uTime*1.7)+0.03*sin(ang*23.-uTime*2.3);",
    " float lip=1.-smoothstep(0.0,0.035+0.02*wv/0.08,dep); // foam where the sea actually touches the sand",
    " float ph=fract(uTime*0.22+0.15*sin(ang*5.)); float rw=0.3+ph*0.55; float ring=(1.-smoothstep(0.0,0.05,abs(s-rw)))*(1.-ph)*smoothstep(0.0,0.15,ph);",
    " float fl=max(lip*0.85,ring*0.55); c=mix(c,vec3(1.,0.98,0.94)*mix(1.,0.6,uNight),fl);",
    " c+=vec3(0.2,1.,0.7)*uNight*(0.12+0.05*sin(uTime*0.8+r*0.45))*(1.-0.6*smoothstep(2.,20.,s));",
    " c+=mix(vec3(1.,0.82,0.6),vec3(1.),uNight)*sp*mix(1.,0.7,uNight);",
    " float a=mix(0.78,0.97,smoothstep(0.,3.,s)); a=mix(a,0.32,clear); a=max(a,fl); a=max(a,min(sp,1.));",
    " c=mix(c,uFog,smoothstep(22.,38.,r)); a*=1.-smoothstep(28.,41.,r);",
    " gl_FragColor=vec4(c,a);",
    "#include <encodings_fragment>",
    "}"
  ].join("\n")
}));
sea.renderOrder = 2;
// the ring's radial segments all meet at its centre; at the world origin that fan of slivers sat in the lagoon shallows
// and showed as a radial 'bow-tie' once the water there went clear (2026-10-23). Centre it under the solid west of the
// island (the house clearing) instead, where no water is visible.
sea.position.x = -3.05;
scene.add(sea);

// ---------- tap ripple ----------
var down = null, rc = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit = new THREE.Vector3(), ripI = 0;
var el = renderer.domElement;
el.addEventListener("pointerdown", function (e) { down = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId, multi: !!down }; });
el.addEventListener("pointerup", function (e) {
  if (!down || down.id !== e.pointerId) { down = null; return; }
  var moved = Math.hypot(e.clientX - down.x, e.clientY - down.y), dt = performance.now() - down.t, multi = down.multi;
  down = null;
  if (multi || moved > 10 || dt > 350) return;
  var b = el.getBoundingClientRect();
  ndc.set((e.clientX - b.left) / b.width * 2 - 1, -((e.clientY - b.top) / b.height) * 2 + 1);
  rc.setFromCamera(ndc, camera);
  var hits = rc.intersectObjects(tapTargets, true).filter(function (h) { // raycaster also hits hidden meshes (workshop hides most of the island)
    if (!h.object.isMesh) return false; // petals/sparkle Points have a 1-unit pick radius: they made the whole yard "the house"
    for (var o = h.object; o; o = o.parent) if (!o.visible) return false; return true; });
  if (hits.length && hits[0].object.userData.spot) { poke(hits[0].object.userData.spot); return; }
  if (!rc.ray.intersectPlane(plane, hit)) return;
  if (Math.hypot(hit.x, hit.z) > 34 || beachD(hit.x, hit.z) > -0.15) return;
  rip[ripI].set(hit.x, hit.z, timeU.value, 1);
  ripI = (ripI + 1) % 6;
});
el.addEventListener("pointercancel", function () { down = null; });
