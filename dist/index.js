// @bun
var{file:C,gzipSync:KQ,write:BQ,gunzipSync:MQ,serve:OQ}=globalThis.Bun;import{config as UQ}from"dotenv";import{mkdirSync as $Q,writeFileSync as NQ}from"fs";var HQ=(Q)=>Array.from({length:Q},($,N)=>N),EQ="ABCDEFGHIJKLMNOPQRSTUVWXYZ",GQ="abcdefghijklmnopqrstuvwxyz",VQ=HQ(10).join(""),bQ=new RegExp(/(\d+)(\d*)/,"m");var ZQ=(Q)=>{return!isNaN(parseFloat(Q))&&isFinite(Q)},b=(Q)=>{return typeof Q==="object"&&Q!==null&&!Array.isArray(Q)};var c=(Q)=>typeof Q==="boolean",w=(Q)=>typeof Q==="string",f=(Q)=>Array.isArray(Q);var h=(Q,$)=>{try{NQ(Q,$??"",{flag:"wx"})}catch(N){}return!0},o=(Q)=>{return $Q(Q,{recursive:!0}),!0};var{keys:d,entries:j,hasOwn:xQ}=Object;var x=Object.assign,Y=(Q)=>{return Object.keys(Q).length},R=(Q,$)=>Q.replace(new RegExp(`^${$}|${$}\$`,"g"),"");var L=(Q)=>JSON.stringify(Q),n=(Q)=>{return JSON.parse(Q)};var p=(Q,$)=>{let N=0,H=Q-1,[E,G]=$.replace(/bytes=/,"").split("-");return N=parseInt(E,10),H=G?parseInt(G,10):H,[N,H,Q]},y=(Q,$)=>{return Q.reduce((N,H,E)=>{return N[H]=$[E],N},{})},l=(Q,$=!1)=>{let N=[];if(ZQ(Q)){let H=Q;if(Number.isInteger(H))N=[H,"int"];else N=[H,"float"]}else if($&&Q.includes("."))N=[Q,"file"];else{let H="-";if(Q.length==36){let E=Q.match(/\-/g);if(E&&E.length==4)H="uuid";else H="string"}else if(Q!="/")H="string";N=[Q,H]}return N},k=(Q)=>{if(!Q.startsWith("/"))Q="/"+Q;let $=Q.match(/(?<=\/)[^/].*?(?=\/|$)/g)??["/"],[N,H]=$.reduce((E,G)=>{let[V,Z]=E;if(G.includes("<")){let K=G.match(/(?<=<)[^/].*?(?=>|$)/g);if(K?.length){let[M,O]=K[0].split(":");V.push(M),Z.push(O)}}else V.push(G);return E},[[],[]]);if(Q.endsWith("/")&&Q.length>1)N.push("/");return{parsed:N,args:H}};class W{date;constructor(Q){this.date=Q?new Date(Q):new Date}delta(Q=null,$=!1){let N=W.delta(this.date.getTime(),Q);return $?new Date(N):N}timed(Q){let $=this.date.getTime(),N=this.date;if(Q){let{year:H,month:E,day:G,hour:V,minute:Z,second:K}=Q;if(H)N=new Date(N.setFullYear(N.getFullYear()+H));if(E)N=new Date(N.setMonth(N.getMonth()+E));if(G)N=new Date(N.setDate(N.getDate()+G));if(V)N=new Date(N.setHours(N.getHours()+V));if(Z)N=new Date(N.setMinutes(N.getMinutes()+Z));if(K)N=new Date(N.setSeconds(N.getSeconds()+K))}return N}static delta(Q,$=null){if($)return $-Q;else return Q-Date.now()}static get now(){return Date.now()}}var P=(Q)=>{let $=EQ+GQ;return Array.from({length:Q},(N,H)=>$+(H?VQ:"")).reduce((N,H)=>{return N+=H.charAt(Math.floor(Math.random()*H.length))},"")};import{Auth as IQ,ServerSide as qQ,JWTInterface as JQ}from"authored";import{isArrayBuffer as jQ}from"util/types";class YQ{static set p(Q){if(f(Q))console.log(...Q);else console.log(Q)}static rand(Q=6,$){if($)return Math.round(Math.random()*($-Q)+Q);return Math.floor(Math.random()*Q)+1-1}}var J={attr:(Q)=>{return j(Q).reduce(($,[N,H])=>{return $.push(c(H)?N:`${N}="${H}"`),$},[""]).join(" ")},head:(Q)=>{if(Q)return j(Q).reduce(($,[N,H])=>{if(w(H))$.push(`<${N}>${H}</${N}>`);else if(f(H)){let E=H.reduce((G,V)=>{let Z="";if(N=="script"){let K="";if("importmap"in V)V.type="importmap",K=JSON.stringify(V.importmap),delete V.importmap;else if("body"in V)K=V.body,delete V.body;Z=`${K}</${N}>`}return G.push(`<${N}${J.attr(V)}>${Z}`),G},[]);$.push(...E)}return $},[]);return[]},cookie:(Q,$="",{maxAge:N,expires:H,path:E,domain:G,secure:V,httpOnly:Z,sameSite:K})=>{if(N instanceof Date)N=N.getSeconds();if(H instanceof Date)H=H.toUTCString();else if(H===0)H=new Date().toUTCString();return[["Domain",G],["Expires",H],["Max-Age",N],["Secure",V],["HttpOnly",Z],["Path",E],["SameSite",K]].reduce((O,[I,B])=>{if(B!==void 0)O.push(`${I}=${B}`);return O},[`${Q}=${$}`]).join("; ")},html:(Q,$,N,H)=>{let E=$,G=`<!DOCTYPE html><html lang="${N}">`;return G+=`<head>${E}</head>`,G+=H?H:`<body id="${P(5)}">${Q}</body>`,G+="</html>",G}},s={tls:(Q)=>{return j(process.env).filter(($)=>{if($[0].startsWith("TLS_"))return $}).reduce(($,N)=>{let[H,E]=N;if(E){let G=H.replace("TLS_","").toLowerCase();$[G]=C(Q+"/"+E)}return $},{})},mimeType:(Q)=>{return C(Q).type}};function gQ(...Q){let[$,N,H]=Q,E=H.value;return H.value=async function(G={}){if("session"in G&&G.session){let V=[G];return E.apply(this,V)}return{error:401}},H}function mQ(...Q){let[$,N,H]=Q,E=H.value;return H.value=async function(G={}){if("jwt"in G){let V=[G];return E.apply(this,V)}return{error:401}},H}function uQ(...Q){let[$,N,H]=Q,E=H.value;return H.value=async function(G={}){if("jwt_refresh"in G){let V=[G];return E.apply(this,V)}return{error:401}},H}class a{Q;$;formData;headers;url;__cookies={};constructor(Q,$){this.req=Q;this.server=$;this.headers=Q.headers??new Headers,this.url=new URL(Q.url)}get auth(){let Q=this.headers.get("authorization");if(Q){let[$,N]=Q.split(" ",2);if($.trim()=="Bearer")return N.trim()}}get accept(){return this.headers.get("accept")}get contentType(){return this.headers.get("content-type")}get cookies(){if(!Y(this.__cookies)){let Q=this.headers.get("cookie");if(Q)this.__cookies=Q.split(";").reduce(($,N)=>{let[H,E]=N.trim().split(/=(.*)/s);return $[H]=E,$},{})}return this.__cookies}async form(){if(this.isForm){if(!this.formData)this.formData=await this.req.formData();return this.formData}return new FormData}get ip(){return this.server?.requestIP(this.req)??""}get isForm(){let Q=this.contentType;return Q?Q.indexOf("multipart/form-data")>=0||Q.indexOf("x-www-form-urlencoded")>=0:!1}get isEventStream(){return this.accept?.includes("text/event-stream")}get method(){return this.req.method.toLowerCase()}get path(){return this.url.pathname}get parsed(){let{parsed:Q}=k(this.path);return Q}get searchParams(){return this.url.searchParams}get range(){return this.headers.get("range")??void 0}async authgroup(){let{cookies:Q,auth:$}=this,N=Q.session??"",H=$??"",E="",G=this.isForm?await this.form():void 0;if(G){let V=G.get("refresh_token");E=V?V.toString():""}return{sid:N,jwtv:H,refreshjwt:E}}get upgrade(){return this.headers.get("upgrade")}upgraded(Q={}){return this.server?.upgrade(this.req,Q)}}class m{headattr={};get head(){return this.headattr}set head(Q){j(Q).forEach(([$,N])=>{if($=="title"||$=="base")this.headattr[$]=N;else if(!($ in this.headattr))this.headattr[$]=N;else this.headattr[$].push(...N)})}}class T{Q;intervalID=[];constructor(Q){this.ctrl=Q}push(Q,$=2000){if(this.ctrl){let N=setInterval(()=>{let{id:H,retry:E,data:G,event:V,end:Z}=Q();if(this.ctrl){let K=Z?"end":G;if(E){let M=E>2000?E:2000;this.ctrl.enqueue(`retry: ${M}\n`)}if(this.ctrl.enqueue(`id: ${H}\n`),V&&this.ctrl.enqueue(`event: ${V}\n`),typeof K=="object")this.ctrl.enqueue("data: "+JSON.stringify(K)+"\n\n");else this.ctrl.enqueue("data: "+K+"\n\n");Z&&this.close()}},$>1000?$:1000);this.intervalID.push(N)}}close(){if(this.intervalID.length)this.intervalID.forEach((Q)=>{clearInterval(Q)}),this.intervalID=[];this.ctrl?.close()}}class AQ extends m{Q;lang="en";status;stream;headers={};__session;__jwt;constructor(Q){super();this.request=Q}get session(){if(!this.__session)this.__session=U.session.new;return this.__session}set session(Q){this.__session=Q}get jwt(){if(!this.__jwt)this.__jwt=U.jwt.new;return this.__jwt}set jwt(Q){this.__jwt=Q}get timedJWT(){return U.jwtInt.jwt()}set header(Q){x(this.headers,Q)}get header(){return this.headers}set type(Q){this.header={"Content-Type":Q}}setCookie({key:Q,val:$,path:N="/",days:H=31,httpOnly:E=!1}){let G=J.cookie(Q,$,{expires:new W().timed({day:H}),path:N,httpOnly:E,sameSite:"Strict"});this.header={"Set-Cookie":G}}deleteCookie(Q){this.setCookie({key:Q,val:"",days:0})}}var X=new Map;class LQ{Q;ws;path;id;broadcasting=!1;max=0;constructor(Q){this.request=Q;this.path=Q.path,this.id=P(10)}async open(){}async message(Q){}async close(Q,$){}set send(Q){if(Q)if(this.broadcasting)this.ws.publish(this.path,Q);else this.ws.send(Q)}get role(){let Q=X.get(this.path);if(Q&&this.id in Q)return Q[this.id].role}}var i=new Map,r=new Map,t=new Map,_=new Map,PQ=["string","int","float","file","uuid"];class z{_class;url;parsedURL;args=[];isFile;isWS;fileType="text/plain";bytes;maxClient=0;withSession=!1;preload=!1;broadcastWSS=!1;constructor({url:Q,_class:$=null,isFile:N=!1,withSession:H=!1,preload:E=!1,isWS:G=!1}){let{parsed:V,args:Z}=k(Q);if(this.url=Q,this.parsedURL=V,this.args=Z,this._class=$,this.isFile=N,this.isWS=G,N)this.preload=E,this.withSession=H,this.fileType=s.mimeType(Q)}loadbytes(Q){if(this.preload)C(Q+this.url).bytes().then(($)=>{this.bytes=$}).catch(($)=>{throw`error: can't preload ${this.url}. File not found.`})}}class F{Yurl;status=404;x_args;headers=new Headers({"Content-Type":"text/plain"});constructor({Yurl:Q,status:$=404,headers:N={}},H){if(x(this,{Yurl:Q,status:$}),N)this.header=N;this.x_args=H??[]}set header(Q){j(Q).forEach(([$,N])=>{this.headers.set($,N)})}set type(Q){this.headers.set("Content-Type",Q)}gzip(Q){let $=KQ(Q);return this.header={"Content-Length":$.byteLength.toString(),"Content-Encoding":"gzip"},$}}class q{Q;static router;apt="";headstr="";constructor(Q){this.id=Q}set route(Q){let{url:$,isFile:N,isWS:H,parsedURL:E,_class:G}=Q,V=H?t:N?r:i,Z=L(E);if(!V.get(Z))V.set(Z,Q);else if(!N)throw`URL: ${$} already used in class < ${G.name} >`}folder(Q,$={}){Q=R(Q,"."),Q=R(Q,"/"),_.set(Q,$)}isFile(Q,{parsed:$,_path:N}){if(Q){let H=$.slice(0,-1).join("/"),E=!1;if([..._.keys()].some((Z)=>{if(H.startsWith(Z)){let K=_.get(Z);E=K?!!K.session:!1}return H.startsWith(Z)}))return new F({Yurl:new z({url:`.${N}`,isFile:!0,withSession:E}),status:200})}return new F({})}get({parsed:Q,wss:$=!1,_path:N}){let H=!1,E=Q.slice().pop();if(E)H=l(E,!0).pop()=="file";let G=[],V=$?t:H?r:i,Z=V.get(L(Q));if(!Z){let K=[];for(let M of V.keys()){let O=n(M),I=O.length;if(Q.length===I)for(let B=0;B<I;B++)if(O[B]===Q[B])K[B]=Q[B];else{let A=O[B];if(PQ.includes(A))K[B]=O[B],G.push(Q[B])}}Z=V.get(L(K))}if(Z)return new F({Yurl:Z,status:200},G);else return this.isFile(H,{parsed:Q,_path:N})}static get init(){if(!q.router)q.router=new q(P(7));return q.router}}class S{Q;$;constructor(Q,$={}){this.app=Q;this.data=$}_head(Q){if(!Q.startsWith("."))Q="."+Q;return`<script type="module">import x from "${Q}";x.ctx(${L(this.data)});</script>`}async render(Q,$){if(w(this.app)){let N=this._head(this.app);return J.html("",Q+N,$)}else if("ssr"in this.app){let N=await this.app.ssr(this.data);return J.html("",Q+N.script,$,N.body)}return J.html("",Q,$)}}class e{session;jwt;jwtInt;constructor(){this.jwtInt=new JQ}init(Q){this.session=Q.session,this.jwt=Q.jwt}}var U=new e;class g{req;X;Y;isWSS;x_args;method;apt;constructor(Q,$){this.req=new a(Q,$);let{upgrade:N,parsed:H,method:E,path:G}=this.req;this.isWSS=!!N,this.X=q.init.get({parsed:H,wss:this.isWSS,_path:G}),this.apt=q.init.apt;let{Yurl:V,x_args:Z}=this.X;this.Y=V,this.x_args=Z,this.method=E}push(Q="",$){let{status:N,headers:H}=this.X;return new Response(Q,{status:$??N,headers:H})}file(Q,$,N){this.X.type=N;let H=this.req.range;if(H){let[E,G,V]=p($,H);return this.X.header={"Content-Range":`bytes ${E}-${G}/${V}`,"Content-Length":$.toString()},this.X.status=206,Q.slice(E,G+1)}else return this.X.header={"Cache-Control":"max-age=86400, must-revalidate"},jQ(Q)?this.X.gzip(Q):Q}async isFile(){let{url:Q,bytes:$,fileType:N}=this.Y,H=Q+" file note found.";if($)H=this.file($,$.byteLength,N);else{let V=C(this.apt+Q);try{let Z=N.startsWith("video/");H=this.file(Z?V:await V.bytes(),V.size,N)}catch(Z){this.X.status=404}}let{headers:E,status:G}=this.X;return new Response(H,{headers:E,status:G})}async upgrade(){let{Yurl:Q,headers:$,x_args:N}=this.X,H=500;if(Q){let{_class:E,args:G,broadcastWSS:V,maxClient:Z,withSession:K}=Q;if(E){let M=!0,O=y(G,N),I=new E(this.req),{sid:B}=await this.req.authgroup();if(K)if(B){let v=await U.session.openSession(B);if(!v.new)I.session=v;else H=401,M=!1}else H=401,M=!1;I.broadcasting=V,I.max=Z;let A=I.path,D=X.get(A);if(!D)X.set(A,{});D=X.get(A)??{};let QQ=Y(D);if(M&&Z&&QQ>=Z)M=!1;M&&this.req.upgraded({data:{wclass:I,z_args:O,client:D}})}}return new Response("upgrade error",{status:H,headers:$})}async auth(Q,$){let N={},{sid:H,jwtv:E,refreshjwt:G}=await this.req.authgroup();if(H){if(Q.session=await U.session.openSession(H),!Q.session.new)N.session=!0}if(E){if(Q.jwt=U.jwtInt.open(E,{hours:6}),!Q.jwt.new)N.jwt=!0;if(G){if(!(await U.jwt.openSession(G)).new)N.jwt_refresh=!0}}if(Y(N))x($,N);return}async ctx(Q,$,N,H){if(Q instanceof Response)return this.X.status=Q.status,this.X.header=Q.headers.toJSON(),await Q.arrayBuffer();else if(b(Q)&&!(Q instanceof S))return this.X.type="application/json",this.X.gzip(JSON.stringify(Q));else{if(this.X.type="text/html",Q instanceof S)return this.X.gzip(await Q.render($,N));let E=J.html(Q,$,N);return this.X.gzip(E)}}async jwt(Q){let{jwtv:$,refreshjwt:N}=await this.req.authgroup(),H={},E=(V)=>{this.X.status=403,H={error:V}},G=async(V)=>{let Z=U.jwtInt.save(V);V.access_token=Z,await U.jwt.saveSession(V,this.X.headers),H={access_token:Z,refresh_token:V.sid,status:"ok"}};if(N){let V=await U.jwt.openSession(N),Z=V.data.access_token;if($==Z)if(U.jwtInt.verify(Z,{days:5}))await G(V);else await U.jwt.saveSession(V,void 0,!0),E("expired refresh_token");else E("tokens don't match.")}else if(!$&&Q.modified)await G(Q);else this.X.status=204;return this.X.type="application/json",this.X.gzip(JSON.stringify(H))}async estream(Q,$,N){this.X.header={"Content-Type":"text/event-stream","Cache-Control":"no-cache",Connection:"keep-alive"},$.stream=new T;let H=await $.eventStream(N);if(b(H)&&"error"in H)return this.X.status=H.error,"";return new ReadableStream({async start(G){$.stream=new T(G),await $.eventStream(N),Q.req.signal.addEventListener("abort",()=>{if($.stream?.close(),$.stream?.intervalID.length)G.close()})}})}async response(){if(this.isWSS)return await this.upgrade();if(this.Y){let{isFile:Q,_class:$,args:N}=this.Y;if(Q)return this.isFile();else if($){let H=new $(this.req),E=y(N,this.x_args);if(await this.auth(H,E),this.req.isEventStream&&typeof H.eventStream==="function")return this.push(await this.estream(this.req,H,E));else if(typeof H[this.method]==="function"){let G=await H[this.method](E),{header:V,status:Z,head:K,lang:M}=H;if(this.X.header=V,G)if(this.method==="post"&&G instanceof qQ)return this.push(await this.jwt(G),Z);else if(b(G)&&"error"in G)this.X.status=G.error;else{let O=H.__session;if(O)await U.session.saveSession(O,this.X.headers);return this.push(await this.ctx(G,u.headstr+J.head(K).join(""),M),Z)}else this.X.status=Z??204}}}return this.push()}}var zQ={async open(Q){let $=Q.data.wclass,{z_args:N,client:H}=Q.data;if($){$.ws=Q;let E=$.id,G=Y(H);if(!(E in H)){let V=G?"joiner":"maker";H[E]={role:V}}if(typeof $.init=="function")await $.init(N);if($.broadcasting)$.ws.subscribe($.path);await $.open()}else Q.close()},async message(Q,$){let N=Q.data.wclass;if(N)await N.message($)},async close(Q,$,N){let H=Q.data.wclass,E=Q.data.client;if(H){if(await H.close($,N),H.broadcasting)H.ws.unsubscribe(H.path);let G=H.id;if(delete E[G],Y(E)===1)d(E).forEach((V,Z)=>{E[V].role="maker"})}}};class u extends m{Q;static headstr="";apt;router;constructor(Q="./",$={}){super();this.dir=Q;this.router=q.init;let N=this.dir+"/.private",{envPath:H,appDir:E,session:G}=$;if(!H)o(N),h(N+"/.env",`SECRET_KEY="${P(20)}"`);this.apt=Q+"/"+(E??"app")+"/",this.router.apt=this.apt,UQ({path:(H?H:N)+"/.env"});let V=G??new IQ({dir:this.dir});U.init(V)}path(Q){return($)=>{return this.router.route=new z({url:Q,_class:$}),$}}file(Q,$={session:!1,preload:!1}){let N=R(Q,"."),H=N.startsWith("/")?N:"/"+N;return this.router.route=new z({url:H,isFile:!0,withSession:$.session,preload:$.preload}),H}wss(Q,$={}){return(H)=>{let E=new z({url:Q,_class:H,isWS:!0});if(E.broadcastWSS=$.broadcast??!1,E.withSession=$.session??!1,$.maxClient)E.maxClient=$.maxClient;return this.router.route=E,H}}folder(Q,$={session:!1}){this.router.folder(Q,$)}folders(...Q){Q.forEach(($)=>{this.router.folder($)})}redirect(Q){return new Response("",{status:302,headers:{Location:Q}})}async serve(Q,$={}){let{url:N,hostname:H,method:E,port:G}=Q;if(E??="GET",H??="127.0.0.1",G??=3000,u.headstr=J.head(this.head).join(""),N){let Z=await(await new g({url:`http://${H}:${G}${N??"/"}`,method:E}).response()).arrayBuffer();Z.byteLength&&BQ(this.apt+"index.html",MQ(Z))}else OQ({port:G,tls:s.tls(this.dir),...H&&{hostname:H},fetch:async(V,Z)=>{return await new g(V,Z).response()},websocket:{sendPings:!0,perMessageDeflate:!0,...$,...zQ},...Q})}}export{LQ as wss,gQ as session,AQ as response,uQ as jwt_refresh,mQ as jwt,S as Render,u as Lycaon,YQ as $$};
