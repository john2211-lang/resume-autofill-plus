(function () {
  const TT = window.__TT__ = window.__TT__ || {};
  TT.mergeEducationDefaults = function (profile, seed) {
    let changed = false;
    for (const rec of (profile && profile.educations) || []) {
      const source = ((seed && seed.educations) || []).find(r => r.school === rec.school);
      if (!source) continue;
      for (const key of ['description','counselorName','counselorPhone','overseas','diplomaNumber']) {
        if ((rec[key] == null || rec[key] === '') && source[key]) {rec[key] = source[key]; changed = true;}
      }
    }
    return changed;
  };
  TT.upgradeEducationData = async function (profile) {
    if (!profile) return false;
    try {
      const res = await fetch(chrome.runtime.getURL('data/seed-profile.json'));
      if (!res.ok) return false;
      if (!TT.mergeEducationDefaults(profile, await res.json())) return false;
      await chrome.storage.local.set({tt_profile: profile, tt_profile_updated: Date.now()});
      return true;
    } catch (e) {return false;}
  };
})();
