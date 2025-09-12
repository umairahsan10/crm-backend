# Project Logs API Documentation

## Overview
The Project Logs API provides comprehensive logging functionality for project activities. It allows developers and managers to track project progress, document work activities, and maintain an audit trail of project development.

## Authentication & Authorization

### Guards
- **`JwtAuthGuard`**: Ensures user is authenticated
- **`DepartmentsGuard`**: Restricts access to Production department only
- **`RolesGuard`**: Role-based access control

### Role-Based Access Matrix

| Role | Create Logs | Update Logs | Delete Logs | View Logs | View Statistics |
|------|-------------|-------------|-------------|-----------|-----------------|
| **Department Manager** | ✅ | ✅ | ✅ | All Project Logs | ✅ |
| **Unit Head** | ✅ | ✅ | ✅ | Unit Project Logs | ✅ |
| **Team Lead** | ✅ | ✅ | ✅ | Team Project Logs | ✅ |
| **Senior/Junior** | ✅ | Own Logs Only | Own Logs Only | Project Logs | ✅ |

## API Endpoints

### 1. Create Project Log
**`POST /projects/:projectId/logs`**

Creates a new log entry for a project. All Production department employees can create logs.

#### Request Body
```json
{
  "logEntry": "Completed user authentication module implementation",
  "logType": "development",
  "additionalNotes": "Added JWT token validation and refresh mechanism"
}
```

#### Required Fields
- `logEntry`: Description of the work done (string)

#### Optional Fields
- `logType`: Type of log entry (string) - e.g., "development", "bug_fix", "testing", "documentation"
- `additionalNotes`: Additional details or notes (string)

#### Response
```json
{
  "success": true,
  "message": "Log entry created successfully",
  "data": {
    "id": 1,
    "projectId": 5,
    "developerId": 123,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "logEntry": "Completed user authentication module implementation",
    "logType": "development",
    "additionalNotes": "Added JWT token validation and refresh mechanism",
    "project": {
      "id": 5,
      "status": "in_progress",
      "client": { ... },
      "salesRep": { ... },
      "unitHead": { ... }
    },
    "developer": {
      "id": 123,
      "firstName": "Jane",
      "lastName": "Smith",
      "role": { "name": "senior" },
      "department": { "name": "Production" }
    }
  }
}
```

### 2. Get Project Logs
**`GET /projects/:projectId/logs`**

Retrieves all log entries for a project with optional filtering and sorting.

#### Query Parameters
- `developerId`: Filter by developer ID (number)
- `logType`: Filter by log type (string)
- `startDate`: Filter logs from this date (ISO string)
- `endDate`: Filter logs until this date (ISO string)
- `sortBy`: Sort field (enum: createdAt, updatedAt)
- `order`: Sort order (enum: asc, desc)

#### Example Requests
```http
GET /projects/5/logs
GET /projects/5/logs?developerId=123
GET /projects/5/logs?logType=development&sortBy=createdAt&order=desc
GET /projects/5/logs?startDate=2024-01-01&endDate=2024-01-31
```

