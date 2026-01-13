import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { UserProgressService } from './user-progress.service';
import { CreateProgressPhotoDto, CreateMeasurementDto, CreatePRDto } from './dto/user-progress.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('user-progress')
@UseGuards(JwtAuthGuard)
export class UserProgressController {
    constructor(private readonly userProgressService: UserProgressService) { }

    @Post('photos')
    addPhoto(@Request() req, @Body() createProgressPhotoDto: CreateProgressPhotoDto) {
        return this.userProgressService.addPhoto(req.user.id, createProgressPhotoDto);
    }

    @Get('photos')
    getPhotos(@Request() req) {
        return this.userProgressService.getPhotos(req.user.id);
    }

    @Post('measurements')
    addMeasurement(@Request() req, @Body() createMeasurementDto: CreateMeasurementDto) {
        return this.userProgressService.addMeasurement(req.user.id, createMeasurementDto);
    }

    @Get('measurements')
    getMeasurements(@Request() req) {
        return this.userProgressService.getMeasurements(req.user.id);
    }

    @Post('prs')
    addPR(@Request() req, @Body() createPRDto: CreatePRDto) {
        return this.userProgressService.addPR(req.user.id, createPRDto);
    }

    @Get('prs')
    getPRs(@Request() req) {
        return this.userProgressService.getPRs(req.user.id);
    }
}
