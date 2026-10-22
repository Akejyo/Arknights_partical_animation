export const renderers = [
  { id: 'v1.3.0', name: '当前版 · 1.3.0', kind: 'module', module: '../versions/v1.3.0/index.js', note: '自然回归转场 · 密集柔边圆点 · 鼠标力度随图案缩放' },
  { id: 'v1.2.0', name: '自然转场 · 1.2.0', kind: 'module', module: '../versions/v1.2.0/index.js', note: '自然回归转场 · 长距离鼠标作用 · 固定像素力度' },
  { id: 'v1.1.0', name: '密集点阵 · 1.1.0', kind: 'module', module: '../versions/v1.1.0/index.js', note: '固定时长转场 · 长距离鼠标作用 · 密集柔边圆点' },
  { id: 'v1.0.0', name: '初版模块 · 1.0.0', kind: 'module', module: '../versions/v1.0.0/index.js', note: '固定时长散开重组 · 局部鼠标作用 · 较疏的方形粒子' },
  { id: 'optimized', name: '原有优化版 · index_particle.js', kind: 'legacy', script: '../legacy/index_particle.js', note: '保留你提供的帧时间补偿、亮度透明度和原有运动逻辑' },
  { id: 'original', name: '原仓库版 · JS.js', kind: 'legacy', script: '../legacy/JS.js', note: '原仓库的亮度阈值、方形粒子、按帧回归和鼠标排斥逻辑' },
  { id: 'experiment-spread', name: '实验版 · JS_2.js', kind: 'experiment', script: '../legacy/JS_2.js', note: '原来的自由扩散实验；粒子会离开初始图案，切图时重新初始化' },
  { id: 'experiment-return', name: '实验版 · JS_3.js', kind: 'experiment', script: '../legacy/JS_3.js', note: '原来的回归力实验；保留其较弱回归与速度累积，切图时重新初始化' },
];
export const images = [
  { id: 'sami', name: '萨米', en: 'SAMI', path: '../assets/sami.webp' },
  { id: 'avatar', name: '头像', en: 'AVATAR', path: '../avatar.jpg' },
  { id: 'penguin', name: '企鹅', en: 'PENGUIN', path: '../xi_gua_ka.jpg' },
  { id: 'crystal', name: '晶体', en: 'CRYSTAL', path: '../assets/crystal.svg' },
  { id: 'orbit', name: '轨道', en: 'ORBIT', path: '../assets/orbit.svg' },
];
export const channel = 'akejyo-particle-playground';
