import { renderers, images, channel } from './renderers.js';
const select = document.querySelector('#renderer'), frame = document.querySelector('#renderer-frame'), status = document.querySelector('#status');
const query = new URLSearchParams(location.search);
let renderer = renderers.find(r => r.id === query.get('renderer')) || renderers[0];
let image = images.find(i => i.id === query.get('image')) || images[0];
let source = new URL(image.path, import.meta.url).href;
let paused = false, ready = false, session, objectURL, loadTimer, imageRequest = 0;
for (const r of renderers) select.add(new Option(r.name, r.id));
for (const [index, item] of images.entries()) {
  const button = document.createElement('button'); button.dataset.image = item.id;
  const num = document.createElement('span'); num.className = 'num'; num.textContent = `0${index + 1}`;
  const text = document.createElement('span'), title = document.createElement('strong'), subtitle = document.createElement('small');
  title.textContent = item.name; subtitle.textContent = item.en; text.append(title, subtitle);
  const arrow = document.createElement('span'); arrow.className = 'arrow'; arrow.textContent = '↗'; button.append(num, text, arrow);
  button.addEventListener('click', () => { image = item; source = new URL(item.path, import.meta.url).href; highlight(); updateURL(); showImage(); });
  document.querySelector('#scenes').append(button);
}
function highlight() {
  document.querySelectorAll('[data-image]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.image === image.id)));
  frame.title = `${renderer.name}：${image.name}粒子动画`;
}
function updateURL() {
  const url = new URL(location.href); url.searchParams.set('renderer', renderer.id); url.searchParams.set('image', image.id === 'custom' ? 'sami' : image.id); history.replaceState(null, '', url);
}
function send(type, data = {}) { frame.contentWindow?.postMessage({ channel, session, type, ...data }, location.origin); }
function mount() {
  ready = false; imageRequest++; session = crypto.randomUUID(); select.value = renderer.id;
  document.querySelector('#renderer-note').textContent = renderer.note; document.querySelector('#renderer-name').textContent = renderer.name;
  document.querySelector('#version-label').textContent = renderer.id.toUpperCase();
  document.querySelector('#renderer-position').textContent = `${String(renderers.indexOf(renderer) + 1).padStart(2,'0')} / ${String(renderers.length).padStart(2,'0')}`;
  document.querySelector('#stats').textContent = 'INITIALIZING'; status.textContent = '正在加载渲染器…';
  const url = new URL('../playground/runner.html', import.meta.url);
  for(const [key,value] of Object.entries({renderer:renderer.id,source,session,paused:String(paused)})) url.searchParams.set(key,value);
  // Navigation destroys the previous document, its listeners and all legacy RAF loops.
  frame.src = url.href;
  clearTimeout(loadTimer); loadTimer = setTimeout(() => { if (!ready) status.textContent = '加载时间较长，请检查图片或点击重新聚合。'; }, 16000);
  highlight(); updateURL();
}
function showImage() {
  if (!ready || renderer.kind === 'experiment') { mount(); return; }
  status.textContent = '正在切换图片…'; send('show', { source, request: ++imageRequest });
}
select.addEventListener('change', () => { renderer = renderers.find(r => r.id === select.value); mount(); });
document.querySelector('#cycle-renderer').addEventListener('click', () => { renderer = renderers[(renderers.indexOf(renderer) + 1) % renderers.length]; mount(); });
document.querySelector('#restart').addEventListener('click', mount);
document.querySelector('#pause').addEventListener('click', e => { paused = !paused; e.currentTarget.textContent = paused ? '继续动画' : '暂停动画'; e.currentTarget.setAttribute('aria-pressed', String(paused)); send('pause', { paused }); });
document.querySelector('#upload').addEventListener('change', e => {
  const file = e.target.files[0]; if (!file) return;
  if (file.size > 20 * 1024 * 1024) { status.textContent = '请选择小于 20 MB 的图片。'; return; }
  if (objectURL) URL.revokeObjectURL(objectURL); objectURL = URL.createObjectURL(file); source = objectURL;
  image = { id: 'custom', name: file.name }; highlight(); updateURL(); showImage();
});
window.addEventListener('message', event => {
  if (event.source !== frame.contentWindow || event.origin !== location.origin) return;
  const data = event.data; if (!data || data.channel !== channel || data.session !== session) return;
  if (data.type === 'ready') { ready = true; clearTimeout(loadTimer); status.textContent = `${renderer.name} · ${image.name}已就绪${renderer.kind !== 'module' ? '（保留旧算法，已适配容器与本地素材）' : ''}`; send('pause', { paused }); }
  else if (data.type === 'shown' && data.request === imageRequest) status.textContent = `${renderer.name} · ${image.name}已就绪`;
  else if (data.type === 'error') { if (data.request && data.request !== imageRequest) return; clearTimeout(loadTimer); status.textContent = `加载失败：${data.message}`; }
  else if (data.type === 'stats') document.querySelector('#stats').textContent = `${String(data.particles).padStart(4,'0')} PARTICLES / ${data.width} × ${data.height}`;
});
window.addEventListener('pointermove', e => { if (!ready) return; const rect = frame.getBoundingClientRect(); send('pointer', { x: (e.clientX - rect.left) * frame.clientWidth / (rect.width || 1), y: (e.clientY - rect.top) * frame.clientHeight / (rect.height || 1) }); }, { passive: true });
const leave = () => send('leave'); document.documentElement.addEventListener('pointerleave', leave); window.addEventListener('blur', leave);
window.addEventListener('pagehide', () => { clearTimeout(loadTimer); if (objectURL) URL.revokeObjectURL(objectURL); }, { once:true });
mount();
