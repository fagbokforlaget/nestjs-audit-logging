import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Outcome, BaseAuditLogger } from '@fagbokforlaget/audit-logging';
import { MetadataKey } from './audit-logging.interfaces';
import { AuditLoggerParams } from './audit-logging.decorator';

@Injectable()
export class AuditLoggingInterceptor implements NestInterceptor {
  constructor(
    @Inject(BaseAuditLogger) private auditLog: BaseAuditLogger,
    private reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const auditLogOpts = this.reflector.get<AuditLoggerParams>(
      MetadataKey.AuditParams,
      context.getHandler(),
    );

    return next.handle().pipe(
      catchError((err) => {
        const errorHandler = auditLogOpts.errorTypes.filter(
          (eh) => err instanceof eh,
        )[0];
        if (errorHandler) {
          this.auditLog.log(
            { ...auditLogOpts, outcome: Outcome.FAILURE },
            request,
          );
        }
        throw err;
      }),
      tap(() => {
        this.auditLog.log(
          { ...auditLogOpts, outcome: Outcome.SUCCESS },
          request,
        );
      }),
    );
  }
}
