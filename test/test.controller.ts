import { Controller, Get, NotFoundException, Param, Req } from '@nestjs/common';
import { ActionVerb, ServiceType } from '@fagbokforlaget/audit-logging';
import { AuditLogger } from '../src/audit-logging.decorator';
import { TestError } from './test.error';

interface RequestWithObjectId extends Request {
  objectId: string;
}
@Controller('/test')
export class TestController {
  @AuditLogger({
    action: ActionVerb.ACCESSED,
    actorIdGetter: (req) => req.headers['x-gateway-user-id'],
    objectIdGetter: (req) => req.params.id,
    eventSubject: 'test',
    errorTypes: [TestError],
  })
  @Get('/error/:id')
  errorId(@Param('id') id: string) {
    throw new TestError('TEST1120');
  }

  @AuditLogger({
    action: ActionVerb.ACCESSED,
    actorIdGetter: (req) => req.headers['x-gateway-user-id'],
    objectIdGetter: (req) => req.params.id,
    eventSubject: 'test',
    errorTypes: [TestError],
  })
  @Get('/not-error/:id')
  notError(@Param('id') id: string) {
    throw new NotFoundException();
  }

  @AuditLogger({
    action: ActionVerb.ACCESSED,
    actorIdGetter: (req) => req.headers['x-gateway-user-id'],
    objectIdGetter: (req) => req.params.id,
    eventSubject: 'test',
    errorTypes: [NotFoundException],
  })
  @Get('/notfound/:id')
  notfound(@Param('id') id: string) {
    throw new NotFoundException();
  }

  @Get('/without-audit/:id')
  withoutAudit(@Param('id') id: string) {
    throw new NotFoundException();
  }

  @AuditLogger({
    action: ActionVerb.ACCESSED,
    actorIdGetter: (req) => req.headers['x-gateway-user-id'],
    objectIdGetter: (req) => req.params.id,
    eventSubject: 'test',
  })
  @Get('/success/:id')
  success(@Param('id') id: string) {
    return { id };
  }

  @AuditLogger({
    action: ActionVerb.ACCESSED,
    actorIdGetter: (req) => req.headers['x-gateway-user-id'],
    objectIdGetter: (req) => req.objectId,
    eventSubject: 'test',
  })
  @Get('/object/:id')
  objectIdResolvedInMethod(
    @Param('id') id: string,
    @Req() req: RequestWithObjectId,
  ) {
    req.objectId = `injected-${id}`;
    return { id };
  }

  @AuditLogger({
    action: ActionVerb.ACCESSED,
    actorIdGetter: (req) => req.headers['x-gateway-user-id'],
    objectIdGetter: (req) => req.params.id,
    eventSubject: 'test',
    overrides: {
      service: { type: ServiceType.Batch, id: 'test.service' },
    },
  })
  @Get('/override/:id')
  overrides(@Param('id') id: string) {
    return { id };
  }
}
