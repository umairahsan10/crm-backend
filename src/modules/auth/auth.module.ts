import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '../auth/strategies/jwt.strategy';
import { PrismaService } from '../../../prisma/prisma.service';
import { JwtConfigService } from '../../config/jwt.config';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [JwtConfigService],
      useFactory: (jwtConfig: JwtConfigService) => ({
        secret: jwtConfig.getSecret(),
        signOptions: { expiresIn: jwtConfig.getExpiresIn() },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
