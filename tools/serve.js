import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, extname, sep } from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.webp':'image/webp','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png','.json':'application/json','.md':'text/plain; charset=utf-8'};
const prefix='/Arknights_partical_animation';
const port=Number(process.env.PORT||4173);
http.createServer(async(req,res)=>{
  try {
    let pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if(pathname===prefix){res.writeHead(302,{Location:prefix+'/'}).end();return;}
    if(pathname.startsWith(prefix+'/'))pathname=pathname.slice(prefix.length);
    if(pathname.endsWith('/'))pathname+='index.html';
    const target=resolve(root,'.'+pathname);
    if(!target.startsWith(root.endsWith(sep)?root:root+sep)){res.writeHead(403).end();return;}
    const data=await readFile(target);res.writeHead(200,{'Content-Type':types[extname(target)]||'application/octet-stream','Cache-Control':'no-store'}).end(data);
  }catch{res.writeHead(404).end('Not found');}
}).listen(port,'127.0.0.1',()=>console.log(`Preview: http://127.0.0.1:${port}${prefix}/`));
