# Auto Log System Documentation

## Overview
The Auto Log System automatically tracks which employees are working on which projects based on team assignments. It creates log entries whenever employees are assigned to projects through team assignments, ensuring a clear record of project team composition.

## Auto Log Events

### 1. Project Creation
**Trigger**: When a new project is created via `POST /projects/create-from-payment`
**Action**: No automatic log entry is created for the project creator (manager)
**Purpose**: Managers are not tracked in project logs - only unit heads and team members are tracked

### 2. Unit Head Assignment
**Trigger**: When a unit head is assigned to a project via `PUT /projects/:id/assign-unit-head`
**Action**: Adds the assigned unit head to the project logs
**Purpose**: Track unit head involvement in the project

### 3. Team Assignment
**Trigger**: When a team is assigned to a project via `PUT /projects/:id` (with teamId)
**Action**: Adds ALL team members (team lead + all team members) to the project logs
**Purpose**: Track which team is working on the project

### 4. New Employee Joins Team
**Trigger**: When a new employee is added to a team that's already working on projects
**Action**: Adds the new employee to all projects the team is working on
**Purpose**: Track new team members on existing projects

## Key Features

### 1. **Duplicate Prevention**
- Checks if employee is already logged for the project
- Only creates new log entry if employee is not already tracked
- Prevents duplicate entries for the same employee-project combination

### 2. **Team-Based Tracking**
- No manual intervention required
- Automatically adds employees when teams are assigned to projects
- Tracks entire team composition at once

### 3. **Team Composition Visibility**
- Clear view of all employees working on a project
- Easy identification of project team members
- Automatic tracking when new employees join existing teams

## Implementation Details

### AutoLogService Methods

#### `addEmployeeToProject(projectId, employeeId)`
- Adds a single employee to project logs
- Checks for duplicates before creating entry
- Automatically called when employees are assigned to projects

#### `addEmployeesToProject(projectId, employeeIds)`
- Adds multiple employees to project logs
- Used internally for team assignments
- Processes each employee individually

#### `addEmployeeToTeamProjects(employeeId, teamLeadId)`
- Adds employee to all projects their team is working on
- Called when new employee joins an existing team
- Ensures new team members are tracked on all team projects

#### `getProjectEmployees(projectId)`
- Retrieves all employees working on a project
- Returns employee details with role and department information
- Used for team composition reporting

#### `getEmployeeProjectCount(employeeId)`
- Returns the number of projects an employee is working on
- Useful for workload analysis
- Helps identify over/under-utilized employees

## Database Schema Compatibility

The auto log system works with the existing Prisma schema:

```sql
model ProjectLog {
  projectId   Int      @map("project_id")
  developerId Int      @map("developer_id")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  id          Int      @id @default(autoincrement())
  developer   Employee @relation("ProjectLogDeveloper")
  project     Project  @relation(fields: [projectId], references: [id])
}
```

**Note**: The current schema doesn't include fields for `logEntry`, `logType`, or `additionalNotes`. The auto log system creates the basic log entry and logs the additional information to the console. In a production environment, you might want to:

1. **Extend the schema** to include these fields
2. **Create a separate table** for log details
3. **Use a logging service** for detailed information

## Error Handling

The auto log system is designed to be **non-blocking**:
- If auto log creation fails, it doesn't affect the main operation
- Errors are logged to console but don't throw exceptions
- Main business logic continues even if logging fails

```typescript
try {
  await this.createAutoLog(projectId, developerId, logType, logEntry, additionalNotes);
} catch (error) {
  console.error('Failed to create auto log:', error);
  // Don't throw error to avoid breaking the main operation
}
```

## Usage Examples

### Automatic Log Creation Flow

1. **Project Creation**:
   ```typescript
   // User creates project
   POST /projects/create-from-payment
   
   // No auto log is created for the manager
   // Only unit heads and team members are tracked in project logs
   ```

2. **Task Creation**:
   ```typescript
   // Manager creates task
   POST /projects/5/tasks
   
   // Auto log is created automatically
   // Log: "Task created: Implement user authentication"
   // Type: task_creation
   // Created by: [Manager ID]
   ```

3. **Task Status Update**:
   ```typescript
   // Employee updates task status
   PATCH /projects/5/tasks/1/status
   
   // Auto log is created automatically
   // Log: "Task status changed: Implement user authentication from not_started to in_progress"
   // Type: task_status_change
   // Created by: [Employee ID]
   ```

## Benefits

### 1. **Complete Audit Trail**
- Every important project event is automatically logged
- No manual intervention required
- Comprehensive project history

### 2. **Accountability**
- Clear record of who did what and when
- Automatic attribution of actions
- Transparent project management

### 3. **Compliance**
- Meets audit requirements
- Regulatory compliance
- Historical data preservation

### 4. **Analytics**
- Project activity metrics
- Developer productivity tracking
- Timeline analysis

### 5. **Debugging**
- Easy to trace project issues
- Historical context for problems
- Performance analysis

## Future Enhancements

### 1. **Extended Schema**
```sql
model ProjectLog {
  id            Int      @id @default(autoincrement())
  projectId     Int      @map("project_id")
  developerId   Int      @map("developer_id")
  logEntry      String   @map("log_entry")
  logType       String   @map("log_type")
  additionalNotes String? @map("additional_notes")
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  developer     Employee @relation("ProjectLogDeveloper")
  project       Project  @relation(fields: [projectId], references: [id])
}
```

### 2. **Additional Auto Log Events**
- Project status changes
- Team assignments
- Deadline updates
- Progress updates
- Payment milestones
- Client communications

### 3. **Real-time Notifications**
- WebSocket notifications for log events
- Email alerts for important events
- Dashboard updates

### 4. **Advanced Analytics**
- Project velocity tracking
- Developer workload analysis
- Bottleneck identification
- Performance metrics

## Configuration

### Environment Variables
```env
# Enable/disable auto logging
AUTO_LOG_ENABLED=true

# Log level for auto logs
AUTO_LOG_LEVEL=info

# Auto log retention period (days)
AUTO_LOG_RETENTION_DAYS=365
```

### Service Configuration
```typescript
@Injectable()
export class AutoLogService {
  constructor(
    private prisma: PrismaService,
    @Inject('AUTO_LOG_CONFIG') private config: AutoLogConfig
  ) {}

  private async createAutoLog(...) {
    if (!this.config.enabled) return;
    // ... log creation logic
  }
}
```

## Testing

### Unit Tests
```typescript
describe('AutoLogService', () => {
  it('should create project creation log', async () => {
    await autoLogService.logProjectCreated(1, 123, projectDetails);
    // Verify log was created
  });

  it('should handle log creation errors gracefully', async () => {
    // Mock prisma to throw error
    // Verify main operation continues
  });
});
```

### Integration Tests
```typescript
describe('Project Creation with Auto Log', () => {
  it('should create project and auto log', async () => {
    const response = await request(app)
      .post('/projects/create-from-payment')
      .send(projectData);
    
    expect(response.status).toBe(201);
    // Verify project was created
    // Verify auto log was created
  });
});
```

## Monitoring

### Log Metrics
- Auto log creation success rate
- Auto log creation failures
- Log volume by type
- Performance impact

### Alerts
- Auto log creation failures
- High error rates
- Performance degradation
- Storage capacity warnings

The auto log system ensures comprehensive project tracking while maintaining system reliability and performance.
