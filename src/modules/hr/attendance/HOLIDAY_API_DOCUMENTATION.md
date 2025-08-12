# Holiday Management System API Documentation

## Overview
The Holiday Management System provides comprehensive APIs for managing company holidays, including creation, updates, deletion, and viewing capabilities. The system enforces proper access control where HR and Admin can manage holidays, while all employees can view holiday information.

### **Key Features**
- **Standard Holiday Management**: Create, read, update, and delete holidays
- **Past Date Holiday Support**: Automatically adjust attendance when creating holidays for past dates
- **Emergency Holiday Handling**: Perfect for sudden holidays due to weather, protests, or government announcements
- **Automatic Attendance Adjustment**: Updates all relevant tables when past date holidays are created
- **Comprehensive Logging**: All actions logged for audit and compliance purposes

---

## Authentication & Authorization
- **Authentication**: JWT Bearer Token required for all endpoints
- **Authorization**: 
  - **HR/Admin**: Full CRUD access (requires `attendance_permission`)
  - **All Employees**: Read-only access to holiday information

---

## API Endpoints

### 🔍 **PUBLIC ENDPOINTS (All Employees)**

#### 1. Get All Holidays
**Endpoint**: `GET /hr/attendance/holidays`  
**Method**: GET  
**Access**: All authenticated employees

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `year` | number | No | Filter by specific year (e.g., 2025) |
| `month` | number | No | Filter by specific month (1-12, requires year) |

**Sample Requests**:
```bash
# Get all holidays
GET /hr/attendance/holidays

# Get holidays for specific year
GET /hr/attendance/holidays?year=2025

# Get holidays for specific month
GET /hr/attendance/holidays?year=2025&month=12
```

**Sample Response**:
```json
[
  {
    "holidayId": 1,
    "holidayName": "New Year's Day",
    "holidayDate": "2025-01-01T00:00:00.000Z",
    "description": "New Year celebration",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
]
```

#### 2. Get Holiday by ID
**Endpoint**: `GET /hr/attendance/holidays/:id`  
**Method**: GET  
**Access**: All authenticated employees

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Holiday ID |

**Sample Request**:
```bash
GET /hr/attendance/holidays/1
```

**Sample Response**:
```json
{
  "holidayId": 1,
  "holidayName": "New Year's Day",
  "holidayDate": "2025-01-01T00:00:00.000Z",
  "description": "New Year celebration",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```

#### 3. Get Upcoming Holidays
**Endpoint**: `GET /hr/attendance/holidays/upcoming`  
**Method**: GET  
**Access**: All authenticated employees

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `limit` | number | No | Number of upcoming holidays to return (default: 10, max: 100) |

**Sample Requests**:
```bash
# Get next 10 upcoming holidays
GET /hr/attendance/holidays/upcoming

# Get next 5 upcoming holidays
GET /hr/attendance/holidays/upcoming?limit=5
```

**Sample Response**:
```json
[
  {
    "holidayId": 2,
    "holidayName": "Eid al-Fitr",
    "holidayDate": "2025-03-31T00:00:00.000Z",
    "description": "Islamic holiday",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
]
```

#### 4. Check if Date is Holiday
**Endpoint**: `GET /hr/attendance/holidays/check/:date`  
**Method**: GET  
**Access**: All authenticated employees

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `date` | string | Yes | Date in YYYY-MM-DD format |

**Sample Request**:
```bash
GET /hr/attendance/holidays/check/2025-01-01
```

**Sample Response**:
```json
{
  "isHoliday": true,
  "holiday": {
    "holidayId": 1,
    "holidayName": "New Year's Day",
    "holidayDate": "2025-01-01T00:00:00.000Z",
    "description": "New Year celebration",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

#### 5. Get Holiday Statistics
**Endpoint**: `GET /hr/attendance/holidays/stats`  
**Method**: GET  
**Access**: All authenticated employees

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `year` | number | No | Year for statistics (default: current year) |

**Sample Requests**:
```bash
# Get current year statistics
GET /hr/attendance/holidays/stats

