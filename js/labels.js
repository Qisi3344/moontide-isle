/* 月汐小岛 · labels.js — 点击小景点冒出的气泡名字 */
"use strict";
// ---------- spot labels ----------
var pageEl = document.getElementById("top"), projV = new THREE.Vector3();
function poke(s) {
  s.t = timeU.value;
  if (!s.el) {
    s.el = document.createElement("div"); s.el.className = "x-bubble"; s.el.setAttribute("role", "status");
    var inner = document.createElement("span"); inner.className = "x-bubble__in"; inner.textContent = s.label;
    s.el.appendChild(inner); pageEl.appendChild(s.el);
  }
  s.on = true; placeBubble(s);
  s.el.classList.remove("is-on"); void s.el.offsetWidth; s.el.classList.add("is-on");
  clearTimeout(s.timer);
  s.timer = setTimeout(function () { s.el.classList.remove("is-on"); s.timer = setTimeout(function () { s.on = false; }, 400); }, 2500);
}
function placeBubble(s) {
  projV.copy(s.anchor).project(camera);
  var w = el.clientWidth, h = el.clientHeight;
  s.el.style.visibility = projV.z > 1 ? "hidden" : "visible";
  s.el.style.transform = "translate3d(" + ((projV.x + 1) / 2 * w).toFixed(1) + "px," + ((1 - projV.y) / 2 * h).toFixed(1) + "px,0)";
}
function updateSpots(t, n) {
  spotList.forEach(function (s) {
    var a = t - s.t, k = a < 0.9 ? Math.sin(a * 16) * Math.exp(-5 * a) * (reduce ? 0.4 : 1) : 0;
    s.parts.forEach(function (p) { p.scale.set(1 + 0.1 * k, 1 - 0.2 * k, 1 + 0.1 * k); });
    if (s.on) placeBubble(s);
  });
  lantern.rotation.z = Math.sin(t * 1.5) * (reduce ? 0.04 : 0.16);
  lantern.rotation.x = Math.sin(t * 1.1 + 1) * (reduce ? 0.02 : 0.06);
  lanternM.emissiveIntensity = lerp(0.3, 1.8, n);
  lampLight.intensity = n * 1.1;
  pebbles.forEach(function (m, i) { m.emissiveIntensity = n * (0.85 + 0.25 * Math.sin(t * 1.3 + i * 1.7)); });
}
