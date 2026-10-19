const fs = require('node:fs');
const assert = require('node:assert/strict');
const {JSDOM} = require('jsdom');
const path = require('node:path');
const root = path.resolve(__dirname,'..');
const profile = {basic:{name:'测试用户'},educations:[{school:'示例大学',college:'经济学院',major:'金融学',studyForm:'全日制',education:'硕士研究生',degree:'硕士',duration:'3年',start:'2024-09-01',end:'2027-06-30'}],internships:[{company:'示例公司',position:'研究助理'}],projects:[{name:'示例研究项目',role:'负责人'}]};
function dom(html,host='xiaoyuan.zhaopin.com') {
 const w = new JSDOM(html,{url:'https://'+host+'/apply',runScripts:'outside-only',pretendToBeVisual:true}).window;
 w.scrollTo=()=>{};
 for (const file of ['rules.js','engine.js']) w.eval(fs.readFileSync(path.join(root,'content',file),'utf8'));
 return w;
}
const field=(label,id,extra='')=>`<div class="resume-field"><div class="caption">${label}</div><div class="control"><input id="${id}" ${extra}></div></div>`;
(async()=>{
 let checks=0;
 const check=(message,fn)=>{fn();checks++;console.log('PASS '+message)};
 let w=dom('<h2>教育经历</h2><div class="grid">'+field('学校名称','school')+field('受教育类型','study','value="全日制"')+field('院系','college','placeholder="请填写您所在的院系"')+field('专业','major','placeholder="请填写专业名称"')+'</div>');
 let e=w.__TT__.engine;
 check('学校标签不会串成右侧全日制',()=>assert.equal(e.buildEntries(w.document,profile,'basic').find(x=>x.el.id==='school').field,'school'));
 await e.fill(profile,{mode:'basic',expand:false});
 check('学校写入学校值',()=>assert.equal(w.document.querySelector('#school').value,'示例大学'));
 check('院系已填',()=>assert.equal(w.document.querySelector('#college').value,'经济学院'));
 check('专业已填',()=>assert.equal(w.document.querySelector('#major').value,'金融学'));
 w.close();
 w=dom('<section><h2>实习/工作经历</h2>'+field('公司名称','company')+field('职位','position')+'</section><section><h2>项目经历</h2>'+field('项目名称','project')+'</section>');
 await w.__TT__.engine.fill(profile,{mode:'basic',expand:false});
 check('智联一键包含实习',()=>assert.equal(w.document.querySelector('#company').value,'示例公司'));
 check('智联一键包含项目',()=>assert.equal(w.document.querySelector('#project').value,'示例研究项目'));
 w.close();
 w=dom('<section><h2>教育经历</h2>'+field('学校名称','school')+'</section><section><h2>工作经历</h2>'+field('公司名称','company')+'</section>','test.zhiye.com');
 await w.__TT__.engine.fill(profile,{mode:'basic',expand:false});
 check('北森域保留学校通用填写',()=>assert.equal(w.document.querySelector('#school').value,'示例大学'));
 check('北森基础模式范围保持原行为',()=>assert.equal(w.document.querySelector('#company').value,''));
 await w.__TT__.engine.fill(profile,{mode:'enhanced',expand:false});
 check('北森增强模式填写工作经历',()=>assert.equal(w.document.querySelector('#company').value,'示例公司'));
 w.close();
 w=dom('<h2>教育经历</h2>'+field('学校名称','school')+field('证明人','supervisor')+'<button id="submit">立即投递</button>');
 let submitted=false; w.document.querySelector('#submit').onclick=()=>submitted=true;
 w.document.querySelector('#school').addEventListener('blur',()=>w.setTimeout(()=>w.document.querySelector('#school').value='',100));
 const result=await w.__TT__.engine.fill(profile,{mode:'basic',expand:false});
 check('延时校验清空不计成功',()=>assert.ok(result.skipped.some(x=>x.label==='学校名称')));
 check('缺少数据的证明人不填',()=>assert.equal(w.document.querySelector('#supervisor').value,''));
 check('不点击投递',()=>assert.equal(submitted,false)); w.close();
 w=dom('<h2>教育经历</h2>'+field('学校名称','school','style="display:none"'));
 await w.__TT__.engine.fill(profile,{mode:'basic',expand:false});
 check('隐藏字段不写入',()=>assert.equal(w.document.querySelector('#school').value,''));w.close();
 w=new JSDOM(fs.readFileSync(path.join(__dirname,'fixtures/zhaopin.html'),'utf8'),{url:'https://xiaoyuan.zhaopin.com/scrd/resume2',runScripts:'dangerously',pretendToBeVisual:true}).window;
 w.scrollTo=()=>{};
 for(const file of ['rules.js','engine.js']) w.eval(fs.readFileSync(path.join(root,'content',file),'utf8'));
 await w.__TT__.engine.fill(profile,{mode:'basic',expand:false});
 await new Promise(r=>setTimeout(r,400));
 check('学校联想候选真正选中',()=>assert.equal(w.document.querySelector('[data-k="school"]').value,'示例大学'));
 for (const [key,value] of Object.entries({duration:'3年',studyForm:'普通全日制',degree:'硕士',education:'硕士研究生'})) {
   check('异步自研下拉 '+key,()=>assert.equal(w.document.querySelector('[data-k="'+key+'"]').getAttribute('data-value'),value));
 }
 check('日期到日写入',()=>assert.equal(w.document.querySelector('[data-k="start"]').value,'2024-09-01'));
 w.close();
 console.log(`${checks} checks passed`);
})().catch(e=>{console.error(e);process.exitCode=1});
