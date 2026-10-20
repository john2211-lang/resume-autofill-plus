/* 智能填充引擎：识别标签 -> 匹配简历字段 -> 写入控件 */
(function () {
  const TT = (window.__TT__ = window.__TT__ || {});

  const SKIP_INPUT_TYPES = /^(hidden|submit|button|reset|image|file|password|search)$/i;

  const isZhaopin = () => /(^|\.)zhaopin\.com$/i.test(location.hostname);

  const isHotjob = () => /(^|\.)hotjob\.cn$/i.test(location.hostname);

  const isPhoenix = () => /(^|\.)zhiye\.com$/i.test(location.hostname) && !!document.querySelector(".form-item--phoenix");

  const is51job = () => /(^|\.)51job\.com$/i.test(location.hostname) && !!document.querySelector('#container input[cname],#container textarea[cname],#container select[cname]');
  const isModern51 = () => /(^|\.)51job\.com$/i.test(location.hostname) && /^\/consumer\/pc\/resume\//.test(location.pathname);
  function job51Section() { return txt(document.querySelector('#container h1') || document.querySelector('h1')); }

  function phoenixSection(el) {
    const form=el.closest(".form[name]");
    if(!form || !form.id) return "";
    const heading=[...document.querySelectorAll("div[id]")].find(n=>n.id===form.id && n!==form && !n.matches(".form") && !n.querySelector("input,textarea"));
    return heading ? txt(heading) : "";
  }

  function norm(s) {
    return String(s == null ? '' : s)
      .replace(/[\s\u00a0]+/g, '')
      .replace(/[（）()【】\[\]「」“”"'’‘·•]/g, '')
      .replace(/[*＊:：]/g, '')
      .replace(/^(请输入|请选择|请填写|输入)/, '')
      .toLowerCase();
  }

  // 去掉行政区后缀：辽宁省 -> 辽宁，方便和下拉选项对齐
  const ADMIN_SUFFIX = /(特别行政区|维吾尔自治区|壮族自治区|回族自治区|自治区|自治州|地区|省|市|区|县|旗|镇|街道|村)$/;
  const cutAdmin = (s) => String(s).replace(ADMIN_SUFFIX, '');
  TT.norm = norm;

  function txt(el) {
    return (el && (el.innerText || el.textContent) ? (el.innerText || el.textContent) : '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  let LAYOUT = null;
  function hasLayout() {
    if (LAYOUT == null) {
      const r = document.documentElement.getBoundingClientRect();
      LAYOUT = r.width > 0 && r.height > 0;
    }
    return LAYOUT;
  }

  function visible(el) {
    if (!el) return false;
    if (el.hidden) return false;
    const s = getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden' || s.opacity === '0') return false;
    if (!hasLayout()) return true;
    const r = el.getBoundingClientRect();
    return r.width > 1 && r.height > 1;
  }

  /* ---------------- 标签 & 板块识别 ---------------- */
  function concealed(el) {
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const style = getComputedStyle(n);
      if (n.hidden || style.display === 'none' || style.visibility === 'hidden') return true;
    }
    return false;
  }

  function labelParts(el) {
    if (is51job() && el.hasAttribute('cname')) return [el.getAttribute('cname') || txt(el.closest('dl')?.querySelector('dt'))];
    if (isPhoenix()) {
      const item=el.closest(".form-item--phoenix");
      const label=item && item.querySelector(".form-item__text");
      if(label) return [txt(label)];
    }
    if (isHotjob()) {
      const item=el.closest(".ant-form-item");
      const label=item && item.querySelector(".ant-form-item-label label");
      if (label) return [txt(label)];
    }
    // Resolve the nearest field's own heading before walking siblings. A two-column
    // grid can otherwise expose the previous field's selected value as a label.
    if (isZhaopin()) {
      const item = el.closest('.el-form-item');
      const ownLabel = item && item.querySelector('.el-form-item__label');
      if (ownLabel && txt(ownLabel)) return [txt(ownLabel)];
      let cell = el.parentElement;
      for (let depth = 0; cell && depth < 6; depth++, cell = cell.parentElement) {
        const controls = [...cell.querySelectorAll('input,textarea,select,[role="combobox"]')]
          .filter(n => !n.matches('input[type="hidden"]') && !(n !== el && n.contains(el)));
        if (controls.some(n => n !== el && !el.contains(n))) break;
        const labels = [...cell.querySelectorAll('label,.lb,.label,[class*="label"],[class*="Label"]')]
          .filter(n => !n.contains(el) && !n.querySelector('input,select,textarea') && !n.closest('[role="listbox"]'));
        const own = labels.map(n => txt(n)).filter(t => t && t.length < 40);
        if (own.length === 1) return [own[0]];
        // Unnamed wrappers: accept only a preceding leaf within this single field.
        const local = [...cell.children].find(n => n !== el && !n.contains(el) &&
          !n.querySelector('input,textarea,select,[role="combobox"]') &&
          (n.compareDocumentPosition(el) & 4) && !/select|option|value|placeholder/i.test(n.className || '') &&
          txt(n) && txt(n).length < 24 && !/^(请选择|请输入|请填写)/.test(txt(n)));
        if (local) return [txt(local)];
      }
    }
    const parts = [];
    // 「请选择 / 请输入」这类占位文字不是字段名，但没 label 时只能靠它。
    // 先放一边，等真 label 都试过还认不出来再用 —— 否则「请选择您的学历」会比
    // 「学位」先命中 /学历/，把学位下拉填成学历值。
    const low = [];
    const push = (t) => {
      const s = String(t == null ? '' : t).replace(/\s+/g, ' ').trim();
      if (!s || s.length > 60 || parts.includes(s) || low.includes(s)) return;
      if (/^(请选择|请输入|请填写|选择|输入|点击选择)/.test(s)) low.push(s);
      else parts.push(s);
    };
    const aria = el.getAttribute('aria-label');
    if (aria) push(aria);

    if (el.id) {
      try {
        const l = document.querySelector('label[for="' + CSS.escape(el.id) + '"]');
        if (l) push(txt(l));
      } catch (e) {}
    }
    const wrapLabel = el.closest('label');
    if (wrapLabel) push(txt(wrapLabel));

    // 表格布局：只看本单元格前面那个 th/td，避免串到同一行别的字段
    const cell = el.closest('td,th');
    if (cell && cell.previousElementSibling) push(txt(cell.previousElementSibling));

    // 组件库 form-item 的 label（不含 tr，防止一行多字段互相串）
    const item = el.closest(
      '.ant-form-item, .el-form-item, .layui-form-item, .ivu-form-item, .form-item, .form-group, .weui-cell, .field-row, .form-row'
    );
    if (item) {
      const cands = item.querySelectorAll(
        '.ant-form-item-label label, .el-form-item__label, .layui-form-label, .ivu-form-item-label, .control-label, .form-label, .item-label, label'
      );
      for (const c of cands) {
        if (!c.contains(el) && txt(c)) {
          push(txt(c));
          break;
        }
      }
    }

    // 普通 div 布局：父节点的前置兄弟 / 首个文本子节点
    let p = el.parentElement;
    for (let i = 0; i < 3 && p; i++, p = p.parentElement) {
      const prev = p.previousElementSibling;
      if (prev && !prev.querySelector('input,select,textarea') && txt(prev) && txt(prev).length < 40) {
        push(txt(prev));
        // 拿到的只是「请选择…」这种占位文字就别停，继续往上找真 label
        if (parts.length) break;
      }
      const first = p.firstElementChild;
      if (
        first && first !== el && !first.contains(el) &&
        !first.querySelector('input,select,textarea') &&
        txt(first) && txt(first).length < 40
      ) {
        push(txt(first));
        if (parts.length) break;
      }
    }
    // 几何兜底：同一行内紧挨在控件左边的短文本
    push(labelByGeometry(el));
    push(el.getAttribute('placeholder'));
    push(el.getAttribute('name'));
    push(el.id);
    if (el.getAttribute('aria-labelledby')) {
      const l = document.getElementById(el.getAttribute('aria-labelledby'));
      if (l) push(txt(l));
    }
    return parts.concat(low);
  }

  /* 兜底：同一行内、在控件左侧、距离最近的短文本（纯 div 布局常用） */
  function labelByGeometry(el) {
    if (!hasLayout()) return '';
    const rect = el.getBoundingClientRect();
    if (!rect.width) return '';
    let best = '';
    let bestDist = Infinity;
    const all = document.querySelectorAll('label, span, div, p, td, th');
    const limit = Math.min(all.length, 3000);
    for (let i = 0; i < limit; i++) {
      const n = all[i];
      if (n === el || n.contains(el) || el.contains(n)) continue;
      const t = (n.textContent || '').trim();
      if (!t || t.length > 12) continue;
      if (n.children.length > 0) continue;
      const r = n.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      const vOverlap = Math.min(rect.bottom, r.bottom) - Math.max(rect.top, r.top);
      if (vOverlap < Math.min(rect.height, r.height) * 0.4) continue;
      if (r.right > rect.left + 4) continue;
      const dist = rect.left - r.right;
      if (dist > 160) continue;
      if (dist < bestDist) {
        bestDist = dist;
        best = t;
      }
    }
    return best;
  }

  const HEAD_CLASS = /(^|[-_])(title|heading|header|head)([-_]|$)/i;
  const SECTION_WORDS = /^(个人|基本|联系|求职|教育|实习|工作|项目|校园|获奖|荣誉|证书|技能|语言|培训|家庭|自我|其他|附件|意向|经历|信息|情况)/;

  function isHeadingNode(n) {
    if (!n || n.nodeType !== 1) return false;
    if (/^(H1|H2|H3|H4|H5|H6|LEGEND)$/.test(n.tagName)) return true;
    const cls = typeof n.className === 'string' ? n.className : '';
    return HEAD_CLASS.test(cls);
  }

  /* 只认「控件前面的标题」：h1-h6 / legend / class 含 title、head，
     或短文本且以板块词开头。取不到就返回空，宁可没有上下文也不要串行。 */
  function sectionOf(el) {
    if(isModern51()) {const module=el.closest('.resume-module');const header=module?.querySelector('.resume-module-header .title');if(header)return txt(header);}
    if (is51job()) return job51Section();
    if(isPhoenix()) {const section=phoenixSection(el);if(section)return section;} 
    if (isHotjob()) {
      const cell=el.closest(".form-cell");
      const heading=cell && cell.querySelector(".tit-wrap .tit p");
      if (heading) return txt(heading);
    }
    if (isZhaopin()) {
      const module=el.closest('.apply-module__body,.apply-module');
      const heading=module && module.querySelector('h1,h2,h3,h4,h5,h6');
      if (heading && /^(家庭|家属|亲属)/.test(norm(txt(heading)))) return '家庭情况';
      const form=el.closest('form.el-form');
      const labels=form ? [...form.querySelectorAll('.el-form-item__label')].map(n=>norm(txt(n))) : [];
      if (!heading && labels.includes('姓名') && labels.includes('与本人关系') && labels.some(t=>/^(工作单位|职务|职位)$/.test(t))) return '家庭情况';
    }
    let node = el.parentElement;
    for (let i = 0; i < 10 && node && node !== document.body && node !== document.documentElement; i++, node = node.parentElement) {
      if (node.tagName === 'FIELDSET') {
        const lg = node.querySelector('legend');
        if (lg && txt(lg)) return txt(lg).slice(0, 40);
      }
      let head = null;
      for (const c of node.children) {
        if (c === el || c.contains(el)) break;
        if (c.querySelector('input,select,textarea,[contenteditable="true"]')) continue;
        const t = txt(c);
        if (!t || t.length > 40) continue;
        const isCell = /^(TH|TD|LABEL|OPTION|LI|TR)$/.test(c.tagName);
        if (isHeadingNode(c)) head = c;
        else if (!isCell && t.length <= 20 && SECTION_WORDS.test(t)) head = c;
      }
      if (head) return txt(head).slice(0, 40);
    }
    return '';
  }

  /* ---------------- 控件扫描 ---------------- */
  function collectControls(root) {
    const list = [];
    const nodes = root.querySelectorAll(
      'input, textarea, select, [contenteditable="true"], [role="combobox"]'
    );
    for (const el of nodes) {
      const tag = el.tagName.toLowerCase();
      if(isPhoenix() && (concealed(el) || !el.closest('.form-item--phoenix') || el.closest('.constant-main-selector-container,.phoenix-date-picker'))) continue;
      if (isHotjob() && (concealed(el) || el.closest('.ant-modal,.ant-select-dropdown') || el.matches('.ant-select-search__field'))) continue;
      if (isZhaopin() && el.matches('[role="combobox"]') && el.querySelector('input,textarea,select')) continue;
      if (tag === 'input') {
        const t = (el.type || 'text').toLowerCase();
        if (SKIP_INPUT_TYPES.test(t)) continue;
        if (t === 'radio' || t === 'checkbox') continue;
      }
      if (el.disabled) continue;
      if (el.closest('[data-tt-ignore]')) continue;
      // 富文本编辑器（contenteditable 里嵌套很多 div），只取最外层
      if (el.isContentEditable) {
        const outer = el.closest('[contenteditable="true"]');
        if (outer && outer !== el) continue;
      }
      list.push(el);
    }
    // radio 分组
    const radios = [...root.querySelectorAll('input[type="radio"]')].filter(
      (r) => !r.disabled && !r.closest('[data-tt-ignore]') && !(isHotjob() && (concealed(r) || r.closest('.ant-rate')))
    );
    const groups = new Map();
    for (const r of radios) {
      const key = (isHotjob() && r.closest('.ant-radio-group') ? 'hotjob_'+[...root.querySelectorAll('.ant-radio-group')].indexOf(r.closest('.ant-radio-group')) : '') || r.name || 'g' + (r.parentElement ? [...r.parentElement.parentElement.children].indexOf(r.parentElement) : 0) + '_' + (r.closest('.ant-radio-group,.el-radio-group,.layui-form') ? 'x' : 'y') + '_' + (r.closest('.ant-form-item,.el-form-item,.form-item,tr') ? labelParts(r).join('|') : '');
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(r);
    }
    return { controls: list, radioGroups: [...groups.values()] };
  }

  function radioText(r) {
    const l = r.closest('label');
    if (l) return txt(l);
    if (r.id) {
      const lb = document.querySelector('label[for="' + CSS.escape(r.id) + '"]');
      if (lb) return txt(lb);
    }
    const next = r.nextSibling;
    if (next && next.nodeType === 3) return String(next.textContent).trim();
    const nx = r.nextElementSibling;
    if (nx && !nx.querySelector('input')) return txt(nx);
    return r.value || '';
  }

  /* ---------------- 重复记录分组 ---------------- */
  function sigOf(node) {
    if (!node || node.nodeType !== 1) return '';
    return node.tagName + '|' + [...node.classList].sort().join('.');
  }

  function repeatedBlockOf(el) {
    let node = el.parentElement;
    for (let i = 0; i < 9 && node && node.parentElement && node !== document.body; i++, node = node.parentElement) {
      const sig = sigOf(node);
      if (!sig) break;
      const sibs = [...node.parentElement.children].filter((c) => sigOf(c) === sig);
      if (sibs.length >= 2) {
        const inputs = node.querySelectorAll('input,textarea,select,[contenteditable="true"]');
        if (inputs.length >= 1) return { index: sibs.indexOf(node), count: sibs.length, node };
      }
    }
    return null;
  }

  /* ---------------- 匹配 ---------------- */
  /* 只有「带连接符」的规则才允许拿「板块名+标签」去匹配，
     否则「社团经历」这类板块关键词会把板块里所有字段都抢走 */
  const CROSS_RE = /(\.\*|\.\+|\\s|\\W)/;

  function matchRule(labelAll, section) {
    const compact = norm(labelAll);
    const sec = norm(section);
    for (const rule of TT.RULES) {
      if (rule.section && !rule.section.test(section || '')) continue;
      let hit = false;
      try {
        hit = rule.re.test(compact);
        if (!hit && sec && CROSS_RE.test(rule.re.source)) hit = rule.re.test(sec + compact);
      } catch (e) {
        hit = false;
      }
      if (!hit) continue;
      let type = rule.type;
      let field = rule.field;
      if (type === 'auto') {
        let hitType = null;
        for (const s of TT.SECTION_TYPE) {
          if (s.re.test(sec)) {
            hitType = s.type;
            break;
          }
        }
        if (!hitType) {
          if (/毕业(时间|日期)/.test(compact)) {
            return { type: 'basic', field: 'graduationDate' };
          }
          // 板块标题没认出来：先记个「待定」，交给 buildEntries 按同一条记录里的
          // 邻居字段（公司名称 / 项目名称…）反推。绝不能一律当教育经历 ——
          // 那样工作/项目经历的时间会去取第 3、4 条教育记录，取不到就整段留空。
          return { type: 'edu', field, auto: true };
        }
        type = hitType;
      }
      return { type, field, auto: false };
    }
    return null;
  }

  /* 只在某一类（如「实习经历」）的规则里匹配，用于选区填入时手动纠正类别 */
  function matchRuleTyped(label, section, type) {
    const compact = norm(label);
    const sec = norm(section);
    for (const rule of TT.RULES) {
      if (rule.section && !rule.section.test(section || '')) continue;
      let hit = false;
      try {
        hit = rule.re.test(compact);
        if (!hit && sec && CROSS_RE.test(rule.re.source)) hit = rule.re.test(sec + compact);
      } catch (e) {
        hit = false;
      }
      if (!hit) continue;
      let t = rule.type;
      if (t === 'auto') {
        for (const s of TT.SECTION_TYPE) {
          if (s.re.test(sec)) {
            t = s.type;
            break;
          }
        }
      }
      if (t !== type) continue;
      return { type: t, field: rule.field };
    }
    return null;
  }

  function semOf(type, field) {
    return TT.SEM_OF[type + '.' + field] || '';
  }

  /* 把 A 类的字段翻译成 B 类里语义相同的字段（实习内容：project.description → intern.description） */
  function mirrorField(fromType, fromField, toType) {
    const sem = semOf(fromType, fromField);
    if (sem && TT.SEM[sem] && TT.SEM[sem][toType]) return TT.SEM[sem][toType];
    return '';
  }

  /* 选区 + 指定类别：把选区里的字段全部按该类别重新归类、重新编号 */
  function remapEntries(entries, type, base) {
    const out = [];
    for (const src of entries) {
      let e = src;
      // 1) 先按语义映射（「组织名称及职务」这种组合字段，用映射才不会被拆成「职务」）
      const nf = e.type === type ? '' : mirrorField(e.type, e.field, type);
      if (nf) {
        e = Object.assign({}, src, { type, field: nf });
        out.push(e);
        continue;
      }
      // 2) 映射不到：用控件自己的标签，在目标类别的规则里重新匹配一次
      let f = null;
      for (const p of e.parts || [e.label]) {
        f = matchRuleTyped(p, e.section, type);
        if (f) break;
      }
      if (f) {
        e = Object.assign({}, src, { type: f.type, field: f.field, label: f.label || e.label });
      } else if (e.type !== type) {
        if (TT.LISTS[type]) continue; // 列表类：认不出来就不填，避免串味
        e = Object.assign({}, src, { type });
      }
      out.push(e);
    }

    // 3) 重新编号：选区里第 1 个经历块对应简历第 base+1 条
    if (TT.LISTS[type]) {
      const isAnchor = (e) => semOf(e.type, e.field) === 'name';
      const blocked = out.map((e) => blockIndexOf(e.el, out));
      if (blocked.some((b) => b) && !out.every((e) => e.type === type)) {
        // 块判定只在纯目标类列表里才可靠，混了别的类就退化成锚点法
      }
      const useBlock = blocked.filter((b) => b).length >= 2 && new Set(blocked.filter(Boolean).map((b) => b.index)).size >= 2;
      if (useBlock) {
        out.forEach((e, i) => {
          e.idx = base + (blocked[i] ? blocked[i].index : 0);
        });
      } else {
        let k = -1;
        for (const e of out) {
          if (e.type === type && isAnchor(e)) k++;
          e.idx = base + Math.max(0, k);
        }
      }
    } else {
      for (const e of out) e.idx = 0;
    }
    return out;
  }

  /* ---------------- 取值 ---------------- */
  // 简历里同一含义可能有几种字段名（start / startDate），取值时互相兜底
  const FIELD_ALIAS = {
    start: ['startDate', 'begin'],
    startDate: ['start', 'begin'],
    end: ['endDate', 'finish'],
    endDate: ['end', 'finish'],
    description: ['desc', 'content', 'detail'],
    desc: ['description', 'content'],
    position: ['role', 'job'],
    role: ['position'],
    supervisor: ['referee'],
    date: ['time'],
    years: ['duration'],
    major: ['profession', 'discipline'],
  };

  /* 老简历里「工作内容+工作成果」常常写成一整段，按段落粗拆，尽量别让这两个框空着 */
  const splitCache = new WeakMap();
  const PARA_ACH = /累计|达到|提升|增长|成功|实现|完成|准确率|零投诉|数百|数千|数倍|以上|指标|获得|\d+\s*%|稳定在|效率/;
  const PARA_DUTY = /^[^，。；,]{2,18}[：:]/;

  function splitDesc(rec, type) {
    const memo = splitCache.get(rec) || {};
    if (memo[type]) return memo[type];
    const ps = String(rec.description || rec.content || '')
      .split(/\r?\n+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const out = { content: '', duty: '', achievement: '' };
    if (ps.length) {
      const content = [ps[0]];
      for (const p of ps.slice(1)) {
        // 「xx：……」这种小标题只有项目经历才拆成「本人职责」，实习里它就是工作内容
        if (type === 'project' && PARA_DUTY.test(p) && !PARA_ACH.test(p)) out.duty += (out.duty ? '\n' : '') + p;
        else if (PARA_ACH.test(p)) out.achievement += (out.achievement ? '\n' : '') + p;
        else content.push(p);
      }
      out.content = content.join('\n');
    }
    memo[type] = out;
    splitCache.set(rec, memo);
    return out;
  }

  function ageOf(birth) {
    if (!birth) return '';
    const b = new Date(String(birth).slice(0, 10));
    if (isNaN(b)) return '';
    const now = new Date();
    let a = now.getFullYear() - b.getFullYear();
    const m = now.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < b.getDate())) a--;
    return String(a);
  }

  function valueFor(profile, type, field, idx) {
    const basic = profile.basic || {};
    const job = profile.job || {};
    const self = profile.self || {};
    if (type === 'basic') {
      if (field === 'age') return ageOf(basic.birth);
      if (field === 'phoneCountry') return '86';
      if (field === 'tel') return basic.tel || '';
      if (field === 'idExpire') return basic.idExpire || '';
      if (field === 'hometown') return basic.hometown || basic.household || '';
      if (field === 'household') return basic.household || basic.hometown || '';
      if (field === 'sourcePlace') return basic.sourcePlace || basic.hometown || '';
      if (field === 'address') return basic.address || basic.currentPlace || '';
      if (field === 'highestEducation') {
        const e0 = (profile.educations || [])[0] || {};
        return basic.highestEducation || e0.education || '';
      }
      return basic[field] == null ? '' : String(basic[field]);
    }
    if (type === 'job') return job[field] == null ? '' : String(job[field]);
    if (type === 'self') return self[field] == null ? '' : String(self[field]);
    if (type === 'extra') {
      const ex = profile.extras || {};
      if (field === 'language') return ex.language || (ex.englishLevel || ex.englishScore ? '英语' : '');
      if (field === 'languageLevel') return ex.languageLevel || '';
      if (field === 'englishLevel') return ex.englishLevel || '';
      if (field === 'englishScore') return ex.englishScore || '';
      if (field === 'computerLevel') return ex.computerLevel || '';
      return ex[field] == null ? '' : String(ex[field]);
    }
    const list = profile[TT.LISTS[type]] || [];
    // 页面上经历块比简历多时，多出来的块留空，别回绕去填第 1 条
    if ((isZhaopin() || isHotjob() || isPhoenix()) && idx >= list.length) return '';
    const rec = list[idx] || {};
    if (type === 'family') {
      if(field === 'occupation') return [rec.company || rec.school,rec.title || rec.position].filter(Boolean).filter((v,i,a)=>a.indexOf(v)===i).join(' / ');
      return rec[field] == null ? '' : String(rec[field]);
    }
    if (type === 'edu') {
      const gpa=String(rec.gpa || '').match(/(\d+(?:\.\d+)?)\s*[/／]\s*(\d+(?:\.\d+)?)/);
      if(field==='gpaMax') return rec.gpaMax || (gpa ? gpa[2] : '');
      if(field==='gpaScore') return rec.gpaScore || (gpa ? gpa[1] : (/^\d+(?:\.\d+)?$/.test(String(rec.gpa||''))?rec.gpa:''));
      if(field==='fullTime') return rec.studyForm ? (/全日制/.test(rec.studyForm) && !/非全日制/.test(rec.studyForm) ? '是':'否') : '';
      if(field==='majorLevel1') return rec.majorLevel1 || (/经济学/.test(rec.major||'') ? '经济学':'');
      if(field==='majorLevel2') return rec.majorLevel2 || (rec.major==='经济学' && /本科/.test(rec.education||'') ? '经济学类':'');
      if(field==='majorLevel3') return rec.majorLevel3 || rec.major || '';
      const find = pattern => {const key=Object.keys(rec).find(k=>pattern.test(String(k).replace(/\s/g,'')) && rec[k]);return key ? rec[key] : '';};
      const counselor = rec.counselorName || rec.counsellorName || rec.counselor || rec.counsellor || find(/辅导员(姓名|名字)?$/);
      const counselorPhone = rec.counselorPhone || rec.counsellorPhone || rec.counselorContact || find(/辅导员.*(联系方式|电话|手机)/);
      if (field === 'supervisorPhone') return rec.supervisorPhone || counselorPhone || '';
      if (field === 'supervisor') return rec.supervisor || counselor || '';
      if (field === 'supervisorRelation' || field === 'supervisorTitle') return rec[field] || (counselor ? '辅导员' : '');
    }
    if (field === 'supervisorContact') return [rec.supervisor || rec.supervisorName, rec.supervisorPhone].filter(Boolean).join(' ');
    if (field === 'departmentPosition') return [rec.department, rec.position].filter(Boolean).filter((v,i,a)=>a.indexOf(v)===i).join(' / ');
    if (field === 'workAchievements') return [valueFor(profile,type,'content',idx), rec.achievement].filter(Boolean).filter((v,i,a)=>a.indexOf(v)===i).join('\n');
    if(type==='cert' && field==='otherName') return rec.otherName || rec.name || '';
    // 组合字段
    if (field === 'orgRole') return [rec.org, rec.role].filter(Boolean).join('｜');
    if (field === 'nameRole') return [rec.name, rec.role].filter(Boolean).join('｜');
    if (field === 'phone') return rec.phone || rec.supervisorPhone || basic.phone || '';
    if (field === 'supervisorPhone') return rec.supervisorPhone || rec.phone || basic.phone || '';
    let v = rec[field];
    if (v == null && field === 'city') v = rec.city || '';
    // 明细字段（工作内容 / 本人职责 / 成果）：老简历只有一整段 description 时按段落拆
    if (v == null && (field === 'content' || field === 'duty' || field === 'achievement')) {
      const sp = splitDesc(rec, type);
      v = sp[field] || '';
    }
    if (v == null && FIELD_ALIAS[field]) {
      for (const a of FIELD_ALIAS[field]) {
        if (rec[a] != null && rec[a] !== '') {
          v = rec[a];
          break;
        }
      }
    }
    // 教育板块兜底：没有学历/学位时用最高学历
    if (type === 'edu' && !v) {
      if (field === 'education') v = (profile.educations && profile.educations[0] && profile.educations[0].education) || basic.highestEducation || '';
      if (field === 'schoolType') v = rec.schoolType || '';
    }
    return v == null ? '' : String(v);
  }

  /* ---------------- 选项匹配 ---------------- */
  const ALIAS = {
    男: ['男', '男性', 'male', 'm'],
    女: ['女', '女性', 'female', 'f'],
    是: ['是', '有', '愿意', '接受', '同意', '可以', '服从', 'yes', 'true'],
    否: ['否', '无', '不愿意', '不接受', '不同意', '不服从', 'no', 'false'],
    团员: ['团员', '共青团员', '中国共产主义青年团团员'],
    党员: ['党员', '中共党员', '中国共产党党员'],
    群众: ['群众', '普通群众'],
    硕士研究生: ['硕士研究生', '硕士', '研究生', '研究生学历', '硕士学位'],
    本科: ['本科', '大学本科', '本科生', '大学本科（学士）'],
    博士研究生: ['博士研究生', '博士', '博士研究生学历'],
    身份证: ['身份证', '居民身份证', '中华人民共和国居民身份证'],
    未婚: ['未婚', '单身'],
    应届毕业生: ['应届毕业生', '应届生', '在校生', '2027届', '2027届毕业生'],
    应届: ['应届', '应届生', '应届毕业生', '在校生'],
    往届: ['往届', '往届生', '非应届'],
    全日制: ['全日制', '普通全日制', '全日制统分统招'],
    86: ['86', '+86', '中国大陆', '大陆', '内地', 'china', 'cn'],
    熟练: ['熟练', '精通', '掌握', '良好', '熟悉'],
  };
  function aliasSet(v) {
    const k = norm(v);
    for (const key in ALIAS) {
      const list = ALIAS[key].map(norm);
      if (list.includes(k) || norm(key) === k) return list;
    }
    return [k];
  }

  function score(optText, value) {
    const o = norm(optText);
    const v = norm(value);
    if (!o || !v) return -1;
    if (o === v) return 100;
    const alts = aliasSet(v);
    if (alts.includes(o)) return 96;
    if (o.length >= 2 && v.length >= 2 && cutAdmin(o) === cutAdmin(v)) return 90;
    if (o.startsWith(v) || v.startsWith(o)) return 80 - Math.abs(o.length - v.length);
    if (o.includes(v)) return 70 - Math.min(25, o.length - v.length);
    if (v.includes(o) && o.length >= 2) return 60 - Math.min(25, v.length - o.length);
    return -1;
  }

  function bestOption(options, value, minScore) {
    let best = null;
    let bestScore = -1;
    for (const o of options) {
      const s = score(o.text, value);
      if (s > bestScore) {
        bestScore = s;
        best = o;
      }
    }
    return bestScore >= (minScore == null ? 40 : minScore) ? best : null;
  }

  /* 选项反推：标签认错（比如「证件类型+证件号码」同一行）时，
     用下拉里实际有哪些选项，判断这个下拉该填简历里的哪个字段 */
  function inferFieldByOptions(texts) {
    const opts = (texts || []).map(norm).filter(Boolean);
    if (opts.length < 2) return null;
    let best = null;
    let bestRatio = 0;
    for (const en of TT.ENUMS || []) {
      const known = en.opts.map(norm);
      let inter = 0;
      for (const t of opts) if (known.indexOf(t) !== -1) inter++;
      if (inter < 2) continue;
      const ratio = inter / opts.length;
      if (ratio >= 0.6 && ratio > bestRatio) {
        bestRatio = ratio;
        best = en;
      }
    }
    return best;
  }
  TT.inferFieldByOptions = inferFieldByOptions;

  /* ---------------- 写入 ---------------- */
  function fire(el, type) {
    el.dispatchEvent(new Event(type, { bubbles: true }));
  }

  function setNativeValue(el, value) {
    const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const desc = Object.getOwnPropertyDescriptor(proto, 'value');
    if (desc && desc.set) desc.set.call(el, value);
    else el.value = value;
    fire(el, 'input');
    fire(el, 'change');
  }

  // 内容本身是不是日期（2000-08-13 / 2020年9月 / 2020.09 等）
  function isDateText(v) {
    const t = String(v == null ? '' : v).trim();
    if (!t) return false;
    if (/^\d{4}\s*[-/.年]\s*\d{1,2}\s*([-/.月]\s*\d{1,2}\s*日?)?$/.test(t)) return true;
    if (/^\d{4}\s*年?\s*\d{1,2}\s*月?$/.test(t)) return true;
    return false;
  }

  // 控件是不是日期类：input[type=date] 或 标签/占位符/类名里有日期关键词
  function looksLikeDateControl(el, label) {
    const t = (el.type || '').toLowerCase();
    if (['date', 'month', 'datetime-local', 'week'].indexOf(t) !== -1) return true;
    const hint = (
      (el.getAttribute('placeholder') || '') + ' ' +
      (el.getAttribute('title') || '') + ' ' +
      (typeof el.className === 'string' ? el.className : '') + ' ' +
      (el.id || '') + ' ' + (label || '')
    ).toLowerCase();
    if (/日期|出生|年月|入学时间|毕业时间|开始时间|结束时间|入职时间|离职时间|获奖时间|获取时间/.test(hint)) return true;
    if (/(^|[^a-z])(datepicker|date-picker|datetime|calendar|birthday)([^a-z]|$)/.test(hint)) return true;
    if (/(^|[^a-z])date([^a-z]|$)/.test(hint)) return true;
    return false;
  }

  /* 控件粒度：month（到月）/ date（到日）/ year（只到年）。
     网申页里同一张表单经常「开始时间到月、出生日期到日」混着来，
     必须先分清，否则给月份控件塞「2024-09-01」、给日期控件只选到月都会判失败。 */
  function granularityOf(el) {
    if (!el) return '';
    const t = (el.type || '').toLowerCase();
    if (t === 'month') return 'month';
    if (t === 'week' || t === 'date' || t === 'datetime-local') return 'date';
    // 组件库通常在包裹层留线索：el-date-editor--month / ant-picker / data-picker="month"
    let n = el;
    for (let i = 0; i < 3 && n; i++, n = n.parentElement) {
      const cls = typeof n.className === 'string' ? n.className : '';
      const attr =
        (n.getAttribute && ((n.getAttribute('data-picker') || '') + ' ' + (n.getAttribute('data-type') || '') + ' ' + (n.getAttribute('data-granularity') || ''))) || '';
      const s = (cls + ' ' + attr).toLowerCase();
      if (s.indexOf('month') >= 0) return 'month';
      if (/year|years/.test(s)) return 'year';
      if (/(^|[^a-z])(day|date|datetime)([^a-z]|$)/.test(s)) return 'date';
    }
    const fmt = ((el.getAttribute && el.getAttribute('data-format')) || '') + ' ' + (el.getAttribute && el.getAttribute('placeholder') || '');
    if (/yyyy\s*[-\/年.]?\s*mm?\s*[-\/月.]?\s*dd|dd\s*[-\/月.]?\s*mm?\s*[-\/年.]?\s*yyyy/i.test(fmt)) return 'date';
    if (/yyyy\s*[-\/年.]?\s*mm?|mm?\s*[-\/年.]?\s*yyyy/i.test(fmt)) return 'month';
    if (/yyyy/i.test(fmt)) return 'year';
    if (/选择月份|请选择月份|月份|年\s*月|月\s*份/.test(fmt)) return 'month';
    return '';
  }

  function dateFor(el, value, gran) {
    const v = String(value).trim();
    if (!v) return '';
    const m = v.match(/^(\d{4})([-/年.]?)(\d{1,2})?([-/月.]?)(\d{1,2})?/);
    if (!m) return v;
    const y = m[1];
    const mo = m[3] ? String(m[3]).padStart(2, '0') : '01';
    const d = m[5] ? String(m[5]).padStart(2, '0') : '01';
    const t = (el.type || '').toLowerCase();
    if (t === 'month') return y + '-' + mo;
    if (t === 'date') return y + '-' + mo + '-' + d;
    if (t === 'datetime-local') return y + '-' + mo + '-' + d + 'T00:00';
    if (t === 'number') return '';
    const ph = (el.placeholder || '') + (el.getAttribute('data-format') || '');
    // 组件类控件：按粒度截断，月份控件不要的日子别塞进去
    const g = gran || granularityOf(el);
    if (g === 'month') return /dd/i.test(ph) ? y + '-' + mo + '-' + d : y + '-' + mo;
    if (g === 'year') return /mm/i.test(ph) ? y + '-' + mo : y;
    if (g === 'date') {
      if (/yyyy\s*[-\/年.]?\s*mm?\s*[-\/月.]?\s*dd/i.test(ph)) return y + '-' + mo + '-' + d;
      if (/yyyy年mm月dd/i.test(ph)) return y + '年' + mo + '月' + d + '日';
    }
    // 文本框：参考已有格式

    if (/yyyy\/mm\/dd/i.test(ph)) return y + '/' + mo + '/' + d;
    if (/yyyy-mm-dd/i.test(ph)) return y + '-' + mo + '-' + d;
    if (/yyyy年mm月/i.test(ph)) return y + '年' + mo + '月';
    if (/yyyy\/mm/i.test(ph)) return y + '/' + mo;
    if (/yyyy-mm/i.test(ph)) return y + '-' + mo;
    if (/yyyy年/i.test(ph)) return y + '年';
    if (t === 'text' || t === '') {
      if (/日期|时间/.test(el.getAttribute('placeholder') || '')) {
        return /\d{1,2}\s*$/.test(v) ? v : y + '-' + mo + '-' + d;
      }
    }
    return v;
  }

  /* React/Vue 组件常常只认完整鼠标事件序列，用原生 click 不生效 */
  function realClick(el) {
    if (!el || !el.dispatchEvent) return;
    try {
      const r = el.getBoundingClientRect();
      const o = {
        bubbles: true, cancelable: true, view: window, button: 0,
        clientX: r.left + r.width / 2, clientY: r.top + r.height / 2,
      };
      for (const t of ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click']) {
        el.dispatchEvent(new MouseEvent(t, o));
      }
    } catch (e) {
      try {
        el.click();
      } catch (e2) {}
    }
  }

  function setSelect(select, value) {
    const usable = [...select.options].filter((o) => !o.disabled && String(o.value) !== '');
    const opts = usable.map((o) => ({
      text: txt(o) || o.textContent || '',
      alt: String(o.getAttribute('value') || ''),
      value: o.value,
      el: o,
    }));
    // 选项文本与 value 都参与打分（很多站点 value 才是中文）
    const pick = (list, v) => {
      let best = null;
      let bestScore = -1;
      for (const o of list) {
        let s = score(o.text, v);
        const alt = norm(o.alt);
        if (alt && alt.length > 1 && !/^\d+$/.test(alt)) s = Math.max(s, score(o.alt, v) - 5);
        if (s > bestScore) {
          bestScore = s;
          best = o;
        }
      }
      return bestScore >= 40 ? best : null;
    };

    let hit = pick(opts, value);
    if (!hit && /^\d{4}/.test(value)) {
      // 年 / 月 分开的下拉
      const parts = String(value).split(/[-/.]/);
      const nameAttr = (select.name || '') + (select.id || '');
      if (/month|月/i.test(nameAttr)) hit = pick(opts, parts[1]);
      else if (/year|年/i.test(nameAttr)) hit = pick(opts, parts[0]);
      else {
        const years = opts.filter((o) => /^\d{4}$/.test(norm(o.text)));
        if (years.length > 3) hit = pick(years, parts[0]);
      }
    }
    if (!hit) return false;
    try {
      const desc = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');
      if (desc && desc.set) desc.set.call(select, hit.value);
      else select.value = hit.value;
    } catch (e) {
      select.value = hit.value;
    }
    fire(select, 'input');
    fire(select, 'change');
    fire(select, 'blur');
    return true;
  }

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  /* ---------- 自定义下拉 / 日期选择器（不依赖具体组件库）---------- */

  /* 弹层识别：一次遍历 body 下所有节点，用类名/角色打分。
     （不用一长串属性选择器 —— 元素一多就慢到不可用） */
  const STRICT_CLS = /(dropdown|popper|popup|popover|cascader|select-?panel|select-?menu|option-?list|listbox|picker-panel|select2-results|autocomplete-suggestion)/i;
  const LOOSE_CLS = /(menu|panel|options|list|suggest|autocomplete|typeahead|match|result|candidate)/i;

  const OPT_SEL = [
    '[role="option"]', '[role="menuitem"]', '[role="treeitem"]', 'li', 'dd',
    '.el-select-dropdown__item', '.ant-select-item-option', '.ivu-select-item', '.arco-select-option',
    '.el-cascader-node', '.ant-cascader-menu-item', '.layui-form-select dd', '.select2-results__option',
    '.n-base-select-option', '.semi-select-option', '.t-select-option',
    '.option', '.item', '.cell', '.select-item',
  ].join(',');

  const PH_RE = /^(请选择|请输入|选择|please|select|-)?$/;

  /* 控件所属的「组件外壳」。
     注意：不能用 el.closest()，Element Plus 的输入框 class 是 el-select__input，
     closest 会返回它自己，导致「点外层容器」和「读显示值」两步全都失效。 */
  function boxOf(el, maxUp) {
    let n = el.parentElement;
    const stop = maxUp || 4;
    for (let i = 0; i < stop && n; i++, n = n.parentElement) {
      if (!n || n === document.body || n === document.documentElement) break;
      const cls = typeof n.className === 'string' ? n.className : '';
      if (!/select|picker|cascader|dropdown|date|calendar|combo|input-group|field/i.test(cls)) continue;
      if (n.querySelectorAll('input,select,textarea').length > 3) continue;
      return n;
    }
    return el.parentElement || el;
  }

  /* 「组件外壳」，用于给同一个下拉去重。
     input 的 class 里常常也带 select/picker 字样（ant-select-selection-search-input），
     所以输入框自己不能当外壳，得往上找到真正的组件容器，否则一个下拉会被当成两个字段。 */
  function shellOf(el) {
    const isField = el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT';
    const cls = typeof el.className === 'string' ? el.className : '';
    if (!isField && /select|picker|dropdown|cascader|combobox/i.test(cls)) return el;
    let n = el.parentElement;
    for (let i = 0; i < 4 && n && n !== document.body && n !== document.documentElement; i++, n = n.parentElement) {
      const c = typeof n.className === 'string' ? n.className : '';
      if (/select|picker|dropdown|cascader|combobox/i.test(c)) return n;
      if (n.getAttribute && n.getAttribute('role') === 'combobox') return n;
    }
    return el.parentElement || el;
  }

  /* 触发器「显示出来的值」= 输入框的值 + 外层容器里能看到的文字。
     选中成功这个串一定会变，用它判断到底有没有真填进去。
     （Element Plus 选中后 input.value 往往是空的，文本在 .el-select__selected-item 里） */
  function shownValue(el) {
    let val = '';
    if ('value' in el && el.value && !/^请选择$/.test(String(el.value))) val = String(el.value);
    const box = boxOf(el, 4);
    const extra = box && box !== el ? txt(box) : '';
    return norm(val + ' ' + extra);
  }

  /* 点开前的整页快照：用来找出「点开之后才出现」的节点。
     这样即使站点用完全自定义的类名（不在任何组件库名单里），弹层也能被认出来。 */
  function snapshotNodes() {
    const s = new Set();
    try {
      for (const n of document.querySelectorAll('body *')) s.add(n);
    } catch (e) {}
    return s;
  }

  /* 打分排序：组件库标准类名 > 刚出现 > 泛化类名；第一个有选项的就是弹层 */
  function popupRoots(trigger, before) {
    const out = [];
    const tr = hasLayout() ? trigger.getBoundingClientRect() : null;
    let nodes;
    try {
      nodes = document.querySelectorAll('body *');
    } catch (e) {
      return [];
    }
    for (const r of nodes) {
      const role = (r.getAttribute && r.getAttribute('role')) || '';
      const cls = typeof r.className === 'string' ? r.className : '';
      const id = r.id || '';
      const strict =
        role === 'listbox' || role === 'menu' || role === 'tree' ||
        (cls && STRICT_CLS.test(cls)) || (id && STRICT_CLS.test(id));
      const loose = (cls && LOOSE_CLS.test(cls)) || (id && LOOSE_CLS.test(id));
      const isFresh = before ? !before.has(r) : false;
      /* 有些组件库的下拉弹层一直躺在 DOM 里（display:none），点开只是显示出来 ——
         这种节点「不是新出现的」，类名又完全不认识，会被下面那道过滤直接扔掉，
         表现就是「点开了却没有选项」。所以再给一条路：浮起来（absolute/fixed）
         且紧贴触发器的容器，即使不是新的也当候选。 */
      let nearBox = false;
      if (tr && !isFresh && !strict && !loose) {
        try {
          const st = getComputedStyle(r);
          if ((st.position === 'absolute' || st.position === 'fixed') && st.display !== 'none') {
            const rr = r.getBoundingClientRect();
            const vert = rr.top >= tr.top - 60 && rr.top <= tr.bottom + 420;
            const horiz = rr.left < tr.right + 120 && rr.right > tr.left - 120;
            nearBox = vert && horiz && r.childElementCount >= 2 && r.querySelectorAll('*').length <= 260;
          }
        } catch (e) {}
      }
      if (!isFresh && !strict && !loose && !nearBox) continue;
      if (r === trigger || r.contains(trigger)) continue; // 整页容器，不是弹层
      if (r.closest && r.closest('#tt-fill-host')) continue; // 自己的面板
      // 弹层里通常不塞一堆表单控件（防止把整个表单区块误当弹层）；
      // 但 Element Plus 2.5+ 的可搜索下拉，搜索框就在弹层里，所以标准类名的弹层要放行
      const inner = r.querySelectorAll('input,select,textarea').length;
      if (inner > (strict || isFresh ? 3 : 1)) continue;
      let near = true;
      if (tr) {
        const rr = r.getBoundingClientRect();
        near = !(
          rr.right < tr.left - 560 || rr.left > tr.right + 560 ||
          rr.bottom < tr.top - 680 || rr.top > tr.bottom + 680
        );
      }
      if (!isFresh && !near) continue;
      /* 泛化类名（menu/list/panel…）又不是点开后新出现的：必须紧贴触发器。
         智联的锚点导航 resume-menu-item__bar 在页面顶部，class 带 menu、
         选项又不是链接（≥3 个 a[href] 的过滤拦不住它），靠距离卡掉它。 */
      if (!isFresh && !strict && !nearBox && tr) {
        const rr2 = r.getBoundingClientRect();
        if (rr2.top < tr.top - 60 || rr2.top > tr.bottom + 320) continue;
      }
      if (!visible(r)) continue;
      /* 智联这类页面右侧有一条「个人信息 / 教育经历 / 实习工作经历…」的锚点导航，
         它的 class 里正好带 menu，被当成下拉弹层时选项会读出「个人信息」，
         然后跑去点导航 —— 结果是「下拉没选上」，看起来像没执行。
         真正的下拉选项几乎不会用带 href 的链接，导航才会。 */
      if (r.querySelectorAll('a[href]').length >= 3) continue;
      out.push({
        el: r,
        score: (strict ? 8 : 0) + (loose ? 2 : 0) + (isFresh ? 4 : 0),
        n: r.childElementCount,
      });
    }
    out.sort((a, b) => b.score - a.score || a.n - b.n);
    return out.map((o) => o.el);
  }

  function optionItems(root, trigger) {
    const out = [];
    const seen = new Set();
    const add = (n) => {
      if (!n || seen.has(n)) return;
      seen.add(n);
      if (n === trigger || n.contains(trigger) || trigger.contains(n)) return;
      if (!visible(n)) return;
      const t = txt(n);
      if (!t || t.length > 80) return;
      if (PH_RE.test(norm(t))) return;
      out.push({ el: n, text: t });
    };
    for (const n of root.querySelectorAll(OPT_SEL)) add(n);
    if (out.length) return out;
    // 兜底：最里层、有短文字的节点（自研组件库常见）
    for (const n of root.querySelectorAll('*')) if (n.children.length === 0) add(n);
    return out;
  }

  function popupOptions(trigger, before) {
    const roots = popupRoots(trigger, before || snapshotNodes());
    for (const r of roots) {
      const items = optionItems(r, trigger);
      if (items.length) return items; // 第一个能读出选项的弹层就够了
    }
    return [];
  }

  /* 点开后等选项渲染出来：很多站点下拉是异步拉数据，150ms 根本不够 */
  async function waitOptions(el, before, maxMs) {
    const limit = maxMs || 1000;
    const t0 = Date.now();
    let opts = popupOptions(el, before);
    while (!opts.length && Date.now() - t0 < limit) {
      await wait(80);
      opts = popupOptions(el, before);
    }
    return opts;
  }

  /* 等到「出现和目标值匹配的候选」再动手。
     智联页面右侧的锚点导航（resume-menu-item__bar）类名带 menu、又不是链接，
     联想框一聚焦它就排在候选前面 —— 抢在真正的候选列表出来之前就把「个人信息」
     当成了选项。所以不能「有选项就返回」，要等「有像选项的选项」。 */
  async function waitMatchOptions(el, before, v, maxMs) {
    const limit = maxMs || 1500;
    const t0 = Date.now();
    let opts = popupOptions(el, before);
    while (Date.now() - t0 < limit) {
      if (opts.length && bestOption(opts.map((o) => ({ text: o.text, el: o.el })), v, 55)) return opts;
      await wait(90);
      opts = popupOptions(el, before);
    }
    return opts;
  }

  /* 点开下拉：先点输入框，不行再点外层容器、再点右侧箭头 */
  async function openPicker(el, before) {
    const snap = before || snapshotNodes();
    const tries = [];
    const box = boxOf(el, 4);
    // 先点组件外壳：只读输入框的 click 也能冒泡上去，但外壳更接近真实点击，
    // 而且后面还要点外壳时不会因为「同一个元素点两次 = toggle」把弹层关掉
    if (box && box !== el) tries.push(box);
    tries.push(el);
    if (box && box !== el) {
      if (box.parentElement && box.parentElement !== document.body) tries.push(box.parentElement);
      const arrow = box.querySelector('[class*="arrow"],[class*="suffix"],[class*="caret"],[class*="icon"],svg');
      if (arrow && arrow !== el) tries.push(arrow);
    }
    for (let i = 0; i < tries.length; i++) {
      realClick(tries[i]);
      await wait(120);
      /* 关键：先判断「弹层有没有出来」，再判断「选项读到没有」。
         智联这类站点的选项是点开之后异步拉的 —— 早先等 900ms 没读到选项，
         就换下一个目标再点一次，反而把刚打开的面板关掉了，最后一路失败。 */
      const opened = popupRoots(el, snap).length > 0;
      const opts = await waitOptions(el, snap, opened ? 2200 : 800);
      if (opts.length) return opts;
      if (opened) break; // 弹层已经开着，只是选项没读出来：别再点，交给键盘兜底
      // 点一下没弹层的普通可写文本框，多半本来就是输入框，别在这儿耗时间
      if (i === 0 && el.tagName === 'INPUT' && !el.readOnly && !box) break;
    }
    return [];
  }

  /* 点一个选项，用「显示值有没有变」判断是否真的选上；没变就换更"重"的点击方式 */
  async function clickOption(trigger, optEl) {
    if (!optEl || !optEl.isConnected) return false;
    const before = shownValue(trigger);
    const want = norm(txt(optEl));
    realClick(optEl);
    await wait(110);
    if (shownValue(trigger) !== before) return true;

    /* 联想输入框：点之前框里已经是刚打进去的关键字，点完 value 一个字都不变，
       「显示值变了」这条对它就永远不成立 —— 改成看「候选列表关掉了」。 */
    if (want && norm(trigger.value) === want) {
      const still = popupOptions(trigger, snapshotNodes()).length > 0;
      if (!still) return true;
    }

    // 有些组件在 mousedown 时记录高亮项，快速 click 反而不触发选中
    try {
      const r = optEl.getBoundingClientRect();
      const o = {
        bubbles: true, cancelable: true, view: window, button: 0,
        clientX: r.left + r.width / 2, clientY: r.top + r.height / 2,
      };
      optEl.dispatchEvent(new MouseEvent('mousedown', o));
      await wait(30);
      optEl.dispatchEvent(new MouseEvent('mouseup', o));
      optEl.dispatchEvent(new MouseEvent('click', o));
      await wait(110);
      if (shownValue(trigger) !== before) return true;
    } catch (e) {}

    // 再试它里面的文字节点
    const inner = optEl.querySelector('span,label,p,em');
    if (inner) {
      realClick(inner);
      await wait(110);
      if (shownValue(trigger) !== before) return true;
    }
    return false;
  }

  /* 「学校名称 / 公司名称 / 专业名称」常常是联想搜索框：
     只把文字写进去、不点候选，站点会当成没填 —— 智联就会直接清空并弹红字
     「请填写学校全称」，看起来像是扩展没生效。写完值后等一下候选列表，点最像的那条。 */
  const SUGGEST_FIELDS = /^(school|company|major|college)$/;

  async function waitSuggest(trigger, before) {
    let opts = popupOptions(trigger, before);
    for (let i = 0; i < 3 && !opts.length; i++) {
      await wait(120);
      opts = popupOptions(trigger, before);
    }
    return opts;
  }

  async function acceptSuggest(el, value, before) {
    const v = String(value || '').trim();
    if (!v) return '';
    const opts = await waitSuggest(el, before);
    if (!opts.length) return '';
    // 只有「选项里确实有和输入值重合的内容」才认为这是补全列表，
    // 否则可能误点旁边恰好开着的下拉菜单
    const hit = bestOption(opts, v, 55);
    if (!hit) return '';
    const t = txt(hit.el);
    if (!t || t.length > 60) return '';
    const ok = await clickOption(el, hit.el);
    await wait(80);
    if (!String(el.value || '').trim()) setNativeValue(el, v);
    return ok ? t : '';
  }

  /* 键盘兜底：输入关键字 -> 下移 -> 回车（可搜索的下拉都认这个） */
  async function keyboardPick(el, v) {
    const before = shownValue(el);
    try {
      el.focus();
    } catch (e) {}
    if (el.tagName === 'INPUT' && !el.readOnly) {
      setNativeValue(el, v);
      await wait(160);
    }
    pressKey(el, 'ArrowDown');
    await wait(90);
    pressKey(el, 'Enter');
    await wait(160);
    if (shownValue(el) !== before) return true;
    pressKey(el, 'Escape');
    return false;
  }

  function pressKey(el, key) {
    const code = key === 'Enter' ? 13 : key === 'Escape' ? 27 : key === 'ArrowDown' ? 40 : 0;
    for (const t of ['keydown', 'keyup']) {
      try {
        el.dispatchEvent(new KeyboardEvent(t, { key, code: key, keyCode: code, which: code, bubbles: true }));
      } catch (e) {}
    }
  }

  function confirmButton() {
    return [...document.querySelectorAll('button,.el-button,.ant-btn,[class*="confirm"],[class*="ok"],[class*="footer"] button')]
      .filter(visible)
      .find((b) => /^(确定|确认|完成|ok|OK)$/.test(txt(b).trim()));
  }

  function splitSegs(v) {
    return String(v)
      .split(/(?:特别行政区|维吾尔自治区|壮族自治区|回族自治区|自治区|自治州|地区|省|市|区|县|旗)/)
      .map((s) => s.trim())
      .filter((s) => s && s.length >= 2);
  }

  function rankOptions(opts, v) {
    return opts
      .map((o) => ({ o, s: score(o.text, v) }))
      .filter((x) => x.s >= 40)
      .sort((a, b) => b.s - a.s)
      .map((x) => x.o);
  }

  /* 联想输入框：长着下拉的样子（role=combobox / aria-haspopup），但候选要先把字打进去才出来。
     智联的「学校名称」、猎聘的「公司名称」都是这种。 */
  function isSuggestInput(el) {
    if (!el || el.tagName !== 'INPUT' || el.readOnly) return false;
    const t = (el.type || '').toLowerCase();
    if (t && t !== 'text' && t !== 'search') return false;
    const ac = (el.getAttribute('aria-autocomplete') || '').toLowerCase();
    const role = (el.getAttribute('role') || '').toLowerCase();
    const pop = (el.getAttribute('aria-haspopup') || '').toLowerCase();
    if (ac === 'list' || ac === 'both' || pop === 'listbox') return true;
    if (role === 'combobox' && (ac || pop)) return true;
    // 被 el-autocomplete / -suggest 容器包着的输入框（智联的「学校名称」「专业」）
    let n = el;
    for (let i = 0; i < 3 && n; i++, n = n.parentElement) {
      const c = typeof n.className === 'string' ? n.className : '';
      if (/autocomplete|suggest/i.test(c)) return true;
    }
    return false;
  }

  /* 可搜索下拉（Element Plus 2.5+ 把搜索框放在弹层顶部 / antd 的 filterable）：
     先把关键字输进去，列表从几百条缩到几条，再点就不会点错。
     返回 'popup'（弹层里的搜索框）/ 'self'（主输入框本身可写）/ ''（没有可输入的地方） */
  async function typeToFilter(el, v) {
    if (isZhaopin()) {
      // Never search the page for another writable input: that was the school field.
      if (el.readOnly || !/^(INPUT|TEXTAREA)$/.test(el.tagName)) return '';
      el.focus(); setNativeValue(el, v); await wait(240); return 'self';
    }
    const roots = popupRoots(el, snapshotNodes());
    for (const r of roots) {
      const inp = [...r.querySelectorAll('input')].find(
        (i) => i !== el && i.type !== 'hidden' && !i.readOnly && visible(i)
      );
      if (inp) {
        try {
          inp.focus();
          setNativeValue(inp, v);
          fire(inp, 'input');
          fire(inp, 'keyup');
        } catch (e) {}
        await wait(240);
        return 'popup';
      }
    }
    if (el.tagName === 'INPUT' && !el.readOnly) {
      try {
        el.focus();
        setNativeValue(el, v);
        fire(el, 'input');
        fire(el, 'keyup');
      } catch (e) {}
      await wait(240);
      return 'self';
    }
    return '';
  }

  /* 点开 -> 等选项 -> 选 -> 校验 -> 没成就换策略重试
     返回 { ok, debug }，debug 会进「填写记录」，方便定位是哪一步没成 */
  const confirmedZhaopin = new WeakMap();
  async function fillZhaopinElement(el, value, label) {
    const v = String(value).trim();
    const debug = {label, strategies:['智联组件内隔离填写']};
    const select = el.closest('.el-select');
    const autocomplete = el.closest('.el-autocomplete');
    if (select && el.readOnly) {
      if (aliasSet(v).includes(norm(el.value))) return {ok:true, debug};
      let popup = select.querySelector('.el-select-dropdown');
      el.click();
      for (let i=0;i<20;i++) {
        popup = popup || select.querySelector('.el-select-dropdown');
        const options = popup ? [...popup.querySelectorAll('.el-select-dropdown__item,[role="option"]')].filter(n=>visible(n) && !n.matches('.is-disabled,[aria-disabled="true"]')) : [];
        const hit = options.find(n=>aliasSet(v).includes(norm(txt(n))));
        if (hit) {realClick(hit); await wait(150); el.blur(); return {ok:aliasSet(v).includes(norm(el.value)),debug};}
        await wait(80);
      }
      pressKey(el,'Escape'); return {ok:false,debug};
    }
    if (autocomplete && !el.readOnly) {
      if (confirmedZhaopin.get(el) === v && norm(el.value) === norm(v)) return {ok:true,debug};
      el.focus();
      const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;
      setter.call(el,v); fire(el,'input');
      const owned = autocomplete.getAttribute('aria-owns');
      for (let i=0;i<50;i++) {
        const list = (owned && document.getElementById(owned)) || autocomplete.querySelector('[role="listbox"],.el-autocomplete-suggestion__list');
        const options = list ? [...list.querySelectorAll('li,[role="option"]')].filter(visible) : [];
        const hit = options.find(n=>norm(txt(n))===norm(v));
        if (hit) {realClick(hit); await wait(150); el.blur(); await wait(180); const ok=norm(el.value)===norm(v);if(ok)confirmedZhaopin.set(el,v);return {ok,debug};}
        await wait(80);
      }
      el.blur(); await wait(200);
      const error = el.closest('.el-form-item')?.querySelector('.el-form-item__error');
      return {ok: !/学校|院校/.test(label || '') && norm(el.value)===norm(v) && !(error && visible(error)),debug};
    }
    return null;
  }



  function phoenixDisplay(el) {
    const select=el.closest('.phoenix-select');
    if(!select) return '';
    return txt(select.querySelector('.phoenix-select__tipEle')) || txt(select.querySelector('.phoenix-select__singleValue')) || txt(select.querySelector('.phoenix-select__placeHolder:not(.phoenix-select__placeHolder--show)'));
  }
  function phoenixLayer(selector) {return [...document.querySelectorAll(selector)].filter(n=>!concealed(n) && visible(n)).at(-1);}
  async function fillPhoenixDate(el,value,label) {
    const target=String(value).match(/^(\d{4})[-/.](\d{1,2})(?:[-/.](\d{1,2}))?/);
    if(!target) return false;
    const y=+target[1],m=+target[2],d=+(target[3]||1);
    const display=digitsOf(phoenixDisplay(el));
    // Even when the input holds typed text, only the committed display counts.
    if(display===digitsOf(value)) return true;
    el.scrollIntoView?.({block:'center',behavior:'instant'});
    realClick(el);await wait(220);
    let panel=phoenixLayer('.phoenix-date-picker');if(!panel)return false;
    const monthOnly=!!panel.querySelector('.phoenix-calendar-month-calendar');
    const yearText=()=>txt(panel.querySelector(monthOnly?'.phoenix-calendar-month-panel-year-select-content':'.phoenix-calendar-year-select'));
    for(let i=0;i<100;i++) {
      const current=Number((yearText().match(/\d{4}/)||[])[0]);
      if(current===y)break;if(!current)return false;
      const btn=panel.querySelector(monthOnly?`.phoenix-calendar-month-panel-${current>y?'prev':'next'}-year-btn`:`.phoenix-calendar-${current>y?'prev':'next'}-year-btn`);
      if(!btn)return false;realClick(btn);await wait(70);panel=phoenixLayer('.phoenix-date-picker')||panel;
    }
    if(!yearText().includes(String(y)))return false;
    if(monthOnly) {
      const cell=[...panel.querySelectorAll('.phoenix-calendar-month-panel-month')].find(n=>txt(n)===m+'月' && !n.closest('[class*="disabled"]'));
      if(!cell)return false;realClick(cell);
    } else {
      for(let i=0;i<12;i++) {
        const current=Number((txt(panel.querySelector('.phoenix-calendar-month-select')).match(/\d+/)||[])[0]);
        if(current===m)break;if(!current)return false;
        const btn=panel.querySelector(`.phoenix-calendar-${current>m?'prev':'next'}-month-btn`);if(!btn)return false;
        realClick(btn);await wait(70);panel=phoenixLayer('.phoenix-date-picker')||panel;
      }
      const cell=[...panel.querySelectorAll('.phoenix-calendar-cell')].find(n=>!/(last-month|next-month|disabled)/.test(n.className) && Number(txt(n))===d);
      if(!cell)return false;realClick(cell.querySelector('a')||cell);
    }
    await wait(160);el.blur();await wait(100);
    const expected=String(y)+String(m).padStart(2,'0')+(monthOnly?'':String(d).padStart(2,'0'));
    return digitsOf(phoenixDisplay(el))===expected;
  }
  async function fillPhoenixPicker(el,value,label) {
    const debug={label,strategies:['phoenix-confirmed-selection']};
    const shown=phoenixDisplay(el);const wanted=String(value).trim();
    if(aliasSet(wanted).includes(norm(shown)))return {ok:true,debug};
    el.scrollIntoView?.({block:'center',behavior:'instant'});
    realClick(el);await wait(240);
    let layer;
    for(let i=0;i<15;i++) {layer=phoenixLayer('.constant-main-selector-container,.area-selector-container,.phoenix-selectList');if(layer)break;await wait(80);}
    if(!layer){debug.strategies.push('no-layer');return {ok:false,debug};}
    if(layer.matches('.phoenix-selectList')) {
      const options=()=>{layer=phoenixLayer('.phoenix-selectList')||layer;return [...layer.querySelectorAll('.phoenix-selectList__listItem')].filter(n=>!concealed(n) && !/disabled/.test(n.className));};
      const match=n=>aliasSet(wanted).includes(norm(txt(n))) || (label==='奖励级别' && norm(txt(n)).replace(/^取得/,'').replace(/荣誉奖励$/,'')===norm(wanted));
      let hit=options().find(match);
      if(!hit) {
        const search=layer.querySelector('input');
        if(search) {setNativeValue(search,wanted);for(let i=0;i<20;i++){await wait(100);hit=options().find(match);if(hit)break;}}
      }
      let otherCertificate=false;
      if(!hit && label==='资格证书名称') {
        const search=layer.querySelector('input');
        if(search) {setNativeValue(search,'其他');await wait(240);hit=options().find(n=>/^(其他|其他（自填）|其他\(自填\))$/.test(txt(n)));otherCertificate=!!hit;}
      }
      if(!hit) {pressKey(el,'Escape');el.blur();debug.strategies.push('no-exact-list-option');return {ok:false,debug};}
      realClick(hit);await wait(200);el.blur();await wait(100);
      const current=phoenixDisplay(el) || el.value;
      return {ok:(otherCertificate && /其他/.test(current)) || aliasSet(wanted).includes(norm(current)) || (label==='奖励级别' && norm(current).replace(/^取得/,'').replace(/荣誉奖励$/,'')===norm(wanted)),debug};
    }

    const isRegion=/籍贯|户口所在地|现居住地|工作城市/.test(label);
    const v=isRegion?String(value).split(/[、,，;；]/)[0]:wanted;
    const clean=t=>cutAdmin(norm(t));
    const regionKey=t=>norm(t).replace(/[\/＞>]/g,'').replace(/特别行政区|维吾尔自治区|壮族自治区|回族自治区|自治区|省|市|区|县/g,'');
    const candidates=()=>{layer=phoenixLayer('.constant-main-selector-container,.area-selector-container')||layer;return [...layer.querySelectorAll('.list-item-container,.area-item-container')].filter(n=>!concealed(n));};
    const hitOf=()=>candidates().find(n=>{const labelText=txt(n.querySelector('.item-text-label,.area-text-label')) || txt(n);return aliasSet(v).includes(norm(labelText)) || (isRegion && clean(labelText)===clean(v));});
    let hit=hitOf();
    if(!hit) {
      const search=layer.querySelector('input[placeholder="搜索"]');
      if(search) {
        const query=isRegion?v.split(/[\/]/).filter(Boolean).at(-1).replace(/^.*?(?:省|自治区)/,'').replace(/^.*?市(?=.+[区县])/,''):v;
        search.focus();setNativeValue(search,query);
        for(let i=0;i<20;i++) {await wait(100);hit=hitOf();if(hit)break;}
        // Regional search results include a complete administrative path.
        if(!hit && isRegion) {
          const leaf=clean(query);const matches=candidates().filter(n=>{
            const name=txt(n.querySelector('.area-item-name')) || txt(n).split(/[\/＞>]/).at(-1);
            const path=txt(n.querySelector('.area-item-path'));
            return clean(name)===leaf && (!path || regionKey(v).includes(regionKey(path)) || regionKey(v)===regionKey(name));
          });
          if(matches.length===1)hit=matches[0];
        }
      }
    }
    if(!hit) {
      const cancel=[...layer.querySelectorAll('.phoenix-button')].find(n=>txt(n)==='取消');if(cancel)realClick(cancel.querySelector('.phoenix-button__wraper')||cancel);
      debug.strategies.push('no-candidate');
      return {ok:false,debug};
    }
    if(!hit.querySelector('.RadioChecked,.CheckboxChecked,[class*="RadioChecked"],[class*="CheckboxChecked"]') && !/selected|checked/.test(hit.className))realClick(hit.querySelector('.icon-container')||hit.querySelector('.item-text-label,.area-item-name')||hit);
    await wait(100);
    const confirm=[...layer.querySelectorAll('.phoenix-button')].find(n=>txt(n)==='确定');
    if(confirm)realClick(confirm.querySelector('.phoenix-button__wraper')||confirm);await wait(260);el.blur();
    const now=phoenixDisplay(el);
    return {ok:aliasSet(v).includes(norm(now)) || (isRegion && (regionKey(now).includes(regionKey(v)) || regionKey(v).endsWith(regionKey(now)) && regionKey(now).length>=2)),debug};
  }

  async function fillHotjob(el,value,label) {
    const v=String(value).trim();
    const debug={label,strategies:['hotjob-isolated']};
    const fail=()=>({ok:false,debug});
    const major=/专业/.test(label || el.placeholder || '');
    const matches=text=>norm(text)===norm(v) || (major && norm(String(text).replace(/[（(][^（）()]*[）)]\s*$/,''))===norm(v));
    const exact=(nodes)=>{
      const items=[...nodes].filter(n=>!concealed(n));
      const strict=items.find(n=>norm(txt(n))===norm(v));
      if(strict) return strict;
      const qualified=items.filter(n=>matches(txt(n)));
      return qualified.length===1 ? qualified[0] : null;
    };
    const modalInput=/^(请选择学校|请选择毕业院校|请选择专业)$/.test(el.placeholder || '');
    if (modalInput) {
      if (matches(el.value)) return {ok:true,debug};
      realClick(el);
      let modal;
      for(let i=0;i<20;i++) {
        modal=[...document.querySelectorAll('.ant-modal')].find(n=>!concealed(n) && n.querySelector('.school-form'));
        if(modal) break; await wait(100);
      }
      if(!modal) return fail();
      const search=modal.querySelector('input[placeholder="请输入学校名称"],input[placeholder="请输入专业名称"]');
      if(!search) return fail();
      search.focus();setNativeValue(search,v);
      let hit;
      for(let i=0;i<35;i++) {
        hit=exact(modal.querySelectorAll('.school-item,.major-item,.profession-item'));
        // Search result class varies by schema; only exact leaf candidates inside this modal.
        if(!hit) hit=exact([...modal.querySelectorAll('.school-list span,.subject-wrap span,.subject-wrap .subject-item,.major-list span,.major-list div')].filter(n=>!n.children.length));
        if(hit) break; await wait(120);
      }
      if(!hit) {
        debug.strategies.push('no-exact-candidate');
        const cancel=[...modal.querySelectorAll('button')].find(n=>norm(txt(n))==='取消');
        if(cancel) realClick(cancel);
        return fail();
      }
      realClick(hit);await wait(150);
      const confirm=[...modal.querySelectorAll('.ant-modal-footer button')].find(n=>norm(txt(n))==='选择');
      if(confirm) realClick(confirm);
      await wait(200);
      return {ok:matches(el.value),debug};
    }
    const select=el.closest('.ant-select');
    if(!select) return null;
    const selected=select.querySelector('.ant-select-selection-selected-value');
    if(selected && aliasSet(v).includes(norm(txt(selected)))) return {ok:true,debug};
    const trigger=select.querySelector('[role="combobox"]') || el;
    realClick(trigger);await wait(150);
    const id=trigger.getAttribute('aria-controls') || trigger.getAttribute('aria-owns');
    let popup=id && document.getElementById(id);
    if(!popup || concealed(popup)) popup=[...document.querySelectorAll('.ant-select-dropdown')].find(n=>!concealed(n));
    if(!popup) return fail();
    const wanted=aliasSet(v);
    const hit=[...popup.querySelectorAll('[role="option"],.ant-select-dropdown-menu-item')].find(n=>!concealed(n) && !n.classList.contains('ant-select-dropdown-menu-item-disabled') && (wanted.includes(norm(txt(n))) || cutAdmin(norm(txt(n)))===cutAdmin(norm(v))));
    if(!hit) {pressKey(trigger,'Escape');return fail();}
    realClick(hit);await wait(160);
    const now=select.querySelector('.ant-select-selection-selected-value');
    return {ok:!!now && (wanted.includes(norm(txt(now))) || cutAdmin(norm(txt(now)))===cutAdmin(norm(v))),debug};
  }

  async function fillPicker(el, value, label) {
    if(isPhoenix() && el.closest(".phoenix-select")) return fillPhoenixPicker(el,value,label);
    if (isHotjob()) {
      const result=await fillHotjob(el,value,label);
      if (result) return result;
    }
    if (isZhaopin() || isModern51()) {
      const isolated = await fillZhaopinElement(el,value,label);
      if (isolated) return isolated;
    }
    const v = String(value).trim();
    const debug = { label, value: v, strategies: [], options: 0, sample: [], popupClass: [] };
    if (!v) return { ok: false, debug };

    let snap = snapshotNodes();
    // 联想输入框（role=combobox + aria-autocomplete）：候选要打了字才出来，
    // 先点一下再等一秒是白等，直接把关键字输进去。
    let opts = [];
    if (isSuggestInput(el)) {
      await typeToFilter(el, v);
      await wait(280);
      opts = await waitMatchOptions(el, snap, v, 1600);
      debug.strategies.push('联想框先输入:' + opts.length);
    } else {
      opts = await openPicker(el, snap);
    }
    debug.options = opts.length;
    debug.sample = opts.slice(0, 6).map((o) => o.text);
    debug.popupClass = popupRoots(el, snap)
      .map((r) => String((r.className || r.id || r.tagName) + '').slice(0, 40))
      .slice(0, 4);

    if (!opts.length) {
      debug.strategies.push('未弹出选项');
      // 点开的是日历面板（点错了控件类型）：换日期流程再来一遍，别当成「下拉没选项」放弃
      if (findDatePanel(el) && isDateText(v)) {
        debug.strategies.push('改走日历面板');
        pressKey(el, 'Escape');
        await wait(60);
        if (await fillDatePicker(el, v, label || '')) return { ok: true, debug };
      }
      /* 联想输入型控件：长得像下拉（role=combobox），但候选要先把字打进去才出来。
         智联的「学校名称」就是这种 —— 不点候选，站点会判成没填并清空。 */
      if (el.tagName === 'INPUT' && !el.readOnly) {
        const how = await typeToFilter(el, v);
        if (how) {
          await wait(320);
          const again = await waitMatchOptions(el, snap, v, 1600);
          debug.strategies.push('输入关键字后候选:' + again.length);
          if (again.length) {
            const hit = bestOption(again.map((o) => ({ text: o.text, el: o.el })), v, 55);
            if (hit) {
              realClick(hit.el);
              await wait(150);
              /* 这里不能用 clickOption 的「显示值变了才算成功」：
                 输入框里本来就是刚打进去的关键字，点完候选 value 可能一个字都不变。
                 改成看「候选列表关掉了」或者「值正好等于候选文本」。 */
              const gone = !popupOptions(el, snap).length;
              const now = String(el.value || '').trim();
              if (gone || (now && norm(now) === norm(hit.text))) {
                if (!now) setNativeValue(el, v);
                debug.strategies.push('联想点选:' + hit.text + '✓');
                return { ok: true, debug };
              }
              debug.strategies.push('联想点选:' + hit.text + '✗');
            }
            opts = again; // 没点成就交给后面的常规流程
          }
        }
      }
      if (!opts.length) {
        if (await keyboardPick(el, v)) {
          debug.strategies.push('键盘选中');
          return { ok: true, debug };
        }
        return { ok: false, debug };
      }
    }

    // 0) 可搜索下拉：关键字先输进去过滤（选项几百条时，不搜索根本点不准）
    const exact0 = opts.some((o) => norm(o.text) === norm(v));
    if (!exact0 && opts.length > 3) {
      const how = await typeToFilter(el, v);
      if (how) {
        let filtered = popupOptions(el);
        debug.strategies.push('搜索(' + how + '):' + filtered.length);
        if (!filtered.length || !bestOption(filtered.map((o) => ({ text: o.text, el: o.el })), v, 55)) {
          // 远程搜索（remote-method）要发请求，多等一会儿
          const better = await waitMatchOptions(el, snapshotNodes(), v, 1200);
          if (better.length) filtered = better;
        }
        if (filtered.length) opts = filtered;
        else {
          // 搜索把列表清空了：清掉关键字恢复原列表，别让后面的点选扑空
          await typeToFilter(el, '');
          const back = popupOptions(el);
          if (back.length) opts = back;
        }
      }
    }

    // 1) 级联（省 / 市 / 区）：逐级点，不然只会选中「江西省」就收工
    const segs = splitSegs(v);
    const exact = opts.some((o) => norm(o.text) === norm(v));
    if (!exact && segs.length > 1) {
      let clicked = 0;
      for (const seg of segs) {
        const cur = popupOptions(el, snap);
        if (!cur.length) break;
        const pick = bestOption(cur.map((o) => ({ text: o.text, el: o.el })), seg);
        if (!pick) break;
        const okClick = await clickOption(el, pick.el);
        clicked++;
        debug.strategies.push('级联:' + seg + (okClick ? '✓' : '·'));
        await wait(150);
      }
      const btn = confirmButton();
      if (btn) {
        realClick(btn);
        await wait(160);
      }
      const now = shownValue(el);
      if (clicked > 0 && (now.includes(norm(v)) || now.includes(norm(segs[segs.length - 1])))) {
        return { ok: true, debug };
      }
      pressKey(el, 'Escape');
      // 级联没成，退回单选再试
      snap = snapshotNodes();
      opts = await openPicker(el, snap);
      if (!opts.length) opts = await openPicker(el, snapshotNodes());
    }

    // 2) 单选：按相似度从高到低试，点到「显示值变了」为止；失败就重新点开再试下一个
    const tried = new Set();
    let guard = 0;
    while (guard++ < 4) {
      const cands = rankOptions(opts, v).filter((c) => !tried.has(norm(c.text)));
      if (!cands.length) break;
      const c = cands[0];
      tried.add(norm(c.text));
      if (await clickOption(el, c.el)) {
        debug.strategies.push('点选:' + c.text + '✓');
        return { ok: true, debug };
      }
      debug.strategies.push('点选:' + c.text + '✗');
      snap = snapshotNodes();
      opts = await openPicker(el, snap);
      if (!opts.length) break;
    }

    // 3) 键盘兜底
    if (await keyboardPick(el, v)) {
      debug.strategies.push('键盘选中');
      return { ok: true, debug };
    }
    pressKey(el, 'Escape');
    return { ok: false, debug };
  }

  /* ---------------- 日期 / 月份选择器 ---------------- */
  const digitsOf = (t) => String(t == null ? '' : t).replace(/\D/g, '');

  /* 页面上显示的值是不是已经是这个日期（兼容 2023-11 / 2023年11月 / 2023/11/01） */
  function dateShown(el, text) {
    const shown = digitsOf(shownValue(el));
    const t = digitsOf(text);
    if (!t) return false;
    if (shown.includes(t)) return true;
    // 月份选择器只显示到「年-月」
    if (t.length >= 6 && shown.includes(t.slice(0, 6))) return true;
    return false;
  }

  function findDatePanel(el) {
    const roots = popupRoots(el, snapshotNodes());
    // 必须是「能装下表格/格子」的容器：
    // 否则面板里的箭头按钮（class 也带 el-picker-panel__icon-btn）会被误当成面板
    const holder = (r) => !!r.querySelector('table, [class*="table"], [class*="cell"], [class*="day"], [class*="month"]');
    const outer = (list) => list.filter((r) => !list.some((o) => o !== r && o.contains(r)));
    const named = roots.filter((r) => {
      const cls = String((r.className || '') + ' ' + (r.id || ''));
      return /picker-panel|date-picker|datepicker|calendar|date-panel|picker-dropdown/i.test(cls) && holder(r);
    });
    // 取最外层（面板的 header 在 body 外面，年份导航必须从最外层开始找）
    if (named.length) return outer(named)[0];
    const any = roots.filter(holder);
    return any.length ? outer(any)[0] : null;
  }

  /* 面板头部显示的年份 / 月份。
     注意 header 常常是「2026 年 10 月」一整串，长度限制别设太死。 */
  function panelYear(panel) {
    for (const n of panel.querySelectorAll('*')) {
      if (n.children.length) continue;
      const t = txt(n).trim();
      if (!t || t.length > 24) continue;
      const m = t.match(/(\d{4})\s*年/);
      if (m) return Number(m[1]);
    }
    for (const n of panel.querySelectorAll('*')) {
      if (n.children.length) continue;
      const t = txt(n).trim();
      if (/^\d{4}$/.test(t)) return Number(t);
    }
    return 0;
  }

  function panelMonth(panel) {
    for (const n of panel.querySelectorAll('*')) {
      if (n.children.length) continue;
      const t = txt(n).trim();
      if (!t || t.length > 24) continue;
      const m = t.match(/(\d{1,2})\s*月/);
      if (m) return Number(m[1]);
    }
    return 0;
  }

  /* ---- 面板导航：月份面板的箭头切「年」，日期面板的箭头切「月」，两种不能混着来 ---- */
  const CN_MONTH = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10, 十一: 11, 十二: 12 };
  const cnNum = (s) => (s && CN_MONTH[s] != null ? CN_MONTH[s] : Number(s));

  /* 面板里所有可点的「格子」 */
  function panelCells(panel) {
    const out = [];
    for (const n of panel.querySelectorAll('td,[class*="cell"],[class*="month"],[class*="day"],[class*="year"]')) {
      if (!visible(n)) continue;
      if (n.querySelector('td')) continue;
      out.push(n);
    }
    if (!out.length) {
      for (const n of panel.querySelectorAll('*')) {
        if (!visible(n) || n.children.length) continue;
        const t = txt(n).trim();
        if (t && t.length <= 6) out.push(n);
      }
    }
    return out;
  }

  /* 面板到底是「选到年 / 选到月 / 选到日」——面板内容比控件类名更可信 */
  function panelView(panel) {
    const has = (s) => !!panel.querySelector(s);
    const monthT = has('[class*="month-table"],[class*="month-panel"]');
    const dateT = has('[class*="date-table"],[class*="day-table"],[class*="date-panel"]');
    const yearT = has('[class*="year-table"],[class*="year-panel"]');
    if (monthT && !dateT) return 'month';
    if (dateT && !monthT) return 'date';
    if (yearT && !monthT && !dateT) return 'year';
    if (monthT && dateT) return 'date';
    const texts = panelCells(panel).map((c) => txt(c).trim());
    const months = texts.filter((t) => /^\d{1,2}\s*月$/.test(t) || /^[一二三四五六七八九十]{1,3}\s*月$/.test(t)).length;
    const days = texts.filter((t) => /^\d{1,2}$/.test(t) && +t >= 1 && +t <= 31).length;
    const years = texts.filter((t) => /^\d{4}$/.test(t)).length;
    if (months >= 6) return 'month';
    if (days >= 20) return 'date';
    if (years >= 6 && !days && !months) return 'year';
    if (months && !days) return 'month';
    if (days && !months) return 'date';
    if (years && !days && !months) return 'year';
    return '';
  }

  /* 面板头部的年份 / 月份（兼容「2026 年 10 月」、「十月」） */
  function panelYear(panel) {
    const leaves = [...panel.querySelectorAll('*')].filter((n) => !n.children.length);
    for (const n of leaves) {
      const t = txt(n).trim();
      if (!t || t.length > 24) continue;
      const m = t.match(/(\d{4})\s*年/);
      if (m) return Number(m[1]);
    }
    for (const n of leaves) {
      const t = txt(n).trim();
      if (/^\d{4}$/.test(t)) return Number(t);
    }
    return 0;
  }

  function panelMonth(panel) {
    const leaves = [...panel.querySelectorAll('*')].filter((n) => !n.children.length);
    for (const n of leaves) {
      const t = txt(n).trim();
      if (!t || t.length > 24) continue;
      const m = t.match(/(\d{1,2})\s*月/) || t.match(/([一二三四五六七八九十]{1,3})\s*月/);
      if (m) return cnNum(m[1]);
    }
    return 0;
  }

  /* 面板当前停在哪。统一换算成「月」：
     日期视图精确到「年*12+月」（这样「挪一个月」= ±1，「跳一年」= ±12，一眼能分辨）；
     年/月视图只要年*12。 */
  function navState(panel, view) {
    const y = panelYear(panel);
    if (!y) return 0;
    if (view === 'year') return y;
    return view === 'date' ? y * 12 + (panelMonth(panel) || 1) : y * 12;
  }

  /* 头部的「上一个 / 下一个」按钮候选：先按类名/箭头符号猜，猜不中就全试一遍 */
  function navCandidates(panel, dir) {
    const re = dir === 'prev'
      ? /(prev|left|back|before|sub|minus|reduce|上一|前一)/i
      : /(next|right|forward|after|add|plus|increase|下一|后一)/i;
    const zone =
      panel.querySelector('[class*="header"],[class*="nav"],[class*="toolbar"],[class*="top"]') || panel;
    // 自研组件库常拿 <span> / <a> 当箭头，所以头部区域里放宽到所有可点的小元素
    const pick = (root, wide) =>
      [...root.querySelectorAll(
        wide
          ? 'button,[role="button"],[class*="btn"],[class*="arrow"],[class*="icon"],[class*="nav"],span,a,i,b'
          : 'button,[role="button"],[class*="btn"],[class*="arrow"],[class*="icon"],[class*="nav"]'
      )].filter((b) => visible(b) && !b.disabled);
    let all = pick(zone, true);
    if (all.length < 2) all = pick(panel, false);
    const hit = all.filter((b) => {
      const cls = typeof b.className === 'string' ? b.className : '';
      const t = txt(b);
      return (
        re.test(cls) ||
        re.test(b.getAttribute('aria-label') || '') ||
        re.test(b.getAttribute('title') || '') ||
        (dir === 'prev' && /[«‹<←]/.test(t)) ||
        (dir === 'next' && /[»›>→]/.test(t))
      );
    });
    return hit.concat(all.filter((b) => hit.indexOf(b) === -1));
  }

  /* 翻错了就翻回原处。有些组件把左右箭头写反（class="next" 其实是上一年），
     所以不能按名字猜，必须「点了看结果、不对再换回来」。 */
  async function restoreNav(panel, el, view, before, skip, backDir) {
    for (let round = 0; round < 4; round++) {
      const pref = navCandidates(panel, backDir);
      const other = navCandidates(panel, backDir === 'prev' ? 'next' : 'prev');
      const cands = [...new Set(pref.concat(other))];
      const order = cands.filter((b) => b !== skip).concat(cands.filter((b) => b === skip));
      let any = false;
      for (const b of order) {
        realClick(b);
        await wait(90);
        panel = findDatePanel(el) || panel;
        if (navState(panel, view) === before) return { panel, ok: true };
        any = true;
      }
      if (!any) break;
    }
    return { panel, ok: false };
  }

  const YEAR_JUMP_RE = /(d-?arrow|super|double|year|fast|jump)/i;

  /* 往某个方向翻一格。
     wantYear=true 时优先用「跳一年」的按钮（« » / d-arrow / super-prev），
     否则 26 年前的出生日期得按月点 300 多次。 */
  async function stepNav(panel, el, dir, view, wantYear) {
    const before = navState(panel, view);
    const y0 = panelYear(panel);
    let cands = navCandidates(panel, dir);
    // 要跳一年时优先 «» / d-arrow；只想挪一个月时正好相反，别拿跳年按钮当挪月用
    const score = (b) => {
      const cls = typeof b.className === 'string' ? b.className : '';
      const t = txt(b);
      let s = 0;
      if (YEAR_JUMP_RE.test(cls) || /[«»]/.test(t)) s += wantYear ? 4 : -4;
      if (dir === 'prev' && /(prev|left|back|sub|minus|reduce)/i.test(cls)) s += 2;
      if (dir === 'next' && /(next|right|forward|add|plus|increase)/i.test(cls)) s += 2;
      if (dir === 'prev' && /[«‹<←]/.test(t)) s += 1;
      if (dir === 'next' && /[»›>→]/.test(t)) s += 1;
      return s;
    };
    cands = cands.slice().sort((a, b) => score(b) - score(a));
    for (const b of cands) {
      realClick(b);
      await wait(110);
      let np = findDatePanel(el) || panel;
      const after = navState(np, view);
      if (after && before && after !== before) {
        const forward = after > before;
        const rightDir = (dir === 'next') === forward;
        // 一步跨了多大：±1 是「挪一个月」，±12 是「跳一年」，别拿跳年当挪月用
        const size = Math.abs(after - before);
        const sizeOK = view === 'year' ? true : wantYear ? size >= 6 : size <= 6;
        if (rightDir && sizeOK) return { panel: np, moved: true };
        const back = await restoreNav(np, el, view, before, b, forward ? 'next' : 'prev');
        panel = back.panel;
        continue;
      }
      panel = np;
    }
    return { panel, moved: false };
  }

  function monthCell(panel, m) {
    for (const c of panelCells(panel)) {
      const dm = c.getAttribute('data-month') || c.getAttribute('data-value');
      if (dm && /^\d{1,2}$/.test(dm) && Number(dm) === m) return c;
      const t = txt(c).trim();
      const mm = t.match(/^(\d{1,2})\s*月$/) || t.match(/^([一二三四五六七八九十]{1,3})\s*月$/);
      if (mm && cnNum(mm[1]) === m) return c;
    }
    return null;
  }

  function dayCell(panel, d) {
    const cells = panelCells(panel).filter((c) => {
      const cls = typeof c.className === 'string' ? c.className : '';
      if (/prev|next|other|disabled|out-?of/i.test(cls) && !/in-view|current|available|today/.test(cls)) return false;
      return true;
    });
    for (const c of cells) if (txt(c).trim() === String(d)) return c;
    return null;
  }

  function yearCell(panel, y) {
    for (const c of panelCells(panel)) if (txt(c).trim() === String(y)) return c;
    return null;
  }

  /* 在面板里点出目标日期。
     月份面板：箭头切年 + 点「N月」；日期面板：箭头切月 + 点日号；年份面板：点年份。
     每一步都重新读一次面板，避免「拿日期面板的套路去点月份面板」。 */
  async function pickFromPanel(el, y, m, d, gran, forceView) {
    let panel = findDatePanel(el);
    if (!panel) return false;
    await wait(150);
    panel = findDatePanel(el) || panel;

    // 面板长什么样最可信（控件类名经常骗人，比如月份控件也带 date 类名）；
    // 面板认不出来时，才退回「按控件粒度猜」，再不行按日期面板处理。
    let view = panelView(panel) || forceView;
    if (!view) view = gran === 'month' ? 'month' : gran === 'year' ? 'year' : 'date';

    if (view === 'year') {
      for (let i = 0; i < 60; i++) {
        const cy = panelYear(panel);
        if (!cy || cy === y) break;
        const r = await stepNav(panel, el, cy > y ? 'prev' : 'next', 'year', Math.abs(cy - y) >= 8);
        panel = r.panel;
        if (!r.moved) break;
      }
      const c = yearCell(panel, y);
      if (c) {
        realClick(c);
        await wait(200);
        // 很多面板点了年份会切到月份视图，接着把月也点上
        const np = findDatePanel(el);
        if (np && panelView(np) === 'month') {
          const mc = monthCell(np, m);
          if (mc) {
            realClick(mc);
            await wait(200);
          }
        }
        return true;
      }
      return false;
    }

    if (view === 'month') {
      const want = y * 12;
      for (let i = 0; i < 60; i++) {
        const st = navState(panel, 'month');
        if (!st || st === want) break;
        const r = await stepNav(panel, el, st > want ? 'prev' : 'next', 'month', true);
        panel = r.panel;
        if (!r.moved) break;
      }
      // 箭头翻不动年：点一下标题，很多组件会切出「年份网格」（Ant Design 就是）
      if (panelYear(panel) !== y) {
        const lbl = panel.querySelector('[class*="header-label"],[class*="header"] [class*="label"],[class*="year-btn"]');
        if (lbl) {
          realClick(lbl);
          await wait(220);
          const np = findDatePanel(el) || panel;
          if (np && panelView(np) === 'year') return pickFromPanel(el, y, m, d, gran, 'year');
          panel = np;
        }
      }
      if (panelYear(panel) === y) {
        const c = monthCell(panel, m);
        if (c) {
          realClick(c);
          await wait(240);
          return true;
        }
      }
      return false;
    }

    // 日期视图：左右箭头按月走。差得远（一年以上）先按年跳，否则出生日期要点几百次
    const target = y * 12 + m;
    for (let i = 0; i < 200; i++) {
      const st = navState(panel, 'date');
      if (!st || st === target) break;
      const dir = st > target ? 'prev' : 'next';
      const far = Math.abs(st - target) >= 12;
      let r = await stepNav(panel, el, dir, 'date', far);
      if (!r.moved && far) r = await stepNav(r.panel, el, dir, 'date', false); // 没有跳年的按钮就按月挪
      panel = r.panel;
      if (!r.moved) break;
    }
    if (d) {
      const c = dayCell(panel, d);
      if (c) {
        realClick(c);
        await wait(220);
        return true;
      }
    }
    return false;
  }

  /* 点开日历面板。真实组件不一定认 input 上的点击：有的只监听外壳容器，
     有的必须点日历图标才展开。挨个试，面板一出现就停。 */
  async function openDatePanel(el) {
    const box = shellOf(el) || boxOf(el) || el;
    const targets = [el];
    if (box && box !== el) targets.push(box);
    const icon = box && box.querySelector
      ? box.querySelector('[class*="calendar"],[class*="suffix"],[class*="prefix"],[class*="icon"],[class*="caret"]')
      : null;
    if (icon) targets.push(icon);
    if (el.parentElement && el.parentElement !== box) targets.push(el.parentElement);
    for (const t of [...new Set(targets)]) {
      realClick(t);
      await wait(190);
      const p = findDatePanel(el);
      if (p) return p;
    }
    return findDatePanel(el);
  }

  /* 日期 / 月份 / 年份选择器：能直接写值就写，写不进去就点开面板逐级点选 */
  async function fillDatePicker(el, value, label) {
    if (is51job() && el.matches('input[cname][editstyle="3"]')) {
      // My97 onfocus opens a page-level iframe. These ASP.NET fields submit their
      // native value; never focus, press Enter or click a global confirmation.
      const date=dateFor(el,value);
      if(!date) return false;
      setNativeValue(el,date);
      fire(el,'blur');fire(el,'focusout');
      return el.value===date;
    }
    if(isPhoenix() && el.closest(".phoenix-select")) return fillPhoenixDate(el,value,label);
    const gran = granularityOf(el);
    const text = dateFor(el, value, gran);
    if (!text) return false;
    const ds = digitsOf(text);
    const y = Number(ds.slice(0, 4));
    const m = Number(ds.slice(4, 6)) || 1;
    const d = Number(ds.slice(6, 8)) || 0;
    const wasRO = el.hasAttribute('readonly');

    // 1) 直接写值：临时摘掉 readonly，让 Vue/React 的受控输入也能收到 input 事件
    try {
      if (wasRO) el.removeAttribute('readonly');
      el.focus();
      setNativeValue(el, text);
      await wait(50);
      fire(el, 'input');
      fire(el, 'change');
      pressKey(el, 'Enter');
      await wait(160);
      if (dateShown(el, text)) {
        if (wasRO) el.setAttribute('readonly', '');
        el.blur();
        pressKey(el, 'Escape');
        return true;
      }
    } catch (e) {}
    if (wasRO) el.setAttribute('readonly', '');

    // 2) 点开面板逐级点选。先按控件粒度试，不行再换个粒度重试一轮，
    //    这样「具体到月」和「具体到日」的控件混在一张表单里也不会互相拖累。
    const tries = gran ? [gran, gran === 'month' ? 'date' : 'month'] : ['', 'month', 'date'];
    for (const view of tries) {
      pressKey(el, 'Escape');
      await wait(60);
      await openDatePanel(el);
      const picked = await pickFromPanel(el, y, m, d, gran, view);
      if (!dateShown(el, text)) {
        const ok = confirmButton();
        if (ok) {
          realClick(ok);
          await wait(180);
        }
      }
      if (dateShown(el, text)) {
        pressKey(el, 'Escape');
        return true;
      }
      if (picked) {
        await wait(220); // 有些组件回填有延迟
        if (dateShown(el, text)) {
          pressKey(el, 'Escape');
          return true;
        }
      }
    }
    pressKey(el, 'Escape');
    await wait(80);

    // 3) 最后兜底：可写的话再写一次（有些组件 blur 时才提交）
    if (!el.readOnly) {
      setNativeValue(el, text);
      fire(el, 'input');
      fire(el, 'change');
      el.blur();
      await wait(160);
    }
    return dateShown(el, text);
  }

  /* 点开下拉 -> 看选项 -> 反推字段 -> 重新选。用于「标签认错」的兜底 */
  async function retryByOptions(el, profile) {
    const opts = await openPicker(el, snapshotNodes());
    if (!opts.length) return null;
    const f = inferFieldByOptions(opts.map((o) => o.text));
    if (!f) {
      pressKey(el, 'Escape');
      return null;
    }
    const v = valueFor(profile, f.type, f.field, 0);
    if (!v) {
      pressKey(el, 'Escape');
      return null;
    }
    const hit = bestOption(opts.map((o) => ({ text: o.text, el: o.el })), v);
    if (!hit || !(await clickOption(el, hit.el))) {
      pressKey(el, 'Escape');
      return null;
    }
    return { value: v, type: f.type, field: f.field };
  }

  /* 日历图标 / 日期组件外壳：有些页面的日期输入框既不是 readonly、placeholder 也是空的，
     只能靠外壳上的日历图标来认 */
  function looksLikeDateShell(el) {
    let n = el;
    for (let i = 0; i < 4 && n; i++, n = n.parentElement) {
      const cls = typeof n.className === 'string' ? n.className : '';
      if (/date-?editor|date-?picker|datetime|calendar|日期/.test(cls)) return true;
      const ic = n.querySelector && n.querySelector('[class*="calendar"],[class*="date"],[class*="suffix"],[class*="prefix"]');
      if (ic && /calendar|date/i.test(String(ic.className || ''))) return true;
    }
    return false;
  }

  function isDatePickerish(el, label) {
    const t = (el.type || '').toLowerCase();
    if (t === 'date' || t === 'month' || t === 'datetime-local') return true;
    const ph = (el.getAttribute('placeholder') || '') + ' ' + (el.getAttribute('data-format') || '');
    if (/yyyy|年.{0,3}月|mm\s*\/\s*dd/i.test(ph)) return true;
    // 标签就是「开始时间 / 结束时间 / 出生日期」这类：直接按日期控件处理。
    // 不能要求它同时是 readonly 或写着「请选择」—— 塔塔这版的时间框两种都没有，
    // 于是被判成普通下拉，点开面板找不到选项，最后整段留空。
    // 但「学制时间 / 使用时长 / 工作年限」虽然带「时间」，其实是时长，是下拉 ——
    // 智联的「学制时间」就这样被判成日期控件，日历里当然找不到「4年」，于是永远填不上。
    if (/日期|时间|年月/.test(label || '') && !DURATION_RE.test(label || '')) return true;
    if (looksLikeDateShell(el) && (el.readOnly || /请选择/.test(ph))) return true;
    return false;
  }

  /* 「值一定是个日期」的字段：这些字段哪怕控件认错成下拉/文本框，
     也要先用日历面板试一次 —— 否则整段留空，用户看到的就是「请选择」 */
  const TIME_FIELDS = /^(start|end|birth|date|graduationDate|availableDate|politicsDate)$/;

  /* 名字里带「时间」但其实是时长（下拉选项是「3年 / 4年 / 6个月」），不是日历控件。
     智联的「学制时间」、技能里的「使用时长」都属于这一类。 */
  const DURATION_RE = /时长|年限|几年|几个月|个月数|小时|分钟|学制|修业|工龄|工作年限|司龄|经验/;

  function dateShellHint(el, label) {
    if (DURATION_RE.test(label || '')) return false;
    return looksLikeDateControl(el, label || '') || /日期|时间|年月/.test(label || '');
  }

  function isDropdownish(el) {
    if (!el || el.tagName === 'SELECT') return false;
    const t = (el.type || '').toLowerCase();
    if (['checkbox', 'radio', 'file', 'hidden', 'submit', 'button', 'date', 'month', 'datetime-local'].includes(t)) return false;
    const ph = el.getAttribute('placeholder') || '';
    const role = (el.getAttribute('role') || '').toLowerCase();
    const haspopup = (el.getAttribute('aria-haspopup') || '').toLowerCase();
    const pad = (n) => (n && typeof n.className === 'string' ? n.className : '');
    const cls = (pad(el) + ' ' + pad(el.parentElement) + ' ' + pad(el.parentElement && el.parentElement.parentElement)).toLowerCase();
    if (role === 'combobox') return true;
    /* 光有 aria-haspopup 不能当下拉：联想输入框（el-autocomplete）也会带它，
       智联的「学校名称」「专业」就被这个属性判成了下拉，点开抓到的是导航菜单。
       必须同时长得像下拉（只读 / 占位是「请选择」）才算。 */
    if (haspopup && haspopup !== 'false' && (el.readOnly || /请选择/.test(ph) || /请选择/.test(el.value || ''))) return true;
    if (/select|picker|dropdown|cascader|combobox/.test(cls)) return true;
    if (/请选择|点击选择/.test(ph)) return true;
    if (/请选择/.test(el.value || '')) return true;
    if (el.getAttribute('data-options') || el.getAttribute('data-source')) return true;
    return false;
  }

  function radioLabel(r) {
    return txt(r.closest('label') || r.parentElement) || r.value;
  }

  function pickRadio(radios, value) {
    const cands = radios.map((r) => ({ r, text: radioText(r) || radioLabel(r) }));
    const hit = bestOption(cands.map((c) => ({ text: c.text, el: c.r })), value);
    if (!hit) return false;
    realClick(hit.el);
    return true;
  }

  /* 计算某个字段属于第几条记录 */
  function buildEntries(root, profile, modes) {
    const { controls, radioGroups } = collectControls(root);
    const entries = [];
    const seenFieldCount = {};

    const push = (el, kind, m, label, section, radios, parts) => {
      const key = m.type + '.' + m.field;
      seenFieldCount[key] = (seenFieldCount[key] || 0) + 1;
      entries.push({
        el, kind, type: m.type, field: m.field, label: label.slice(0, 30),
        section, radios: radios || null, occ: seenFieldCount[key] - 1, parts: parts || [label],
        auto: !!m.auto,
      });
    };

    const matchParts = (parts, section) => {
      for (const p of parts) {
        const r = matchRule(p, section);
        if (r) return Object.assign({ part: p }, r);
      }
      return null;
    };

    /* 板块标题常常不在控件的祖先链上（标题在卡片外面、被折叠面板隔开），
       sectionOf 就返回空 —— 那些「只在项目/校园板块里生效」的规则跟着全失效，
       「职务」会被当成工作经历的职位、「开始时间」会被当成教育时间。
       这里用同一张卡片里的锚点字段（学校名称 / 公司名称 / 项目名称）补一个伪板块名。 */
    const SEC_OF_ANCHOR = [
      { re: /^(学校|院校|毕业院校)名称$|^学校$|^院校$/, sec: '教育经历' },
      { re: /^(公司|单位|企业)名称$|^公司$|^单位$|^企业$/, sec: '工作经历' },
      { re: /^(项目|课题)名称$|^项目$|^课题$/, sec: '项目经历' },
      { re: /^(社团|组织|部门)名称$|^社团$|^组织$/, sec: '校园经历' },
      { re: /^证书名称$/, sec: '证书' },
      { re: /^(奖项|荣誉|获奖)名称$/, sec: '获奖情况' },
    ];
    const anchorSecOf = (parts) => {
      // 逐条试：parts 里常常混着 placeholder（「请输入」），拼起来会毁掉整段匹配
      for (const p of parts) {
        const s = norm(p);
        for (const a of SEC_OF_ANCHOR) if (a.re.test(s)) return a.sec;
      }
      return '';
    };

    // 预扫一遍：拿到每个控件的标签、板块，以及「卡片里的锚点」（只扫一次 labelParts）
    const info = controls
      .map((el) => {
        const parts = labelParts(el);
        return { el, parts, sec: parts.length ? sectionOf(el) : '' };
      })
      .filter((i) => i.parts.length);
    const anchorInfo = info.filter((i) => anchorSecOf(i.parts));

    /* 不在标题下面时，看「同一张卡片里的锚点」是谁：公司名称→工作经历、项目名称→项目经历 */
    const guessSec = (item) => {
      if (!anchorInfo.length) return '';
      let node = item.el.parentElement;
      let hit = null;
      for (let k = 0; k < 12 && node && node !== document.body && node !== document.documentElement; k++, node = node.parentElement) {
        const inside = anchorInfo.filter((a) => node.contains(a.el));
        if (!inside.length) continue;
        if (inside.length > 1) break; // 已经升到「多条记录」的容器了
        hit = inside[0];
      }
      if (hit) return anchorSecOf(hit.parts);
      // 平铺布局：取文档里离它最近的前一个锚点
      let best = null;
      for (const a of anchorInfo) {
        if (a.el.compareDocumentPosition(item.el) & 4) best = a;
      }
      return best ? anchorSecOf(best.parts) : '';
    };

    const seenCustom = new Set();
    const dropped = []; // 认不出来的控件（排查「为什么这个字段没被识别」时最有用）
    for (const item of info) {
      const el = item.el;
      const parts = item.parts;
      if (TT.SKIP.test(norm(parts.join(' ')))) {
        dropped.push('[跳过] ' + parts.join(' / '));
        continue;
      }
      const section = item.sec || guessSec(item);
      let m = matchParts(parts, section);
      if(isModern51() && /家庭|家属|亲属/.test(section)) {
        const fields={'称谓':'relation','与本人关系':'relation','姓名':'name','出生年月':'birth','出生日期':'birth','政治面貌':'politics','工作单位及职务':'occupation','工作单位、职位或就读学校':'occupation','工作单位':'company','职务':'title','联系电话':'phone'};
        m=fields[norm(parts[0])]?{type:'family',field:fields[norm(parts[0])],part:parts[0]}:null;
      }
      if(is51job()) {
        const label=norm(parts[0]);
        if (/工作|实习/.test(section)) {
          const fields={'开始时间':'start','结束时间':'end','工作单位':'company','部门/岗位':'departmentPosition','主要工作内容及业绩成绩':'workAchievements','证明人及联系电话':'supervisorContact'};
          m=fields[label]?{type:'intern',field:fields[label],part:parts[0]}:null;
        } else if (/家庭|亲属/.test(section)) {
          const fields={'姓名':'name','与本人关系':'relation','关系':'relation','出生年月':'birth','出生日期':'birth','政治面貌':'politics','工作单位、职位或就读学校':'occupation','工作单位及职务':'occupation','工作单位':'company','职务':'title','联系电话':'phone'};
          m=fields[label]?{type:'family',field:fields[label],part:parts[0]}:null;
        } else if (/证明人/.test(label)) m=null;
      }
      if(isPhoenix()) {
        const label=norm(parts[0]);
        const maps={
          '家庭情况':['family',{'姓名':'name','与本人关系':'relation','工作单位':'company','联系电话':'phone','职务':'title'}],
          '家庭主要成员':['family',{'称谓':'relation','姓名':'name','联系电话':'phone','职务':'title','工作单位':'company'}],
          '项目经历':['project',{'项目名称':'name','职务':'role','开始时间':'start','结束时间':'end','项目描述':'content','项目中职责':'duty'}],
          '在校实践':['campus',{'实践名称':'org','开始时间':'start','结束时间':'end','实践描述':'description'}],
          '在校职务':['campus',{'职务名称':'role','开始时间':'start','结束时间':'end','职务描述':'description'}],
          '证书':['cert',{'证书名称':'name','获得时间':'date','证书描述':'description'}],
          '专业技术职称或证书':['cert',{'资格证书名称':'name','其他证书名称':'otherName','获得时间':'date','证书描述':'description'}],
          '荣誉奖励':['award',{'奖励级别':'level','获奖时间':'date','荣誉奖励名称':'name','荣誉奖励描述':'description'}],
          '教育经历':['edu',{'学历':'education','学位':'degree','开始时间':'start','结束时间':'end','学校名称':'school','年级排名':'majorRank','学校满分绩点':'gpaMax','本人平均学分绩点gpa':'gpaScore','一级专业':'majorLevel1','二级专业':'majorLevel2','三级专业':'majorLevel3','专业名称':'major','专业':'major','学习形式':'studyForm','成绩gpa':'gpa'}],
          '语言能力':['extra',{'语言类型':'language','掌握程度':'languageLevel'}],
          '技能':['skill',{'技能名称':'name','掌握程度':'level'}]
        };
        if(section==='个人信息' && label==='最高学历研究方向') m={type:'edu',field:'direction',part:parts[0]};
        else if(section==='个人信息' && label==='论文标题') m={type:'edu',field:'publicationTitle',part:parts[0]};
        else if(section==='本人亲属在集团任职情况') m=null;
        else if(section==='附加问题') m=null;
        else if(maps[section]) {const [type,fields]=maps[section];m=fields[label]?{type,field:fields[label],part:parts[0]}:(section==='教育经历'?m:null);}
        else if(section==='求职意向' && /期望月薪/.test(label)) m={type:'job',field:'salary',part:parts[0]};
        else if(label==='现居住地') m={type:'basic',field:'currentPlace',part:parts[0]};
      }
      if (isHotjob()) {
        const label=norm(parts[0]);
        if (/亲属关系/.test(section)) m=null; // Employer-relative disclosures are not family history.
        if (/教育经历/.test(section)) {
          const fields={'开始时间':'start','结束时间':'end','学校':'school','学历':'education','学位':'degree','专业':'major','城市':'city'};
          if (fields[label]) m={type:'edu',field:fields[label],part:parts[0]};
        }
      }
      if (isZhaopin() && /教育|学习经历/.test(section)) {
        const fields = {'入学时间':'start','毕业时间':'end','学校名称':'school','受教育类型':'studyForm','学位':'degree','学历':'education','研究方向':'direction','院系':'college','专业':'major','专业课程':'courses','年级排名':'majorRank','是否有海外学习经历':'overseas','证明人':'supervisor','证明人关系':'supervisorRelation','证明人职务':'supervisorTitle','证明人联系方式':'supervisorPhone'};
        const label = norm(parts[0]);
        if (fields[label]) m = {type:'edu',field:fields[label],part:parts[0]};
      }
      if (isZhaopin() && /家庭|家属|亲属/.test(section)) {
        const fields={'姓名':'name','成员姓名':'name','家庭成员姓名':'name','与本人关系':'relation','关系':'relation','称谓':'relation','工作单位':'company','单位名称':'company','所在单位':'company','职务':'title','职位':'title','联系电话':'phone','手机号码':'phone','手机号':'phone','出生日期':'birth','政治面貌':'politics','现居住地':'location'};
        const label=norm(parts[0]);
        if (fields[label]) m={type:'family',field:fields[label],part:parts[0]};
        else m=null; // Do not fall back to the applicant or internship inside a family form.
      }
      if (!m) {
        dropped.push('[没匹配] ' + parts.join(' / ') + ' | ' + (el.tagName || '') + (el.readOnly ? ' readonly' : ''));
        continue;
      }
      // 必填星号只是标记，别让它进日志和调试信息
      const label = String(m.part || '').replace(/^[\s*＊]+/, '').trim() || m.part;
      const t = (el.type || el.tagName).toLowerCase();
      const box = shellOf(el);
      if (el.tagName === 'SELECT') {
        push(el, 'select', m, label, section, null, parts);
      } else if (isHotjob() && /^(请选择学校|请选择毕业院校|请选择专业)$/.test(el.placeholder || '')) {
        push(el, 'picker', m, label, section, null, parts);
      } else if (isZhaopin() && isSuggestInput(el)) {
        push(el, 'picker', m, label, section, null, parts);
      } else if (isDatePickerish(el, label)) {
        push(el, 'datepicker', m, label, section, null, parts);
      } else if (isDropdownish(el)) {
        if (seenCustom.has(box)) continue;
        seenCustom.add(box);
        push(el, 'picker', m, label, section, null, parts);
      } else if (t === 'checkbox') {
        push(el, 'checkbox', m, label, section, null, parts);
      } else if (el.isContentEditable) {
        push(el, 'rich', m, label, section, null, parts);
      } else {
        push(el, 'text', m, label, section, null, parts);
      }
    }

    for (const group of radioGroups) {
      const first = group[0];
      const parts = labelParts(first);
      if (!parts.length || TT.SKIP.test(norm(parts.join(' ')))) continue;
      const section = sectionOf(first);
      let m = matchParts(parts, section);
      if (isHotjob() && /亲属关系/.test(section)) continue;
      if (isHotjob() && /最高学历是否为境外院校/.test(parts.join(''))) m={type:'edu',field:'overseas',part:parts[0]};
      if (!m) continue;
      entries.push({
        el: first, kind: 'radio', type: m.type, field: m.field,
        label: m.part.slice(0, 30), section, radios: group, occ: 0, parts,
      });
    }

    /* 第几条记录：优先按「重复块」判断——页面上第几个「经历块」就用简历里第几条。
       找不到重复块（页面上只有一组）时，退化成锚点顺序法。 */
    const ANCHOR = {
      edu: /^school$/, intern: /^company$/, project: /^name$/, campus: /^(org|orgRole)$/,
      award: /^name$/, cert: /^name$/, training: /^name$/, family: /^name$/, skill: /^name$/,
    };

    /* 「开始时间 / 结束时间」的规则是 type='auto'，字段本身不带归属，靠所在板块决定。
       板块标题认不出来时（标题在卡片外面的容器里、被别的节点挡住…）不能一律当教育经历：
       那样工作经历 / 项目经历的时间会去取第 3、4 条教育记录，取不到就整段留空 ——
       这正是「教育的时间填上了，工作/项目的时间一个没填」的由来。
       这里按「同一条记录里的邻居字段」反推：块里有公司名称就是实习、有项目名称就是项目；
       平铺布局（整页一串 form-item）则看离它最近的前一个锚点。 */
    const fixAutoType = () => {
      const pending = entries.filter((e) => e.auto);
      if (!pending.length) return;
      const anchors = entries.filter((e) => {
        const rx = ANCHOR[e.type];
        return rx && rx.test(e.field);
      });
      if (!anchors.length) return;
      for (const e of pending) {
        let type = '';
        // 1) 向上找「只包住它自己那一个锚点」的最大祖先 —— 就是这一条记录的容器
        let node = e.el.parentElement;
        let hit = null;
        for (let k = 0; k < 12 && node && node !== document.body && node !== document.documentElement; k++, node = node.parentElement) {
          const inside = anchors.filter((a) => node.contains(a.el));
          if (!inside.length) continue;
          if (inside.length > 1) break; // 已经升到「多条记录」的容器了
          hit = inside[0];
        }
        if (hit) type = hit.type;
        // 2) 平铺布局：取文档里离它最近的前一个锚点
        if (!type) {
          let best = null;
          for (const a of anchors) {
            if (a.el === e.el) continue;
            if (a.el.compareDocumentPosition(e.el) & 4) best = a;
          }
          if (best) type = best.type;
        }
        if (!type) continue;
        e.type = type;
        e.auto = false;
      }
    };
    fixAutoType();

    const byType = {};
    for (const e of entries) {
      if (!TT.LISTS[e.type]) {
        e.idx = 0;
        continue;
      }
      (byType[e.type] = byType[e.type] || []).push(e);
    }

    /* 同一个组件有时会被认成两个控件（外层 div + 内层 input）：只保留外层那个，
       否则同一个下拉会被填两遍、第二次还取到「第 2 条记录」的值。 */
    const uniq = [];
    for (const e of entries) {
      const hit = uniq.find(
        (d) => d.type === e.type && d.field === e.field && (d.el.contains(e.el) || e.el.contains(d.el))
      );
      if (!hit) {
        uniq.push(e);
      } else if (e.el.contains(hit.el)) {
        uniq[uniq.indexOf(hit)] = e;
      }
    }
    if (uniq.length !== entries.length) entries.splice(0, entries.length, ...uniq);

    /* 同名字段在「同一类经历」里是第几次出现（页面自上而下数） */
    const markOccurrence = (list) => {
      const seen = {};
      for (const e of list) {
        e.occT = seen[e.field] || 0;
        seen[e.field] = e.occT + 1;
      }
    };

    /* 每个锚点（学校名称 / 公司名称…）向上找「只包住它自己这一个锚点」的最大祖先，
       这个祖先就是「一条记录」的容器 —— 比按兄弟节点签名猜块稳得多：
       块中间插分隔线、每块字段数不一致都不会算错（三块教育经历全填成同一所学校的老毛病）。 */
    const anchorRegions = (anchors) => {
      const out = [];
      anchors.forEach((a, i) => {
        let node = a.el.parentElement;
        let best = null;
        for (let k = 0; k < 10 && node && node !== document.body && node !== document.documentElement; k++, node = node.parentElement) {
          let c = 0;
          for (const b of anchors) if (node.contains(b.el)) c++;
          if (c !== 1) break;
          best = node;
        }
        if (best) out.push({ node: best, idx: i });
      });
      return out;
    };

    const beforeAnchorIdx = (e, anchors, rx) => {
      if (!anchors.length) return 0;
      let before = 0;
      for (const a of anchors) {
        if (a === e) break;
        if (a.el.compareDocumentPosition(e.el) & 4) before++;
      }
      return Math.max(0, rx && rx.test(e.field) ? before : before - 1);
    };

    for (const t in byType) {
      const list = byType[t];
      const rx = ANCHOR[t];
      const anchors = rx ? list.filter((e) => rx.test(e.field)) : [];
      markOccurrence(list);
      const regions = anchors.length > 1 ? anchorRegions(anchors) : [];
      const blocked = regions.length ? null : list.map((e) => blockIndexOf(e.el, list));
      const hasBlock = !!(blocked && blocked.some((b) => b));

      list.forEach((e, i) => {
        let idx = null;
        // 1) 落在哪条记录的容器里 —— 最可靠
        for (const r of regions) {
          if (r.node.contains(e.el)) {
            idx = r.idx;
            break;
          }
        }
        // 2) 平铺布局（没有块容器，整段就是一串 form-item）：
        //    同名字段第几次出现，就是第几条记录
        if (idx === null && regions.length > 1) idx = e.occT;
        // 3) 再退化：按兄弟节点结构猜重复块
        if (idx === null && hasBlock) idx = blocked[i] ? blocked[i].index : 0;
        // 4) 最后：锚点顺序
        if (idx === null) idx = beforeAnchorIdx(e, anchors, rx);
        e.idx = idx;
      });
    }
    if (isZhaopin()) {
      // A Zhaopin form is one record. Autocomplete wrappers and fields are not records.
      const forms = [...new Set(entries.map(e => e.el.closest('form.el-form')).filter(Boolean))];
      const assigned = new Map();
      for (const form of forms) {
        const own = entries.filter(e => form.contains(e.el));
        for (const type of new Set(own.map(e => e.type).filter(t => TT.LISTS[t]))) {
          const records = profile[TT.LISTS[type]] || [];
          const anchorField = type === 'edu' ? 'school' : type === 'intern' ? 'company' : 'name';
          const anchors = own.filter(e => e.type === type && e.field === anchorField);
          const current = anchors.map(e => norm(e.el.value || '')).find(Boolean);
          let idx = records.findIndex(r => current && norm(r[anchorField]) === current);
          const module = form.closest('.apply-module__body') || form.parentElement?.parentElement;
          const saved = module ? [...module.querySelectorAll('form.el-form')].filter(f => f !== form && !f.querySelector('input,textarea,select')) : [];
          const savedTexts = saved.map(f => norm(txt(f)));
          const used = assigned.get(type) || new Set();
          if (idx < 0) idx = records.findIndex((r,i) => !used.has(i) && !saved.some((f,j)=>{
            if (type!=='family') return norm(r[anchorField]) && savedTexts[j].includes(norm(r[anchorField]));
            const cells=[...f.querySelectorAll('.el-form-item')];
            const textFor=label=>{const cell=cells.find(c=>label.test(norm(txt(c.querySelector('.el-form-item__label')))));return cell ? norm(txt(cell.querySelector('.el-form-item__content'))) : '';};
            return textFor(/^(姓名|成员姓名|家庭成员姓名)$/)===norm(r.name) && textFor(/^(与本人关系|关系|称谓)$/)===norm(r.relation);
          }));
          if (idx < 0) idx = records.length; // all records exist: leave this new form empty
          used.add(idx); assigned.set(type,used);
          own.filter(e => e.type === type).forEach(e => {e.idx=idx;});
        }
      }
    }
    if (isHotjob()) {
      const cells=[...new Set(entries.filter(e=>e.type==='edu' && /教育经历/.test(e.section)).map(e=>e.el.closest('.form-cell-inner')).filter(Boolean))];
      const chronological=[...(profile.educations || [])].map((r,i)=>({r,i})).sort((a,b)=>String(a.r.start||'').localeCompare(String(b.r.start||'')));
      for (const e of entries) {
        if (e.type!=='edu') continue;
        const cell=e.el.closest('.form-cell-inner');
        e.idx=/教育经历/.test(e.section) ? (chronological[cells.indexOf(cell)]?.i ?? (profile.educations || []).length) : 0;
        if (e.field==='city') {
          const item=e.el.closest('.ant-form-item');
          e.regionPart=item ? [...item.querySelectorAll('[role="combobox"]')].indexOf(e.el) : 0;
        }
      }
      for (const e of entries.filter(e=>e.type==='basic' && /hometown|sourcePlace|household/.test(e.field))) {
        const item=e.el.closest('.ant-form-item');
        e.regionPart=item ? [...item.querySelectorAll('[role="combobox"]')].indexOf(e.el) : 0;
      }
    }
    if(isPhoenix()) {
      const groups=new Map();
      for(const e of entries) {
        if(!TT.LISTS[e.type]) {e.idx=0;continue;}
        const form=e.el.closest('.form[name]');
        const key=e.section+'|'+e.type;
        const forms=groups.get(key)||[];
        if(!forms.includes(form)) forms.push(form);
        groups.set(key,forms);e.idx=forms.indexOf(form);
      }
      const chronological=/从第一学历填起/.test(document.body.textContent || '');
      if(chronological) {
        const order=(profile.educations||[]).map((r,i)=>({r,i})).sort((a,b)=>String(a.r.start||'').localeCompare(String(b.r.start||'')));
        for(const e of entries) if(e.type==='edu' && e.section==='教育经历') e.idx=order[e.idx]?.i ?? (profile.educations||[]).length;
      }
      // Phoenix radios have no native input; scan the actual visual groups.
      for(const group of root.querySelectorAll('.phoenix-radio-group')) {
        const section=sectionOf(group);const parts=labelParts(group);const label=norm(parts[0]);
        const field=label==='性别'?'gender':/^(婚否|婚育状况)$/.test(label)?'marriage':'';
        if(field && section==='个人信息') entries.push({el:group,kind:'phoenixRadio',type:'basic',field,label:parts[0],section,idx:0,parts});
      }
    }
    buildEntries.dropped = dropped; // 面板「填写记录」会展示
    if(isModern51()) {
      const used=new Set();
      const forms=[...new Set(entries.filter(e=>e.type==='family').map(e=>e.el.closest('form.el-form')).filter(Boolean))];
      for(const form of forms) {
        const own=entries.filter(e=>e.type==='family' && form.contains(e.el));
        const records=profile.family || [];
        const current=norm(own.find(e=>e.field==='name')?.el.value || '');
        const module=form.closest('.resume-module');
        const saved=module ? [...module.querySelectorAll('.common-item')].filter(n=>!n.querySelector('form') && !n.contains(form)).map(n=>norm(txt(n))) : [];
        let idx=records.findIndex(r=>current && norm(r.name)===current);
        if(idx<0)idx=records.findIndex((r,i)=>!used.has(i) && !saved.some(t=>r.name && r.relation && t.includes(norm(r.name)) && t.includes(norm(r.relation))));
        if(idx<0)idx=records.length;
        used.add(idx);own.forEach(e=>e.idx=idx);
      }
    }
    if(is51job()) {
      for(const e of entries) {
        const suffix=e.el.id.match(/^cc_.+_\d+_(\d+)$/);
        e.idx=TT.LISTS[e.type] && suffix ? Math.max(0,Number(suffix[1])-1) : 0;
      }
    }
    return entries;
  }

  /* 找 el 所在的「记录块」：取最外层那个「同级里有多个、且各自都含同类字段」的节点 */
  function blockIndexOf(el, list) {
    const countIn = (node) => {
      let c = 0;
      for (const e of list) if (node.contains(e.el)) c++;
      return c;
    };
    let best = null;
    let node = el.parentElement;
    for (let i = 0; i < 9 && node && node !== document.body && node !== document.documentElement; i++, node = node.parentElement) {
      const sig = sigOf(node);
      if (!sig) break;
      const isRow = node.tagName === 'TR';
      // 表格的一行通常只是「一个字段」，不是一段经历；除非这一行里塞了 3 个以上同类字段
      if (isRow && countIn(node) < 3) continue;
      const sibs = [...node.parentElement.children].filter((c) => sigOf(c) === sig);
      if (sibs.length < 2) continue;
      // 每个同级块里都得有 ≥2 个同类字段，才是「一段经历」而不是「一行」
      const okCount = isRow ? 3 : 2;
      if (sibs.filter((s) => countIn(s) >= okCount).length < 2) continue;
      best = { index: sibs.indexOf(node), node };
    }
    return best;
  }

  /* ---------------- 主流程 ---------------- */
  const ADD_KEY = {
    edu: /教育/, intern: /实习|工作/, project: /项目|实践/, campus: /社团|校园/,
    cert: /证书/, skill: /技能/, award: /获奖|荣誉/, training: /培训/,
  };

  function findAddButton(type) {
    const re = ADD_KEY[type];
    if (!re) return null;
    const cands = [...document.querySelectorAll('a,button,span,div,p')].filter((n) => {
      if (n.children.length > 1) return false;
      const t = txt(n).trim();
      if (!t || t.length > 14) return false;
      if (!/添加|新增|增加|继续添加/.test(t)) return false;
      return re.test(t) && visible(n);
    });
    return cands[0] || null;
  }

  /* 统计「添加」按钮所在容器里有几个同结构的经历块 */
  function blockNodes(container, btn) {
    const kids = [...container.children].filter(
      (k) => k !== btn && !k.contains(btn) && k.querySelector('input,textarea,select,[contenteditable="true"]')
    );
    if (!kids.length) return [];
    const sig0 = sigOf(kids[0]);
    return kids.filter((k) => sigOf(k) === sig0);
  }

  function addBtnContext(btn) {
    let c = btn.parentElement;
    for (let i = 0; i < 4 && c; i++, c = c.parentElement) {
      const blocks = blockNodes(c, btn);
      if (blocks.length >= 1) return { container: c, count: blocks.length };
    }
    return null;
  }

  /* 简历里有多条经历、页面只给了一个空块时，点「+ 添加XX经历」把空块补出来 */
  async function expandRecords(profile, region) {
    for (const type of Object.keys(ADD_KEY)) {
      const want = Math.min((profile[TT.LISTS[type]] || []).length, 3);
      if (want < 2) continue;
      const btn = findAddButton(type);
      if (!btn) continue;
      // 选区模式：只补选区里的经历块，别动框外的内容
      if (region && !inRegion(btn, region)) continue;
      const ctx = addBtnContext(btn);
      if (!ctx) continue;
      let guard = 0;
      while (guard++ < 3) {
        if (blockNodes(ctx.container, btn).length >= want) break;
        realClick(btn);
        await wait(400);
      }
    }
  }

  function inRegion(el, rect) {
    if (!rect) return true;
    if (!hasLayout()) return true;
    const r = el.getBoundingClientRect();
    if (!r.width && !r.height) return false;
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    return cx >= rect.left && cx <= rect.right && cy >= rect.top && cy <= rect.bottom;
  }

  async function fill(profile, opts) {
    opts = opts || {};
    const mode = opts.mode || 'basic';
    const started = performance.now();
    const root = opts.root || document;
    const region = opts.rect || null;
    const full = mode === 'enhanced' || mode === 'region' || isZhaopin() || isHotjob() || isPhoenix() || is51job() || isModern51();

    let entries = buildEntries(root, profile, mode);
    if (full && opts.expand !== false && !isZhaopin() && !isHotjob() && !isPhoenix() && !is51job() && !isModern51()) {
      await expandRecords(profile, region);
      entries = buildEntries(root, profile, mode);
    }
    // 选区模式：先裁到框内，再按用户指定的类别重新归类
    if (region) {
      entries = entries.filter((e) => inRegion(e.el, region));
      if (opts.forceType) {
        entries = remapEntries(entries, opts.forceType, Math.max(0, opts.forceIdx || 0));
      }
    }

    const scopeTypes = full ? null : new Set(['basic', 'job', 'self', 'extra']);
    const log = [];
    const skipped = [];
    const noData = [];
    const undoStack = [];
    let filled = 0;
    const recognized = entries.map(
      (e) => e.type + '.' + e.field + ' ← ' + e.label + ' [' + (e.section || '') + '] ' + e.kind + ' #' + (e.idx + 1)
    );

    if (isZhaopin()) {
      const order = {education:0,degree:1,studyForm:2,school:9};
      entries.sort((a,b)=>(order[a.field] ?? 5)-(order[b.field] ?? 5));
    }
    for (let e of entries) {
      if ((isZhaopin() || isPhoenix()) && !e.el.isConnected) {
        // Degree/education selects rebuild downstream inputs. Resolve the live control.
        const current=buildEntries(root,profile,mode).find(n=>n.type===e.type && n.field===e.field && n.idx===e.idx && (!region || inRegion(n.el,region)));
        if (current) e=current;
      }
      if (!e.el.isConnected || (isZhaopin() && concealed(e.el))) continue;
      if (scopeTypes && !scopeTypes.has(e.type) && !(e.type === 'edu' && e.idx === 0)) continue;
      let value = valueFor(profile, e.type, e.field, e.idx);
      if (value === '' || value == null) {
        noData.push((e.label || e.field) + '（' + e.type + '.' + e.field + ' 第' + (e.idx + 1) + '条）');
        continue;
      }
      if (isHotjob() && e.regionPart != null) {
        const parts=String(value).split(/[\/\s]+/).filter(Boolean).filter(x=>x!=='中国');
        if (parts.length>1) value=parts[e.regionPart] || '';
        else {
          const match=String(value).match(/^(.+?(?:省|自治区|特别行政区|北京市|上海市|天津市|重庆市))(.+?市)?/);
          if (match) value=e.regionPart===0 ? match[1] : (match[2] || match[1]);
        }
        if (!value) continue;
      }
      const label = e.label || e.field;
      if ((isZhaopin() || isPhoenix()) && !isSuggestInput(e.el) && 'value' in e.el && aliasSet(value).includes(norm(e.el.value))) continue;

      if(is51job() && e.kind==='text' && e.el.matches('input[cname],textarea[cname]') && !e.el.readOnly) {
        const before=e.el.value;
        if(before===value) {fire(e.el,'blur');fire(e.el,'focusout');continue;}
        setNativeValue(e.el,value);
        fire(e.el,'blur');fire(e.el,'focusout');
        if(e.el.value===value) {
          undoStack.push({el:e.el,kind:'text',before});
          log.push({_target:e.el,label,value});filled++;
        } else skipped.push({label,reason:'文本未保留，请手动核对'});
        continue;
      }
      if(e.kind==='phoenixRadio') {
        const hit=[...e.el.querySelectorAll('.phoenix-radio')].find(n=>aliasSet(value).includes(norm(txt(n))));
        if(hit) {realClick(hit);log.push({_target:e.el,label,value});filled++;}
        else skipped.push({label,reason:'未找到对应选项'});
        continue;
      }
      if (e.kind === 'checkbox') {
        const on = /^(是|接受|同意|愿意|yes|true|1)$/i.test(String(value).trim());
        if (e.el.checked !== on) {
          undoStack.push({ el: e.el, kind: 'checkbox', before: e.el.checked });
          realClick(e.el);
          log.push({ _target: e.el, label, value: on ? '勾选' : '取消勾选' });
          filled++;
        }
        continue;
      }

      if (e.kind === 'radio') {
        const before = e.radios.findIndex((r) => r.checked);
        if (pickRadio(e.radios, value)) {
          undoStack.push({ el: e.el, kind: 'radio', before, radios: e.radios });
          log.push({ _target: e.el, label, value });
          filled++;
        } else {
          skipped.push({ label, reason: '没找到对应选项' });
        }
        continue;
      }

      if (e.kind === 'select') {
        const before = e.el.value;
        // 选项是异步拉下来的站点，先等一下再试一次
        if (e.el.options.length <= 1) {
          await wait(300);
        }
        if (setSelect(e.el, value)) {
          undoStack.push({ el: e.el, kind: 'select', before });
          log.push({ _target: e.el, label, value: txt(e.el.selectedOptions[0]) });
          filled++;
          continue;
        }
        // 兜底：用选项反推这个下拉到底该填什么
        const f = inferFieldByOptions([...e.el.options].map((o) => txt(o)));
        const v2 = f ? valueFor(profile, f.type, f.field, e.idx) : '';
        if (v2 && v2 !== value && setSelect(e.el, v2)) {
          undoStack.push({ el: e.el, kind: 'select', before });
          log.push({ _target: e.el, label: label + '→' + f.field, value: txt(e.el.selectedOptions[0]) });
          filled++;
        } else {
          skipped.push({ label, reason: '下拉里没有可选项' });
        }
        continue;
      }

      if (e.kind === 'picker') {
        // 有些日期框既不是 readonly、placeholder 也没有「请选择」，
        // 于是被判成普通下拉 —— 点开面板只看到一片数字，最后一个也选不上。
        // 字段是「开始 / 结束时间」这类就先走一次日历面板，再退回下拉流程。
        if (TIME_FIELDS.test(e.field) && isDateText(value) && dateShellHint(e.el, label)) {
          if (await fillDatePicker(e.el, value, label)) {
            log.push({ _target: e.el, label, value: dateFor(e.el, value) || value });
            filled++;
            continue;
          }
        }
        const r = await fillPicker(e.el, value, label);
        if (r.ok) {
          log.push({ _target: e.el, label, value });
          filled++;
          continue;
        }
        // 兜底 1：标签认错时，用下拉里的选项反推该填什么
        const alt = (isZhaopin() || isHotjob() || isPhoenix()) ? null : await retryByOptions(e.el, profile);
        if (alt) {
          log.push({ _target: e.el, label: label + '→' + alt.field, value: alt.value });
          filled++;
          continue;
        }
        // 兜底 2：其实是普通文本框，只是长得像下拉 —— 直接把值写进去
        const writable =
          (e.el.tagName === 'INPUT' || e.el.tagName === 'TEXTAREA') &&
          !e.el.readOnly &&
          !/^(radio|checkbox|file|hidden)$/i.test(e.el.type || '');
        if (writable && !(isZhaopin() && isSuggestInput(e.el)) && !isHotjob() && !isPhoenix()) {
          const dv = isDateText(value) && looksLikeDateControl(e.el, e.label) ? dateFor(e.el, value) : value;
          e.el.focus();
          setNativeValue(e.el, dv);
          e.el.blur();
          log.push({ _target: e.el, label, value: dv });
          filled++;
          continue;
        }
        skipped.push({
          label, reason: '下拉没选上（可点「重试」或手动点一次）',
          debug: r.debug, section: e.section, el: e.el, value,
        });
        pressKey(e.el, 'Escape');
        continue;
      }

      if (e.kind === 'datepicker') {
        const text = dateFor(e.el, value) || value;
        const ok = await fillDatePicker(e.el, value, label);
        if (ok) {
          log.push({ _target: e.el, label, value: text });
          filled++;
        } else {
          const panel = findDatePanel(e.el);
          skipped.push({
            label, reason: '日期控件未成功（可在日历里手动点）', section: e.section,
            el: e.el, value,
            debug: {
              label, value: text, kind: 'date',
              granularity: granularityOf(e.el) || '(没认出来)',
              panel: panel ? String(panel.className || panel.tagName).slice(0, 80) : '(没找到日历面板)',
              panelView: panel ? panelView(panel) || '(没认出来)' : '',
              panelYear: panel ? panelYear(panel) : 0,
              panelMonth: panel ? panelMonth(panel) : 0,
              shown: String(shownValue(e.el) || '').slice(0, 40),
            },
          });
        }
        continue;
      }

      if (e.kind === 'rich') {
        const before = e.el.innerText;
        e.el.focus();
        e.el.innerText = value;
        fire(e.el, 'input');
        undoStack.push({ el: e.el, kind: 'rich', before });
        log.push({ _target: e.el, label, value: value.slice(0, 20) + (value.length > 20 ? '…' : '') });
        filled++;
        continue;
      }

      // 值是日期、字段又是「开始/结束时间」这类：走日期控件流程（能写就写、写不进就点日历面板）。
      // 不能直接 setNativeValue 了事 —— 受控组件会把值覆盖回去，
      // 日志里显示「已填」、页面上却还是「请选择」，最难查的就是这种。
      if (TIME_FIELDS.test(e.field) && isDateText(value) && dateShellHint(e.el, label)) {
        if (await fillDatePicker(e.el, value, label)) {
          log.push({ _target: e.el, label, value: dateFor(e.el, value) || value });
          filled++;
          continue;
        }
      }

      // 普通文本框：内容是日期且控件是日期控件时才做格式转换
      const isDate = isDateText(value) && looksLikeDateControl(e.el, e.label);
      const v = isDate ? dateFor(e.el, value) : value;
      if (!v) continue;
      if (e.el.value === v) continue;
      if (e.el.readOnly) {
        // 只读文本多半是没识别出来的下拉；日期控件刚试过，这里走下拉
        const r = await fillPicker(e.el, value, label);
        if (r.ok) {
          log.push({ _target: e.el, label, value });
          filled++;
        } else {
          skipped.push({
            label, reason: '只读控件没填上（可点「重试」或手动点选）',
            debug: r.debug, section: e.section, el: e.el, value,
          });
        }
        continue;
      }
      const before = e.el.value;
      // 联想型字段（学校/公司/专业）先拍快照，写完值后好认出「新冒出来的候选列表」
      const snap = !isPhoenix() && SUGGEST_FIELDS.test(e.field) ? snapshotNodes() : null;
      e.el.focus();
      setNativeValue(e.el, v);
      let shown = v;
      if (snap) {
        const sug = await acceptSuggest(e.el, v, snap);
        if (sug) shown = sug;
      }
      e.el.blur();
      undoStack.push({ el: e.el, kind: 'text', before });
      log.push({ _target: e.el, label, value: shown.length > 24 ? shown.slice(0, 24) + '…' : shown });
      filled++;
    }

    // Verify after blur/debounced validation; writing text alone is not a success.
    if (isZhaopin() || isHotjob() || isModern51()) {
      await wait(350);
      for (let i = log.length - 1; i >= 0; i--) {
        const entry = entries.find(e => e.el === log[i]._target &&
          /^(INPUT|TEXTAREA)$/.test(e.el.tagName) && !String(e.el.value || '').trim());
        if (entry) {
          skipped.push({label: log[i].label, reason: '站点校验后值被清空，请手动选择候选', el: entry.el});
          log.splice(i, 1); filled--;
        }
      }
    }
    for (const item of log) delete item._target;
    const ms = Math.round(performance.now() - started);
    const undo = () => {
      for (let i = undoStack.length - 1; i >= 0; i--) {
        const u = undoStack[i];
        try {
          if (u.kind === 'text') setNativeValue(u.el, u.before);
          else if (u.kind === 'select') {
            u.el.value = u.before;
            fire(u.el, 'change');
          } else if (u.kind === 'checkbox') {
            if (u.el.checked !== u.before) u.el.click();
          } else if (u.kind === 'radio') {
            if (u.radios[u.before]) u.radios[u.before].click();
          } else if (u.kind === 'rich') {
            u.el.innerText = u.before;
            fire(u.el, 'input');
          }
        } catch (err) {}
      }
      return undoStack.length;
    };
    return { filled, ms, log, skipped, undo, total: entries.length, recognized, noData, dropped: (buildEntries.dropped || []).slice(0, 80) };
  }

  /* 框选完先看看选区里都有什么，供面板显示「识别到 N 个字段」 */
  function previewRegion(profile, rect, forceType) {
    let entries = buildEntries(document, profile, 'enhanced').filter((e) => inRegion(e.el, rect));
    const byType = {};
    for (const e of entries) byType[e.type] = (byType[e.type] || 0) + 1;
    if (forceType) {
      const remapped = remapEntries(entries, forceType, 0);
      const cnt = {};
      for (const e of remapped) cnt[e.type] = (cnt[e.type] || 0) + 1;
      return {
        total: entries.length, byType,
        after: remapped.length, afterTypes: cnt,
        labels: remapped.slice(0, 40).map((e) => e.label + ' → ' + e.type + '.' + e.field),
      };
    }
    return { total: entries.length, byType, after: entries.length, afterTypes: byType, labels: [] };
  }

  /* 面板上的「重试没填上的」用：重新点开、等更久、再试一遍 */
  async function retryPicker(el, value, label, profile) {
    if (!el || !el.isConnected) return false;
    // 日期 / 月份控件走另一条路，别当普通下拉重试
    if (isDatePickerish(el, label)) {
      if (await fillDatePicker(el, value, label || '')) return true;
    }
    const r = await fillPicker(el, value, label || '');
    if (r.ok) return true;
    if (profile) {
      const alt = await retryByOptions(el, profile);
      if (alt) return true;
    }
    return false;
  }

  async function fillStable(profile, opts) {
    if (!isZhaopin() && !isPhoenix()) return fill(profile,opts);
    const satisfied=e=>{
      const v=valueFor(profile,e.type,e.field,e.idx);if(!v)return false;
      if(isPhoenix()) {
        if(e.kind==='phoenixRadio')return [...e.el.querySelectorAll('.phoenix-radio--checked')].some(n=>aliasSet(v).includes(norm(txt(n))));
        const shown=phoenixDisplay(e.el) || e.el.value || '';
        if(/^(gpaMax|gpaScore)$/.test(e.field) && /^\d+(?:\.\d+)?$/.test(shown))return Number(shown)===Number(v);
        if(e.kind==='datepicker') {const digits=digitsOf(shown);return digits.length>=6 && digitsOf(v).startsWith(digits);}
        if(/籍贯|户口所在地|现居住地|工作城市/.test(e.label)) {
          const key=t=>norm(t).replace(/[\/＞>]/g,'').replace(/特别行政区|维吾尔自治区|壮族自治区|回族自治区|自治区|省|市|区|县/g,'');
          const wanted=key(String(v).split(/[、,，;；]/)[0]),actual=key(shown);
          return actual.length>=2 && (actual.includes(wanted) || wanted.endsWith(actual));
        }
        if(e.label==='资格证书名称' && /其他/.test(shown))return true;
        if(e.label==='奖励级别')return norm(shown).replace(/^取得/,'').replace(/荣誉奖励$/,'')===norm(v);
        return aliasSet(v).includes(norm(shown));
      }
      return 'value' in e.el && aliasSet(v).includes(norm(e.el.value));
    };
    const results=[];
    const started=performance.now();
    for(let pass=0;pass<3;pass++) {
      const result=await fill(profile,{...(opts || {}),expand:false}); results.push(result);
      await wait(650);
      const root=(opts && opts.root) || document;
      const pending=buildEntries(root,profile,'enhanced').filter(e=>!concealed(e.el) && (!opts?.rect || inRegion(e.el,opts.rect))).filter(e=>{
        const value=valueFor(profile,e.type,e.field,e.idx);
        return value && ((!satisfied(e)) || (isZhaopin() && e.field==='school' && isSuggestInput(e.el) && confirmedZhaopin.get(e.el)!==String(value)));
      });
      if((isPhoenix() || pass>=1) && !pending.length) break;
    }
    const latest=results[results.length-1];
    const logs=new Map();
    results.forEach(r=>r.log.forEach(item=>logs.set(item.label+'|'+item.value,item)));
    const finalEntries=buildEntries((opts && opts.root)||document,profile,'enhanced').filter(e=>!concealed(e.el) && (!opts?.rect || inRegion(e.el,opts.rect)));
    const complete=new Set(finalEntries.filter(satisfied).map(e=>e.label));
    const log=[...logs.values()].filter(item=>complete.has(item.label));
    const noData=finalEntries.filter(e=>!valueFor(profile,e.type,e.field,e.idx)).map(e=>e.label+'（第'+(e.idx+1)+'条）');
    const skipped=finalEntries.filter(e=>valueFor(profile,e.type,e.field,e.idx) && !satisfied(e)).map(e=>({label:e.label,reason:'网页重绘后仍未保留预期值',el:e.el}));
    const undo=()=>results.reduceRight((n,r)=>n+r.undo(),0);
    return {...latest,log,noData,skipped,filled:log.length,ms:Math.round(performance.now()-started),undo};
  }

  TT.engine = {
    fill: fillStable, buildEntries, valueFor, labelParts, sectionOf, visible,
    _typeToFilter: typeToFilter,
    popupOptions, fillPicker, retryPicker, inferFieldByOptions,
    previewRegion, remapEntries, mirrorField,
    // 调试用（面板「复制诊断」也会用到）：单步执行某个控件
    _fillDatePicker: fillDatePicker, _pickFromPanel: pickFromPanel,
    _findDatePanel: findDatePanel, _shownValue: shownValue, _dateShown: dateShown,
    _granularityOf: granularityOf, _panelView: panelView, _dateFor: dateFor,
  };
})();
