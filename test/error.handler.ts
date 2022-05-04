import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { TestError } from './test.error';

@Catch(TestError)
export class TestErrorHandler implements ExceptionFilter {
  catch(_: TestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    response
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: 'Something Went Wrong' });
  }
}
