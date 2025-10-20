# Production Department Frontend Implementation Guide

This comprehensive guide provides frontend developers with everything needed to implement the Production Department interface, including all APIs, workflows, and UI components.

## 📋 Table of Contents
1. [Overview](#overview)
2. [Authentication & Authorization](#authentication--authorization)
3. [Production Units Management](#production-units-management)
4. [Teams Management](#teams-management)
5. [Projects Management](#projects-management)
6. [Task Management](#task-management)
7. [Communication & Collaboration](#communication--collaboration)
8. [Analytics & Reporting](#analytics--reporting)
9. [UI Components Structure](#ui-components-structure)
10. [State Management](#state-management)
11. [Error Handling](#error-handling)

## 🏗️ Overview

The Production Department manages the complete project lifecycle from organizational setup to project completion. The system follows a hierarchical structure:

```
Production Department
├── Production Units (Managed by Unit Heads)
│   ├── Teams (Managed by Team Leads)
│   │   ├── Team Members (Senior/Junior Employees)
│   │   └── Projects (Assigned to Teams)
│   │       └── Project Tasks (Assigned to Team Members)
│   └── Analytics & Reporting
```

### Role Hierarchy
- **Department Manager**: Full system access
- **Unit Head**: Unit-level management
- **Team Lead**: Team-level management
- **Senior/Junior**: Project-level access

## 🔐 Authentication & Authorization

### Base Configuration
```typescript
// API Base Configuration
const API_BASE_URL = 'http://localhost:3000';
const AUTH_TOKEN = localStorage.getItem('jwt_token');

// Request Headers
const headers = {
  'Authorization': `Bearer ${AUTH_TOKEN}`,
  'Content-Type': 'application/json'
};
```

### Role-Based Access Control
```typescript
interface UserPermissions {
  role: 'dep_manager' | 'unit_head' | 'team_lead' | 'senior' | 'junior';
  department: 'Production';
  permissions: {
    canCreateUnits: boolean;
    canCreateTeams: boolean;
    canAssignTeams: boolean;
    canCreateProjects: boolean;
    canAssignUnitHeads: boolean;
    canAssignTeams: boolean;
    canUpdateProjects: boolean;
    canCreateTasks: boolean;
    canViewAnalytics: boolean;
  };
}
```

## 🏢 Production Units Management

### 1. Create Production Unit

**API Endpoint**: `POST /production/units/create`

**Required Role**: `dep_manager`

**Request Body**:
```typescript
interface CreateUnitRequest {
  name: string;
  headId: number;
}
```

**Response**:
```typescript
interface CreateUnitResponse {
  success: boolean;
  message: string;
}
```

**Frontend Implementation**:
```typescript
// Component: CreateUnitForm.tsx
const CreateUnitForm = () => {
  const [formData, setFormData] = useState<CreateUnitRequest>({
    name: '',
    headId: 0
  });
  const [availableHeads, setAvailableHeads] = useState([]);

  // Fetch available heads
  useEffect(() => {
    fetchAvailableHeads();
  }, []);

  const fetchAvailableHeads = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/production/units/available-heads`, {
        headers
      });
      const data = await response.json();
      setAvailableHeads(data);
    } catch (error) {
      console.error('Error fetching heads:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/production/units/create`, {
        method: 'POST',
        headers,
        body: JSON.stringify(formData)
      });
      const result = await response.json();
      if (result.success) {
        // Show success message and refresh units list
        showSuccessMessage('Unit created successfully');
        refreshUnitsList();
      }
    } catch (error) {
      showErrorMessage('Failed to create unit');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Unit Name"
        value={formData.name}
        onChange={(e) => setFormData({...formData, name: e.target.value})}
        required
      />
      <select
        value={formData.headId}
        onChange={(e) => setFormData({...formData, headId: parseInt(e.target.value)})}
        required
      >
        <option value="">Select Unit Head</option>
        {availableHeads.map(head => (
          <option key={head.id} value={head.id}>
            {head.firstName} {head.lastName}
          </option>
        ))}
      </select>
      <button type="submit">Create Unit</button>
    </form>
  );
};
```

### 2. Get All Production Units

**API Endpoint**: `GET /production/units`

**Required Role**: `dep_manager`

**Response**:
```typescript
interface Unit {
  id: number;
  name: string;
  headId: number;
  head: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  teamCount: number;
  employeeCount: number;
  createdAt: string;
  updatedAt: string;
}
```

**Frontend Implementation**:
```typescript
// Component: UnitsList.tsx
const UnitsList = () => {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUnits();
  }, []);

  const fetchUnits = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/production/units`, {
        headers
      });
      const data = await response.json();
      setUnits(data);
    } catch (error) {
      console.error('Error fetching units:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="units-list">
      <h2>Production Units</h2>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="units-grid">
          {units.map(unit => (
            <div key={unit.id} className="unit-card">
              <h3>{unit.name}</h3>
              <p>Head: {unit.head.firstName} {unit.head.lastName}</p>
              <p>Teams: {unit.teamCount}</p>
              <p>Employees: {unit.employeeCount}</p>
              <div className="unit-actions">
                <button onClick={() => viewUnitDetails(unit.id)}>View Details</button>
                <button onClick={() => editUnit(unit.id)}>Edit</button>
                <button onClick={() => deleteUnit(unit.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

### 3. Update Production Unit

**API Endpoint**: `PATCH /production/units/update/:id`

**Required Role**: `dep_manager`

**Request Body**:
```typescript
interface UpdateUnitRequest {
  name?: string;
  headId?: number;
}
```

### 4. Delete Production Unit

**API Endpoint**: `DELETE /production/units/delete/:id`

**Required Role**: `dep_manager`

### 5. Get Unit Details

**API Endpoint**: `GET /production/units/get/:id`

**Required Role**: `dep_manager`

### 6. Get Employees in Unit

**API Endpoint**: `GET /production/units/:id/employees`

**Required Role**: `dep_manager`, `unit_head`

### 7. Get Projects in Unit

**API Endpoint**: `GET /production/units/:id/projects`

**Required Role**: `dep_manager`, `unit_head`

## 👥 Teams Management

### 1. Create Team

**API Endpoint**: `POST /production/teams/create`

**Required Role**: `dep_manager`, `unit_head`

**Request Body**:
```typescript
interface CreateTeamRequest {
  name: string;
  productionUnitId: number;
  teamLeadId: number;
}
```

**Frontend Implementation**:
```typescript
// Component: CreateTeamForm.tsx
const CreateTeamForm = () => {
  const [formData, setFormData] = useState<CreateTeamRequest>({
    name: '',
    productionUnitId: 0,
    teamLeadId: 0
  });
  const [units, setUnits] = useState([]);
  const [availableLeads, setAvailableLeads] = useState([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/production/teams/create`, {
        method: 'POST',
        headers,
        body: JSON.stringify(formData)
      });
      const result = await response.json();
      if (result.success) {
        showSuccessMessage('Team created successfully');
        refreshTeamsList();
      }
    } catch (error) {
      showErrorMessage('Failed to create team');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Team Name"
        value={formData.name}
        onChange={(e) => setFormData({...formData, name: e.target.value})}
        required
      />
      <select
        value={formData.productionUnitId}
        onChange={(e) => setFormData({...formData, productionUnitId: parseInt(e.target.value)})}
        required
      >
        <option value="">Select Production Unit</option>
        {units.map(unit => (
          <option key={unit.id} value={unit.id}>{unit.name}</option>
        ))}
      </select>
      <select
        value={formData.teamLeadId}
        onChange={(e) => setFormData({...formData, teamLeadId: parseInt(e.target.value)})}
        required
      >
        <option value="">Select Team Lead</option>
        {availableLeads.map(lead => (
          <option key={lead.id} value={lead.id}>
            {lead.firstName} {lead.lastName}
          </option>
        ))}
      </select>
      <button type="submit">Create Team</button>
    </form>
  );
};
```

### 2. Replace Team Lead

**API Endpoint**: `PUT /production/teams/:teamId/replace-lead`

**Required Role**: `dep_manager`, `unit_head`

**Request Body**:
```typescript
interface ReplaceTeamLeadRequest {
  newTeamLeadId: number;
}
```

### 3. Add Employee to Team

**API Endpoint**: `POST /production/teams/:teamId/add-employee`

**Required Role**: `dep_manager`, `unit_head`

**Request Body**:
```typescript
interface AddEmployeeRequest {
  employeeId: number;
}
```

### 4. Remove Employee from Team

**API Endpoint**: `DELETE /production/teams/:teamId/remove-employee/:employeeId`

**Required Role**: `dep_manager`, `unit_head`

### 5. Assign Team to Unit

**API Endpoint**: `POST /production/teams/assign`

**Required Role**: `dep_manager`

**Request Body**:
```typescript
interface AssignTeamRequest {
  teamId: number;
  productionUnitId: number;
}
```

### 6. Unassign Team from Unit

**API Endpoint**: `DELETE /production/teams/unassign/:teamId`

**Required Role**: `dep_manager`

### 7. Get All Teams

**API Endpoint**: `GET /production/teams/all`

**Required Role**: `dep_manager`, `unit_head`

### 8. Get Team Details

**API Endpoint**: `GET /production/teams/:teamId`

**Required Role**: `dep_manager`, `unit_head`, `team_lead`, `senior`, `junior`

### 9. Get Teams in Production Unit

**API Endpoint**: `GET /production/teams/unit/:productionUnitId`

**Required Role**: `dep_manager`, `unit_head`

### 10. Get Available Teams

**API Endpoint**: `GET /production/teams/available`

**Required Role**: `dep_manager`

## 📋 Projects Management

### 1. Create Project from Payment

**API Endpoint**: `POST /projects/create-from-payment`

**Required Role**: `dep_manager`, `unit_head`

**Request Body**:
```typescript
interface CreateProjectFromPaymentRequest {
  crackedLeadId: number;
  salesRepId: number;
  clientId: number;
  description: string;
}
```

**Frontend Implementation**:
```typescript
// Component: CreateProjectForm.tsx
const CreateProjectForm = () => {
  const [formData, setFormData] = useState<CreateProjectFromPaymentRequest>({
    crackedLeadId: 0,
    salesRepId: 0,
    clientId: 0,
    description: ''
  });
  const [crackedLeads, setCrackedLeads] = useState([]);
  const [salesReps, setSalesReps] = useState([]);
  const [clients, setClients] = useState([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/projects/create-from-payment`, {
        method: 'POST',
        headers,
        body: JSON.stringify(formData)
      });
      const result = await response.json();
      if (result.success) {
        showSuccessMessage('Project created successfully');
        refreshProjectsList();
      }
    } catch (error) {
      showErrorMessage('Failed to create project');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <select
        value={formData.crackedLeadId}
        onChange={(e) => setFormData({...formData, crackedLeadId: parseInt(e.target.value)})}
        required
      >
        <option value="">Select Cracked Lead</option>
        {crackedLeads.map(lead => (
          <option key={lead.id} value={lead.id}>{lead.lead.title}</option>
        ))}
      </select>
      <select
        value={formData.salesRepId}
        onChange={(e) => setFormData({...formData, salesRepId: parseInt(e.target.value)})}
        required
      >
        <option value="">Select Sales Rep</option>
        {salesReps.map(rep => (
          <option key={rep.id} value={rep.id}>{rep.firstName} {rep.lastName}</option>
        ))}
      </select>
      <select
        value={formData.clientId}
        onChange={(e) => setFormData({...formData, clientId: parseInt(e.target.value)})}
        required
      >
        <option value="">Select Client</option>
        {clients.map(client => (
          <option key={client.id} value={client.id}>{client.name}</option>
        ))}
      </select>
      <textarea
        placeholder="Project Description"
        value={formData.description}
        onChange={(e) => setFormData({...formData, description: e.target.value})}
        required
      />
      <button type="submit">Create Project</button>
    </form>
  );
};
```

### 2. Get Projects (Unified with Filtering)

**API Endpoint**: `GET /projects?filterBy=&status=&difficulty=&teamId=&unitHeadId=&employeeId=`

**Required Role**: `dep_manager`, `unit_head`, `team_lead`, `senior`, `junior`

**Query Parameters**:
```typescript
interface ProjectQueryParams {
  filterBy?: 'all' | 'my_projects' | 'team_projects' | 'unit_projects';
  status?: 'pending_assignment' | 'in_progress' | 'onhold' | 'completed';
  difficulty?: 'easy' | 'medium' | 'hard';
  teamId?: number;
  unitHeadId?: number;
  employeeId?: number;
}
```

**Response**:
```typescript
interface Project {
  id: number;
  crackedLeadId: number;
  salesRepId: number;
  clientId: number;
  unitHeadId: number;
  teamId: number;
  status: string;
  difficultyLevel: string;
  paymentStage: string;
  description: string;
  deadline: string;
  liveProgress: number;
  createdAt: string;
  updatedAt: string;
  client: {
    id: number;
    name: string;
    email: string;
  };
  team: {
    id: number;
    name: string;
    teamLead: {
      id: number;
      firstName: string;
      lastName: string;
    };
  };
  unitHead: {
    id: number;
    firstName: string;
    lastName: string;
  };
  salesRep: {
    id: number;
    firstName: string;
    lastName: string;
  };
}
```

**Frontend Implementation**:
```typescript
// Component: ProjectsList.tsx
const ProjectsList = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filters, setFilters] = useState<ProjectQueryParams>({});
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString());
      });
      
      const response = await fetch(`${API_BASE_URL}/projects?${queryParams}`, {
        headers
      });
      const data = await response.json();
      setProjects(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [filters]);

  return (
    <div className="projects-list">
      <div className="filters">
        <select
          value={filters.filterBy || ''}
          onChange={(e) => setFilters({...filters, filterBy: e.target.value as any})}
        >
          <option value="">All Projects</option>
          <option value="my_projects">My Projects</option>
          <option value="team_projects">Team Projects</option>
          <option value="unit_projects">Unit Projects</option>
        </select>
        <select
          value={filters.status || ''}
          onChange={(e) => setFilters({...filters, status: e.target.value as any})}
        >
          <option value="">All Status</option>
          <option value="pending_assignment">Pending Assignment</option>
          <option value="in_progress">In Progress</option>
          <option value="onhold">On Hold</option>
          <option value="completed">Completed</option>
        </select>
        <select
          value={filters.difficulty || ''}
          onChange={(e) => setFilters({...filters, difficulty: e.target.value as any})}
        >
          <option value="">All Difficulty</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>
      
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="projects-grid">
          {projects.map(project => (
            <div key={project.id} className="project-card">
              <h3>{project.client.name}</h3>
              <p>Status: {project.status}</p>
              <p>Progress: {project.liveProgress}%</p>
              <p>Team: {project.team?.name || 'Unassigned'}</p>
              <div className="project-actions">
                <button onClick={() => viewProjectDetails(project.id)}>View Details</button>
                <button onClick={() => editProject(project.id)}>Edit</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

### 3. Get Project Details

**API Endpoint**: `GET /projects/:id`

**Required Role**: All roles (with access control)

### 4. Assign Unit Head

**API Endpoint**: `PUT /projects/:id/assign-unit-head`

**Required Role**: `dep_manager`

**Request Body**:
```typescript
interface AssignUnitHeadRequest {
  unitHeadId: number;
}
```

### 5. Assign Team to Project

**API Endpoint**: `PUT /projects/:id/assign-team`

**Required Role**: `dep_manager`, `unit_head`

**Request Body**:
```typescript
interface AssignTeamRequest {
  teamId: number;
}
```

### 6. Update Project

**API Endpoint**: `PUT /projects/:id`

**Required Role**: Role-based permissions

**Request Body**:
```typescript
interface UpdateProjectRequest {
  status?: 'in_progress' | 'onhold' | 'completed';
  difficultyLevel?: 'easy' | 'medium' | 'hard';
  paymentStage?: 'initial' | 'milestone' | 'final' | 'approved';
  description?: string;
  deadline?: string;
  liveProgress?: number;
}
```

## ✅ Task Management

### 1. Create Task

**API Endpoint**: `POST /projects/:id/tasks`

**Required Role**: `dep_manager`, `unit_head`, `team_lead`

**Request Body**:
```typescript
interface CreateTaskRequest {
  title: string;
  description?: string;
  assignedTo: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  difficulty: 'easy' | 'medium' | 'hard';
  startDate?: string;
  dueDate?: string;
}
```

**Frontend Implementation**:
```typescript
// Component: CreateTaskForm.tsx
const CreateTaskForm = ({ projectId }: { projectId: number }) => {
  const [formData, setFormData] = useState<CreateTaskRequest>({
    title: '',
    description: '',
    assignedTo: 0,
    priority: 'medium',
    difficulty: 'medium',
    startDate: '',
    dueDate: ''
  });
  const [teamMembers, setTeamMembers] = useState([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}/tasks`, {
        method: 'POST',
        headers,
        body: JSON.stringify(formData)
      });
      const result = await response.json();
      if (result.success) {
        showSuccessMessage('Task created successfully');
        refreshTasksList();
      }
    } catch (error) {
      showErrorMessage('Failed to create task');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Task Title"
        value={formData.title}
        onChange={(e) => setFormData({...formData, title: e.target.value})}
        required
      />
      <textarea
        placeholder="Task Description"
        value={formData.description}
        onChange={(e) => setFormData({...formData, description: e.target.value})}
      />
      <select
        value={formData.assignedTo}
        onChange={(e) => setFormData({...formData, assignedTo: parseInt(e.target.value)})}
        required
      >
        <option value="">Select Assignee</option>
        {teamMembers.map(member => (
          <option key={member.id} value={member.id}>
            {member.firstName} {member.lastName}
          </option>
        ))}
      </select>
      <select
        value={formData.priority}
        onChange={(e) => setFormData({...formData, priority: e.target.value as any})}
      >
        <option value="low">Low Priority</option>
        <option value="medium">Medium Priority</option>
        <option value="high">High Priority</option>
        <option value="urgent">Urgent</option>
      </select>
      <select
        value={formData.difficulty}
        onChange={(e) => setFormData({...formData, difficulty: e.target.value as any})}
      >
        <option value="easy">Easy</option>
        <option value="medium">Medium</option>
        <option value="hard">Hard</option>
      </select>
      <input
        type="date"
        value={formData.startDate}
        onChange={(e) => setFormData({...formData, startDate: e.target.value})}
      />
      <input
        type="date"
        value={formData.dueDate}
        onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
      />
      <button type="submit">Create Task</button>
    </form>
  );
};
```

### 2. Get Project Tasks

**API Endpoint**: `GET /projects/:id/tasks`

**Required Role**: All roles

**Response**:
```typescript
interface ProjectTask {
  id: number;
  projectId: number;
  title: string;
  description: string;
  assignedBy: number;
  assignedTo: number;
  priority: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  difficulty: string;
  startDate: string;
  dueDate: string;
  completedOn: string;
  comments: string;
  createdAt: string;
  updatedAt: string;
  assigner: {
    id: number;
    firstName: string;
    lastName: string;
  };
  assignee: {
    id: number;
    firstName: string;
    lastName: string;
  };
}
```

### 3. Update Task

**API Endpoint**: `PUT /projects/:id/tasks/:taskId`

**Required Role**: Task assignee, team lead, unit head, manager

**Request Body**:
```typescript
interface UpdateTaskRequest {
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  comments?: string;
  completedOn?: string;
}
```

### 4. Get Task Details

**API Endpoint**: `GET /projects/:id/tasks/:taskId`

**Required Role**: All roles

## 💬 Communication & Collaboration

### 1. Create Project Chat

**API Endpoint**: `POST /projects/:id/chat`

**Required Role**: Team members

**Request Body**:
```typescript
interface CreateChatRequest {
  message: string;
  participants: number[];
}
```

### 2. Send Chat Message

**API Endpoint**: `POST /projects/:id/chat/message`

**Required Role**: Chat participants

**Request Body**:
```typescript
interface SendMessageRequest {
  message: string;
  type?: 'text' | 'file' | 'image';
  fileUrl?: string;
}
```

### 3. Get Chat Messages

**API Endpoint**: `GET /projects/:id/chat/messages`

**Required Role**: Chat participants

### 4. Add Chat Participant

**API Endpoint**: `POST /projects/:id/chat/participants`

**Required Role**: Team lead, unit head, manager

**Request Body**:
```typescript
interface AddParticipantRequest {
  employeeId: number;
}
```

## 📊 Analytics & Reporting

### 1. Get Unit Performance

**API Endpoint**: `GET /production/analytics/unit-performance`

**Required Role**: `dep_manager`, `unit_head`

**Response**:
```typescript
interface UnitPerformance {
  unitId: number;
  unitName: string;
  totalProjects: number;
  completedProjects: number;
  inProgressProjects: number;
  completionRate: number;
  averageProjectDuration: number;
  teamCount: number;
  employeeCount: number;
}
```

### 2. Get Team Productivity

**API Endpoint**: `GET /production/analytics/team-productivity`

**Required Role**: `dep_manager`, `unit_head`, `team_lead`

### 3. Get Employee Performance

**API Endpoint**: `GET /production/analytics/employee-performance`

**Required Role**: `dep_manager`, `unit_head`

### 4. Get Project Statistics

**API Endpoint**: `GET /production/analytics/project-statistics`

**Required Role**: `dep_manager`, `unit_head`

## 🎨 UI Components Structure

### Main Layout Structure
```
ProductionDashboard
├── Sidebar
│   ├── UnitsManagement
│   ├── TeamsManagement
│   ├── ProjectsManagement
│   ├── TasksManagement
│   ├── Analytics
│   └── Settings
├── Header
│   ├── UserProfile
│   ├── Notifications
│   └── Search
└── MainContent
    ├── UnitsList
    ├── TeamsList
    ├── ProjectsList
    ├── TasksList
    └── AnalyticsDashboard
```

### Component Hierarchy
```typescript
// Main Dashboard Component
const ProductionDashboard = () => {
  const [activeTab, setActiveTab] = useState('units');
  const [user, setUser] = useState<UserPermissions | null>(null);

  return (
    <div className="production-dashboard">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} user={user} />
      <div className="main-content">
        <Header user={user} />
        {activeTab === 'units' && <UnitsManagement />}
        {activeTab === 'teams' && <TeamsManagement />}
        {activeTab === 'projects' && <ProjectsManagement />}
        {activeTab === 'tasks' && <TasksManagement />}
        {activeTab === 'analytics' && <AnalyticsDashboard />}
      </div>
    </div>
  );
};
```

### Key Components

#### 1. Units Management
```typescript
const UnitsManagement = () => {
  return (
    <div className="units-management">
      <div className="header">
        <h2>Production Units</h2>
        <button onClick={() => setShowCreateForm(true)}>Create Unit</button>
      </div>
      <UnitsList />
      {showCreateForm && <CreateUnitForm onClose={() => setShowCreateForm(false)} />}
    </div>
  );
};
```

#### 2. Teams Management
```typescript
const TeamsManagement = () => {
  return (
    <div className="teams-management">
      <div className="header">
        <h2>Teams</h2>
        <button onClick={() => setShowCreateForm(true)}>Create Team</button>
      </div>
      <TeamsList />
      {showCreateForm && <CreateTeamForm onClose={() => setShowCreateForm(false)} />}
    </div>
  );
};
```

#### 3. Projects Management
```typescript
const ProjectsManagement = () => {
  return (
    <div className="projects-management">
      <div className="header">
        <h2>Projects</h2>
        <button onClick={() => setShowCreateForm(true)}>Create Project</button>
      </div>
      <ProjectsList />
      {showCreateForm && <CreateProjectForm onClose={() => setShowCreateForm(false)} />}
    </div>
  );
};
```

## 🔄 State Management

### Redux/Context Structure
```typescript
interface ProductionState {
  units: {
    list: Unit[];
    loading: boolean;
    error: string | null;
  };
  teams: {
    list: Team[];
    loading: boolean;
    error: string | null;
  };
  projects: {
    list: Project[];
    loading: boolean;
    error: string | null;
    filters: ProjectQueryParams;
  };
  tasks: {
    list: ProjectTask[];
    loading: boolean;
    error: string | null;
  };
  user: {
    permissions: UserPermissions;
    loading: boolean;
  };
}
```

### State Management Actions
```typescript
// Redux Actions
const productionActions = {
  // Units
  fetchUnits: () => ({ type: 'FETCH_UNITS' }),
  createUnit: (unitData: CreateUnitRequest) => ({ type: 'CREATE_UNIT', payload: unitData }),
  updateUnit: (id: number, unitData: UpdateUnitRequest) => ({ type: 'UPDATE_UNIT', payload: { id, unitData } }),
  deleteUnit: (id: number) => ({ type: 'DELETE_UNIT', payload: id }),
  
  // Teams
  fetchTeams: () => ({ type: 'FETCH_TEAMS' }),
  createTeam: (teamData: CreateTeamRequest) => ({ type: 'CREATE_TEAM', payload: teamData }),
  assignTeamToUnit: (teamId: number, unitId: number) => ({ type: 'ASSIGN_TEAM_TO_UNIT', payload: { teamId, unitId } }),
  
  // Projects
  fetchProjects: (filters: ProjectQueryParams) => ({ type: 'FETCH_PROJECTS', payload: filters }),
  createProject: (projectData: CreateProjectFromPaymentRequest) => ({ type: 'CREATE_PROJECT', payload: projectData }),
  updateProject: (id: number, projectData: UpdateProjectRequest) => ({ type: 'UPDATE_PROJECT', payload: { id, projectData } }),
  
  // Tasks
  fetchTasks: (projectId: number) => ({ type: 'FETCH_TASKS', payload: projectId }),
  createTask: (projectId: number, taskData: CreateTaskRequest) => ({ type: 'CREATE_TASK', payload: { projectId, taskData } }),
  updateTask: (projectId: number, taskId: number, taskData: UpdateTaskRequest) => ({ type: 'UPDATE_TASK', payload: { projectId, taskId, taskData } }),
};
```

## ⚠️ Error Handling

### Error Types
```typescript
interface APIError {
  statusCode: number;
  message: string | string[];
  error: string;
}

interface ValidationError {
  field: string;
  message: string;
}
```

### Error Handling Implementation
```typescript
const handleAPIError = (error: APIError) => {
  switch (error.statusCode) {
    case 400:
      if (Array.isArray(error.message)) {
        // Validation errors
        error.message.forEach(msg => showErrorMessage(msg));
      } else {
        showErrorMessage(error.message);
      }
      break;
    case 401:
      showErrorMessage('Unauthorized. Please login again.');
      redirectToLogin();
      break;
    case 403:
      showErrorMessage('Access denied. You do not have permission to perform this action.');
      break;
    case 404:
      showErrorMessage('Resource not found.');
      break;
    case 409:
      showErrorMessage('Conflict. Resource already exists.');
      break;
    case 500:
      showErrorMessage('Internal server error. Please try again later.');
      break;
    default:
      showErrorMessage('An unexpected error occurred.');
  }
};
```

### Loading States
```typescript
const LoadingSpinner = () => (
  <div className="loading-spinner">
    <div className="spinner"></div>
    <p>Loading...</p>
  </div>
);

const ErrorMessage = ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
  <div className="error-message">
    <p>{message}</p>
    {onRetry && <button onClick={onRetry}>Retry</button>}
  </div>
);
```

## 🚀 Implementation Checklist

### Phase 1: Setup & Authentication
- [ ] Set up authentication system
- [ ] Implement role-based access control
- [ ] Create base API service layer
- [ ] Set up error handling

### Phase 2: Core Management
- [ ] Implement Units Management
- [ ] Implement Teams Management
- [ ] Implement Projects Management
- [ ] Implement Tasks Management

### Phase 3: Advanced Features
- [ ] Implement Communication & Collaboration
- [ ] Implement Analytics & Reporting
- [ ] Add real-time updates
- [ ] Implement notifications

### Phase 4: Polish & Optimization
- [ ] Add loading states
- [ ] Implement caching
- [ ] Add responsive design
- [ ] Performance optimization

## 📱 Responsive Design Considerations

### Mobile-First Approach
```css
/* Mobile styles */
.production-dashboard {
  display: flex;
  flex-direction: column;
}

.sidebar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  transform: translateY(100%);
  transition: transform 0.3s ease;
}

