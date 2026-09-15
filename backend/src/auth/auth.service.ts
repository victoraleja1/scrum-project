import {
  Injectable,
  Logger,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth, DecodedIdToken } from 'firebase-admin/auth';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    if (getApps().length > 0) {
      return;
    }

    const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
    const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');
    const rawPrivateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY');

    if (projectId && clientEmail && rawPrivateKey) {
      const privateKey = this.formatPrivateKey(rawPrivateKey);

      try {
        initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });

        this.logger.log('Firebase Admin SDK initialized successfully.');
      } catch (error: any) {
        this.logger.error(
          `Failed to initialize Firebase Admin SDK: ${error?.message || error}`,
        );
      }
    } else {
      this.logger.warn(
        'Firebase Admin credentials not provided in .env. Authentication requests will fail until configured.',
      );
    }
  }

  private formatPrivateKey(key: string): string {
    let sanitized = key.trim();
    if (sanitized.endsWith(',')) {
      sanitized = sanitized.slice(0, -1).trim();
    }
    if (
      (sanitized.startsWith('"') && sanitized.endsWith('"')) ||
      (sanitized.startsWith("'") && sanitized.endsWith("'"))
    ) {
      sanitized = sanitized.slice(1, -1);
    }
    return sanitized.replace(/\\n/g, '\n');
  }

  async verifyIdToken(token: string): Promise<DecodedIdToken> {
    if (getApps().length === 0) {
      throw new UnauthorizedException(
        'Firebase Admin SDK is not initialized. Please verify your environment variables.',
      );
    }

    try {
      return await getAuth().verifyIdToken(token);
    } catch (error: any) {
      this.logger.error(`Error verifying Firebase ID token: ${error?.message || error}`);
      throw new UnauthorizedException('Invalid or expired Firebase ID token');
    }
  }

  async upsertUser(decodedToken: DecodedIdToken): Promise<User> {
    const email =
      decodedToken.email || `${decodedToken.uid}@users.scrumproject.local`;
    const name =
      decodedToken.name ||
      decodedToken.email?.split('@')[0] ||
      'Scrum User';

    return this.prisma.user.upsert({
      where: { id: decodedToken.uid },
      update: {
        email,
        name,
      },
      create: {
        id: decodedToken.uid,
        email,
        name,
      },
    });
  }

  async validateTokenAndSyncUser(token: string): Promise<User> {
    const decodedToken = await this.verifyIdToken(token);
    return this.upsertUser(decodedToken);
  }
}
