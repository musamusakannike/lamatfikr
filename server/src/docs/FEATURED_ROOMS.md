# Featured Rooms API Documentation

## Overview

The Featured Rooms functionality allows room owners to pay to have their rooms displayed prominently in a featured list. Payment is processed through Tap Payments integration.

## Pricing

- **Price per day**: $10 USD (configurable in controller)
- **Minimum duration**: 1 day
- **Maximum duration**: 365 days

## API Endpoints

### 1. Get Featured Rooms (Public)

```md
GET /api/featured-rooms?page=1&limit=10
```

**Description**: Retrieves a paginated list of currently active featured rooms.

**Query Parameters**:

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response**:

```json
{
  "featuredRooms": [
    {
      "_id": "featured_room_id",
      "roomId": {
        "name": "Room Name",
        "description": "Room Description",
        "image": "image_url",
        "category": "Technology",
        "membershipType": "free",
        "memberCount": 150
      },
      "userId": {
        "username": "owner_username",
        "fullName": "Owner Name",
        "profilePicture": "profile_url"
      },
      "startDate": "2024-01-01T00:00:00.000Z",
      "endDate": "2024-01-08T00:00:00.000Z",
      "days": 7,
      "status": "active"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

### 2. Initiate Featured Room Payment

```md
POST /api/featured-rooms/:roomId/initiate
Authorization: Bearer <token>
```

**Description**: Initiates a payment to feature a room for a specified number of days.

**Path Parameters**:

- `roomId`: MongoDB ObjectId of the room

**Request Body**:

```json
{
  "days": 7,
  "currency": "USD"
}
```

**Validation**:

- User must be the room owner
- Room must exist and not be deleted
- Room cannot already be featured
- Days must be between 1 and 365

**Response**:

```json
{
  "message": "Featured room payment initiated",
  "redirectUrl": "https://tap.company/payment/...",
  "chargeId": "chg_xxx",
  "amount": 70,
  "days": 7,
  "pricePerDay": 10
}
```

### 3. Verify Featured Room Payment

```md
GET /api/featured-rooms/:roomId/verify?tap_id=chg_xxx
Authorization: Bearer <token>
```

**Description**: Verifies the payment and activates the featured listing.

**Path Parameters**:

- `roomId`: MongoDB ObjectId of the room

**Query Parameters**:

- `tap_id`: Tap Payments charge ID

**Response**:

```json
{
  "message": "Room featured successfully",
  "featuredRoom": {
    "id": "featured_room_id",
    "startDate": "2024-01-01T00:00:00.000Z",
    "endDate": "2024-01-08T00:00:00.000Z",
    "days": 7,
    "amount": 70,
    "currency": "USD",
    "status": "active"
  }
}
```

### 4. Get Room Featured Status

```md
GET /api/featured-rooms/:roomId/status
Authorization: Bearer <token>
```

**Description**: Gets the featured status and history for a specific room (owner only).

**Path Parameters**:

- `roomId`: MongoDB ObjectId of the room

**Response**:

```json
{
  "isFeatured": true,
  "activeFeatured": {
    "id": "featured_room_id",
    "startDate": "2024-01-01T00:00:00.000Z",
    "endDate": "2024-01-08T00:00:00.000Z",
    "days": 7,
    "amount": 70,
    "currency": "USD",
    "status": "active"
  },
  "history": [
    {
      "_id": "featured_room_id",
      "startDate": "2024-01-01T00:00:00.000Z",
      "endDate": "2024-01-08T00:00:00.000Z",
      "days": 7,
      "amount": 70,
      "status": "active"
    }
  ],
  "pricePerDay": 10
}
```

### 5. Cancel Featured Room

```md
DELETE /api/featured-rooms/:roomId/:featuredId
Authorization: Bearer <token>
```

**Description**: Cancels an active featured listing (owner only). Note: This does not refund the payment.

**Path Parameters**:

- `roomId`: MongoDB ObjectId of the room
- `featuredId`: MongoDB ObjectId of the featured room record

**Response**:

```json
{
  "message": "Featured room cancelled successfully",
  "featuredRoom": {
    "id": "featured_room_id",
    "status": "cancelled"
  }
}
```

## Database Schema

### FeaturedRoom Model

```typescript
{
  roomId: ObjectId (ref: Room)
  userId: ObjectId (ref: User)
  startDate: Date
  endDate: Date
  days: Number (1-365)
  amount: Number
  currency: String (default: "USD")
  status: "pending" | "active" | "expired" | "cancelled"
  tapChargeId: String (optional)
  metadata: Object (optional)
  createdAt: Date
  updatedAt: Date
}
```

## Payment Flow

1. **Initiate Payment**:
   - Room owner calls `/api/featured-rooms/:roomId/initiate` with desired days
   - System validates ownership and calculates total amount
   - Creates Tap Payments charge and returns redirect URL
   - Creates FeaturedRoom record with status "pending"

2. **User Completes Payment**:
   - User is redirected to Tap Payments
   - User completes payment
   - Tap redirects back to frontend callback URL

3. **Verify Payment**:
   - Frontend calls `/api/featured-rooms/:roomId/verify` with tap_id
   - System verifies payment status with Tap API
   - If successful, updates FeaturedRoom status to "active"
   - Room now appears in featured list

4. **Automatic Expiration**:
   - Background service runs every hour
   - Checks for featured rooms past their endDate
   - Updates status from "active" to "expired"

## Background Services

### Featured Room Expiration Service
- **Location**: `src/services/featured-room.service.ts`
- **Interval**: Every 60 minutes
- **Function**: Automatically expires featured rooms past their end date
- **Started**: On server startup in `src/server.ts`

## Environment Variables

Required Tap Payments configuration:
```
TAP_SECRET_KEY=sk_test_xxx
TAP_PUBLIC_KEY=pk_test_xxx
FRONTEND_URL=http://localhost:3000
```

## Error Handling

Common error responses:

- `400`: Invalid request (bad room ID, invalid days, room already featured)
- `401`: Unauthorized (missing or invalid token)
- `403`: Forbidden (not room owner)
- `404`: Room not found
- `500`: Server error (payment gateway issues)
- `501`: Payment gateway not configured

## Notes

- Only room owners can feature their rooms
- A room can only have one active featured listing at a time
- Cancelling a featured listing does not provide a refund
- Featured rooms are automatically expired by a background service
- Payment is processed through Tap Payments gateway
- Featured rooms appear in chronological order (newest first)
