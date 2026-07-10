import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { GetBookingsQueryDto } from './dto/get-bookings-query.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ResponseMessage } from '../common/decorators/response-message.decorator';

@ApiTags('Bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new booking (Public)' })
  @ApiResponse({ status: 201, description: 'Booking created successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request / Validation error / Date in the past' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  @ApiResponse({ status: 409, description: 'Booking slot already occupied (Conflict)' })
  @ResponseMessage('Booking created successfully')
  create(@Body() createBookingDto: CreateBookingDto) {
    return this.bookingsService.create(createBookingDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List and search bookings with pagination and filters (Authenticated)' })
  @ApiResponse({ status: 200, description: 'List of bookings' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ResponseMessage('Bookings retrieved successfully')
  findAll(@Query() query: GetBookingsQueryDto) {
    return this.bookingsService.findAll(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get booking by ID (Authenticated)' })
  @ApiResponse({ status: 200, description: 'Booking details' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  @ResponseMessage('Booking retrieved successfully')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.bookingsService.findOne(id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update booking status (Authenticated)' })
  @ApiResponse({ status: 200, description: 'Booking status updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid transition' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  @ResponseMessage('Booking status updated successfully')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBookingStatusDto: UpdateBookingStatusDto,
  ) {
    return this.bookingsService.updateStatus(id, updateBookingStatusDto.status);
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel booking (Authenticated)' })
  @ApiResponse({ status: 200, description: 'Booking cancelled successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  @ResponseMessage('Booking cancelled successfully')
  cancel(@Param('id', ParseIntPipe) id: number) {
    return this.bookingsService.cancel(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete booking (Authenticated)' })
  @ApiResponse({ status: 200, description: 'Booking deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  @ResponseMessage('Booking deleted successfully')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.bookingsService.remove(id);
  }
}
