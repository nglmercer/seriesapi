# Ratings API

Rating submission and retrieval.

## POST /api/v1/ratings

Submit or update a rating (requires authentication).

### Headers

```
Authorization: Bearer <token>
```

### Request Body

```json
{
  "entity_type": "media",
  "entity_id": 1,
  "score": 8.5
}
```

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| entity_type | string | Yes | media, season, episode |
| entity_id | number | Yes | Entity ID |
| score | number | Yes | Score (1-10) |

### Response

```json
{
  "data": {
    "average": 8.2,
    "count": 150
  },
  "params": { "locale": "en" }
}
```

---

## GET /api/v1/ratings

Get ratings for a specific entity.

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| entity_type | string | Yes | media, season, episode |
| entity_id | number | Yes | Entity ID |

### Response

```json
{
  "data": {
    "average": 8.2,
    "count": 150,
    "userScore": 8
  },
  "params": { "locale": "en" }
}
```

**Note:** `userScore` is only included if authenticated.

---

## GET /api/v1/ratings/top

Get top rated entities.

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| entity_type | string | media | media, season, episode |
| limit | number | 10 | Number of results |
| min_votes | number | 5 | Minimum votes required |

### Response

```json
{
  "data": [
    {
      "id": 1,
      "slug": "string",
      "score": 9.5,
      "score_count": 500,
      "title": "string"
    }
  ],
  "params": { "locale": "en" }
}
```

---

## GET /api/v1/ratings/user

Get current user's ratings (requires authentication).

### Headers

```
Authorization: Bearer <token>
```

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Items per page |

### Response

```json
{
  "data": [
    {
      "id": 1,
      "entity_type": "media",
      "entity_id": 1,
      "score": 8,
      "title": "string",
      "slug": "string",
      "created_at": "2024-04-01T00:00:00Z"
    }
  ],
  "params": { "locale": "en", "page": 1, "pageSize": 20, "total": 50 }
}
```