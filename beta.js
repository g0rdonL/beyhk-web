/*
 * The closed beta form on /beta/ and /en/beta/. Rendered to web/beta.js by
 * scripts/site/render.ts, which fills in the project URL and publishable key from
 * config.betaSignup.
 *
 * The form posts to request_beta_signup (supabase/migrations/20261201001600_beta_signups.sql),
 * the only thing the publishable key can write. A repeat email succeeds the same as a new one, so
 * the page never says whether an address is already on the list. The hidden "website" field is a
 * honeypot: a bot that fills it is shown success and nothing is sent.
 */
(function () {
  const SUPABASE_URL = 'https://pvxpcuagpempqtnkiebu.supabase.co';
  const PUBLISHABLE_KEY = 'sb_publishable__TjqO2zf1efVTI-O7xsUhQ_cj-jmI_8';
  const TEXT = {
    'zh-HK': {
      sending: '傳送緊…',
      invalid_email: '電郵地址唔啱，再檢查一次。',
      invalid_handle: '帳號只可以用 3 至 20 個英文細楷、數字或底線。',
      invalid_platform: '揀 iOS 定 Android。',
      consent_required: '要剔選同意先可以登記。',
      rate_limited: '而家太多人登記緊，一分鐘後再試。',
      beta_full: '封閉測試名額已滿。追蹤 Instagram @beyhkfun，公開推出時第一時間知。',
      failed: '傳送唔到，檢查網絡再試。',
    },
    en: {
      sending: 'Sending…',
      invalid_email: 'That email address does not look right. Check it and try again.',
      invalid_handle: 'A handle is 3 to 20 lowercase letters, numbers or underscores.',
      invalid_platform: 'Choose iOS or Android.',
      consent_required: 'Tick the consent box to sign up.',
      rate_limited: 'Lots of people are signing up right now. Try again in a minute.',
      beta_full:
        'The closed beta is full. Follow Instagram @beyhkfun to hear the moment the app is out.',
      failed: 'Could not send. Check your connection and try again.',
    },
  };

  const form = document.querySelector('form[data-beta-form]');
  if (!form) return;
  const t = TEXT[document.documentElement.lang === 'en' ? 'en' : 'zh-HK'];
  const status = form.querySelector('[data-beta-status]');
  const submit = form.querySelector('button[type="submit"]');
  const done = document.querySelector('[data-beta-done]');

  function show(message) {
    status.textContent = message;
    status.hidden = !message;
  }

  function succeed() {
    form.hidden = true;
    done.hidden = false;
    done.focus();
  }

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    const data = new FormData(form);
    if (data.get('website')) {
      succeed();
      return;
    }
    show('');
    submit.disabled = true;
    submit.textContent = t.sending;
    try {
      const res = await fetch(SUPABASE_URL + '/rest/v1/rpc/request_beta_signup', {
        method: 'POST',
        headers: { apikey: PUBLISHABLE_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          p_email: data.get('email'),
          p_platform: data.get('platform'),
          p_handle: data.get('handle') || null,
          p_for_minor: data.get('signer') === 'guardian',
          p_consent: data.get('consent') === 'yes',
          p_locale: document.documentElement.lang === 'en' ? 'en' : 'zh-HK',
        }),
      });
      if (res.ok) {
        succeed();
        return;
      }
      const body = await res.json().catch(function () {
        return {};
      });
      show(t[body.message] || t.failed);
    } catch {
      show(t.failed);
    }
    submit.disabled = false;
    submit.textContent = submit.dataset.label;
  });
})();
