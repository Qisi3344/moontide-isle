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
var scene = new THREE.Scene();
scene.fog = new THREE.Fog(lc(0xf4ebd6), 60, 140);
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
