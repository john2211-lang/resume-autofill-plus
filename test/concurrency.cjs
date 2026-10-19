const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
(async()=>{
 const w=new JSDOM('<body></body>',{url:'https://xiaoyuan.zhaopin.com',runScripts:'outside-only',pretendToBeVisual:true}).window;
 const profile={basic:{name:'测试'},educations:[]};let calls=0;
 w.chrome={storage:{local:{get:async()=>({tt_profile:profile,tt_hidden:[]}),set:async()=>{}}},runtime:{sendMessage:()=>{}}};
 w.__TT__={engine:{fill:async()=>{calls++;await new Promise(r=>setTimeout(r,100));return {filled:1,ms:100,log:[],skipped:[],undo:()=>0}}}};
 w.eval(fs.readFileSync(path.join(__dirname,'../content/panel.js'),'utf8'));
 await w.__TT__.mountPanel();
 await Promise.all([w.__TT__.panel.doFill('basic'),w.__TT__.panel.doFill('enhanced'),w.__TT__.panel.doFill('region')]);
 assert.equal(calls,1);assert.equal(w.__TT__.panel.state.fillPromise,null);console.log('PASS 连点三种模式仅执行一次填写');w.close();
})().catch(e=>{console.error(e);process.exitCode=1});
