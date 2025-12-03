import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtConfigService } from '../../../config/jwt.config';

interface JwtPayload {
  sub: number;
  role: string | number;
  type: string;
  department?: string;
  permissions?: any;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private jwtConfig: JwtConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConfig.getSecret(),
    });
  }

  validate(payload: JwtPayload) {
    const isDebugMode = this.jwtConfig.isDebugMode();

    if (isDebugMode) {
      console.log(
        '🔍 JWT Strategy - validate called with payload:',
        JSON.stringify(payload, null, 2),
      );
    }

    const user = {
      id: payload.sub,
      role: payload.role,
      type: payload.type,
      ...(payload.department && { department: payload.department }),
      ...(payload.permissions && { permissions: payload.permissions }),
    };

    if (isDebugMode) {
      console.log(
        '🔍 JWT Strategy - returning user:',
        JSON.stringify(user, null, 2),
      );
    }

    return user;
  }
}
