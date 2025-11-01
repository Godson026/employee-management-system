import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ScheduleModule } from '@nestjs/schedule';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DepartmentsModule } from './departments/departments.module';
import { BranchesModule } from './branches/branches.module';
import { EmployeesModule } from './employees/employees.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { LeavesModule } from './leaves/leaves.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AttendanceModule } from './attendance/attendance.module';
import { KioskModule } from './kiosk/kiosk.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AnnouncementsModule } from './announcements/announcements.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        // Support both DATABASE_URL (Railway format) and individual variables
        const databaseUrl = configService.get<string>('DATABASE_URL');
        
        // Allow synchronize if explicitly enabled via env var, or if not in production
        const enableSynchronize = configService.get<string>('DB_SYNCHRONIZE') === 'true' || 
                                  configService.get<string>('NODE_ENV') !== 'production';
        
        if (databaseUrl) {
          // Parse DATABASE_URL format: postgresql://user:password@host:port/database
          return {
            type: 'postgres' as const,
            url: databaseUrl,
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
            synchronize: enableSynchronize,
            ssl: configService.get<string>('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
          };
        }
        
        // Fallback to individual connection parameters
        const config = {
          type: 'postgres' as const,
          host: configService.get<string>('DB_HOST') || 'localhost',
          port: parseInt(configService.get<string>('DB_PORT') || '5432', 10),
          username: configService.get<string>('DB_USERNAME') || 'postgres',
          password: String(configService.get<string>('DB_PASSWORD') || 'Godson053'),
          database: configService.get<string>('DB_DATABASE') || 'ems_db',
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: enableSynchronize,
          ssl: configService.get<string>('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
        };
        
        console.log('Database connection config:', {
          ...config,
          password: config.password ? '[HIDDEN]' : '[EMPTY]',
          url: databaseUrl ? '[USING DATABASE_URL]' : undefined,
        });
        
        return config;
      },
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    DepartmentsModule,
    BranchesModule,
    EmployeesModule,
    AuthModule,
    UsersModule,
    RolesModule,
    LeavesModule,
    DashboardModule,
    AttendanceModule,
    KioskModule,
    NotificationsModule,
    AnnouncementsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}