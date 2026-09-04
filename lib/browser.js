import { Service } from '@deepseek-ai/cordis';
import z from '@deepseek-ai/schemastery';
import { createServer } from 'node:net';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { randomBytes, randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
export class BrowserError extends Error { constructor(message, code='BROWSER_ERROR'){super(message);this.name='BrowserError';this.code=code;} }
export class BrowserRuntime extends Service {
 static Config=z.object({browserProvider:z.string()}); providers=new Map();
 constructor(ctx,config={}){super(ctx,'browser');this.providerId=config.browserProvider;}
 registerBrowserProvider(provider){if(this.providers.has(provider.id))throw new BrowserError(`browser provider "${provider.id}" already registered`,'BROWSER_DUPLICATE_PROVIDER');this.providers.set(provider.id,provider);return()=>this.providers.delete(provider.id);}
 resolveProvider(){if(this.providerId){const p=this.providers.get(this.providerId);if(!p)throw new BrowserError(`browser provider "${this.providerId}" is not registered`,'BROWSER_PROVIDER_MISSING');if(!p.available())throw new BrowserError(`browser provider "${this.providerId}" is unavailable`,'BROWSER_PROVIDER_UNAVAILABLE');return p;}const usable=[...this.providers.values()].filter(p=>p.available());if(usable.length!==1)throw new BrowserError(usable.length===0?'no usable browser provider is registered':'multiple usable browser providers are registered',usable.length===0?'BROWSER_PROVIDER_UNAVAILABLE':'BROWSER_PROVIDER_AMBIGUOUS');return usable[0];}
 open(l){return this.resolveProvider().open(l)} openUrl(s,r){return this.resolveProvider().openUrl(s,r)} navigate(s,r){return this.resolveProvider().navigate(s,r)} snapshot(s){return this.resolveProvider().snapshot(s)} click(s,r){return this.resolveProvider().click(s,r)} fillForm(s,r){return this.resolveProvider().fillForm(s,r)} key(s,r){return this.resolveProvider().key(s,r)} scroll(s,r){return this.resolveProvider().scroll(s,r)} close(s){return this.resolveProvider().close(s)}
}
class RpcClient {
 nextId=1;socket;buffer='';pending=new Map();
 constructor(hostMain,executable){this.hostMain=hostMain;this.executable=executable;}
 async start(){const server=createServer();await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});const a=server.address(),port=typeof a==='object'&&a?a.port:0,token=randomBytes(24).toString('hex');const child=spawn(this.executable,[this.hostMain,'--rpc-port',String(port),'--rpc-token',token],{stdio:['ignore','ignore','pipe'],windowsHide:false,env:{...process.env,DSH_WEB_AGENT_RPC_TOKEN:token}});child.stderr.setEncoding('utf8');child.stderr.on('data',d=>process.stderr.write(`[web-agent browser] ${String(d)}`));child.on('exit',(c,s)=>this.fail(new Error(`browser host exited (${String(c)}, ${String(s)})`)));const result=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('browser host connection timeout')),20000);const onConnection=socket=>{clearTimeout(timer);socket.setEncoding('utf8');let buf='';const onHello=data=>{buf+=data;for(const line of buf.split('\n')){if(!line.trim())continue;try{const msg=JSON.parse(line);if(msg.op==='hello'){socket.off('data',onHello);resolve({socket,hello:msg});return;}}catch{}}};socket.on('data',onHello);socket.once('error',reject);socket.once('close',()=>reject(new Error('browser host connection closed before hello')))};server.once('connection',onConnection);child.once('error',reject)});server.close();this.socket=result.socket;this.socket.setEncoding('utf8');this.socket.on('data',d=>this.onData(String(d)));this.socket.on('error',e=>this.fail(e));this.socket.on('close',()=>this.fail(new Error('browser host connection closed')));if(result.hello.token!==token)throw new Error('browser host authentication failed');await this.call('ping');}
 call(op,payload={}){if(!this.socket)throw new Error('browser host is not connected');const id=this.nextId++;return new Promise((resolve,reject)=>{this.pending.set(id,{resolve,reject});this.socket?.write(JSON.stringify({id,op,...payload})+'\n')});}
 onData(data){this.buffer+=data;let at=this.buffer.indexOf('\n');while(at>=0){const line=this.buffer.slice(0,at).trim();this.buffer=this.buffer.slice(at+1);at=this.buffer.indexOf('\n');if(!line)continue;try{const msg=JSON.parse(line);if(msg.op==='hello')continue;const p=this.pending.get(msg.id);if(!p)continue;this.pending.delete(msg.id);msg.ok?p.resolve(msg.result):p.reject(new Error(msg.err??'browser host command failed'));}catch{}}}
 fail(error){for(const p of this.pending.values())p.reject(error);this.pending.clear();} close(){try{this.socket?.destroy()}catch{}}
}
class SharedElectronProvider {
 id='web-agent-electron';client;session;starting;hostMain;executable;
 constructor(){this.hostMain=fileURLToPath(new URL('../browser-host.cjs',import.meta.url));this.executable=this.resolveElectron();}
 available(){return existsSync(this.executable)&&existsSync(this.hostMain);}
 resolveElectron(){const explicit=process.env.ELECTRON_PATH;if(explicit&&existsSync(explicit))return explicit;const base=dirname(fileURLToPath(import.meta.url));const exe=process.platform==='win32'?'electron.exe':'electron';const candidates=[join(base,'..','node_modules','electron','dist',exe),join(base,'node_modules','electron','dist',exe),join(process.cwd(),'node_modules','electron','dist',exe)];try{const require=createRequire(import.meta.url);const entry=require.resolve('electron');const packageRoot=dirname(dirname(entry));candidates.unshift(join(packageRoot,'dist',exe));}catch{}return candidates.find(existsSync)??candidates[0];}
 async ensureStarted(){if(this.client&&this.session)return;if(!this.starting)this.starting=(async()=>{this.client=new RpcClient(this.hostMain,this.executable);await this.client.start();this.session=`browser:${randomUUID()}`;await this.client.call('createSession',{session:this.session});})().finally(()=>{this.starting=undefined;});await this.starting;}
 async call(op,payload={}){await this.ensureStarted();return this.client.call(op,{session:this.session,...payload});}
 async open(label){await this.ensureStarted();await this.client.call('setLabel',{session:this.session,label:label??'Web-Agent'});return this.session;}
 async openUrl(session,r){await this.call('navigate',{session,url:r.url});} async navigate(session,r){await this.call('navigate',{session,url:r.url});} async snapshot(session){return this.call('snapshot',{session});} async click(session,r){await this.call('click',{session,...r});} async fillForm(session,r){return this.call('fill',{session,...r});} async key(session,r){await this.call('key',{session,key:r.key});} async scroll(session,r){await this.call('scroll',{session,...r});} async close(session){if(this.client){await this.client.call('closeSession',{session});this.client.close();this.client=undefined;this.session=undefined;}}
}
export const name='web-agent-browser'; export const inject=[];
export function apply(ctx){ctx.plugin(BrowserRuntime);ctx.inject(['browser'],browserCtx=>{const runtime=browserCtx.get('browser');const provider=new SharedElectronProvider();const unregister=runtime.registerBrowserProvider(provider);browserCtx.effect(()=>unregister,'web-agent browser provider');});}
