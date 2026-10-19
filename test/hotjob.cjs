const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..');
const field=(name,body)=>`<div class="ant-form-item"><div class="ant-form-item-label"><label>${name}*</label></div><div class="ant-form-item-control">${body}</div></div>`;
const input=(name,hidden=true)=>field(name,`<input placeholder="请选择${name}">`)+(hidden?`<div style="display:none">${field(name,'<input>')}</div>`:'');
const picker=name=>field(name,'<div class="ant-select"><div role="combobox" aria-controls="p'+name+'"><span class="ant-select-selection-selected-value"></span><input class="ant-select-search__field"></div></div>');
const block=()=>'<div class="form-cell-inner">'+field('开始时间','<input placeholder="请选择开始时间" readonly>')+field('结束时间','<input placeholder="请选择结束时间" readonly>')+input('学校')+picker('学历')+picker('学位')+input('专业')+'</div>';
const section=(name,body)=>`<div class="form-cell"><div class="tit-wrap"><div class="tit"><p>${name}</p></div></div>${body}</div>`;
const profile={basic:{name:'本人'},educations:[{school:'硕士学校',education:'硕士研究生',degree:'硕士',major:'投资经济学',start:'2024-09-01',end:'2027-06-30'},{school:'本科学校',education:'本科',degree:'学士',major:'经济学',start:'2020-09-01',end:'2024-06-30'}]};
function setup(html){const w=new JSDOM(html,{url:'https://wecruit.hotjob.cn/pb/resumeOperation.html',runScripts:'outside-only',pretendToBeVisual:true}).window;w.scrollTo=()=>{};for(const f of ['rules','engine'])w.eval(fs.readFileSync(path.join(root,'content',f+'.js'),'utf8'));return w;}
(async()=>{
let w=setup(section('个人基本信息',input('毕业院校')+input('专业'))+section('教育经历',block()+block()));
let es=w.__TT__.engine.buildEntries(w.document,profile,'basic');
assert.equal(es.filter(e=>e.field==='school').length,3);assert.ok(es.every(e=>!e.el.closest('[style="display:none"]')));console.log('PASS 隐藏学校专业框不重复占记录');
const edu=es.filter(e=>e.section==='教育经历');assert.equal(edu.length,12);assert.ok(edu.slice(0,6).every(e=>e.idx===1));assert.ok(edu.slice(6).every(e=>e.idx===0));console.log('PASS 本科硕士按时间排序且每条六字段同属一记录');
assert.ok(es.filter(e=>e.section==='个人基本信息').every(e=>e.idx===0));console.log('PASS 基本信息毕业院校与专业取最高学历');w.close();
w=setup(section('教育经历','<div class="form-cell-inner">'+field('城市','<div class="ant-select"><div role="combobox"></div></div><div class="ant-select"><div role="combobox"></div></div>')+'</div>'));es=w.__TT__.engine.buildEntries(w.document,profile,'basic');assert.equal(es.length,2);assert.equal(es[0].regionPart,0);assert.equal(es[1].regionPart,1);assert.equal(es[0].idx,1);assert.equal(es[1].idx,1);console.log('PASS 教育城市省市拆分且保持同一教育记录');w.close();
w=setup(section('教育经历',block()+block()+block()));es=w.__TT__.engine.buildEntries(w.document,profile,'basic');assert.ok(es.slice(12).every(e=>w.__TT__.engine.valueFor(profile,e.type,e.field,e.idx)===''));console.log('PASS 超出简历的教育记录不回填最高学历');w.close();
w=setup(section('亲属关系',field('姓名','<input>')+field('电话','<input>')+field('职务','<input>')));assert.equal(w.__TT__.engine.buildEntries(w.document,profile,'basic').length,0);console.log('PASS 公司亲属申报不借用本人家庭实习资料');w.close();
w=setup(section('个人基本信息',field('最高学历是否为境外院校？（含港澳台）','<div class="ant-radio-group"><label><input type="radio">是</label><label><input type="radio">否</label></div>')));es=w.__TT__.engine.buildEntries(w.document,profile,'basic');assert.equal(es.length,1);assert.equal(es[0].field,'overseas');assert.equal(es[0].radios.length,2);console.log('PASS 境外院校单选归为海外经历且组合不拆分');w.close();
w=setup(picker('学历')+'<ul id="p学历" class="ant-select-dropdown"><li role="option">本科</li><li role="option">硕士研究生</li></ul>');
let trigger=w.document.querySelector('[role=combobox]');w.document.querySelectorAll('li').forEach(n=>n.onclick=()=>{trigger.querySelector('span').textContent=n.textContent});
assert.ok((await w.__TT__.engine.fillPicker(trigger,'硕士研究生','学历')).ok);assert.equal(trigger.querySelector('span').textContent,'硕士研究生');console.log('PASS Ant下拉在所属候选列表选择并核实回显');w.close();
w=setup(input('学校',false)+'<div class="ant-modal" style="display:none"><div class="school-form"><input placeholder="请输入学校名称"><div class="school-list"><span class="school-item">辽宁大学</span></div></div><div class="ant-modal-footer"><button>取消</button><button>选择</button></div></div>');
let target=w.document.querySelector('input'),modal=w.document.querySelector('.ant-modal'),selected='';target.onclick=()=>modal.style.display='block';w.document.querySelector('.school-item').onclick=()=>selected='辽宁大学';w.document.querySelectorAll('button')[1].onclick=()=>{target.value=selected;modal.style.display='none'};
assert.ok((await w.__TT__.engine.fillPicker(target,'辽宁大学','学校')).ok);assert.equal(target.value,'辽宁大学');console.log('PASS 学校弹窗搜索精确候选并确认回填');
target.value='';selected='';target.placeholder='请选择专业';w.document.querySelector('.school-item').textContent='投资经济学(应用经济学)';w.document.querySelector('.school-item').onclick=()=>selected='投资经济学(应用经济学)';assert.ok((await w.__TT__.engine.fillPicker(target,'投资经济学','专业')).ok);console.log('PASS 专业候选允许唯一同名学科括注');
target.value='';assert.equal((await w.__TT__.engine.fillPicker(target,'不存在大学','学校')).ok,false);assert.equal(target.value,'');console.log('PASS 无精确学校候选不伪造成功或写入原始文本');w.close();
})().catch(e=>{console.error(e);process.exitCode=1});
