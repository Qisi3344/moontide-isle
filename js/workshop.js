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
// IN_WORKSHOP (set by house.html / the house build): stage the yard on its own plinth with its own camera.
// On the island (2026-10-23) the 家机 just live in the real clearing, and none of this staging runs.
var IN_WS = typeof IN_WORKSHOP !== "undefined" && IN_WORKSHOP;
if (IN_WS) {
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
controls.minPolarAngle = THREE.MathUtils.degToRad(10);
controls.maxPolarAngle = THREE.MathUtils.degToRad(89); // 2026-10-23 她要能压低镜头
controls.autoRotateSpeed = 0.5;
fit = function () {
  var w = stage.clientWidth || innerWidth, h = stage.clientHeight || innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h; camera.updateProjectionMatrix();
  var vf = THREE.MathUtils.degToRad(camera.fov), hf = 2 * Math.atan(Math.tan(vf / 2) * camera.aspect);
  baseDist = Math.max(2.3 / Math.tan(hf / 2), 2.25 / Math.tan(vf / 2));
  controls.minDistance = 0.3; controls.maxDistance = baseDist * 1.6; // 2026-10-23: zoom right in on the 家机
  scene.fog.near = 40; scene.fog.far = 160;
};
fit();
camera.position.setFromSpherical(new THREE.Spherical(baseDist, THREE.MathUtils.degToRad(66), THREE.MathUtils.degToRad(70))).add(TARGET);
controls.update();
houseSpot.anchor.set(CX - 0.18, HC + 1.75, 0.05);
if (window.Island) window.Island.workshop = { plinth: plinth };
}


// ---- Clawd 试摆（2026-10-23）：果冻小螃蟹捏捏 crab3d.js 的同一个像素轮廓，静态挤出版 ----
// 只在工坊里对比大小 + 试走路；她确认后再搬上岛（届时拆成 js/clawd.js）。眼睛深靛蓝，不用黑色。
// 身体和四条小腿分开挤出，这样腿能一抬一抬地走；像真螃蟹一样横着走。
// 2026-10-23 晚：方块版 Clawd（她的侧面草图 + clawd_lab 里定稿）：方块身体、两侧方块钳、前排 4 后排 4 共 8 条方腿，
// 深靛蓝竖眼+左上高光。native 单位 = clawd_lab（总高 1.02），inner 缩到高 1，外层 g.scale = 岛上高度。
function cubeR(w, h, d, r, seg) { // box with softly rounded edges: still a block, never a sharp 白模 corner
  var g = new THREE.BoxGeometry(w, h, d, seg || 9, seg || 9, seg || 9), p = g.attributes.position, v = new THREE.Vector3(), c = new THREE.Vector3();
  var hx = w / 2 - r, hy = h / 2 - r, hz = d / 2 - r;
  for (var i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    c.set(Math.max(-hx, Math.min(hx, v.x)), Math.max(-hy, Math.min(hy, v.y)), Math.max(-hz, Math.min(hz, v.z)));
    v.sub(c); if (v.lengthSq() > 1e-12) v.setLength(r); v.add(c); p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals(); return g;
}
var CLAWD_N = { W: 1.0, H: 0.78, D: 0.675, LEG: 0.24, LW: 0.17, TOT: 1.02 };
var CLAWD_GAIT = { T: 0.72, A: 0.26, duty: 0.6 }; // calm crab gait: alternating groups, 60% planted
function makeClawd() {
  var N = CLAWD_N, W = N.W, H = N.H, D = N.D, LEG = N.LEG, LW = N.LW;
  var bodyM = toonMat(0xD97757), legM = toonMat(0xC9694B);
  var g = new THREE.Group(), inner = new THREE.Group(); g.add(inner);
  var bodyG = new THREE.Group(); inner.add(bodyG);               // glides level while walking
  var body = new THREE.Mesh(cubeR(W, H, D, 0.065), bodyM); body.position.y = LEG + H / 2; body.castShadow = true; bodyG.add(body);
  var eyeM = toonMat(0x2e3a5c); // deep indigo, never black
  var hiM = new THREE.MeshBasicMaterial({ color: lc(0xfbfdff) }); // unlit: stays bright day and night
  var EY = LEG + H * 0.56;
  var eyes = [], smile = new THREE.Group(); smile.visible = false; bodyG.add(smile);
  [-0.2, 0.2].forEach(function (x) {
    var e = new THREE.Mesh(cubeR(0.085, 0.22, 0.03, 0.012, 3), eyeM); e.position.set(x, EY, D / 2); bodyG.add(e);
    var h = new THREE.Mesh(new THREE.PlaneGeometry(0.03, 0.05), hiM); h.position.set(x - 0.016, EY + 0.06, D / 2 + 0.017); bodyG.add(h);
    eyes.push(e, h);
    var arc = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.016, 6, 14, Math.PI), eyeM); arc.position.set(x, EY - 0.02, D / 2 + 0.01); smile.add(arc); // ^ ^
  });
  var claws = [-1, 1].map(function (sd) {
    var piv = new THREE.Group(); piv.position.set(sd * W / 2, LEG + H * 0.42, 0); bodyG.add(piv);
    var c = new THREE.Mesh(cubeR(0.22, 0.2, 0.22, 0.035), bodyM); c.position.x = sd * 0.1; c.castShadow = true; piv.add(c);
    piv.userData.s = sd; return piv;
  });
  var legs = [];
  [-0.4, -0.15, 0.15, 0.4].forEach(function (x, i) {
    [-0.2, 0.2].forEach(function (z, j) {
      var piv = new THREE.Group(); piv.position.set(x * W, LEG, z); inner.add(piv);
      var m = new THREE.Mesh(cubeR(LW, LEG + 0.04, LW, 0.028, 6), legM); m.position.y = -(LEG + 0.04) / 2 + 0.02; m.castShadow = true; piv.add(m);
      piv.userData.ph = (i + j) % 2; legs.push(piv);
    });
  });
  inner.scale.setScalar(1 / N.TOT);
  g.userData = { bodyG: bodyG, legs: legs, eyes: eyes, smile: smile, claws: claws };
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
    face: { top: 1.0, side: 0.6, blush: [0.34, 0.5, 0.345, 0] },
    faceRoot: function () { return clawd.userData.bodyG; }, faceScale: CLAWD_N.TOT, faceOffY: 0, // bodyG: native units (total height 1.02)
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
function stopChar(name) { if (name === "clawd") { walk.target = null; walk.onArrive = null; } else if (CHAR[name] && CHAR[name].stop) CHAR[name].stop(); else if (typeof xiaoG !== "undefined") xiaoG.stop(); }
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
      if (talkUI.partner && C.lines[k + "_" + talkUI.partner]) k = k + "_" + talkUI.partner; // answer tailored to who asked
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
// zooming in drifts the look-at point down to the 家机 at the door, so a close-up looks at them, not the wall (2026-10-23)
function lowerOnZoom(dt) {
  if (camS.on || !IN_WS) return;
  var d = camera.position.distanceTo(controls.target), f = THREE.MathUtils.clamp((d - 0.5) / (baseDist * 0.85 - 0.5), 0, 1);
  f = f * f * (3 - 2 * f);
  var dy = (HC + 0.1 + 0.75 * f - controls.target.y) * Math.min(1, dt * 6);
  controls.target.y += dy; camera.position.y += dy;
}
updateHouse = function (t, n) { _updateHouse(t, n); var dt = Math.min(wsClock.getDelta(), 0.05); camTick(dt, t); lowerOnZoom(dt); emoTick(dt, t); };

