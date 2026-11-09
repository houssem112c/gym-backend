import { BadRequestException, Controller, Headers, HttpCode, Post, Req } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsWebhookController {
    constructor(private readonly paymentsService: PaymentsService) {}

    @Post('webhook')
    @HttpCode(200)
    handleWebhook(
        @Headers('stripe-signature') signature: string,
        @Req() request: { rawBody?: Buffer },
    ) {
        if (!signature || !request.rawBody) {
            throw new BadRequestException('Stripe signature and raw request body are required');
        }

        return this.paymentsService.handleWebhook(signature, request.rawBody);
    }
}
