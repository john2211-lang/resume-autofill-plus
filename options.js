const SCHEMA = [
  {
    key: 'basic', title: '基本信息', desc: '每个网申页面都会用到，建议一次填全',
    fields: [
      ['name', '姓名'], ['englishName', '英文名'], ['gender', '性别', ['男', '女']],
      ['birth', '出生日期', 'date'], ['nation', '民族'], ['politics', '政治面貌', ['中共党员', '中共预备党员', '共青团员', '群众', '民主党派']],
      ['politicsDate', '入团/入党时间', 'date'], ['marriage', '婚姻状况', ['未婚', '已婚', '离异']],
      ['idType', '证件类型', ['身份证', '护照', '港澳通行证', '台胞证']], ['idNumber', '证件号码'],
      ['phone', '手机号'], ['tel', '固定电话'], ['email', '邮箱'], ['wechat', '微信号'], ['qq', 'QQ'],
      ['hometown', '籍贯'], ['household', '户籍所在地'], ['householdType', '户籍类型', ['居民户', '农业户口', '集体户口']],
      ['sourcePlace', '生源地'], ['address', '详细地址', 'wide'], ['homeAddress', '家庭住址'], ['zip', '邮政编码'],
      ['height', '身高(cm)'], ['weight', '体重(kg)'], ['bloodType', '血型', ['A', 'B', 'O', 'AB', '不明']],
      ['health', '健康状况'], ['highestEducation', '最高学历'], ['highestDegree', '最高学位'],
      ['graduationDate', '毕业时间', 'date'], ['archiveUnit', '档案所在单位'],
      ['gaokaoScore', '高考分数'], ['gaokaoSubject', '高考科类'],
      ['graduateType', '应届 / 往届', ['应届', '往届']],
      ['emergencyName', '紧急联系人'], ['emergencyPhone', '紧急联系电话'], ['emergencyRelation', '与本人关系'],
      ['specialty', '特长', 'area'], ['hobbies', '兴趣爱好', 'area'],
    ],
  },
  {
    key: 'job', title: '求职意向', desc: '期望岗位、城市等，许多表单的必填项',
    fields: [
      ['position', '期望岗位', 'wide'], ['industry', '期望行业', 'wide'], ['city', '期望城市'],
      ['salary', '期望薪资'], ['status', '求职状态', ['应届毕业生', '在职', '离职', '在校生']],
      ['availableDate', '到岗时间', 'date'], ['acceptAdjust', '服从调剂', ['是', '否']], ['acceptTravel', '接受出差', ['是', '否']],
    ],
  },
  {
    key: 'educations', title: '教育经历', list: true, itemTitle: (r) => r.school || '教育经历',
    template: { school: '', college: '', major: '', education: '硕士研究生', degree: '硕士', studyForm: '全日制', schoolType: '', start: '', end: '', gpa: '', majorRank: '', courses: '', thesis: '' },
    fields: [
      ['school', '学校'], ['college', '学院'], ['major', '专业'], ['education', '学历', ['博士研究生', '硕士研究生', '本科', '大专', '高中']],
      ['degree', '学位', ['博士', '硕士', '学士', '无']], ['studyForm', '学习形式', ['全日制', '非全日制']],
      ['schoolType', '院校类型', ['985', '211', '双一流', '普通本科', '其他']], ['schoolBatch', '录取批次'],
      ['start', '开始时间', 'date'], ['end', '结束时间', 'date'], ['duration', '学制'], ['city', '所在城市'],
      ['gpa', 'GPA / 平均分'], ['majorRank', '专业排名'], ['overallRank', '班级 / 综合排名'],
      ['studentId', '学号'], ['trainMode', '培养方式'], ['thesisAdvisor', '论文导师'],
      ['description', '专业描述', 'area'],
      ['courses', '主修课程', 'area'], ['thesis', '论文 / 毕业设计', 'area'],
      ['counselorName', '辅导员姓名'], ['counselorPhone', '辅导员联系方式'],
      ['overseas', '是否有海外教育经历', ['否', '是']], ['diplomaNumber', '学历证书编号'],
    ],
  },
  {
    key: 'internships', title: '实习 / 工作经历', list: true, itemTitle: (r) => r.company || '实习经历',
    /* 字段顺序照抄塔塔网申：公司/部门/行业/地点/工资/职位、工作内容、工作成果、证明人三件套、离职原因。
       「工作内容」和「工作成果」分开存，别合并成一段。 */
    template: { company: '', department: '', industry: '', location: '', salary: '', position: '', start: '', end: '', content: '', achievement: '', supervisor: '', supervisorTitle: '', supervisorPhone: '', leaveReason: '', description: '' },
    fields: [
      ['company', '公司名称', 'wide'], ['start', '开始时间', 'date'], ['end', '结束时间', 'date'],
      ['department', '部门'], ['position', '职位名称'], ['industry', '所属行业'],
      ['location', '工作地点'], ['salary', '工资 / 薪资'],
      ['content', '工作内容（具体做了什么）', 'area'],
      ['achievement', '工作成果（成效 / 数据）', 'area'],
      ['supervisor', '证明人姓名'], ['supervisorTitle', '证明人职位'],
      ['supervisorPhone', '证明人联系方式'], ['leaveReason', '离职原因'],
      ['description', '补充说明（可留空）', 'area'],
    ],
  },
  {
    key: 'projects', title: '项目经历', list: true, itemTitle: (r) => r.name || '项目经历',
    /* 照抄塔塔的「项目经历 / 实践活动」：职位、部门、项目名称、参与人数、
       项目内容、实践方式、本人职责、项目成果 —— 内容/职责/成果分开存 */
    template: { name: '', role: '', department: '', teamSize: '', type: '', start: '', end: '', content: '', duty: '', achievement: '', description: '' },
    fields: [
      ['name', '项目名称', 'wide'], ['start', '开始时间', 'date'], ['end', '结束时间', 'date'],
      ['role', '担任职位 / 角色'], ['department', '部门'], ['teamSize', '参与人数'],
      ['type', '实践方式 / 项目类型'],
      ['content', '项目内容（做了什么）', 'area'],
      ['duty', '本人职责（我负责哪块）', 'area'],
      ['achievement', '项目成果（成效 / 数据）', 'area'],
      ['description', '补充说明（可留空）', 'area'],
    ],
  },
  {
    key: 'campus', title: '校园 / 社团经历', list: true, itemTitle: (r) => r.org || '校园经历',
    template: { org: '', role: '', start: '', end: '', description: '' },
    fields: [
      ['org', '组织 / 社团', 'wide'], ['role', '担任职务'], ['start', '开始时间', 'date'], ['end', '结束时间', 'date'],
      ['description', '经历描述', 'area'],
    ],
  },
  {
    key: 'awards', title: '获奖情况', list: true, itemTitle: (r) => r.name || '获奖',
    template: { name: '', level: '', date: '', issuer: '', description: '' },
    fields: [
      ['name', '奖项名称', 'wide'], ['level', '奖项级别'], ['date', '获奖时间', 'date'], ['issuer', '颁发机构'],
      ['description', '奖项描述', 'area'],
    ],
  },
  {
    key: 'certs', title: '证书 / 技能', list: true, itemTitle: (r) => r.name || '证书',
    template: { name: '', number: '', date: '', issuer: '', description: '' },
    fields: [
      ['name', '证书名称', 'wide'], ['number', '证书编号'], ['date', '获取时间', 'date'], ['issuer', '颁发机构'],
      ['description', '证书说明', 'area'],
    ],
  },
  {
    key: 'trainings', title: '培训经历', list: true, itemTitle: (r) => r.name || '培训',
    template: { name: '', org: '', form: '', subject: '', start: '', end: '', result: '', description: '' },
    fields: [
      ['name', '培训名称', 'wide'], ['org', '培训机构'], ['form', '培训形式'], ['subject', '培训科目'],
      ['start', '开始时间', 'date'], ['end', '结束时间', 'date'], ['result', '取得成果', 'wide'],
      ['description', '培训内容', 'area'],
    ],
  },
  {
    key: 'extras', title: '其他常见必填项', desc: '英语等级、计算机水平这类站点各有各的问法，填在这里即可',
    fields: [
      ['englishLevel', '英语等级', ['CET-4', 'CET-6', '专业四级', '专业八级', '雅思', '托福', '无']],
      ['englishScore', '英语等级成绩'], ['computerLevel', '计算机水平', 'wide'],
    ],
  },
  {
    key: 'skills', title: '技能', list: true, itemTitle: (r) => r.name || '技能',
    template: { name: '', level: '熟练', years: '', description: '' },
    fields: [
      ['name', '技能名称', 'wide'], ['level', '掌握程度', ['精通', '熟练', '良好', '一般']],
      ['years', '使用时间总计'], ['description', '技能描述', 'area'],
    ],
  },
  {
    key: 'family', title: '家庭成员', list: true, itemTitle: (r) => r.name || '成员',
    template: { name: '', relation: '', birth: '', phone: '', company: '', title: '', politics: '', location: '' },
    fields: [
      ['name', '姓名'], ['relation', '关系'], ['birth', '出生日期', 'date'], ['phone', '联系电话'],
      ['company', '工作单位', 'wide'], ['title', '职务'], ['politics', '政治面貌'], ['location', '现居地'],
    ],
  },
  {
    key: 'self', title: '自我评价', desc: '开放题、自我介绍常用这段内容',
    fields: [['evaluation', '自我评价', 'area'], ['intro', '一句话介绍', 'area']],
  },
];