// send the steered 家机 somewhere; cb runs on arrival
function moveChar(name, x, z, cb) {
  if (name === "clawd") { walk.target = new THREE.Vector2(x, z); walk.onArrive = cb || null; }
  else if (CHAR[name] && CHAR[name].walkTo) CHAR[name].walkTo(x, z, cb);
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
  // calm crab gait (same as clawd_lab): two checkerboard groups half a cycle apart; planted feet slide back while
  // the body glides level, lifted feet reach toward where it's going; legs on the leading side reach further.
  walk.amt += ((moving ? 1 : 0) - walk.amt) * Math.min(1, dt * 6);
  var G = CLAWD_GAIT, stride = 2 * 0.26 * Math.sin(G.A) * clawdH / CLAWD_N.TOT;   // island units per cycle
  walk.phase += dt * walk.amt * Math.min(1 / G.T * 2, walk.speed * (clawdH / 0.2) / stride); // feet keep pace with the body
  var a = walk.amt, ph = walk.phase, wdir = walk.dir || 1;
  if (walk.target) { // which local side leads: +x if the path points along the crab's +x
    var lx = Math.cos(clawd.rotation.y), lz = -Math.sin(clawd.rotation.y), tx = walk.target.x - clawd.position.x, tz = walk.target.y - clawd.position.z;
    wdir = walk.dir = (lx * tx + lz * tz) >= 0 ? 1 : -1;
  }
  u.legs.forEach(function (L) {
    var q = ((ph + L.userData.ph * 0.5) % 1 + 1) % 1, k, lift = 0;
    if (q < G.duty) k = 1 - 2 * (q / G.duty);
    else { var w = (q - G.duty) / (1 - G.duty); k = -1 + 2 * w * w * (3 - 2 * w); lift = Math.sin(w * Math.PI); }
    var lead = L.position.x * wdir > 0 ? 1.15 : 0.8;
    L.rotation.z = k * G.A * lead * wdir * a;
    L.position.y = CLAWD_N.LEG + lift * 0.02 * a;
  });
  u.bodyG.position.y = a * 0.006 + (1 - a) * Math.sin(timeU.value * 2.2) * 0.008;
  u.bodyG.rotation.z = -wdir * 0.03 * a;
  u.claws.forEach(function (p) { p.rotation.z = p.userData.s * (a * 0.15 + (1 - a) * Math.sin(timeU.value * 2.2) * 0.05); });
  if (speaking("clawd")) { u.bodyG.position.y += Math.abs(Math.sin(timeU.value * 18)) * 0.017; u.bodyG.scale.y = 1 + Math.sin(timeU.value * 18) * 0.03; } else u.bodyG.scale.y = 1 + (1 - a) * Math.sin(timeU.value * 2.2) * 0.012;
  if (marker.material.opacity > 0) { marker.material.opacity = Math.max(0, marker.material.opacity - dt * 1.2); marker.scale.multiplyScalar(1 + dt * 0.8); }
};

// sizes are settled (2026-10-23: Clawd 0.2, 小G 0.26) — the size slider is gone.
// day/night button moves to the left under the title; the party list owns the top-right corner.
(function () {
  var dn = document.getElementById("dayNight");
  if (dn && dn.style) { dn.style.right = "auto"; dn.style.left = "12px"; dn.style.top = "calc(60px + env(safe-area-inset-top))"; }
  var hn = document.getElementById("hint"); if (hn) hn.textContent = "点草地走过去 · 点家机聊天 · 双指拖动挪镜头";
})();
window.Island.clawd = clawd;
