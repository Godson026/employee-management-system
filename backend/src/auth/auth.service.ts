// in auth.service.ts
import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { EmailService } from '../email/email.service';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async validateUser(email: string, pass: string): Promise<User | null> {
    const user = await this.usersService.findUserForAuth({ email });
    if (user && await user.validatePassword(pass)) {
      return user;
    }
    return null;
  }

  login(user: User) {
    const payload = {
        sub: user.id, // User ID
        employeeId: user.employee.id,
        roles: user.roles, // Pass full role objects
        token_version: user.token_version,
    };
    return { access_token: this.jwtService.sign(payload) };
  }

  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const user = await this.usersService.findUserForAuth({ email });
    
    // Don't reveal if user exists or not for security
    if (!user) {
      // Still return success to prevent email enumeration
      return { message: 'If an account exists with this email, a password reset link has been sent.' };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date();
    resetTokenExpires.setMinutes(resetTokenExpires.getMinutes() + 30); // Token expires in 30 minutes

    // Save token to user
    user.reset_token = resetToken;
    user.reset_token_expires = resetTokenExpires;
    await this.userRepository.save(user);

    // Send email with personalized greeting
    try {
      // Extract first name from employee if available, otherwise use email prefix or 'there'
      let firstName = 'there';
      if (user.employee?.first_name) {
        firstName = user.employee.first_name;
      } else if (email) {
        // Fallback: extract name from email (before @)
        const emailPrefix = email.split('@')[0];
        firstName = emailPrefix.split('.')[0] || emailPrefix;
        // Capitalize first letter
        firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1);
      }
      await this.emailService.sendPasswordResetEmail(user.email, resetToken, firstName);
    } catch (error) {
      // Log error but don't fail the request
      console.error('Failed to send password reset email:', error);
    }

    return { message: 'If an account exists with this email, a password reset link has been sent.' };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { reset_token: token },
    });

    if (!user) {
      throw new NotFoundException('Invalid or expired reset token.');
    }

    if (!user.reset_token_expires || user.reset_token_expires < new Date()) {
      throw new BadRequestException('Reset token has expired. Please request a new one.');
    }

    // Update password
    user.password = newPassword;
    user.reset_token = null;
    user.reset_token_expires = null;
    user.token_version = user.token_version + 1; // Invalidate existing sessions

    // Use the entity's BeforeInsert hook to hash the password
    // Since we're updating, we need to hash it manually
    const bcrypt = require('bcrypt');
    user.password = await bcrypt.hash(newPassword, 10);

    await this.userRepository.save(user);

    return { message: 'Password has been reset successfully. You can now login with your new password.' };
  }
}