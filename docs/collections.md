# Collections API

Franchise / collection routes.

## GET /api/v1/collections

All collections (paginated).

### Response

```json
{
  "data": [
    { "id": 1, "slug": " fate-series", "name": "Fate Series", "mediaCount": 10 }
  ],
  "params": { "page": 1, "pageSize": 20, "total": 5 }
}
```

---

## GET /api/v1/collections/:slug

Collection detail + ordered media.

### Response

```json
{
  "data": {
    "id": 1,
    "slug": "fate-series",
    "name": "Fate Series",
    "synopsis": "string",
    "poster": "url",
    "media": []
  },
  "params": { "locale": "en", "total": 10 }
}
```