#### Response
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "projectId": 5,
      "developerId": 123,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z",
      "project": { ... },
      "developer": { ... }
    }
  ],
  "count": 1
}
```

### 3. Get Log Statistics
**`GET /projects/:projectId/logs/statistics`**

Retrieves statistical information about project logs.

#### Response
```json
{
  "success": true,
  "data": {
    "totalLogs": 25,
    "logsByDeveloper": [
      {
        "developerId": 123,
        "logCount": 15
      },
      {
        "developerId": 124,
        "logCount": 10
      }
    ],
    "recentLogs": [
      {
        "id": 25,
        "createdAt": "2024-01-15T14:30:00.000Z",
        "developer": {
          "id": 123,
          "firstName": "Jane",
          "lastName": "Smith",
          "role": { "name": "senior" }
        }
      }
    ]
  }
}
```

### 4. Get Log by ID
**`GET /projects/:projectId/logs/:logId`**

Retrieves a specific log entry by ID.

#### Response
```json
{
  "success": true,
  "data": {
    "id": 1,
    "projectId": 5,
    "developerId": 123,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "project": {
      "id": 5,
      "status": "in_progress",
      "client": { ... },
      "salesRep": { ... },
      "unitHead": { ... }
    },
    "developer": {
      "id": 123,
      "firstName": "Jane",
      "lastName": "Smith",
      "role": { "name": "senior" },
      "department": { "name": "Production" }
    }
  }
}
```

### 5. Update Log
**`PUT /projects/:projectId/logs/:logId`**

Updates an existing log entry. Regular employees can only update their own logs.

#### Request Body
```json
{
  "logEntry": "Updated: Completed user authentication with OAuth integration",
  "logType": "development",
  "additionalNotes": "Added OAuth2 support and improved error handling"
}
```

#### Response
```json
{
  "success": true,
  "message": "Log entry updated successfully",
  "data": {
    "id": 1,
    "projectId": 5,
    "developerId": 123,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T11:45:00.000Z",
    "logEntry": "Updated: Completed user authentication with OAuth integration",
    "logType": "development",
    "additionalNotes": "Added OAuth2 support and improved error handling",
    "project": { ... },
    "developer": { ... }
  }
}
```

### 6. Delete Log
**`DELETE /projects/:projectId/logs/:logId`**

Deletes a log entry. Regular employees can only delete their own logs.

#### Response
```json
{
  "success": true,
  "message": "Log entry deleted successfully"
}
```

## Business Logic

### Log Access Permissions
- **Department Manager**: Can access all project logs in their department
- **Unit Head**: Can access logs for projects in their unit
- **Team Lead**: Can access logs for projects in their team
- **Regular Employees**: Can access logs for projects they're working on

### Log Creation/Update Permissions
- **Managers & Leads**: Can create/update/delete any log in their scope
- **Regular Employees**: Can only create/update/delete their own logs

### Log Types (Suggested)
- `development`: Code development and implementation
- `bug_fix`: Bug fixes and issue resolution
- `testing`: Testing activities and quality assurance
- `documentation`: Documentation and code comments
- `review`: Code reviews and feedback
- `meeting`: Meeting notes and discussions
- `deployment`: Deployment and release activities

## Error Handling

### Common Error Responses
```json
{
  "statusCode": 400,
  "message": "Log entry is required",
  "error": "Bad Request"
}
```

```json
{
  "statusCode": 403,
  "message": "You do not have permission to create logs for this project",
  "error": "Forbidden"
}
```

```json
{
  "statusCode": 404,
  "message": "Log entry not found",
  "error": "Not Found"
}
```

## Usage Examples

### Creating a Log Entry
```bash
curl -X POST http://localhost:3000/projects/5/logs \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "logEntry": "Implemented user dashboard with real-time data updates",
    "logType": "development",
    "additionalNotes": "Used React hooks for state management and WebSocket for real-time updates"
  }'
```

### Getting Logs with Filters
```bash
curl -X GET "http://localhost:3000/projects/5/logs?developerId=123&logType=development&sortBy=createdAt&order=desc" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Updating a Log Entry
```bash
curl -X PUT http://localhost:3000/projects/5/logs/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "logEntry": "Updated: Implemented user dashboard with enhanced security features",
    "logType": "development",
    "additionalNotes": "Added input validation and XSS protection"
  }'
```

### Getting Log Statistics
```bash
curl -X GET http://localhost:3000/projects/5/logs/statistics \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Deleting a Log Entry
```bash
curl -X DELETE http://localhost:3000/projects/5/logs/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Testing Scenarios

### 1. Valid Log Creation
```json
{
  "logEntry": "Fixed critical authentication bug in login flow",
  "logType": "bug_fix",
  "additionalNotes": "Issue was with JWT token expiration handling"
}
```

### 2. Log Creation with Minimal Data
```json
{
  "logEntry": "Completed daily standup meeting"
}
```

### 3. Employee Updating Own Log (Valid)
```json
{
  "logEntry": "Updated: Fixed authentication bug with improved error messages"
}
```

### 4. Employee Updating Another's Log (Invalid)
```json
{
  "logEntry": "This should fail - employee cannot update others' logs"
}
```

### 5. Manager Updating Any Log (Valid)
```json
{
  "logEntry": "Manager review: Excellent work on authentication module"
}
```

## Security Considerations

- All endpoints require JWT authentication
- Production department restriction enforced
- Role-based access control for all operations
- Project access validation
- Log ownership validation for regular employees
- Input validation and sanitization
- Audit trail maintenance

## Integration Notes

- Logs are automatically linked to projects and developers
- Full project and developer details included in responses
- Compatible with existing Prisma schema
- No database migrations required
- Integrates seamlessly with existing project management system
- URL-based project ID parameter (not in request body)
- Automatic timestamp management
- Comprehensive error handling with detailed messages

## API Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

### Error Response
```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Error Type"
}
```

## Performance Considerations

- Database queries optimized with proper indexing
- Role-based filtering reduces data transfer
- Pagination not implemented (can be added if needed)
- Sorting and filtering supported for better performance
- Statistics endpoint provides aggregated data efficiently

## Future Enhancements

- **Pagination**: For projects with many log entries
- **Log Categories**: Predefined log types with validation
- **File Attachments**: Support for attaching files to log entries
- **Time Tracking**: Integration with time tracking functionality
- **Notifications**: Real-time notifications for log updates
- **Export Functionality**: Export logs to various formats (PDF, Excel)
- **Search**: Full-text search across log entries
- **Tags**: Tagging system for better log organization
