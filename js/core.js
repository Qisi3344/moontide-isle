/* 月汐小岛 · core.js — 渲染器、场景、相机、视角控制、小工具函数 */
"use strict";
var renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.85;
stage.appendChild(renderer.domElement);
// every sRGB hex goes through lc() so it is linear under sRGB output
function lc(hex) { return new THREE.Color(hex).convertSRGBToLinear(); }
// ---------- toon (三渲二) materials ----------
// three soft light bands like anime games (shadow / mid / lit), plus a cool rim light on silhouettes
var toonGrad = (function () {
  var v = [150, 210, 255], d = new Uint8Array(12);
  for (var i = 0; i < 3; i++) { d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v[i]; d[i * 4 + 3] = 255; }
  var t = new THREE.DataTexture(d, 3, 1, THREE.RGBAFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter; t.generateMipmaps = false; t.needsUpdate = true;
  return t;
})();
var rimU = { value: 0.22 };
function toonMat(hex) {
  var m = new THREE.MeshToonMaterial({ color: lc(hex), gradientMap: toonGrad });
  m.onBeforeCompile = function (sh) {
    sh.uniforms.uRim = rimU;
    sh.fragmentShader = "uniform float uRim;\n" + sh.fragmentShader.replace("#include <output_fragment>",
      "float rimF = 1.0 - abs(dot(normalize(normal), normalize(vViewPosition)));\n" +
      "outgoingLight += vec3(0.8, 0.88, 1.0) * smoothstep(0.62, 0.8, rimF) * uRim;\n#include <output_fragment>");
  };
  return m;
}
var scene = new THREE.Scene();
scene.fog = new THREE.Fog(lc(0xe4edf9), 60, 140);
var camera = new THREE.PerspectiveCamera(45, 1, 0.1, 600);
var TARGET = new THREE.Vector3(-0.8, 0.4, 0);
var controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.target.copy(TARGET);
controls.enableDamping = true; controls.dampingFactor = 0.08;
controls.enablePan = false;
controls.minPolarAngle = THREE.MathUtils.degToRad(25);
controls.maxPolarAngle = THREE.MathUtils.degToRad(70);
controls.rotateSpeed = 0.7;
controls.autoRotate = !reduce; controls.autoRotateSpeed = 0.35;
var idleTimer = null;
controls.addEventListener("start", function () { controls.autoRotate = false; clearTimeout(idleTimer); });
controls.addEventListener("end", function () {
  clearTimeout(idleTimer);
  if (!reduce) idleTimer = setTimeout(function () { controls.autoRotate = true; }, 6000);
});

function ss(a, b, x) { var t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
function lerp(a, b, t) { return a + (b - a) * t; }

// rounded box (2026-10-23: she wanted the lamp pillars and the house's straight edges softer).
// Extruded rounded rectangle + a bevel of the same size: every edge and corner gets a soft radius r.
function rbox(w, h, d, r) {
  r = Math.min(r, w * 0.45, h * 0.45, d * 0.45);
  var b = r * 0.6, rc = r * 0.4, x = w / 2 - b, z = d / 2 - b, s = new THREE.Shape();
  s.moveTo(-x + rc, -z); s.lineTo(x - rc, -z); s.quadraticCurveTo(x, -z, x, -z + rc);
  s.lineTo(x, z - rc); s.quadraticCurveTo(x, z, x - rc, z); s.lineTo(-x + rc, z);
  s.quadraticCurveTo(-x, z, -x, z - rc); s.lineTo(-x, -z + rc); s.quadraticCurveTo(-x, -z, -x + rc, -z);
  var g = new THREE.ExtrudeGeometry(s, { depth: Math.max(1e-4, h - 2 * b), bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 3, curveSegments: 4 });
  g.rotateX(-Math.PI / 2); g.translate(0, -(h - 2 * b) / 2, 0); g.computeVertexNormals();
  return g;
}
