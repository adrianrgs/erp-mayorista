import { Module } from '@nestjs/common';
import { AutorizacionesController } from './autorizaciones.controller';
import { AutorizacionesService } from './autorizaciones.service';

@Module({
  controllers: [AutorizacionesController],
  providers: [AutorizacionesService],
})
export class AutorizacionesModule {}
