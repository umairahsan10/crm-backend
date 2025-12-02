import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { DatabaseModule } from '../src/database/database.module';

@Global()
@Module({
  imports: [DatabaseModule], // Import DatabaseModule to provide DatabaseConfigService
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}

