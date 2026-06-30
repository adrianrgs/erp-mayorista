import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SharedModule } from './shared/shared.module';
import { AuthModule } from './auth/auth.module';
import { ReservationsModule } from './reservations/reservations.module';
import { ClientsModule } from './clients/clients.module';
import { PropertiesModule } from './properties/properties.module';
import { FlightsModule } from './flights/flights.module';
import { FinancesModule } from './finances/finances.module';
import { OperationsModule } from './operations/operations.module';
import { TransfersModule } from './transfers/transfers.module';
import { ServicesModule } from './services-module/services.module';
import { ProveedoresModule } from './proveedores/proveedores.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SharedModule,
    AuthModule,
    ReservationsModule,
    ClientsModule,
    PropertiesModule,
    FlightsModule,
    FinancesModule,
    OperationsModule,
    TransfersModule,
    ServicesModule,
    ProveedoresModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
