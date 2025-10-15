# WebSocket Chat Implementation Guide

## 🚀 Overview

This document describes the real-time chat implementation using Socket.IO for the CRM backend. The implementation enables instant message delivery without page refresh.

## 📋 Architecture

### Backend Components

1. **ChatGateway** (`src/modules/projects/Chats/chat.gateway.ts`)
   - Main WebSocket gateway handling real-time connections
   - Namespace: `/chat`
   - Manages user connections, chat rooms, and message broadcasting

2. **WsJwtGuard** (`src/modules/projects/Chats/guards/ws-jwt.guard.ts`)
   - JWT authentication for WebSocket connections
   - Validates tokens from handshake auth, headers, or query params

3. **ChatMessagesModule** (Updated)
   - Includes ChatGateway and WsJwtGuard providers
   - Integrates JwtModule for token verification

4. **ChatMessagesController** (Updated)
   - Emits Socket events when messages are created/updated/deleted via REST API
   - Ensures both REST and WebSocket clients receive updates

## 🔐 Authentication

### Token Validation

WebSocket connections require JWT authentication. The token can be provided in three ways:

1. **Auth object** (Recommended):
   ```javascript
   const socket = io('http://localhost:3000/chat', {
     auth: {
       token: 'your-jwt-token'
     }
   });
   ```

2. **Authorization header**:
   ```javascript
   const socket = io('http://localhost:3000/chat', {
     extraHeaders: {
       authorization: 'Bearer your-jwt-token'
     }
   });
   ```

3. **Query parameter**:
   ```javascript
   const socket = io('http://localhost:3000/chat?token=your-jwt-token');
   ```

### User Information

After authentication, the socket stores user data:
- `id`: User ID
- `role`: User role
- `type`: 'admin' or 'employee'
- `department`: User's department (optional)
- `permissions`: User permissions (optional)

## 📡 WebSocket Events

### Client → Server Events

#### 1. `authenticate`
Authenticate the WebSocket connection.

**Emit:**
```javascript
socket.emit('authenticate');
```

**Response:**
```javascript
{
  success: true,
  message: 'Authenticated successfully',
  userId: 123,
  socketId: 'abc123'
}
```

---

#### 2. `joinChat`
Join a specific chat room to receive messages.

**Emit:**
```javascript
socket.emit('joinChat', { chatId: 1 });
```

**Response:**
```javascript
{
  success: true,
  message: 'Joined chat 1'
}
```

**Requirements:**
- User must be a participant in the chat
- Authentication required

---

#### 3. `leaveChat`
Leave a chat room.

**Emit:**
```javascript
socket.emit('leaveChat', { chatId: 1 });
```

**Response:**
```javascript
{
  success: true,
  message: 'Left chat 1'
}
```

---

#### 4. `sendMessage`
Send a message to a chat.

**Emit:**
```javascript
socket.emit('sendMessage', {
  chatId: 1,
  content: 'Hello, world!'
});
```

**Response:**
```javascript
{
  success: true,
  data: {
    id: 456,
    chatId: 1,
    senderId: 123,
    message: 'Hello, world!',
    createdAt: '2025-10-09T...',
    // ... full message object
  }
}
```

**Broadcast to Room:**
All users in `chat_1` receive a `newMessage` event with the message data.

---

#### 5. `typing`
Notify others when user is typing.

**Emit:**
```javascript
socket.emit('typing', {
  chatId: 1,
  isTyping: true
});
```

**Broadcast to Room:**
Other users in the chat receive `userTyping` event:
```javascript
{
  chatId: 1,
  userId: 123,
  isTyping: true,
  timestamp: '2025-10-09T...'
}
```

---

#### 6. `markAsRead`
Mark a message as read.

**Emit:**
```javascript
socket.emit('markAsRead', {
  chatId: 1,
  messageId: 456
});
```

**Broadcast to Room:**
Other users receive `messageRead` event:
```javascript
{
  chatId: 1,
  messageId: 456,
  userId: 123,
  timestamp: '2025-10-09T...'
}
```

---

