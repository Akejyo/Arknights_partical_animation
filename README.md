# Arknights Particle Animation

明日方舟风格的图片粒子动画，以及原项目和历次重构版本的同图对比页面。

线上入口保持不变：**https://akejyo.github.io/Arknights_partical_animation/**。

## 切换渲染方式

点击 **切换渲染方式 →** 可以循环切换，也可直接使用旁边的下拉菜单。当前图片会保留；不同版本保留各自的默认密度、点形状、转场和鼠标行为。

| 方式 | 主要区别 |
| --- | --- |
| 当前版 1.3.0 | 自然回归、密集圆点、长距离作用、力度随图案缩放 |
| 原有优化版 index_particle.js | 用户提供的亮度透明度、dt 补偿与原有回归算法 |
| 原仓库 JS.js | 原始阈值采样、方点、按帧回归 |
| 实验 JS_2.js | 原来的自由扩散实验 |
| 实验 JS_3.js | 原来的弱回归与速度累积实验 |

选择下方图片可观察同一渲染器内的粒子切图。两个实验版没有原生图片重组 API，因此切图时重新初始化，其他三种会保留自己的切图逻辑。支持本地图片上传（不上传到服务器）、暂停、恢复和重新聚合。

可以用地址参数直接分享特定版本和内置图片，例如：

```text
https://akejyo.github.io/Arknights_partical_animation/?renderer=original&image=penguin
https://akejyo.github.io/Arknights_partical_animation/?renderer=v1.3.0&image=sami
```

## 历史版本如何保存

- `legacy/` 内保存原仓库脚本、HTML/CSS 和用户提供的优化版脚本，保持原始字节内容。根目录原有 `JS.js`、`JS_2.js`、`JS_3.js`、`CSS.css` 和两张 JPG 也保留。
- `versions/v1.3.0` 保留当前版源码快照。1.0.0～1.2.0 已从对比选项和源码目录移除；Git 历史仍可追溯。旧版本分享链接会自动回到当前版。
- `src/` 是当前 1.3.0 的可复用模块，独立于对比页面。
- 统一页面的 `playground/runner.js` 是运行适配层。每次切换方式会更换独立 iframe 文档，销毁上一个版本的全局变量、事件和动画循环。

旧脚本适配仅处理本地素材加载、画布容器尺寸和居中、暂停、切图入口、全局鼠标坐标转发，以及隔离。原有采样、阈值、回归方程、粒子形状和帧时间行为不替换成新版算法。适配后保留图片比例，不再强制拉成原演示的固定正方形，因此布局尺寸并非旧页面的逐像素还原。旧算法已有的表现差异仍会存在。

原始 HTML 是源码归档，直接打开它仍依赖原来的资源路径；日常使用和历史对比请从仓库根入口进入。

## 本地运行

需要 Node.js 18+，不需要安装运行依赖：

```sh
npm run demo
```

打开终端显示的地址。服务器同时支持根路径和 `/Arknights_partical_animation/` 子路径，可在本地验证 GitHub Pages 的相对路径。不应直接双击 HTML 打开。

## 在其他网站使用模块

复制整个 `src/` 文件夹，包含 `index.js`、`sampling.js`、`motion.js` 和类型声明。

```html
<div id="particles" style="width:100%;height:480px"></div>
<script type="module">
  import { ParticleMorph } from './src/index.js';
  const effect = new ParticleMorph('#particles');
  effect.show('./assets/sami.webp').catch(console.error);
  // 组件卸载时：effect.destroy();
</script>
```

完整参数、React/Vue 示例、图片 CORS 说明见 [模块使用说明](docs/README.md)。对比页使用相对路径，没有依赖固定域名、根目录绝对资源路径、第三方字体或在线图片。

## GitHub Pages 部署

继续使用当前仓库 `main` 分支的根目录作为 Pages 来源。推送根目录的 `index.html` 和配套文件后，原 Pages 部署会更新，无需迁移地址或新增另一个站点。本次没有增加第二套 Pages 工作流，以免与仓库原有的分支部署冲突。

`.nojekyll` 明确将站点作为静态文件发布。以后若更改 Pages 来源分支或目录，需要同步调整仓库设置；当前结构不需要构建步骤。

## 验证

```sh
npm test
```

模块有 14 项无依赖测试。对比页的真实浏览器集成测试需要 Playwright 和 Chromium：

```sh
npm install --no-save playwright
npx playwright install chromium
npm run test:browser
```

测试自动启动本地服务器，覆盖五种方式的绘制、切图、暂停恢复、快速切换、上传、图片选择保留、单 iframe 隔离和手机布局。也可设置 `DEMO_URL` 对线上 Pages 执行同一套检查。结果见 [整合测试记录](INTEGRATION-TEST-REPORT.md)。

素材来源说明见 [NOTICE](docs/NOTICE.md)。萨米示例来自用户既有项目；公开分发与使用时应自行确认相应素材授权。原仓库没有新增或代指定开源许可证。
