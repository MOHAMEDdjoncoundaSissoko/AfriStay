import { GUARDS_METADATA } from '@nestjs/common/constants';
import { ContactController } from '../src/modules/contact/contact.controller';
import { AdminGuard } from '../src/common/guards/admin.guard';
import { JwtAuthGuard } from '../src/modules/auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../src/modules/auth/guards/optional-jwt-auth.guard';

// Lit les guards posés avec @UseGuards(...) sur une méthode du controller
const guardsOf = (method: keyof ContactController) =>
  Reflect.getMetadata(GUARDS_METADATA, ContactController.prototype[method]) ?? [];

describe('ContactController — sécurité des routes', () => {
  it('GET /contact (toute la boîte support) est réservé aux admins', () => {
    expect(guardsOf('findAll')).toContain(AdminGuard);
  });

  it('PATCH /contact/:id/reply est réservé aux admins', () => {
    expect(guardsOf('reply')).toContain(AdminGuard);
  });

  it('GET /contact/mine exige d\'être connecté', () => {
    expect(guardsOf('findMine')).toContain(JwtAuthGuard);
  });

  it('POST /contact reste ouvert mais lit l\'utilisateur dans le token', () => {
    expect(guardsOf('create')).toContain(OptionalJwtAuthGuard);
  });

  it('le userId vient du token, jamais du body', async () => {
    const service = { create: jest.fn().mockResolvedValue({}) } as any;
    const controller = new ContactController(service);
    const dto = { firstName: 'A', lastName: 'B', email: 'a@b.com', subject: 'S', message: 'M' };

    await controller.create({ user: { id: 'user-42' } }, dto);
    expect(service.create).toHaveBeenCalledWith(dto, 'user-42');

    await controller.create({ user: null }, dto);
    expect(service.create).toHaveBeenLastCalledWith(dto, null);
  });
});