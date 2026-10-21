/* 月汐小岛 · props.js — 白石圈、蓝白低模月光树、灌木、海中礁石 */
"use strict";
// ---------- props: stones, low-poly moon trees, bushes, sea stacks ----------
var props = new THREE.Group(); scene.add(props);
function mat(hex) { return toonMat(hex); }
var stoneM = mat(0xdcdfe8), trunkM = mat(0x857b84), bloomM = [mat(0xf1f3fb), mat(0xdbe4f6)], bushM = [mat(0x5c9c7a), mat(0x6aa986)], stackM = mat(0x9ea2b5);
// moonstone rocks: chunky rounded low-poly, pale white top fading to soft blue-grey underneath (vertex colours),
// a gentle bulge noise by position so shared corners stay closed
var rockVM = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: toonGrad, vertexColors: true });
rockVM.onBeforeCompile = function (sh) { sh.uniforms.uRim = rimU; };
var rockTop = lc(0xe3e8f1), rockMid = lc(0xc9d2e4), rockBot = lc(0x8996b6);
function rockGeo(r, seed, sy, flatTop) {
  var g = new THREE.IcosahedronGeometry(r, 1), p = g.attributes.position, sd = seed || 0, c = new THREE.Color(), col = [];
  for (var i = 0; i < p.count; i++) {
    var x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    var j = 1 + 0.13 * Math.sin(x * 9.1 / r + z * 6.7 / r + sd) * Math.cos(y * 7.3 / r + sd * 1.7);
    x *= j; z *= j; y *= j * (sy || 0.7);
    var ft = (flatTop === undefined ? 0.45 : flatTop) * r * (sy || 0.7);
    if (y > ft) y = ft + (y - ft) * 0.3;
    p.setXYZ(i, x, y, z);
  }
  var lo = 1e9, hi = -1e9;
  for (i = 0; i < p.count; i++) { lo = Math.min(lo, p.getY(i)); hi = Math.max(hi, p.getY(i)); }
  for (i = 0; i < p.count; i++) {
    var t = (p.getY(i) - lo) / Math.max(1e-4, hi - lo);
    if (t > 0.55) c.copy(rockMid).lerp(rockTop, (t - 0.55) / 0.45); else c.copy(rockBot).lerp(rockMid, t / 0.55);
    col.push(c.r, c.g, c.b);
  }
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
}
function pebbleCluster(parent, x, z, sc, seed, y0) { // 2-3 little stones lying in the grass
  var n = 2 + (seed % 2);
  for (var i = 0; i < n; i++) {
    var a = seed * 1.9 + i * 2.2, d = (0.22 + 0.1 * i) * sc, r = (0.07 + 0.035 * ((seed + i) % 3)) * sc;
    var m = new THREE.Mesh(rockGeo(r, seed + i, 0.6), rockVM), px = x + Math.cos(a) * d, pz = z + Math.sin(a) * d;
    m.position.set(px, (y0 === undefined ? height(px, pz) : y0) + r * 0.1, pz); m.rotation.y = a;
    parent.add(m);
  }
}
// flat moonstone slabs ringing the clearing
var ring = new THREE.Group(); ring.position.set(CX, HC, 0); props.add(ring);
for (var s = 0; s < 12; s++) {
  var a = s / 12 * Math.PI * 2, st = new THREE.Mesh(rockGeo(0.19, s * 3.1, 0.32, 0.2), rockVM);
  st.position.set(Math.cos(a) * CR, 0.02, Math.sin(a) * CR); st.rotation.y = a * 1.7;
  st.scale.set(1 + (s % 3) * 0.1, 1, 0.9);
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
var leafTex = (function () { // a spray of pointed almond leaves, white on transparent
  var c = document.createElement("canvas"); c.width = c.height = 64;
  var g = c.getContext("2d"); g.fillStyle = "#fff";
  function leaf(x, y, L, W, a) {
    g.save(); g.translate(x, y); g.rotate(a); g.beginPath();
    g.moveTo(0, -L); g.quadraticCurveTo(W, 0, 0, L); g.quadraticCurveTo(-W, 0, 0, -L); g.fill(); g.restore();
  }
  leaf(32, 30, 20, 13, 0); leaf(19, 33, 15, 10, -0.9); leaf(45, 33, 15, 10, 0.9);
  leaf(24, 47, 12, 8, -0.4); leaf(40, 47, 12, 8, 0.4);
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
var leafTones = [lc(0xc6e4ff), lc(0xa6d2fa), lc(0x88bcf0), lc(0x6fa8e4)]; // ice-blue crystal canopy like her reference (2026-10-21; was near-white)
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
    var rr = b[3] * (0.3 + 0.7 * Math.sqrt(R()));
    v.set(b[0] + d.x * rr, b[1] + d.y * rr, b[2] + d.z * rr);
    var nn = new THREE.Vector3(v.x - c[0], v.y - c[1], v.z - c[2]).normalize();
    var h = (v.y - bot) / Math.max(0.01, top - bot), tone = leafTones[Math.min(3, Math.max(0, Math.floor((1 - h) * 3.2 + R() * 0.9)))];
    var sz = (0.17 + R() * 0.09) * sc, base = pos.length / 3;
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
// seamless bark tube along a curve with spiralling furrows (2026-10-21: chained cylinders looked like snapped tofu)
var barkVM = toonMat(0xffffff); barkVM.vertexColors = true;
var barkRidgeC = new THREE.Color(lc(0xeef1f8)), barkGrooveC = new THREE.Color(lc(0xc3cbdc));
function barkTube(pts, r0, r1, depth, N, M, seed, flare) {
  var cv = new THREE.CatmullRomCurve3(pts), fr = cv.computeFrenetFrames(N, false), pos = [], col = [], idx = [], c = new THREE.Color(), k = seed || 0;
  for (var i = 0; i <= N; i++) {
    var t = i / N, P = cv.getPoint(t), Nn = fr.normals[i], B = fr.binormals[i];
    var rad = (r0 + (r1 - r0) * Math.pow(t, 0.8)) * (1 + 0.06 * Math.sin(t * 13 + k));
    for (var j = 0; j <= M; j++) {
      var th = j / M * Math.PI * 2, tw = th + t * 2.4 + k;
      var fl = Math.sin(tw * 6) * 0.5 + Math.sin(tw * 3 + 1.1) * 0.35 + Math.sin(tw * 10 + t * 8) * 0.15;
      var but = flare ? Math.max(0, 1 - t * 4) * Math.max(0, Math.sin(th * 4 + k)) * flare : 0;
      var rr = rad * (1 + depth * fl) + but, cx = Math.cos(th) * rr, cy = Math.sin(th) * rr;
      pos.push(P.x + Nn.x * cx + B.x * cy, P.y + Nn.y * cx + B.y * cy, P.z + Nn.z * cx + B.z * cy);
      c.copy(barkGrooveC).lerp(barkRidgeC, THREE.MathUtils.smoothstep(fl, -0.6, 0.5)); col.push(c.r, c.g, c.b);
    }
  }
  for (i = 0; i < N; i++) for (j = 0; j < M; j++) { var a0 = i * (M + 1) + j, a1 = a0 + M + 1; idx.push(a0, a1, a0 + 1, a1, a1 + 1, a0 + 1); }
  var g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return new THREE.Mesh(g, barkVM);
}
function makeMoonTree(seed, sc) {
  var g = new THREE.Group(), V = THREE.Vector3, s = seed || 0, w = Math.sin(s * 3.1) * 0.06;
  // one continuous trunk from the ground up into the crown, gentle S bend, flared foot
  g.add(barkTube([new V(0, -0.04, 0), new V(0.05 + w, 0.3, 0.02), new V(-0.03 + w, 0.62, -0.02), new V(0.03, 0.95, 0)], 0.12, 0.04, 0.16, 26, 18, s, 0.06));
  // branches start inside the trunk so they grow out of it, no seams
  g.add(barkTube([new V(-0.02 + w, 0.56, 0), new V(0.14, 0.72, 0.04), new V(0.34, 0.88, 0.08)], 0.05, 0.02, 0.12, 12, 10, s + 1));
  g.add(barkTube([new V(-0.02 + w, 0.6, 0), new V(-0.16, 0.74, -0.03), new V(-0.32, 0.86, -0.06)], 0.05, 0.02, 0.12, 12, 10, s + 2));
  for (var r = 0; r < 4; r++) { // surface roots, also tubes
    var ra = r / 4 * Math.PI * 2 + s;
    g.add(barkTube([new V(Math.cos(ra) * 0.04, 0.1, Math.sin(ra) * 0.04), new V(Math.cos(ra + 0.2) * 0.13, 0.02, Math.sin(ra + 0.2) * 0.13), new V(Math.cos(ra) * 0.24, -0.03, Math.sin(ra) * 0.24)], 0.05, 0.012, 0.1, 10, 8, s + r));
  }
  var c = [0, 1.05, 0];
  var blobs = [[0, 1.05, 0, 0.4], [0.36, 0.92, 0.1, 0.29], [-0.34, 0.93, -0.06, 0.3], [0.08, 0.96, -0.33, 0.27], [-0.08, 1.27, 0.08, 0.25], [0.22, 1.2, 0.2, 0.21], [-0.18, 1.0, 0.3, 0.22]];
  g.add(leafCards(blobs, c, sc || 1, s + 1, 230)); // canopy is leaf cards only, no solid balls
  return g;
}
function blossom(x, z, sc, seed) {
  var g = makeMoonTree(seed, sc);
  g.scale.setScalar(sc); g.position.set(x, height(x, z) - 0.03, z); g.rotation.y = x * 2.3;
  props.add(g);
  if (seed % 2 === 0) shrooms(props, x + 0.18 * sc, z + 0.14 * sc, seed + 21, 3);
  return g;
}
// moon grass tuft: long curved blue-white blades + a few glowing star flowers (replaces the old green bush balls).
// Blades are tapered curved strips merged into one mesh; the tips sway in the vertex shader (grass trick from
// stylized three.js grass demos: bend weight = height along the blade, stored in uv.y).
var grassTimeU = { value: 0 };
var grassBladeM = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: toonGrad, vertexColors: true, side: THREE.DoubleSide });
grassBladeM.emissive = lc(0x9cc8ff); grassBladeM.emissiveIntensity = 0;
grassBladeM.onBeforeCompile = function (sh) {
  sh.uniforms.uTime = grassTimeU;
  sh.vertexShader = "uniform float uTime;\n" + sh.vertexShader.replace("#include <begin_vertex>",
    "vec3 transformed = vec3( position );\n" +
    "float bend = uv.y * uv.y;\n" +
    "transformed.x += sin( uTime * 1.6 + position.x * 2.7 + position.z * 1.9 ) * 0.05 * bend;\n" +
    "transformed.z += sin( uTime * 1.2 + position.z * 3.3 ) * 0.035 * bend;");
};
var grassFlowerM = new THREE.MeshToonMaterial({ color: lc(0xf4f9ff), gradientMap: toonGrad, side: THREE.DoubleSide });
grassFlowerM.emissive = lc(0xbfe0ff); grassFlowerM.emissiveIntensity = 0.15;
var moonGrassM = [grassBladeM, grassFlowerM];
var starFlowerG = (function () {
  var sh = new THREE.Shape();
  for (var i = 0; i <= 10; i++) {
    var a = i / 10 * Math.PI * 2 + Math.PI / 2, r = i % 2 ? 0.024 : 0.06;
    if (i) sh.lineTo(Math.cos(a) * r, Math.sin(a) * r); else sh.moveTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  return new THREE.ShapeGeometry(sh);
})();
var budG = new THREE.SphereGeometry(0.024, 8, 6);
// little glowing mushrooms tucked at stone edges and tree roots (2026-10-21, she asked for a few)
// caps in soft beige-pink and beige-blue (she asked for colour, 2026-10-21: not every plant white)
var shroomStemM = toonMat(0xf2ece3), shroomCapM = toonMat(0xf1c9c4), shroomCapM2 = toonMat(0xb9d3ee);
shroomCapM.emissive = lc(0xffa9a0); shroomCapM.emissiveIntensity = 0.1; shroomCapM2.emissive = lc(0x86c4ff); shroomCapM2.emissiveIntensity = 0.1;
var starPinkM = new THREE.MeshToonMaterial({ color: lc(0xf6d6d2), gradientMap: toonGrad, side: THREE.DoubleSide }); starPinkM.emissive = lc(0xffb8b0); starPinkM.emissiveIntensity = 0.1;
var shroomCapG = new THREE.SphereGeometry(0.05, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2);
function shrooms(parent, x, z, seed, n) {
  var rs = seed * 4111 + 7; function R() { rs = (rs * 9301 + 49297) % 233280; return rs / 233280; }
  var y0 = height(x, z);
  for (var i = 0; i < (n || 3); i++) {
    var a = R() * 6.28, r = 0.03 + R() * 0.09, px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r;
    if (Math.abs(height(px, pz) - y0) > 0.02 || inside(px, pz) < 0.2) continue;
    var s = (i ? 0.45 + R() * 0.35 : 0.85), hh = 0.07 * s + 0.02, g = new THREE.Group();
    g.position.set(px, y0 - 0.005, pz); g.rotation.set((R() - 0.5) * 0.35, R() * 6, (R() - 0.5) * 0.35);
    var st = new THREE.Mesh(new THREE.CylinderGeometry(0.011 * s + 0.004, 0.015 * s + 0.005, hh, 6), shroomStemM); st.position.y = hh / 2; g.add(st);
    var cp = new THREE.Mesh(shroomCapG, (i + seed) % 2 ? shroomCapM : shroomCapM2); cp.position.y = hh - 0.004; cp.scale.set(s, s * 0.7, s); g.add(cp);
    parent.add(g);
  }
}
function makeGrassTuft(seed, blades, flowers) {
  var rs = (seed || 1) * 7919 + 13;
  function R() { rs = (rs * 9301 + 49297) % 233280; return rs / 233280; }
  var pos = [], nor = [], uv = [], col = [], idx = [], SEG = 4;
  // 2026-10-21: the upright dark-rooted blades read as grey weeds in shade; now the island's own 月汐草 (moon-tide grass):
  // light blue-white ribbons that arch up and droop over, like the potted ones by the door, with glowing buds.
  var cBase = lc(0x9dbde6), cMid = lc(0xc8dcf3), cTip = lc(0xf3f8ff), tmp = new THREE.Color();
  var g = new THREE.Group(), N = blades || 30;
  for (var k = 0; k < N; k++) {
    var ang = R() * Math.PI * 2, rad = Math.sqrt(R()) * 0.28;
    var bx = Math.cos(ang) * rad, bz = Math.sin(ang) * rad;
    var h = 0.16 + R() * 0.15 * (1 - rad * 1.4), lean = 0.15 + R() * 0.13 + rad * 0.32; // shorter leaves (2026-10-21)
    var la = ang + (R() - 0.5) * 0.9, lx = Math.cos(la), lz = Math.sin(la);
    var sa = la + Math.PI / 2 + (R() - 0.5) * 0.8, sx = Math.cos(sa), sz = Math.sin(sa), w0 = 0.022 + R() * 0.014;
    var base = pos.length / 3;
    for (var j = 0; j <= SEG; j++) {
      var t = j / SEG, w = w0 * (1 - t * 0.85), off = lean * t;
      var cx = bx + lx * off, cy = h * Math.sin(t * Math.PI * 0.9) - lean * 0.45 * t * t + 0.01, cz = bz + lz * off;
      if (t < 0.5) tmp.copy(cBase).lerp(cMid, t * 2); else tmp.copy(cMid).lerp(cTip, (t - 0.5) * 2);
      var nx = lx * 0.45, nz = lz * 0.45, nl = Math.sqrt(nx * nx + 1 + nz * nz);
      [-1, 1].forEach(function (sd) {
        pos.push(cx + sx * w * sd, cy, cz + sz * w * sd); nor.push(nx / nl, 1 / nl, nz / nl);
        uv.push(sd < 0 ? 0 : 1, t); col.push(tmp.r, tmp.g, tmp.b);
      });
      if (j < SEG) { var q = base + j * 2; idx.push(q, q + 1, q + 3, q, q + 3, q + 2); }
    }
  }
  var bg = new THREE.BufferGeometry();
  bg.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  bg.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  bg.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  bg.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  bg.setIndex(idx);
  g.add(new THREE.Mesh(bg, grassBladeM));
  var F = flowers === undefined ? 4 : flowers;
  for (var f = 0; f < F; f++) { // glowing moon-tide buds on thin stems (a star flower now and then)
    var fa = R() * Math.PI * 2, fr = Math.sqrt(R()) * 0.22, fh = 0.22 + R() * 0.3;
    var fx = Math.cos(fa) * fr, fz = Math.sin(fa) * fr;
    var stem = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.007, fh, 4), grassBladeM);
    stem.position.set(fx, fh / 2, fz); g.add(stem);
    if (f % 3 === 2) {
      var fl = new THREE.Mesh(starFlowerG, starPinkM);
      fl.position.set(fx, fh + 0.005, fz); fl.rotation.set(-Math.PI / 2 + (R() - 0.5) * 0.9, 0, R() * 6.3);
      fl.scale.setScalar(0.8 + R() * 0.5); g.add(fl);
    } else {
      var bud = new THREE.Mesh(budG, grassFlowerM); bud.position.set(fx, fh + 0.01, fz); bud.scale.set(1, 1.45, 1); g.add(bud);
    }
  }
  return g;
}
function flatSpot(x, z, rad) { // nearest point within ~0.9 whose disc of radius rad sits on one terrace; prefers higher tiers
  var best = null;
  for (var ring_ = 0; ring_ <= 6; ring_++) {
    var steps = ring_ ? 10 : 1;
    for (var k = 0; k < steps; k++) {
      var a = k / steps * Math.PI * 2, px = x + Math.cos(a) * ring_ * 0.15, pz = z + Math.sin(a) * ring_ * 0.15, h = height(px, pz), ok = inside(px, pz) > 0.3;
      for (var q = 0; q < 10 && ok; q++) {
        var b = q / 10 * Math.PI * 2;
        if (Math.abs(height(px + Math.cos(b) * rad, pz + Math.sin(b) * rad) - h) > 0.03) ok = false;
      }
      if (ok && (!best || h > best[2] + 0.1)) best = [px, pz, h];
    }
    if (best && ring_ >= 2) break;
  }
  return best;
}
function bush(x, z, sc, seed) {
  var f = flatSpot(x, z, 0.5 * sc * 1.15);
  if (!f) return;
  x = f[0]; z = f[1];
  var g = makeGrassTuft(seed || Math.round(Math.abs(x * 37 + z * 11)) + 1, 34, 4);
  g.scale.setScalar(sc * 1.15); g.position.set(x, f[2] - 0.02, z); g.rotation.y = x * 3;
  props.add(g);
  pebbleCluster(props, x, z, sc, (seed || 1) + 4);
  if ((seed || 1) % 2) shrooms(props, x + 0.42 * sc, z - 0.2 * sc, (seed || 1) + 9, 3);
}
function polar(deg, r) { var a = THREE.MathUtils.degToRad(deg); return [Math.cos(a) * r, -Math.sin(a) * r]; }
// (175° tree removed to make room for the wind-swept tree behind the house)
[[105, 4.0, 1.05], [140, 4.1, 0.9], [222, 4.05, 1.0], [258, 3.95, 0.85]].forEach(function (d) {
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
  var q = polar(d[0], d[1]), sg = rockGeo(d[2], k * 2.3, 1.0, 0.6);
  var m = new THREE.Mesh(sg, rockVM); m.scale.set(1, 1.5 + (k % 3) * 0.3, 0.9);
  m.position.set(q[0], -0.25 + d[2] * 0.4, q[1]); m.rotation.y = k * 1.3; props.add(m);
});
[[120, 3.5, 1], [238, 3.5, 0.9], [80, 3.7, 0.75], [225, 3.3, 0.7], [285, 3.75, 0.7],
 [98, 4.3, 0.7], [132, 3.85, 0.65], [150, 4.45, 0.75], [200, 4.5, 0.7], [212, 4.4, 0.6], [250, 4.15, 0.75], [270, 3.6, 0.6]].forEach(function (d, k) {
  var q = polar(d[0], d[1]);
  if (inside(q[0], q[1]) > 0.3) bush(q[0], q[1], d[2], k + 1);
});
