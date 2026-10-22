# Particle Morph

将图片转换为粒子，在切换图片时自然移动、收拢成新图案。零运行时依赖的 Canvas 2D 模块，提供 ESM 导出与 TypeScript 声明，可用于静态网页、React、Vue，以及其他能挂载 DOM 容器的前端项目。当前版本：1.3.0。

本次以你提供的 `index_particle.js` 为主要基线，同时查看了原仓库的 `JS.js`、两个实验版本和 HTML。保留亮度控制透明度、鼠标排斥、切图复用的设计，独立重写模块边界与动画逻辑。1.1.0 根据官网公开脚本分析，恢复无硬边界的远距作用，加入每粒子不同的回归时间，并默认使用密集柔边圆点。并非官网代码移植，也不承诺逐像素复刻官网。

## 1.3.0：鼠标力度随图案缩放

旧版图案随容器缩放，鼠标力度却按固定 CSS 像素计算。图案缩小时，相同相对距离对应更短的实际距离，排斥更强、位移占图案的比例也更大。仅转换鼠标坐标或适配 DPR 不能解决这一点。

- 新默认 `pointerScale: 'image'` 按图片 contain 后的实际矩形长边缩放交互，包含图片自身的透明留白；同一图片在相同相对位置保持相近的形变比例。
- `pointerReferenceSize: 400` 表示图片长边为 400 CSS px 时，使用基准力度。图片放大两倍，指针距离、作用速度和位移也按两倍计算；回归时间不变。
- inverse 模式将距离换算为基准单位；local 模式的半径和最大目标位移同时按图案缩放。
- `pointerScale: 'pixels'` 保留旧版固定像素行为。此模式忽略 `pointerReferenceSize`，local 半径依旧是固定 CSS px。
- 缩放、滚动后从最后一次指针的客户端坐标重新换算，不因容器 resize 直接清空指针。

“相同相对位置”是相对于图案的位置，不是固定屏幕坐标。窗口改变后布局位置可能变化；鼠标停在原来的屏幕位置，视觉形变仍可能不同。此外，粒子数量、静态错位、每粒子随机回归时间会带来局部差异，并非逐点严格相同。

```js
new ParticleMorph('#world-particles', {
  pointerScale: 'image', pointerReferenceSize: 400,
  pointerStrength: 28,
});
```

## 自然回归转场

1.1.0 虽然不是匀速运动，但采用固定时长的预设缓动曲线，所有粒子都在同一时刻到位，并叠加散开弧线。这容易让切图显得整齐、生硬。1.2.0 默认改为 `transition: 'relax'`：

- 每帧按粒子当前位置与新目标之间的剩余距离移动，距离大时快，接近目标时逐渐变慢。
- 每粒子的 `returnTime` 直接决定移动和透明度变化速度，没有共同的到达截止时刻。
- 正在移动时切图只改变目标，接着从当前状态收拢；不从起点重新播放进度曲线。
- 默认 `scatter: 0`，不人为制造绕行。位置残差小于 0.05 CSS px、透明度残差小于 0.001 时分别收尾，以停止无意义的持续刷新。
- `duration` 和 `scatter` **仅用于可选的 `transition: 'timed'` 模式**。希望保留 1.1.0 转场时，显式使用 `{ transition: 'timed', duration: 1100, scatter: 55 }`。

调快自然转场可设置 `returnTime: [180, 300]`；它同时影响指针扰动后的回归。`returnTime` 不是动画总时长，慢速尾段由每粒子的剩余距离决定。

## 远距交互与密集点阵

