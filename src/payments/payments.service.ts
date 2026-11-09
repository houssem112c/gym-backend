import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus, PaymentStatus } from '@prisma/client';

@Injectable()
export class PaymentsService {
    private readonly logger = new Logger(PaymentsService.name);
    private stripe: Stripe;
    private readonly webhookSecret: string;

    constructor(
        private configService: ConfigService,
        private prisma: PrismaService,
    ) {
        const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
        this.webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET') || '';

        if (!secretKey) {
            throw new Error('STRIPE_SECRET_KEY must be configured');
        }

        this.stripe = new Stripe(secretKey, {
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
        if (!this.webhookSecret) {
            throw new BadRequestException('Stripe webhook is not configured');
        }

        let event: Stripe.Event;
        try {
            event = this.stripe.webhooks.constructEvent(
                payload,
                signature,
                this.webhookSecret,
            );
        } catch (error) {
            this.logger.warn(`Invalid Stripe webhook signature: ${error.message}`);
            throw new BadRequestException('Invalid Stripe webhook signature');
        }

        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const payment = await this.prisma.payment.findUnique({
            where: { stripePaymentId: paymentIntent.id },
        });

        if (!payment) {
            this.logger.warn(`No local payment found for Stripe payment ${paymentIntent.id}`);
            return { received: true };
        }

        if (event.type === 'payment_intent.succeeded') {
            await this.prisma.$transaction([
                this.prisma.payment.update({
                    where: { id: payment.id },
                    data: { status: paymentIntent.status },
                }),
                this.prisma.order.update({
                    where: { id: payment.orderId },
                    data: {
                        paymentStatus: PaymentStatus.PAID,
                        status: OrderStatus.PROCESSING,
                    },
                }),
            ]);
        } else if (event.type === 'payment_intent.payment_failed') {
            await this.prisma.$transaction([
                this.prisma.payment.update({
                    where: { id: payment.id },
                    data: { status: paymentIntent.status },
                }),
                this.prisma.order.update({
                    where: { id: payment.orderId },
                    data: { paymentStatus: PaymentStatus.FAILED },
                }),
            ]);
        }

        return { received: true };
    }
}
