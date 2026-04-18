import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
  } from '@nestjs/common'
  import { LocationsService } from 'src/locations/locations.service'
  
  @Injectable()
  export class OwnershipGuard implements CanActivate {
    constructor(private locationsService: LocationsService) {}
  
    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest()
      const user = request.user
      const locationId = request.params.id
  
      // 🔥 1. ADMIN BYPASS
      if (user.roles?.includes('admin')) {
        return true
      }
  
      // 🔹 2. Buscar location
      const location = await this.locationsService.findOne(locationId)
  
      const isOwner = location.owners.some(
        (owner) => owner.user.id === user.userId,
      )
  
      if (!isOwner) {
        throw new ForbiddenException('You are not the owner')
      }
  
      return true
    }
  }