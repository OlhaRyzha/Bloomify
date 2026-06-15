(function () {
  const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const LENGTH = 8;

  function generateCode() {
    const arr = new Uint8Array(LENGTH);
    crypto.getRandomValues(arr);
    return Array.from(arr, (b) => ALPHABET[b % ALPHABET.length]).join('');
  }

  function init() {
    const codeInput = document.getElementById('id_code');
    if (!codeInput) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = '⟳ Generate';
    btn.className = 'bloomify-promo-gen-btn';
    btn.style.cssText =
      'margin-left:8px;padding:6px 12px;border-radius:8px;border:1px solid var(--bloomify-form-border,rgba(216,119,129,.28));background:var(--bloomify-form-field,#f8f5f7);color:var(--bloomify-form-text,#1f2a25);cursor:pointer;font-size:13px;vertical-align:middle;';

    btn.addEventListener('click', function () {
      codeInput.value = generateCode();
      codeInput.dispatchEvent(new Event('input', { bubbles: true }));
      codeInput.dispatchEvent(new Event('change', { bubbles: true }));
    });

    codeInput.insertAdjacentElement('afterend', btn);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
