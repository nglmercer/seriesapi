# Seasons API

Season-level routes.

## GET /api/v1/seasons/:id

Season detail.

### Response

```json
{
  "data": {
    "id": 1,
    "mediaId": 1,
    "number": 1,
    "title": "Season 1",
    "synopsis": "string",
    "poster": "url",
    "year": 2024,
    "episodeCount": 12
  },
  "params": { "locale": "en" }
}
```

---

## GET /api/v1/seasons/:id/episodes

Episodes in season.

---

## GET /api/v1/seasons/:id/images

Season images.

---

## POST /api/v1/seasons

Create a new season.

### Request Body

```json
{
  "mediaId": 1,
  "number": 1,
  "title": "Season 1",
  "synopsis": "string",
  "poster": "url",
  "year": 2024
}
```

---

## PUT /api/v1/seasons

Update an existing season.

### Request Body

```json
{
  "id": 1,
  "title": "Updated Title",
  "synopsis": "Updated synopsis"
}
```

---

## DELETE /api/v1/seasons

Delete a season.