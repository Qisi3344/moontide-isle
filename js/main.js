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
  controls.minDistance = baseDist * 0.6; controls.maxDistance = baseDist * 1.3;
  scene.fog.near = baseDist + 25; scene.fog.far = baseDist + 110;
  placeMoon();
}
fit();
var sph = new THREE.Spherical(baseDist, THREE.MathUtils.degToRad(56), THREE.MathUtils.degToRad(62));
camera.position.setFromSpherical(sph).add(TARGET);
controls.update();
addEventListener("resize", function () {
  var d = camera.position.distanceTo(controls.target) / baseDist;
  fit();
  var off = camera.position.clone().sub(controls.target).setLength(THREE.MathUtils.clamp(d, 0.6, 1.3) * baseDist);
  camera.position.copy(controls.target).add(off);
});

// ---------- hint ----------
var hint = document.getElementById("hint");
setTimeout(function () { hint.classList.add("is-gone"); }, 5000);
el.addEventListener("pointerdown", function () { setTimeout(function () { hint.classList.add("is-gone"); }, 1500); }, { once: true });

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
  updateSpots(timeU.value, nightU.value);
  updateMagic(dt, timeU.value, nightU.value);
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
