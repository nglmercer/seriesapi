# Search API

Cross-entity full-text search.

## GET /api/v1/search

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| q | string | Yes | Search query |
| type | string | No | Filter: media, person, collection |
| locale | string | No | Response locale |
| page | number | No | Page number |

### Response

```json
{
  "data": [
    {
      "id": 1,
      "entityType": "media",
      "title": "string",
      "type": "anime",
      "poster": "url"
    }
  ],
  "params": { "page": 1, "pageSize": 20, "total": 50 }
}
```

### Search Fields

- `media.original_title` + `media_translations.title`
- `people.name` + `people_translations.name`
- `collections` (via `collection_translations.name`)