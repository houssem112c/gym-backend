import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { XpAction } from '@prisma/client';
import { GamificationService } from '../gamification/gamification.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { createHash, randomBytes } from 'crypto';
import { RequestPasswordResetDto, ResetPasswordDto } from './dto/auth.dto';
import { authenticator } from 'otplib';
import * as nodemailer from 'nodemailer';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private gamificationService: GamificationService,
  ) { }

  async register(registerDto: RegisterDto) {
    const { email, password, name } = registerDto;

    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new UnauthorizedException('User already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const verificationToken = randomBytes(32).toString('hex');
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        emailVerifiedAt: null,
        emailVerificationTokenHash: createHash('sha256').update(verificationToken).digest('hex'),
        emailVerificationExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email);

    // Store refresh token
    await this.updateRefreshToken(user.id, tokens.refreshToken);
    await this.sendEmail(
      user.email,
      'Verify your Gym SaaS email',
      `Verify your email with this token: ${verificationToken}`,
    );

    return {
      ...tokens,
      ...(this.configService.get('NODE_ENV') !== 'production'
        ? { emailVerificationToken: verificationToken }
        : {}),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
        phone: user.phone,
        trainingFrequency: user.trainingFrequency,
        trainingDays: user.trainingDays,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (user.isActive === false) {
      throw new UnauthorizedException('Account is suspended');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (user.role === 'ADMIN' && user.mfaEnabled) {
      if (!loginDto.otp || !authenticator.verify({ token: loginDto.otp, secret: user.mfaSecret || '' })) {
        throw new UnauthorizedException('MFA code required');
      }
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email);

    // Store refresh token
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    // Update login streak and award XP
    await this.gamificationService.updateLoginStreak(user.id);

    return {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
        phone: user.phone,
        trainingFrequency: user.trainingFrequency,
        trainingDays: user.trainingDays,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }

  async validateUser(userId: string) {
    if (!userId) {
      throw new UnauthorizedException('Invalid token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });

    if (user && !user.isActive) {
      throw new UnauthorizedException('Account is suspended');
    }

    return user;
  }

  async refreshTokens(refreshToken: string) {
    let payload;
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch (e) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const userId = payload.sub;
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        refreshToken: true,
      },
    });

    if (!user || user.isActive === false || !user.refreshToken) {
      throw new UnauthorizedException('Access Denied');
    }

    const refreshTokenMatches = await bcrypt.compare(
      refreshToken,
      user.refreshToken,
    );

    if (!refreshTokenMatches) {
      throw new UnauthorizedException('Access Denied');
    }

    const tokens = await this.generateTokens(user.id, user.email);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }

  async requestPasswordReset(dto: RequestPasswordResetDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) return { message: 'If the account exists, reset instructions will be sent.' };

    const token = randomBytes(32).toString('hex');
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetTokenHash: createHash('sha256').update(token).digest('hex'),
        passwordResetExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
    await this.sendEmail(
      user.email,
      'Reset your Gym SaaS password',
      `Reset your password with this token: ${token}`,
    );

    return {
      message: 'If the account exists, reset instructions will be sent.',
      ...(this.configService.get('NODE_ENV') !== 'production' ? { resetToken: token } : {}),
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = createHash('sha256').update(dto.token).digest('hex');
    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: { gt: new Date() },
      },
    });
    if (!user) throw new UnauthorizedException('Invalid or expired reset token');

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: await bcrypt.hash(dto.password, 10),
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
        refreshToken: null,
      },
    });
    return { message: 'Password reset successfully' };
  }

  async verifyEmail(token: string) {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const user = await this.prisma.user.findFirst({
      where: { emailVerificationTokenHash: tokenHash, emailVerificationExpiresAt: { gt: new Date() } },
    });
    if (!user) throw new UnauthorizedException('Invalid or expired verification token');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerifiedAt: new Date(), emailVerificationTokenHash: null, emailVerificationExpiresAt: null },
    });
    return { message: 'Email verified successfully' };
  }

  async setupMfa(userId: string) {
    const secret = authenticator.generateSecret();
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');
    await this.prisma.user.update({ where: { id: userId }, data: { mfaSecret: secret, mfaEnabled: false } });
    return {
      secret,
      otpauthUrl: authenticator.keyuri(user.email, 'Gym SaaS', secret),
    };
  }

  async enableMfa(userId: string, token: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.mfaSecret || !authenticator.verify({ token, secret: user.mfaSecret })) {
      throw new UnauthorizedException('Invalid MFA code');
    }
    await this.prisma.user.update({ where: { id: userId }, data: { mfaEnabled: true } });
    return { enabled: true };
  }

  private async sendEmail(to: string, subject: string, text: string) {
    const host = this.configService.get<string>('SMTP_HOST');
    const user = this.configService.get<string>('SMTP_USER');
    const password = this.configService.get<string>('SMTP_PASSWORD');
    const from = this.configService.get<string>('SMTP_FROM') || user;
    if (!host || !user || !password || !from) {
      this.logger.warn(`Email delivery is not configured; message for ${to} was not sent`);
      return;
    }

    const transport = nodemailer.createTransport({
      host,
      port: Number(this.configService.get<string>('SMTP_PORT', '587')),
      secure: Number(this.configService.get<string>('SMTP_PORT', '587')) === 465,
      auth: { user, pass: password },
    });
    await transport.sendMail({ from, to, subject, text });
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION', '7d'),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  private async updateRefreshToken(userId: string, refreshToken: string) {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashedRefreshToken },
    });
  }

  // Get user profile
  async getProfile(userId: string) {
    const user = await (this.prisma.user as any).findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        avatar: true,
        bio: true,
        phone: true,
        dateOfBirth: true,
        address: true,
        city: true,
        country: true,
        trainingFrequency: true,
        trainingDays: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  // Update user profile
  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const updatedUser = await (this.prisma.user as any).update({
      where: { id: userId },
      data: {
        ...updateProfileDto,
        dateOfBirth: updateProfileDto.dateOfBirth
          ? new Date(updateProfileDto.dateOfBirth)
          : undefined,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        avatar: true,
        bio: true,
        phone: true,
        dateOfBirth: true,
        address: true,
        city: true,
        country: true,
        trainingFrequency: true,
        trainingDays: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Award XP for profile update (once per day or simply award it)
    await this.gamificationService.awardXp(userId, XpAction.PROFILE_UPDATED, 5);

    return updatedUser;
  }
}
