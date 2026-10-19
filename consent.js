/*
 * beyhk.sh website analytics behind a cookie prompt (BEYHK-380). Rendered to web/consent.js by
 * scripts/site/render.ts, which fills in the Google Tag Manager container from config.gtmId;
 * with no container the file does nothing and no prompt shows.
 *
 * Nothing from Google loads until the visitor taps Accept. The choice is kept in localStorage
 * for a year. Consent Mode keeps every advertising signal denied even after Accept, because the
 * site's audience includes children: only analytics_storage is ever granted. 404.html, which
 * serves invite links (/i/<code>), never includes this file, so referral codes never reach
 * Google; the path check below is a second guard.
 */
(function () {
  const GTM_ID = null;
  const KEY = 'beyhk-consent';
  const MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;
  const TEXT = {
    'zh-HK': {
      title: 'Cookie 同網站分析',
      body: '我哋想用 Google Analytics 了解大家點樣用呢個網站（例如睇咗邊啲頁）。唔會用嚟賣廣告。你揀「拒絕」都可以照用晒成個網站。',
      more: '詳情睇私隱政策',
      accept: '接受',
      reject: '拒絕',
    },
    en: {
      title: 'Cookies and site analytics',
      body: 'We would like to use Google Analytics to see how people use this site (for example which pages are read). It is never used for advertising. Everything works the same if you reject.',
      more: 'More in the privacy policy',
      accept: 'Accept',
      reject: 'Reject',
    },
  };

  if (!GTM_ID || /^\/i\//.test(location.pathname)) return;

  function stored() {
    try {
      const v = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (
        v &&
        (v.choice === 'granted' || v.choice === 'denied') &&
        Date.now() - v.at < MAX_AGE_MS
      ) {
        return v.choice;
      }
    } catch {
      /* Private mode or a corrupt value: ask again. */
    }
    return null;
  }

  function save(choice) {
    try {
      localStorage.setItem(KEY, JSON.stringify({ choice: choice, at: Date.now() }));
    } catch {
      /* Not persisted; the prompt shows again next visit. */
    }
  }

  function loadTagManager() {
    window.dataLayer = window.dataLayer || [];
    function gtag() {
      window.dataLayer.push(arguments);
    }
    gtag('consent', 'default', {
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      functionality_storage: 'denied',
      personalization_storage: 'denied',
      security_storage: 'granted',
    });
    gtag('set', 'ads_data_redaction', true);
    window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtm.js?id=' + encodeURIComponent(GTM_ID);
    document.head.appendChild(s);
  }

  /** After a withdrawal: drop Google's first-party cookies, then reload without the tags. */
  function clearAnalyticsCookies() {
    const host = location.hostname;
    const domains = ['', host, '.' + host, '.' + host.split('.').slice(-2).join('.')];
    document.cookie.split(';').forEach(function (c) {
      const name = c.split('=')[0].trim();
      if (!/^(_ga|_gid|_gat)/.test(name)) return;
      domains.forEach(function (d) {
        document.cookie = name + '=; Max-Age=0; path=/' + (d ? '; domain=' + d : '');
      });
    });
  }

  function lang() {
    return document.documentElement.lang === 'en' ? 'en' : 'zh-HK';
  }

  let banner = null;

  function close() {
    if (banner) banner.remove();
    banner = null;
  }

  function choose(choice) {
    const was = stored();
    save(choice);
    close();
    if (choice === 'granted' && was !== 'granted') loadTagManager();
    if (choice === 'denied' && was === 'granted') {
      clearAnalyticsCookies();
      location.reload();
    }
  }

  function open() {
    if (banner) return;
    const t = TEXT[lang()];
    banner = document.createElement('section');
    banner.className = 'consent';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-labelledby', 'consent-title');
    banner.innerHTML =
      '<div class="consent-inner">' +
      '<h2 id="consent-title"></h2><p><span class="consent-body"></span> ' +
      '<a href="/privacy.html#web-analytics' +
      (lang() === 'en' ? '-en' : '') +
      '"></a></p>' +
      '<div class="consent-actions">' +
      '<button type="button" class="btn btn-secondary" data-choice="denied"></button>' +
      '<button type="button" class="btn btn-secondary" data-choice="granted"></button>' +
      '</div></div>';
    banner.querySelector('h2').textContent = t.title;
    banner.querySelector('.consent-body').textContent = t.body;
    banner.querySelector('a').textContent = t.more;
    banner.querySelector('[data-choice="denied"]').textContent = t.reject;
    banner.querySelector('[data-choice="granted"]').textContent = t.accept;
    banner.addEventListener('click', function (e) {
      const choice = e.target.getAttribute && e.target.getAttribute('data-choice');
      if (choice) choose(choice);
    });
    document.body.appendChild(banner);
  }

  function start() {
    const choice = stored();
    if (choice === 'granted') loadTagManager();
    if (!choice) open();
    document.querySelectorAll('[data-consent-open]').forEach(function (b) {
      b.hidden = false;
      b.addEventListener('click', open);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
