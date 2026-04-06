# Genres API

## GET /api/v1/genres

Full genre list (localized).

### Response

```json
{
  "data": [
    { "id": 1, "slug": "action", "name": "Action", "count": 100 }
  ],
  "params": { "page": 1, "pageSize": 20, "total": 20 }
}
```

---

## GET /api/v1/genres/:slug

Genre detail + paginated media.

### Response

```json
{
  "data": {
    "id": 1,
    "slug": "action",
    "name": "Action",
    "description": "string",
    "media": []
  },
  "params": { "locale": "en", "page": 1, "pageSize": 20, "total": 100 }
}
```