import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AdminGuard } from '../../common/guards/admin.guard';
import {
  UpdateUserRoleDto,
  UpdateUserStatusDto,
  UpdatePropertyStatusDto,
  ReviewVerificationDto,
  AdminQueryDto,
} from './dto';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /* ─── DASHBOARD ─── */

  @Get('dashboard')
  @ApiOperation({ summary: 'Statistiques du dashboard admin' })
  getDashboard() {
    return this.adminService.getDashboard();
  }

  /* ─── UTILISATEURS ─── */

  @Get('users')
  @ApiOperation({ summary: 'Liste des utilisateurs' })
  getUsers(@Query() query: AdminQueryDto) {
    return this.adminService.getUsers(query);
  }

  @Patch('users/:id/role')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Modifier le rôle d\'un utilisateur' })
  updateUserRole(
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
    @Request() req: any,
  ) {
    return this.adminService.updateUserRole(id, dto, req.user.id);
  }

  @Patch('users/:id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activer ou désactiver un utilisateur' })
  toggleUserStatus(
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
    @Request() req: any,
  ) {
    return this.adminService.toggleUserStatus(id, dto, req.user.id);
  }

  /* ─── LOGEMENTS ─── */

  @Get('properties')
  @ApiOperation({ summary: 'Liste des logements (modération)' })
  getProperties(@Query() query: AdminQueryDto) {
    return this.adminService.getProperties(query);
  }

  @Patch('properties/:id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Changer le statut d\'un logement' })
  updatePropertyStatus(
    @Param('id') id: string,
    @Body() dto: UpdatePropertyStatusDto,
    @Request() req: any,
  ) {
    return this.adminService.updatePropertyStatus(id, dto, req.user.id);
  }

  /* ─── VÉRIFICATIONS ─── */

  @Get('verifications')
  @ApiOperation({ summary: 'Liste des vérifications d\'identité' })
  getVerifications(@Query() query: AdminQueryDto) {
    return this.adminService.getVerifications(query);
  }

  @Patch('verifications/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approuver ou refuser une vérification' })
  reviewVerification(
    @Param('id') id: string,
    @Body() dto: ReviewVerificationDto,
    @Request() req: any,
  ) {
    return this.adminService.reviewVerification(id, dto, req.user.id);
  }
}