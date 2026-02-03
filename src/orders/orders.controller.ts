import { Controller, Get, Post, Body, Param, UseGuards, Request, Patch } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) { }

    @Post()
    create(@Request() req, @Body() createOrderDto: CreateOrderDto) {
        return this.ordersService.create(req.user.id, createOrderDto);
    }

    @Get('all')
    findAllAdmin() {
        return this.ordersService.findAllAdmin();
    }

    @Get()
    findAll(@Request() req) {
        return this.ordersService.findAll(req.user.id);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @Request() req) {
        return this.ordersService.findOne(id, req.user.id);
    }

    @Patch(':id/status')
    updateStatus(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
        return this.ordersService.updateStatus(id, updateOrderDto);
    }
}
