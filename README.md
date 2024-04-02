<h1> [DEPRECATED] </h1>

## Nestjs Audit Logging Interceptor

Library to facilitate adding custom audit log messages to nestjs controllers.

# Usecase

`transport`

```
class TestLoggerTransport implements Transport {
  log(): any | Promise<any> {
    return;
  }
}
```

`module`

```
@Module({
  imports: [],
  controllers: [SomeController],
  providers: [
    AuditLogInterceptor,
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
  ]
})
```

`controller`

```
@Controller('/test')
export class TestController {
  @AuditLogger({
    action: ActionVerb.ACCESSED,
    actorIdGetter: (req) => req.headers['x-gateway-user-id'],
    objectIdGetter: (req) => req.params.id,
    eventSubject: 'test',
    errorTypes: [NotFoundException],
  })
  @Get('/error/:id')
  action(@Param('id') id: string) {
    // do some action
    // success calls will be intercepted and audit log message will be emitted
    // as for errors, only NotFoudException will be intercepted and an audit log message will be emitted. All errors needed for audit log should be specified upfront
  }
}
```
