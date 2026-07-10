import { IsEmail, IsInt, IsNotEmpty, IsOptional, IsString, Matches, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty({ example: 'John Doe', description: 'Name of the customer' })
  @IsNotEmpty()
  @IsString()
  customerName!: string;

  @ApiProperty({ example: 'john.doe@example.com', description: 'Email address of the customer' })
  @IsEmail()
  @IsNotEmpty()
  customerEmail!: string;

  @ApiProperty({ example: '+1234567890', description: 'Contact phone number' })
  @IsNotEmpty()
  @IsString()
  customerPhone!: string;

  @ApiProperty({ example: 1, description: 'ID of the service being booked' })
  @IsInt()
  @IsNotEmpty()
  serviceId!: number;

  @ApiProperty({ example: '2026-07-15T00:00:00.000Z', description: 'Date of the booking' })
  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  bookingDate!: Date;

  @ApiProperty({ example: '14:30', description: 'Time of the booking (24h HH:MM format)' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'bookingTime must be in 24h format HH:MM' })
  bookingTime!: string;

  @ApiProperty({ example: 'Please prepare water.', description: 'Additional notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
