import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentsService {
    private stripe: Stripe;

    constructor(
        private configService: ConfigService,
        private prisma: PrismaService,
    ) {
        this.stripe = new Stripe(this.configService.get('STRIPE_SECRET_KEY'), {
            apiVersion: '2023-10-16',
        });
    }

    async createPaymentIntent(amount: number, currency: string) {
        try {
            const paymentIntent = await this.stripe.paymentIntents.create({
                amount: Math.round(amount * 100), // Stripe expects amounts in cents
                currency,
                automatic_payment_methods: {
                    enabled: true,
                },
            });

            return {
                clientSecret: paymentIntent.client_secret,
                paymentIntentId: paymentIntent.id,
            };
        } catch (error) {
            throw new BadRequestException(error.message);
        }
    }

    async handleWebhook(signature: string, payload: Buffer) {
        // Implement webhook handling if needed for status updates
        // for now, we rely on mobile app confirmation or simple intent creation
        return { received: true };
    }
}
