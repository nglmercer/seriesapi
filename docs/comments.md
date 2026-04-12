# Comments API

> See also: [API index](./api.md)

---

## POST /api/v1/comments

Create a new comment. **Auth required** — `display_name` is taken from the authenticated user.

### Request Body (JSON)

```json
{
  "entity_type": "episode",
  "entity_id": 5,
  "body": "Amazing scene!",
  "locale": "en",
  "contains_spoilers": false,
  "parent_id": null
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `entity_type` | string | ✅ | `media`, `season`, or `episode` |
| `entity_id` | number | ✅ | ID of the target entity |
| `body` | string | ✅ | Comment text |
| `locale` | string | — | Defaults to request locale |
| `contains_spoilers` | boolean | — | Default `false` |
| `parent_id` | number | — | Parent comment ID (for replies) |

### Response (201)

```json
{
  "ok": true,
  "data": {
    "id": 1,
    "entity_type": "episode",
    "entity_id": 5,
    "display_name": "user123",
    "body": "Amazing scene!",
    "locale": "en",
    "contains_spoilers": 0,
    "likes": 0,
    "dislikes": 0,
    "created_at": "2026-04-11T03:00:00.000Z"
  },
  "params": { "locale": "en" }
}
```

---

## GET /api/v1/comments/:id

Get a single top-level comment with its full reply thread.

### Response

```json
{
  "ok": true,
  "data": {
    "id": 1,
    "entity_type": "media",
    "entity_id": 1,
    "display_name": "user123",
    "body": "Great series!",
    "locale": "en",
    "contains_spoilers": 0,
    "likes": 5,
    "dislikes": 0,
    "created_at": "2026-04-11T03:00:00.000Z",
    "replies": [
      {
        "id": 7,
        "display_name": "user456",
        "body": "Agreed!",
        "locale": "en",
        "likes": 2,
        "contains_spoilers": 0,
        "created_at": "2026-04-11T04:00:00.000Z"
      }
    ]
  },
  "params": { "locale": "en" }
}
```

---

## GET /api/v1/media/:id/comments  _(unified feed)_

The **primary comments endpoint**. Returns top-level comments for any entity (media/season/episode) via query params.

> `GET /api/v1/episodes/:id/comments` and `GET /api/v1/seasons/:id/comments` behave the same but are scoped directly by path.

### Query Parameters

| Param | Default | Description |
|-------|---------|-------------|
| `entity_type` | `media` | `media`, `season`, or `episode` |
| `entity_id` | path `:id` | Override the entity ID. Defaults to the media ID in the path |
| `q` | — | Search within comment bodies (case-insensitive) |
| `sort_by` | `likes` | `likes` (most liked first) or `recent` (newest first) |
| `spoilers` | — | `1` to return only spoiler-tagged comments |
| `page` | `1` | Page number |
| `limit` | `20` | Items per page (max 100) |

### Examples

```
# Comments on the media itself
GET /api/v1/media/1/comments

# Comments on episode ID 5 (belonging to media 1)
GET /api/v1/media/1/comments?entity_type=episode&entity_id=5

# Comments on season ID 3
GET /api/v1/media/1/comments?entity_type=season&entity_id=3

# Text search, sorted newest first
GET /api/v1/media/1/comments?entity_type=episode&entity_id=5&q=amazing&sort_by=recent

# Spoiler-only comments
GET /api/v1/media/1/comments?entity_type=episode&entity_id=5&spoilers=1
```

### Response

```json
{
  "ok": true,
  "data": [
    {
      "id": 1,
      "entity_type": "episode",
      "entity_id": 5,
      "parent_id": null,
      "display_name": "user123",
      "locale": "en",
      "body": "Great episode!",
      "contains_spoilers": 0,
      "likes": 12,
      "dislikes": 0,
      "created_at": "2026-04-11T03:00:00.000Z",
      "replies": [
        {
          "id": 7,
          "display_name": "user456",
          "body": "Agreed!",
          "locale": "en",
          "likes": 2,
          "created_at": "2026-04-11T04:00:00.000Z"
        }
      ]
    }
  ],
  "params": {
    "locale": "en",
    "page": 1,
    "pageSize": 20,
    "total": 42,
    "entityType": "episode",
    "entityId": 5
  }
}
```

> **Replies:** Each top-level comment embeds a compact `replies[]` (only `id`, `display_name`, `body`, `locale`, `likes`, `created_at`). Use `GET /comments/:id` to get full reply detail for a single thread.

---

## GET /api/v1/comments/user

Get comments posted by the currently authenticated user. **Auth required.**

### Query Parameters

| Param | Default | Description |
|-------|---------|-------------|
| `page` | `1` | Page number |
| `limit` | `20` | Items per page |

### Response

```json
{
  "ok": true,
  "data": [
    {
      "id": 1,
      "entity_type": "episode",
      "entity_id": 5,
      "parent_id": null,
      "body": "Great episode!",
      "contains_spoilers": 0,
      "created_at": "2026-04-11T03:00:00.000Z",
      "title": "Localized episode title"
    }
  ],
  "params": { "locale": "en", "page": 1, "pageSize": 20, "total": 5 }
}
```

> IP addresses are SHA-256 hashed before storage and never exposed in responses.