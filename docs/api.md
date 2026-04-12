# API Documentation

Base URL: `http://localhost:3000/api/v1`

## Index

| Resource | File | Endpoints |
|----------|------|-----------|
| 🎬 Media | [media.md](./media.md) | List, detail, seasons, episodes, credits, images, videos, related, comments, bulk |
| 📺 Seasons | [seasons.md](./seasons.md) | Detail, episodes, images, comments — CRUD |
| 🎞️ Episodes | [episodes.md](./episodes.md) | Detail, credits, images, comments, neighbors, views — CRUD |
| 💬 Comments | [comments.md](./comments.md) | Create, get thread, update, user comments |
| 📊 Stats | [stats.md](./stats.md) | Agnostic table counts and filtered counts |
| ⭐ Ratings | [ratings.md](./ratings.md) | Create/update, get by entity, user ratings, top ratings |
| 🔍 Search | [search.md](./search.md) | Full-text search across media, people, collections |
| 👤 People | [people.md](./people.md) | List, detail, credits |
| 🏷️ Genres | [genres.md](./genres.md) | List, genre + media |
| 🔖 Tags | [tags.md](./tags.md) | List |
| 📦 Collections | [collections.md](./collections.md) | List, detail |
| 🔐 Auth | [auth.md](./auth.md) | Register, login, logout, me, users, roles, verify |
| 🚩 Reports | [reports.md](./reports.md) | Create report, list reports (admin) |

---

## Shared Conventions

### Response Envelope

Every response uses the same JSON structure:

```json
{
  "ok": true,
  "data": {},
  "params": {
    "locale": "en",
    "page": 1,
    "pageSize": 20,
    "total": 100
  }
}
```

Error response:

```json
{
  "ok": false,
  "error": "Not found",
  "status": 404
}
```

---

### Pagination

All list endpoints accept:

| Param | Default | Description |
|-------|---------|-------------|
| `page` | `1` | Page number (1-indexed) |
| `limit` | `20` | Items per page (max 100) |

---

### Hydration & Statistics

Some endpoints support extra "hydration" via query parameters to avoid extra requests:

| Param | Type | Description |
|-------|------|-------------|
| `stats` | boolean | Include live counts (e.g., `live_seasons_count`, `live_episodes_count` in media) |

---

### Localization

Add `locale` to any request to receive translated content.

| Value | Language |
|-------|----------|
| `en` | English (default) |
| `ja` | Japanese |
| `es` | Spanish |

If a translation is missing, the original title/name is returned as fallback.

---

### Authentication

Protected routes require a Bearer token in the `Authorization` header:

```
Authorization: Bearer <token>
```

Tokens are obtained via `POST /auth/login`. Admin-only routes require the `admin` role.

---

### Rate Limit

- 60 requests per minute per IP