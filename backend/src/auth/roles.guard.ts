import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './decorators/roles.decorator';
import { RoleName } from '../roles/entities/role.entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get the roles required for this specific route, from the @Roles decorator
    const requiredRoles = this.reflector.getAllAndOverride<RoleName[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If there are no required roles, the endpoint is public (within the scope of JwtAuthGuard)
    if (!requiredRoles) {
      return true;
    }

    // Get the user object that was attached to the request by the JwtAuthGuard
    const { user } = context.switchToHttp().getRequest();
    
    // Check if the user's roles array contains at least one of the required roles
    // The user object looks like { userId: '...', email: '...', roles: [ { name: 'Admin' } ] }
    return requiredRoles.some((role) => user.roles?.some((userRole) => userRole.name === role));
  }
}
