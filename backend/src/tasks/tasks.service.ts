import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { AssignTaskDto } from './dto/assign-task.dto';
import { GetTasksFilterDto } from './dto/get-tasks-filter.dto';
import { TaskStatus } from '@prisma/client';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTaskDto) {
    if (dto.sprintId) {
      const sprint = await this.prisma.sprint.findUnique({
        where: { id: dto.sprintId },
      });
      if (!sprint) {
        throw new BadRequestException(
          `El Sprint con ID ${dto.sprintId} no existe`,
        );
      }
    }

    if (dto.assigneeId) {
      const user = await this.prisma.user.findUnique({
        where: { id: dto.assigneeId },
      });
      if (!user) {
        throw new BadRequestException(
          `El Usuario con ID ${dto.assigneeId} no existe`,
        );
      }
    }

    return this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        points: dto.points ?? 1,
        status: dto.status ?? TaskStatus.BACKLOG,
        sprintId: dto.sprintId,
        assigneeId: dto.assigneeId,
      },
      include: {
        sprint: {
          select: { id: true, name: true, isActive: true },
        },
        assignee: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async findAll(filter: GetTasksFilterDto) {
    const where: any = {};

    if (filter.sprintId !== undefined) {
      where.sprintId = filter.sprintId === 'null' ? null : filter.sprintId;
    }

    if (filter.status) {
      where.status = filter.status;
    }

    if (filter.assigneeId) {
      where.assigneeId = filter.assigneeId;
    }

    return this.prisma.task.findMany({
      where,
      include: {
        sprint: {
          select: { id: true, name: true, isActive: true },
        },
        assignee: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        sprint: {
          select: { id: true, name: true, isActive: true },
        },
        assignee: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!task) {
      throw new NotFoundException(`Tarea con ID ${id} no fue encontrada`);
    }

    return task;
  }

  async updateStatus(id: string, dto: UpdateTaskStatusDto) {
    await this.ensureTaskExists(id);

    return this.prisma.task.update({
      where: { id },
      data: { status: dto.status },
      include: {
        sprint: {
          select: { id: true, name: true, isActive: true },
        },
        assignee: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async assign(id: string, dto: AssignTaskDto) {
    await this.ensureTaskExists(id);

    if (dto.assigneeId) {
      const user = await this.prisma.user.findUnique({
        where: { id: dto.assigneeId },
      });
      if (!user) {
        throw new BadRequestException(
          `El usuario con ID ${dto.assigneeId} no existe`,
        );
      }
    }

    return this.prisma.task.update({
      where: { id },
      data: { assigneeId: dto.assigneeId ?? null },
      include: {
        sprint: {
          select: { id: true, name: true, isActive: true },
        },
        assignee: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async update(id: string, dto: UpdateTaskDto) {
    await this.ensureTaskExists(id);

    if (dto.sprintId) {
      const sprint = await this.prisma.sprint.findUnique({
        where: { id: dto.sprintId },
      });
      if (!sprint) {
        throw new BadRequestException(
          `El Sprint con ID ${dto.sprintId} no existe`,
        );
      }
    }

    if (dto.assigneeId) {
      const user = await this.prisma.user.findUnique({
        where: { id: dto.assigneeId },
      });
      if (!user) {
        throw new BadRequestException(
          `El usuario con ID ${dto.assigneeId} no existe`,
        );
      }
    }

    return this.prisma.task.update({
      where: { id },
      data: dto,
      include: {
        sprint: {
          select: { id: true, name: true, isActive: true },
        },
        assignee: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async delete(id: string) {
    await this.ensureTaskExists(id);

    return this.prisma.task.delete({
      where: { id },
    });
  }

  async getMetrics(sprintId?: string) {
    const where: any = {};
    if (sprintId) {
      where.sprintId = sprintId;
    }

    const tasks = await this.prisma.task.findMany({ where });

    const totalTasks = tasks.length;
    const totalPoints = tasks.reduce((sum, t) => sum + t.points, 0);

    const byStatus = {
      BACKLOG: { count: 0, points: 0 },
      TODO: { count: 0, points: 0 },
      IN_PROGRESS: { count: 0, points: 0 },
      DONE: { count: 0, points: 0 },
    };

    for (const t of tasks) {
      if (byStatus[t.status]) {
        byStatus[t.status].count += 1;
        byStatus[t.status].points += t.points;
      }
    }

    const completedPoints = byStatus.DONE.points;
    const progressPercentage =
      totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;

    return {
      totalTasks,
      totalPoints,
      completedPoints,
      progressPercentage,
      byStatus,
    };
  }

  private async ensureTaskExists(id: string) {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) {
      throw new NotFoundException(`Tarea con ID ${id} no fue encontrada`);
    }
    return task;
  }
}
