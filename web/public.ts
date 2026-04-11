import { render, h } from 'preact';
import { App } from './App';
import { AuthProvider } from './contexts/auth-context';

const appRoot = document.getElementById('app');
if (appRoot) {
  render(h(AuthProvider, { children: h(App, {}) }), appRoot);
}
