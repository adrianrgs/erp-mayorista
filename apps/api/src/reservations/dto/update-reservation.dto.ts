import { IsString, IsNumber, IsOptional, IsArray, IsEnum, IsBoolean } from 'class-validator';

export class UpdateReservationDto {
  @IsOptional()
  @IsString()
  holder?: string;

  @IsOptional()
  @IsString()
  hotelName?: string;

  @IsOptional()
  @IsString()
  checkIn?: string;

  @IsOptional()
  @IsString()
  checkOut?: string;

  @IsOptional()
  @IsNumber()
  pax?: number;

  @IsOptional()
  @IsEnum(['Confirmada', 'Pendiente', 'Pendiente de Pago', 'Modificada', 'Cancelada', 'Petición Especial'])
  status?: string;

  @IsOptional()
  @IsNumber()
  totalPrice?: number;

  @IsOptional()
  @IsNumber()
  netPrice?: number;

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
  variaciones?: any[];

  @IsOptional()
  @IsArray()
  pasajeros?: any[];

  @IsOptional()
  @IsEnum(['B2B', 'Directo'])
  canalVenta?: string;

  @IsOptional()
  @IsString()
  clienteDirectoId?: string;

  @IsOptional()
  @IsString()
  localizadorProveedor?: string;

  // Contexto para reconciliación financiera
  @IsOptional()
  previousState?: any;
}
