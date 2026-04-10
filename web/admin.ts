import { render, h } from 'preact';
import { AdminApp } from './AdminApp';

const appRoot = document.getElementById('app');
if (appRoot) {
  render(h(AdminApp, {}), appRoot);
}