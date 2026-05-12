import { Controller, Get, Param, Post, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { TermsService } from './terms.service';
import { TermsType } from './entities/terms.entity';

@Controller('terms')
export class TermsController {
  constructor(private readonly termsService: TermsService) {}

  @Get('latest/:type')
  async getLatest(@Param('type') type: string) {
    const typeMap: Record<string, TermsType> = {
      client: TermsType.CLIENT,
      owner: TermsType.OWNER,
      staff: TermsType.STAFF,
      privacy: TermsType.PRIVACY,
    };
    const termsType = typeMap[type] || TermsType.CLIENT;
    const terms = await this.termsService.findLatestByType(termsType);
    if (!terms) throw new Error('No terms found');
    return terms;
  }

  @Post('accept/:termsId')
  @UseGuards(JwtAuthGuard)
  async accept(@Param('termsId') termsId: string, @Req() req: any) {
    await this.termsService.acceptTerms(req.user.userId, termsId);
    return { accepted: true };
  }
}
