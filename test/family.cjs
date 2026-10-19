const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..');
const labels=[['name','姓名'],['relation','与本人关系'],['company','工作单位'],['title','职务']];
const cell=(key,label,value,read=false)=>`<div class="el-form-item"><label class="el-form-item__label">${label}</label><div class="el-form-item__content">${read?`<div>${value}</div>`:`<div class="apply-form-input"><div class="el-input"><input id="${key}" class="el-input__inner" value="${value||''}"></div></div>`}</div></div>`;
const saved=rec=>'<form class="el-form">'+labels.map(([k,l])=>cell(k,l,rec[k],true)).join('')+'</form>';
const editable='<form class="el-form">'+labels.map(([k,l])=>cell(k,l,'')).join('')+'</form>';
const profile={basic:{name:'申请人',phone:'APPLICANT-PHONE',emergencyRelation:'弟弟'},internships:[{company:'实习单位',position:'实习岗位'}],family:[{name:'甲父',relation:'父亲',company:'父亲单位',title:'父亲职务'},{name:'乙母',relation:'母亲',company:'母亲单位',title:'母亲职务'}]};
function dom(html){const w=new JSDOM(html,{url:'https://xiaoyuan.zhaopin.com/scrd/resume2',runScripts:'outside-only',pretendToBeVisual:true}).window;w.scrollTo=()=>{};for(const f of ['rules','engine'])w.eval(fs.readFileSync(path.join(root,'content',f+'.js'),'utf8'));return w;}
(async()=>{
 const html='<div class="apply-module__body"><div class="module-header"><h6>家庭情况 <span>必填</span></h6><p>请至少填写父母和直系兄弟姐妹</p></div>'+editable+'</div>';
 let w=dom(html);let entries=w.__TT__.engine.buildEntries(w.document,profile,'basic');
 assert.ok(entries.every(e=>e.type==='family'&&e.idx===0));console.log('PASS 家庭板块四个字段统一归属家庭成员');
 await w.__TT__.engine.fill(profile,{mode:'basic',expand:false});
 for(const [key] of labels)assert.equal(w.document.querySelector('#'+key).value,profile.family[0][key]);console.log('PASS 家属姓名关系单位职务不串入本人或实习数据');
 assert.equal(w.__TT__.engine.valueFor(profile,'family','phone',0),'');console.log('PASS 缺少家属电话时不借用本人电话');w.close();
 w=dom('<div class="apply-module__body"><div><h6>家庭情况 必填</h6></div>'+editable+saved(profile.family[0])+'</div>');
 await w.__TT__.engine.fill(profile,{mode:'basic',expand:false});
 for(const [key] of labels)assert.equal(w.document.querySelector('#'+key).value,profile.family[1][key]);console.log('PASS 已保存父亲时新增表统一取母亲资料');w.close();
 w=dom(editable);entries=w.__TT__.engine.buildEntries(w.document,profile,'basic');assert.ok(entries.every(e=>e.type==='family'));console.log('PASS 标题无法读取时由家庭字段组合识别板块');w.close();
 w=dom('<div class="apply-module__body"><h6>家庭情况</h6>'+editable+saved(profile.family[0])+saved(profile.family[1])+'</div>');
 await w.__TT__.engine.fill(profile,{mode:'basic',expand:false});assert.equal(w.document.querySelector('#name').value,'');console.log('PASS 家庭资料已全部保存时不回绕填写第一位');w.close();
 w=dom('<div class="apply-module__body"><h6>个人信息</h6>'+editable+'</div>');entries=w.__TT__.engine.buildEntries(w.document,profile,'basic');assert.equal(entries.find(e=>e.label==='姓名').type,'basic');console.log('PASS 已知个人信息板块不被关系字段误判为家庭');w.close();
 const mother={...profile.family[1],company:'甲父单位'};
 w=dom('<div class="apply-module__body"><h6>家庭情况</h6>'+editable+saved(mother)+'</div>');await w.__TT__.engine.fill(profile,{mode:'basic',expand:false});assert.equal(w.document.querySelector('#name').value,'甲父');console.log('PASS 家属姓名出现在他人单位中不误判为已保存');w.close();
})().catch(e=>{console.error(e);process.exitCode=1});
