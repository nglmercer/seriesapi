import { render, h } from 'preact';
import { App } from './App';
import './components/index'; // Keep for now as it registers custom elements

const appRoot = document.getElementById('app');
if (appRoot) {
  render(h(App, {}), appRoot);
}
