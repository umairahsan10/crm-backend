# Chat APIs Documentation

## Overview
This document provides comprehensive documentation for the Project Chat APIs, including Project Chats, Chat Participants, and Chat Messages. These APIs are designed to support real-time communication within project teams with role-based access control and time-based restrictions.

## Table of Contents
1. [Project Chats API](#project-chats-api)
2. [Chat Participants API](#chat-participants-api)
3. [Chat Messages API](#chat-messages-api)
4. [Authentication & Authorization](#authentication--authorization)
5. [Error Handling](#error-handling)
6. [Complete Flow Example](#complete-flow-example)
7. [Test Cases](#test-cases)

---

## Project Chats API

### Base URL
```
/communication/project-chats
```

### Endpoints

#### 1. Create Project Chat
**Endpoint:** `POST /communication/project-chats`  
**Description:** Creates a new project chat (typically done automatically when a project is created)  
**Authentication:** JWT Required

**Request Body:**
```json
{
  "projectId": 1,
  "participants": 2,
  "transferredFrom": null,
  "transferredTo": null
}
```

**Response:**
```json
{
  "message": "Project chat created successfully",
  "data": {
    "id": 1,
    "projectId": 1,
    "participants": 2,
    "transferredFrom": null,
    "transferredTo": null,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

#### 2. Get All Project Chats (with filters)
**Endpoint:** `GET /communication/project-chats`  
**Description:** Retrieves all project chats with optional filtering  
**Authentication:** JWT Required

**Query Parameters:**
- `projectId` (optional): Filter by project ID
- `participants` (optional): Filter by number of participants
- `transferredFrom` (optional): Filter by transferred from employee ID
- `transferredTo` (optional): Filter by transferred to employee ID

**Example Requests:**
```bash
GET /communication/project-chats
GET /communication/project-chats?projectId=1
GET /communication/project-chats?participants=3
GET /communication/project-chats?projectId=1&participants=3
```

**Response:**
```json
[
  {
    "id": 1,
    "projectId": 1,
    "participants": 3,
    "transferredFrom": null,
    "transferredTo": null,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z",
    "project": {
      "id": 1,
      "name": "Website Development",
      "status": "active"
    },
    "chatParticipants": [
      {
        "id": 1,
        "chatId": 1,
        "employeeId": 5,
        "memberType": "owner",
        "employee": {
          "id": 5,
          "firstName": "John",
          "lastName": "Doe",
          "email": "john.doe@company.com"
        }
      }
    ]
  }
]
```

#### 3. Get Project Chat by ID
**Endpoint:** `GET /communication/project-chats/:id`  
**Description:** Retrieves a specific project chat by its ID  
**Authentication:** JWT Required

**Response:**
```json
{
  "id": 1,
  "projectId": 1,
  "participants": 3,
  "transferredFrom": null,
  "transferredTo": null,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z",
  "project": {
    "id": 1,
    "name": "Website Development",
    "status": "active"
  },
  "chatParticipants": [...],
  "chatMessages": [...]
}
```

#### 4. Get Project Chat by Project ID
**Endpoint:** `GET /communication/project-chats/project/:projectId`  
**Description:** Retrieves a project chat by its associated project ID  
**Authentication:** JWT Required

**Response:** Same as Get Project Chat by ID

#### 5. Delete Project Chat
**Endpoint:** `DELETE /communication/project-chats/:id`  
**Description:** Deletes a project chat following the specified deletion flow  
**Authentication:** JWT Required

**Deletion Flow:**
1. Remove all chat participants
2. Delete all chat messages
3. Set projectId to null
4. Delete the chat record

**Response:**
```json
{
  "message": "Project chat with ID 1 has been deleted successfully",
  "deletedChat": {
    "id": 1,
    "projectId": 1,
    "participants": 3
  }
}
```

---

## Chat Participants API

### Base URL
```
/communication/chat-participants
```

### Endpoints

#### 1. Get All Chat Participants
**Endpoint:** `GET /communication/chat-participants`  
**Description:** Retrieves all chat participants  
**Authentication:** JWT Required

**Response:**
```json
[
  {
    "id": 1,
    "chatId": 1,
    "employeeId": 5,
    "memberType": "owner",
    "createdAt": "2024-01-15T10:30:00Z",
    "employee": {
      "id": 5,
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@company.com"
    }
  }
]
```

#### 2. Get Chat Participant by ID
**Endpoint:** `GET /communication/chat-participants/:id`  
**Description:** Retrieves a specific chat participant by ID  
**Authentication:** JWT Required

#### 3. Get Chat Participants by Chat ID
**Endpoint:** `GET /communication/chat-participants/chat/:chatId`  
**Description:** Retrieves all participants for a specific chat  
**Authentication:** JWT Required

**Response:**
```json
[
  {
    "id": 1,
    "chatId": 1,
    "employeeId": 5,
    "memberType": "owner",
    "createdAt": "2024-01-15T10:30:00Z",
    "employee": {
      "id": 5,
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@company.com"
    }
  },
  {
    "id": 2,
    "chatId": 1,
    "employeeId": 10,
    "memberType": "participant",
    "createdAt": "2024-01-15T11:00:00Z",
    "employee": {
      "id": 10,
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane.smith@company.com"
    }
  }
]
```

#### 4. Create Chat Participant
**Endpoint:** `POST /communication/chat-participants`  
**Description:** Adds a new participant to a chat (Owner only)  
**Authentication:** JWT Required  
**Authorization:** Only chat owners can add participants

**Request Body:**
```json
{
  "chatId": 1,
  "employeeId": 15,
  "memberType": "participant"
}
```

**Response:**
```json
{
  "message": "Chat participant created successfully",
  "data": {
    "id": 3,
    "chatId": 1,
    "employeeId": 15,
    "memberType": "participant",
    "createdAt": "2024-01-15T12:00:00Z",
    "employee": {
      "id": 15,
      "firstName": "Mike",
      "lastName": "Johnson",
      "email": "mike.johnson@company.com"
    }
  }
}
```

#### 5. Update Chat Participant
**Endpoint:** `PUT /communication/chat-participants/:id`  
**Description:** Updates a chat participant's details  
**Authentication:** JWT Required

**Request Body:**
```json
{
  "chatId": 1,
  "employeeId": 15,
  "memberType": "participant"
}
```

#### 6. Delete Chat Participant
**Endpoint:** `DELETE /communication/chat-participants/:id`  
**Description:** Removes a participant from a chat (Owner only, cannot remove owners)  
**Authentication:** JWT Required  
**Authorization:** Only chat owners can remove participants, cannot remove other owners

**Response:**
```json
{
  "message": "Chat participant deleted successfully",
  "data": {
    "id": 3,
    "chatId": 1,
    "employeeId": 15
  }
}
```

---

## Chat Messages API

### Base URL
```
/communication/chat-messages
```

### Endpoints

#### 1. Get All Chat Messages
**Endpoint:** `GET /communication/chat-messages`  
**Description:** Retrieves all chat messages  
**Authentication:** JWT Required

#### 2. Get Chat Message by ID
**Endpoint:** `GET /communication/chat-messages/:id`  
**Description:** Retrieves a specific chat message by ID  
**Authentication:** JWT Required

#### 3. Get Chat Messages by Chat ID
**Endpoint:** `GET /communication/chat-messages/chat/:chatId`  
**Description:** Retrieves messages for a specific chat (Participants only)  
**Authentication:** JWT Required  
**Authorization:** Only chat participants can access messages

**Query Parameters:**
- `limit` (optional): Number of messages to retrieve (default: 50)
- `offset` (optional): Number of messages to skip (default: 0)

**Example Requests:**
```bash
GET /communication/chat-messages/chat/1
GET /communication/chat-messages/chat/1?limit=10
GET /communication/chat-messages/chat/1?limit=10&offset=20
```

**Response:**
```json
{
  "messages": [
    {
      "id": 1,
      "chatId": 1,
      "senderId": 5,
      "message": "Hello team! How is the project going?",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z",
      "sender": {
        "id": 5,
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@company.com",
        "department": {
          "id": 1,
          "name": "Production"
        },
        "role": {
          "id": 2,
          "name": "unit_head"
        }
      }
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  },
  "chat": {
    "id": 1,
    "projectId": 1,
    "participants": 3
  }
}
```

#### 4. Get Latest Message by Chat ID
**Endpoint:** `GET /communication/chat-messages/chat/:chatId/latest`  
**Description:** Retrieves the latest message for a specific chat  
**Authentication:** JWT Required

#### 5. Create Chat Message
**Endpoint:** `POST /communication/chat-messages`  
**Description:** Creates a new chat message (Participants only)  
**Authentication:** JWT Required  
**Authorization:** Only chat participants can send messages

**Request Body:**
```json
{
  "chatId": 1,
  "content": "Hello team! How is the project going?",
  "messageType": "text",
  "attachmentUrl": null
}
```

**Response:**
```json
{
  "message": "Chat message created successfully",
  "data": {
    "id": 1,
    "chatId": 1,
    "senderId": 5,
    "message": "Hello team! How is the project going?",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z",
    "sender": {
      "id": 5,
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@company.com"
    }
  }
}
```

#### 6. Update Chat Message
**Endpoint:** `PUT /communication/chat-messages/:id`  
**Description:** Updates a chat message (Original sender only, within 2 minutes)  
**Authentication:** JWT Required  
**Authorization:** Only original sender can edit their own messages within 2 minutes

**Request Body:**
```json
{
  "content": "Hello team! How is the project going? Any updates?",
  "messageType": "text",
  "attachmentUrl": null
}
```

**Response:**
```json
{
  "message": "Chat message updated successfully",
  "data": {
    "id": 1,
    "chatId": 1,
    "senderId": 5,
    "message": "Hello team! How is the project going? Any updates?",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:32:00Z"
  }
}
```

#### 7. Delete Chat Message
**Endpoint:** `DELETE /communication/chat-messages/:id`  
**Description:** Deletes a chat message with role-based and time-based restrictions  
**Authentication:** JWT Required

**Deletion Rules:**
- **Owners**: Can delete any message (shows "Owner: [Name] deleted the message")
- **Participants**: Can only delete their own messages within 60 minutes
- **Original Sender**: Can delete their own messages within 60 minutes

**Response (Owner deleting someone else's message):**
```json
{
  "message": "Message marked as deleted by owner",
  "data": {
    "id": 1
  }
}
```

**Response (Original sender deleting their own message):**
```json
{
  "message": "Chat message deleted successfully",
  "data": {
    "id": 1
  }
}
```

---

## Authentication & Authorization

### JWT Authentication
All endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

### Role-Based Access Control

#### Chat Owners (3 per chat)
- **HR Manager**: Department manager in HR department
- **Production Manager**: Department manager in Production department  
- **Unit Head**: Assigned unit head for the project

#### Chat Participants
- **Team Members**: All members of the assigned team (including team lead)
- **Manually Added**: Participants added by chat owners

### Permission Matrix

| Action | Owner | Participant |
|--------|-------|-------------|
| Send Messages | ✅ | ✅ |
| Edit Own Messages (2 min) | ✅ | ✅ |
| Delete Own Messages (60 min) | ✅ | ✅ |
| Delete Any Message | ✅ | ❌ |
| Add Participants | ✅ | ❌ |
| Remove Participants | ✅ | ❌ |
| Access Messages | ✅ | ✅ |

---

## Error Handling

### Common Error Responses

#### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Only chat owners can add participants. You are not an owner of this chat.",
  "error": "Bad Request"
}
```

#### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

#### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "You can only edit messages within 2 minutes of sending.",
  "error": "Forbidden"
}
```

#### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Project chat with ID 1 not found. Please check the ID and try again.",
  "error": "Not Found"
}
```

#### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Failed to create chat message: Database connection error",
  "error": "Internal Server Error"
}
```

---

## Complete Flow Example

### 1. Project Creation (Automatic Chat Creation)
When a project is created from a payment, a project chat is automatically created with:
- HR Manager as owner
- Production Manager as owner
- Initial participant count: 2

### 2. Unit Head Assignment
When a unit head is assigned to a project:
- Unit head is added as owner to the chat
- Participant count is incremented to 3

### 3. Team Assignment
When a team is assigned to a project:
- All team members (including team lead) are added as participants
- Participant count is incremented accordingly

### 4. Message Flow
1. Participants send messages
2. Messages can be edited within 2 minutes
3. Messages can be deleted within 60 minutes (participants) or anytime (owners)
4. Owners can delete any message (shows deletion notice)

---

## Test Cases

### Basic Flow Test
```bash
# 1. Mark lead as cracked
PUT /leads/4
{
  "status": "cracked",
  "totalAmount": 50000,
  "totalPhases": 3,
  "currentPhase": 1,
  "industryId": 1,
  "description": "Website development project"
}

# 2. Generate payment link
POST /leads/payment-link-generate
{
  "leadId": 4,
  "clientId": 1,
  "amount": 20000,
  "type": "payment",
  "method": "bank"
}

# 3. Complete payment (triggers project and chat creation)
POST /leads/payment-link-complete/{transactionId}
{
  "paymentMethod": "bank_transfer",
  "category": "first_phase"
}

# 4. Get project chat
GET /project-chats/project/{projectId}

# 5. Send message
POST /communication/chat-messages
{
  "chatId": {chatId},
  "content": "Hello team! Welcome to the project.",
  "messageType": "text"
}

# 6. Get messages
GET /communication/chat-messages/chat/{chatId}
```

### Permission Test Cases
```bash
# Owner adding participant
POST /communication/chat-participants
{
  "chatId": 1,
  "employeeId": 15,
  "memberType": "participant"
}

# Participant trying to add participant (should fail)
POST /communication/chat-participants
{
  "chatId": 1,
  "employeeId": 20,
  "memberType": "participant"
}

# Edit message within 2 minutes
PUT /communication/chat-messages/1
{
  "content": "Updated message content"
}

# Delete message within 60 minutes
DELETE /communication/chat-messages/1
```

### Error Test Cases
```bash
# Non-participant accessing messages (should fail)
GET /communication/chat-messages/chat/1

# Edit message after 2 minutes (should fail)
PUT /communication/chat-messages/1
{
  "content": "This should fail"
}

# Delete message after 60 minutes (should fail for participants)
DELETE /communication/chat-messages/1
```

---

## Database Schema

### Project Chats Table
```sql
CREATE TABLE project_chats (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id),
  participants INTEGER NOT NULL DEFAULT 0,
  transferred_from INTEGER REFERENCES employees(id),
  transferred_to INTEGER REFERENCES employees(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Chat Participants Table
```sql
CREATE TABLE chat_participants (
  id SERIAL PRIMARY KEY,
  chat_id INTEGER REFERENCES project_chats(id) ON DELETE CASCADE,
  employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
  member_type chPart NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Chat Messages Table
```sql
CREATE TABLE chat_messages (
  id SERIAL PRIMARY KEY,
  chat_id INTEGER REFERENCES project_chats(id) ON DELETE CASCADE,
  sender_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Member Type Enum
```sql
CREATE TYPE chPart AS ENUM ('owner', 'participant');
```

---

## Notes

1. **Automatic Chat Creation**: Project chats are automatically created when projects are created from payments
2. **Time-based Restrictions**: All time calculations are based on `created_at` timestamps
3. **Soft Deletion**: Owner-deleted messages are not physically deleted but marked with deletion notice
4. **Participant Count**: Automatically maintained in the `project_chats` table
5. **JWT Authentication**: All endpoints require valid JWT tokens
6. **Role-based Access**: Permissions are enforced based on user roles and chat participation status

---

*Last Updated: January 2024*
*Version: 1.0*
