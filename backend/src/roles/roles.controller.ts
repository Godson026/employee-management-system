import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleName } from './entities/role.entity';

@UseGuards(JwtAuthGuard, RolesGuard) // Apply both guards. JWT runs first, then Roles.
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @Roles(RoleName.SYSTEM_ADMIN) // Only users with this role can access this method
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @Get()
  @Roles(RoleName.SYSTEM_ADMIN) // And this one...
  findAll() {
    return this.rolesService.findAll();
  }
  
  // Apply the same protection to the other methods (findOne, update, remove)
  @Get(':id')
  @Roles(RoleName.SYSTEM_ADMIN)
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }
  
  @Patch(':id')
  @Roles(RoleName.SYSTEM_ADMIN)
  update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.rolesService.update(id, updateRoleDto);
  }
  
  @Delete(':id')
  @Roles(RoleName.SYSTEM_ADMIN)
  remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }
}
