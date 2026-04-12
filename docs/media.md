# Media API

> See also: [API index](./api.md)

---

## GET /api/v1/media

Paginated list of media entries.

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | `1` | Page number |
| `limit` | number | `20` | Items per page (max 100) |
| `type` | string | — | Filter: `anime`, `manga`, `movie`, `ova`, `ona`, `special` |
| `status` | string | — | Filter: `current`, `finished`, `upcoming`, `tba` |
| `genre` | string | — | Filter by genre slug |
| `tag` | string | — | Filter by tag slug |
| `q` | string | — | Full-text search on title |
| `year_from` | number | — | Release year ≥ value |
| `year_to` | number | — | Release year ≤ value |
| `score_from` | number | — | Minimum score |
| `sort_by` | string | `popularity` | Sort field: `score`, `popularity`, `release_date`, `title`, `view_count` |
| `order` | string | `desc` | Sort direction: `asc` or `desc` |
| `locale` | string | `en` | Response locale |

### Response

```json
{
  "ok": true,
  "data": [
    {
      "id": 1,
      "slug": "my-anime",
      "content_type": "anime",
      "original_title": "マイアニメ",
      "title": "My Anime",
      "status": "current",
      "release_date": "2024-04-01",
      "score": 8.5,
      "popularity": 1200,
      "view_count": 50000,
      "synopsis_short": "A short description.",
      "poster_url": "https://cdn.example.com/poster.jpg"
    }
  ],
  "params": {
    "locale": "en",
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "pages": 5
  }
}
```

---

## GET /api/v1/media/:id

Single media detail including genres, tags, studios, networks, and rating info.

### Response

```json
{
  "ok": true,
  "data": {
    "id": 1,
    "slug": "my-anime",
    "content_type": "anime",
    "original_title": "マイアニメ",
    "title": "My Anime",
    "tagline": "The tagline.",
    "synopsis": "Full description.",
    "synopsis_short": "Short description.",
    "status": "current",
    "release_date": "2024-04-01",
    "end_date": null,
    "runtime_minutes": 24,
    "total_episodes": 12,
    "total_seasons": 1,
    "score": 8.5,
    "score_count": 340,
    "popularity": 1200,
    "view_count": 50000,
    "age_rating": "PG-13",
    "poster_url": "https://cdn.example.com/poster.jpg",
    "genres": [{ "id": 1, "slug": "action", "name": "Action" }],
    "tags": [{ "id": 3, "slug": "isekai", "label": "Isekai", "spoiler": false }],
    "studios": [{ "id": 2, "name": "Studio Name", "logo_url": null }],
    "networks": [{ "id": 1, "name": "Network", "slug": "network", "logo_url": null }],
    "rating_average": 8.3,
    "rating_count": 120
  },
  "params": { "locale": "en" }
}
```

---

## GET /api/v1/media/:id/seasons

Seasons for a media entry ordered by season number.

---

## GET /api/v1/media/:id/episodes

Flat episode list. Accepts `season` query param to filter by season number.

| Param | Default | Description |
|-------|---------|-------------|
| `season` | — | Filter by season number |
| `page` | `1` | Page number |
| `limit` | `20` | Items per page |

---

## GET /api/v1/media/:id/credits

Cast & crew for the media entry.

---

## GET /api/v1/media/:id/images

All images (posters, banners, artwork). Accepts optional `type` query param (`poster`, `banner`, etc.).

---

## GET /api/v1/media/:id/videos

Trailers, openings, endings.

---

## GET /api/v1/media/:id/related

Related titles (sequels, spinoffs, adaptations).

---

## GET /api/v1/media/:id/comments

Unified comments feed — can return comments for the media itself, or for any season/episode via query params.

See [comments.md](./comments.md#get-apiv1mediaidcomments--unified-feed) for full query parameters and response shape.

---

## POST /api/v1/media/bulk

Bulk update media entries. **Admin only.**

### Request Body

```json
{
  "ids": [1, 2, 3],
  "status": "finished",
  "tags": ["isekai", "action"],
  "tagAction": "add"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `ids` | number[] | Media IDs to update |
| `status` | string | New status value (optional) |
| `tags` | string[] | Tag slugs to apply (optional) |
| `tagAction` | string | `add` (default), `replace`, or `clear` |

### Response

```json
{ "ok": true, "data": { "success": true }, "params": { "locale": "en" } }
```