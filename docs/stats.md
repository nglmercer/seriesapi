# Statistics API

> See also: [API index](./api.md)

The stats API provides an agnostic way to retrieve counts and statistics for various database tables.

---

## GET /api/v1/stats/:resource

Retrieve statistics for a specific resource.

### Path Parameters

| Param | Description |
|-------|-------------|
| `:resource` | The table/resource name (e.g., `media`, `episodes`, `comments`, `users`) |

### Query Parameters

You can filter the count by adding query parameters that match table columns. Common parameters like `page`, `limit`, and `locale` are ignored for filtering.

| Example | Description |
|---------|-------------|
| `?season_id=5` | Count records with `season_id = 5` |
| `?entity_type=media` | Count records with `entity_type = 'media'` |
| `?is_active=1` | Count active users |

### Allowed Resources

`media`, `seasons`, `episodes`, `people`, `comments`, `ratings`, `genres`, `tags`, `collections`, `users`, `studios`, `networks`, `images`, `videos`.

### Response

```json
{
  "ok": true,
  "data": {
    "resource": "episodes",
    "table": "episodes",
    "total": 1250,
    "filtered": 12,
    "filters": {
      "season_id": "5"
    }
  },
  "params": {
    "locale": "en"
  }
}
```

- `total`: Total number of records in the table.
- `filtered`: Number of records matching the provided query parameters (only present if filters were applied).
- `filters`: The filters that were actually applied to the calculation.
