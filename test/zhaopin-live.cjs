const fs=require('node:fs');const path=require('node:path');const assert=require('node:assert/strict');const {JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..');
const input=(label,id,inner='')=>`<div class="el-form-item"><label class="el-form-item__label">${label}</label><div class="el-form-item__content">${inner || `<input id="${id}">`}</div></div>`;
const select=(label,id,options)=>input(label,id,`<div class="el-select"><input id="${id}" readonly><div class="el-select-dropdown" style="display:none"><ul>${options.map(v=>`<li class="el-select-dropdown__item">${v}</li>`).join('')}</ul></div></div>`);
(async()=>{
 const html=`<div class="apply-module__body"><h2>教育经历</h2><form class="el-form">${input('学校名称','school','<div class="el-autocomplete" role="combobox" aria-owns="schools"><input id="school" aria-autocomplete="list"><ul id="schools" role="listbox" style="display:none"></ul></div>')}${select('学历','education',['本科','硕士研究生'])}${select('受教育类型','studyForm',['全日制统分统招','海外留学','成人教育','其他'])}${input('证明人','person')}${input('证明人关系','relation')}${input('证明人职务','title')}${input('证明人联系方式','phone')}<div id="dynamic"></div></form></div>`;
 const w=new JSDOM(html,{url:'https://xiaoyuan.zhaopin.com/scrd/resume2',runScripts:'outside-only',pretendToBeVisual:true}).window;
 w.scrollTo=()=>{}; for(const f of ['rules','engine'])w.eval(fs.readFileSync(path.join(root,'content',f+'.js'),'utf8'));
 const d=w.document;let selected=false;const schoolWrites=[];
 const school=d.querySelector('#school');
 school.addEventListener('input',()=>{schoolWrites.push(school.value);selected=false;w.setTimeout(()=>{const ul=d.querySelector('#schools');ul.innerHTML='<li role="option">示例大学</li>';ul.style.display='block';ul.firstChild.onclick=()=>{selected=true;school.value='示例大学';ul.style.display='none';};},330)});
 school.addEventListener('blur',()=>w.setTimeout(()=>{if(!selected)school.value=''},100));
 for(const box of d.querySelectorAll('.el-select')){
   const inp=box.querySelector('input'),popup=box.querySelector('.el-select-dropdown');
   inp.onclick=()=>popup.style.display='block';
   for(const li of popup.querySelectorAll('li'))li.onclick=()=>{inp.value=li.textContent;popup.style.display='none';if(inp.id==='education')w.setTimeout(()=>{d.querySelector('#dynamic').innerHTML=input('院系','college')+input('专业课程','courses');},40);};
 }
 const profile={basic:{phone:'NOT-A-COUNSELOR'},educations:[{school:'示例大学',education:'硕士研究生',studyForm:'全日制',college:'经济学院',courses:'测试课程',counselorName:'测试辅导员',counselorPhone:'COUNSELOR-EXAMPLE'}]};
 const r=await w.__TT__.engine.fill(profile,{mode:'basic',expand:false});
 assert.equal(school.value,'示例大学');assert.equal(selected,true);assert.ok(!schoolWrites.includes('全日制'));console.log('PASS 学校候选已选中且从未被学习形式覆盖');
 assert.equal(d.querySelector('#college').value,'经济学院');assert.equal(d.querySelector('#courses').value,'测试课程');console.log('PASS 一次点击填写学历变化后新出现的字段');
 assert.equal(d.querySelector('#person').value,'测试辅导员');assert.equal(d.querySelector('#relation').value,'辅导员');assert.equal(d.querySelector('#title').value,'辅导员');assert.equal(d.querySelector('#phone').value,'COUNSELOR-EXAMPLE');console.log('PASS 教育证明人及关系职务电话映射本条辅导员');
 assert.equal(d.querySelector('#studyForm').value,'全日制统分统招');console.log('PASS 学习形式仅选择本组件选项');
 // A readonly select must never type into a neighboring autocomplete input.
 await w.__TT__.engine._typeToFilter(d.querySelector('#studyForm'),'其他');assert.equal(school.value,'示例大学');console.log('PASS 下拉搜索不能改写相邻输入框');
 w.close();
 const source=new JSDOM(fs.readFileSync(path.join(__dirname,'fixtures/zhaopin-real.html'),'utf8'));
 const schoolMarkup=source.window.document.querySelector('.apply-form-school').closest('.el-form-item').outerHTML;source.window.close();
 const actual=new JSDOM('<h2>教育经历</h2>'+schoolMarkup,{url:'https://xiaoyuan.zhaopin.com',runScripts:'outside-only',pretendToBeVisual:true}).window;
 actual.scrollTo=()=>{};for(const f of ['rules','engine'])actual.eval(fs.readFileSync(path.join(root,'content',f+'.js'),'utf8'));
 const native=actual.document.querySelector('input');let chosen=false;
 native.addEventListener('input',()=>actual.setTimeout(()=>{const ul=actual.document.querySelector('[role="listbox"]');ul.innerHTML='<li>示例大学</li>';ul.parentElement.parentElement.style.display='block';ul.querySelector('li').onclick=()=>{chosen=true;native.value='示例大学';};},1100));
 native.addEventListener('blur',()=>actual.setTimeout(()=>{if(!chosen)native.value=''},100));
 await actual.__TT__.engine.fill({educations:[{school:'示例大学'}]},{mode:'basic',expand:false});
 assert.equal(chosen,true);assert.equal(native.value,'示例大学');console.log('PASS 真实学校DOM等待慢速候选并提交选择');actual.close();
 const redraw=new JSDOM('<h2>教育经历</h2><form class="el-form">'+input('学校名称','school')+input('学历','ed','<select id="ed"><option value="">请选择</option><option>硕士研究生</option></select>')+'<div id="contacts">'+input('证明人','person')+input('证明人关系','relation')+'</div></form>',{url:'https://xiaoyuan.zhaopin.com',runScripts:'outside-only',pretendToBeVisual:true}).window;
 redraw.scrollTo=()=>{};for(const f of ['rules','engine'])redraw.eval(fs.readFileSync(path.join(root,'content',f+'.js'),'utf8'));
 redraw.document.querySelector('#ed').onchange=()=>redraw.setTimeout(()=>{redraw.document.querySelector('#contacts').innerHTML=input('证明人','person')+input('证明人关系','relation');},700);
 await redraw.__TT__.engine.fill({educations:[{school:'示例大学',education:'硕士研究生',counselorName:'延时重绘辅导员'}]},{mode:'basic',expand:false});
 await new Promise(r=>setTimeout(r,800));
 assert.equal(redraw.document.querySelector('#person').value,'延时重绘辅导员');assert.equal(redraw.document.querySelector('#relation').value,'辅导员');console.log('PASS 首轮完成后延时重建证明人控件也能自动补齐');redraw.close();

})().catch(e=>{console.error(e);process.exitCode=1});
