/* 月汐小岛 · props.js — 石头、棕榈树、灌木 */
"use strict";
// ---------- props: stones, palms, bushes ----------
var props = new THREE.Group(); scene.add(props);
function mat(hex) { return new THREE.MeshStandardMaterial({ color: lc(hex), flatShading: true, roughness: 0.85 }); }
var stoneM = mat(0xcfc6b8), trunkM = mat(0xa9774a), leafM = mat(0x5cb847), nutM = mat(0x7a4e2e), bushM = [mat(0x62ae55), mat(0x70bc5c)];
leafM.side = THREE.DoubleSide;
var ring = new THREE.Group(); ring.position.set(CX, HC, 0); props.add(ring);
for (var s = 0; s < 12; s++) {
  var a = s / 12 * Math.PI * 2, st = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.2, 0.08, 6), stoneM);
  st.position.set(Math.cos(a) * CR, 0.03, Math.sin(a) * CR); st.rotation.y = a * 1.7;
  st.scale.set(1 + (s % 3) * 0.12, 1, 1);
  ring.add(st);
}
var leafG = new THREE.BufferGeometry();
leafG.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0, 0.55, 0.1, 0.2, 1.15, -0.28, 0, 0, 0, 0, 1.15, -0.28, 0, 0.55, 0.1, -0.2], 3));
leafG.computeVertexNormals();
function palm(x, z, ang, hgt) {
  var g = new THREE.Group(), bend = 0.12;
  var tg = new THREE.CylinderGeometry(0.07, 0.13, hgt, 6, 5); tg.translate(0, hgt / 2, 0);
  var tp = tg.attributes.position;
  for (var k = 0; k < tp.count; k++) { var y = tp.getY(k); tp.setX(k, tp.getX(k) + bend * y * y); }
  tg.computeVertexNormals();
  g.add(new THREE.Mesh(tg, trunkM));
  var top = new THREE.Group(); top.position.set(bend * hgt * hgt, hgt, 0); g.add(top);
  var n = 6;
  for (var l = 0; l < n; l++) {
    var lf = new THREE.Mesh(leafG, leafM);
    lf.rotation.set(0, l / n * Math.PI * 2 + 0.3, -0.15 - (l % 2) * 0.15);
    top.add(lf);
  }
  for (var c = 0; c < 3; c++) {
    var nut = new THREE.Mesh(new THREE.IcosahedronGeometry(0.08, 0), nutM);
    nut.position.set(Math.cos(c * 2.1) * 0.09, -0.08, Math.sin(c * 2.1) * 0.09); top.add(nut);
  }
  g.position.set(x, height(x, z) - 0.03, z); g.rotation.y = ang;
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
[[105, 4.35, 1.6], [140, 4.4, 1.35], [222, 4.4, 1.5], [258, 4.3, 1.3]].forEach(function (d, k) {
  var q = polar(d[0], d[1]);
  if (inside(q[0], q[1]) > 0.25) palm(q[0], q[1], Math.atan2(q[1], -q[0]) + Math.PI + (k % 2 ? 0.4 : -0.4), d[2]);
});
[[120, 3.5, 1], [238, 3.5, 0.9], [80, 3.7, 0.75], [225, 3.3, 0.7], [285, 3.75, 0.7]].forEach(function (d) {
  var q = polar(d[0], d[1]);
  if (inside(q[0], q[1]) > 0.3) bush(q[0], q[1], d[2]);
});
