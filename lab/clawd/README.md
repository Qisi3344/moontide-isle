# Clawd 方块小螃蟹（独立展示页）

- `clawd.js` — 建模 + 动画，只依赖全局 `THREE`（r1xx，three.min.js）。
  - `makeClawd()` → `THREE.Group`，脚底在 y=0，正面（眼睛）朝 +z，身体宽 1（原生尺寸，岛上/工坊里缩到高 0.2）。
  - 尺寸：身体 1×0.78×0.675，圆角 身体 0.065 / 钳 0.035 / 腿 0.028；8 条方腿（前排 4 后排 4）；两侧方块钳；颜色 #D97757，眼睛深靛蓝 #2e3a5c（不用黑色）。
  - `animClawd(c, t, mode, gait)` — mode: idle / walk（横着走）/ wave / cheer / cute / dance（极乐净土 15s，自编螃蟹版）。
  - 部件在 `group.userData`（legs / claws / eyes / happy / blush）。
- `main.js` — 场景、按钮、对白气泡、配音（mp3 已内嵌 base64）、WebAudio 节拍。
- `index.html` — 打包好的单文件（three + OrbitControls + clawd.js + main.js），直接浏览器打开。
- `voice/` — cheer.mp3「耶！好耶好耶！我最棒啦！」、cute.mp3「嘿嘿，可不可以，再多看我一会儿呀？」、make.sh 生成脚本。
- 游戏里用的同款方块 Clawd 在 `js/workshop.js`（cubeR / CLAWD_N / CLAWD_GAIT）。
