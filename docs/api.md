# API Reference

Base URL: `http://localhost:3000/api/v1`

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/media` | Paginated media list |
| GET | `/media/:id` | Media detail |
| GET | `/media/:id/seasons` | Media seasons |
| GET | `/media/:id/episodes` | Media episodes |
| GET | `/media/:id/credits` | Media cast & crew |
| GET | `/media/:id/images` | Media images |
| GET | `/media/:id/videos` | Media videos |
| GET | `/media/:id/related` | Related media |
| GET | `/media/:id/comments` | Media comments |
| GET | `/seasons/:id` | Season detail |
| GET | `/seasons/:id/episodes` | Season episodes |
| GET | `/seasons/:id/images` | Season images |
| GET | `/episodes/:id` | Episode detail |
| GET | `/episodes/:id/credits` | Episode credits |
| GET | `/episodes/:id/images` | Episode images |
| GET | `/episodes/:id/comments` | Episode comments |
| GET | `/people` | Paginated people list |
| GET | `/people/:id` | Person detail |
| GET | `/people/:id/credits` | Person credits |
| GET | `/genres` | Genre list |
| GET | `/genres/:slug` | Genre detail with media |
| GET | `/collections` | Collections list |
| GET | `/collections/:slug` | Collection detail |
| GET | `/search` | Full-text search |
| POST | `/comments` | Create comment |
| GET | `/comments/:id` | Get comment |

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