- 默认 `pointerMode: 'inverse'`：近处作用明显，远处约按距离倒数衰减，无 100px 硬边界。作用力根据粒子的当前偏移位置计算，与返回原位的力共同决定形变。
- 默认 `pointerScope: 'window'`：鼠标离开画布后仍影响粒子；离开浏览器页面、失焦或触摸结束后回归。可改为 `'container'`，仅在画布内交互。
- 每粒子的 `returnTime` 从 `[330, 500]` 毫秒范围随机选取，并在其存活期间保持；较慢粒子在同一作用下形变也略大。自然切图采用各自的回归速度，不再统一在 `duration` 结束时到位。
- 默认 `gap: 3, size: 1.8, shape: 'circle', maxParticles: 12000`，形成更密集的小圆点。圆点采用模块自行生成的柔边纹理，没有复制官网粒子素材。仍可用 `'square'` 恢复方点。
- `jitter` 是采样时的静态位置错位，不会每帧随机跳动；`drift` 是独立的持续漂浮，默认 **0（关闭）**。因此不需要用随机游动伪装鼠标形变。
- `pointerMode: 'local'` 保留上一版的局部效果，`pointerRadius` 只在此模式中生效。两种模式均用 `pointerStrength: 0` 禁用作用。

```js
const effect = new ParticleMorph('#world-particles', {
  transition: 'relax',
  gap: 3, size: 1.8, shape: 'circle', maxParticles: 12000,
  pointerMode: 'inverse', pointerScope: 'window', pointerStrength: 28,
  returnTime: [330, 500],
  jitter: 0.3, drift: 0,
});
```

数学上，远距作用速度为 `awayVector × pointerStrength × 360 / (1 + distance / interactionScale)²`，与回归项一起按毫秒积分。image 模式的 `interactionScale = 图片显示矩形长边 / pointerReferenceSize`，pixels 模式为 1。这保留距离倒数衰减的特征，但强度和时序不是原版或官网的逐帧逐值复制。

## 先看演示

需要 Node.js 18 或以上版本。进入此目录运行：

```sh
npm run demo
```

打开终端显示的 `http://127.0.0.1:4173`。不需要 `npm install`。演示含你本地项目中的 `sami.webp`、两张自制 SVG、图片上传、粒子间距、颜色、暂停、鼠标模式、静态错位与持续漂浮控件。请通过 HTTP 打开，直接双击 HTML 通常会被浏览器的模块安全规则拦截。

## 普通网页接入

将整个 `src` 文件夹复制到网站的 `/lib/particle-morph/`，必须同时保留 `index.js`、`sampling.js` 和 `motion.js`。

```html
<div id="world-particles" style="width:100%;height:480px"
     role="img" aria-label="世界观粒子图案"></div>
<button id="sami">萨米</button>
<button id="crystal">晶体</button>
<p id="message" role="status"></p>

<script type="module">
  import { ParticleMorph } from '/lib/particle-morph/index.js';

  const effect = new ParticleMorph('#world-particles', {
    color: '#add8e6', gap: 3, size: 1.8, maxParticles: 12000,
  });
  const message = document.querySelector('#message');
  const select = async url => {
    try {
      if (await effect.show(url)) message.textContent = '加载完成';
    } catch (error) { message.textContent = error.message; }
  };
  select('/images/sami.webp');
  document.querySelector('#sami').onclick = () => select('/images/sami.webp');
  document.querySelector('#crystal').onclick = () => select('/images/crystal.png');
  // 提前解码后续图片，失败不会改变当前图案。
  effect.preload(['/images/crystal.png']).catch(console.error);
  // 单页应用卸载本区域时：effect.destroy();
</script>
```

容器必须有实际宽高。模块只添加、移除自己创建的 Canvas，不覆盖 `window.onload`，也不查找 `.listItem` 或页面加载提示。按钮、文字、图片列表与业务状态由宿主网站管理。

## 用作本地 npm 包

此目录已带 `package.json`，可以从业务项目安装本地路径：

```sh
npm install /path/to/particle-morph
```

```js
import { ParticleMorph } from '@akejyo/particle-morph';
```

包名仅用于本地引用，本次没有发布到 npm。`private: true` 用于避免误发布；如果以后发布，请自行确认包名、版本、许可证，再移除此字段。`npm pack` 可生成本地安装包。包入口保持原生 ESM，无需构建，也不提供 CommonJS / 全局脚本版本。

## React

下面示例以本地 npm 包为例；复制源码接入时替换 import 路径。Next.js App Router 中请把组件文件标为 `'use client'`。模块可在服务端导入，但只能在浏览器挂载后实例化。

