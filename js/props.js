/* 月汐小岛 · props.js — 白石圈、月白花树、深蓝小松、灌木、海中礁石 */
"use strict";
// ---------- props: stones, moon-blossom trees, pines, bushes, sea stacks ----------
var props = new THREE.Group(); scene.add(props);
function mat(hex) { return toonMat(hex); }
var stoneM = mat(0xdcdfe8), trunkM = mat(0x857b84), bloomM = [mat(0xf1f3fb), mat(0xdbe4f6)], pineM = mat(0x2f5d6e), pineM2 = mat(0x3a6d7c), bushM = [mat(0x5c9c7a), mat(0x6aa986)], stackM = mat(0x9ea2b5);
var ring = new THREE.Group(); ring.position.set(CX, HC, 0); props.add(ring);
for (var s = 0; s < 12; s++) {
  var a = s / 12 * Math.PI * 2, st = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.2, 0.08, 6), stoneM);
  st.position.set(Math.cos(a) * CR, 0.03, Math.sin(a) * CR); st.rotation.y = a * 1.7;
  st.scale.set(1 + (s % 3) * 0.12, 1, 1);
  ring.add(st);
}
function blossom(x, z, sc) {
  var g = new THREE.Group();
  var tg = new THREE.CylinderGeometry(0.05, 0.09, 0.8, 6); tg.translate(0, 0.4, 0); g.add(new THREE.Mesh(tg, trunkM));
  [[0, 0.95, 0, 0.42], [0.28, 0.8, 0.12, 0.3], [-0.26, 0.82, -0.1, 0.32], [0.05, 0.78, -0.3, 0.26]].forEach(function (b, k) {
    var m = new THREE.Mesh(new THREE.IcosahedronGeometry(b[3], 1), bloomM[k % 2]); m.position.set(b[0], b[1], b[2]); g.add(m);
  });
  g.scale.setScalar(sc); g.position.set(x, height(x, z) - 0.04, z); g.rotation.y = x * 2.3;
  props.add(g); return g;
}
function pine(x, z, sc) {
  var g = new THREE.Group();
  var tg = new THREE.CylinderGeometry(0.04, 0.06, 0.3, 5); tg.translate(0, 0.15, 0); g.add(new THREE.Mesh(tg, trunkM));
  [[0.3, 0.34, 0.5], [0.24, 0.3, 0.75], [0.16, 0.26, 0.98]].forEach(function (c, k) {
    var m = new THREE.Mesh(new THREE.ConeGeometry(c[0], c[1] * 1.6, 7), k % 2 ? pineM2 : pineM); m.position.y = c[2]; g.add(m);
  });
  g.scale.setScalar(sc); g.position.set(x, height(x, z) - 0.03, z);
  props.add(g); return g;
}
function bush(x, z, sc) {
  var g = new THREE.Group();
  [[0, 0.22, 0, 0.32], [0.26, 0.15, 0.08, 0.22], [-0.2, 0.14, -0.12, 0.2]].forEach(function (b, k) {
    var m = new THREE.Mesh(new THREE.IcosahedronGeometry(b[3], 1), bushM[k % 2]);
    m.position.set(b[0], b[1], b[2]); g.add(m);
  });
  g.scale.setScalar(sc); g.position.set(x, height(x, z) - 0.05, z); g.rotation.y = x * 3;
  props.add(g);
}
function polar(deg, r) { var a = THREE.MathUtils.degToRad(deg); return [Math.cos(a) * r, -Math.sin(a) * r]; }
[[105, 4.0, 1.05], [140, 4.1, 0.9], [222, 4.05, 1.0], [258, 3.95, 0.85], [175, 4.15, 0.8]].forEach(function (d) {
  var q = polar(d[0], d[1]);
  if (inside(q[0], q[1]) > 0.3) blossom(q[0], q[1], d[2]);
});
[[92, 4.4, 0.9], [118, 4.5, 1.05], [128, 4.3, 0.8], [158, 4.5, 1.0], [195, 4.45, 1.1], [205, 4.25, 0.8], [240, 4.5, 0.95], [272, 4.35, 0.85], [283, 4.15, 0.7]].forEach(function (d) {
  var q = polar(d[0], d[1]);
  if (inside(q[0], q[1]) > 0.25) pine(q[0], q[1], d[2]);
});
// little grey sea stacks off the cliffs
[[100, 5.6, 0.35], [150, 5.8, 0.5], [165, 5.45, 0.25], [215, 5.7, 0.42], [250, 5.55, 0.3], [70, 5.9, 0.3], [283, 5.8, 0.38]].forEach(function (d, k) {
  var q = polar(d[0], d[1]), sg = new THREE.DodecahedronGeometry(d[2], 0);
  var m = new THREE.Mesh(sg, stackM); m.scale.set(1, 1.5 + (k % 3) * 0.3, 0.9);
  m.position.set(q[0], -0.25 + d[2] * 0.4, q[1]); m.rotation.y = k * 1.3; props.add(m);
});
[[120, 3.5, 1], [238, 3.5, 0.9], [80, 3.7, 0.75], [225, 3.3, 0.7], [285, 3.75, 0.7]].forEach(function (d) {
  var q = polar(d[0], d[1]);
  if (inside(q[0], q[1]) > 0.3) bush(q[0], q[1], d[2]);
});
