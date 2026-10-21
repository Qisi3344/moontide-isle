/* 月汐小岛 · sky.js — 天空、星星、月亮和灯光 */
"use strict";
// ---------- sky, stars, moon ----------
var DAY = { top: lc(0x8fc0ef), bot: lc(0xe4edf9), hemi: lc(0xd6e6ff), ground: lc(0xb9bfd0), dir: lc(0xfff6e8) };
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

var MOON_DIR = new THREE.Vector3(-0.55, 0.5, -0.67).normalize();
var SUN_DIR = new THREE.Vector3(0.65, 0.6, 0.45).normalize();
var moon = new THREE.Mesh(new THREE.PlaneGeometry(36, 36), new THREE.ShaderMaterial({
  uniforms: { uNight: nightU }, transparent: true, depthWrite: false, fog: false,
  vertexShader: "varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }",
  fragmentShader: "uniform float uNight; varying vec2 vUv; void main(){ vec2 p=vUv-.5; float d=length(p); float disc=smoothstep(.2,.19,d)*smoothstep(.17,.185,length(p-vec2(.085,.06))); float glow=smoothstep(.5,.15,d)*.25; vec3 c=mix(vec3(.75,.7,1.),vec3(1.,.96,.78),disc); gl_FragColor=vec4(c,(disc+glow*(1.-disc))*uNight); }"
}));
moon.position.copy(MOON_DIR).multiplyScalar(220);
scene.add(moon);

// ---------- lights ----------
var hemi = new THREE.HemisphereLight(DAY.hemi.clone(), DAY.ground.clone(), 0.45);
var sun = new THREE.DirectionalLight(DAY.dir.clone(), 1.4);
sun.position.copy(SUN_DIR).multiplyScalar(20);
scene.add(hemi, sun);
