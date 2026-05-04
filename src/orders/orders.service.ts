import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus, PaymentStatus, XpAction } from '@prisma/client';
import { GamificationService } from '../gamification/gamification.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrdersService {
    constructor(
        private prisma: PrismaService,
        private gamificationService: GamificationService,
    ) { }

    async create(userId: string, createOrderDto: CreateOrderDto) {
        const { items, paymentIntentId, paymentMethod = 'MONEY' } = createOrderDto;

        // Calculate total and verify products
        let totalAmount = 0;
        let totalPoints = 0;
        const orderItemsData = [];

        for (const item of items) {
            const product = await this.prisma.product.findUnique({
                where: { id: item.productId },
            });

            if (!product) {
                throw new NotFoundException(`Product with ID ${item.productId} not found`);
            }

            const itemTotal = product.price * item.quantity;
            totalAmount += itemTotal;

            if (product.pointsPrice) {
                totalPoints += product.pointsPrice * item.quantity;
            } else if (paymentMethod === 'POINTS') {
                throw new Error(`Product ${product.name} cannot be purchased with points`);
            }

            orderItemsData.push({
                productId: item.productId,
                quantity: item.quantity,
                price: product.price,
            });
        }

        // Determine if paid
        let isPaid = !!paymentIntentId;
        let paymentStatus: PaymentStatus = isPaid ? PaymentStatus.PAID : PaymentStatus.UNPAID;
        let orderStatus: OrderStatus = isPaid ? OrderStatus.PROCESSING : OrderStatus.PENDING;

        if (paymentMethod === 'POINTS') {
            await this.gamificationService.spendPoints(userId, totalPoints);
            isPaid = true;
            paymentStatus = PaymentStatus.PAID;
            orderStatus = OrderStatus.PROCESSING;
        }

        const order = await this.prisma.order.create({
            data: {
                userId,
                totalAmount,
                status: orderStatus,
                paymentStatus: paymentStatus,
                items: {
                    create: orderItemsData,
                },
                payment: isPaid ? {
                    create: {
                        stripePaymentId: paymentMethod === 'POINTS' 
                            ? `POINTS_${Date.now()}_${Math.random().toString(36).substring(7)}` 
                            : paymentIntentId,
                        amount: totalAmount,
                        currency: paymentMethod === 'POINTS' ? 'XP' : 'usd',
                        status: 'succeeded',
                    }
                } : undefined,
            },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
                payment: true,
            },
        });

        // Award XP if order is paid and NOT using points
        if (isPaid && paymentMethod !== 'POINTS') {
            await this.gamificationService.awardXp(userId, XpAction.ORDER_COMPLETED, 15, { orderId: order.id, amount: totalAmount });
        }

        return order;
    }

    async findAll(userId: string) {
        return this.prisma.order.findMany({
            where: { userId },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    async findAllAdmin() {
        return this.prisma.order.findMany({
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
                user: {
                    select: {
                        name: true,
                        email: true,
                    }
                }
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    async findOne(id: string, userId: string) {
        const order = await this.prisma.order.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
            },
        });

        if (!order || order.userId !== userId) {
            throw new NotFoundException('Order not found');
        }

        return order;
    }
    async updateStatus(id: string, updateOrderDto: UpdateOrderDto) {
        const order = await this.prisma.order.findUnique({
            where: { id },
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        return this.prisma.order.update({
            where: { id },
            data: updateOrderDto,
        });
    }
}
