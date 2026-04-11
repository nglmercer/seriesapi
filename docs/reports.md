# Reports API

Content reporting endpoints.

## POST /api/v1/reports

Submit a content report.

### Request Body (JSON)

```json
{
  "entity_type": "media",
  "entity_id": 1,
  "report_type": "spam",
  "locale": "en",
  "message": "Optional message"
}
```

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| entity_type | string | Yes | media, season, episode, comment |
| entity_id | number | Yes | Entity ID |
| report_type | string | Yes | spam, abuse, spoiler, other |
| locale | string | No | Report language |
| message | string | No | Additional details |

### Response (201)

```json
{
  "data": { "message": "Report submitted successfully" },
  "params": { "locale": "en" }
}
```

---

## GET /api/v1/reports

List reports (admin only, requires authentication).

### Response

```json
{
  "data": [
    {
      "id": 1,
      "entity_type": "media",
      "entity_id": 1,
      "report_type": "spam",
      "status": "pending",
      "created_at": "2024-04-01T00:00:00Z"
    }
  ],
  "params": { "locale": "en" }
}
```