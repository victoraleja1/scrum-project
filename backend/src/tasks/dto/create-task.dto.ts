import { TaskStatus } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty({ message: 'El título de la tarea es obligatorio' })
  @MaxLength(150, { message: 'El título no puede exceder los 150 caracteres' })
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt({ message: 'Los puntos deben ser un número entero' })
  @Min(1, { message: 'El puntaje mínimo es 1' })
  @Max(21, { message: 'El puntaje máximo en la escala Scrum es 21' })
  points?: number;

  @IsOptional()
  @IsEnum(TaskStatus, {
    message: 'El estado debe ser BACKLOG, TODO, IN_PROGRESS o DONE',
  })
  status?: TaskStatus;

  @IsOptional()
  @IsString()
  sprintId?: string;

  @IsOptional()
  @IsString()
  assigneeId?: string;
}
