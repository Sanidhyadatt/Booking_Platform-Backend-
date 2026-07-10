import { IsBoolean, IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateServiceDto {
  @ApiProperty({ example: 'Haircut', description: 'The title of the service' })
  @IsNotEmpty()
  @IsString()
  title!: string;

  @ApiProperty({ example: 'Standard haircut and style', description: 'Description of the service' })
  @IsNotEmpty()
  @IsString()
  description!: string;

  @ApiProperty({ example: 30, description: 'Duration of the service in minutes' })
  @IsInt()
  @IsPositive()
  duration!: number;

  @ApiProperty({ example: 25.0, description: 'Price of the service' })
  @IsNumber()
  @IsPositive()
  price!: number;

  @ApiProperty({ example: true, description: 'Is the service active', required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
