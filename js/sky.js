/* 月汐小岛 · sky.js — 天空、星星、月亮和灯光 */
"use strict";
// ---------- sky, stars, moon ----------
var DAY = { top: lc(0x8fc0ef), bot: lc(0xcfe0f5), hemi: lc(0xd6e6ff), ground: lc(0xb9bfd0), dir: lc(0xfff6e8) };
var NIGHT = { top: lc(0x141c4d), bot: lc(0x4a5aa8), hemi: lc(0x6d74c9), ground: lc(0x3a3f6e), dir: lc(0x9fb4ff) };
var skyU = { uTop: { value: DAY.top.clone() }, uBot: { value: DAY.bot.clone() } };
scene.add(new THREE.Mesh(new THREE.SphereGeometry(300, 32, 16), new THREE.ShaderMaterial({
  uniforms: skyU, side: THREE.BackSide, depthWrite: false, fog: false,
  vertexShader: "varying vec3 vP; void main(){ vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }",
  fragmentShader: "uniform vec3 uTop,uBot; varying vec3 vP; void main(){ float h=normalize(vP).y; gl_FragColor=vec4(mix(uBot,uTop,smoothstep(-0.02,0.55,h)),1.); \n#include <encodings_fragment>\n}"
})));

var timeU = { value: 0 }, nightU = { value: 0 };
(function stars() {
  var n = 420, pos = new Float32Array(n * 3), ph = new Float32Array(n);
  for (var k = 0; k < n; k++) {
    var th = Math.random() * Math.PI * 2, y = 0.08 + Math.random() * 0.92, r = Math.sqrt(1 - y * y);
    pos[k * 3] = Math.cos(th) * r * 250; pos[k * 3 + 1] = y * 250; pos[k * 3 + 2] = Math.sin(th) * r * 250; ph[k] = Math.random() * 6.28;
  }
  var g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("aPh", new THREE.BufferAttribute(ph, 1));
  scene.add(new THREE.Points(g, new THREE.ShaderMaterial({
    uniforms: { uTime: timeU, uNight: nightU, uTw: { value: reduce ? 0.2 : 1.0 } }, transparent: true, depthWrite: false, fog: false,
    vertexShader: "attribute float aPh; uniform float uTime,uTw; varying float vA; void main(){ vA=0.55+0.45*sin(uTime*(1.2+fract(aPh)*2.)*uTw+aPh*7.); gl_PointSize=(1.5+fract(aPh*3.7)*2.5)*(1.+vA*0.6); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }",
    fragmentShader: "uniform float uNight; varying float vA; void main(){ float d=length(gl_PointCoord-.5); float a=smoothstep(.5,.0,d)*vA*uNight; gl_FragColor=vec4(1.,.97,.88,a); }"
  })));
})();

var MOON_AZ = THREE.MathUtils.degToRad(62) + Math.PI + 0.32; // bearing in atan2(x, z) terms, ahead-left of the start view
var MOON_EL = THREE.MathUtils.degToRad(9), MOON_LIGHT_EL = THREE.MathUtils.degToRad(38);
var MOON_SKY = new THREE.Vector3(Math.sin(MOON_AZ) * Math.cos(MOON_EL), Math.sin(MOON_EL), Math.cos(MOON_AZ) * Math.cos(MOON_EL));
var MOON_DIR = new THREE.Vector3(Math.sin(MOON_AZ) * Math.cos(MOON_LIGHT_EL), Math.sin(MOON_LIGHT_EL), Math.cos(MOON_AZ) * Math.cos(MOON_LIGHT_EL));
var SUN_DIR = new THREE.Vector3(0.65, 0.6, 0.45).normalize();
// The moon (she asked for one with a soft glow, 2026-10-21). It hangs in a fixed spot in the sky like a skybox:
// re-centred on the camera every frame (no parallax, never drifts with the view), a little above the horizon,
// on bearing MOON_AZ. The night light (MOON_DIR) comes from that same bearing, higher up, so the island is lit
// and the sea glints from the moon's side. Pale moon-white + blue halo, no purple. Faint by day, glowing at night.
var moonU = { uNight: nightU, uTime: timeU };
var moon = new THREE.Mesh(new THREE.PlaneGeometry(72, 72), new THREE.ShaderMaterial({
  uniforms: moonU, transparent: true, depthWrite: false, fog: false,
  vertexShader: "varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }",
  fragmentShader: [
    "uniform float uNight,uTime; varying vec2 vUv;",
    "float h(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5); }",
    "float n(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+1.),f.x),f.y); }",
    "void main(){ vec2 p=vUv-.5; float d=length(p), R=.115;",
    "  float disc=smoothstep(R,R-.006,d);",
    "  float mare=n(p*26.+3.)*.6+n(p*55.)*.4; mare=smoothstep(.5,.75,mare);",
    "  float rim=smoothstep(R*.55,R,d);",
    "  vec3 c=mix(vec3(1.,.99,.95),vec3(.82,.88,.98),mare*.55+rim*.25);",
    "  float pulse=1.+.06*sin(uTime*.8);",
    "  float glow=(exp(-(d-R)*14.)*.55+exp(-(d-R)*5.)*.25)*step(R-.006,d)*pulse;",
    "  float k=mix(.32,1.,uNight);",
    "  vec3 gc=mix(vec3(.85,.92,1.),vec3(.72,.85,1.),clamp((d-R)*3.,0.,1.));",
    "  vec3 col=mix(gc,c,disc); float a=(disc+glow*(1.-disc))*k*smoothstep(.5,.4,d);",
    "  gl_FragColor=vec4(col,a);",
    "#include <encodings_fragment>",
    "}"].join("\n")
}));
moon.renderOrder = 999; // drawn last: depth-tested against the island, over the far sea
scene.add(moon);
function placeMoon() { // called from fit(): a touch smaller on narrow phone screens
  moon.scale.setScalar(Math.min(1, camera.aspect * 0.75 + 0.3));
}
function updateMoon() { // every frame: same sky direction, centred on the camera
  moon.position.copy(camera.position).addScaledVector(MOON_SKY, 250);
  moon.lookAt(camera.position);
}

// ---------- lights ----------
var hemi = new THREE.HemisphereLight(DAY.hemi.clone(), DAY.ground.clone(), 0.45);
var sun = new THREE.DirectionalLight(DAY.dir.clone(), 1.4);
sun.position.copy(SUN_DIR).multiplyScalar(20);
scene.add(hemi, sun);