```jsx
import { useEffect, useRef, useState } from 'react';
import { ParticleMorph } from '@akejyo/particle-morph';

export function ParticleImage({ src }) {
  const host = useRef(null);
  const renderer = useRef(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const instance = new ParticleMorph(host.current);
    renderer.current = instance;
    return () => { instance.destroy(); renderer.current = null; };
  }, []);

  useEffect(() => {
    let active = true;
    setError('');
    renderer.current.show(src).catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [src]);

  return <>
    <div ref={host} style={{ width: '100%', height: 480 }}
         role="img" aria-label="粒子图像" />
    <p role="status">{error}</p>
  </>;
}
```

## Vue 3

```vue
<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { ParticleMorph } from '@akejyo/particle-morph';
const props = defineProps({ src: { type: String, required: true } });
const host = ref(null);
const error = ref('');
let effect, alive = true, revision = 0;
async function show(src) {
  const ticket = ++revision;
  error.value = '';
  try { await effect.show(src); }
  catch (e) { if (alive && ticket === revision) error.value = e.message; }
}
onMounted(() => { effect = new ParticleMorph(host.value); show(props.src); });
watch(() => props.src, src => { if (effect) show(src); });
onBeforeUnmount(() => { alive = false; effect?.destroy(); });
</script>
<template>
  <div ref="host" style="width:100%;height:480px" role="img" aria-label="粒子图像" />
  <p role="status">{{ error }}</p>
</template>
```

## API

| 调用 | 行为 |
| --- | --- |
| `new ParticleMorph(container, options?)` | 容器为选择器或 HTMLElement；每个实例独立管理画布和粒子 |
| `await effect.show(source)` | 加载、采样并设定新目标；成功返回 `true`，被新请求替代或已销毁返回 `false`。当前请求加载/采样失败抛错，保留上一次成功的图案。**返回时动画尚未结束** |
| `await effect.preload(sources)` | 预加载并解码 URL 图片，不切换当前图案；加载失败会抛错 |
| `effect.pause()` / `resume()` | 手动暂停/继续，暂停期间可加载新目标，恢复后动画继续 |
| `effect.resize()` | 主动更新容器尺寸；通常 ResizeObserver 自动处理即可 |
| `effect.stats` | 只读快照：`particles`、`targets`、`width`、`height`、`running`、`transitioning`、`reducedMotion`、`destroyed`。`running` 表示当前是否安排了下一动画帧；`transitioning` 表示图案位置/透明度仍在收拢，不包含鼠标偏移或漂浮 |
| `effect.canvas` | 只读使用的 Canvas 引用，便于调试；不要主动改它的宽高或绘图状态 |
| `effect.destroy()` | 取消动画、待加载 URL 图片、事件和观察器，释放缓存与粒子数组并移除画布；重复调用安全 |

`source` 支持 URL 字符串（含 data/blob URL）、HTMLImageElement、HTMLCanvasElement、ImageBitmap。传入图片元素时会等待 `decode()`；Canvas 和 Bitmap 应保持有效，直到不再需要重采样。外部图片元素的加载和 Bitmap 的关闭由调用者管理。动态图只采样调用时可绘制的一帧，不做视频跟踪。调用 `destroy()` 后其他操作会报错，`stats` 仍可读取。

## 参数

