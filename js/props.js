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
// moon tree, anime-style: silver-white bent trunk + a soft canopy.
// Canopy tricks learned from open-source stylized trees (craftzdog/ghibli-style-shader, douges.dev fluffy trees):
//  1. every canopy normal points out from the canopy centre, so toon light makes big clean lit / shadow areas
//  2. a shell of small leaf cards that are pushed out toward the camera in the vertex shader -> fluffy edges
//  3. a gentle wind sway on the cards
var moonBarkM = mat(0xdde3ee), moonLeafM = [mat(0xeef4fc), mat(0xc9ddf4), mat(0xa8c6ea)];
moonLeafM.forEach(function (m, k) { m.emissive = lc(k ? 0x9cc8ff : 0xdcecff); m.emissiveIntensity = 0; });
var leafTimeU = { value: 0 };
var leafTex = (function () { // a little cluster of rounded leaves, white on transparent
  var c = document.createElement("canvas"); c.width = c.height = 64;
  var g = c.getContext("2d"); g.fillStyle = "#fff";
  [[32, 30, 15, 9, 0.3], [20, 22, 11, 7, -0.7], [44, 22, 11, 7, 0.8], [22, 42, 11, 7, 0.6], [43, 42, 11, 7, -0.5], [32, 48, 9, 6, 0]].forEach(function (l) {
    g.save(); g.translate(l[0], l[1]); g.rotate(l[4]); g.beginPath(); g.ellipse(0, 0, l[2], l[3], 0, 0, Math.PI * 2); g.fill(); g.restore();
  });
  return new THREE.CanvasTexture(c);
})();
var leafCardM = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: toonGrad, map: leafTex, alphaTest: 0.5, side: THREE.DoubleSide, vertexColors: true });
leafCardM.emissive = lc(0x9cc8ff); leafCardM.emissiveIntensity = 0;
leafCardM.onBeforeCompile = function (sh) {
  sh.uniforms.uTime = leafTimeU; sh.uniforms.uRim = rimU;
  sh.vertexShader = "uniform float uTime;\nattribute float aSize;\n" + sh.vertexShader.replace("#include <project_vertex>",
    "vec4 mvPosition = modelViewMatrix * vec4( transformed, 1.0 );\n" +
    "vec2 cardOff = ( uv - 0.5 ) * 2.0 * aSize;\n" +
    "float sway = sin( uTime * 1.4 + position.x * 3.1 + position.z * 2.3 ) * 0.25 + sin( uTime * 2.3 + position.y * 4.0 ) * 0.12;\n" +
    "mvPosition.xy += cardOff + vec2( sway, sway * 0.4 ) * aSize * 0.35;\n" +
    "gl_Position = projectionMatrix * mvPosition;");
  sh.fragmentShader = "uniform float uRim;\n" + sh.fragmentShader.replace("#include <output_fragment>",
    "float rimF = 1.0 - abs(dot(normalize(normal), normalize(vViewPosition)));\n" +
    "outgoingLight += vec3(0.8, 0.88, 1.0) * smoothstep(0.62, 0.8, rimF) * uRim;\n#include <output_fragment>");
};
moonLeafM.push(leafCardM);
var leafTones = [lc(0xf4f8ff), lc(0xd3e4f7), lc(0xb4cff0), lc(0x9dbde6)];
// canopy blob with normals pointing out from canopy centre c (blob centre b, radius r)
function canopyBlob(b, r, c, m) {
  var g = new THREE.IcosahedronGeometry(r, 2), p = g.attributes.position, n = g.attributes.normal, v = new THREE.Vector3();
  for (var i = 0; i < p.count; i++) {
    v.set(p.getX(i) + b[0] - c[0], p.getY(i) + b[1] - c[1], p.getZ(i) + b[2] - c[2]).normalize();
    n.setXYZ(i, v.x, v.y, v.z);
  }
  var o = new THREE.Mesh(g, m); o.position.set(b[0], b[1], b[2]); return o;
}
// shell of leaf cards over the blobs; sc = how big the tree will be scaled (cards size in view space)
function leafCards(blobs, c, sc, seed, count) {
  var rs = seed * 9301 + 49297, N = count || 70;
  function R() { rs = (rs * 9301 + 49297) % 233280; return rs / 233280; }
  var pos = [], nor = [], uv = [], col = [], size = [], idx = [], v = new THREE.Vector3(), d = new THREE.Vector3();
  var top = -9, bot = 9; blobs.forEach(function (b) { top = Math.max(top, b[1] + b[3]); bot = Math.min(bot, b[1] - b[3]); });
  for (var k = 0; k < N; k++) {
    var b = blobs[Math.floor(R() * blobs.length)];
    d.set(R() * 2 - 1, R() * 2 - 1, R() * 2 - 1).normalize();
    v.set(b[0] + d.x * b[3] * 0.92, b[1] + d.y * b[3] * 0.92, b[2] + d.z * b[3] * 0.92);
    var nn = new THREE.Vector3(v.x - c[0], v.y - c[1], v.z - c[2]).normalize();
    var h = (v.y - bot) / Math.max(0.01, top - bot), tone = leafTones[Math.min(3, Math.max(0, Math.floor((1 - h) * 3.2 + R() * 0.9)))];
    var sz = (0.13 + R() * 0.08) * sc, base = pos.length / 3;
    [[0, 0], [1, 0], [1, 1], [0, 1]].forEach(function (q) {
      pos.push(v.x, v.y, v.z); nor.push(nn.x, nn.y, nn.z); uv.push(q[0], q[1]); col.push(tone.r, tone.g, tone.b); size.push(sz);
    });
    idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  var g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.setAttribute("aSize", new THREE.Float32BufferAttribute(size, 1));
  g.setIndex(idx);
  var m = new THREE.Mesh(g, leafCardM); m.frustumCulled = false;
  return m;
}
function limb(a, b, r0, r1, m) {
  var v = new THREE.Vector3().subVectors(b, a), g = new THREE.CylinderGeometry(r1, r0, v.length(), 7);
  g.translate(0, v.length() / 2, 0);
  var o = new THREE.Mesh(g, m); o.position.copy(a);
  o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.normalize());
  return o;
}
function makeMoonTree(seed, sc) {
  var g = new THREE.Group(), V = THREE.Vector3, s = seed || 0, w = Math.sin(s * 3.1) * 0.06;
  var p0 = new V(0, 0, 0), p1 = new V(0.06 + w, 0.36, 0.02), p2 = new V(-0.04 + w, 0.66, -0.02), p3 = new V(0.03, 0.88, 0);
  g.add(limb(p0, p1, 0.11, 0.08, moonBarkM)); g.add(limb(p1, p2, 0.08, 0.06, moonBarkM)); g.add(limb(p2, p3, 0.06, 0.045, moonBarkM));
  g.add(limb(p2, new V(0.32, 0.88, 0.08), 0.04, 0.025, moonBarkM)); g.add(limb(p2, new V(-0.3, 0.86, -0.06), 0.04, 0.025, moonBarkM));
  for (var r = 0; r < 4; r++) { // flared roots
    var ra = r / 4 * Math.PI * 2 + s;
    g.add(limb(new V(0, 0.12, 0), new V(Math.cos(ra) * 0.2, -0.02, Math.sin(ra) * 0.2), 0.045, 0.015, moonBarkM));
  }
  var c = [0, 1.05, 0];
  var blobs = [[0, 1.05, 0, 0.4], [0.36, 0.92, 0.1, 0.29], [-0.34, 0.93, -0.06, 0.3], [0.08, 0.96, -0.33, 0.27], [-0.08, 1.27, 0.08, 0.25], [0.22, 1.2, 0.2, 0.21], [-0.18, 1.0, 0.3, 0.22]];
  blobs.forEach(function (b, k) { g.add(canopyBlob(b, b[3] * 0.9, c, moonLeafM[(k + s) % 3])); });
  g.add(leafCards(blobs, c, sc || 1, s + 1, 80));
  return g;
}
function blossom(x, z, sc, seed) {
  var g = makeMoonTree(seed, sc);
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
