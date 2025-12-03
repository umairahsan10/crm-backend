import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { MeetingService } from './meeting.service';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { UpdateMeetingDto } from './dto/update-meeting.dto';
import { GetMeetingsDto } from './dto/get-meetings.dto';
import { MeetingResponseDto } from './dto/meeting-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    role: string | number;
    type: string;
    department?: string;
    permissions?: any;
  };
}

@ApiTags('Communication Meetings')
@ApiBearerAuth()
@Controller('communication/meetings')
@UseGuards(JwtAuthGuard)
export class MeetingController {
  constructor(private readonly meetingService: MeetingService) {}

  /**
   * Create a new meeting
   * All employees can schedule meetings with one another
   * Sales team, HR and admin can schedule meetings with clients
   * Note: employeeId in meetings table represents the creator, not the participant
   */
  @Post()
  @ApiOperation({ summary: 'Create a new meeting' })
  @ApiResponse({
    status: 201,
    description: 'Meeting successfully created',
    type: MeetingResponseDto,
  })
  @ApiBody({ type: CreateMeetingDto })
  async createMeeting(
    @Body() createMeetingDto: CreateMeetingDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<MeetingResponseDto> {
    return this.meetingService.createMeeting(createMeetingDto, req.user.id);
  }

  /**
   * Get all meetings with optional filters
   * Only Admin and HR can access all meetings
   */
  @Get()
  @ApiOperation({
    summary: 'Get all meetings with optional filters (Admin/HR only)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of all meetings',
    type: [MeetingResponseDto],
  })
  @ApiQuery({
    name: 'employeeId',
    required: false,
    description: 'Filter by employee ID',
  })
  @ApiQuery({
    name: 'clientId',
    required: false,
    description: 'Filter by client ID',
  })
  @ApiQuery({
    name: 'projectId',
    required: false,
    description: 'Filter by project ID',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by meeting status',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Filter by start date (ISO 8601)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'Filter by end date (ISO 8601)',
  })
  async getAllMeetings(
    @Query() query: GetMeetingsDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<MeetingResponseDto[]> {
    return this.meetingService.getAllMeetings(query, req.user.id);
  }

  /**
   * Get meeting by ID
   * Access control based on employee permissions
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get meeting by ID' })
  @ApiResponse({
    status: 200,
    description: 'Meeting found',
    type: MeetingResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Meeting not found' })
  @ApiParam({ name: 'id', type: Number, description: 'Meeting ID' })
  async getMeetingById(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
  ): Promise<MeetingResponseDto> {
    return this.meetingService.getMeetingById(id, req.user.id);
  }

  /**
   * Update meeting
   * Only meeting creator or Admin can update (not HR)
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Update an existing meeting (creator or admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Meeting updated successfully',
    type: MeetingResponseDto,
  })
  @ApiBody({ type: UpdateMeetingDto })
  @ApiParam({ name: 'id', type: Number, description: 'Meeting ID' })
  async updateMeeting(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMeetingDto: UpdateMeetingDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<MeetingResponseDto> {
    return this.meetingService.updateMeeting(id, updateMeetingDto, req.user.id);
  }

  /**
   * Delete meeting
   * Only meeting creator or Admin can delete (not HR)
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a meeting (creator or admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Meeting deleted successfully',
    schema: { example: { message: 'Meeting deleted successfully' } },
  })
  @ApiParam({ name: 'id', type: Number, description: 'Meeting ID' })
  async deleteMeeting(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
  ): Promise<{ message: string }> {
    return this.meetingService.deleteMeeting(id, req.user.id);
  }

  /**
   * Get meetings for current employee
   */
  @Get('my/meetings')
  @ApiOperation({ summary: 'Get meetings created by the logged-in employee' })
  @ApiResponse({
    status: 200,
    description: 'List of meetings created by employee',
    type: [MeetingResponseDto],
  })
  async getMyMeetings(
    @Request() req: AuthenticatedRequest,
  ): Promise<MeetingResponseDto[]> {
    return this.meetingService.getMyMeetings(req.user.id);
  }

  /**
   * Get upcoming meetings for current employee
   */
  @Get('upcoming/:days')
  @ApiOperation({
    summary: 'Get upcoming meetings within specified days (default: 7)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of upcoming meetings',
    type: [MeetingResponseDto],
  })
  @ApiParam({
    name: 'days',
    type: String,
    description: 'Number of days ahead to check (default: 7)',
    required: false,
  })
  async getUpcomingMeetings(
    @Param('days') days: string = '7',
    @Request() req: AuthenticatedRequest,
  ): Promise<MeetingResponseDto[]> {
    const daysNumber = parseInt(days, 10) || 7;
    return this.meetingService.getUpcomingMeetings(req.user.id, daysNumber);
  }

  /**
   * Get upcoming meetings for current employee (default 7 days)
   */
  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming meetings for next 7 days (default)' })
  @ApiResponse({
    status: 200,
    description: 'List of upcoming meetings (7 days)',
    type: [MeetingResponseDto],
  })
  async getUpcomingMeetingsDefault(
    @Request() req: AuthenticatedRequest,
  ): Promise<MeetingResponseDto[]> {
    return this.meetingService.getUpcomingMeetings(req.user.id, 7);
  }
}
