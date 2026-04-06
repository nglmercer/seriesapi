export function h(tag: string, props: Record<string, any> = {}, ...children: Array<string | Node>): HTMLElement {
  const el = document.createElement(tag);
  Object.assign(el, props);
  if (props.style && typeof props.style === 'object') {
    Object.assign(el.style, props.style);
  }
  if (props.dataset) {
    Object.assign(el.dataset, props.dataset);
  }
  children.forEach(child => {
    if (typeof child === 'string') {
      el.appendChild(document.createTextNode(child));
    } else if (child instanceof Node) {
      el.appendChild(child);
    }
  });
  return el;
}

export function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
}
