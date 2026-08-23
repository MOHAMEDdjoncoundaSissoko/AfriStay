import { Injectable, ExecutionContext, CallHandler, NestInterceptor, } from '@nestjs/common';
import { HttpException } from '@nestjs/common';
import { Request } from 'express';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

@Injectable()
export class RateLimitInterceptor implements NestInterceptor {
  private limits = new Map<string, RateLimitEntry>();

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const ip = request.ip;
    const path = request.route.path;
    const key = `${ip}:${path}`;
    const now = Date.now();
    const record = this.limits.get(key);

    if (!record || now > record.resetAt) {
      this.limits.set(key, { count: 1, resetAt: now + 60000 });
      return next.handle();
    }

    record.count++;

    if (record.count > 5) {
      return throwError(() =>
        new HttpException('Trop de tentatives, réessayez plus tard', 429)
      );
    }

    return next.handle();
  }
}