import { chromium } from "playwright-core";
const API="http://localhost:4000",WEB="http://localhost:3000";
const login=await (await fetch(API+"/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:process.env.CRAWL_EMAIL,password:process.env.CRAWL_PASSWORD})})).json();
const paths=process.argv.slice(2);
const b=await chromium.launch({executablePath:"C:/Program Files/Google/Chrome/Application/chrome.exe",headless:true,args:["--no-sandbox","--disable-gpu"]});
const ctx=await b.newContext({viewport:{width:1440,height:900}});
await ctx.addInitScript(a=>localStorage.setItem("datepage.auth.v1",JSON.stringify(a)),{accessToken:login.accessToken,refreshToken:login.refreshToken,userId:login.userId});
await ctx.addCookies([{name:"dp_access",value:login.accessToken,domain:"localhost",path:"/"}]);
for(const p of paths){
 const page=await ctx.newPage();const errs=[],bad=[];
 page.on("console",m=>{if(m.type()==="error")errs.push(m.text().slice(0,140))});page.on("pageerror",e=>{if(/Hydration/.test(e.message))console.log("HYD:",e.message.slice(0,1800))});
 page.on("pageerror",e=>errs.push("PAGEERR "+e.message.slice(0,140)));
 page.on("response",r=>{if(r.status()>=400&&!r.url().includes("_next")&&!r.url().includes("favicon"))bad.push(r.status()+" "+r.request().method()+" "+r.url().replace(/https?:\/\/localhost:/,":").slice(0,90))});
 let st="";try{const r=await page.goto(WEB+p,{waitUntil:"domcontentloaded",timeout:60000});st=r.status();await page.waitForTimeout(6000)}catch(e){st="TIMEOUT"}
 const u=page.url().replace(WEB,"");const txt=(await page.locator("body").innerText().catch(()=>"")).slice(0,80).replace(/\s+/g," ");
 console.log(`${p} -> ${st} ${u!==p?"REDIR "+u:""} | ${txt}\n   ${bad.length?"HTTP: "+[...new Set(bad)].join(" ; "):""} ${errs.length?"ERR: "+[...new Set(errs)].slice(0,3).join(" | "):""}`);
 await page.screenshot({path:"screenshots/c"+p.split("/").join("_")+".png"});await page.close();
}
await b.close();
