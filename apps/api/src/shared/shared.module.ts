import { Module, Global } from '@nestjs/common';
import { DataConnectService } from './dataconnect/dataconnect.service';
import { FinancialReconcilerService } from './financial-reconciler.service';
import { PnrParserService } from './pnr-parser.service';

@Global()
@Module({
  providers: [DataConnectService, FinancialReconcilerService, PnrParserService],
  exports: [DataConnectService, FinancialReconcilerService, PnrParserService],
})
export class SharedModule {}
