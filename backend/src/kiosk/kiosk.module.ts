import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { KioskController } from './kiosk.controller';
import { KioskService } from './kiosk.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '2m' }, // Short expiration for kiosk tokens
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [KioskController],
  providers: [KioskService],
  exports: [KioskService] // Export the service so other modules can use it
})
export class KioskModule {}
