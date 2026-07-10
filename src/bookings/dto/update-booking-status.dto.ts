import { IsEnum, IsNotEmpty } from 'class-validator';
import { BookingStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateBookingStatusDto {
  @ApiProperty({ enum: BookingStatus, example: BookingStatus.CONFIRMED, description: 'The new status of the booking' })
  @IsNotEmpty()
  @IsEnum(BookingStatus)
  status!: BookingStatus;
}
