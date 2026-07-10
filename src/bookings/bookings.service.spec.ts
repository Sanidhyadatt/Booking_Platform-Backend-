import { Test, TestingModule } from '@nestjs/testing';
import { BookingsService } from './bookings.service';
import { PrismaService } from '../prisma/prisma.service';
import { BookingStatus } from '@prisma/client';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';

describe('BookingsService', () => {
  let service: BookingsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    service: {
      findUnique: jest.fn(),
    },
    booking: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createBookingDto = {
      customerName: 'Alice',
      customerEmail: 'alice@example.com',
      customerPhone: '123456789',
      serviceId: 1,
      bookingDate: new Date('2030-12-31T00:00:00.000Z'),
      bookingTime: '10:00',
      notes: 'No notes',
    };

    it('should successfully create a booking if service exists and is active', async () => {
      const mockService = { id: 1, title: 'Haircut', isActive: true };
      const mockCreatedBooking = {
        id: 1,
        ...createBookingDto,
        status: BookingStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.service.findUnique.mockResolvedValue(mockService);
      mockPrismaService.booking.findFirst.mockResolvedValue(null);
      mockPrismaService.booking.create.mockResolvedValue(mockCreatedBooking);

      const result = await service.create(createBookingDto);

      expect(mockPrismaService.service.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual(mockCreatedBooking);
    });

    it('should throw BadRequestException if the service is inactive', async () => {
      const mockService = { id: 1, title: 'Haircut', isActive: false };
      mockPrismaService.service.findUnique.mockResolvedValue(mockService);

      await expect(service.create(createBookingDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if the booking time format is invalid', async () => {
      const mockService = { id: 1, title: 'Haircut', isActive: true };
      mockPrismaService.service.findUnique.mockResolvedValue(mockService);

      const invalidTimeDto = {
        ...createBookingDto,
        bookingTime: '25:00',
      };

      await expect(service.create(invalidTimeDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if the service does not exist', async () => {
      mockPrismaService.service.findUnique.mockResolvedValue(null);

      await expect(service.create(createBookingDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if the booking date is in the past', async () => {
      const mockService = { id: 1, title: 'Haircut', isActive: true };
      mockPrismaService.service.findUnique.mockResolvedValue(mockService);

      const pastBookingDto = {
        ...createBookingDto,
        bookingDate: new Date('2020-01-01T00:00:00.000Z'),
      };

      await expect(service.create(pastBookingDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if a duplicate booking already exists', async () => {
      const mockService = { id: 1, title: 'Haircut', isActive: true };
      mockPrismaService.service.findUnique.mockResolvedValue(mockService);
      mockPrismaService.booking.findFirst.mockResolvedValue({ id: 99 });

      await expect(service.create(createBookingDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('updateStatus', () => {
    it('should throw BadRequestException when changing CANCELLED booking to COMPLETED', async () => {
      const mockBooking = {
        id: 1,
        status: BookingStatus.CANCELLED,
      };
      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking);

      await expect(service.updateStatus(1, BookingStatus.COMPLETED)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when changing COMPLETED booking to PENDING', async () => {
      const mockBooking = {
        id: 1,
        status: BookingStatus.COMPLETED,
      };
      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking);

      await expect(service.updateStatus(1, BookingStatus.PENDING)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('cancel', () => {
    it('should successfully cancel a booking by setting status to CANCELLED', async () => {
      const mockBooking = {
        id: 1,
        status: BookingStatus.PENDING,
      };
      const cancelledBooking = {
        id: 1,
        status: BookingStatus.CANCELLED,
      };
      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking);
      mockPrismaService.booking.update.mockResolvedValue(cancelledBooking);

      const result = await service.cancel(1);

      expect(mockPrismaService.booking.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: BookingStatus.CANCELLED },
      });
      expect(result.status).toBe(BookingStatus.CANCELLED);
    });
  });
});
