import { IsString, IsOptional } from 'class-validator';

export class LoginDto {
  // Identificador: nombre de usuario (o email como fallback de compatibilidad)
  @IsString()
  @IsOptional()
  username?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  password: string;
}
