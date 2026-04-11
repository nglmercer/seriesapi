# API Reference

Base URL: `http://localhost:3000/api/v1`

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/media` | Paginated media list |
| GET | `/media/:id` | Media detail |
| GET | `/media/:id/seasons` | Media seasons |
| GET | `/media/:id/episodes` | Media episodes (flat list for movies/OVAs) |
| GET | `/media/:id/credits` | Media cast & crew |
| GET | `/media/:id/images` | Media images |
| GET | `/media/:id/videos` | Media videos (trailers, openings, endings) |
| GET | `/media/:id/related` | Related media (sequels, spinoffs, adaptations) |
| GET | `/media/:id/comments` | Media comments |
| POST | `/media/bulk` | Bulk update media entries |
| GET | `/seasons/:id` | Season detail |
| GET | `/seasons/:id/episodes` | Season episodes |
| GET | `/seasons/:id/images` | Season images |
| GET | `/seasons/:id/comments` | Season comments |
| POST | `/seasons` | Create season |
| PUT | `/seasons` | Update season |
| DELETE | `/seasons` | Delete season |
| GET | `/episodes/:id` | Episode detail |
| GET | `/episodes/:id/credits` | Episode credits (guest cast & crew) |
| GET | `/episodes/:id/images` | Episode images (stills/thumbnails) |
| GET | `/episodes/:id/comments` | Episode comments |
| POST | `/episodes` | Create episode |
| PUT | `/episodes` | Update episode |
| DELETE | `/episodes` | Delete episode |
| GET | `/people` | Paginated people list |
| GET | `/people/:id` | Person detail |
| GET | `/people/:id/credits` | Person credits (all media a person appears in) |
| GET | `/genres` | Genre list |
| GET | `/genres/:slug` | Genre detail with media |
| GET | `/tags` | Tag list |
| GET | `/collections` | Collections list |
| GET | `/collections/:slug` | Collection detail |
| GET | `/search` | Full-text search |
| POST | `/comments` | Create comment (supports media, season, episode) |
| GET | `/comments/:id` | Get comment |
| GET | `/comments/user` | Get user comments |
| POST | `/ratings` | Create rating (supports media, season, episode) |
| GET | `/ratings` | Get ratings (supports media, season, episode) |
| GET | `/ratings/user` | Get user ratings |
| GET | `/ratings/top` | Get top ratings |
| POST | `/reports` | Create report |
| GET | `/reports` | List reports (admin) |
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login user |
| POST | `/auth/logout` | Logout user |
| GET | `/auth/me` | Get current user |
| PATCH/PUT | `/auth/update` | Update current user |
| GET | `/auth/users` | List users (admin) |
| PATCH/PUT | `/auth/users/:id` | Update user (admin) |
| DELETE | `/auth/users/:id` | Delete user (admin) |
| GET | `/auth/roles` | List roles (admin) |
| POST | `/auth/roles` | Create role (admin) |
| PATCH/PUT | `/auth/roles/:id` | Update role (admin) |
| DELETE | `/auth/roles/:id` | Delete role (admin) |
| POST | `/auth/verify-code/generate` | Generate verification code |
| POST | `/auth/verify-code/apply` | Apply verification code |
| POST | `/auth/role-challenge` | Request role challenge |

## Query Parameters

### Pagination
- `page` (default: 1)
- `pageSize` (default: 20, max: 100)

### Filtering (media)
- `type` - `anime`, `manga`, `movie`, `ova`, `ona`, `special`
- `status` - `current`, `finished`, `upcoming`, `tba`
- `genre` - genre slug

### Search
- `q` - search query (required)
- `type` - `media`, `person`, `collection`
- `locale` - filter by locale

## Response Format

```json
{
  "ok": true,
  "data": {},
  "params": {
    "page": 1,
    "pageSize": 20,
    "total": 100
  }
}
```

## Localize

Add `locale` query param to get localized content:
- `locale=en` (default)
- `locale=ja`
- `locale=es`

## Rate Limit

- 60 requests per minute per IP