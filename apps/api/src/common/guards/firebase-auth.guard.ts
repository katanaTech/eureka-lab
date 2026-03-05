import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { FirebaseService } from '../../infrastructure/firebase/firebase.service';
import type { AuthenticatedUser } from '../decorators/current-user.decorator';

/**
 * Guard that verifies Firebase ID tokens on protected endpoints.
 * Extracts the Bearer token from the Authorization header,
 * verifies it with Firebase Admin, and attaches the decoded user to the request.
 */
@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  private readonly logger = new Logger(FirebaseAuthGuard.name);

  constructor(private readonly firebaseService: FirebaseService) {}

  /**
   * Verify the Firebase ID token and attach user to request.
   * @param context - Execution context
   * @returns True if token is valid
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException({
        message: 'Missing or invalid authorization header',
        code: 'TOKEN_MISSING',
      });
    }

    const token = authHeader.slice(7);

    try {
      const decoded = await this.firebaseService.auth.verifyIdToken(token);

      const user: AuthenticatedUser = {
        uid: decoded.uid,
        email: decoded.email ?? '',
        role: (decoded['role'] as string) ?? 'parent',
      };

      (request as FastifyRequest & { user: AuthenticatedUser }).user = user;
      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Token verification failed';
      this.logger.warn({ event: 'auth_failed', message });
      throw new UnauthorizedException({
        message: 'Invalid or expired token',
        code: 'TOKEN_INVALID',
      });
    }
  }
}
