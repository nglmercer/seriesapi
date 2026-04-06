# Media API

## GET /api/v1/media

Paginated list of media entries.

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| pageSize | number | 20 | Items per page (max 100) |
| type | string | - | Filter: anime, manga, movie, ova, ona, special |
| status | string | - | Filter: current, finished, upcoming, tba |
| genre | string | - | Filter by genre slug |
| locale | string | en | Response locale |

### Response

```json
{
  "data": [
    {
      "id": 1,
      "type": "anime",
      "title": "string",
      "originalTitle": "string",
      "year": 2024,
      "poster": "url",
      "banner": "url",
      "status": "current",
      "genres": ["Action", "Sci-Fi"]
    }
  ],
  "params": {
    "page": 1,
    "pageSize": 20,
    "total": 100
  }
}
```

---

## GET /api/v1/media/:id

Single media detail.

### Response

```json
{
  "data": {
    "id": 1,
    "type": "anime",
    "title": "string",
    "originalTitle": "string",
    "synopsis": "string",
    "year": 2024,
    "season": "spring",
    "poster": "url",
    "banner": "url",
    "trailer": "url",
    "status": "current",
    "rating": 8.5,
    "genres": ["Action", "Sci-Fi"],
    "studios": ["Studio"],
    "duration": 24,
    "episodes": 12
  },
  "params": { "locale": "en" }
}
```

---

## GET /api/v1/media/:id/seasons

Seasons for a media entry.

---

## GET /api/v1/media/:id/episodes

Flat episode list (for movies/OVAs).

---

## GET /api/v1/media/:id/credits

Cast & crew for media.

---

## GET /api/v1/media/:id/images

All images (posters, banners, art).

---

## GET /api/v1/media/:id/videos

Trailers, openings, endings.

---

## GET /api/v1/media/:id/related

Related titles (sequels, spinoffs, adaptations).

---

## GET /api/v1/media/:id/comments

Public comments.