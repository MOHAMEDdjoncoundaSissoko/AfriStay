import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Comme JwtAuthGuard, mais ne bloque pas les visiteurs non connectés :
// - pas de token du tout          -> req.user = null, la requête continue (visiteur)
// - token valide                  -> req.user = l'utilisateur
// - token présent mais invalide/expiré -> 401, pour que le site rafraîchisse le token et réessaie
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    if (user) return user;

    const req = context.switchToHttp().getRequest();
    if (req.headers?.authorization) {
      throw new UnauthorizedException('Session expirée');
    }
    return null;
  }
}