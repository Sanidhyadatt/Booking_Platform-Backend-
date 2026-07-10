import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { GetBookingsQueryDto } from './dto/get-bookings-query.dto';
import { Booking, BookingStatus, Prisma } from '@prisma/client';

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateBookingDto): Promise<Booking> {
    // 1. Check Service exists and is not deleted
    const service = await this.prisma.service.findUnique({
      where: { id: dto.serviceId },
    });
    if (!service) {
      throw new NotFoundException(`Service with ID ${dto.serviceId} not found`);
    }

    // 2. Inactive services cannot receive bookings
    if (!service.isActive) {
      throw new BadRequestException('Cannot book an inactive service');
    }

    // Validate bookingTime format (HH:MM)
    const timeRegex = /^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(dto.bookingTime)) {
      throw new BadRequestException('Invalid booking time format (HH:MM required)');
    }

    const normalizedDate = new Date(dto.bookingDate);
    normalizedDate.setHours(0, 0, 0, 0);

    // 3. Booking date and time cannot be in the past
    const combinedDateTime = new Date(normalizedDate);
    const [hours, minutes] = dto.bookingTime.split(':').map(Number);
    combinedDateTime.setHours(hours, minutes, 0, 0);

    if (combinedDateTime < new Date()) {
      throw new BadRequestException('Booking date and time cannot be in the past');
    }

    // 4. No duplicate bookings (same service, date, time, non-cancelled)
    const duplicate = await this.prisma.booking.findFirst({
      where: {
        serviceId: dto.serviceId,
        bookingDate: normalizedDate,
        bookingTime: dto.bookingTime,
        status: {
          not: BookingStatus.CANCELLED,
        },
      },
    });

    if (duplicate) {
      throw new ConflictException('Booking already exists');
    }

    return this.prisma.booking.create({
      data: {
        customerName: dto.customerName,
        customerEmail: dto.customerEmail,
        customerPhone: dto.customerPhone,
        bookingDate: normalizedDate,
        bookingTime: dto.bookingTime,
        notes: dto.notes,
        serviceId: dto.serviceId,
      },
    });
  }

  async findAll(query: GetBookingsQueryDto) {
    const { page, limit, search, status, bookingDate, sort, order } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.BookingWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (bookingDate) {
      const targetDate = new Date(bookingDate);
      targetDate.setHours(0, 0, 0, 0);
      where.bookingDate = targetDate;
    }

    if (search) {
      where.OR = [
        {
          customerName: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          customerEmail: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          customerPhone: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    const orderBy: Prisma.BookingOrderByWithRelationInput = {};
    if (sort) {
      orderBy[sort as keyof Prisma.BookingOrderByWithRelationInput] = order;
    } else {
      orderBy.createdAt = 'desc';
    }

    const [total, data] = await Promise.all([
      this.prisma.booking.count({ where }),
      this.prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: { service: true },
      }),
    ]);

    return {
      data,
      meta: {
        totalItems: total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        pageSize: limit,
      },
    };
  }

  async findOne(id: number): Promise<Booking> {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { service: true },
    });
    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }
    return booking;
  }

  async updateStatus(id: number, status: BookingStatus): Promise<Booking> {
    const booking = await this.findOne(id);

    // Cancelled bookings cannot become Completed
    if (booking.status === BookingStatus.CANCELLED && status === BookingStatus.COMPLETED) {
      throw new BadRequestException('Cancelled bookings cannot become Completed');
    }
    // Completed bookings cannot become Pending
    if (booking.status === BookingStatus.COMPLETED && status === BookingStatus.PENDING) {
      throw new BadRequestException('Completed bookings cannot become Pending');
    }

    return this.prisma.booking.update({
      where: { id },
      data: { status },
    });
  }

  async remove(id: number): Promise<Booking> {
    await this.findOne(id);
    return this.prisma.booking.delete({
      where: { id },
    });
  }
}
