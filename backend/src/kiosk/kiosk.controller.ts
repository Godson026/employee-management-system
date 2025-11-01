import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleName } from '../roles/entities/role.entity';
import { KioskService } from './kiosk.service';

@UseGuards(JwtAuthGuard)
@Controller('kiosk')
export class KioskController {
    constructor(private readonly kioskService: KioskService) {}

    @Get('generate-token')
    @Roles(RoleName.SYSTEM_ADMIN, RoleName.HR_MANAGER, RoleName.BRANCH_MANAGER)
    generateToken() {
        return this.kioskService.generateKioskToken();
    }

    @Get('mode')
    @Roles(RoleName.SYSTEM_ADMIN, RoleName.HR_MANAGER, RoleName.BRANCH_MANAGER)
    getKioskMode() {
        const currentHour = new Date().getHours();
        
        // Before 4 PM (16:00): Clock-In mode
        // After 4 PM (16:00): Clock-Out mode
        const mode = currentHour < 16 ? 'CLOCK_IN' : 'CLOCK_OUT';
        
        return {
            mode,
            currentHour,
            message: mode === 'CLOCK_IN' 
                ? 'Clock-In Mode (Before 4:00 PM)' 
                : 'Clock-Out Mode (After 4:00 PM)'
        };
    }
}