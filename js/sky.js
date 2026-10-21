/* 月汐小岛 · sky.js — 天空、星星、月亮和灯光 */
"use strict";
// ---------- sky, stars, moon ----------
var DAY = { top: lc(0x8fc0ef), bot: lc(0xcfe0f5), hemi: lc(0xd6e6ff), ground: lc(0xb9bfd0), dir: lc(0xfff6e8) };
var NIGHT = { top: lc(0x141c4d), bot: lc(0x4a5aa8), hemi: lc(0x6d74c9), ground: lc(0x3a3f6e), dir: lc(0x9fb4ff) };
var skyU = { uTop: { value: DAY.top.clone() }, uBot: { value: DAY.bot.clone() } };
scene.add(new THREE.Mesh(new THREE.SphereGeometry(300, 32, 16), new THREE.ShaderMaterial({
  uniforms: skyU, side: THREE.BackSide, depthWrite: false, fog: false,
  vertexShader: "varying vec3 vP; varying vec3 vD; void main(){ vP=position; vec4 w=modelMatrix*vec4(position,1.); vD=w.xyz-cameraPosition; gl_Position=projectionMatrix*viewMatrix*w; }",
  // the moon lives in the sky shader (the open-source way, e.g. Nugget8/Three.js-Ocean-Scene): a disc + soft halo
  // around a fixed direction, seen from the camera, so it never drifts, sinks or floats over the island
  fragmentShader: [
    "uniform vec3 uTop,uBot,uMoon; uniform float uNight; varying vec3 vP; varying vec3 vD;",
    "float mh(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5); }",
    "float mn(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f); return mix(mix(mh(i),mh(i+vec2(1.,0.)),f.x),mix(mh(i+vec2(0.,1.)),mh(i+1.),f.x),f.y); }",
    "void main(){ float h=normalize(vP).y; vec3 col=mix(uBot,uTop,smoothstep(-0.02,0.55,h));",
    " vec3 d=normalize(vD); float th=sqrt(max(2.*(1.-dot(d,uMoon)),0.)); float R=0.042;",
    " vec3 t1=normalize(cross(uMoon,vec3(0.,1.,0.))); vec3 t2=cross(t1,uMoon); vec2 q=vec2(dot(d,t1),dot(d,t2))/R;",
    " float mare=smoothstep(0.5,0.78,mn(q*2.6+3.)*0.6+mn(q*5.5)*0.4);",
    " float disc=1.-smoothstep(R-0.003,R,th);",
    " vec3 mc=mix(vec3(1.,0.99,0.95),vec3(0.8,0.87,0.98),mare*0.5+smoothstep(0.6,1.,length(q))*0.2);",
    " float o=max(th-R,0.); float glow=(exp(-o*32.)*0.3+exp(-o*7.)*0.1)*(1.-disc);",
    " float k=mix(0.22,1.,uNight);",
    " col=mix(col,mc,disc*k); col+=vec3(0.62,0.78,1.)*glow*k*uNight;",
    " gl_FragColor=vec4(col,1.);",
    "#include <encodings_fragment>",
    "}"].join("\n")
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
skyU.uMoon = { value: MOON_SKY }; skyU.uNight = nightU; // moon is drawn by the sky shader above
function placeMoon() {}
function updateMoon() {}

// ---------- lights ----------
var hemi = new THREE.HemisphereLight(DAY.hemi.clone(), DAY.ground.clone(), 0.45);
var sun = new THREE.DirectionalLight(DAY.dir.clone(), 1.4);
sun.position.copy(SUN_DIR).multiplyScalar(20);
scene.add(hemi, sun);
