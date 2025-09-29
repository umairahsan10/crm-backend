import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    console.log('🔍 JWT Guard - canActivate called');
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    console.log('🔍 JWT Guard - handleRequest called');
    console.log('🔍 JWT Guard - err:', err);
    console.log('🔍 JWT Guard - user:', user);
    console.log('🔍 JWT Guard - info:', info);
    
    if (err || !user) {
      console.log('🔍 JWT Guard - Authentication failed');
      throw err || new Error('Authentication failed');
    }
    
    console.log('🔍 JWT Guard - Authentication successful, user:', user);
    return user;
  }
}