### Server → Client Events

#### 1. `newMessage`
Received when a new message is sent in a chat you've joined.

**Listen:**
```javascript
socket.on('newMessage', (data) => {
  console.log('New message:', data);
  // {
  //   message: { id, chatId, senderId, message, ... },
  //   chatId: 1,
  //   timestamp: '2025-10-09T...'
  // }
});
```

---

#### 2. `messageUpdated`
Received when a message is updated.

**Listen:**
```javascript
socket.on('messageUpdated', (data) => {
  console.log('Message updated:', data);
  // {
  //   message: { id, chatId, message, ... },
  //   chatId: 1,
  //   timestamp: '2025-10-09T...'
  // }
});
```

---

#### 3. `messageDeleted`
Received when a message is deleted.

**Listen:**
```javascript
socket.on('messageDeleted', (data) => {
  console.log('Message deleted:', data);
  // {
  //   messageId: 456,
  //   chatId: 1,
  //   timestamp: '2025-10-09T...'
  // }
});
```

---

#### 4. `userTyping`
Received when another user is typing.

**Listen:**
```javascript
socket.on('userTyping', (data) => {
  console.log('User typing:', data);
  // {
  //   chatId: 1,
  //   userId: 123,
  //   isTyping: true,
  //   timestamp: '2025-10-09T...'
  // }
});
```

---

#### 5. `userJoined`
Received when a user joins the chat room.

**Listen:**
```javascript
socket.on('userJoined', (data) => {
  console.log('User joined:', data);
  // {
  //   chatId: 1,
  //   userId: 123,
  //   timestamp: '2025-10-09T...'
  // }
});
```

---

#### 6. `userLeft`
Received when a user leaves the chat room.

**Listen:**
```javascript
socket.on('userLeft', (data) => {
  console.log('User left:', data);
  // {
  //   chatId: 1,
  //   userId: 123,
  //   timestamp: '2025-10-09T...'
  // }
});
```

---

## 🔄 Connection Lifecycle

### 1. Connect to WebSocket Server
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000/chat', {
  auth: {
    token: localStorage.getItem('access_token')
  },
  transports: ['websocket', 'polling']
});
```

### 2. Handle Connection Events
```javascript
socket.on('connect', () => {
  console.log('✅ Connected:', socket.id);
  
  // Authenticate
  socket.emit('authenticate');
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected');
});

socket.on('error', (error) => {
  console.error('Socket error:', error);
});
```

### 3. Join Chat Room(s)
```javascript
socket.emit('joinChat', { chatId: 1 });
```

### 4. Listen for Messages
```javascript
socket.on('newMessage', (data) => {
  // Update UI with new message
  addMessageToUI(data.message);
});
```

### 5. Send Messages
```javascript
// Option 1: Via WebSocket (instant)
socket.emit('sendMessage', {
  chatId: 1,
  content: 'Hello!'
});

// Option 2: Via REST API (also triggers WebSocket event)
await fetch('/chat-messages', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    chatId: 1,
    content: 'Hello!'
  })
});
```

### 6. Cleanup
```javascript
// Leave chat rooms when component unmounts
socket.emit('leaveChat', { chatId: 1 });

// Disconnect socket
socket.disconnect();
```

---

## 💡 Best Practices

### 1. **Connection Management**
- Connect once when user logs in
- Reuse the same socket connection across your app
- Disconnect on logout

### 2. **Room Management**
- Join chat rooms only when viewing the chat
- Leave rooms when navigating away
- Handle reconnection by rejoining active rooms

### 3. **Error Handling**
```javascript
socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
  // Retry logic or show error to user
});

socket.on('connect_timeout', () => {
  console.error('Connection timeout');
});
```

### 4. **Typing Indicators**
- Debounce typing events (send after 500ms of typing)
- Clear typing indicator after 3-5 seconds

```javascript
let typingTimeout;

inputField.addEventListener('input', () => {
  socket.emit('typing', { chatId: 1, isTyping: true });
  
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    socket.emit('typing', { chatId: 1, isTyping: false });
  }, 3000);
});
```

### 5. **Message Deduplication**
```javascript
const processedMessages = new Set();

