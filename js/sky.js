/* 月汐小岛 · sky.js — 天空、星星、月亮和灯光 */
"use strict";
// ---------- sky, stars, moon ----------
// Day = a low golden-hour sun (2026-10-21: she wanted day to feel like just-after-sunrise / sunset glow, not noon; the isle
// isn't on Earth anyway). Apricot horizon, soft blue zenith, warm gold key light, cool blue shade. No purple.
var DAY = { top: lc(0x7ea6d6), bot: lc(0xf6c7a2), hemi: lc(0xc9d0e8), ground: lc(0x8e98bc), dir: lc(0xffc58e) };
var NIGHT = { top: lc(0x141c4d), bot: lc(0x4a5aa8), hemi: lc(0x6d74c9), ground: lc(0x355f9e), dir: lc(0x9fb4ff) };
var timeU = { value: 0 }, nightU = { value: 0 };
var SUN_DIR = new THREE.Vector3(0.14, 0.36, -0.99).normalize(); // low sun off to the right of the default view: side light, long shadows
var skyU = { uTop: { value: DAY.top.clone() }, uBot: { value: DAY.bot.clone() }, uSunD: { value: SUN_DIR }, uNight: nightU };
scene.add(new THREE.Mesh(new THREE.SphereGeometry(300, 32, 16), new THREE.ShaderMaterial({
  uniforms: skyU, side: THREE.BackSide, depthWrite: false, fog: false,
  vertexShader: "varying vec3 vP; void main(){ vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }",
  fragmentShader: "uniform vec3 uTop,uBot,uSunD; uniform float uNight; varying vec3 vP; void main(){ vec3 d=normalize(vP); float h=d.y; vec3 c=mix(uBot,uTop,smoothstep(-0.02,0.55,h)); float g=max(dot(d,uSunD),0.); c+=(1.-uNight)*(vec3(1.,0.62,0.36)*pow(g,5.)*0.38*(1.-smoothstep(0.,0.6,h))+vec3(1.,0.86,0.66)*pow(g,90.)*0.9); gl_FragColor=vec4(c,1.); \n#include <encodings_fragment>\n}"
})));

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

var MOON_DIR = new THREE.Vector3(-0.55, 0.5, -0.67).normalize(); // night light: back to the original direction (she preferred it, 2026-10-21)
// No moon for now (2026-10-21): the sky-shader moon + glitter path read like a snowflake biscuit; she asked for the original light.
function placeMoon() {}
function updateMoon() {}

// ---------- a few soft clouds far out (2026-10-21: the sky felt like a flat strip) ----------
var cloudTex = (function () {
  var c = document.createElement("canvas"); c.width = 256; c.height = 128;
  var x = c.getContext("2d");
  if (x && x.createRadialGradient) {
    var rs = 5; function R() { rs = (rs * 9301 + 49297) % 233280; return rs / 233280; }
    for (var i = 0; i < 14; i++) {
      var px = 40 + R() * 176, py = 60 + (R() - 0.5) * 30, r = 22 + R() * 30, g = x.createRadialGradient(px, py, 0, px, py, r);
      g.addColorStop(0, "rgba(255,255,255,0.55)"); g.addColorStop(1, "rgba(255,255,255,0)");
      x.fillStyle = g; x.beginPath(); x.arc(px, py, r, 0, 6.3); x.fill();
    }
  }
  var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t;
})();
var cloudM = new THREE.SpriteMaterial({ map: cloudTex, color: lc(0xfff0e4), transparent: true, opacity: 0.85, depthWrite: false, fog: false });
[[-150, 0.10, 46], [-110, 0.14, 38], [-70, 0.08, 52], [-30, 0.12, 40], [20, 0.09, 48], [70, 0.13, 36], [140, 0.1, 44], [200, 0.11, 50]].forEach(function (d) {
  var a = THREE.MathUtils.degToRad(d[0]), sp = new THREE.Sprite(cloudM);
  sp.position.set(Math.cos(a) * 160 * (1 - d[1]), 160 * d[1] + 6, Math.sin(a) * 160 * (1 - d[1]));
  sp.scale.set(d[2], d[2] * 0.32, 1); sp.renderOrder = -1; scene.add(sp);
});

// ---------- lights ----------
var hemi = new THREE.HemisphereLight(DAY.hemi.clone(), DAY.ground.clone(), 0.45);
var sun = new THREE.DirectionalLight(DAY.dir.clone(), 1.4);
sun.position.copy(SUN_DIR).multiplyScalar(20);
scene.add(hemi, sun);