# Get specific year statistics
GET /hr/attendance/holidays/stats?year=2025
```

**Sample Response**:
```json
{
  "totalHolidays": 15,
  "holidaysThisYear": 8,
  "upcomingHolidays": 3,
  "holidaysByMonth": [
    { "month": "January", "count": 1 },
    { "month": "March", "count": 2 },
    { "month": "July", "count": 1 }
  ]
}
```

---

### 🔧 **ADMIN/HR ENDPOINTS (Requires attendance_permission)**

#### 6. Create Holiday
**Endpoint**: `POST /hr/attendance/holidays`  
**Method**: POST  
**Access**: HR, Admin (requires `attendance_permission`)

**Request Body**:
```json
{
  "holidayName": "Independence Day",
  "holidayDate": "2025-08-14",
  "description": "Pakistan Independence Day"
}
```

**Sample Response**:

**Regular Holiday Creation:**
```json
{
  "holidayId": 3,
  "holidayName": "Independence Day",
  "holidayDate": "2025-08-14T00:00:00.000Z",
  "description": "Pakistan Independence Day",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```

**Past Date Holiday Creation (with attendance adjustment):**
```json
{
  "holidayId": 4,
  "holidayName": "Heavy Rain Holiday",
  "holidayDate": "2025-01-15T00:00:00.000Z",
  "description": "Government declared holiday due to severe weather",
  "createdAt": "2025-01-15T16:00:00.000Z",
  "updatedAt": "2025-01-15T16:00:00.000Z",
  "attendanceAdjusted": true,
  "employeesAffected": 56,
  "message": "Holiday created and attendance adjusted for 56 active employees"
}
```



#### 8. Delete Holiday
**Endpoint**: `DELETE /hr/attendance/holidays/:id`  
**Method**: DELETE  
**Access**: HR, Admin (requires `attendance_permission`)

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Holiday ID |

**Sample Response**:
```json
{
  "message": "Holiday \"Independence Day\" deleted successfully"
}
```



---

## Data Validation

### **Create Holiday Validation**
- **holidayName**: Required, max 100 characters
- **holidayDate**: Required, YYYY-MM-DD format
- **description**: Optional, text field

### **Query Parameter Validation**
- **year**: Must be a valid number
- **month**: Must be 1-12, requires year parameter
- **limit**: Must be 1-100 for upcoming holidays

### **Date Format**
- **Input**: YYYY-MM-DD (e.g., "2025-08-14")
- **Output**: ISO 8601 format with timezone

---

## Error Handling

### **Common Error Responses**

#### **400 Bad Request**
```json
{
  "statusCode": 400,
  "message": "Date must be in YYYY-MM-DD format",
  "error": "Bad Request"
}
```

#### **404 Not Found**
```json
{
  "statusCode": 404,
  "message": "Holiday with ID 999 not found",
  "error": "Not Found"
}
```

#### **409 Conflict**
```json
{
  "statusCode": 409,
  "message": "Holiday already exists on 2025-01-01",
  "error": "Conflict"
}
```

#### **403 Forbidden**
```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

---

## Business Rules

### **Holiday Creation Rules**
1. **Unique Dates**: Only one holiday per date
2. **Date Validation**: Must be valid date format
3. **Name Validation**: Required, max 100 characters
4. **Description**: Optional field
5. **Past Date Handling**: Automatic attendance adjustment for past dates

### **Update Rules**
1. **Date Conflicts**: Cannot update to date with existing holiday
2. **Partial Updates**: Only provided fields are updated
3. **Validation**: Same rules as creation

### **Deletion Rules**
1. **Soft Delete**: Currently hard delete (can be modified)
2. **Validation**: Holiday must exist before deletion

### **Past Date Holiday Rules**
1. **Automatic Adjustment**: When HR or Admin creates a holiday for a past date, attendance is automatically adjusted
2. **Employee Status**: All active employees are marked as present for the holiday date
3. **Table Updates**: 
   - `attendance_logs`: New/updated records with present status
   - `attendance`: Present days +1, absent days -1
   - `monthly_attendance_summary`: Monthly totals updated
   - `holidays`: Holiday record created
   - `hr_logs`: All actions logged (HR users only)
4. **Shift Times**: Uses employee's actual shift start/end times from employee table
5. **Error Handling**: Individual employee failures don't affect others

### **User Type Handling Rules**
1. **HR Users**: Create HR logs for all actions (department = 'HR' in employee table)
2. **Admin Users**: No HR logs created (separate admin logging system)
3. **Automatic Detection**: System determines user type from JWT token
4. **Logging Behavior**: 
   - HR users: Full audit trail in HR logs
   - Admin users: Actions logged in admin system only
5. **Attendance Adjustment**: Works for both user types (no logging difference)

---

## Performance Considerations

### **Database Optimization**
- **Indexed Fields**: `holidayDate` (unique constraint)
- **Efficient Queries**: Date range filtering
- **Pagination**: Built-in for large datasets

### **Caching Strategy**
- **Holiday Lists**: Can be cached by year/month
- **Upcoming Holidays**: Refresh daily
- **Statistics**: Cache for 1 hour

---

## Integration Points

### **Attendance System**
- **Weekend Auto-Present**: Considers holidays
- **Attendance Reports**: Excludes holiday dates
- **Leave Management**: Holiday-aware calculations
- **Past Date Holidays**: Automatic attendance adjustment for emergency holidays

### **Use Case Scenarios**
- **Heavy Rain**: Government declares holiday due to severe weather
- **Protests/Strikes**: Civil unrest forces office closure
- **Power Outages**: Infrastructure issues preventing work
- **Health Emergencies**: Pandemic or health-related closures
- **Security Threats**: Safety concerns requiring office closure

### **Calendar Systems**
- **Company Calendar**: Holiday display
- **Employee Apps**: Holiday notifications
- **HR Dashboard**: Holiday management

### **HR Logging System**
- **Automatic Tracking**: Holiday management actions are logged to HRLog table (HR users only)
- **Admin Actions**: Admin users do not create HR logs (separate admin logging system)
- **Audit Trail**: Complete history of who created, updated, or deleted holidays
- **Action Types**: 
  - `holiday_created`: New holiday created
  - `holiday_updated`: Holiday modified
  - `holiday_deleted`: Holiday removed
  - `holiday_bulk_created`: Multiple holidays created
  - `holiday_attendance_adjusted`: Attendance adjusted for past date holiday
- **Compliance**: Maintains records for HR compliance and audit purposes

---

## Testing

### **API Testing Scenarios**
1. **Create Holiday**: Valid data, duplicate date, invalid date
2. **Update Holiday**: Valid update, date conflict, non-existent
3. **Delete Holiday**: Existing holiday, non-existent
4. **View Holidays**: All, filtered, upcoming, specific
5. **Bulk Operations**: Multiple holidays, validation errors
6. **Past Date Holiday**: Create holiday for today/yesterday, verify attendance adjustment

### **Past Date Holiday Testing**
1. **Create Today's Holiday**: Should adjust attendance for all active employees
2. **Create Yesterday's Holiday**: Should retroactively adjust attendance
3. **Verify Table Updates**: Check all 5 tables are updated correctly
4. **Error Handling**: Test with invalid employee data
5. **Logging Verification**: Confirm HR logs are created for attendance adjustments

### **Sample Test Data**
```json
{
  "holidayName": "Test Holiday",
  "holidayDate": "2025-12-25",
  "description": "Test holiday for API testing"
}
```

---

## Maintenance

### **Regular Tasks**
- **Holiday Updates**: Annual calendar updates
- **Data Cleanup**: Remove outdated holidays
- **Performance Monitoring**: Query optimization

### **Technical Implementation**
- **Automatic Detection**: System detects past date holidays during creation
- **Batch Processing**: Processes all active employees for attendance adjustment
- **Transaction Safety**: Individual employee failures don't affect others
- **Shift Time Handling**: Uses actual employee shift times from database
- **Comprehensive Logging**: All actions logged for audit trail
- **Performance Optimization**: Efficient queries with proper indexing

### **Troubleshooting**
- **Date Conflicts**: Check for duplicate dates
- **Validation Errors**: Verify input format
- **Permission Issues**: Check user roles

---

*This documentation covers all holiday management APIs. For additional support, refer to the source code or contact the development team.*
