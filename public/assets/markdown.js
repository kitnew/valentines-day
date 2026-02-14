export function renderMarkdownSafe(md) {
  // marked + DOMPurify are loaded from CDN in pages that need it
  const raw = window.marked ? window.marked.parse(md ?? "") : (md ?? "");
  if (window.DOMPurify) return window.DOMPurify.sanitize(raw, { USE_PROFILES: { html: true } });
  return raw;
}
