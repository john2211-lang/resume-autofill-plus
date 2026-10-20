/* 右侧悬浮面板（影子 DOM，隔离站点样式） */
(function () {
  const TT = (window.__TT__ = window.__TT__ || {});
  if (TT.panel) return;

  const CSS = `
  :host{all:initial}
  *{box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif}
  .wrap{position:fixed;right:12px;top:50%;transform:translateY(-50%);z-index:2147483000;
    display:flex;flex-direction:column;align-items:flex-end;gap:8px}
  .card{width:158px;background:#fff;border-radius:14px;box-shadow:0 8px 30px rgba(15,40,60,.18),0 1px 3px rgba(15,40,60,.10);
    border:1px solid rgba(16,185,170,.18);padding:10px 9px 12px;display:flex;flex-direction:column;gap:7px}
  .head{display:flex;align-items:center;gap:6px;padding:0 2px 4px}
  .dot{width:8px;height:8px;border-radius:50%;background:#16b8a6;box-shadow:0 0 0 3px rgba(22,184,166,.15)}
  .title{font-size:12px;font-weight:700;color:#0f3b3a;letter-spacing:.2px;flex:1}
  .mini{width:16px;height:16px;line-height:14px;text-align:center;border-radius:5px;border:none;background:#f0f5f5;color:#7b9090;font-size:12px;cursor:pointer;padding:0}
  .mini:hover{background:#e3eeee;color:#0f3b3a}
  .profile{background:#f4faf9;border:1px solid #dcf0ed;border-radius:9px;padding:6px 8px;cursor:pointer}
  .pname{font-size:12px;font-weight:700;color:#0f3b3a;display:flex;justify-content:space-between;align-items:center}
  .pmeta{font-size:10px;color:#6b8a88;margin-top:2px;line-height:1.4;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
  .btn{border:none;border-radius:9px;padding:8px 8px;font-size:12px;font-weight:600;cursor:pointer;
    background:linear-gradient(180deg,#2fc4b2,#16b8a6);color:#fff;box-shadow:0 2px 6px rgba(22,184,166,.28);transition:.15s;display:flex;align-items:center;justify-content:center;gap:4px}
  .btn:hover{filter:brightness(1.06);transform:translateY(-1px)}
  .btn:active{transform:translateY(0)}
  .btn.ghost{background:#fff;color:#12897c;border:1px solid #bfe8e2;box-shadow:none}
  .btn.ghost:hover{background:#f2fbfa}
  .btn.small{font-size:11px;padding:6px 6px;font-weight:500}
  .row{display:flex;gap:6px}
  .row .btn{flex:1}
  .foot{display:flex;gap:6px;margin-top:1px}
  .foot .btn{flex:1;font-size:10.5px;padding:5px 4px;background:#f6f9f9;color:#5d7a78;border:1px solid #e6efee;box-shadow:none;font-weight:500}
  .foot .btn:hover{background:#eef6f5;color:#12897c}
  .ball{width:44px;height:44px;border-radius:50%;background:linear-gradient(160deg,#2fc4b2,#0fa192);color:#fff;
    display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;cursor:pointer;
    box-shadow:0 6px 18px rgba(15,150,138,.4);border:2px solid #fff;letter-spacing:.5px;user-select:none}
  .ball:hover{transform:scale(1.06)}
  .toast{position:fixed;top:18px;left:50%;transform:translateX(-50%);z-index:2147483001;background:rgba(20,40,45,.92);color:#fff;
    padding:9px 16px;border-radius:10px;font-size:13px;box-shadow:0 8px 24px rgba(0,0,0,.2);max-width:82vw;text-align:center;line-height:1.5}
  .toast b{color:#5ff0d8}
  .toast a{color:#7ce8d8;text-decoration:underline;cursor:pointer;margin-left:4px}
  .drawer{position:fixed;right:0;top:0;bottom:0;width:320px;max-width:88vw;background:#fff;z-index:2147483002;
    box-shadow:-8px 0 30px rgba(15,40,60,.18);display:flex;flex-direction:column;font-size:12px}
  .drawer h3{margin:0;padding:14px 16px;font-size:13px;color:#0f3b3a;border-bottom:1px solid #eef4f3;display:flex;justify-content:space-between;align-items:center}
  .drawer .body{padding:10px 8px;overflow:auto;flex:1}
  .drawer .item{display:flex;justify-content:space-between;gap:8px;padding:7px 8px;border-bottom:1px dashed #f0f5f4}
  .drawer .k{color:#6b8a88;flex:0 0 40%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .drawer .v{color:#123;flex:1;text-align:right;word-break:break-all}
  .drawer .empty{color:#9bb0ae;text-align:center;padding:30px 0}
  .drawer .bar{padding:10px 12px;border-top:1px solid #eef4f3;display:flex;gap:8px}
  .drawer .bar .btn{flex:1}
  .fb{padding:12px}
  .fb textarea{width:100%;height:110px;border:1px solid #dbe9e7;border-radius:8px;padding:8px;font-size:12px;resize:vertical;outline:none}
  .fb textarea:focus{border-color:#16b8a6}
  .tip{color:#9bb0ae;font-size:11px;margin:6px 2px 10px;line-height:1.5}
  .region-layer{position:fixed;left:0;top:0;right:0;bottom:0;z-index:2147483003;cursor:crosshair;background:rgba(12,32,38,.20)}
  .region-box{position:fixed;display:none;border:2px solid #16b8a6;background:rgba(22,184,166,.12);border-radius:4px;pointer-events:none}
  .region-mark{position:fixed;border:2px dashed #16b8a6;background:rgba(22,184,166,.08);border-radius:4px;pointer-events:none;z-index:2147483003}
  .region-tip{position:fixed;top:18px;left:50%;transform:translateX(-50%);background:rgba(20,40,45,.92);color:#fff;
    padding:9px 18px;border-radius:10px;font-size:13px;box-shadow:0 8px 24px rgba(0,0,0,.25)}
  .pick{position:fixed;z-index:2147483004;width:264px;background:#fff;border-radius:12px;
    box-shadow:0 10px 34px rgba(15,40,60,.24),0 1px 3px rgba(15,40,60,.12);border:1px solid rgba(16,185,170,.2);
    padding:11px 12px 12px;font-size:12px;color:#123;display:flex;flex-direction:column;gap:8px}
  .pick h4{margin:0;font-size:12.5px;color:#0f3b3a;display:flex;justify-content:space-between;align-items:center}
  .pick .fld{display:flex;flex-direction:column;gap:4px}
  .pick label{font-size:11px;color:#6b8a88}
  .pick select{width:100%;border:1px solid #dbe9e7;border-radius:8px;padding:6px 7px;font-size:12px;outline:none;background:#fff;color:#123}
  .pick select:focus{border-color:#16b8a6}
  .pick .pv{max-height:132px;overflow:auto;background:#f7fbfb;border:1px solid #e6f1f0;border-radius:8px;padding:6px 8px;
    font-size:11px;color:#4d6b69;line-height:1.6;word-break:break-all}
  .pick .pv b{color:#0f8b7d;font-weight:600}
  .pick .bar{display:flex;gap:8px}
  .pick .bar .btn{flex:1;padding:7px 6px;font-size:12px}
  .skip{color:#c0603f}
  .dbg{color:#8fa4a2;font-size:10.5px;line-height:1.45;padding:0 8px 6px;word-break:break-all}
  .dbg.mono{font-family:ui-monospace,Consolas,monospace;color:#7a8f9c;background:#f7fbfa;border-radius:4px;margin:0 8px 6px;padding:4px 6px}
  .drawer .body{overflow:auto;flex:1}
  .revive{position:fixed;right:10px;bottom:16px;width:14px;height:14px;border-radius:50%;
    background:rgba(22,184,166,.42);border:1px solid rgba(255,255,255,.7);cursor:pointer;z-index:2147483000}
  .revive:hover{background:rgba(22,184,166,.9)}
  `;

  const state = { open: true, profile: null, last: null, hidden: false, lastRegion: { type: '', idx: 0 } };

  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      if (k === 'class') el.className = attrs[k];
      else if (k === 'text') el.textContent = attrs[k];
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), attrs[k]);
      else el.setAttribute(k, attrs[k]);
    }
    for (const kid of kids) if (kid) el.appendChild(kid);
    return el;
  }

  function toast(msg, ms) {
    const host = TT.host;
    if (!host) return null;
    let t = host.querySelector('.toast');
    if (t) t.remove();
    t = h('div', { class: 'toast' });
    t.innerHTML = msg;
    host.appendChild(t);
    if (ms) setTimeout(() => t.remove(), ms);
    return t;
  }

  function fmtProfile(p) {
    const name = (p.basic && p.basic.name) || p.name || '未命名';
    const edu = (p.educations && p.educations[0]) || {};
    const job = p.job || {};
    return { name, meta: [edu.school, edu.major, edu.education].filter(Boolean).join(' · ') || '未填写教育经历', job: job.position || '' };
  }

  /* 深度合并：只补 stored 里缺失的键，已有值一律不动（不覆盖用户自己改过的内容） */
  function mergeMissing(stored, seed) {
    if (seed == null) return stored;
    if (stored == null) return seed;
    if (Array.isArray(seed)) {
      if (!Array.isArray(stored)) return seed;
      const out = [];
      for (let i = 0; i < stored.length; i++) out.push(i < seed.length ? mergeMissing(stored[i], seed[i]) : stored[i]);
      for (let i = stored.length; i < seed.length; i++) out.push(seed[i]);
      return out;
    }
    if (typeof seed === 'object') {
      if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return seed;
      const out = Object.assign({}, stored);
      for (const k of Object.keys(seed)) {
        if (out[k] === undefined || out[k] === null || out[k] === '') out[k] = seed[k];
        else if (typeof seed[k] === 'object') out[k] = mergeMissing(out[k], seed[k]);
      }
      return out;
    }
    return stored;
  }

  async function loadProfile() {
    const r = await chrome.storage.local.get(['tt_profile']);
    let p = r.tt_profile || null;
    const hasData = p && (Object.values(p.basic || {}).some(v => String(v || '').trim()) ||
      ['educations','internships','projects','campus','awards','family'].some(k => (p[k] || []).length));
    if (!hasData) {
      try {
        const res = await fetch(chrome.runtime.getURL('data/seed-profile.json'));
        if (res.ok) {
          p = await res.json();
          await chrome.storage.local.set({tt_profile: p, tt_profile_updated: Date.now()});
        }
      } catch (e) {}
    }
    if (TT.upgradeEducationData) await TT.upgradeEducationData(p);
    state.profile = p;
    return p;
  }

  function openOptions() {
    chrome.runtime.sendMessage({ type: 'OPEN_OPTIONS' });
  }

  function render() {
    const host = TT.host;
    if (!host) return;
    host.innerHTML = '';
    const style = h('style', { text: CSS });
    host.appendChild(style);

    if (state.hidden) {
      /* 误点了「本页不再显示」也得能找回来：右下角留一个小圆点，点一下恢复 */
      const revive = h('div', { class: 'revive', title: '点一下显示网申速填面板' });
      revive.addEventListener('click', async () => {
        state.hidden = false;
        state.open = true;
        try {
          const r = await chrome.storage.local.get(['tt_hidden']);
          const list = new Set(r.tt_hidden || []);
          list.delete(location.hostname);
          await chrome.storage.local.set({ tt_hidden: [...list] });
        } catch (e) {}
        render();
      });
      host.appendChild(revive);
      return;
    }
    const wrap = h('div', { class: 'wrap' });

    if (!state.open) {
      const ball = h('div', { class: 'ball', title: '网申速填', text: '速填' });
      ball.addEventListener('click', () => {
        state.open = true;
        render();
      });
      wrap.appendChild(ball);
      host.appendChild(wrap);
      return;
    }

    const card = h('div', { class: 'card' });
    const head = h('div', { class: 'head' });
    head.appendChild(h('div', { class: 'dot' }));
    head.appendChild(h('div', { class: 'title', text: '网申速填 1.1.16' }));
    const minBtn = h('button', { class: 'mini', title: '收起', text: '—' });
    minBtn.addEventListener('click', () => {
      state.open = false;
      render();
    });
    head.appendChild(minBtn);
    const closeBtn = h('button', { class: 'mini', title: '本页不再显示', text: '×' });
    closeBtn.addEventListener('click', async () => {
      state.hidden = true;
      const r = await chrome.storage.local.get(['tt_hidden']);
      const list = new Set(r.tt_hidden || []);
      list.add(location.hostname);
      await chrome.storage.local.set({ tt_hidden: [...list] });
      render();
    });
    head.appendChild(closeBtn);
    card.appendChild(head);

    const f = state.profile ? fmtProfile(state.profile) : null;
    const prof = h('div', { class: 'profile', title: '编辑简历资料库' });
    prof.appendChild(h('div', { class: 'pname', text: f ? f.name : '尚未录入简历' }));
    prof.appendChild(h('div', { class: 'pmeta', text: f ? f.meta + (f.job ? ' · 意向：' + f.job : '') : '点击录入或导入本地简历数据' }));
    prof.addEventListener('click', openOptions);
    card.appendChild(prof);

    const b1 = h('button', { class: 'btn', text: '一键填入' });
    b1.addEventListener('click', () => doFill('basic'));
    card.appendChild(b1);

    const b2 = h('button', { class: 'btn ghost', text: '增强填入' });
    b2.addEventListener('click', () => doFill('enhanced'));
    card.appendChild(b2);

    const b3 = h('button', { class: 'btn ghost small', text: '选区填入（框选后选类别）' });
    b3.addEventListener('click', startRegionSelect);
    card.appendChild(b3);
    const stopButton=h('button',{class:'btn ghost',text:'停止填写'});
    stopButton.style.color='#c23b31';
    stopButton.addEventListener('click',stopFill);
    card.appendChild(stopButton);

    const foot = h('div', { class: 'foot' });
    const hist = h('button', { class: 'btn', text: '填写记录' });
    hist.addEventListener('click', openHistory);
    const fb = h('button', { class: 'btn', text: '建议反馈' });
    fb.addEventListener('click', openFeedback);
    foot.appendChild(hist);
    foot.appendChild(fb);
    card.appendChild(foot);

    wrap.appendChild(card);
    host.appendChild(wrap);
  }

  function openHistory() {
    const host = TT.host;
    const old = host.querySelector('.drawer');
    if (old) {
      old.remove();
      return;
    }
    const d = h('div', { class: 'drawer' });
    const bar = h('h3');
    bar.appendChild(h('span', { text: '填写记录' }));
    const x = h('button', { class: 'mini', text: '×' });
    x.addEventListener('click', () => d.remove());
    bar.appendChild(x);
    d.appendChild(bar);
    const body = h('div', { class: 'body' });
    const last = state.last;
    if (!last || !last.log || !last.log.length) {
      body.appendChild(h('div', { class: 'empty', text: '本页还没有填写记录' }));
    } else {
      body.appendChild(h('div', { class: 'tip', text: last.time + ' · 共填入 ' + last.filled + ' 项 · 耗时 ' + (last.ms / 1000).toFixed(1) + ' 秒' }));
      // 识别清单：一眼看出「页面上哪些字段被认出来了、归到哪条记录」
      if (last.recognized && last.recognized.length) {
        body.appendChild(h('div', { class: 'tip', text: '识别 ' + last.recognized.length + ' 项：' }));
        for (const r of last.recognized) body.appendChild(h('div', { class: 'dbg mono', text: r }));
      }
      for (const it of last.log) {
        const row = h('div', { class: 'item' });
        row.appendChild(h('div', { class: 'k', text: it.label }));
        row.appendChild(h('div', { class: 'v', text: it.value }));
        body.appendChild(row);
      }
      if (last.noData && last.noData.length) {
        body.appendChild(h('div', { class: 'tip', text: '认出来了但简历里没数据的 ' + last.noData.length + ' 项：' }));
        for (const r of last.noData) body.appendChild(h('div', { class: 'dbg mono', text: r }));
      }
      if (last.dropped && last.dropped.length) {
        body.appendChild(h('div', { class: 'tip', text: '没认出来的 ' + last.dropped.length + ' 个控件：' }));
        for (const r of last.dropped) body.appendChild(h('div', { class: 'dbg mono', text: r }));
      }
      if (last.skipped && last.skipped.length) {
        body.appendChild(h('div', { class: 'tip', text: '没填上的 ' + last.skipped.length + ' 项：' }));
        for (const it of last.skipped) {
          const row = h('div', { class: 'item' });
          row.appendChild(h('div', { class: 'k', text: it.label }));
          row.appendChild(h('div', { class: 'v skip', text: it.reason }));
          body.appendChild(row);
          if (it.debug) body.appendChild(h('div', { class: 'dbg', text: describeDebug(it.debug) }));
          // 控件真实结构（截断）：排查「为什么这个下拉没选上」时最有用
          if (it.el && it.el.outerHTML) {
            body.appendChild(h('div', { class: 'dbg mono', text: '控件: ' + String(it.el.outerHTML).replace(/\s+/g, ' ').slice(0, 220) }));
            const wrap = it.el.parentElement;
            if (wrap && wrap.outerHTML) {
              body.appendChild(h('div', { class: 'dbg mono', text: '外层: ' + String(wrap.outerHTML).replace(/\s+/g, ' ').slice(0, 420) }));
            }
          }
        }
      }
    }
    d.appendChild(body);
    const retryable = (state.last && state.last.skipped || []).filter((s) => s.el && s.value);
    if (retryable.length) {
      const bar0 = h('div', { class: 'bar' });
      const retry = h('button', { class: 'btn', text: '重试没填上的 ' + retryable.length + ' 项' });
      retry.addEventListener('click', async () => {
        retry.disabled = true;
        retry.textContent = '正在重试…';
        if(state.fillPromise){retry.disabled=false;toast('请先停止或等待当前填写',2200);return;}
        state.stopRequested=false;
        const job=TT.engine.retryBatch(retryable,state.profile);state.fillPromise=job;
        try {const ok=await job;toast('重试成功 '+ok+' 项',3000);d.remove();}
        catch(e){toast(e.name==='AbortError'?'已停止填写，保留已填内容':'重试失败：'+e.message,3000);}
        finally {state.fillPromise=null;retry.disabled=false;retry.textContent='重试没填上的 '+retryable.length+' 项';}

      });
      bar0.appendChild(retry);
      d.appendChild(bar0);
    }
    const bot = h('div', { class: 'bar' });
    const undo = h('button', { class: 'btn ghost', text: '撤销本次填写' });
    undo.addEventListener('click', () => {
      if (state.last && state.last.undo) {
        const n = state.last.undo();
        toast('已撤销 ' + n + ' 项填写', 2200);
        state.last = null;
        d.remove();
      }
    });
    const again = h('button', { class: 'btn', text: '重新填写' });
    again.addEventListener('click', () => {
      d.remove();
      doFill((state.last && state.last.mode) || 'basic');
    });
    bot.appendChild(undo);
    bot.appendChild(again);
    d.appendChild(bot);
    host.appendChild(d);
  }

  /* 把下拉失败的诊断信息压成一行，方便自己判断也方便复制回来排查 */
  function describeDebug(g) {
    if (!g) return '';
    const bits = [];
    if (g.options) {
      bits.push('选项 ' + g.options + ' 个' + (g.sample && g.sample.length ? '：' + g.sample.slice(0, 4).join(' / ') : ''));
    } else {
      bits.push('没弹出选项');
    }
    if (g.popupClass && g.popupClass.length) bits.push('弹层 ' + g.popupClass.join(' , '));
    if (g.strategies && g.strategies.length) bits.push('尝试 ' + g.strategies.join(' → '));
    return bits.join('｜');
  }

  function openFeedback() {
    const host = TT.host;
    const d = h('div', { class: 'drawer' });
    const bar = h('h3');
    bar.appendChild(h('span', { text: '建议反馈' }));
    const x = h('button', { class: 'mini', text: '×' });
    x.addEventListener('click', () => d.remove());
    bar.appendChild(x);
    d.appendChild(bar);
    const box = h('div', { class: 'fb' });
    const ta = h('textarea', { placeholder: '哪一页没填对？比如「XX 招聘网的学历下拉没选中」，写下来会更好改。' });
    box.appendChild(ta);
    box.appendChild(h('div', { class: 'tip', text: '反馈只保存在本机（chrome.storage），不会上传到任何服务器。' }));
    const bar2 = h('div', { class: 'row' });
    const save = h('button', { class: 'btn', text: '保存反馈' });
    save.addEventListener('click', async () => {
      const text = ta.value.trim();
      if (!text) return;
      const r = await chrome.storage.local.get(['tt_feedback']);
      const list = r.tt_feedback || [];
      list.push({ text, site: location.hostname, url: location.href, time: new Date().toLocaleString() });
      await chrome.storage.local.set({ tt_feedback: list });
      toast('反馈已记录，谢谢', 1800);
      d.remove();
    });
    const copy = h('button', { class: 'btn ghost', text: '复制诊断' });
    copy.addEventListener('click', async () => {
      const lines = ['站点: ' + location.origin + location.pathname, '时间: ' + new Date().toLocaleString(), ''];
      const entries = TT.engine ? TT.engine.buildEntries(document, state.profile || {}, 'enhanced') : [];
      lines.push('【字段识别】共 ' + entries.length + ' 项');
      for (const e of entries) {
        lines.push(e.type + '.' + e.field + ' <= ' + e.label + ' [' + e.section + '] (' + e.kind + ') 第' + (e.idx + 1) + '条 数据:' + (TT.engine.valueFor(state.profile || {}, e.type, e.field, e.idx) ? '有' : '缺失'));
      }
      const last = state.last;
      if (last) {
        lines.push('', '【本次填写】填入 ' + last.filled + ' 项，未填 ' + ((last.skipped || []).length) + ' 项');
        lines.push('【缺少资料】' + ((last.noData || []).join('；') || '无'));
        for (const s of last.skipped || []) {
          lines.push('- ' + s.label + '：' + s.reason);
          const wrap = s.el && s.el.parentElement && s.el.parentElement.parentElement;
        }
      }
      try {
        await navigator.clipboard.writeText(lines.join('\n'));
        toast('已复制诊断信息，粘给我就能定位问题', 2400);
      } catch (err) {
        toast('复制失败，请手动反馈', 1800);
      }
    });
    bar2.appendChild(save);
    bar2.appendChild(copy);
    box.appendChild(bar2);
    d.appendChild(box);
    host.appendChild(d);
  }

  function stopFill() {
    if(!state.fillPromise){toast('当前没有正在进行的填写',1800);return;}
    state.stopRequested=true;TT.engine.stop();
    if(state.cleanupProgress)state.cleanupProgress();
    toast('已停止填写，保留已填内容',2600);
  }

  function doFill(mode, rect, force) {
    if (state.fillPromise) {toast('正在填写，请等待完成后再操作',2200); return state.fillPromise;}
    state.stopRequested=false;
    const job = Promise.resolve().then(()=>performFill(mode,rect,force));
    state.fillPromise = job.finally(()=>{state.fillPromise=null;});
    return state.fillPromise;
  }

  async function performFill(mode, rect, force) {
    await loadProfile();
    if(state.stopRequested)return;
    if (!state.profile) {
      toast('还没有简历资料，<a>点这里录入</a>', 6000);
      const a = TT.host.querySelector('.toast a');
      if (a) a.addEventListener('click', openOptions);
      return;
    }
    const t0 = performance.now();
    const tip = toast('正在填写并等待网页更新，请等待完成… <b>0 秒</b>');
    const timer = setInterval(() => {
      const s = ((performance.now() - t0) / 1000).toFixed(0);
      if (tip && tip.isConnected) progressText.textContent = '正在填写并等待网页更新… '+s+' 秒';
    }, 400);
    const stopButton=h('button',{text:'停止填写'});
    stopButton.style.cssText='margin-left:12px;cursor:pointer;color:#a22;background:white;border:0;border-radius:4px;padding:4px 8px';
    stopButton.addEventListener('click',stopFill);
    // The timer updates only the text, keeping the stop control clickable.
    const progressText=h('span',{text:'正在填写并等待网页更新… 0 秒'});
    if(tip)tip.replaceChildren(progressText,stopButton);
    const cleanup=()=>{clearInterval(timer);if(tip)tip.remove();};state.cleanupProgress=cleanup;
    try {
      const res = await TT.engine.fill(state.profile, Object.assign({ mode, rect }, force || {}));
      clearInterval(timer);
      const sec = ((performance.now() - t0) / 1000).toFixed(1);
      if (!res.filled) {
        toast('这个范围内没找到可填字段', 4200);
      } else if ((res.noData || []).length) {
        toast('已填入 <b>' + res.filled + '</b> 项，<b>' + res.noData.length + '</b> 项缺少资料（建议反馈里可复制诊断）',5200);
      } else if (res.skipped && res.skipped.length) {
        toast(
          '已填入 <b>' + res.filled + '</b> 项，<b>' + res.skipped.length + '</b> 项没填上（看「填写记录」）',
          5200
        );
      } else {
        toast('已填入 <b>' + res.filled + '</b> 项，耗时 <b>' + sec + '</b> 秒', 3200);
      }
      state.last = {
        filled: res.filled, ms: res.ms, log: res.log, skipped: res.skipped, noData: res.noData || [], undo: res.undo, mode,
        time: new Date().toLocaleString(),
      };
      if (tip) tip.remove();
      return res;
    } catch (e) {
      clearInterval(timer);
      toast(e.name==='AbortError'?'已停止填写，保留已填内容':'填写出错：' + (e && e.message ? e.message : e), 4000);
      if(e.name!=='AbortError')console.error('[网申速填]', e);
      return null;
    } finally {cleanup();if(state.cleanupProgress===cleanup)state.cleanupProgress=null;}
  }

  /* 选区填入：拖出一个矩形，只填这个区域里的字段 */
  /* 框选完成后：先让用户确认「这块区域按哪类信息来填」，用于纠正识别错的板块 */
  async function openRegionPick(rect) {
    const host = TT.host;
    if (!host) return;
    if (!state.profile) await loadProfile();
    const old = host.querySelector('.pick');
    if (old) old.remove();

    const TYPES = (TT.TYPE_NAMES || []).slice();
    const isList = (t) => !!(TT.LISTS && TT.LISTS[t]);
    const typeName = (t) => {
      const f = TYPES.find((x) => x.type === t);
      return f ? f.name.replace(/（.*/, '') : t;
    };

    const mark = h('div', { class: 'region-mark' });
    mark.style.left = rect.left + 'px';
    mark.style.top = rect.top + 'px';
    mark.style.width = rect.right - rect.left + 'px';
    mark.style.height = rect.bottom - rect.top + 'px';
    host.appendChild(mark);

    const card = h('div', { class: 'pick' });
    // 位置：贴着选区右下角；放不下就贴右上角
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let left = Math.min(rect.left, vw - 280);
    let top = rect.bottom + 10;
    if (top + 240 > vh) top = Math.max(10, rect.top - 250);
    card.style.left = Math.max(8, left) + 'px';
    card.style.top = Math.max(8, top) + 'px';

    const bar0 = h('h4');
    bar0.appendChild(h('span', { text: '框选区域 · 选择填充类别' }));
    const x = h('button', { class: 'mini', text: '×' });
    bar0.appendChild(x);
    card.appendChild(bar0);

    let pv = null;
    try {
      pv = TT.engine.previewRegion(state.profile || {}, rect);
    } catch (e) {}
    card.appendChild(h('div', { class: 'tip', style: 'margin:0', text: pv ? '识别到 ' + pv.total + ' 个可填字段' : '' }));

    const f1 = h('div', { class: 'fld' });
    f1.appendChild(h('label', { text: '这块区域填哪类信息' }));
    const sel1 = h('select');
    for (const t of TYPES) {
      const o = h('option', { value: t.type, text: t.name });
      sel1.appendChild(o);
    }
    sel1.value = (state.lastRegion && state.lastRegion.type) || '';
    f1.appendChild(sel1);
    card.appendChild(f1);

    const f2 = h('div', { class: 'fld' });
    const lb2 = h('label', { text: '从简历第几条开始（选区里有多个块时依次往后）' });
    f2.appendChild(lb2);
    const sel2 = h('select');
    const keepIdx = ((state.lastRegion && state.lastRegion.idx) || 0);
    // 条数按简历里实际有几条生成，避免选到空记录
    const fillIdxOptions = (t) => {
      const key = TT.LISTS && TT.LISTS[t];
      const list = key && state.profile ? state.profile[key] || [] : [];
      const n = Math.max(1, Math.min(list.length || 1, 8));
      sel2.innerHTML = '';
      for (let i = 1; i <= n; i++) sel2.appendChild(h('option', { value: String(i), text: '第 ' + i + ' 条' }));
      sel2.value = String(Math.min(keepIdx, n - 1) + 1);
      lb2.textContent = isList(t) && list.length
        ? '从简历第几条开始（该类别共 ' + list.length + ' 条）'
        : '从简历第几条开始';
    };
    f2.appendChild(sel2);
    card.appendChild(f2);

    const pvBox = h('div', { class: 'pv' });
    card.appendChild(pvBox);

    const refresh = () => {
      const t = sel1.value;
      f2.style.display = isList(t) ? '' : 'none';
      if (isList(t)) fillIdxOptions(t);
      if (!t) {
        pvBox.innerHTML = '将按页面标签<b>自动识别</b>每块属于哪类';
        ok2.textContent = '确认填入';
        return;
      }
      ok2.textContent = '按「' + typeName(t) + '」填入';
      let p = null;
      try {
        p = TT.engine.previewRegion(state.profile || {}, rect, t);
      } catch (e) {}
      const ok = p ? p.after : 0;
      const lines = (p && p.labels ? p.labels.slice(0, 8) : []).map((s) => '· ' + s);
      pvBox.innerHTML =
        '<b>' + typeName(t) + '</b>：可填 ' + ok + ' 项' + (p && p.after < p.total ? '（' + (p.total - p.after) + ' 项认不出类别会跳过）' : '') +
        (lines.length ? '<br>' + lines.join('<br>') : '');
    };
    sel1.addEventListener('change', refresh);

    const bar = h('div', { class: 'bar' });
    const cancel = h('button', { class: 'btn ghost', text: '取消' });
    const ok2 = h('button', { class: 'btn', text: '确认填入' });
    bar.appendChild(cancel);
    bar.appendChild(ok2);
    card.appendChild(bar);
    host.appendChild(card);

    const close = () => {
      card.remove();
      mark.remove();
      document.removeEventListener('keydown', onKey, true);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        close();
        toast('已取消选区', 1500);
      } else if (e.key === 'Enter') {
        ok2.click();
      }
    };
    x.addEventListener('click', () => close());
    cancel.addEventListener('click', () => close());
    ok2.addEventListener('click', async () => {
      const t = sel1.value;
      const idx = parseInt(sel2.value, 10) - 1;
      state.lastRegion = { type: t, idx: idx < 0 ? 0 : idx };
      close();
      ok2.disabled = true;
      await doFill('region', rect, t ? { forceType: t, forceIdx: idx < 0 ? 0 : idx } : null);
    });
    document.addEventListener('keydown', onKey, true);
    refresh();
    sel1.focus();
  }

  function startRegionSelect() {
    if (!TT.host || TT.host.querySelector('.region-layer')) return;
    const layer = h('div', { class: 'region-layer' });
    const box = h('div', { class: 'region-box' });
    const tip = h('div', { class: 'region-tip', text: '按住鼠标拖出要填写的区域（Esc 取消）' });
    layer.appendChild(box);
    layer.appendChild(tip);
    TT.host.appendChild(layer);

    let sx = 0;
    let sy = 0;
    let dragging = false;

    const paint = (x, y) => {
      box.style.left = Math.min(sx, x) + 'px';
      box.style.top = Math.min(sy, y) + 'px';
      box.style.width = Math.abs(x - sx) + 'px';
      box.style.height = Math.abs(y - sy) + 'px';
    };
    const onDown = (e) => {
      e.preventDefault();
      dragging = true;
      sx = e.clientX;
      sy = e.clientY;
      box.style.display = 'block';
      paint(e.clientX, e.clientY);
    };
    const onMove = (e) => {
      if (dragging) paint(e.clientX, e.clientY);
    };
    const onUp = (e) => {
      if (!dragging) return;
      dragging = false;
      const rect = {
        left: Math.min(sx, e.clientX),
        top: Math.min(sy, e.clientY),
        right: Math.max(sx, e.clientX),
        bottom: Math.max(sy, e.clientY),
      };
      cleanup();
      if (rect.right - rect.left < 40 || rect.bottom - rect.top < 30) {
        toast('选区太小了，请重新框选', 2000);
        return;
      }
      openRegionPick(rect);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        cleanup();
        toast('已取消选区', 1500);
      }
    };
    function cleanup() {
      layer.remove();
      document.removeEventListener('mousemove', onMove, true);
      document.removeEventListener('mouseup', onUp, true);
      document.removeEventListener('keydown', onKey, true);
    }
    layer.addEventListener('mousedown', onDown);
    document.addEventListener('mousemove', onMove, true);
    document.addEventListener('mouseup', onUp, true);
    document.addEventListener('keydown', onKey, true);
  }

  TT.panel = { render, doFill, toast, state, loadProfile, startRegionSelect, openRegionPick };

  TT.mountPanel = async function () {
    if (document.getElementById('tt-fill-host')) return;
    const r = await chrome.storage.local.get(['tt_hidden']);
    const hidden = new Set(r.tt_hidden || []);
    state.hidden = hidden.has(location.hostname);
    const host = document.createElement('div');
    host.id = 'tt-fill-host';
    document.documentElement.appendChild(host);
    TT.host = host.attachShadow({ mode: 'open' });
    TT.hostEl = host;
    await loadProfile();
    render();
  };
})();
