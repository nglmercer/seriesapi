/// <reference path="./cssLoader.ts" />
import { render, h } from 'preact';
import { App } from './App';
import './components/index';
import './components/layout/public-header.module.css';
import './components/layout/mobile-menu.module.css';
import './components/layout/admin-header.module.css';
import './components/shared/empty-state.module.css';
import './components/shared/comment-avatar.module.css';
import './components/shared/search-box.module.css';
import './components/shared/genres-list.module.css';
import './components/shared/app-pagination.module.css';
import './components/shared/comment-compose.module.css';
import './components/shared/comment-item.module.css';
import './components/shared/comments-section.module.css';
import './components/shared/rating-widget.module.css';
import './components/shared/user-profile.module.css';
import './components/media/wiki-infobox.module.css';
import './components/media/media-filters.module.css';
import './components/media/media-list.module.css';
import './components/media/media-detail.module.css';
import './components/media/media-episodes.module.css';
import './components/media/people-list.module.css';
import './components/admin/admin-view.module.css';
import './components/admin/admin-content-manager.module.css';

const appRoot = document.getElementById('app');
if (appRoot) {
  render(h(App, {}), appRoot);
}
