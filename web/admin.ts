import { render, h } from 'preact';
import { AdminApp } from './AdminApp';
import { AuthProvider } from './contexts/auth-context';

const appRoot = document.getElementById('app');
if (appRoot) {
  render(h(AuthProvider, { children: h(AdminApp, {}) }), appRoot);
}