import { IsOptional, IsInt, IsEnum } from 'class-validator';
import { MemberType } from './create-chat-participant.dto';

export class UpdateChatParticipantDto {
  @IsOptional()
  @IsInt()
  chatId?: number;

  @IsOptional()
  @IsInt()
  employeeId?: number;

  @IsOptional()
  @IsEnum(MemberType)
  memberType?: MemberType;
}
