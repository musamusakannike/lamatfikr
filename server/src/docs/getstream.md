# Stream (getstream.io) Calls & Livestream Documentation

**Backend:** Node.js + Express
**Frontend:** Next.js (App Router or Pages Router)

---

## 1. Overview of Stream Video Capabilities

Stream provides a unified **Calls API** that supports:

| Feature               | Stream Call Type |
| --------------------- | ---------------- |
| 1-to-1 Video Call     | `default`        |
| Group Video Meeting   | `default`        |
| 1-to-1 Audio Call     | `audio_room`     |
| Group Audio Meeting   | `audio_room`     |
| Livestream (1 → many) | `livestream`     |

All of these use the **same core API**, with configuration differences.

---

## 2. Prerequisites

### 2.1 Create a Stream Account

1. Go to **[https://getstream.io](https://getstream.io)**
2. Create an app
3. Enable **Video & Audio**
4. Copy:

   * **API Key**
   * **API Secret**

---

## 3. Backend Setup (Node.js + Express)

### 3.1 Install Dependencies

```bash
npm install express cors dotenv stream-chat
```

> Stream Video uses the same server SDK as Stream Chat.

---

### 3.2 Environment Variables

```env
STREAM_API_KEY=your_api_key
STREAM_API_SECRET=your_api_secret
```

---

### 3.3 Initialize Stream Client

```js
// lib/stream.js
import { StreamChat } from 'stream-chat';

export const streamServerClient = StreamChat.getInstance(
  process.env.STREAM_API_KEY,
  process.env.STREAM_API_SECRET
);
```

---

## 4. Authentication (Required for All Call Types)

### 4.1 Generate User Token

Stream **requires a signed token from your backend**.

```js
// routes/stream.js
import express from 'express';
import { streamServerClient } from '../lib/stream.js';

const router = express.Router();

router.post('/token', (req, res) => {
  const { userId } = req.body;

  const token = streamServerClient.createToken(userId);

  res.json({ token });
});

export default router;
```

---

## 5. Call Types Explained

### 5.1 Call Type Summary

| Call Type    | Use Case               |
| ------------ | ---------------------- |
| `default`    | Video calls & meetings |
| `audio_room` | Audio-only calls       |
| `livestream` | Broadcasting           |

---

## 6. Creating Calls (Backend)

### 6.1 Create or Join a Call

Calls are **created on demand**.

```js
router.post('/call', async (req, res) => {
  const { callType, callId, userId } = req.body;

  const call = streamServerClient.call(callType, callId);

  await call.getOrCreate({
    data: {
      created_by_id: userId
    }
  });

  res.json({ success: true });
});
```

---

## 7. Frontend Setup (Next.js)

### 7.1 Install Stream Video SDK

```bash
npm install @stream-io/video-react-sdk
```

---

### 7.2 Global Styles

```css
@import '@stream-io/video-react-sdk/dist/css/styles.css';
```

---

## 8. Initialize Video Client (Frontend)

```tsx
import {
  StreamVideoClient,
  StreamVideo
} from '@stream-io/video-react-sdk';

const client = new StreamVideoClient({
  apiKey: process.env.NEXT_PUBLIC_STREAM_API_KEY,
  user: {
    id: userId,
    name: 'User Name'
  },
  token
});
```

---

## 9. 1-to-1 Video Call

### 9.1 Call Type

```ts
callType = 'default'
```

### 9.2 Frontend UI

```tsx
import {
  Call,
  CallControls,
  SpeakerLayout
} from '@stream-io/video-react-sdk';

const call = client.call('default', 'call-id');

await call.join();

return (
  <StreamVideo client={client}>
    <Call call={call}>
      <SpeakerLayout />
      <CallControls />
    </Call>
  </StreamVideo>
);
```

---

## 10. Group Video Meeting

**Same implementation as 1-to-1**, only difference is:

* Multiple users join the same `callId`

```txt
callType: default
callId: meeting-123
```

---

## 11. 1-to-1 Audio Call

### 11.1 Call Type

```ts
callType = 'audio_room'
```

### 11.2 UI

```tsx
import {
  Call,
  CallControls,
  AudioRoomLayout
} from '@stream-io/video-react-sdk';

const call = client.call('audio_room', 'audio-1');

await call.join();

<AudioRoomLayout />
<CallControls />
```

---

## 12. Group Audio Meeting

Same as 1-to-1 audio, just multiple participants.

```txt
callType: audio_room
callId: audio-room-1
```

---

## 13. Livestream (Broadcast)

### 13.1 Call Type

```ts
callType = 'livestream'
```

---

### 13.2 Roles

| Role   | Permissions         |
| ------ | ------------------- |
| Host   | Publish audio/video |
| Viewer | Watch only          |

---

### 13.3 Create Livestream (Backend)

```js
await call.getOrCreate({
  data: {
    created_by_id: hostId,
    members: [{ user_id: hostId, role: 'host' }]
  }
});
```

---

### 13.4 Host UI

```tsx
import {
  LivestreamLayout,
  CallControls
} from '@stream-io/video-react-sdk';

<LivestreamLayout />
<CallControls />
```

---

### 13.5 Viewer UI

```tsx
<LivestreamLayout />
```

(Viewers do not get controls by default)

---

## 14. Permissions & Roles

Stream supports:

* `host`
* `admin`
* `user`
* `viewer`

Roles are enforced automatically by Stream.

---

## 15. Security Best Practices

✔ Always generate tokens on backend
✔ Never expose API Secret
✔ Validate authenticated users before issuing tokens
✔ Use HTTPS in production

---

## 16. Recommended Folder Structure

```md
backend/
 ├── routes/
 │    └── stream.js
 ├── lib/
 │    └── stream.js

frontend/
 ├── components/
 │    └── CallUI.tsx
 ├── app/
 │    └── call/[id]/page.tsx
```

---

## 17. What You Can Build With This

* Anonymous 1-to-1 calls
* Classrooms & meetings
* Audio rooms (Twitter Spaces-like)
* Live events
* Creator livestreams

---
