import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { SprintsService } from './sprints.service';
import { PrismaService } from '../prisma/prisma.service';

describe('SprintsService', () => {
  let service: SprintsService;
  let prisma: {
    sprint: {
      create: jest.Mock;
      findMany: jest.Mock;
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      sprint: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SprintsService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<SprintsService>(SprintsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a sprint and deactivate others if isActive is true', async () => {
      const mockSprint = {
        id: 'sprint-1',
        name: 'Sprint 1',
        isActive: true,
        createdAt: new Date(),
      };
      prisma.sprint.updateMany.mockResolvedValue({ count: 1 });
      prisma.sprint.create.mockResolvedValue(mockSprint);

      const result = await service.create({ name: 'Sprint 1', isActive: true });

      expect(prisma.sprint.updateMany).toHaveBeenCalledWith({
        where: { isActive: true },
        data: { isActive: false },
      });
      expect(prisma.sprint.create).toHaveBeenCalledWith({
        data: { name: 'Sprint 1', isActive: true },
      });
      expect(result).toEqual(mockSprint);
    });
  });

  describe('findOne', () => {
    it('should return sprint with calculated metrics', async () => {
      const mockSprint = {
        id: 'sprint-1',
        name: 'Sprint 1',
        isActive: true,
        tasks: [
          { id: 't1', points: 3, status: 'DONE' },
          { id: 't2', points: 5, status: 'IN_PROGRESS' },
        ],
      };
      prisma.sprint.findUnique.mockResolvedValue(mockSprint);

      const result = await service.findOne('sprint-1');

      expect(result.metrics).toEqual({
        totalTasks: 2,
        totalPoints: 8,
        completedPoints: 3,
        progressPercentage: 38,
      });
    });

    it('should throw NotFoundException if sprint does not exist', async () => {
      prisma.sprint.findUnique.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('delete', () => {
    it('should delete existing sprint', async () => {
      prisma.sprint.findUnique.mockResolvedValue({ id: 'sprint-1' });
      prisma.sprint.delete.mockResolvedValue({ id: 'sprint-1' });

      const result = await service.delete('sprint-1');

      expect(prisma.sprint.delete).toHaveBeenCalledWith({
        where: { id: 'sprint-1' },
      });
      expect(result).toEqual({ id: 'sprint-1' });
    });
  });
});
