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

interface AuthenticatedRequest extends Request {
    user: {
        id: number;
        role: string | number;
        type: string;
        department?: string;
        permissions?: any;
    };
}

@Controller('communication/meetings')
@UseGuards(JwtAuthGuard)
export class MeetingController {
    constructor(private readonly meetingService: MeetingService) { }

    /**
     * Create a new meeting
     * All employees can schedule meetings with one another
     * Sales team, HR and admin can schedule meetings with clients
     * Note: employeeId in meetings table represents the creator, not the participant
     */
    @Post()
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
    async getMyMeetings(
        @Request() req: AuthenticatedRequest,
    ): Promise<MeetingResponseDto[]> {
        return this.meetingService.getMyMeetings(req.user.id);
    }

    /**
     * Get upcoming meetings for current employee
     */
    @Get('upcoming/:days')
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
    async getUpcomingMeetingsDefault(
        @Request() req: AuthenticatedRequest,
    ): Promise<MeetingResponseDto[]> {
        return this.meetingService.getUpcomingMeetings(req.user.id, 7);
    }
}
