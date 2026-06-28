import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class DataConnectService implements OnModuleInit {
  private readonly logger = new Logger(DataConnectService.name);
  private app: admin.app.App;
  private projectId: string;
  private location: string;
  private serviceId: string;
  private connectorId: string;

  constructor(private config: ConfigService) {}

  onModuleInit() {
    this.projectId = this.config.get('FIREBASE_PROJECT_ID');
    this.location = this.config.get('DATA_CONNECT_LOCATION', 'us-central1');
    this.serviceId = this.config.get('DATA_CONNECT_SERVICE_ID', 'foratour-erp');
    this.connectorId = this.config.get('DATA_CONNECT_CONNECTOR_ID', 'foratour-erp-connector');

    const serviceAccountPath = this.config.get('FIREBASE_SERVICE_ACCOUNT_PATH');

    if (!admin.apps.length) {
      if (serviceAccountPath) {
        const serviceAccount = require(require('path').resolve(serviceAccountPath));
        this.app = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: this.projectId,
        });
      } else {
        // Usa Application Default Credentials (para Cloud Run / GCE)
        this.app = admin.initializeApp({
          credential: admin.credential.applicationDefault(),
          projectId: this.projectId,
        });
      }
    } else {
      this.app = admin.app();
    }

    this.logger.log(`Firebase Admin inicializado para proyecto: ${this.projectId}`);
  }

  private get baseUrl(): string {
    return `https://firebasedataconnect.googleapis.com/v1beta/projects/${this.projectId}/locations/${this.location}/services/${this.serviceId}/connectors/${this.connectorId}`;
  }

  private async getAccessToken(): Promise<string> {
    const token = await this.app.options.credential.getAccessToken();
    return token.access_token;
  }

  private async request<T>(endpoint: 'executeQuery' | 'executeMutation', operationName: string, variables: Record<string, any>): Promise<T> {
    let token: string;
    try {
      token = await this.getAccessToken();
    } catch (e) {
      this.logger.error(`Error obteniendo access token de Firebase Admin: ${e.message}`);
      throw e;
    }

    const url = `${this.baseUrl}:${endpoint}`;
    this.logger.debug(`${endpoint} → ${operationName} | URL: ${url}`);

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ operationName, variables }),
      });
    } catch (e) {
      this.logger.error(`Error de red al llamar a Data Connect: ${e.message}`);
      throw e;
    }

    if (!response.ok) {
      const errorBody = await response.text();
      this.logger.error(`Data Connect [${operationName}] HTTP ${response.status}: ${errorBody}`);
      throw new Error(`Data Connect error ${response.status}: ${errorBody}`);
    }

    const result = await response.json();

    if (result.errors?.length) {
      this.logger.error(`GraphQL errors en ${operationName}: ${JSON.stringify(result.errors)}`);
      throw new Error(result.errors[0].message);
    }

    return result.data as T;
  }

  async executeQuery<T = any>(operationName: string, variables: Record<string, any> = {}): Promise<T> {
    return this.request<T>('executeQuery', operationName, variables);
  }

  async executeMutation<T = any>(operationName: string, variables: Record<string, any> = {}): Promise<T> {
    return this.request<T>('executeMutation', operationName, variables);
  }
}
