import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;

  const mockUser = {
    id: 'user-uuid-1',
    email: 'admin@financeos.local',
    username: 'admin',
    passwordHash: '$2b$10$hashedpasswordstringsample',
    displayName: 'Admin User',
    role: 'admin',
    isActive: true,
  };

  const mockUsersService = {
    findByUsername: jest.fn().mockImplementation((username) => {
      if (username === 'admin') return Promise.resolve(mockUser);
      return Promise.resolve(null);
    }),
    findByEmail: jest.fn().mockImplementation((email) => {
      if (email === 'admin@financeos.local') return Promise.resolve(mockUser);
      return Promise.resolve(null);
    }),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mocked-jwt-token'),
    verifyAsync: jest.fn().mockResolvedValue({ sub: 'user-uuid-1', username: 'admin' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should validate user with valid credentials', async () => {
    jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true as never));

    const user = await service.validateUser('admin', 'AdminUser123!');
    expect(user).toBeDefined();
    expect(user?.username).toBe('admin');
  });

  it('should return null for invalid credentials', async () => {
    jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false as never));

    const user = await service.validateUser('admin', 'wrongpassword');
    expect(user).toBeNull();
  });

  it('should login user and return access & refresh tokens', async () => {
    const result = await service.login(mockUser as any);
    expect(result).toBeDefined();
    expect(result.accessToken).toBe('mocked-jwt-token');
    expect(result.refreshToken).toBe('mocked-jwt-token');
    expect(result.user.username).toBe(mockUser.username);
  });
});
