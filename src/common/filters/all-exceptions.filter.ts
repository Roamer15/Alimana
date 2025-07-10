import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let responseBody: any = {
      code: 'INTERNAL_SERVER_ERROR',
      error: 'Une erreur inattendue est survenue',
    };

    // Si c'est une HttpException (y compris celles personnalisées)
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exRes = exception.getResponse();

      if (typeof exRes === 'string') {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        responseBody.error = exRes;
      } else if (typeof exRes === 'object') {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        responseBody = { ...responseBody, ...exRes };
      }
    } else if (exception instanceof Error) {
      // Autre type d'erreur JS standard
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      responseBody.error = exception.message;
    }

    response.status(status).json({
      statusCode: status,
      ...responseBody,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
