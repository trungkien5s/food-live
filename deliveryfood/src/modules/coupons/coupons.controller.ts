import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  ParseBoolPipe,
  DefaultValuePipe
} from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { VerifyCouponDto } from './dto/verify-coupoun.dto';
import { CreateCouponDto } from './dto/create-coupons.dto';
import { QueryCouponDto } from './dto/query-coupons.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { ApiTags } from '@nestjs/swagger';
;

// Uncomment when you have authentication
// import { UseGuards } from '@nestjs/common';
// import { JwtAuthGuard } from '@/auth/passport/jwt-auth.guard';
// import { RolesGuard } from '@/auth/roles.guard';
// import { Roles } from '@/auth/roles.decorator';
@ApiTags('Coupons')
@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  /** Public: verify coupon code and return discount + total */
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  async verify(@Body() dto: VerifyCouponDto) {
    const result = await this.couponsService.verifyAndPrice(dto);
    
    return {
      success: true,
      data: {
        code: dto.code,
        discount: result.discount,
        total: result.total,
        couponId: String(result.coupon._id),
        type: result.coupon.type,
        value: result.coupon.value,
        maxDiscount: result.coupon.maxDiscount ?? 0,
        scope: result.coupon.scope,
      }
    };
  }

  // ===== Admin CRUD =====
  
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles('admin')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateCouponDto) {
    const coupon = await this.couponsService.create(dto);
    return {
      success: true,
      data: coupon
    };
  }

  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles('admin')
  @Get()
  async findAll(@Query() query: QueryCouponDto) {
    const coupons = await this.couponsService.findAll(query);
    return {
      success: true,
      data: coupons
    };
  }

  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles('admin')
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const coupon = await this.couponsService.findOne(id);
    return {
      success: true,
      data: coupon
    };
  }

  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles('admin')
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateCouponDto) {
    const coupon = await this.couponsService.update(id, dto);
    return {
      success: true,
      data: coupon
    };
  }

  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles('admin')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.couponsService.remove(id);
  }

  // Additional endpoints for better management
  
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles('admin')
  @Patch(':id/toggle-status')
  async toggleStatus(@Param('id') id: string) {
    const coupon = await this.couponsService.toggleStatus(id);
    return {
      success: true,
      data: coupon
    };
  }

  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles('admin')
  @Get(':id/usage-stats')
  async getUsageStats(@Param('id') id: string) {
    const stats = await this.couponsService.getUsageStats(id);
    return {
      success: true,
      data: stats
    };
  }
}