let data = { basic: {}, job: {}, educations: [], internships: [], projects: [], campus: [], awards: [], certs: [], trainings: [], family: [], self: {}, extras: {} };
let saveTimer = null;

const $ = (s) => document.querySelector(s);

function el(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  if (attrs) {
    for (const k in attrs) {
      if (k === 'class') e.className = attrs[k];
      else if (k === 'text') e.textContent = attrs[k];
      else if (k === 'html') e.innerHTML = attrs[k];
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), attrs[k]);
      else if (k === 'value') e.value = attrs[k];
      else e.setAttribute(k, attrs[k]);
    }
  }
  for (const kid of kids) if (kid) e.appendChild(kid);
  return e;
}

const AREA_KEYS = /description|evaluation|intro|courses|thesis|specialty|hobbies/;

function fieldEl(secKey, idx, def) {
  const [k, label, kind] = def;
  const wrap = el('div', { class: 'f' + (kind === 'area' || kind === 'wide' ? ' wide' : '') });
  wrap.appendChild(el('label', { text: label }));
  let input;
  const cur = idx == null ? data[secKey] && data[secKey][k] : (data[secKey][idx] || {})[k];
  const val = cur == null ? '' : String(cur);
  if (Array.isArray(kind)) {
    input = el('select');
    input.appendChild(el('option', { value: '', text: '请选择' }));
    for (const o of kind) input.appendChild(el('option', { value: o, text: o }));
    input.value = val;
  } else if (kind === 'area' || AREA_KEYS.test(k)) {
    input = el('textarea', { placeholder: '换行可直接分段，填写时会原样写入' });
    input.value = val;
  } else {
    input = el('input', { type: 'text', value: val, placeholder: kind === 'date' ? '如 2027-06-30' : '' });
  }
  input.addEventListener('input', () => {
    const v = input.value;
    if (idx == null) {
      data[secKey] = data[secKey] || {};
      data[secKey][k] = v;
    } else {
      data[secKey][idx] = data[secKey][idx] || {};
      data[secKey][idx][k] = v;
      const titleEl = wrap.closest('.rec') && wrap.closest('.rec').querySelector('.rh b');
      if (titleEl && SCHEMA.find((s) => s.key === secKey)) {
        const s = SCHEMA.find((x) => x.key === secKey);
        titleEl.textContent = (idx + 1) + '. ' + (s.itemTitle(data[secKey][idx]) || '未命名');
      }
    }
    scheduleSave();
  });
  wrap.appendChild(input);
  return wrap;
}

