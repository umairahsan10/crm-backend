import { Controller, Post, Body, UseGuards, Request, Get, Param, Patch, ParseIntPipe } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { GeneratePaymentLinkDto } from './dto/generate-payment-link.dto';
import { PaymentLinkResponseDto } from './dto/payment-link-response.dto';
import { UpdatePaymentLinkDto } from './dto/update-payment-link.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { LeadsAccessGuard } from '../leads/guards';

@Controller('leads')
@UseGuards(JwtAuthGuard, LeadsAccessGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('payment-link-generate')
  async generatePaymentLink(
    @Body() dto: GeneratePaymentLinkDto,
    @Request() req
  ): Promise<PaymentLinkResponseDto> {
    const userId = req.user.id;
    return await this.paymentsService.generatePaymentLink(dto, userId);
  }

  @Get('transaction/:id')
  async getPaymentDetails(
    @Param('id', ParseIntPipe) transactionId: number,
    @Request() req
  ) {
    const userId = req.user.id;
    return await this.paymentsService.getPaymentDetails(transactionId, userId);
  }



  @Patch('payment-link-generate/:id')    //pass transactionId in getparams
  async updatePaymentLinkDetails(
    @Param('id', ParseIntPipe) transactionId: number,
    @Body() updateDto: UpdatePaymentLinkDto,
    @Request() req
  ) {
    const userId = req.user.id;
    return await this.paymentsService.updatePaymentLinkDetails(transactionId, updateDto, userId);
  }
}
