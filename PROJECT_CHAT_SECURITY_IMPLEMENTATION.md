# Project Chat Security Implementation

## Overview
This document outlines the comprehensive security implementation for the Project Chat system, ensuring users can only access chats, participants, and messages where they are authorized participants.

---

## Security Rules

### 🔒 Core Security Principle
**Users can ONLY access data from chats where they are participants.**

---

## 1. Project Chats Security

### ✅ GET `/project-chats` - Get All Project Chats
**Security Check:** ✓ Implemented
- **Rule:** Only returns chats where the requesting user is a participant
- **Implementation:**
  ```typescript
  // 1. Fetch all chat IDs where user is a participant
  const userParticipations = await this.prisma.chatParticipant.findMany({
    where: { employeeId: requesterId },
    select: { chatId: true }
  });
  
  // 2. Only return chats from those IDs
  where: { id: { in: accessibleChatIds } }
  ```
- **File:** `src/modules/projects/Chats/project-chats/project-chats.service.ts:9-106`

### ✅ GET `/project-chats/:id` - Get Project Chat by ID
**Security Check:** ✓ Implemented
- **Rule:** User must be a participant of the chat to view it
- **Implementation:**
  ```typescript
  const requesterParticipant = await this.prisma.chatParticipant.findFirst({
    where: {
      chatId: id,
      employeeId: requesterId,
    },
  });

  if (!requesterParticipant) {
    throw new ForbiddenException('Access denied. Only chat participants can view this chat.');
  }
  ```
- **File:** `src/modules/projects/Chats/project-chats/project-chats.service.ts:108-189`

### ✅ GET `/project-chats/project/:projectId` - Get Chat by Project ID
**Security Check:** ✓ Implemented
- **Rule:** User must be a participant of the chat to view it
- **Implementation:** Same as above, checks after fetching the chat
- **File:** `src/modules/projects/Chats/project-chats/project-chats.service.ts:191-272`

---

## 2. Chat Participants Security

### ✅ GET `/chat-participants` - Get All Chat Participants
**Security Check:** ✓ NEW - Just Implemented
- **Rule:** Only returns participants from chats where the requesting user is also a participant
- **Implementation:**
  ```typescript
  // 1. Get all chats where requester is a participant
  const userParticipations = await this.prisma.chatParticipant.findMany({
    where: { employeeId: requesterId },
    select: { chatId: true }
  });

  // 2. Only return participants from those chats
  return await this.prisma.chatParticipant.findMany({
    where: { chatId: { in: accessibleChatIds } }
  });
  ```
- **File:** `src/modules/projects/Chats/chat-participants/chat-participants.service.ts:10-86`
- **What Changed:** Added `requesterId` parameter and filtering logic

### ✅ GET `/chat-participants/:id` - Get Participant by ID
**Security Check:** ✓ NEW - Just Implemented
- **Rule:** User must be a participant in the same chat to view participant details
- **Implementation:**
  ```typescript
  // 1. Fetch the participant record
  const participant = await this.prisma.chatParticipant.findUnique({ where: { id } });
  
  // 2. Check if requester is in the same chat
  const requesterParticipant = await this.prisma.chatParticipant.findFirst({
    where: {
      chatId: participant.chatId,
      employeeId: requesterId,
    },
  });

  if (!requesterParticipant) {
    throw new ForbiddenException('Access denied. Only chat participants can view participant details.');
  }
  ```
- **File:** `src/modules/projects/Chats/chat-participants/chat-participants.service.ts:88-195`
- **What Changed:** Added `requesterId` parameter and participant verification

### ✅ GET `/chat-participants/chat/:chatId` - Get Participants by Chat ID
**Security Check:** ✓ NEW - Just Implemented
- **Rule:** User must be a participant of the chat to view its participant list
- **Implementation:**
  ```typescript
  // 1. Check if chat exists
  const chat = await this.prisma.projectChat.findUnique({ where: { id: chatId } });
  
  // 2. Check if requester is a participant
  const requesterParticipant = await this.prisma.chatParticipant.findFirst({
    where: {
      chatId: chatId,
      employeeId: requesterId,
    },
  });

  if (!requesterParticipant) {
    throw new ForbiddenException('Access denied. Only chat participants can view the participant list.');
  }
  
  // 3. Return all participants (requester is verified)
  return participants;
  ```
- **File:** `src/modules/projects/Chats/chat-participants/chat-participants.service.ts:197-268`
- **What Changed:** Added chat existence check and participant verification

### ✅ POST `/chat-participants` - Create Participant
**Security Check:** ✓ Already Implemented
- **Rule:** Only chat owners can add new participants
- **Implementation:** Verifies requester is an owner before allowing participant addition
- **File:** `src/modules/projects/Chats/chat-participants/chat-participants.service.ts:270-391`

### ✅ DELETE `/chat-participants/:id` - Remove Participant
**Security Check:** ✓ Already Implemented
- **Rule:** Only chat owners can remove participants
- **Implementation:** Verifies requester is an owner before allowing removal
- **File:** `src/modules/projects/Chats/chat-participants/chat-participants.service.ts:538-641`

---

## 3. Chat Messages Security

### ✅ GET `/chat-messages/chat/:chatId` - Get Messages by Chat ID
**Security Check:** ✓ Already Implemented
- **Rule:** Only chat participants can access messages
- **Implementation:**
  ```typescript
  const requesterParticipant = await this.prisma.chatParticipant.findFirst({
    where: {
      chatId: chatId,
      employeeId: requesterId,
    },
  });

  if (!requesterParticipant) {
    throw new ForbiddenException('Only chat participants can access messages. You are not a participant in this chat.');
  }
  ```
