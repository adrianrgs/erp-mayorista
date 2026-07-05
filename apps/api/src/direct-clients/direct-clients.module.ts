import { Module } from '@nestjs/common';
import { DirectClientsController } from './direct-clients.controller';
import { DirectClientsService } from './direct-clients.service';

@Module({
  controllers: [DirectClientsController],
  providers: [DirectClientsService],
})
export class DirectClientsModule {}
