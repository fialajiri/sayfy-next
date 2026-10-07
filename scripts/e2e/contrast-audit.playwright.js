// WCAG contrast audit (Playwright "run code" snippet): every visible text node vs its
// effective background, all listed routes, dark + light. Run against `next start` on :3100
// with the test admin ALREADY logged in in that browser (no credentials in this file). Used to verify the fix for invisible admin text (Phase 4); Phase 5 admin routes added.
async (page) => {
  const pages = ['/admin', '/admin/aktuality', '/admin/aktuality/nova', '/admin/fotogalerie', '/admin/fotogalerie/635ad3cddb22aba901ec3d42', '/admin/propozice', '/admin/vysledky', '/admin/partneri', '/admin/nastaveni', '/admin/obsah/uvod', '/admin/obsah/sayfy', '/admin/obsah/kontakt', '/admin/obsah/podpora', '/admin/obsah/web', '/admin/ucet', '/', '/sayfy', '/aktuality', '/propozice', '/fotogalerie', '/vysledky', '/kontakt', '/podpora', '/prihlaseni'];
  const out = []; page.removeAllListeners('dialog'); page.on('dialog', (d) => d.accept().catch(() => {}));
  for (const scheme of ['dark', 'light']) {
    await page.emulateMedia({ colorScheme: scheme });
    for (const path of pages) {
      await page.goto('http://localhost:3100' + path, { waitUntil: 'load' });
      if (page.url().includes('prihlaseni') && path !== '/prihlaseni') throw new Error('Log in as the test admin first (admin routes redirected to the login page).');
      await page.waitForTimeout(300);
      const bad = await page.evaluate(() => {
        const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
        const rgba = (c) => { ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = '#000'; ctx.fillStyle = c; ctx.fillRect(0, 0, 1, 1); const d = ctx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255]; };
        const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
        const bgOf = (el) => { for (let e = el; e; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.backgroundImage !== 'none' && e.tagName !== 'BODY') return null; const c = rgba(cs.backgroundColor); if (c[3] > 0.9) return c; } return rgba(getComputedStyle(document.body).backgroundColor); };
        const res = [];
        for (const el of document.querySelectorAll('body *')) {
          if (el.closest('[aria-hidden=true], .ProseMirror figure, video, svg, img') ) continue;
          const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);
          if (!own) continue;
          const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
          if (r.width === 0 || r.height === 0 || cs.visibility === 'hidden' || +cs.opacity < 0.1 || cs.clip === 'rect(0px, 0px, 0px, 0px)' || el.closest('.sr-only')) continue;
          if (el.closest('[disabled], [aria-disabled=true]')) continue; // disabled controls are exempt (WCAG 1.4.3)
          const bg = bgOf(el); if (!bg) continue; // text over images: checked visually
          const fg = rgba(cs.color); const a = fg[3]; const mix = fg.slice(0, 3).map((v, i) => v * a + bg[i] * (1 - a));
          const L1 = lum(mix), L2 = lum(bg); const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
          const large = parseFloat(cs.fontSize) >= 24 || (parseFloat(cs.fontSize) >= 18.66 && +cs.fontWeight >= 700);
          if (ratio < (large ? 3 : 4.5)) res.push(`${ratio.toFixed(2)} "${el.textContent.trim().slice(0, 28)}" <${el.tagName.toLowerCase()}>`);
        }
        return [...new Set(res)].slice(0, 6);
      });
      out.push(`${scheme.padEnd(5)} ${path.padEnd(20)} ${bad.length ? 'LOW: ' + bad.join(' | ') : 'ok'}`);
    }
  }
  return out.join('\n');
}
