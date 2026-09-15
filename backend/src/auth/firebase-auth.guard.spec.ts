import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FirebaseAuthGuard } from './firebase-auth.guard';
import { AuthService } from './auth.service';

describe('FirebaseAuthGuard', () => {
  let guard: FirebaseAuthGuard;
  let authService: { validateTokenAndSyncUser: jest.Mock };
  let reflector: { getAllAndOverride: jest.Mock };

  beforeEach(() => {
    authService = {
      validateTokenAndSyncUser: jest.fn(),
    };
    reflector = {
      getAllAndOverride: jest.fn(),
    };
    guard = new FirebaseAuthGuard(
      authService as unknown as AuthService,
      reflector as unknown as Reflector,
    );
  });

  const createMockContext = (headers: Record<string, string> = {}): {
    context: ExecutionContext;
    request: any;
  } => {
    const request: any = { headers };
    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
    return { context, request };
  };

  it('should allow access if route is decorated with @Public()', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    const { context } = createMockContext();

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(authService.validateTokenAndSyncUser).not.toHaveBeenCalled();
  });

  it('should throw UnauthorizedException if Authorization header is missing', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const { context } = createMockContext({});

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException(
        'Bearer token missing in Authorization header',
      ),
    );
  });

  it('should throw UnauthorizedException if token is not a Bearer token', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const { context } = createMockContext({
      authorization: 'Basic dXNlcjpwYXNz',
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException(
        'Bearer token missing in Authorization header',
      ),
    );
  });

  it('should validate token, attach user to request and return true', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const mockUser = {
      id: 'uid-123',
      email: 'dev@example.com',
      name: 'Dev User',
      createdAt: new Date(),
    };
    authService.validateTokenAndSyncUser.mockResolvedValue(mockUser);

    const { context, request } = createMockContext({
      authorization: 'Bearer valid-id-token-xyz',
    });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(authService.validateTokenAndSyncUser).toHaveBeenCalledWith(
      'valid-id-token-xyz',
    );
    expect(request.user).toEqual(mockUser);
  });

  it('should rethrow UnauthorizedException when token validation fails', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    authService.validateTokenAndSyncUser.mockRejectedValue(
      new UnauthorizedException('Invalid or expired Firebase ID token'),
    );

    const { context } = createMockContext({
      authorization: 'Bearer expired-token',
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