socket.on('newMessage', (data) => {
  const messageId = data.message.id;
  
  if (processedMessages.has(messageId)) {
    return; // Already processed
  }
  
  processedMessages.add(messageId);
  addMessageToUI(data.message);
});
```

---

## 🧪 Testing

### Test Connection
```bash
# Install Socket.IO client CLI tool
npm install -g socket.io-client-tool

# Connect to server
socket.io-client http://localhost:3000/chat --auth token=your-jwt-token
```

### Test with Postman (WebSocket)
1. Create new WebSocket request
2. URL: `ws://localhost:3000/chat`
3. Add auth in connection settings
4. Send events as JSON

### Test with Browser Console
```javascript
// Load Socket.IO client
const script = document.createElement('script');
script.src = 'https://cdn.socket.io/4.5.4/socket.io.min.js';
document.head.appendChild(script);

// After script loads
const socket = io('http://localhost:3000/chat', {
  auth: { token: 'your-token' }
});

socket.on('connect', () => console.log('Connected'));
socket.emit('joinChat', { chatId: 1 });
socket.on('newMessage', (data) => console.log('Message:', data));
```

---

## 🐛 Troubleshooting

### Connection Refused
- Verify server is running on correct port
- Check CORS configuration in `main.ts`
- Ensure frontend URL is in allowed origins

### Authentication Failed
- Verify JWT token is valid
- Check token expiration
- Ensure token is sent in correct format

### Messages Not Received
- Confirm you've joined the chat room with `joinChat`
- Verify you're listening to correct events
- Check browser console for errors

### Duplicate Messages
- Implement message deduplication by ID
- Don't call `joinChat` multiple times for same room

---

## 📊 Monitoring

### Active Connections
The gateway tracks active users and provides utility methods:

```typescript
// In your service/controller
const activeUsers = chatGateway.getActiveUsersCount();
const userSockets = chatGateway.getUserSockets(userId);
const isOnline = chatGateway.isUserOnline(userId);
```

### Logging
The gateway logs important events:
- ✅ User connections/disconnections
- 📥 Chat room joins
- 📤 Chat room leaves
- 📨 Message sends
- 🚫 Authorization failures

Check server console for these logs.

---

## 🔒 Security Considerations

1. **JWT Validation**: All WebSocket events (except connection) require valid JWT
2. **Room Authorization**: Users can only join chats they're participants in
3. **Message Permissions**: Users can only send messages to chats they're part of
4. **CORS**: Only allowed origins can establish WebSocket connections
5. **Rate Limiting**: Consider implementing rate limiting for message sends

---

## 🚀 Deployment Notes

### Environment Variables
Ensure these are set in production:
```bash
JWT_SECRET=your-production-secret-key
PORT=3000
```

### CORS Configuration
Update allowed origins in `main.ts` and `chat.gateway.ts`:
```typescript
origin: [
  'https://your-production-frontend.com',
  // ... other allowed origins
]
```

### WebSocket Transport
Production servers should support WebSocket transport. If behind a reverse proxy (nginx, Apache):

**Nginx Configuration:**
```nginx
location /chat {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
}
```

### Health Check
Monitor WebSocket connections:
```typescript
// Add to gateway
@SubscribeMessage('ping')
handlePing() {
  return { pong: Date.now() };
}
```

---

## 📚 Additional Resources

- [Socket.IO Documentation](https://socket.io/docs/v4/)
- [NestJS WebSockets](https://docs.nestjs.com/websockets/gateways)
- [JWT Best Practices](https://jwt.io/introduction)

---

## 🎯 Summary

The WebSocket implementation provides:
- ✅ Real-time message delivery
- ✅ Typing indicators
- ✅ User presence tracking
- ✅ JWT authentication
- ✅ Room-based messaging
- ✅ Dual REST + WebSocket support
- ✅ Message read receipts
- ✅ Comprehensive error handling

For frontend implementation guide, see the main conversation for React/Vue/Angular examples.

