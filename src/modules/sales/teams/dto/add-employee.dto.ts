import { IsNumber, IsNotEmpty } from 'class-validator';

export class AddEmployeeDto {
  @IsNumber()
  @IsNotEmpty()
  employeeId: number;
}
