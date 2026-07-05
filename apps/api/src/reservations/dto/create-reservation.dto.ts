import { IsString, IsNumber, IsOptional, IsArray, IsEnum } from 'class-validator';

export class CreateReservationDto {
  @IsString()
  id: string;

  @IsString()
  holder: string;

  @IsString()
  hotelName: string;

  @IsString()
  checkIn: string;

  @IsString()
  checkOut: string;

  @IsNumber()
  pax: number;

  @IsEnum(['Confirmada', 'Pendiente de Pago', 'Modificada', 'Cancelada', 'Petición Especial'])
  status: string;

  @IsNumber()
  totalPrice: number;

  @IsNumber()
  netPrice: number;

  @IsOptional()
  @IsString()
  agenciaName?: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsEnum(['NACIONAL', 'INTERNACIONAL'])
  mercado?: string;

  @IsOptional()
  @IsEnum(['Cotización', 'Reserva Real'])
  tipo?: string;

  @IsOptional()
  @IsEnum(['Crédito', 'Pago Contado'])
  facturacionTipo?: string;

  @IsOptional()
  @IsString()
  specialRequests?: string;

  @IsOptional()
  @IsArray()
  servicios?: any[];

  @IsOptional()
  @IsArray()
  pasajeros?: any[];

  @IsOptional()
  @IsEnum(['B2B', 'Directo'])
  canalVenta?: string;

  @IsOptional()
  @IsString()
  localizadorProveedor?: string;
}
