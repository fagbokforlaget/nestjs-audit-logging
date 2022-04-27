import {
  applyDecorators,
  SetMetadata,
  Type,
  UseInterceptors,
} from '@nestjs/common';
import {
  ActionVerb,
  AuditLogOptions,
  PII,
} from '@fagbokforlaget/audit-logging';
import { AuditLoggingInterceptor } from './audit-logging.interceptor';
import { MetadataKey } from './audit-logging.interfaces';

export interface AuditLoggerParams {
  actorIdGetter: (req: any) => string;
  objectIdGetter: (req: any) => string;
  errorTypes?: Type<any>[];
  action: ActionVerb;
  pii?: PII[];
  eventSubject: string;
  overrides?: Partial<AuditLogOptions>;
}

export const AuditLogger = (params: AuditLoggerParams) =>
  applyDecorators(
    SetMetadata(MetadataKey.AuditParams, params),
    UseInterceptors(AuditLoggingInterceptor),
  );
