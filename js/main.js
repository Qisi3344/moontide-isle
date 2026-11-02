/* 月汐小岛 · main.js — 画面尺寸、提示文字、动画循环、对外接口 window.Island */
"use strict";
// ---------- sizing ----------
var baseDist = 30;
function fit() {
  var w = stage.clientWidth || innerWidth, h = stage.clientHeight || innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h; camera.updateProjectionMatrix();
  var vf = THREE.MathUtils.degToRad(camera.fov), hf = 2 * Math.atan(Math.tan(vf / 2) * camera.aspect);
  baseDist = Math.max(6.4 / Math.tan(hf / 2), 7.5 / Math.tan(vf / 2));
  controls.minDistance = baseDist * 0.12; controls.maxDistance = baseDist * 1.3; // 2026-10-23: zoom in close to the 家机
  scene.fog.near = baseDist + 18; scene.fog.far = Math.min(baseDist + 60, 85); // seabed edge (r 90) fully in haze: no hard horizon line
  placeMoon();
}
fit();
var sph = new THREE.Spherical(baseDist, THREE.MathUtils.degToRad(56), THREE.MathUtils.degToRad(62));
camera.position.setFromSpherical(sph).add(TARGET);
controls.update();
addEventListener("resize", function () {
  var d = camera.position.distanceTo(controls.target) / baseDist;
  fit();
  var off = camera.position.clone().sub(controls.target).setLength(THREE.MathUtils.clamp(d, 0.12, 1.3) * baseDist);
  camera.position.copy(controls.target).add(off);
});

// ---------- hint ----------
var hint = document.getElementById("hint");
setTimeout(function () { hint.classList.add("is-gone"); }, 5000);
el.addEventListener("pointerdown", function () { setTimeout(function () { hint.classList.add("is-gone"); }, 1500); }, { once: true });

// ---------- shadows (2026-10-21: day read flat and washed out; stylized game islands use one shadow-casting key
// light + a tinted hemisphere fill so shade reads blue instead of grey) ----------
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
(function (c) { c.left = -7.5; c.right = 7.5; c.top = 7.5; c.bottom = -7.5; c.near = 2; c.far = 45; c.updateProjectionMatrix(); })(sun.shadow.camera);
sun.shadow.bias = -0.0015; sun.shadow.normalBias = 0.06; // grazing sun on walls: no acne stripes
scene.traverse(function (o) {
  if (!o.isMesh || o === sea) return;
  var m = Array.isArray(o.material) ? o.material[0] : o.material;
  if (!m || m.transparent || m.isMeshBasicMaterial || m.isShaderMaterial) return;
  // thin grass/flower strips made long stripe shadows down the cliff walls under the low sun (2026-10-21)
  o.castShadow = !(o.material === grassBladeM || o.material === grassFlowerM || o.material === starPinkM); o.receiveShadow = true;
});

// ---------- loop ----------
var clock = new THREE.Clock();
applyNight(0);
renderer.setAnimationLoop(function () {
  var dt = Math.min(clock.getDelta(), 0.05);
  timeU.value += dt;
  if (nightT !== nightTarget) {
    var step = dt / 1.5;
    nightT = nightTarget > nightT ? Math.min(nightTarget, nightT + step) : Math.max(nightTarget, nightT - step);
    applyNight(nightT * nightT * (3 - 2 * nightT));
  }
  controls.update();
  updateMoon();
  updateSpots(timeU.value, nightU.value);
  updateMagic(dt, timeU.value, nightU.value);
  if (typeof updateBeachLife === 'function') updateBeachLife(timeU.value);
  updateLamps(timeU.value, nightU.value);
  updateHouse(timeU.value, nightU.value);
  renderer.render(scene, camera);
});

// ---------- public API ----------
window.Island = {
  scene: scene, camera: camera, controls: controls, renderer: renderer,
  setNight: setNight, height: height, inside: inside,
  spots: {
    clawd: (function (q) { return new THREE.Vector3(q[0], height(q[0], q[1]), q[1]); })(polar(59, 4.1)),
    wolf: (function (q) { return new THREE.Vector3(q[0], height(q[0], q[1]), q[1]); })(polar(303, 4.68)),
    owl: owlPerch,
    house: new THREE.Vector3(CX + 0.8, HC, 0.4)
  },
  magic: { rocks: fRocks, crystal: crystal, jellies: jellies },
  lamps: { group: lampsG, pier: pier }
};

// ---------- free camera (2026-10-23, 她要镜头能压低、能拉近、能挪) ----------
// two-finger drag pans; the look-at point stays over the island and the camera moves with it.
controls.enablePan = true; controls.screenSpacePanning = false;
controls.maxPolarAngle = THREE.MathUtils.degToRad(84);
var PAN_BOX = { r: 7.5, y0: -0.2, y1: 3 }, _pt = new THREE.Vector3();
function clampPan() {
  if (typeof IN_WORKSHOP !== "undefined" && IN_WORKSHOP) { PAN_BOX.cx = CX; PAN_BOX.cz = 0; PAN_BOX.r = CR + 0.9; PAN_BOX.y0 = HC + 0.05; PAN_BOX.y1 = HC + 1.3; }
  var t = controls.target, cx = PAN_BOX.cx || 0, cz = PAN_BOX.cz || 0;
  _pt.copy(t);
  var dx = t.x - cx, dz = t.z - cz, d = Math.hypot(dx, dz);
  if (d > PAN_BOX.r) { t.x = cx + dx / d * PAN_BOX.r; t.z = cz + dz / d * PAN_BOX.r; }
  t.y = Math.min(PAN_BOX.y1, Math.max(PAN_BOX.y0, t.y));
  camera.position.add(_pt.sub(t).negate());
}
controls.addEventListener("change", clampPan);
