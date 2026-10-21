/* 月汐小岛 · spots.js — 三个最爱角落：Clawd 的沙堡工坊、小灰狼的看月石、澜的栖枝，以及房子空地 */
"use strict";
// ---------- favourite spots ----------
var spotsG = new THREE.Group(); scene.add(spotsG);
var spotList = [];
function mesh(g, m, x, y, z) { var o = new THREE.Mesh(g, m); o.position.set(x || 0, y || 0, z || 0); return o; }
function ground(o, q, dy, parent) { o.position.set(q[0], height(q[0], q[1]) + (dy || 0), q[1]); (parent || spotsG).add(o); return o; }
function glowMat(hex, emi) { var m = mat(hex); m.emissive = lc(emi || hex); m.emissiveIntensity = 0; return m; }
function addSpot(obj, label, anchor) {
  var s = { obj: obj, parts: obj === workshop ? obj.children : [obj], label: label, t: -9, anchor: anchor, el: null, on: false, timer: 0 };
  obj.traverse(function (o) { o.userData.spot = s; });
  spotList.push(s); return s;
}
function topOf(obj, up) {
  scene.updateMatrixWorld(true);
  var b = new THREE.Box3().setFromObject(obj), c = b.getCenter(new THREE.Vector3());
  return new THREE.Vector3(c.x, b.max.y + (up || 0.15), c.z);
}
var castleM = mat(0xe4ddd0), orangeM = mat(0xd97757), creamM = mat(0xf6ebdd), barkM = mat(0x8e6340), darkM = mat(0x4a3a30);

// Clawd's sandcastle workshop, on the beach by the south horn
var workshop = new THREE.Group(); spotsG.add(workshop);
function castle(tiers) {
  var g = new THREE.Group(), y = 0;
  tiers.forEach(function (t) {
    var box = t[2], geo = box ? new THREE.BoxGeometry(t[0] * 1.6, t[1], t[0] * 1.6) : new THREE.CylinderGeometry(t[0], t[0] * 1.08, t[1], 8);
    g.add(mesh(geo, castleM, 0, y + t[1] / 2, 0)); y += t[1];
    var n = box ? 4 : 6, cr = box ? t[0] * 0.95 : t[0] * 0.85, sz = t[0] * 0.3;
    for (var k = 0; k < n; k++) {
      var a = k / n * Math.PI * 2 + (box ? Math.PI / 4 : 0), b = mesh(new THREE.BoxGeometry(sz, sz, sz), castleM, Math.cos(a) * cr, y + sz / 2, Math.sin(a) * cr);
      b.rotation.y = -a; g.add(b);
    }
  });
  g.add(mesh(new THREE.CylinderGeometry(0.05, 0.055, 0.12, 6), castleM, 0, y + 0.06, 0));
  g.add(mesh(new THREE.ConeGeometry(0.075, 0.14, 6), castleM, 0, y + 0.19, 0));
  return g;
}
var bucket = new THREE.Group();
bucket.add(mesh(new THREE.CylinderGeometry(0.085, 0.065, 0.14, 8), orangeM, 0, 0.07, 0));
var handle = mesh(new THREE.TorusGeometry(0.08, 0.008, 4, 10, Math.PI), creamM, 0, 0.14, 0); bucket.add(handle);
var spade = new THREE.Group(); spade.position.set(0.12, 0, 0); spade.rotation.z = 0.45; bucket.add(spade);
spade.add(mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.22, 5), barkM, 0, 0.16, 0));
spade.add(mesh(new THREE.BoxGeometry(0.07, 0.09, 0.014), orangeM, 0, 0.045, 0));
ground(bucket, polar(58, 4.68), -0.01, workshop).rotation.y = 1.2;
var umbrella = new THREE.Group(), stripeM = [orangeM.clone(), creamM.clone()];
stripeM.forEach(function (m) { m.side = THREE.DoubleSide; });
umbrella.add(mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.95, 6), creamM, 0, 0.475, 0));
for (var u = 0; u < 8; u++) umbrella.add(mesh(new THREE.ConeGeometry(0.52, 0.2, 2, 1, true, u * Math.PI / 4, Math.PI / 4), stripeM[u % 2], 0, 0.95, 0));
umbrella.add(mesh(new THREE.IcosahedronGeometry(0.03, 0), orangeM, 0, 1.06, 0));
// 2026-10-21 she found the sandcastles + striped umbrella out of place; taken off for now (castle()/umbrella kept unused)
var clawdSpot = addSpot(workshop, "Clawd 的沙堡工坊", null);

