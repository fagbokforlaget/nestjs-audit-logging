import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import {
  ActionType,
  ActorType,
  ObjectType,
  ServiceType,
  AuditLog,
  BaseAuditLogger,
  Transport,
} from '@forlagshuset/audit-logging';
import { TestErrorHandler } from './error.handler';
import { AuditLoggingInterceptor } from '../src/audit-logging.interceptor';
import { TestController } from './test.controller';

class TestLoggerTransport implements Transport {
  log(): any | Promise<any> {
    return;
  }
}

describe('AuditLog (e2e)', () => {
  let app: INestApplication;
  let interceptor: AuditLoggingInterceptor;
  let auditLog: AuditLog;
  let baseAuditLogger: BaseAuditLogger;

  beforeEach(async () => {
    jest
      .useFakeTimers('modern')
      .setSystemTime(new Date('2022-03-16T11:01:58.135Z'));
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [TestController],
      providers: [
        AuditLoggingInterceptor,
        {
          provide: AuditLog,
          useValue: new AuditLog({
            actionType: ActionType.Object,
            actorType: ActorType.Eportal,
            service: { type: ServiceType.App, id: 'test.service' },
            objectType: ObjectType.ErudioNamespace,
          }),
        },
        {
          provide: BaseAuditLogger,
          useFactory: (auditLog: AuditLog) => {
            baseAuditLogger = new BaseAuditLogger(
              'test.one.two',
              auditLog,
              new TestLoggerTransport(),
            );
            return baseAuditLogger;
          },
          inject: [AuditLog],
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new TestErrorHandler());
    interceptor = app.get<AuditLoggingInterceptor>(AuditLoggingInterceptor);
    auditLog = app.get<AuditLog>(AuditLog);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe("interceptor's error handler", () => {
    beforeEach(async () => {
      jest.spyOn(baseAuditLogger, 'log');
      jest.spyOn(auditLog, 'message');
    });
    it('should be called succesfully', async () => {
      await request(app.getHttpServer()).get('/test/error/2');
    });

    it('should catch TestError type', async () => {
      await request(app.getHttpServer())
        .get('/test/error/2')
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(auditLog.message).toHaveBeenCalled();
      expect(baseAuditLogger.log).toHaveBeenCalled();
    });

    it('should catch NotFoundException type', async () => {
      const resp = await request(app.getHttpServer())
        .get('/test/notfound/1')
        .expect(HttpStatus.NOT_FOUND);
      expect(resp.body.message).toMatch(/Not Found/);
      expect(auditLog.message).toHaveBeenCalled();
      expect(baseAuditLogger.log).toHaveBeenCalled();
    });

    it('should not be called if not defined', async () => {
      const resp = await request(app.getHttpServer())
        .get('/test/without-audit/1')
        .expect(HttpStatus.NOT_FOUND);
      expect(resp.body.message).toMatch(/Not Found/);
      expect(auditLog.message).not.toHaveBeenCalled();
      expect(baseAuditLogger.log).not.toHaveBeenCalled();
    });

    it('should not catch not defined error type', async () => {
      await request(app.getHttpServer())
        .get('/test/not-error/2')
        .expect(HttpStatus.NOT_FOUND);
      expect(auditLog.message).not.toHaveBeenCalled();
      expect(baseAuditLogger.log).not.toHaveBeenCalled();
    });

    it('should emit audit log', async () => {
      const actorId = '123';
      const objectId = 'some-object-id-123';
      const resp = await request(app.getHttpServer())
        .get(`/test/notfound/${objectId}`)
        .set('x-gateway-user-id', actorId)
        .expect(HttpStatus.NOT_FOUND);
      expect(resp.body.message).toMatch(/Not Found/);
      expect(auditLog.message).toHaveBeenCalledWith(
        {
          actionVerb: 'accessed',
          actorId: '123',
          objectId: 'some-object-id-123',
          outcome: 'failure',
          pii: [],
        },
        undefined,
      );
    });
  });
});