.sidebar.open {
  transform: translateY(0);
}

/* Tablet styles */
@media (min-width: 768px) {
  .production-dashboard {
    display: grid;
    grid-template-columns: 250px 1fr;
  }
  
  .sidebar {
    position: static;
    transform: none;
  }
}

/* Desktop styles */
@media (min-width: 1024px) {
  .production-dashboard {
    grid-template-columns: 300px 1fr;
  }
}
```

## 🔧 Development Tools & Libraries

### Recommended Libraries
```json
{
  "dependencies": {
    "react": "^18.0.0",
    "react-router-dom": "^6.0.0",
    "axios": "^1.0.0",
    "react-query": "^3.0.0",
    "react-hook-form": "^7.0.0",
    "react-select": "^5.0.0",
    "react-datepicker": "^4.0.0",
    "react-table": "^7.0.0",
    "chart.js": "^3.0.0",
    "react-chartjs-2": "^4.0.0"
  }
}
```

### Environment Configuration
```typescript
// config/api.ts
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3
};

// config/auth.ts
export const AUTH_CONFIG = {
  TOKEN_KEY: 'jwt_token',
  REFRESH_TOKEN_KEY: 'refresh_token',
  TOKEN_EXPIRY: 24 * 60 * 60 * 1000 // 24 hours
};
```

This comprehensive guide provides everything needed to implement the Production Department frontend with proper API integration, state management, and user experience considerations.
