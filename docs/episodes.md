# Episodes API

Episode-level routes.

## GET /api/v1/episodes/:id

Episode detail.

### Response

```json
{
  "data": {
    "id": 1,
    "mediaId": 1,
    "seasonNumber": 1,
    "number": 1,
    "title": "Episode 1",
    "synopsis": "string",
    "airDate": "2024-04-01",
    "runtime": 24,
    "thumbnail": "url"
  },
  "params": { "locale": "en" }
}
```

---

## GET /api/v1/episodes/:id/credits

Guest cast & crew for episode.

---

## GET /api/v1/episodes/:id/images

Stills / thumbnails.

---

## GET /api/v1/episodes/:id/comments

Threaded comments.

---

## POST /api/v1/episodes

Create a new episode.

### Request Body

```json
{
  "mediaId": 1,
  "seasonNumber": 1,
  "number": 1,
  "title": "Episode 1",
  "synopsis": "string",
  "airDate": "2024-04-01",
  "runtime": 24,
  "thumbnail": "url"
}
```

---

## PUT /api/v1/episodes

Update an existing episode.

### Request Body

```json
{
  "id": 1,
  "title": "Updated Title",
  "synopsis": "Updated synopsis"
}
```

---

## DELETE /api/v1/episodes

Delete an episode.