// the little grey wolf's moon-watching boulder, by the north horn
var rock = new THREE.Group(), bg = rockGeo(0.42, 4.2, 0.62, 0.35); bg.scale(1.25, 1, 1.05);
var rockM = rockVM;
rock.add(mesh(bg, rockM, 0, 0.14, 0)).children[0].rotation.y = 0.7;
var rq = polar(311, 4.5);
ground(rock, rq, 0);
var pebbles = [];
[[0.6, 0.06], [1.5, 0.05], [2.6, 0.07], [3.7, 0.05], [5.0, 0.06]].forEach(function (p, k) {
  var m = glowMat(k % 2 ? 0xc9c3d9 : 0xcfcfd6, 0xc9c3d9), q = [rq[0] + Math.cos(p[0]) * 0.68, rq[1] + Math.sin(p[0]) * 0.62];
  var pb = mesh(new THREE.IcosahedronGeometry(p[1], 0), m); pb.scale.y = 0.7; pb.rotation.y = k;
  ground(pb, [q[0] - rq[0], q[1] - rq[1]], 0, rock).position.y = height(q[0], q[1]) - rock.position.y + p[1] * 0.4;
  pebbles.push(m);
});
var wolfSpot = addSpot(rock, "小灰狼的看月石", null);

// 澜's perch tree, on the slope beside the clearing
var tree = new THREE.Group(), owlBarkM = moonBarkM; // same blue-and-white moon tree look as the others
tree.add(mesh(new THREE.CylinderGeometry(0.09, 0.14, 1.2, 7), owlBarkM, 0, 0.6, 0));
var branch = mesh(new THREE.CylinderGeometry(0.035, 0.055, 0.72, 6), owlBarkM, 0.44, 0.72, 0);
branch.rotation.z = -Math.PI / 2 + 0.08; tree.add(branch);
var owlBlobs = [[0, 1.5, 0, 0.52], [0.32, 1.32, 0.15, 0.38], [-0.3, 1.3, -0.12, 0.4], [0.1, 1.38, -0.34, 0.32], [-0.12, 1.78, 0.06, 0.3]];
tree.add(leafCards(owlBlobs, [0, 1.45, 0], 1, 11, 280));
tree.add(mesh(new THREE.SphereGeometry(0.62, 8, 6), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }), 0, 1.45, 0)); // invisible tap target for the canopy
var hole = mesh(new THREE.CircleGeometry(0.05, 8), new THREE.MeshBasicMaterial({ color: lc(0x3a3f55) }), 0, 0.45, 0.126);
hole.scale.y = 1.3; tree.add(hole);
var lantern = new THREE.Group(), lanternM = glowMat(0xf2b35e);
lantern.position.set(0.7, 0.71, 0); tree.add(lantern);
lantern.add(mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.12, 4), darkM, 0, -0.06, 0));
lantern.add(mesh(new THREE.ConeGeometry(0.06, 0.05, 6), darkM, 0, -0.135, 0));
lantern.add(mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.09, 6), lanternM, 0, -0.205, 0));
lantern.add(mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.02, 6), darkM, 0, -0.26, 0));
var lampLight = new THREE.PointLight(lc(0xf2b35e), 0, 2.6, 2); lampLight.position.y = -0.2; lantern.add(lampLight);
ground(tree, [-2.4, -2.1], -0.05).rotation.y = 0.6;
var owlSpot = addSpot(tree, "澜的栖枝", null);

// the stone-ringed clearing: an invisible tap disc over it
var houseDisc = mesh(new THREE.CylinderGeometry(CR + 0.2, CR + 0.2, 0.1, 24), new THREE.MeshBasicMaterial({ visible: false }), CX, HC + 0.05, 0);
scene.add(houseDisc);
var houseSpot = addSpot(houseDisc, "这里以后盖我们的小房子～", new THREE.Vector3(CX, HC + 0.6, 0));
houseSpot.parts = [ring];

[clawdSpot, wolfSpot, owlSpot].forEach(function (s) { s.anchor = topOf(s.obj); });
var tapTargets = [islandMesh, spotsG, houseDisc];
var owlPerch = tree.localToWorld(new THREE.Vector3(0.45, 0.78, 0));
