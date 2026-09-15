import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSprintDto } from './dto/create-sprint.dto';
import { UpdateSprintDto } from './dto/update-sprint.dto';
import type { Sprint } from '@prisma/client';

@Injectable()
export class SprintsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSprintDto): Promise<Sprint> {
    const shouldBeActive = dto.isActive ?? true;

    // Si este sprint será activo, desactivar los demás para mantener solo uno activo
    if (shouldBeActive) {
      await this.prisma.sprint.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });
    }

    return this.prisma.sprint.create({
      data: {
        name: dto.name,
        isActive: shouldBeActive,
      },
    });
  }

  async findAll() {
    return this.prisma.sprint.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { tasks: true },
        },
      },
    });
  }

  async findActive() {
    const sprint = await this.prisma.sprint.findFirst({
      where: { isActive: true },
      include: {
        tasks: {
          include: {
            assignee: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return sprint;
  }

  async findOne(id: string) {
    const sprint = await this.prisma.sprint.findUnique({
      where: { id },
      include: {
        tasks: {
          include: {
            assignee: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!sprint) {
      throw new NotFoundException(`Sprint con ID ${id} no fue encontrado`);
    }

    // Métricas del sprint
    const totalTasks = sprint.tasks.length;
    const totalPoints = sprint.tasks.reduce((sum, t) => sum + t.points, 0);
    const completedPoints = sprint.tasks
      .filter((t) => t.status === 'DONE')
      .reduce((sum, t) => sum + t.points, 0);

    return {
      ...sprint,
      metrics: {
        totalTasks,
        totalPoints,
        completedPoints,
        progressPercentage:
          totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0,
      },
    };
  }

  async update(id: string, dto: UpdateSprintDto): Promise<Sprint> {
    await this.ensureSprintExists(id);

    // Si se activa este sprint, desactivar los demás
    if (dto.isActive === true) {
      await this.prisma.sprint.updateMany({
        where: {
          isActive: true,
          id: { not: id },
        },
        data: { isActive: false },
      });
    }

    return this.prisma.sprint.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string): Promise<Sprint> {
    await this.ensureSprintExists(id);

    return this.prisma.sprint.delete({
      where: { id },
    });
  }

  private async ensureSprintExists(id: string): Promise<Sprint> {
    const sprint = await this.prisma.sprint.findUnique({ where: { id } });
    if (!sprint) {
      throw new NotFoundException(`Sprint con ID ${id} no fue encontrado`);
    }
    return sprint;
  }
}
