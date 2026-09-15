import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { PrismaService } from '../prisma/prisma.service';
import { TaskStatus } from '@prisma/client';

describe('TasksService', () => {
  let service: TasksService;
  let prisma: {
    task: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    sprint: {
      findUnique: jest.Mock;
    };
    user: {
      findUnique: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      task: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      sprint: {
        findUnique: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a task with default points and BACKLOG status', async () => {
      const mockTask = {
        id: 'task-1',
        title: 'Nueva funcionalidad',
        points: 1,
        status: TaskStatus.BACKLOG,
      };
      prisma.task.create.mockResolvedValue(mockTask);

      const result = await service.create({
        title: 'Nueva funcionalidad',
      });

      expect(prisma.task.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'Nueva funcionalidad',
            points: 1,
            status: TaskStatus.BACKLOG,
          }),
        }),
      );
      expect(result).toEqual(mockTask);
    });

    it('should throw BadRequestException if sprintId does not exist', async () => {
      prisma.sprint.findUnique.mockResolvedValue(null);

      await expect(
        service.create({
          title: 'Tarea con sprint inexistente',
          sprintId: 'invalid-sprint',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if assigneeId does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.create({
          title: 'Tarea con usuario inexistente',
          assigneeId: 'invalid-user',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateStatus', () => {
    it('should update status of an existing task', async () => {
      prisma.task.findUnique.mockResolvedValue({ id: 'task-1' });
      prisma.task.update.mockResolvedValue({
        id: 'task-1',
        status: TaskStatus.IN_PROGRESS,
      });

      const result = await service.updateStatus('task-1', {
        status: TaskStatus.IN_PROGRESS,
      });

      expect(prisma.task.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'task-1' },
          data: { status: TaskStatus.IN_PROGRESS },
        }),
      );
      expect(result.status).toBe(TaskStatus.IN_PROGRESS);
    });

    it('should throw NotFoundException if task does not exist', async () => {
      prisma.task.findUnique.mockResolvedValue(null);

      await expect(
        service.updateStatus('invalid-task', {
          status: TaskStatus.DONE,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getMetrics', () => {
    it('should compute total tasks, points, and status breakdown', async () => {
      const tasks = [
        { status: TaskStatus.TODO, points: 2 },
        { status: TaskStatus.IN_PROGRESS, points: 3 },
        { status: TaskStatus.DONE, points: 5 },
      ];
      prisma.task.findMany.mockResolvedValue(tasks);

      const metrics = await service.getMetrics();

      expect(metrics.totalTasks).toBe(3);
      expect(metrics.totalPoints).toBe(10);
      expect(metrics.completedPoints).toBe(5);
      expect(metrics.progressPercentage).toBe(50);
      expect(metrics.byStatus.DONE).toEqual({ count: 1, points: 5 });
    });
  });
});
