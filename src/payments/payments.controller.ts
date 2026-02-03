import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) { }

    @Post('create-intent')
    createIntent(@Body() createPaymentDto: CreatePaymentDto) {
        return this.paymentsService.createPaymentIntent(
            createPaymentDto.amount,
            createPaymentDto.currency,
        );
    }
}
