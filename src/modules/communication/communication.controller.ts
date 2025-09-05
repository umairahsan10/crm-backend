import { Controller } from '@nestjs/common';
import { CommunicationService } from './communication.service';

@Controller('communication')
export class CommunicationController {
  constructor(private readonly communicationService: CommunicationService) {}

  // General communication methods can be added here
  // Project chat methods have been moved to ProjectChatsController
}