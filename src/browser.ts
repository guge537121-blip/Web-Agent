import type { Context } from '@deepseek-ai/cordis'
import { Service } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import { createServer, type Socket } from 'node:net'
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { randomBytes, randomUUID } from 'node:crypto'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

export class BrowserError extends Error { readonly code: string; constructor(message: string, code = 'BROWSER_ERROR') { super(message); this.name = 'BrowserError'; this.code = code } }
interface Provider { readonly id: string; available(): boolean; open(label?: string): Promise<string>; openUrl(session: string, request: { url: string }): Promise<void>; navigate(session: string, request: { url: string }): Promise<void>; snapshot(session: string): Promise<any>; click(session: string, request: any): Promise<void>; fillForm(session: string, request: any): Promise<any>; key(session: string, request: any): Promise<void>; scroll(session: string, request: any): Promise<void>; close(session: string): Promise<void> }
export class BrowserRuntime extends Service {
  static Config = z.object({ browserProvider: z.string() }); readonly providers = new Map<string, Provider>(); readonly providerId?: string
  constructor(ctx: Context, config: { browserProvider?: string } = {}) { super(ctx, 'browser'); this.providerId = config.browserProvider }
  registerBrowserProvider(provider: Provider) { if (this.providers.has(provider.id)) throw new BrowserError(`browser provider "${provider.id}" already registered`, 'BROWSER_DUPLICATE_PROVIDER'); this.providers.set(provider.id, provider); return () => this.providers.delete(provider.id) }
  resolveProvider() { if (this.providerId) { const p=this.providers.get(this.providerId); if(!p) throw new BrowserError(`browser provider "${this.providerId}" is not registered`,'BROWSER_PROVIDER_MISSING'); if(!p.available()) throw new BrowserError(`browser provider "${this.providerId}" is unavailable`,'BROWSER_PROVIDER_UNAVAILABLE'); return p } const usable=[...this.providers.values()].filter(p=>p.available()); if(usable.length!==1) throw new BrowserError(usable.length===0?'no usable browser provider is registered':'multiple usable browser providers are registered',usable.length===0?'BROWSER_PROVIDER_UNAVAILABLE':'BROWSER_PROVIDER_AMBIGUOUS'); return usable[0] }
  open(l?:string){return this.resolveProvider().open(l)} openUrl(s:string,r:any){return this.resolveProvider().openUrl(s,r)} navigate(s:string,r:any){return this.resolveProvider().navigate(s,r)} snapshot(s:string){return this.resolveProvider().snapshot(s)} click(s:string,r:any){return this.resolveProvider().click(s,r)} fillForm(s:string,r:any){return this.resolveProvider().fillForm(s,r)} key(s:string,r:any){return this.resolveProvider().key(s,r)} scroll(s:string,r:any){return this.resolveProvider().scroll(s,r)} close(s:string){return this.resolveProvider().close(s)}
}

