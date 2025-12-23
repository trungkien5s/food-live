// src/modules/carts/carts.controller.ts
import {
  Controller, Get, Post, Put, Delete, Body, Param, Req, UseGuards, UsePipes, ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/passport/jwt-auth.guard';
import { AuthenticatedRequest } from '@/common/interfaces/auth-request.interface';
import { CartsService } from './carts.service';
import { CreateCartDto } from './dto/create-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';

@ApiTags('carts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('carts')
export class CartsController {
  constructor(private readonly cartsService: CartsService) { }

  /** Danh sách tất cả cart ACTIVE của user (mỗi nhà hàng 1 cart) */
  @Get('me/active')
  findMyActive(@Req() req: AuthenticatedRequest) {
    return this.cartsService.findActiveByUser(req.user._id);
  }

  /** Lấy cart ACTIVE theo nhà hàng */
  @Get('me/active/:restaurantId')
  @ApiParam({ name: 'restaurantId', required: true })
  findMyActiveByRestaurant(@Req() req: AuthenticatedRequest, @Param('restaurantId') restaurantId: string) {
    return this.cartsService.findActiveByUserAndRestaurant(req.user._id, restaurantId);
  }

  /**
   * Tạo hoặc lấy cart ACTIVE theo (user, restaurant)
   * Body cần có: { restaurant: string }
   */
  @Post('me/active')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  createOrGet(@Req() req: AuthenticatedRequest, @Body() dto: CreateCartDto) {
    return this.cartsService.getOrCreateActive(req.user._id, dto.restaurant, dto);
  }

  /** Cập nhật cart ACTIVE theo (user, restaurant) — totals/status... */
  @Put('me/active/:restaurantId')
  @ApiParam({ name: 'restaurantId', required: true })
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  updateMyActive(
    @Req() req: AuthenticatedRequest,
    @Param('restaurantId') restaurantId: string,
    @Body() dto: UpdateCartDto,
  ) {
    return this.cartsService.update(req.user._id, restaurantId, dto);
  }

  /** Xoá cart ACTIVE theo (user, restaurant) */
  @Delete('me/active/:restaurantId')
  @ApiParam({ name: 'restaurantId', required: true })
  removeMyActive(@Req() req: AuthenticatedRequest, @Param('restaurantId') restaurantId: string) {
    return this.cartsService.remove(req.user._id, restaurantId);
  }
}
