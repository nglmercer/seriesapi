# Comments API

Public comment submission.

## POST /api/v1/comments

Create a new comment.

### Request Body (JSON)

```json
{
  "entity_type": "media",
  "entity_id": 1,
  "display_name": "Anonymous",
  "body": "Great series!",
  "locale": "en",
  "contains_spoilers": false,
  "parent_id": null
}
```

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| entity_type | string | Yes | media, season, episode |
| entity_id | number | Yes | Entity ID |
| display_name | string | Yes | Display name |
| body | string | Yes | Comment body |
| locale | string | No | Language (default: en) |
| contains_spoilers | boolean | No | Spoiler flag |
| parent_id | number | No | Parent comment ID (for replies) |

### Response (201)

```json
{
  "data": {
    "id": 1,
    "createdAt": "2024-04-01T00:00:00Z"
  },
  "params": { "locale": "en" }
}
```

---

## GET /api/v1/comments/:id

Get single comment thread.

### Response

```json
{
  "data": {
    "id": 1,
    "entityType": "media",
    "entityId": 1,
    "displayName": "Anonymous",
    "body": "Great series!",
    "createdAt": "2024-04-01T00:00:00Z",
    "replies": []
  },
  "params": { "locale": "en" }
}
```

---

## GET /api/v1/comments/user

Get comments by current user (requires authentication).

### Response

```json
{
  "data": [
    {
      "id": 1,
      "entityType": "media",
      "entityId": 1,
      "body": "Great series!",
      "createdAt": "2024-04-01T00:00:00Z"
    }
  ],
  "params": { "page": 1, "pageSize": 20, "total": 10 }
}
```

> Note: IP is hashed before storage. No auth required.