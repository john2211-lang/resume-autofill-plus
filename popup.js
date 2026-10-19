async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

function fmt(p) {
  if (!p) return { name: '尚未录入简历', meta: '点击下方「打开简历资料库」录入或导入' };
  const edu = (p.educations && p.educations[0]) || {};
  return {
    name: (p.basic && p.basic.name) || p.name || '未命名',
    meta: [edu.school, edu.major, edu.education].filter(Boolean).join(' · ') || '尚未填写教育经历',
  };
}

async function boot() {
  const r = await chrome.storage.local.get(['tt_profile']);
  const f = fmt(r.tt_profile);
  document.getElementById('name').textContent = f.name;
  document.getElementById('meta').textContent = f.meta;

  const tab = await activeTab();
  try {
    const res = await chrome.tabs.sendMessage(tab.id, { type: 'TT_PING' });
    document.getElementById('count').textContent = res && res.fields
      ? '本页识别到 ' + res.fields + ' 个可填字段'
      : '本页暂未识别到表单字段';
  } catch (e) {
    document.getElementById('count').textContent = '当前页面无法注入（chrome:// 页面或扩展商店页）';
  }

  const send = async (mode) => {
    const t = await activeTab();
    try {
      await chrome.tabs.sendMessage(t.id, { type: 'TT_FILL', mode });
      window.close();
    } catch (e) {
      alert('当前页面没有注入成功，请刷新页面后再试。');
    }
  };
  document.getElementById('fill').onclick = () => send('basic');
  document.getElementById('fillAll').onclick = () => send('enhanced');
  document.getElementById('region').onclick = async () => {
    const t = await activeTab();
    try {
      await chrome.tabs.sendMessage(t.id, { type: 'TT_REGION' });
      window.close();
    } catch (e) {
      alert('当前页面没有注入成功，请刷新页面后再试。');
    }
  };
  document.getElementById('showPanel').onclick = async () => {
    const t = await activeTab();
    try {
      // 先把它从「本页不再显示」里摘出来，再让页面重新渲染面板
      const r2 = await chrome.storage.local.get(['tt_hidden']);
      let host = '';
      try { host = new URL(t.url).hostname; } catch (e) {}
      if (host) {
        const list = new Set(r2.tt_hidden || []);
        list.delete(host);
        await chrome.storage.local.set({ tt_hidden: [...list] });
      }
      await chrome.tabs.sendMessage(t.id, { type: 'TT_TOGGLE_PANEL' });
      window.close();
    } catch (e) {
      alert('当前页面没有注入成功，请刷新页面后再试。');
    }
  };
  document.getElementById('open').onclick = () => {
    chrome.runtime.openOptionsPage();
    window.close();
  };
}

boot();
