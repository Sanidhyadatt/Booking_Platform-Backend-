import { Test, TestingModule } from '@nestjs/testing';
import { ServicesService } from './services.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('ServicesService', () => {
  let service: ServicesService;
  let prisma: PrismaService;

  const mockPrismaService = {
    service: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServicesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ServicesService>(ServicesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should successfully create a service', async () => {
      const dto = {
        title: 'Haircut',
        description: 'Trim hair',
        duration: 30,
        price: 20.0,
        isActive: true,
      };
      mockPrismaService.service.create.mockResolvedValue({ id: 1, ...dto });

      const result = await service.create(dto);

      expect(mockPrismaService.service.create).toHaveBeenCalledWith({ data: dto });
      expect(result.id).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return service if found', async () => {
      const mockService = { id: 1, title: 'Haircut' };
      mockPrismaService.service.findUnique.mockResolvedValue(mockService);

      const result = await service.findOne(1);

      expect(mockPrismaService.service.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual(mockService);
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrismaService.service.findUnique.mockResolvedValue(null);

      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return paginated list of services', async () => {
      const query = {
        page: 1,
        limit: 10,
        order: 'desc' as any,
      };

      mockPrismaService.service.count.mockResolvedValue(2);
      mockPrismaService.service.findMany.mockResolvedValue([
        { id: 1, title: 'Service 1' },
        { id: 2, title: 'Service 2' },
      ]);

      const result = await service.findAll(query);

      expect(mockPrismaService.service.count).toHaveBeenCalled();
      expect(mockPrismaService.service.findMany).toHaveBeenCalled();
      expect(result.meta.totalItems).toBe(2);
      expect(result.meta.totalPages).toBe(1);
    });
  });
});
