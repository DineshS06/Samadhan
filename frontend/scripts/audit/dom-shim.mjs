/**
 * Minimal DOM shim so SEO.jsx can be exercised without a browser.
 * Only implements what SEO.jsx touches.
 */
class El {
  constructor(tag) {
    this.tagName = tag.toUpperCase();
    this.attrs = {};
    this.dataset = {};
    this.children = [];
    this.textContent = '';
    this.parent = null;
  }
  setAttribute(k, v) {
    if (k.startsWith('data-')) this.dataset[k.slice(5).replace(/-(\w)/g, (_, c) => c.toUpperCase())] = v;
    else this.attrs[k] = v;
  }
  getAttribute(k) {
    if (k.startsWith('data-')) {
      const key = k.slice(5).replace(/-(\w)/g, (_, c) => c.toUpperCase());
      return this.dataset[key] ?? null;
    }
    return this.attrs[k] ?? null;
  }
  remove() {
    if (!this.parent) return;
    const i = this.parent.children.indexOf(this);
    if (i >= 0) this.parent.children.splice(i, 1);
    this.parent = null;
  }
  matches(sel) {
    // Supports: tag, tag[attr], tag[attr="value"], and a trailing :not().
    let s = sel.trim();
    const negM = /:not\(([^)]*)\)/.exec(s);
    const negate = negM ? negM[1].trim() : null;
    if (negate) s = s.replace(negM[0], '').trim();

    const tag = s.replace(/\[.*$/, '');
    if (tag && this.tagName !== tag.toUpperCase()) return false;

    const attrM = /\[([^=\]]+)(?:="([^"]*)")?\]/.exec(s);
    if (attrM) {
      const [, name, value] = attrM;
      const got = this.getAttribute(name);
      if (value !== undefined) {
        if (got !== value) return false;
      } else if (got === null) {
        return false;
      }
    }

    // Negation is a whole-selector match, per CSS :not() semantics.
    if (negate && this.matches(negate)) return false;
    return true;
  }
  querySelectorAll(sel) {
    // Comma-separated selector lists.
    const groups = sel.split(',').map((s) => s.trim()).filter(Boolean);
    const out = [];
    const walk = (n) => {
      for (const c of n.children) {
        if (groups.some((g) => c.matches(g))) out.push(c);
        walk(c);
      }
    };
    walk(this);
    return out;
  }
  appendChild(child) {
    child.parent = this;
    this.children.push(child);
  }
}

export function makeHead(staticTags = []) {
  const html = new El('html');
  const head = new El('head');
  html.appendChild(head);
  const doc = {
    head,
    createElement: (t) => new El(t),
    querySelectorAll: (sel) => {
      const scoped = /^\[data-seo-managed\]/.test(sel) ? head : html;
      const rest = sel.replace(/^\[data-seo-managed\]\s*/, '');
      return scoped.querySelectorAll(rest);
    },
  };
  for (const [tag, attrs] of staticTags) {
    const n = new El(tag);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    head.appendChild(n);
  }
  return doc;
}