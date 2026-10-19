/* 后台：首次安装时把示例简历写入本地存储；打开资料库页 */
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    const r = await chrome.storage.local.get(['tt_profile']);
    if (!r.tt_profile) {
      try {
        const res = await fetch(chrome.runtime.getURL('data/seed-profile.json'));
        const data = await res.json();
        await chrome.storage.local.set({ tt_profile: data, tt_profile_updated: Date.now() });
      } catch (e) {
        console.warn('seed failed', e);
      }
    }
    chrome.tabs.create({ url: chrome.runtime.getURL('options.html') });
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === 'OPEN_OPTIONS') {
    chrome.runtime.openOptionsPage
      ? chrome.runtime.openOptionsPage()
      : chrome.tabs.create({ url: chrome.runtime.getURL('options.html') });
    sendResponse({ ok: true });
    return true;
  }
});
