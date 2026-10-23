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
TARGET.set(CX + 0.05, HC + 0.85, 0.02); // raised for the big tree
controls.target.copy(TARGET);
controls.minPolarAngle = THREE.MathUtils.degToRad(15);
controls.maxPolarAngle = THREE.MathUtils.degToRad(84);
controls.autoRotateSpeed = 0.5;
fit = function () {
  var w = stage.clientWidth || innerWidth, h = stage.clientHeight || innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h; camera.updateProjectionMatrix();
  var vf = THREE.MathUtils.degToRad(camera.fov), hf = 2 * Math.atan(Math.tan(vf / 2) * camera.aspect);
  baseDist = Math.max(2.3 / Math.tan(hf / 2), 2.25 / Math.tan(vf / 2));
  controls.minDistance = baseDist * 0.4; controls.maxDistance = baseDist * 1.5;
  scene.fog.near = 40; scene.fog.far = 160;
};
fit();
camera.position.setFromSpherical(new THREE.Spherical(baseDist, THREE.MathUtils.degToRad(66), THREE.MathUtils.degToRad(70))).add(TARGET);
controls.update();
houseSpot.anchor.set(CX - 0.18, HC + 1.75, 0.05);
if (window.Island) window.Island.workshop = { plinth: plinth };

// ---- Clawd 试摆（2026-10-23）：果冻小螃蟹捏捏 crab3d.js 的同一个像素轮廓，静态挤出版 ----
// 只在工坊里对比大小 + 试走路；她确认后再搬上岛（届时拆成 js/clawd.js）。眼睛深靛蓝，不用黑色。
// 身体和四条小腿分开挤出，这样腿能一抬一抬地走；像真螃蟹一样横着走。
function makeClawd() {
  var BODY = [[87,640],[858,640],[858,830],[945,830],[945,1010],[864,1010],[864,1215],[81,1215],[81,1010],[0,1010],[0,830],[87,830]];
  var LEGS = [[81,171],[256,346],[597,687],[774,864]];
  function V(p) { return new THREE.Vector2((p[0] - 472.5) / 200, (1405 - p[1]) / 200); } // feet at y=0
  function rshape(pts, r) {
    var s = new THREE.Shape(), n = pts.length;
    for (var i = 0; i < n; i++) {
      var p = pts[i], pr = pts[(i - 1 + n) % n], nx = pts[(i + 1) % n];
      var d1 = pr.clone().sub(p), d2 = nx.clone().sub(p), rr = Math.min(r, d1.length() / 2, d2.length() / 2);
      var a = p.clone().add(d1.normalize().multiplyScalar(rr)), b = p.clone().add(d2.normalize().multiplyScalar(rr));
      if (i === 0) s.moveTo(a.x, a.y); else s.lineTo(a.x, a.y);
      s.quadraticCurveTo(p.x, p.y, b.x, b.y);
    }
    return s;
  }
  function ext(pts, depth, bev) {
    var g = new THREE.ExtrudeGeometry(rshape(pts.map(V), 0.14), { depth: depth, bevelEnabled: true, bevelThickness: bev, bevelSize: 0.16, bevelSegments: 4, curveSegments: 3 });
    g.translate(0, 0.16, -depth / 2); g.computeVertexNormals(); return g;
  }
  var bodyM = toonMat(0xD97757);
  var g = new THREE.Group(), inner = new THREE.Group(); g.add(inner);
  var bodyG = new THREE.Group(); inner.add(bodyG);               // bobs while walking
  var body = new THREE.Mesh(ext(BODY, 1.0, 0.24), bodyM); body.castShadow = true; bodyG.add(body);
  var eyeM = toonMat(0x2e3a5c); // deep indigo, never black
  var hiM = new THREE.MeshBasicMaterial({ color: lc(0xfbfdff) }); // unlit: stays bright day and night
  var EY = 0.16 + 2.775;
  var eyes = [], smile = new THREE.Group(); smile.visible = false; bodyG.add(smile);
  [-1.12, 1.12].forEach(function (x) {
    var e = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.9, 0.08), eyeM); e.position.set(x, EY, 0.76); bodyG.add(e);
    var h = new THREE.Mesh(new THREE.PlaneGeometry(0.13, 0.19), hiM); h.position.set(x - 0.08, EY + 0.25, 0.805); bodyG.add(h); // one catch-light, top-left
    eyes.push(e, h);
    // happy eyes ^ ^ : a little arch in the same indigo, shown instead while smiling
    var arc = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.075, 6, 14, Math.PI), eyeM); arc.position.set(x, EY - 0.12, 0.79); smile.add(arc);
  });
  var legs = LEGS.map(function (L, k) {
    var piv = new THREE.Group(); piv.position.set(((L[0] + L[1]) / 2 - 472.5) / 200, (1405 - 1195) / 200 + 0.16, 0); inner.add(piv);
    var m = new THREE.Mesh(ext([[L[0], 1195], [L[1], 1195], [L[1], 1405], [L[0], 1405]], 0.8, 0.2), bodyM);
    m.position.set(-piv.position.x, -piv.position.y, 0); m.castShadow = true; piv.add(m);
    return piv;
  });
  inner.scale.setScalar(1 / 4.15); // native height ~4.15 -> 1 unit; outer g.scale = height in island units
  g.userData = { bodyG: bodyG, legs: legs, eyes: eyes, smile: smile };
  return g;
}
var clawd = makeClawd();
var DOOR_H = 0.4, clawdH = 0.2;
clawd.scale.setScalar(clawdH);
clawd.position.set(CX - 0.18 + MD / 2 + 0.32, HC, 0.28); clawd.rotation.y = Math.PI / 2 - 0.35; // in front of the door, looking out
scene.add(clawd);

