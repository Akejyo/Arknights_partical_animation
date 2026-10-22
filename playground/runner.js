import { renderers, channel } from '../app/renderers.js';
const query = new URLSearchParams(location.search), renderer = renderers.find(r => r.id === query.get('renderer')), session = query.get('session');
let source = query.get('source'), effect, paused = query.get('paused') === 'true', latestImage, resizeTimer;
const host = document.querySelector('#host');
const send = (type, data = {}) => parent.postMessage({ channel, session, type, ...data }, location.origin);
const fail = (error, request) => send('error', { message: error?.message || String(error), request });
window.addEventListener('error', event => fail(event.error || new Error(event.message)));
window.addEventListener('unhandledrejection', event => fail(event.reason));
const nativeRAF = requestAnimationFrame.bind(window), waiting = new Set();
if (renderer?.kind !== 'module') window.requestAnimationFrame = callback => nativeRAF(time => {
  if (paused || document.hidden) waiting.add(callback); else callback(time);
});
function resumeLegacy() {
  if (paused || document.hidden) return;
  const callbacks = [...waiting]; waiting.clear(); for (const callback of callbacks) requestAnimationFrame(callback);
}
document.addEventListener('visibilitychange', resumeLegacy);
function fitLegacyImage(image) {
  // The old grid and motion equations operate in native CSS pixel coordinates.
  const block = renderer.id === 'original' ? 10 : 8, step = 7;
  const width = image.naturalWidth || image.width, height = image.naturalHeight || image.height;
  const contain = Math.min(innerWidth * 0.8 / width, innerHeight * 0.8 / height);
  image.width = Math.max(1, Math.round(width * contain * block / step)); image.height = Math.max(1, Math.round(height * contain * block / step));
  const canvas = document.querySelector('#canvas');
  canvas.style.left = `${(innerWidth - image.width * step / block) / 2}px`; canvas.style.top = `${(innerHeight - image.height * step / block) / 2}px`;
}
async function loadLegacy() {
  const canvas = document.createElement('canvas'); canvas.id = 'canvas'; host.append(canvas);
  const NativeImage = window.Image, srcDescriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
  // Redirect the historical demo's Image loads to the selected local/blob asset.
  // Archived scripts remain byte-for-byte unchanged.
  window.Image = function(...args) {
    const image = new NativeImage(...args); latestImage = image;
    Object.defineProperty(image, 'src', { get: () => srcDescriptor.get.call(image), set: () => srcDescriptor.set.call(image, source) });
    image.addEventListener('error', () => { if (image === latestImage) fail(new Error('图片加载失败')); });
    if (renderer.kind === 'experiment') image.addEventListener('load', () => nativeRAF(() => send('ready')));
    return image;
  };
  window.Image.prototype = NativeImage.prototype;
  const response = await fetch(new URL(renderer.script, import.meta.url)); if (!response.ok) throw new Error(`旧版脚本加载失败：${response.status}`);
  const script = document.createElement('script'); script.textContent = `${await response.text()}\n//# sourceURL=${new URL(renderer.script,import.meta.url).href}`;
  document.body.append(script);
  if (renderer.kind === 'experiment') return;
  const convert = window.convertImageToParticles; let initialized = false;
  window.convertImageToParticles = image => {
    if (image !== latestImage) return;
    fitLegacyImage(image); convert(image);
    if (!initialized) { initialized = true; send('ready'); }
  };
  const initialize = window.onload; window.onload = null; initialize?.();
  window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { if (latestImage?.complete && latestImage.naturalWidth) window.convertImageToParticles(latestImage); }, 120); });
}
async function showLegacy(request) {
  const image = new Image(); image.crossOrigin = 'anonymous';
  image.onload = () => { if (image !== latestImage) return; try { window.convertImageToParticles(image); send('shown', { request }); } catch (error) { fail(error, request); } };
  image.src = source;
}
window.addEventListener('message', async event => {
  if (event.source !== parent || event.origin !== location.origin) return;
  const data = event.data; if (!data || data.channel !== channel || data.session !== session) return;
  try {
    if (data.type === 'show') {
      source = data.source;
      if (effect) { if (await effect.show(source)) send('shown', { request: data.request }); }
      else if (renderer.kind === 'legacy') await showLegacy(data.request);
    } else if (data.type === 'pause') { paused = data.paused; if (effect) effect[paused ? 'pause' : 'resume'](); else resumeLegacy(); }
    else if (data.type === 'pointer') {
      const inside = data.x >= 0 && data.x <= innerWidth && data.y >= 0 && data.y <= innerHeight;
      if (effect) {
        if (effect.options.pointerScope === 'window') window.dispatchEvent(new PointerEvent('pointermove', {clientX:data.x,clientY:data.y,pointerType:'mouse'}));
        else effect.canvas.dispatchEvent(new PointerEvent(inside ? 'pointermove' : 'pointerleave', {clientX:data.x,clientY:data.y,pointerType:'mouse'}));
      } else window.dispatchEvent(new MouseEvent('mousemove', {clientX:data.x,clientY:data.y}));
    } else if (data.type === 'leave') {
      if (effect) { effect.canvas.dispatchEvent(new PointerEvent('pointerleave')); document.documentElement.dispatchEvent(new PointerEvent('pointerleave')); }
      else window.mouseX = window.mouseY = null;
    }
  } catch (error) { fail(error, data.request); }
});
try {
  if (!renderer) throw new Error('未知渲染方式');
  if (renderer.kind === 'module') {
    const { ParticleMorph } = await import(new URL(renderer.module, import.meta.url)); effect = new ParticleMorph(host); window.particleRenderer = effect;
    if (paused) effect.pause(); await effect.show(source); send('ready');
  } else await loadLegacy();
} catch (error) { fail(error); }
const statsTimer = setInterval(() => {
  const stats = effect?.stats;
  send('stats', stats ? {particles:stats.targets,width:stats.width,height:stats.height} : {particles:window.particles?.length || 0,width:innerWidth,height:innerHeight});
}, 400);
window.addEventListener('pagehide', () => { clearInterval(statsTimer); clearTimeout(resizeTimer); waiting.clear();effect?.destroy(); }, {once:true});