class RpcClient {
  private nextId=1; private socket?:Socket; private buffer=''; private readonly pending=new Map<number,{resolve:(v:any)=>void;reject:(e:Error)=>void}>();
  constructor(private readonly hostMain:string,private readonly executable:string){}
  async start(){
    const server=createServer();
    await new Promise<void>((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',()=>resolve())})
    const address=server.address(); const port=typeof address==='object'&&address?address.port:0; const token=randomBytes(24).toString('hex')
    const child=spawn(this.executable,[this.hostMain,'--rpc-port',String(port),'--rpc-token',token],{stdio:['ignore','ignore','pipe'],windowsHide:false,env:{...process.env,DSH_WEB_AGENT_RPC_TOKEN:token}})
    child.stderr.setEncoding('utf8'); child.stderr.on('data',d=>process.stderr.write(`[web-agent browser] ${String(d)}`)); child.on('exit',(c,s)=>this.fail(new Error(`browser host exited (${String(c)}, ${String(s)})`)))
    const result = await new Promise<{socket:Socket;hello:any}>((resolve,reject)=>{
      const timer=setTimeout(()=>reject(new Error('browser host connection timeout')),20000)
      const onConnection=(socket:Socket)=>{clearTimeout(timer);socket.setEncoding('utf8');let buf='';const onHello=(data:string)=>{buf+=data;for(const line of buf.split('\n')){if(!line.trim())continue;try{const msg=JSON.parse(line);if(msg.op==='hello'){socket.off('data',onHello);resolve({socket,hello:msg});return}}catch{}}};socket.on('data',onHello);socket.once('error',reject);socket.once('close',()=>reject(new Error('browser host connection closed before hello')))}
      server.once('connection',onConnection); child.once('error',reject)
    })
    server.close(); this.socket=result.socket; this.socket.setEncoding('utf8'); this.socket.on('data',d=>this.onData(String(d))); this.socket.on('error',e=>this.fail(e)); this.socket.on('close',()=>this.fail(new Error('browser host connection closed')))
    if(result.hello.token!==token) throw new Error('browser host authentication failed')
    await this.call('ping')
  }
  call(op:string,payload:Record<string,any>={}){if(!this.socket)throw new Error('browser host is not connected');const id=this.nextId++;return new Promise((resolve,reject)=>{this.pending.set(id,{resolve,reject});this.socket?.write(JSON.stringify({id,op,...payload})+'\n')})}
  private onData(data:string){this.buffer+=data;let at=this.buffer.indexOf('\n');while(at>=0){const line=this.buffer.slice(0,at).trim();this.buffer=this.buffer.slice(at+1);at=this.buffer.indexOf('\n');if(!line)continue;try{const msg=JSON.parse(line);if(msg.op==='hello')continue;const p=this.pending.get(msg.id);if(!p)continue;this.pending.delete(msg.id);msg.ok?p.resolve(msg.result):p.reject(new Error(msg.err??'browser host command failed'))}catch{}}}
  private fail(error:Error){for(const p of this.pending.values())p.reject(error);this.pending.clear()} close(){try{this.socket?.destroy()}catch{}}
}

class SharedElectronProvider implements Provider {
  readonly id='web-agent-electron'; private client?:RpcClient; private session?:string; private starting?:Promise<void>; private readonly hostMain:string; private readonly executable:string
  constructor(){this.hostMain=fileURLToPath(new URL('../browser-host.cjs',import.meta.url));this.executable=this.resolveElectron()}
  available(){return existsSync(this.executable)&&existsSync(this.hostMain)}
  private resolveElectron(){
    const explicit=process.env.ELECTRON_PATH;if(explicit&&existsSync(explicit))return explicit
    const base=dirname(fileURLToPath(import.meta.url)); const exe=process.platform==='win32'?'electron.exe':'electron'
    const candidates=[join(base,'..','node_modules','electron','dist',exe),join(base,'node_modules','electron','dist',exe),join(process.cwd(),'node_modules','electron','dist',exe)]
    try { const require=createRequire(import.meta.url); const entry=require.resolve('electron'); const packageRoot=dirname(dirname(entry)); candidates.unshift(join(packageRoot,'dist',exe)) } catch {}
    return candidates.find(existsSync)??candidates[0]
  }
  private async ensureStarted(){if(this.client&&this.session)return;if(!this.starting)this.starting=(async()=>{this.client=new RpcClient(this.hostMain,this.executable);await this.client.start();this.session=`browser:${randomUUID()}`;await this.client.call('createSession',{session:this.session})})().finally(()=>{this.starting=undefined});await this.starting}
  private async call(op:string,payload:Record<string,any>={}){await this.ensureStarted();return this.client!.call(op,{session:this.session,...payload})}
  async open(label?:string){await this.ensureStarted();await this.client!.call('setLabel',{session:this.session,label:label??'Web-Agent'});return this.session!}
  async openUrl(session:string,r:{url:string}){await this.call('navigate',{session,url:r.url})} async navigate(session:string,r:{url:string}){await this.call('navigate',{session,url:r.url})} async snapshot(session:string){return this.call('snapshot',{session})} async click(session:string,r:any){await this.call('click',{session,...r})} async fillForm(session:string,r:any){return this.call('fill',{session,...r})} async key(session:string,r:any){await this.call('key',{session,key:r.key})} async scroll(session:string,r:any){await this.call('scroll',{session,...r})} async close(session:string){if(this.client){await this.client.call('closeSession',{session});this.client.close();this.client=undefined;this.session=undefined}}
}
export const name='web-agent-browser'; export const inject:string[]=[]
export function apply(ctx:Context):void{ctx.plugin(BrowserRuntime);ctx.inject(['browser'],browserCtx=>{const runtime=browserCtx.get('browser') as BrowserRuntime;const provider=new SharedElectronProvider();const unregister=runtime.registerBrowserProvider(provider);browserCtx.effect(()=>unregister,'web-agent browser provider')})}
