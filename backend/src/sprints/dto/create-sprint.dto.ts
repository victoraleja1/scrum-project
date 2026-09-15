import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateSprintDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre del sprint es requerido' })
  @MaxLength(100, { message: 'El nombre no puede superar los 100 caracteres' })
  name: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
