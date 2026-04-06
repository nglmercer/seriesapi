# People API

Cast & crew endpoints.

## GET /api/v1/people

Paginated list of people.

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
    {
      "id": 1,
      "name": "string",
      "originalName": "string",
      "image": "url",
      "occupation": "Director"
    }
  ],
  "params": { "page": 1, "pageSize": 20, "total": 50 }
}
```

---

## GET /api/v1/people/:id

Person detail with localized bio.

---

## GET /api/v1/people/:id/credits

All media a person appears in.