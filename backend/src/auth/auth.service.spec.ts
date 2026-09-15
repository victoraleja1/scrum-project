import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: { user: { upsert: jest.Mock } };

  beforeEach(async () => {
    prismaService = {
      user: {
        upsert: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(null),
          },
        },
        {
          provide: PrismaService,
          useValue: prismaService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('upsertUser', () => {
    it('should upsert user with email and name from decoded token', async () => {
      const decodedToken: any = {
        uid: 'firebase-uid-123',
        email: 'developer@example.com',
        name: 'John Doe',
      };

      const expectedUser = {
        id: 'firebase-uid-123',
        email: 'developer@example.com',
        name: 'John Doe',
        createdAt: new Date(),
      };

      prismaService.user.upsert.mockResolvedValue(expectedUser);

      const result = await service.upsertUser(decodedToken);

      expect(prismaService.user.upsert).toHaveBeenCalledWith({
        where: { id: 'firebase-uid-123' },
        update: {
          email: 'developer@example.com',
          name: 'John Doe',
        },
        create: {
          id: 'firebase-uid-123',
          email: 'developer@example.com',
          name: 'John Doe',
        },
      });
      expect(result).toEqual(expectedUser);
    });

    it('should fallback name to email prefix if name is missing', async () => {
      const decodedToken: any = {
        uid: 'firebase-uid-456',
        email: 'jane@example.com',
      };

      prismaService.user.upsert.mockResolvedValue({
        id: 'firebase-uid-456',
        email: 'jane@example.com',
        name: 'jane',
        createdAt: new Date(),
      });

      await service.upsertUser(decodedToken);

      expect(prismaService.user.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            name: 'jane',
          }),
        }),
      );
    });
  });

  describe('verifyIdToken', () => {
    it('should throw UnauthorizedException if Firebase Admin is not initialized', async () => {
      await expect(service.verifyIdToken('any-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
