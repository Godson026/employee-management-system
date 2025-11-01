import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { User } from './entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { Employee } from '../employees/entities/employee.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, Employee]),
    ConfigModule, // For ConfigService to get backend URL
  ],
  providers: [UsersService],
  exports: [UsersService],
  controllers: [UsersController], // Export the service so AuthModule can use it
})
export class UsersModule {}