function render() {
  const form = $('#form');
  const nav = $('#nav');
  form.innerHTML = '';
  nav.innerHTML = '';

  for (const sec of SCHEMA) {
    const box = el('section', { class: 'sec', id: 'sec-' + sec.key });
    const hd = el('div', { class: 'hd' });
    const h3 = el('h3');
    h3.appendChild(el('i'));
    h3.appendChild(el('span', { text: sec.title }));
    hd.appendChild(h3);
    if (sec.desc) hd.appendChild(el('div', { class: 'd', text: sec.desc }));
    box.appendChild(hd);
    const bd = el('div', { class: 'bd' });

    if (!sec.list) {
      data[sec.key] = data[sec.key] || {};
      const grid = el('div', { class: 'grid' });
      for (const f of sec.fields) grid.appendChild(fieldEl(sec.key, null, f));
      bd.appendChild(grid);
    } else {
      data[sec.key] = data[sec.key] || [];
      if (!data[sec.key].length) bd.appendChild(el('div', { class: 'empty', text: '还没有内容，点下方按钮添加一条' }));
      data[sec.key].forEach((rec, i) => {
        const card = el('div', { class: 'rec' });
        const rh = el('div', { class: 'rh' });
        rh.appendChild(el('b', { text: i + 1 + '. ' + (sec.itemTitle(rec) || '未命名') }));
        const ops = el('div', { class: 'ops' });
        if (i > 0) {
          const up = el('button', { class: 'btn ghost small', text: '上移' });
          up.onclick = () => {
            const arr = data[sec.key];
            [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
            render();
            scheduleSave();
          };
          ops.appendChild(up);
        }
        if (i < data[sec.key].length - 1) {
          const dn = el('button', { class: 'btn ghost small', text: '下移' });
          dn.onclick = () => {
            const arr = data[sec.key];
            [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]];
            render();
            scheduleSave();
          };
          ops.appendChild(dn);
        }
        const del = el('button', { class: 'btn danger small', text: '删除' });
        del.onclick = () => {
          if (!confirm('确定删除这一条？')) return;
          data[sec.key].splice(i, 1);
          render();
          scheduleSave();
        };
        ops.appendChild(del);
        rh.appendChild(ops);
        card.appendChild(rh);
        const grid = el('div', { class: 'grid' });
        for (const f of sec.fields) grid.appendChild(fieldEl(sec.key, i, f));
        card.appendChild(grid);
        bd.appendChild(card);
      });
      const add = el('button', { class: 'btn ghost add', text: '+ 添加一条' + sec.title });
      add.onclick = () => {
        data[sec.key].push({ ...sec.template });
        render();
        scheduleSave();
        setTimeout(() => {
          const el2 = document.getElementById('sec-' + sec.key);
          if (el2) el2.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }, 30);
      };
      bd.appendChild(add);
    }
    box.appendChild(bd);
    form.appendChild(box);

    const a = el('a', { href: '#sec-' + sec.key });
    a.appendChild(el('span', { text: sec.title }));
    const n = sec.list ? (data[sec.key] || []).length : '';
    a.appendChild(el('span', { text: n ? n + ' 条' : '' }));
    nav.appendChild(a);
  }

  // 数据管理
  const box = el('section', { class: 'sec', id: 'sec-data' });
  const hd = el('div', { class: 'hd' });
  const h3 = el('h3');
  h3.appendChild(el('i'));
  h3.appendChild(el('span', { text: '数据管理' }));
  hd.appendChild(h3);
  box.appendChild(hd);
  const bd = el('div', { class: 'bd' });
  const note = el('div', { class: 'note' });
  note.innerHTML =
    '· 数据只保存在本机浏览器（chrome.storage.local），卸载扩展或清理浏览器数据会丢失，建议定期「导出 JSON」备份。<br/>' +
    '· 简历更新后，直接「导入 Excel」选择你的「简历信息-*.xlsx」即可；也可以用插件目录下的 ' +
    '<b>tools/convert_resume.py</b> 转成 JSON 再「导入 JSON」。表格需保持「分组 | 字段名 | 填写内容」三列。<br/>' +
    '· 一键填入只写入表单，不会自动提交，提交前请自己核对一遍。';
  bd.appendChild(note);
  const row = el('div', { class: 'row' });
  row.style.marginTop = '12px';
  const seedBtn = el('button', { class: 'btn ghost small', text: '恢复示例数据' });
  seedBtn.onclick = async () => {
    if (!confirm('将用插件自带的示例简历覆盖当前内容，确定？')) return;
    let seed = window.__TT_SEED__;
    if (!seed) {
      const res = await fetch(chrome.runtime.getURL('data/seed-profile.json'));
      seed = await res.json();
    }
    data = seed;
    render();
    saveNow();
  };
  const clearBtn = el('button', { class: 'btn danger small', text: '清空全部' });
  clearBtn.onclick = async () => {
    if (!confirm('清空后无法恢复（除非有导出的 JSON），确定？')) return;
    await chrome.storage.local.remove(['tt_profile']);
    data = { basic: {}, job: {}, educations: [], internships: [], projects: [], campus: [], awards: [], certs: [], trainings: [], family: [], self: {}, extras: {} };
    render();
    setStatus('已清空');
  };
  row.appendChild(seedBtn);
  row.appendChild(clearBtn);
  bd.appendChild(row);
  box.appendChild(bd);
  form.appendChild(box);

  const a = el('a', { href: '#sec-data' });
  a.appendChild(el('span', { text: '数据管理' }));
  nav.appendChild(a);

  // 滚动高亮
  const links = [...nav.querySelectorAll('a')];
  const obs = new IntersectionObserver(
    (entries) => {
      for (const en of entries) {
        if (en.isIntersecting) {
          links.forEach((l) => l.classList.toggle('active', l.getAttribute('href') === '#' + en.target.id));
        }
      }
    },
    { rootMargin: '-80px 0px -70% 0px' }
  );
  document.querySelectorAll('.sec').forEach((s) => obs.observe(s));
}

