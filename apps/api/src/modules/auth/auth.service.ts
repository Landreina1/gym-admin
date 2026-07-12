import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { UpdateMeDto, ChangePasswordDto } from './dto/update-me.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const identifier = (dto.username ?? dto.email ?? '').trim();
    if (!identifier) throw new UnauthorizedException('Credenciales inválidas');

    const user = await this.prisma.adminUser.findFirst({
      where: { OR: [{ username: identifier }, { email: identifier }] },
    });
    if (!user || !user.isActive) throw new UnauthorizedException('Credenciales inválidas');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Credenciales inválidas');

    const token = this.jwt.sign({
      sub: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      role: user.role,
    });

    return {
      token,
      user: { id: user.id, email: user.email, username: user.username, name: user.name, role: user.role },
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.adminUser.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    const { password: _, ...safe } = user;
    return safe;
  }

  async updateMe(userId: string, dto: UpdateMeDto) {
    if (dto.email) {
      const existing = await this.prisma.adminUser.findUnique({ where: { email: dto.email } });
      if (existing && existing.id !== userId) throw new ConflictException('El email ya está en uso');
    }
    const user = await this.prisma.adminUser.update({
      where: { id: userId },
      data: dto,
    });
    const { password: _, ...safe } = user;
    return safe;
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.adminUser.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();

    const valid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!valid) throw new UnauthorizedException('Contraseña actual incorrecta');

    const hash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.adminUser.update({ where: { id: userId }, data: { password: hash } });
    return { message: 'Contraseña actualizada' };
  }
}
