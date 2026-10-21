/* 月汐小岛 · props.js — 白石圈、蓝白低模月光树、灌木、海中礁石 */
"use strict";
// ---------- props: stones, low-poly moon trees, bushes, sea stacks ----------
var props = new THREE.Group(); scene.add(props);
function mat(hex) { return toonMat(hex); }
var stoneM = mat(0xdcdfe8), trunkM = mat(0x857b84), bloomM = [mat(0xf1f3fb), mat(0xdbe4f6)], bushM = [mat(0x5c9c7a), mat(0x6aa986)], stackM = mat(0x9ea2b5);
var ring = new THREE.Group(); ring.position.set(CX, HC, 0); props.add(ring);
for (var s = 0; s < 12; s++) {
  var a = s / 12 * Math.PI * 2, st = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.2, 0.08, 6), stoneM);
  st.position.set(Math.cos(a) * CR, 0.03, Math.sin(a) * CR); st.rotation.y = a * 1.7;
  st.scale.set(1 + (s % 3) * 0.12, 1, 1);
  ring.add(st);
}
// low-poly moon tree: silver-white bent trunk + faceted blue-and-white canopy (glows softly at night)
var moonBarkM = mat(0xdde3ee), moonLeafM = [mat(0xeef4fc), mat(0xc9ddf4), mat(0xa8c6ea)];
moonLeafM.forEach(function (m, k) { m.emissive = lc(k ? 0x9cc8ff : 0xdcecff); m.emissiveIntensity = 0; });
function facet(g) { g.computeVertexNormals(); return g; } // polyhedra are non-indexed, so this gives flat facets
function limb(a, b, r0, r1, m) {
  var v = new THREE.Vector3().subVectors(b, a), g = new THREE.CylinderGeometry(r1, r0, v.length(), 6);
  g.translate(0, v.length() / 2, 0);
  var o = new THREE.Mesh(g, m); o.position.copy(a);
  o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.normalize());
  return o;
}
function makeMoonTree(seed) {
  var g = new THREE.Group(), V = THREE.Vector3, s = seed || 0, w = Math.sin(s * 3.1) * 0.06;
  var p0 = new V(0, 0, 0), p1 = new V(0.06 + w, 0.36, 0.02), p2 = new V(-0.04 + w, 0.66, -0.02), p3 = new V(0.03, 0.88, 0);
  g.add(limb(p0, p1, 0.11, 0.08, moonBarkM)); g.add(limb(p1, p2, 0.08, 0.06, moonBarkM)); g.add(limb(p2, p3, 0.06, 0.045, moonBarkM));
  g.add(limb(p2, new V(0.32, 0.88, 0.08), 0.04, 0.025, moonBarkM)); g.add(limb(p2, new V(-0.3, 0.86, -0.06), 0.04, 0.025, moonBarkM));
  for (var r = 0; r < 4; r++) { // flared roots
    var ra = r / 4 * Math.PI * 2 + s;
    g.add(limb(new V(0, 0.12, 0), new V(Math.cos(ra) * 0.2, -0.02, Math.sin(ra) * 0.2), 0.045, 0.015, moonBarkM));
  }
  [[0, 1.05, 0, 0.4], [0.36, 0.92, 0.1, 0.29], [-0.34, 0.93, -0.06, 0.3], [0.08, 0.96, -0.33, 0.27], [-0.08, 1.27, 0.08, 0.25], [0.22, 1.2, 0.2, 0.21], [-0.18, 1.0, 0.3, 0.22]].forEach(function (b, k) {
    var m = new THREE.Mesh(facet(new THREE.IcosahedronGeometry(b[3], 1)), moonLeafM[(k + s) % 3]);
    m.position.set(b[0], b[1], b[2]); m.rotation.set(k, k * 1.7 + s, 0); g.add(m);
  });
  return g;
}
function blossom(x, z, sc, seed) {
  var g = makeMoonTree(seed);
  g.scale.setScalar(sc); g.position.set(x, height(x, z) - 0.03, z); g.rotation.y = x * 2.3;
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
  if (inside(q[0], q[1]) > 0.3) blossom(q[0], q[1], d[2], d[0] % 3);
});
// a few more moon trees where the dark pines used to be
[[118, 4.5, 0.85], [158, 4.5, 0.8], [205, 4.25, 0.75], [240, 4.5, 0.8]].forEach(function (d, k) {
  var q = polar(d[0], d[1]);
  if (inside(q[0], q[1]) > 0.25) blossom(q[0], q[1], d[2], k + 3);
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