参数在构造时确定；需要改密度、颜色或模式时销毁并重建实例。演示采用此做法。非法数字或未知参数会直接抛错。

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `gap` | `3` | 期望采样点间距，CSS 像素；预算不足时自动增大实际间距 |
| `size` | `1.8` | 粒子直径（circle）或边长（square），CSS 像素 |
| `shape` | `'circle'` | 柔边圆点；`'square'` 为实心方点 |
| `maxParticles` | `12000` | 总粒子数组上限，整数 1～100000；不是性能保证 |
| `color` | `'#add8e6'` | CSS 颜色；建议使用实色，避免与亮度透明度叠乘过暗 |
| `gamma` | `1.8` | 亮度曲线，越大暗部越容易消失 |
| `threshold` | `0.08` | 透明度阈值，0～1；低于或等于阈值的采样不生成粒子 |
| `mode` | `'brightness'` | 亮部为粒子；`'dark'` 取暗部；`'alpha'` 仅按源图片透明度取轮廓 |
| `jitter` | `0.3` | 静态采样错位比例，0～1；偏移范围为每轴 ±jitter×实际间距/2；仅重采样时重新随机 |
| `transition` | `'relax'` | 从当前状态自然回归；`'timed'` 为预设固定时长缓动曲线 |
| `duration` | `1100` | 仅 timed 模式的重组时长，毫秒，必须大于 0；relax 中不参与运动 |
| `scatter` | `0` | 仅 timed 模式的弧形散开幅度，CSS 像素；relax 中不参与运动 |
| `padding` | `0.1` | 四边留白比例，范围 0 ≤ 值 < 0.5；图片保持比例 contain |
| `pixelRatio` | `2` | Canvas 分辨率所用设备像素比的上限，不改变 CSS 尺寸 |
| `pointerMode` | `'inverse'` | 无硬边界的距离倒数作用；`'local'` 使用有限半径 |
| `pointerScope` | `'window'` | 全窗口跟踪；`'container'` 仅在画布内跟踪 |
| `pointerScale` | `'image'` | 随图案大小缩放力度；`'pixels'` 使用旧版固定像素行为 |
| `pointerReferenceSize` | `400` | image 模式的参考图片长边，CSS 像素；正数 |
| `pointerRadius` | `100` | 仅 local 模式的基准排斥半径；image 模式中乘图案缩放比，pixels 模式为固定 CSS px；此模式下 0 禁用 |
| `pointerStrength` | `28` | 基准力度系数，0 禁用；inverse 中不是最大位移；local 中表示基准目标偏移上限，再按 pointerScale 换算 |
| `returnTime` | `[330, 500]` | 每粒子回归时间常数的最小/最大值，毫秒；正数且 min ≤ max。经过一个时间常数，残留偏移约为原来的 37%；设置相同两值可关闭速度差异 |
| `drift` | `0` | 独立持续漂浮的幅度，CSS 像素；0 时无交互且转场结束后停止刷新 |
| `driftPeriod` | `1600` | 漂浮时间尺度，毫秒；X 方向完整周期为 2π×此值，Y 方向再乘 1.2 |
| `autoPause` | `true` | 移出视口自动暂停；页面后台暂停始终启用 |
| `respectReducedMotion` | `true` | 系统要求减少动态效果时立即展示静态结果、禁用排斥和漂浮 |
| `cacheSize` | `8` | 已加载 URL 图片的 LRU 缓存容量，正整数；缓存完整解码图片，不缓存粒子目标 |
| `loadTimeout` | `15000` | 模块自行创建的 URL 图片加载超时，毫秒 |

透明背景黑色 logo 建议使用 `mode: 'alpha'`；白底黑字建议使用 `'dark'`；原来浅色线稿或深背景图使用默认亮度模式。原图的 RGB 不作为每粒子颜色，只影响透明度。

## 相对原代码的修改

| 原逻辑/问题 | 当前处理 |
| --- | --- |
| 已有 dt 补偿，但位置按 165Hz 标定，淡入淡出仍按帧累加 | 位置、透明度和指针回归均采用毫秒指数平滑；长帧最多计 50ms，避免后台恢复跳跃 |
| 边缘 block 可能跨行、访问到 undefined | 按比例缩采样到受粒子预算约束的小画布，直接读 RGBA 格网，无边缘 block 循环 |
| 灰度转换后 putImageData 随即 clearRect | 不修改整张原图；小画布只读一次像素 |
| 原来的 RGB 灰度未考虑透明通道 | 感知亮度 × alpha，支持透明图与不同采样模式 |
| 复用旧粒子只替换坐标，没有同步 alpha | 每次重组同时设定新坐标、新透明度，多余粒子淡出 |
| particleCount 与正在淡出的数组长度可能错位 | 固定容量 Float32Array，复用所有存活槽位，转场完成后回收尾部 |
| 鼠标重合时除零，限速部分仍叠加无上限分量 | 平滑距离衰减，无硬边界；零距离力向量为 0，不产生 NaN；可选局部模式 |
| 异步切图可能乱序覆盖 | 请求序号，只安装最后一次 show 的结果；URL 加载复用、缓存有限 |
| 全局变量、硬编码 id、window.onload、缺少资源释放 | 独立实例、显式 API、完整 destroy；自行管理事件监听器 |
| 显示画布与图像采样共用且会重设尺寸 | 采样/显示分离；保持图像比例，支持容器缩放和 DPR 上限 |

