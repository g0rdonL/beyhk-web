/*
 * Carries a post code from a tagged link (?c=<code>) to the store links on the page, so a
 * download can be traced back to the social post that brought it. Rendered to web/links.js by
 * scripts/site/render.ts, which fills the shape, the storage key, the store prefixes and the
 * Apple provider id from scripts/site/postLinks.ts and config.
 *
 * The code is kept in sessionStorage for the open tab only: no cookie, no localStorage, no
 * visitor id, nothing sent anywhere. A store link that already carries a campaign token is left
 * alone. The invite paths (/i/, /l/ and the other app links) never run this file, and the path
 * check below is a second guard, so an invite code never meets a campaign token.
 */
(function () {
  const PATTERN = '^[a-z0-9]+(?:-[a-z0-9]+){1,3}$';
  const MAX = 40;
  const KEY = 'beyhk-post';
  const APPLE = 'https://apps.apple.com/';
  const PLAY = 'https://play.google.com/';
  const PROVIDER_ID = '129522206';
  const BLOCKED = /^\/(i|l|invite|match\/confirm|player|p|battle\/join)\//;

  if (BLOCKED.test(location.pathname)) return;

  const shape = new RegExp(PATTERN);

  function valid(code) {
    return !!code && code.length <= MAX && shape.test(code);
  }

  let code = null;
  const match = /(?:^|[?&])c=([^&]*)/.exec(location.search || '');
  if (match && valid(match[1])) {
    code = match[1];
    try {
      sessionStorage.setItem(KEY, code);
    } catch {
      /* Storage blocked: the code still counts for this page. */
    }
  } else {
    try {
      const stored = sessionStorage.getItem(KEY);
      if (valid(stored)) code = stored;
    } catch {
      /* Storage blocked: behave as if there were no code. */
    }
  }

  if (!code) return;

  function source() {
    return code.split('-')[0];
  }

  function append(href, param) {
    return href + (href.indexOf('?') === -1 ? '?' : '&') + param;
  }

  function rewrite() {
    const links = document.querySelectorAll('a[href]');
    for (let i = 0; i < links.length; i++) {
      const a = links[i];
      const href = a.getAttribute('href');
      if (!href) continue;
      if (href.indexOf(APPLE) === 0) {
        if (PROVIDER_ID === null || href.indexOf('ct=') !== -1) continue;
        a.setAttribute(
          'href',
          append(
            href,
            'pt=' + encodeURIComponent(PROVIDER_ID) + '&ct=' + encodeURIComponent(code) + '&mt=8',
          ),
        );
      } else if (href.indexOf(PLAY) === 0) {
        if (href.indexOf('referrer=') !== -1) continue;
        a.setAttribute(
          'href',
          append(
            href,
            'referrer=' +
              encodeURIComponent(
                'utm_source=' + source() + '&utm_medium=social&utm_campaign=' + code,
              ),
          ),
        );
      }
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', rewrite);
  else rewrite();
})();
