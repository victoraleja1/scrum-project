import { TaskStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateTaskStatusDto {
  @IsNotEmpty({ message: 'El nuevo estado es requerido' })
  @IsEnum(TaskStatus, {
    message: 'El estado debe ser BACKLOG, TODO, IN_PROGRESS o DONE',
  })
  status: TaskStatus;
}
