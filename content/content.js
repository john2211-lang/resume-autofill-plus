/* 入口：挂载面板 + 响应快捷键 / 弹窗消息 */
(function () {
  const TT = (window.__TT__ = window.__TT__ || {});
  if (window.__ttInjected) return;
  window.__ttInjected = true;

  const mount = () => {
    if (!TT.mountPanel) return;
    TT.mountPanel();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount, { once: true });
  } else {
    mount();
  }

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !changes.tt_profile) return;
    TT.panel.state.profile = changes.tt_profile.newValue;
    TT.panel.render();
  });

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (!msg || !msg.type) return;
    if (msg.type === 'TT_FILL') {
      TT.panel
        .doFill(msg.mode || 'basic')
        .then(() => sendResponse({ ok: true, filled: TT.panel.state.last ? TT.panel.state.last.filled : 0 }))
        .catch((e) => sendResponse({ ok: false, error: String(e) }));
      return true;
    }
    if (msg.type === 'TT_PING') {
      const n = TT.engine ? TT.engine.buildEntries(document, TT.panel.state.profile || {}, 'enhanced').length : 0;
      sendResponse({ ok: true, fields: n, version: '1.1.11' });
      return true;
    }
    if (msg.type === 'TT_TOGGLE_PANEL') {
      // 从「本页不再显示」里摘掉，否则刷新后又没了
      chrome.storage.local.get(['tt_hidden']).then((r) => {
        const list = new Set(r.tt_hidden || []);
        list.delete(location.hostname);
        chrome.storage.local.set({ tt_hidden: [...list] });
      }).catch(() => {});
      TT.panel.state.hidden = false;
      TT.panel.state.open = true;
      TT.panel.render();
      sendResponse({ ok: true });
      return true;
    }
    if (msg.type === 'TT_REGION') {
      TT.panel.state.hidden = false;
      TT.panel.state.open = true;
      TT.panel.render();
      setTimeout(() => TT.panel.startRegionSelect(), 120);
      sendResponse({ ok: true });
      return true;
    }
  });

  // Alt + Shift + F：快捷一键填入
  document.addEventListener('keydown', (e) => {
    if (e.altKey && e.shiftKey && (e.key === 'F' || e.key === 'f')) {
      e.preventDefault();
      TT.panel.doFill('basic');
    }
  });
})();