新采样方式是浏览器插值后的缩采样，不等价于旧版每个 8×8 block 的精确算术平均。目标匹配采用随机洗牌，适合大范围重组；未实现最近邻最小路径匹配或 WebGL。活跃时每帧仍有 O(N) 次 Canvas 绘制（圆点 drawImage / 方点 fillRect），因此在几十万粒子需求下应另做 GPU 后端，而不是提高此模块的上限。

## 部署与调优

- 图片最好与页面同源。跨域图片服务器必须允许 CORS；模块会在设置 `src` 前指定 `crossOrigin='anonymous'`，但客户端无法绕过服务器限制。传入外部 HTMLImageElement 时也应在设定 `src` 前自行设置它。
- 模块采样画布与显示画布分离，失败的跨域采样不会污染显示画布；这不会解除图片服务器的访问限制。
- 在 CSP 页面中允许本站模块/图片；上传示例还需要允许 `img-src blob:`。不需要外部 CDN、字体或第三方脚本。
- 移动端可用 `gap: 8, maxParticles: 2500, pixelRatio: 1.5, drift: 0` 降低压力。具体帧率取决于设备、容器面积和粒子数，本项目没有宣称量化性能提升。
- 不要给 Canvas 添加 border/padding 或复杂 CSS transform；缩放整个容器时只支持普通轴向缩放的指针换算。隐藏容器恢复可见后会自动重新采样。
- 若元素只改变了显示器 DPR 而没有改变布局尺寸，可主动调用 `resize()` 更新分辨率。
- 背景透明，容器的背景和层级由宿主 CSS 决定；为装饰性动画提供可访问的说明或对应静态内容。
- 演示中的 PNG/JPEG 白底图片会按亮度采样，可能得到一个明亮矩形。选择透明 PNG 或改用 `dark` 模式。
- 浏览器目标为支持 ESM、Canvas 2D、ResizeObserver、AbortController 事件信号、现代 matchMedia 的浏览器；未提供 IE 或旧 WebView 降级版本。

## 验证

```sh
npm test
npm run check
```

基础测试不需要依赖。真实浏览器测试单独运行，需要本地可用的 Playwright 和 Chromium：

```sh
npm install --no-save playwright
npx playwright install chromium
npm run test:browser
```

测试会自动启动本地 4174 端口服务器，结束后关闭；可通过 `DEMO_URL` 指向已有演示。`BROWSER_PATH` 可指定已安装的 Chromium 内核浏览器。浏览器测试会生成桌面和手机截图，覆盖图片/SVG 采样、真实画布输出、快速切换、失败保留、指针重合、暂停恢复、缩放、多实例、销毁及系统减少动画偏好。测试细节见 `TEST-REPORT.md`。

## 文件与来源

```text
src/index.js            渲染器与公共 API
src/sampling.js         小画布 RGBA 采样与数量预算
src/motion.js           远距作用、毫秒回归和每粒子转场时序
src/index.d.ts          TypeScript 类型
demo/                   完整演示和本地素材
tools/serve.js          无依赖本地预览服务器
tools/browser-test.cjs  可选真实浏览器集成测试
test/                   无依赖采样回归测试
NOTICE.md               来源与素材说明
```

参考：[原项目](https://github.com/Akejyo/Arknights_partical_animation)、[原 JS.js](https://github.com/Akejyo/Arknights_partical_animation/blob/main/JS.js)、[明日方舟官网世界观](https://ak.hypergryph.com/#world)。1.1.0 已检查官网公开脚本的点阵数据和运动逻辑，分析记录见 `OFFICIAL-ANALYSIS.md`。本交付未包含官网脚本、点阵数据或在线图片。
