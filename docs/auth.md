# Authentication API

User registration, login, and management.

## POST /api/v1/auth/register

Register a new user.

### Request Body

```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "display_name": "string"
}
```

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| username | string | Yes | Unique username (3-20 chars) |
| email | string | Yes | Valid email address |
| password | string | Yes | Password (min 6 chars) |
| display_name | string | No | Display name (default: username) |

### Response (201)

```json
{
  "data": {
    "id": 1,
    "username": "string",
    "email": "string",
    "display_name": "string"
  },
  "params": { "locale": "en" }
}
```

---

## POST /api/v1/auth/login

Login user and get session token.

### Request Body

```json
{
  "username": "string",
  "password": "string"
}
```

### Response

```json
{
  "data": {
    "token": "string",
    "user": {
      "id": 1,
      "username": "string",
      "email": "string",
      "display_name": "string",
      "role": "user"
    }
  },
  "params": { "locale": "en" }
}
```

**Note:** Token is valid for 7 days. Include in subsequent requests as `Authorization: Bearer <token>`.

---

## POST /api/v1/auth/logout

Logout current user (requires authentication).

### Headers

```
Authorization: Bearer <token>
```

### Response

```json
{
  "data": { "message": "Logged out successfully" },
  "params": { "locale": "en" }
}
```

---

## GET /api/v1/auth/me

Get current user info (requires authentication).

### Headers

```
Authorization: Bearer <token>
```

### Response

```json
{
  "data": {
    "id": 1,
    "username": "string",
    "email": "string",
    "display_name": "string",
    "role": "user"
  },
  "params": { "locale": "en" }
}
```

---

## PATCH/PUT /api/v1/auth/update

Update current user profile (requires authentication).

### Headers

```
Authorization: Bearer <token>
```

### Request Body

```json
{
  "display_name": "string",
  "email": "string",
  "password": "string"
}
```

### Response

```json
{
  "data": { "message": "User updated successfully" },
  "params": { "locale": "en" }
}
```

---

## GET /api/v1/auth/users

List all users (admin only).

### Headers

```
Authorization: Bearer <admin_token>
```

### Response

```json
{
  "data": [
    {
      "id": 1,
      "username": "string",
      "email": "string",
      "display_name": "string",
      "role": "user",
      "is_active": 1,
      "created_at": "2024-04-01T00:00:00Z",
      "updated_at": "2024-04-01T00:00:00Z"
    }
  ],
  "params": { "locale": "en" }
}
```

---

## PATCH/PUT /api/v1/auth/users/:id

Update any user (admin only).

### Headers

```
Authorization: Bearer <admin_token>
```

### Request Body

```json
{
  "display_name": "string",
  "email": "string",
  "role": "admin",
  "is_active": true,
  "password": "string"
}
```

### Response

```json
{
  "data": { "message": "User updated successfully by admin" },
  "params": { "locale": "en" }
}
```

---

## DELETE /api/v1/auth/users/:id

Delete a user (admin only).

### Headers

```
Authorization: Bearer <admin_token>
```

### Response

```json
{
  "data": { "message": "User deleted successfully" },
  "params": { "locale": "en" }
}
```

---

## GET /api/v1/auth/roles

List all roles (admin only).

### Headers

```
Authorization: Bearer <admin_token>
```

### Response

```json
{
  "data": [
    { "id": 1, "name": "admin", "description": "System Administrator", "is_default": 1 }
  ],
  "params": { "locale": "en" }
}
```

---

## POST /api/v1/auth/roles

Create a new role (admin only).

### Headers

```
Authorization: Bearer <admin_token>
```

### Request Body

```json
{
  "name": "moderator",
  "description": "Content Moderator"
}
```

### Response (201)

```json
{
  "data": { "message": "Role created successfully" },
  "params": { "locale": "en" }
}
```

---

## PATCH/PUT /api/v1/auth/roles/:id

Update a role (admin only).

### Headers

```
Authorization: Bearer <admin_token>
```

### Request Body

```json
{
  "name": "moderator",
  "description": "Updated description"
}
```

### Response

```json
{
  "data": { "message": "Role updated successfully" },
  "params": { "locale": "en" }
}
```

---

## DELETE /api/v1/auth/roles/:id

Delete a role (admin only).

### Headers

```
Authorization: Bearer <admin_token>
```

### Response

```json
{
  "data": { "message": "Role deleted successfully" },
  "params": { "locale": "en" }
}
```

---

## POST /api/v1/auth/verify-code/generate

Generate verification code for role change (admin only).

### Headers

```
Authorization: Bearer <admin_token>
```

### Request Body

```json
{
  "username": "string",
  "target_role": "admin"
}
```

### Response

```json
{
  "data": {
    "code": "ABC12345",
    "username": "string",
    "target_role": "admin",
    "expires_at": "2024-04-01T00:10:00Z"
  },
  "params": { "locale": "en" }
}
```

---

## POST /api/v1/auth/verify-code/apply

Apply verification code to change user role.

### Request Body

```json
{
  "code": "ABC12345"
}
```

### Response

```json
{
  "data": {
    "message": "Role changed to admin",
    "username": "string",
    "role": "admin"
  },
  "params": { "locale": "en" }
}
```

---

## POST /api/v1/auth/role-challenge

Request a role change challenge (requires authentication).

### Headers

```
Authorization: Bearer <token>
```

### Request Body

```json
{
  "target_role": "moderator"
}
```

### Response

```json
{
  "data": {
    "message": "Challenge initiated. Please check server logs for verification code.",
    "expires_at": "2024-04-01T00:10:00Z"
  },
  "params": { "locale": "en" }
}
```

**Note:** The verification code will be logged to the server console for security reasons.