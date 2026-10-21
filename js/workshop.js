/* 月汐小岛 · workshop.js — 小房子工坊：把小房子和小院从岛上单拎出来，放在一块悬浮小圆台上慢慢打磨 */
"use strict";
// Only loaded by house.html. Everything else on the island is hidden; the house, the clearing paving,
// its ring stones, and the trees / grass / lamps standing on the clearing level stay, so whatever we
// polish here in house.js goes straight back onto the island.
var YC = new THREE.Vector3(CX, HC, 0), YR = CR + 0.95;   // yard centre + radius of the little plinth
function nearYard(o) {
  var p = o.getWorldPosition(new THREE.Vector3());
  return Math.hypot(p.x - YC.x, p.z - YC.z) < YR - 0.15 && Math.abs(p.y - HC) < 0.12;
}
// keep only the pieces that stand on the yard; hide the rest
[props, spotsG, lampsG, magicG].forEach(function (g) {
  g.children.forEach(function (o) { if (o !== ring && !nearYard(o)) o.visible = false; });
});
lampsG.children.forEach(function (o) { if (o.isLight) o.visible = true; });
islandMesh.children.forEach(function (o) { if (o !== clearing) o.visible = false; });
sea.visible = false; bed.visible = false;
if (typeof pier !== "undefined") pier.visible = false;

// ---- the little floating plinth: a grass top over a rounded moonstone rock ----
var plinth = new THREE.Group(); plinth.position.copy(YC); scene.add(plinth);
var pTop = new THREE.Mesh(new THREE.CylinderGeometry(YR, YR - 0.05, 0.14, 48), toonMat(0x77b58a));
pTop.position.y = -0.07; plinth.add(pTop);
var pRock = new THREE.Mesh(rockGeo(1, 9.3, 0.9, 0.25), rockVM);
pRock.geometry.computeBoundingBox();
pRock.scale.set(YR * 0.97, 1, YR * 0.97); pRock.position.y = -0.13 - pRock.geometry.boundingBox.max.y; plinth.add(pRock);
var pTip = new THREE.Mesh(rockGeo(0.5, 2.1, 1.3), rockVM); pTip.position.y = pRock.position.y - 0.75; plinth.add(pTip);

// ---- camera: orbit around the house, closer, and allowed to look from the side ----
TARGET.set(CX + 0.05, HC + 0.55, 0.02);
controls.target.copy(TARGET);
controls.minPolarAngle = THREE.MathUtils.degToRad(15);
controls.maxPolarAngle = THREE.MathUtils.degToRad(84);
controls.autoRotateSpeed = 0.5;
fit = function () {
  var w = stage.clientWidth || innerWidth, h = stage.clientHeight || innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h; camera.updateProjectionMatrix();
  var vf = THREE.MathUtils.degToRad(camera.fov), hf = 2 * Math.atan(Math.tan(vf / 2) * camera.aspect);
  baseDist = Math.max(2.3 / Math.tan(hf / 2), 2.0 / Math.tan(vf / 2));
  controls.minDistance = baseDist * 0.4; controls.maxDistance = baseDist * 1.5;
  scene.fog.near = 40; scene.fog.far = 160;
};
fit();
camera.position.setFromSpherical(new THREE.Spherical(baseDist, THREE.MathUtils.degToRad(66), THREE.MathUtils.degToRad(70))).add(TARGET);
controls.update();
houseSpot.anchor.set(CX - 0.18, HC + 1.75, 0.05);
if (window.Island) window.Island.workshop = { plinth: plinth };
