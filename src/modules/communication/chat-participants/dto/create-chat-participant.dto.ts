import { IsInt, IsEnum, IsNotEmpty } from 'class-validator';

export enum MemberType {
  OWNER = 'owner',
  PARTICIPANT = 'participant',
}

export class CreateChatParticipantDto {
  @IsNotEmpty()
  @IsInt()
  chatId: number;

  @IsNotEmpty()
  @IsInt()
  employeeId: number;

  @IsNotEmpty()
  @IsEnum(MemberType)
  memberType: MemberType;
}
