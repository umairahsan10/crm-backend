import { Module } from '@nestjs/common';
import { MarketingController } from './controllers/marketing.controller';
import { MarketingService } from './services/marketing.service';

@Module({
  imports: [],
  controllers: [MarketingController],
  providers: [MarketingService],
  exports: [MarketingService],
})
export class MarketingModule {}
