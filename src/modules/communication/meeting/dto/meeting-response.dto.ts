export class MeetingResponseDto {
  id: number;
  employeeId?: number;
  clientId?: number;
  projectId?: number;
  topic?: string;
  dateTime?: Date;
  status?: string;
  autoReminder: boolean;
  meetingLink: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Related data
  employee?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    department?: {
      id: number;
      name: string;
    };
  };
  
  client?: {
    id: number;
    clientName?: string;
    companyName?: string;
    email?: string;
    phone?: string;
  };
  
  project?: {
    id: number;
    description?: string;
    status?: string;
  };
}