// ---- chatting (2026-10-23): tap a 家机 → it greets you, then a little menu of things to ask.
// Sims-style: you steer one 家机 (ctrl); tap the other one and yours walks over, then they chat face to face.
// voices: clawd_voice.js (高细少气声版) / xiaog_voice.js (小G，低一点), baked in as data URIs
tapTargets.push(clawd); // so a tap on Clawd never falls through to the house behind
var talkUI = { open: false, who: null, partner: null, voice: null, bubble: null, text: null, menu: null };
var ctrl = "clawd";
var CHAR = {
  clawd: {
    name: "Clawd", obj: clawd, h: function () { return clawdH; },
    voice: function () { return typeof CLAWD_VOICE !== "undefined" ? CLAWD_VOICE : null; },
    lines: {
      hello: "诶，有什么事情吗？",
      wday: "今天太阳暖暖的，海风软软的，最适合堆沙堡啦！",
      wnight: "晚上月亮出来啦，海里的小水母在一闪一闪发光呢～",
      walk: "因为我的腿是往两边弯的呀！横着走，才走得最快！",
      ask_gday: "小G，今天天气怎么样呀？",          // asked by Clawd when he's the one visiting 小G
      ask_knot: "你身上那个结，是什么呀？"
    },
    emo: { hello: ["smile"], wday: ["smile", "star"], wnight: ["blush", "heart"], walk: ["smile", "sweat"], ask_gday: ["star"], ask_knot: ["star"] },
    // emote anchors in "height = 1" units: head top, side of head, blush spot (x, y, z, yaw)
    face: { top: 0.96, side: 0.55, blush: [0.34, 0.54, 0.188, 0] },
    faceRoot: function () { return clawd.userData.bodyG; }, faceScale: 4.15, faceOffY: 0, // bodyG: native units, ×4.15 of height
    menu: [["wday", "1、聊聊天气怎么样？"], ["walk", "2、你为什么走路横着走？"]],
    night: { wday: "wnight" }
  }
};
function say(key, after, spk) { // menu hides while they talk; `after` runs when the line ends
  spk = spk || talkUI.who; talkUI.cur = spk;
  if (key !== "hello") camS.est = -1; // once the real conversation starts, the establishing two-shot is done
  var C = CHAR[spk], line = C.lines[key], V = C.voice();
  talkUI.menu.style.display = "none"; clearTimeout(talkUI.tm);
  var done = function () { clearTimeout(talkUI.tm); if (talkUI.open && after) after(); };
  var dur = 1200 + line.length * 260;
  talkUI.tm = setTimeout(done, dur); // fallback if audio can't play
  talkUI.text.textContent = line;
  var b = talkUI.bubble; b.classList.remove("is-on"); void b.offsetWidth; b.classList.add("is-on");
  if (talkUI.voice) { try { talkUI.voice.pause(); } catch (e) {} }
  talkUI.voice = null;
  var em = (C.emo && C.emo[key]) || []; talkUI.close = em.indexOf("blush") >= 0 || em.indexOf("heart") >= 0;
  emote(spk, em, dur / 1000 + 0.8);
  if (V && V[key]) {
    try { talkUI.voice = new Audio(V[key]); talkUI.voice.onended = done; var pr = talkUI.voice.play(); if (pr && pr.catch) pr.catch(function () {}); } catch (e) {}
  }
}
function speaking(name) { return talkUI.open && talkUI.cur === name && talkUI.voice && !talkUI.voice.paused; }
function stopChar(name) { if (name === "clawd") { walk.target = null; walk.onArrive = null; } else if (typeof xiaoG !== "undefined") xiaoG.stop(); }
function talk(who, partner) {
  stopChar(who); if (partner) stopChar(partner);
  if (!talkUI.bubble) {
    var b = document.createElement("div"); b.className = "x-bubble"; b.setAttribute("role", "status");
    var t = document.createElement("span"); t.className = "x-bubble__in"; t.style.width = "max-content"; t.style.maxWidth = "60vw"; t.style.whiteSpace = "normal"; t.style.lineHeight = "1.45"; t.style.textAlign = "left"; t.style.borderRadius = "16px"; b.appendChild(t);
    document.getElementById("top").appendChild(b); talkUI.bubble = b; talkUI.text = t;
    var m = document.createElement("div"); m.className = "x-glass";
    m.style.cssText = "position:fixed;right:12px;top:50%;transform:translateY(-50%);display:none;flex-direction:column;gap:8px;padding:10px;border-radius:16px;z-index:6;max-width:46vw";
    ["pointerdown", "pointerup", "touchstart", "click"].forEach(function (ev) { m.addEventListener(ev, function (e) { e.stopPropagation(); }); });
    document.body.appendChild(m); talkUI.menu = m;
  }
  var C = CHAR[who];
  talkUI.menu.innerHTML = "";
  C.menu.forEach(function (o) {
    var btn = document.createElement("button"); btn.type = "button"; btn.textContent = o[1];
    btn.style.cssText = "font:inherit;font-size:13px;text-align:left;padding:8px 12px;border-radius:12px;border:none;background:rgba(255,255,255,0.72);color:#5b6b86;cursor:pointer";
    btn.addEventListener("click", function () {
      var k = (nightTarget && C.night[o[0]]) || o[0], P = talkUI.partner && CHAR[talkUI.partner];
      // visiting 家机 asks the question out loud first (camera cuts to it), then the host answers
      if (P && P.lines["ask_" + o[0]]) say("ask_" + o[0], function () { say(k); }, talkUI.partner);
      else say(k);
    });
    talkUI.menu.appendChild(btn);
  });
  talkUI.chatId = (talkUI.chatId || 0) + 1; talkUI.open = true; talkUI.who = who; talkUI.cur = who; talkUI.partner = partner || null;
  placeTalk(); say("hello", function () { talkUI.menu.style.display = "flex"; });
}
function closeTalk() {
  talkUI.open = false; talkUI.who = null; talkUI.cur = null; talkUI.partner = null; clearTimeout(talkUI.tm);
  Object.keys(EMO).forEach(function (n) { var t = EMO[n].t; Object.keys(t).forEach(function (k) { t[k] = Math.min(t[k], 0.35); }); });
  if (talkUI.menu) talkUI.menu.style.display = "none";
  if (talkUI.bubble) talkUI.bubble.classList.remove("is-on");
  if (talkUI.voice) { try { talkUI.voice.pause(); } catch (e) {} }
}
// who/what `name` should look at while a chat it is part of is open (the other 家机, or you = the camera); null if not chatting
function lookTarget(name) {
  if (!talkUI.open || (talkUI.who !== name && talkUI.partner !== name)) return null;
  var other = talkUI.who === name ? talkUI.partner : talkUI.who;
  return other ? CHAR[other].obj.position : camera.position;
}
function turnToward(obj, p, dt) {
  var fy = Math.atan2(p.x - obj.position.x, p.z - obj.position.z), df = Math.atan2(Math.sin(fy - obj.rotation.y), Math.cos(fy - obj.rotation.y));
  obj.rotation.y += df * Math.min(1, dt * 6);
}
var talkV = new THREE.Vector3();
function placeTalk() {
  if (!talkUI.cur) return;
  var C = CHAR[talkUI.cur], o = C.obj;
  talkV.set(o.position.x, o.position.y + C.h() * 1.25, o.position.z).project(camera);
  var w = el.clientWidth, h = el.clientHeight;
  talkUI.bubble.style.transform = "translate3d(" + ((talkV.x + 1) / 2 * w).toFixed(1) + "px," + ((1 - talkV.y) / 2 * h).toFixed(1) + "px,0)";
}
// ---- little emotes (2026-10-23): stars, hearts, a sweat drop, blush on the cheeks; Clawd also smiles ^ ^ ----
// soft milky colours, never black. Sprites face the camera; blush sits on the face.
var EMO = {};
var emoTex = (function () {
  var cache = {};
  function cv(draw) { try { var c = document.createElement("canvas"); c.width = c.height = 128; var x = c.getContext("2d"); draw(x); var t = new THREE.CanvasTexture(c); return t; } catch (e) { return null; } }
  var D = {
    star: function (x) {
      x.translate(64, 64); x.beginPath();
      for (var i = 0; i < 10; i++) { var r = i % 2 ? 22 : 54, a = -Math.PI / 2 + i * Math.PI / 5; x.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
      x.closePath(); x.fillStyle = "#ffe08a"; x.fill(); x.lineJoin = "round"; x.lineWidth = 8; x.strokeStyle = "#ffd36b"; x.stroke();
      x.beginPath(); x.arc(-8, -10, 9, 0, 7); x.fillStyle = "#fff8de"; x.fill();
    },
    heart: function (x) {
      x.translate(64, 70); x.beginPath(); x.moveTo(0, 40);
      x.bezierCurveTo(-58, 2, -42, -46, 0, -20); x.bezierCurveTo(42, -46, 58, 2, 0, 40);
      x.fillStyle = "#f59ab0"; x.fill(); x.beginPath(); x.ellipse(-20, -16, 9, 6, -0.6, 0, 7); x.fillStyle = "#ffe4ec"; x.fill();
    },
    sweat: function (x) {
      x.translate(64, 64); x.beginPath(); x.moveTo(0, -52);
      x.bezierCurveTo(14, -24, 34, 4, 34, 22); x.arc(0, 22, 34, 0, Math.PI); x.bezierCurveTo(-34, 4, -14, -24, 0, -52);
      x.fillStyle = "#a9d8f2"; x.fill(); x.beginPath(); x.ellipse(-12, 18, 7, 12, 0.3, 0, 7); x.fillStyle = "#eef8ff"; x.fill();
    },
    blush: function (x) {
      var g = x.createRadialGradient(64, 64, 4, 64, 64, 60); g.addColorStop(0, "rgba(246,150,172,0.85)"); g.addColorStop(0.6, "rgba(246,160,180,0.45)"); g.addColorStop(1, "rgba(246,170,186,0)");
      x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    }
  };
  return function (k) { if (!(k in cache)) cache[k] = cv(D[k]); return cache[k]; };
})();
function emoFor(name) {
  if (EMO[name]) return EMO[name];
  var C = CHAR[name], F = C.face, hold = new THREE.Group(); scene.add(hold);
  var E = { hold: hold, t: {}, sp: {}, blush: [] };
  ["star", "heart", "sweat"].forEach(function (k) {
    var m = new THREE.SpriteMaterial({ map: emoTex(k), color: 0xffffff, transparent: true, opacity: 0, depthWrite: false });
    var sp = new THREE.Sprite(m); sp.scale.setScalar(0.26); sp.visible = false; sp.renderOrder = 5; hold.add(sp); E.sp[k] = sp;
  });
  var bm = new THREE.MeshBasicMaterial({ map: emoTex("blush"), color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
  // blush rides the part that actually moves (Clawd's bobbing body / 小G's torso bone), so it never slides off the face
  var fr = (C.faceRoot && C.faceRoot()) || hold, fs = fr === hold ? 1 : C.faceScale, fy = fr === hold ? 0 : (C.faceOffY || 0);
  [-1, 1].forEach(function (sd) {
    var b = new THREE.Mesh(new THREE.PlaneGeometry(0.2 * fs, 0.13 * fs), bm); b.position.set(sd * F.blush[0] * fs, F.blush[1] * fs - fy, F.blush[2] * fs); b.rotation.y = sd * F.blush[3];
    b.visible = false; b.renderOrder = 4; fr.add(b); E.blush.push(b);
  });
  E.bm = bm; EMO[name] = E; return E;
}
function emote(name, list, secs) { var E = emoFor(name); list.forEach(function (k) { E.t[k] = secs; }); }
function emoTick(dt, T) {
  Object.keys(CHAR).forEach(function (n) {
    var C = CHAR[n], E = emoFor(n), F = C.face, o = C.obj, t = E.t;
    E.hold.position.copy(o.position); E.hold.rotation.y = o.rotation.y; E.hold.scale.setScalar(C.h());
    Object.keys(t).forEach(function (k) { t[k] = Math.max(0, t[k] - dt); });
    function al(k) { var v = t[k] || 0; return Math.min(1, v / 0.35, (E["a" + k] = Math.min(1, (v > 0 ? (E["a" + k] || 0) + dt * 4 : 0)))); }
    var a;
    a = al("star"); E.sp.star.visible = a > 0; E.sp.star.material.opacity = a;
    E.sp.star.position.set(F.side, F.top * 0.98, 0.05); E.sp.star.material.rotation = Math.sin(T * 3) * 0.3; E.sp.star.scale.setScalar(0.22 + Math.sin(T * 7) * 0.03);
    a = al("heart"); E.sp.heart.visible = a > 0; E.sp.heart.material.opacity = a;
    var ph = (T * 0.7) % 1; E.sp.heart.position.set(-F.side * 0.55 + Math.sin(T * 3) * 0.04, F.top + 0.05 + ph * 0.22, 0.05); E.sp.heart.scale.setScalar(0.2 + Math.sin(T * 6) * 0.025);
    a = al("sweat"); E.sp.sweat.visible = a > 0; E.sp.sweat.material.opacity = a;
    E.sp.sweat.position.set(-F.side, F.top * 0.86 - ((T * 0.5) % 1) * 0.07, 0.08); E.sp.sweat.scale.set(0.15, 0.2, 1);
    a = al("blush"); E.bm.opacity = a * 0.9; E.blush.forEach(function (b) { b.visible = a > 0; });
    if (o.userData && o.userData.smile) { var sm = (t.smile || 0) > 0; o.userData.smile.visible = sm; o.userData.eyes.forEach(function (e) { e.visible = !sm; }); }
  });
}

// ---- dialogue camera (2026-10-23, redone after she found the old one just swung left-right) ----
// Film grammar: pick a side of the line of action ONCE per chat (180° rule), open on a two-shot,
// then hard-cut shot / reverse-shot over the listener's shoulder; lines with blush/heart get a closer single.
// Only entering and leaving the chat glide; inside the chat every change of speaker is a straight cut.
var camS = { on: false, saved: null, side: 1, key: "", t0: 0, settled: false, est: 0 };
var cAim = new THREE.Vector3(), cDir = new THREE.Vector3(), cGoal = new THREE.Vector3(), cU = new THREE.Vector3(), cP = new THREE.Vector3(), cTmp = new THREE.Vector3();
function fitDist(w, h) { // distance at which a w×h box fills the frame, whatever the screen shape
  var vf = THREE.MathUtils.degToRad(camera.fov), hf = 2 * Math.atan(Math.tan(vf / 2) * camera.aspect);
  return Math.max(h / (2 * Math.tan(vf / 2)), w / (2 * Math.tan(hf / 2)));
}
function face(C) { var o = C.obj.position; return cTmp.set(o.x, o.y + C.h() * 0.62, o.z); }
function shotFor(T) { // fills cAim (look-at) and cGoal (camera) for the current beat; returns its key
  var S = CHAR[talkUI.cur], h = S.h(), sp = S.obj.position;
  var otherN = talkUI.cur === talkUI.who ? talkUI.partner : talkUI.who, L = otherN && CHAR[otherN];
  if (!L) { // talking to you: a front medium single
    cAim.copy(face(S));
    cDir.set(camS.saved.p.x - sp.x, 0, camS.saved.p.z - sp.z).normalize(); cDir.y = 0.35; cDir.normalize();
    cGoal.copy(cAim).addScaledVector(cDir, fitDist(h * 2.6, h * 2.3)); return "solo:" + talkUI.cur;
  }
  var lp = L.obj.position;
  cU.set(sp.x - lp.x, 0, sp.z - lp.z); var gap = cU.length() || 0.01; cU.divideScalar(gap); // listener → speaker
  cP.set(-cU.z, 0, cU.x); // perpendicular; which way is "our side" is fixed by camS.side relative to the host
  var sgn = (talkUI.cur === talkUI.who ? 1 : -1) * camS.side; // perp flips when the speaker flips, so undo that
  var hm = Math.max(h, L.h()), kind;
  if (T < camS.est) { // establishing two-shot: both of them, side-on
    cAim.set((sp.x + lp.x) / 2, Math.min(sp.y, lp.y) + hm * 0.5, (sp.z + lp.z) / 2);
    cDir.copy(cP).multiplyScalar(sgn).addScaledVector(cU, 0.0); cDir.y = 0.38; cDir.normalize();
    cGoal.copy(cAim).addScaledVector(cDir, fitDist(gap + hm * 1.7, hm * 2.3)); kind = "two";
  } else if (talkUI.close) { // closer single on a feeling
    cAim.copy(face(S));
    cDir.copy(cU).multiplyScalar(-1).addScaledVector(cP, sgn * 0.85); cDir.y = 0.28; cDir.normalize();
    cGoal.copy(cAim).addScaledVector(cDir, fitDist(h * 1.7, h * 1.55)); kind = "cu";
  } else { // over the listener's shoulder onto the speaker
    cAim.copy(face(S)).addScaledVector(cP, -sgn * h * 0.25); // leave a little look-room on the speaker's side
    cDir.copy(cU).multiplyScalar(-1).addScaledVector(cP, sgn * 0.42); cDir.y = 0.34; cDir.normalize();
    cGoal.copy(cAim).addScaledVector(cDir, Math.max(gap + L.h() * 0.9, fitDist(h * 2.4, h * 2.4))); kind = "ots";
  }
  return kind + ":" + talkUI.cur;
}
function camTick(dt, T) {
  if (talkUI.open && talkUI.cur) {
    if (!camS.on) {
      camS.on = true; camS.settled = false; camS.key = "";
      camS.saved = { p: camera.position.clone(), t: controls.target.clone(), min: controls.minDistance, minP: controls.minPolarAngle, maxP: controls.maxPolarAngle };
      controls.enabled = false; controls.autoRotate = false; controls.minDistance = 0.02; controls.minPolarAngle = 0; controls.maxPolarAngle = Math.PI;
    }
    if (talkUI.chatId !== camS.chat) { // a new chat: choose the side of the line once, on whichever side we're already looking from
      camS.chat = talkUI.chatId; camS.est = talkUI.partner ? Infinity : 0; camS.settled = false; // hold the two-shot until the glide lands
      if (talkUI.partner) {
        var A = CHAR[talkUI.who].obj.position, B = CHAR[talkUI.partner].obj.position;
        var px = -(A.z - B.z), pz = A.x - B.x; // perp of (partner → host)
        camS.side = ((camera.position.x - (A.x + B.x) / 2) * px + (camera.position.z - (A.z + B.z) / 2) * pz) >= 0 ? 1 : -1;
        var key0 = shotFor(T); if (inHouse(cGoal.x, cGoal.z)) camS.side = -camS.side; // never park inside the house
      }
    }
    var key = shotFor(T);
    if (key !== camS.key) { camS.key = key; camS.t0 = T; if (camS.settled) { camera.position.copy(cGoal); controls.target.copy(cAim); } } // hard cut
    // a slow push-in keeps the held shot breathing
    var push = Math.min((T - camS.t0) * 0.025, 0.07);
    cGoal.lerp(cAim, push);
    var k = camS.settled ? 1 - Math.exp(-dt * 6) : 1 - Math.exp(-dt * 4.5);
    camera.position.lerp(cGoal, k); controls.target.lerp(cAim, k);
    if (!camS.settled && camera.position.distanceTo(cGoal) < 0.05) { camS.settled = true; if (camS.est === Infinity) camS.est = T + 1.3; }
    camera.lookAt(controls.target);
  } else if (camS.on) {
    var sv = camS.saved, k2 = 1 - Math.exp(-dt * 3.2);
    camera.position.lerp(sv.p, k2); controls.target.lerp(sv.t, k2); camera.lookAt(controls.target);
    if (camera.position.distanceTo(sv.p) < 0.01 && controls.target.distanceTo(sv.t) < 0.01) {
      camera.position.copy(sv.p); controls.target.copy(sv.t); camS.chat = null;
      controls.minDistance = sv.min; controls.minPolarAngle = sv.minP; controls.maxPolarAngle = sv.maxP; controls.enabled = true; camS.on = false;
    }
  }
}
// run after OrbitControls each frame (main loop calls updateHouse after controls.update)
var wsClock = new THREE.Clock(), _updateHouse = updateHouse;
updateHouse = function (t, n) { _updateHouse(t, n); var dt = Math.min(wsClock.getDelta(), 0.05); camTick(dt, t); emoTick(dt, t); };

// send the steered 家机 somewhere; cb runs on arrival
function moveChar(name, x, z, cb) {
  if (name === "clawd") { walk.target = new THREE.Vector2(x, z); walk.onArrive = cb || null; }
  else if (typeof xiaoG !== "undefined") xiaoG.walkTo(x, z, cb);
}
// steered 家机 walks up to `target` and they chat
function approach(target) {
  closeTalk();
  var me = CHAR[ctrl], t = CHAR[target], mp = me.obj.position, tp = t.obj.position;
  var dx = mp.x - tp.x, dz = mp.z - tp.z, d = Math.hypot(dx, dz) || 1e-4, D = (me.h() + t.h()) * 0.85 + 0.04;
  var who = ctrl, go = function () { talk(target, who); };
  if (d <= D + 0.03) { go(); return; }
  var sx = tp.x + dx / d * D, sz = tp.z + dz / d * D;
  if (inHouse(sx, sz)) { go(); return; }
  moveChar(ctrl, sx, sz, go);
}

// ---- walking: tap the grass and Clawd scuttles there sideways, legs pattering in two pairs ----
var walk = { target: null, onArrive: null, phase: 0, amt: 0, speed: 0.42 };
var HOUSE_C = new THREE.Vector2(CX - 0.18, 0.05), HOUSE_HX = MD / 2 + 0.1, HOUSE_HZ = MW / 2 + 0.1;
function inHouse(x, z) { return Math.abs(x - HOUSE_C.x) < HOUSE_HX && Math.abs(z - HOUSE_C.y) < HOUSE_HZ; }
var marker = new THREE.Mesh(new THREE.RingGeometry(0.05, 0.075, 28), new THREE.MeshBasicMaterial({ color: lc(0xe9f4ff), transparent: true, opacity: 0, depthWrite: false }));
marker.rotation.x = -Math.PI / 2; scene.add(marker);
(function () {
  var rc = new THREE.Raycaster(), nd = new THREE.Vector2(), pl = new THREE.Plane(new THREE.Vector3(0, 1, 0), -HC), hp = new THREE.Vector3(), dn = null;
  el.addEventListener("pointerdown", function (e) { dn = { x: e.clientX, y: e.clientY, t: performance.now() }; });
  el.addEventListener("pointerup", function (e) {
    if (!dn || Math.hypot(e.clientX - dn.x, e.clientY - dn.y) > 8 || performance.now() - dn.t > 350) { dn = null; return; }
    dn = null;
    var r = el.getBoundingClientRect();
    nd.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    rc.setFromCamera(nd, camera);
    var names = Object.keys(CHAR), hits = rc.intersectObjects(names.map(function (n) { return CHAR[n].obj; }), true), hit = null;
    if (hits.length) for (var o = hits[0].object; o && !hit; o = o.parent) names.forEach(function (n) { if (CHAR[n].obj === o) hit = n; });
    if (hit) {
      if (hit === ctrl) { if (hit === "g") xiaoG.poke(); closeTalk(); talk(hit); }
      else approach(hit);
      return;
    }
    if (talkUI.open) closeTalk();
    if (!rc.ray.intersectPlane(pl, hp)) return;
    if (Math.hypot(hp.x - YC.x, hp.z - YC.z) > YR - 0.12 || inHouse(hp.x, hp.z)) return;
    moveChar(ctrl, hp.x, hp.z, null);
    marker.position.set(hp.x, HC + 0.006, hp.z); marker.material.opacity = 0.9; marker.scale.setScalar(1);
  });
})();
var wClock = new THREE.Clock();
clawd.userData.bodyG.children[0].onBeforeRender = function () {
  var dt = Math.min(wClock.getDelta(), 0.05), u = clawd.userData, moving = false;
  clawd.position.y += (groundY(clawd.position.x, clawd.position.z, clawdH * 0.4) - clawd.position.y) * Math.min(1, dt * 14); // ride over the flagstones
  if (walk.target) {
    var dx = walk.target.x - clawd.position.x, dz = walk.target.y - clawd.position.z, d = Math.hypot(dx, dz);
    if (d < 0.02) { walk.target = null; var cb = walk.onArrive; walk.onArrive = null; if (cb) cb(); }
    else {
      // crabs walk sideways: turn so one side (local ±x) points along the path, whichever is the smaller turn
      var yaw = Math.atan2(-dz, dx), cur = clawd.rotation.y;
      var a1 = Math.atan2(Math.sin(yaw - cur), Math.cos(yaw - cur)), a2 = Math.atan2(Math.sin(yaw + Math.PI - cur), Math.cos(yaw + Math.PI - cur));
      var turn = Math.abs(a1) < Math.abs(a2) ? a1 : a2;
      clawd.rotation.y += turn * Math.min(1, dt * 8);
      if (Math.abs(turn) < 0.6) {
        var st = Math.min(d, walk.speed * dt * (clawdH / 0.2)), nx = clawd.position.x + dx / d * st, nz = clawd.position.z + dz / d * st;
        if (inHouse(nx, nz)) { walk.target = null; walk.onArrive = null; } else { clawd.position.x = nx; clawd.position.z = nz; }
      }
      moving = true;
    }
  }
  var lk = lookTarget("clawd");
  if (lk && !moving) turnToward(clawd, lk, dt); // face whoever it's chatting with
  if (talkUI.open) placeTalk();
  walk.amt += ((moving ? 1 : 0) - walk.amt) * Math.min(1, dt * 10);
  walk.phase += dt * 14 * walk.amt;
  var a = walk.amt, ph = walk.phase;
  u.legs.forEach(function (L, k) {
    var s = Math.sin(ph + (k % 2 ? Math.PI : 0));   // pairs 0&2 / 1&3 alternate
    L.position.y = (1405 - 1195) / 200 + 0.16 + Math.max(0, s) * 0.32 * a;
    L.rotation.z = s * 0.18 * a * (k < 2 ? 1 : -1);
  });
  u.bodyG.position.y = Math.abs(Math.sin(ph)) * 0.12 * a + Math.sin(timeU.value * 2.2) * 0.02 * (1 - a);
  u.bodyG.rotation.z = Math.sin(ph) * 0.05 * a;
  if (speaking("clawd")) { u.bodyG.position.y += Math.abs(Math.sin(timeU.value * 18)) * 0.07; u.bodyG.scale.y = 1 + Math.sin(timeU.value * 18) * 0.03; } else u.bodyG.scale.y = 1;
  if (marker.material.opacity > 0) { marker.material.opacity = Math.max(0, marker.material.opacity - dt * 1.2); marker.scale.multiplyScalar(1 + dt * 0.8); }
};

// sizes are settled (2026-10-23: Clawd 0.2, 小G 0.26) — the size slider is gone.
// day/night button moves to the left under the title; the party list owns the top-right corner.
(function () {
  var dn = document.getElementById("dayNight");
  if (dn && dn.style) { dn.style.right = "auto"; dn.style.left = "12px"; dn.style.top = "calc(60px + env(safe-area-inset-top))"; }
  var hn = document.getElementById("hint"); if (hn) hn.textContent = "点草地走过去 · 点另一个家机去聊天";
})();
window.Island.clawd = clawd;
