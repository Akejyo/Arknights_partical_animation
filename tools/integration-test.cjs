const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const {spawn}=require('node:child_process');
const path=require('node:path');
const assert=require('node:assert/strict');
(async()=>{
  const server=process.env.DEMO_URL?null:spawn(process.execPath,[path.join(__dirname,'serve.js')],{env:{...process.env,PORT:'4175'},windowsHide:true});
  if(server)await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);});
  let browser;
  try{
    browser=await chromium.launch({headless:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});
    const page=await browser.newPage({viewport:{width:1360,height:1000}});
    const errors=[],failed=[],external=[];
    page.on('pageerror',e=>{errors.push(e.message);console.error('PAGE:',e.message);});
    page.on('response',r=>{if(r.status()>=400)failed.push(`${r.status()} ${r.url()}`);});
    page.on('request',r=>{if(!['127.0.0.1','localhost', 'akejyo.github.io'].includes(new URL(r.url()).hostname)&&!r.url().startsWith('blob:')&&!r.url().startsWith('data:'))external.push(r.url());});
    await page.goto(process.env.DEMO_URL||'http://127.0.0.1:4175/Arknights_partical_animation/');
    const ready=async(name)=>{await page.waitForFunction(name=>{const s=document.querySelector('#status').textContent;return s.includes(name)&&s.includes('已就绪');},name,{timeout:16000});};
    await ready('当前版');
    const fallbackURL=new URL(page.url());fallbackURL.searchParams.set('renderer','v1.2.0');
    await page.goto(fallbackURL.href);await ready('当前版');
    assert.equal(new URL(page.url()).searchParams.get('renderer'),'v1.3.0');
    const options=await page.locator('#renderer option').evaluateAll(elements=>elements.map(e=>({id:e.value,name:e.textContent})));
    assert.equal(options.length,5);
    assert.ok(options.every(o=>!['v1.0.0','v1.1.0','v1.2.0'].includes(o.id)));
    const verified=[];
    for(const option of options){
      await page.locator('#renderer').selectOption(option.id);await ready(option.name);
      await page.waitForTimeout(450);
      const frame=page.frames().find(f=>f.url().includes('/playground/runner.html'));
      const state=await frame.evaluate(()=>{
        const canvas=document.querySelector('canvas');const ctx=canvas.getContext('2d');
        const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;
        return {canvases:document.querySelectorAll('canvas').length,pixels:pixels.some((v,i)=>i%4===3&&v>0),scheme:getComputedStyle(document.documentElement).colorScheme};
      });
      assert.equal(state.canvases,1,option.id);assert.ok(state.pixels,option.id+' should draw pixels');
      assert.equal(state.scheme,'dark');
      await page.locator('[data-image="crystal"]').click();await ready(option.name+' · 晶体');
      await page.locator('#pause').click();await page.waitForTimeout(100);
      const pausedFrame=page.frames().find(f=>f.url().includes('/playground/runner.html'));
      const before=await pausedFrame.evaluate(()=>window.particleRenderer?Array.from(window.particleRenderer._data.x.subarray(0,10)):window.particles.slice(0,10).map(p=>p.x));
      await page.waitForTimeout(100);
      const after=await pausedFrame.evaluate(()=>window.particleRenderer?Array.from(window.particleRenderer._data.x.subarray(0,10)):window.particles.slice(0,10).map(p=>p.x));
      assert.deepEqual(after,before,option.id+' should pause');await page.locator('#pause').click();
      await page.locator('[data-image="sami"]').click();await ready(option.name+' · 萨米');
      assert.equal(await page.locator('iframe').count(),1);assert.equal(page.frames().length,2);
      verified.push(option.id);console.log('PASS',option.id);
    }
    await page.locator('#renderer').selectOption('v1.3.0');await ready('当前版');
    await page.locator('#cycle-renderer').click();await ready('原有优化版');assert.equal(await page.locator('#renderer').inputValue(),'optimized');
    for(let i=0;i<12;i++)await page.locator('#cycle-renderer').click();
    await page.locator('#renderer').selectOption('v1.3.0');await ready('当前版');
    await page.locator('[data-image="penguin"]').click();await ready('当前版 · 1.3.0 · 企鹅');
    await page.locator('#renderer').selectOption('optimized');await ready('原有优化版');
    assert.equal(await page.locator('[data-image="penguin"]').getAttribute('aria-pressed'),'true');
    await page.locator('#renderer').selectOption('v1.3.0');await ready('当前版');
    await page.locator('#upload').setInputFiles(path.join(__dirname,'../assets/sami.webp'));await ready('sami.webp');
    await page.locator('#renderer').selectOption('original');await ready('原仓库版');assert.match(await page.locator('#status').textContent(),/sami.webp/);
    await page.locator('#renderer').selectOption('v1.3.0');await ready('当前版');
    await page.locator('[data-image="sami"]').click();await ready('当前版 · 1.3.0 · 萨米');
    await page.waitForTimeout(1200);
    await page.screenshot({path:path.join(__dirname,'../comparison-preview.png'),fullPage:true});
    await page.setViewportSize({width:390,height:844});await page.waitForTimeout(500);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await page.screenshot({path:path.join(__dirname,'../comparison-mobile-preview.png'),fullPage:true});
    assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);assert.deepEqual(external,[]);
    console.log(JSON.stringify({verified,rapidSwitch:true,pause:true,preserveImage:true,upload:true,pagesSubpath:true,mobile:true,errors,failed,external},null,2));
  }finally{await browser?.close();server?.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
