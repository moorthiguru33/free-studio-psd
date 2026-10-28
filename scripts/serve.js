// Tiny static server for local preview: node scripts/serve.js [port]
const http=require('http'),fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..','dist'),port=+process.argv[2]||8788;
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.wasm':'application/wasm','.css':'text/css','.svg':'image/svg+xml','.xml':'application/xml','.txt':'text/plain','.webmanifest':'application/manifest+json','.json':'application/json'};
http.createServer((req,res)=>{let p=decodeURIComponent(req.url.split('?')[0]);let f=path.join(root,p);if(!f.startsWith(root)){res.writeHead(403);return res.end();}
 if(fs.existsSync(f)&&fs.statSync(f).isDirectory())f=path.join(f,'index.html');
 if(!fs.existsSync(f)){res.writeHead(404,{'content-type':types['.html']});const f404=path.join(root,'404.html');return res.end(fs.existsSync(f404)?fs.readFileSync(f404):'<h1>404 Not Found</h1>');}
 res.writeHead(200,{'content-type':types[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(res);
}).listen(port,()=>console.log(`Preview: http://localhost:${port}/`));
