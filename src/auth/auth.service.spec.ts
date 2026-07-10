import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  const mockUsersService = {
    create: jest.fn(),
    findByEmail: jest.fn(),
    findById: jest.fn(),
    updateRefreshToken: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn().mockImplementation((payload, options) => {
      if (options?.expiresIn === '15m') return Promise.resolve('mock-access-token');
      return Promise.resolve('mock-refresh-token');
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should successfully register a user and return sanitized details', async () => {
      const registerDto = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      };
      
      const mockCreatedUser = {
        id: 1,
        name: registerDto.name,
        email: registerDto.email,
        password: 'hashedpassword123',
        role: 'USER',
        hashedRefreshToken: null,
        createdAt: new Date(),
      };

      mockUsersService.create.mockResolvedValue(mockCreatedUser);

      const result = await service.register(registerDto);

      expect(usersService.create).toHaveBeenCalledWith({ ...registerDto, role: 'USER' });
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('hashedRefreshToken');
      expect(result).toEqual({
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        role: 'USER',
        createdAt: mockCreatedUser.createdAt,
      });
    });
  });

  describe('login', () => {
    it('should successfully authenticate user and return access and refresh tokens', async () => {
      const loginDto = {
        email: 'john@example.com',
        password: 'password123',
      };

      const hashedPassword = await bcrypt.hash(loginDto.password, 10);
      const mockUser = {
        id: 1,
        name: 'John Doe',
        email: loginDto.email,
        password: hashedPassword,
        createdAt: new Date(),
      };

      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockUsersService.updateRefreshToken.mockResolvedValue(undefined);

      const result = await service.login(loginDto);

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(mockUsersService.updateRefreshToken).toHaveBeenCalledWith(mockUser.id, 'mock-refresh-token');
      expect(result).toEqual({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      });
    });
  });

  describe('refresh', () => {
    it('should rotate tokens successfully with a valid refresh token', async () => {
      const userId = 1;
      const rawRefreshToken = 'valid-refresh-token';
      const hashedRefreshToken = await bcrypt.hash(rawRefreshToken, 10);

      const mockUser = {
        id: userId,
        email: 'john@example.com',
        hashedRefreshToken,
      };

      mockUsersService.findById.mockResolvedValue(mockUser);
      mockUsersService.updateRefreshToken.mockResolvedValue(undefined);

      const result = await service.refresh(userId, rawRefreshToken);

      expect(mockUsersService.findById).toHaveBeenCalledWith(userId);
      expect(mockUsersService.updateRefreshToken).toHaveBeenCalledWith(userId, 'mock-refresh-token');
      expect(result).toEqual({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      });
    });

    it('should throw UnauthorizedException and clear token if refresh token does not match', async () => {
      const userId = 1;
      const rawRefreshToken = 'wrong-refresh-token';
      const hashedRefreshToken = await bcrypt.hash('correct-refresh-token', 10);

      const mockUser = {
        id: userId,
        email: 'john@example.com',
        hashedRefreshToken,
      };

      mockUsersService.findById.mockResolvedValue(mockUser);
      mockUsersService.updateRefreshToken.mockResolvedValue(undefined);

      await expect(service.refresh(userId, rawRefreshToken)).rejects.toThrow(UnauthorizedException);
      expect(mockUsersService.updateRefreshToken).toHaveBeenCalledWith(userId, null);
    });
  });

  describe('logout', () => {
    it('should invalidate the user refresh token', async () => {
      const userId = 1;
      mockUsersService.updateRefreshToken.mockResolvedValue(undefined);

      const result = await service.logout(userId);

      expect(mockUsersService.updateRefreshToken).toHaveBeenCalledWith(userId, null);
      expect(result).toEqual({ success: true });
    });
  });
});
