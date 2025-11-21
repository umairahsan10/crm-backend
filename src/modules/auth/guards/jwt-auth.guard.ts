import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly isDebugMode = process.env.JWT_DEBUG === 'true';

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    
    if (this.isDebugMode) {
      console.log('🔍 JWT Guard - canActivate called');
      console.log('🔍 JWT Guard - Authorization header:', authHeader ? `${authHeader.substring(0, 20)}...` : 'MISSING');
    }
    
    // Check if authorization header exists
    if (!authHeader) {
      if (this.isDebugMode) {
        console.log('❌ JWT Guard - No authorization header found');
      }
      throw new UnauthorizedException('No authorization token provided');
    }
    
    // Check if it starts with 'Bearer '
    if (!authHeader.startsWith('Bearer ')) {
      if (this.isDebugMode) {
        console.log('❌ JWT Guard - Authorization header does not start with "Bearer "');
      }
      throw new UnauthorizedException('Invalid authorization header format. Expected "Bearer <token>"');
    }
    
    const token = authHeader.substring(7);
    
    // Check if token exists after 'Bearer '
    if (!token || token.trim() === '') {
      if (this.isDebugMode) {
        console.log('❌ JWT Guard - Token is empty after "Bearer " prefix');
      }
      throw new UnauthorizedException('Token is empty');
    }
    
    // Check if token has the correct JWT format (3 parts separated by dots)
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      if (this.isDebugMode) {
        console.log('❌ JWT Guard - Token does not have 3 parts (malformed JWT)');
        console.log('🔍 JWT Guard - Token parts count:', tokenParts.length);
        console.log('🔍 JWT Guard - Token preview:', token.substring(0, 50) + '...');
      }
      throw new UnauthorizedException('Malformed JWT token. Expected format: header.payload.signature');
    }
    
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (this.isDebugMode) {
      console.log('🔍 JWT Guard - handleRequest called');
      console.log('🔍 JWT Guard - err:', err);
      console.log('🔍 JWT Guard - user:', user);
      console.log('🔍 JWT Guard - info:', info);
    }
    
    if (err || !user) {
      if (this.isDebugMode) {
        console.log('🔍 JWT Guard - Authentication failed');
      }
      
      // Provide more specific error messages
      if (info?.name === 'JsonWebTokenError') {
        throw new UnauthorizedException(`Invalid token: ${info.message}`);
      }
      if (info?.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token has expired');
      }
      
      throw err || new UnauthorizedException('Authentication failed');
    }
    
    if (this.isDebugMode) {
      console.log('🔍 JWT Guard - Authentication successful, user:', user);
    }
    return user;
  }
}
