/*
 * The post link builder at /tools/links/, a staff tool with no login. Rendered to
 * web/link-builder.js by scripts/site/render.ts, which fills the code shape, the sources, the
 * blocked targets and the site/store URLs from scripts/site/postLinks.ts and config.
 *
 * It makes the site link (target page + ?c=<code>) and, when Apple's provider id is set, the
 * direct App Store link carrying the same campaign token. It validates with the same rules the
 * carrying script uses, so a link made here always works on the page it points at. It stores
 * nothing and calls nothing.
 */
(function () {
  const PATTERN = '^[a-z0-9]+(?:-[a-z0-9]+){1,3}$';
  const MAX = 40;
  const SOURCES = [
    { id: 'ig', zh: 'Instagram', en: 'Instagram' },
    { id: 'th', zh: 'Threads', en: 'Threads' },
    { id: 'fb', zh: 'Facebook', en: 'Facebook' },
    { id: 'wa', zh: 'WhatsApp', en: 'WhatsApp' },
    { id: 'yt', zh: 'YouTube', en: 'YouTube' },
    { id: 'xhs', zh: '小紅書', en: 'Xiaohongshu' },
    { id: 'qr', zh: 'QR / 海報', en: 'QR / poster' },
    { id: 'ot', zh: '其他', en: 'Other' },
  ];
  const BLOCKED =
    '^\\/(i|l|invite|match\\/confirm|player|p|battle\\/join|tools)\\/|^\\/(privacy|terms|data-deletion)\\.html|[?#]';
  const SITE_URL = 'https://beyhk.sh';
  const APP_STORE_URL =
    'https://apps.apple.com/hk/app/%E8%9E%BAfun-beyhk-%E9%A6%99%E6%B8%AF%E5%B0%8D%E6%88%B0%E6%8E%92%E5%90%8D/id6816851078';
  const PROVIDER_ID = '129522206';

  const form = document.querySelector('[data-link-builder]');
  if (!form) return;

  const source = document.querySelector('[data-source]');
  const date = document.querySelector('[data-date]');
  const label = document.querySelector('[data-label]');
  const target = document.querySelector('[data-target]');
  const codeOut = document.querySelector('[data-code]');
  const siteOut = document.querySelector('[data-site-link]');
  const directOut = document.querySelector('[data-direct-link]');
  const directRow = document.querySelector('[data-direct-row]');
  const directMissing = document.querySelector('[data-direct-missing]');
  const output = document.querySelector('[data-output]');
  const error = document.querySelector('[data-error]');
  const copies = document.querySelectorAll('[data-copy]');

  const shape = new RegExp(PATTERN);
  const blocked = new RegExp(BLOCKED);

  function cleanLabel(raw) {
    return raw
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .split('-')
      .filter(Boolean)
      .slice(0, 2)
      .join('-');
  }

  function isPostCode(code) {
    return code.length <= MAX && shape.test(code);
  }

  function buildCode(from, mmdd, raw) {
    let known = false;
    for (let i = 0; i < SOURCES.length; i++) if (SOURCES[i].id === from) known = true;
    if (!known) return null;
    if (!/^\d{4}$/.test(mmdd)) return null;
    const cleaned = cleanLabel(raw);
    if (!cleaned) return null;
    const code = from + '-' + mmdd + '-' + cleaned;
    return isPostCode(code) ? code : null;
  }

  function isTargetPath(path) {
    return path.charAt(0) === '/' && !blocked.test(path) && !/\s/.test(path);
  }

  function mmdd(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    return match ? match[2] + match[3] : '';
  }

  function hkToday() {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Hong_Kong',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date());
    function part(type) {
      for (let i = 0; i < parts.length; i++) if (parts[i].type === type) return parts[i].value;
      return '';
    }
    return part('year') + '-' + part('month') + '-' + part('day');
  }

  function storeUrl(code) {
    if (PROVIDER_ID === null) return '';
    const sep = APP_STORE_URL.indexOf('?') === -1 ? '?' : '&';
    return (
      APP_STORE_URL +
      sep +
      'pt=' +
      encodeURIComponent(PROVIDER_ID) +
      '&ct=' +
      encodeURIComponent(code) +
      '&mt=8'
    );
  }

  function clear() {
    codeOut.textContent = '';
    siteOut.value = '';
    directOut.value = '';
    directRow.hidden = true;
    directMissing.hidden = false;
    output.hidden = true;
  }

  function fail(message) {
    clear();
    error.textContent = message;
    error.hidden = false;
  }

  function update() {
    if (label.value === '') {
      /* Nothing typed yet: no link, and no error either. */
      clear();
      error.textContent = '';
      error.hidden = true;
      return;
    }
    const code = buildCode(source.value, mmdd(date.value), label.value);
    if (!code) {
      fail(
        '整唔到有效代碼：檢查日期同標籤。 · That does not make a valid code. Check the date and label.',
      );
      return;
    }
    if (!isTargetPath(target.value)) {
      fail(
        '目標頁唔啱：要用 beyhk.sh 嘅頁面，唔可以係 App 連結或者法定頁面。 · That target page is not allowed. Use a beyhk.sh page, not an app link or a legal page.',
      );
      return;
    }
    const site = SITE_URL + target.value + '?c=' + code;
    const direct = storeUrl(code);
    error.textContent = '';
    error.hidden = true;
    output.hidden = false;
    codeOut.textContent = code;
    siteOut.value = site;
    directOut.value = direct;
    directRow.hidden = direct === '';
    directMissing.hidden = direct !== '';
  }

  function copy(button) {
    const isDirect = button.getAttribute('data-copy') === 'direct';
    const field = isDirect ? directOut : siteOut;
    const done = function () {
      const was = button.textContent;
      button.textContent = '已複製 · Copied';
      setTimeout(function () {
        button.textContent = was;
      }, 2000);
    };
    function fallback() {
      field.select();
      try {
        document.execCommand('copy');
        done();
      } catch {
        /* Leave the field selected for a manual copy. */
      }
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(field.value).then(done, fallback);
    } else {
      fallback();
    }
  }

  if (!date.value) date.value = hkToday();

  label.addEventListener('input', function () {
    label.value = cleanLabel(label.value);
    update();
  });
  source.addEventListener('change', update);
  date.addEventListener('input', update);
  target.addEventListener('input', update);
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    update();
  });
  for (let i = 0; i < copies.length; i++) {
    copies[i].addEventListener('click', function () {
      copy(copies[i]);
    });
  }

  update();
})();
