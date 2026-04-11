# Tags API

Tag endpoints.

## GET /api/v1/tags

Paginated list of tags.

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| pageSize | number | 20 | Items per page |
| locale | string | en | Response locale |

### Response

```json
{
  "data": [
    { "id": 1, "slug": "mecha", "name": "Mecha", "count": 50 }
  ],
  "params": { "page": 1, "pageSize": 20, "total": 20 }
}
```