import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class KioskService {
    constructor(private jwtService: JwtService) {}

    generateKioskToken(): { kiosk_token: string } {
        const payload = { type: 'kiosk-access' };
        const token = this.jwtService.sign(payload, { expiresIn: '2m' }); // This token is only valid for 2 minutes
        return { kiosk_token: token };
    }

    validateKioskToken(token: string): boolean {
        try {
            const payload = this.jwtService.verify(token);
            return payload.type === 'kiosk-access';
        } catch (error) {
            return false;
        }
    }
}