# API Documentation

Base URL: `http://localhost:8000/api/v1`

## Auth

### Register

`POST /auth/register`

Body:

```json
{
	"name": "Jane Doe",
	"email": "jane@example.com",
	"password": "password123",
	"role": "viewer"
}
```

### Login

`POST /auth/login`

Body:

```json
{
	"email": "jane@example.com",
	"password": "password123"
}
```

Response (data):

```json
{
	"user": {
		"id": "...",
		"name": "Jane Doe",
		"email": "jane@example.com",
		"role": "viewer",
		"status": "active",
		"createdAt": "2026-04-05T12:00:00.000Z"
	},
	"accessToken": "...",
	"refreshToken": "..."
}
```

### Refresh Token

`POST /auth/refresh-token`

Body:

```json
{
	"refreshToken": "..."
}
```

### Logout

`POST /auth/logout`

Requires: `Authorization: Bearer <accessToken>`

## Records

### Create Record (admin)

`POST /records`

Requires: `Authorization: Bearer <accessToken>`

Body:

```json
{
	"amount": 125.5,
	"type": "credit",
	"category": "salary",
	"date": "2026-04-05T12:00:00.000Z",
	"notes": "April payout"
}
```

### Get Records (admin, analyst, viewer)

`GET /records`

Requires: `Authorization: Bearer <accessToken>`

Query params (optional): `startDate`, `endDate`, `type`, `category`

### Update Record (admin)

`PUT /records/:id`

Requires: `Authorization: Bearer <accessToken>`

Body (any subset):

```json
{
	"amount": 150,
	"notes": "Adjusted amount"
}
```

### Delete Record (admin)

`DELETE /records/:id`

Requires: `Authorization: Bearer <accessToken>`

## Dashboard

### Get Summary

`GET /dashboard/summary`

Requires: `Authorization: Bearer <accessToken>`

Response (data):

```json
{
	"totalIncome": 0,
	"totalExpenses": 0,
	"netBalance": 0,
	"categoryWiseTotals": [
		{ "category": "salary", "type": "credit", "total": 125.5 }
	],
	"recentActivity": []
}
```

## Users (admin)

### Get Users

`GET /users`

Requires: `Authorization: Bearer <accessToken>`

### Get User By ID

`GET /users/:id`

Requires: `Authorization: Bearer <accessToken>`

### Update User Role

`PATCH /users/:id/role`

Requires: `Authorization: Bearer <accessToken>`

Body:

```json
{
	"role": "analyst"
}
```

### Update User Status

`PATCH /users/:id/status`

Requires: `Authorization: Bearer <accessToken>`

Body:

```json
{
	"status": "inactive"
}
```

## Common Responses

All responses follow:

```json
{
	"statusCode": 200,
	"data": {},
	"message": "Success",
	"success": true
}
```

Common errors:

- `400` bad request or validation issue
- `401` unauthorized
- `403` forbidden
- `404` not found
- `422` validation error
- `500` server error