function setStatus(t, ok) {
  const s = $('#status');
  s.textContent = t;
  s.classList.toggle('saved', !!ok);
}

function scheduleSave() {
  setStatus('编辑中…');
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveNow, 700);
}

async function saveNow() {
  clearTimeout(saveTimer);
  try {
    await chrome.storage.local.set({ tt_profile: data, tt_profile_updated: Date.now() });
    setStatus('已保存 ' + new Date().toLocaleTimeString(), true);
  } catch (e) {
    setStatus('保存失败：' + e.message);
  }
}

function download(name, text) {
  const blob = new Blob([text], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/* 旧数据升级：以前实习/项目的「工作内容+工作成果」写成一整段，
   现在站点要求分开填，这里按段落自动拆一次（成果类句子进成果，项目里的「xx：」进本人职责）。 */
const PARA_ACH = /累计|达到|提升|增长|成功|实现|完成|准确率|零投诉|数百|数千|数倍|以上|指标|获得|\d+\s*%|稳定在|效率/;
const PARA_DUTY = /^[^，。；,]{2,18}[：:]/;

function splitJoined(rec, kind) {
  const ps = String(rec.description || '')
    .split(/\r?\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (!ps.length) return false;
  const content = [ps[0]];
  const duty = [];
  const ach = [];
  for (const p of ps.slice(1)) {
    if (kind === 'project' && PARA_DUTY.test(p) && !PARA_ACH.test(p)) duty.push(p);
    else if (PARA_ACH.test(p)) ach.push(p);
    else content.push(p);
  }
  if (!rec.content) rec.content = content.join('\n');
  if (kind === 'project' && !rec.duty) rec.duty = duty.join('\n');
  if (!rec.achievement) rec.achievement = ach.join('\n');
  return true;
}

function upgradeProfile(d) {
  let n = 0;
  for (const r of d.internships || []) {
    if (r.supervisorPhone == null) r.supervisorPhone = '';
    if (!r.content && splitJoined(r, 'intern')) n++;
  }
  for (const r of d.projects || []) {
    if (r.department == null) r.department = '';
    if (r.duty == null) r.duty = '';
    if (!r.content && splitJoined(r, 'project')) n++;
  }
  return n;
}

async function boot() {
  const r = await chrome.storage.local.get(['tt_profile']);
  const existing = r.tt_profile;
  const hasData = existing && (Object.values(existing.basic || {}).some(v => String(v || '').trim()) || ['educations','internships','projects','campus','awards','family'].some(k => (existing[k] || []).length));
  if (hasData) data = existing;
  else {
    try {
      let seed = window.__TT_SEED__;
      if (!seed) {
        const res = await fetch(chrome.runtime.getURL('data/seed-profile.json'));
        seed = await res.json();
      }
      data = seed;
      await chrome.storage.local.set({ tt_profile: data });
    } catch (e) {}
  }
  for (const k of ['basic', 'job', 'self', 'extras']) data[k] = data[k] || {};
  for (const s of SCHEMA) if (s.list) data[s.key] = data[s.key] || [];
  if (!data.skills || !data.skills.length) data.skills = [];
  await window.__TT__.upgradeEducationData(data);
  const upgraded = upgradeProfile(data);
  render();
  setStatus(upgraded ? '已按新的「内容 / 职责 / 成果」拆好 ' + upgraded + ' 条经历' : '已就绪', upgraded > 0);
  if (upgraded) saveNow();
}

$('#saveBtn').onclick = saveNow;

$('#exportBtn').onclick = () => {
  const name = '简历-' + ((data.basic && data.basic.name) || 'profile') + '-' + new Date().toISOString().slice(0, 10) + '.json';
  download(name, JSON.stringify(data, null, 2));
  setStatus('已导出', true);
};

$('#importBtn').onclick = () => $('#file').click();
$('#importExcelBtn').onclick = () => $('#file').click();
$('#file').onchange = async (e) => {
  const f = e.target.files[0];
  if (!f) return;
  try {
    let obj;
    if (/\.(xlsx|xls)$/i.test(f.name)) {
      obj = await window.importXlsx(f);
      if (!obj.basic || !Object.keys(obj.basic).length) throw new Error('没读到「基本信息」分组，请确认表格是「分组 | 字段 | 内容」三列');
    } else {
      obj = JSON.parse(await f.text());
    }
    if (!obj || typeof obj !== 'object') throw new Error('不是有效的 JSON');
    if (!obj.basic && !obj.educations) throw new Error('缺少 basic / educations 字段');
    if (!confirm('导入会覆盖当前资料，确定？')) return;
    const old = data || {};
    data = obj;
    for (const k of ['basic', 'job', 'self', 'extras']) data[k] = data[k] || {};
    for (const s of SCHEMA) if (s.list) data[s.key] = data[s.key] || [];
    // Excel 里没有的补充信息（技能、英语等级等）保留原来的，避免一导入就被清空
    data.basic = Object.assign({}, old.basic || {}, data.basic);
    data.extras = Object.assign({}, old.extras || {}, data.extras);
    if (!data.skills || !data.skills.length) data.skills = old.skills || [];
    render();
    await saveNow();
  } catch (err) {
    alert('导入失败：' + err.message);
  } finally {
    e.target.value = '';
  }
};

document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    saveNow();
  }
});

boot();
