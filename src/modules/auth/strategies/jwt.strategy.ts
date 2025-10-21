import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

interface JwtPayload {
  sub: number;
  role: string | number;
  type: string;
  department?: string;
  permissions?: any;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-super-secret-jwt-key-for-crm-backend-2024',
    });
  }

  validate(payload: JwtPayload) {
    const isDebugMode = process.env.JWT_DEBUG === 'true';
    
    if (isDebugMode) {
      console.log('🔍 JWT Strategy - validate called with payload:', JSON.stringify(payload, null, 2));
    }
    
    const user = {
      id: payload.sub,
      role: payload.role,
      type: payload.type,
      ...(payload.department && { department: payload.department }),
      ...(payload.permissions && { permissions: payload.permissions }),
    };
    
    if (isDebugMode) {
      console.log('🔍 JWT Strategy - returning user:', JSON.stringify(user, null, 2));
    }
    
    return user;
  }
}