- **File:** `src/modules/projects/Chats/chat-messages/chat-messages.service.ts:153-242`

### ✅ POST `/chat-messages` - Create Message
**Security Check:** ✓ Already Implemented
- **Rule:** Only chat participants can send messages
- **Implementation:**
  ```typescript
  const participant = await this.prisma.chatParticipant.findFirst({
    where: {
      chatId: chatId,
      employeeId: senderId,
    },
  });

  if (!participant) {
    throw new ForbiddenException('Employee is not a participant in chat. Only chat participants can send messages.');
  }
  ```
- **File:** `src/modules/projects/Chats/chat-messages/chat-messages.service.ts:303-409`

### ✅ PUT `/chat-messages/:id` - Update Message
**Security Check:** ✓ Already Implemented
- **Rule:** Only the original sender can edit their own messages (within 2 minutes)
- **Additional Check:** Sender must still be a participant in the chat
- **File:** `src/modules/projects/Chats/chat-messages/chat-messages.service.ts:411-553`

### ✅ DELETE `/chat-messages/:id` - Delete Message
**Security Check:** ✓ Already Implemented
- **Rule:** 
  - Original sender can delete within 60 minutes
  - Chat owners can delete any message (marks as deleted instead)
- **File:** `src/modules/projects/Chats/chat-messages/chat-messages.service.ts:555-646`

---

## Security Summary

| Endpoint | Method | Security Status | Rule |
|----------|--------|----------------|------|
| `/project-chats` | GET | ✅ Secured | Returns only chats where user is participant |
| `/project-chats/:id` | GET | ✅ Secured | User must be participant of chat |
| `/project-chats/project/:projectId` | GET | ✅ Secured | User must be participant of chat |
| `/chat-participants` | GET | ✅ **NEW** | Returns participants only from user's chats |
| `/chat-participants/:id` | GET | ✅ **NEW** | User must be in same chat |
| `/chat-participants/chat/:chatId` | GET | ✅ **NEW** | User must be participant of chat |
| `/chat-participants` | POST | ✅ Secured | Only owners can add participants |
| `/chat-participants/:id` | DELETE | ✅ Secured | Only owners can remove participants |
| `/chat-messages/chat/:chatId` | GET | ✅ Secured | User must be participant of chat |
| `/chat-messages` | POST | ✅ Secured | User must be participant of chat |
| `/chat-messages/:id` | PUT | ✅ Secured | Only sender (within 2 min) |
| `/chat-messages/:id` | DELETE | ✅ Secured | Sender (60 min) or owner |

---

## Testing Your Security

### Test 1: User Cannot Access Other Chats
```bash
# Login as User A
POST /auth/login
{ "email": "userA@company.com", "password": "xxx" }

# Try to get all chats (should only see chats where User A is participant)
GET /project-chats
Authorization: Bearer <userA_token>
```

### Test 2: User Cannot View Participants of Non-Member Chat
```bash
# Login as User B (not in chat 123)
POST /auth/login
{ "email": "userB@company.com", "password": "xxx" }

# Try to view participants of chat 123
GET /chat-participants/chat/123
Authorization: Bearer <userB_token>
# Expected: 403 Forbidden - "Access denied. Only chat participants can view the participant list."
```

### Test 3: User Cannot View Messages from Non-Member Chat
```bash
# Login as User C (not in chat 456)
POST /auth/login
{ "email": "userC@company.com", "password": "xxx" }

# Try to view messages from chat 456
GET /chat-messages/chat/456
Authorization: Bearer <userC_token>
# Expected: 403 Forbidden - "Only chat participants can access messages."
```

---

## Error Messages

All unauthorized access attempts will return:
- **Status Code:** `403 Forbidden`
- **Error Messages:**
  - `"Access denied. Only chat participants can view this chat."`
  - `"Access denied. Only chat participants can view participant details."`
  - `"Access denied. Only chat participants can view the participant list."`
  - `"Only chat participants can access messages. You are not a participant in this chat."`
  - `"Only chat owners can add participants. You are not an owner of this chat."`
  - `"Only chat owners can remove participants. You are not an owner of this chat."`

---

## Implementation Date
**Implemented:** October 8, 2025

## Files Modified
1. `src/modules/projects/Chats/chat-participants/chat-participants.controller.ts`
2. `src/modules/projects/Chats/chat-participants/chat-participants.service.ts`

## Related Documentation
- JWT Authentication Guard: `src/modules/auth/guards/jwt-auth.guard.ts`
- Chat Models: Check Prisma schema for `ProjectChat`, `ChatParticipant`, `ChatMessage`

---

## Notes for Developers

1. **All chat-related endpoints are protected by JWT authentication** - Users must be logged in
2. **Participant verification happens at the service layer** - Controllers pass `req.user.id` to services
3. **ForbiddenException is thrown for unauthorized access** - Returns 403 status code
4. **Empty arrays are returned instead of errors** - When a user has no accessible chats/participants
5. **Admin users do NOT bypass these checks** - Even admins must be participants to access chats

---

## Future Enhancements

Consider adding:
- [ ] Admin override capability for support/moderation
- [ ] Audit logging for all access attempts
- [ ] Rate limiting on chat access endpoints
- [ ] Websocket security for real-time messaging

