import { Controller, Get, Post, Body, Param, Delete, Put, Req, UseGuards, Query } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateDeliveryAddressDto, UpdateShipperLocationDto, RateOrderDto, CancelOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth, ApiOkResponse, ApiUnauthorizedResponse, ApiForbiddenResponse, ApiQuery } from '@nestjs/swagger';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { AssignShipperDto } from './dto/assign-shipper.dto';
import { OrderStatus, PaymentMethod, PaymentStatus } from './schemas/order.schema';
import { JwtAuthGuard } from '@/auth/passport/jwt-auth.guard';
import { RolesGuard } from '@/auth/passport/roles.guard';
import { Roles } from '@/decorator/roles.decorator';
import { AuthenticatedRequest } from '@/common/interfaces/auth-request.interface';
import { CreateOrderFromCartDto } from './dto/create-order-from-cart.dto';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) { }

  @Post('')
  @ApiOperation({ summary: 'Create a new order from selected cart items' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiBody({ type: CreateOrderDto })
  @ApiResponse({
    status: 201,
    description: 'Successfully created order from selected cart items',
    schema: {
      example: {
        _id: '64e3c4ba1f9b8b001a0c1234',
        restaurant: '64e3c4ba1f9b8b001a0c5678',
        user: '64e3c4ba1f9b8b001a0c9999',
        status: 'PENDING',
        deliveryAddress: {
          street: '123 Nguyễn Du',
          ward: 'Phường Hai Bà Trưng',
          district: 'Quận Hoàn Kiếm',
          city: 'Hà Nội',
          fullAddress: '123 Nguyễn Du, Phường Hai Bà Trưng, Quận Hoàn Kiếm, Hà Nội',
          recipientName: 'Nguyễn Văn A',
          recipientPhone: '0987654321',
          coordinates: [105.8542, 21.0285]
        },
        distanceKm: 5.2,
        estimatedDeliveryMinutes: 30,
        paymentMethod: 'CASH',
        paymentStatus: 'PENDING',
        fees: {
          subtotal: 150000,
          deliveryFee: 20000,
          serviceFee: 5000,
          discount: 0,
          tax: 8000,
          totalAmount: 183000
        },
        timing: {
          orderTime: '2025-07-02T09:58:01.044Z',
          estimatedDeliveryTime: '2025-07-02T10:28:01.044Z'
        }
      }
    }
  })
  createFromCart(@Req() req: AuthenticatedRequest, @Body() dto: CreateOrderDto) {
    return this.ordersService.createFromCartItems(req.user._id, dto);
  }
  @Post('restaurant/:restaurantId')
  @ApiOperation({ summary: 'Create a new order from all cart items of a restaurant' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'restaurantId', description: 'Restaurant ID' })
  @ApiBody({ type: CreateOrderFromCartDto }) // ✅ dùng DTO class
  @ApiResponse({
    status: 201,
    description: 'Successfully created order from all cart items of the restaurant',
  })
  createFromRestaurantCart(
    @Req() req: AuthenticatedRequest,
    @Param('restaurantId') restaurantId: string,
    @Body() dto: CreateOrderFromCartDto, 
  ) {
    return this.ordersService.createFromCart(req.user._id, restaurantId, dto);
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @Get()
  @ApiOperation({ summary: 'Get all orders with filters' })
  @ApiQuery({ name: 'status', required: false, enum: OrderStatus })
  @ApiQuery({ name: 'paymentMethod', required: false, enum: PaymentMethod })
  @ApiQuery({ name: 'paymentStatus', required: false, enum: PaymentStatus })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({
    description: 'Successfully retrieved all orders',
    schema: {
      example: {
        data: [
          {
            _id: '6874d59261b145d6c1382ad6',
            restaurant: {
              _id: '6874ce97bd90ae9587f79abc',
              name: 'Popeyes Fried Chicken',
              address: '88 Nguy Nhu Kon Tum, Hanoi',
            },
            user: {
              _id: '6874d4f561b145d6c1382ac3',
              name: 'Nguyễn Văn A',
              phone: '0987654321'
            },
            status: 'DELIVERED',
            paymentMethod: 'CASH',
            paymentStatus: 'PAID',
            deliveryAddress: {
              fullAddress: '123 Nguyễn Du, Phường Hai Bà Trưng, Quận Hoàn Kiếm, Hà Nội',
              recipientName: 'Nguyễn Văn A',
              recipientPhone: '0987654321'
            },
            fees: {
              totalAmount: 183000,
              deliveryFee: 20000
            },
            rating: 5,
            distanceKm: 5.2
          }
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 100,
          pages: 10
        }
      }
    }
  })
  findAll(@Query() query: { status?: OrderStatus; paymentMethod?: PaymentMethod; paymentStatus?: PaymentStatus; page?: number; limit?: number }) {
    return this.ordersService.findAll(query);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Get current user\'s orders' })
  @ApiQuery({ name: 'status', required: false, enum: OrderStatus })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'List of orders created by the current user',
  })
  findMyOrders(@Req() req: AuthenticatedRequest, @Query() query: { status?: OrderStatus; page?: number; limit?: number }) {
    return this.ordersService.findByUser(req.user._id, query);
  }

  // Tracking đơn hàng realtime
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(':id/tracking')
  @ApiOperation({ summary: 'Get real-time order tracking information' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({
    status: 200,
    description: 'Order tracking information',
    schema: {
      example: {
        orderId: '64e3c4ba1f9b8b001a0c1234',
        status: 'DELIVERING',
        estimatedDeliveryTime: '2025-07-02T10:28:01.044Z',
        shipperLocation: [105.8542, 21.0285],
        deliveryAddress: {
          coordinates: [105.8600, 21.0300]
        },
        distanceToDestination: 1.2,
        estimatedTimeRemaining: 8
      }
    }
  })
  getOrderTracking(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.ordersService.getOrderTracking(id, req.user._id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @Get(':id')
  @ApiOperation({ summary: 'Get order details by ID' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  // Cập nhật địa chỉ giao hàng (chỉ khi đơn hàng ở trạng thái PENDING hoặc CONFIRMED)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Put(':id/delivery-address')
  @ApiOperation({ summary: 'Update delivery address (only for PENDING/CONFIRMED orders)' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiBody({ type: UpdateDeliveryAddressDto })
  updateDeliveryAddress(
    @Param('id') id: string,
    @Body() dto: UpdateDeliveryAddressDto,
    @Req() req: AuthenticatedRequest
  ) {
    return this.ordersService.updateDeliveryAddress(id, req.user._id, dto);
  }

  // Đánh giá đơn hàng
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post(':id/rating')
  @ApiOperation({ summary: 'Rate a delivered order' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiBody({ type: RateOrderDto })
  @ApiResponse({
    status: 200,
    description: 'Successfully rated the order'
  })
  rateOrder(
    @Param('id') id: string,
    @Body() dto: RateOrderDto,
    @Req() req: AuthenticatedRequest
  ) {
    return this.ordersService.rateOrder(id, req.user._id, dto);
  }

  // Hủy đơn hàng
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel an order' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiBody({ type: CancelOrderDto })
  @ApiResponse({
    status: 200,
    description: 'Successfully cancelled the order'
  })
  cancelOrder(
    @Param('id') id: string,
    @Body() dto: CancelOrderDto,
    @Req() req: AuthenticatedRequest
  ) {
    return this.ordersService.cancelOrder(id, req.user._id, dto);
  }

  // ============ RESTAURANT ENDPOINTS ============

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('RESTAURANT', 'ADMIN')
  @ApiBearerAuth()
  @Get('restaurant/orders')
  @ApiOperation({ summary: 'Get orders for restaurant owner' })
  @ApiQuery({ name: 'status', required: false, enum: OrderStatus })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findRestaurantOrders(@Req() req: AuthenticatedRequest, @Query() query: { status?: OrderStatus; page?: number; limit?: number }) {
    return this.ordersService.findRestaurantOrders(req.user.restaurantId, query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('RESTAURANT', 'ADMIN')
  @ApiBearerAuth()
  @Put(':id/confirm')
  @ApiOperation({ summary: 'Restaurant confirms order' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiBody({
    schema: {
      example: {
        preparationTime: 20, // phút
        note: 'Đơn hàng đã được xác nhận'
      }
    }
  })
  confirmOrder(
    @Param('id') id: string,
    @Body() dto: { preparationTime?: number; note?: string },
    @Req() req: AuthenticatedRequest
  ) {
    return this.ordersService.confirmOrder(id, req.user.restaurantId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('RESTAURANT', 'ADMIN')
  @ApiBearerAuth()
  @Put(':id/status')
  @ApiOperation({ summary: 'Update order status by restaurant' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiBody({
    schema: {
      example: {
        status: 'PREPARING'
      }
    }
  })
  updateOrderStatusByRestaurant(
    @Param('id') id: string,
    @Body() dto: { status: OrderStatus },
    @Req() req: AuthenticatedRequest
  ) {
    return this.ordersService.updateOrderStatusByRestaurant(id, req.user.restaurantId, dto.status);
  }

  // ============ SHIPPER ENDPOINTS ============

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SHIPPER', 'ADMIN')
  @ApiBearerAuth()
  @Get('shipper/available')
  @ApiOperation({ summary: 'Get available orders for shipper' })
  @ApiQuery({ name: 'maxDistance', required: false, type: Number, description: 'Maximum distance in km' })
  @ApiQuery({ name: 'lat', required: false, type: Number, description: 'Shipper latitude' })
  @ApiQuery({ name: 'lng', required: false, type: Number, description: 'Shipper longitude' })
  getAvailableOrders(@Req() req: AuthenticatedRequest, @Query() query: { maxDistance?: number; lat?: number; lng?: number }) {
    return this.ordersService.getAvailableOrdersForShipper(req.user.shipperId, query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SHIPPER', 'ADMIN')
  @ApiBearerAuth()
  @Get('shipper/my-orders')
  @ApiOperation({ summary: 'Get shipper\'s assigned orders' })
  @ApiQuery({ name: 'status', required: false, enum: OrderStatus })
  findShipperOrders(@Req() req: AuthenticatedRequest, @Query() query: { status?: OrderStatus; page?: number; limit?: number }) {
    return this.ordersService.findShipperOrders(req.user.shipperId, query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SHIPPER', 'ADMIN')
  @ApiBearerAuth()
  @Post(':id/accept')
  @ApiOperation({ summary: 'Shipper accepts an order' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  acceptOrder(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.ordersService.acceptOrderByShipper(id, req.user.shipperId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SHIPPER', 'ADMIN')
  @ApiBearerAuth()
  @Put(':id/location')
  @ApiOperation({ summary: 'Update shipper location for order tracking' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiBody({ type: UpdateShipperLocationDto })
  updateShipperLocation(
    @Param('id') id: string,
    @Body() dto: UpdateShipperLocationDto,
    @Req() req: AuthenticatedRequest
  ) {
    return this.ordersService.updateShipperLocation(id, req.user.shipperId, dto.coordinates);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SHIPPER', 'ADMIN')
  @ApiBearerAuth()
  @Put(':id/shipper-status')
  @ApiOperation({ summary: 'Update order status by shipper' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiBody({
    schema: {
      example: {
        status: 'DELIVERING'
      }
    }
  })
  updateStatusByShipper(
    @Param('id') id: string,
    @Body() dto: { status: OrderStatus },
    @Req() req: AuthenticatedRequest
  ) {
    return this.ordersService.updateStatusByShipper(id, req.user.shipperId, dto.status);
  }

  // ============ ADMIN ENDPOINTS ============

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @Put(':id')
  @ApiOperation({ summary: 'Update an order by ID (Admin only)' })
  @ApiParam({ name: 'id', description: 'Order ID to update' })
  @ApiBody({ type: UpdateOrderDto })
  update(@Param('id') id: string, @Body() dto: UpdateOrderDto) {
    return this.ordersService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @Delete(':id')
  @ApiOperation({ summary: 'Delete an order by ID (Admin only)' })
  @ApiParam({ name: 'id', description: 'Order ID to delete' })
  remove(@Param('id') id: string) {
    return this.ordersService.remove(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @Post(':id/assign')
  @ApiOperation({ summary: 'Manually assign a shipper to an order (Admin only)' })
  @ApiParam({ name: 'id', description: 'Order ID to assign' })
  @ApiBody({ type: AssignShipperDto })
  assignOrderToShipper(
    @Param('id') orderId: string,
    @Body() dto: AssignShipperDto
  ) {
    return this.ordersService.assignShipper(orderId, dto.shipperId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @Post(':id/refund')
  @ApiOperation({ summary: 'Process refund for an order (Admin only)' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiBody({
    schema: {
      example: {
        refundAmount: 150000,
        reason: 'Order cancelled by restaurant'
      }
    }
  })
  processRefund(
    @Param('id') id: string,
    @Body() dto: { refundAmount: number; reason: string }
  ) {
    return this.ordersService.processRefund(id, dto.refundAmount, dto.reason);
  }

  // ============ ANALYTICS ENDPOINTS ============

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'RESTAURANT')
  @ApiBearerAuth()
  @Get('analytics/revenue')
  @ApiOperation({ summary: 'Get revenue analytics' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'restaurantId', required: false, type: String })
  getRevenueAnalytics(@Query() query: { startDate?: string; endDate?: string; restaurantId?: string; period?: 'day' | 'week' | 'month' }, @Req() req: AuthenticatedRequest) {
    return this.ordersService.getRevenueAnalytics(query, req.user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @Get('analytics/performance')
  @ApiOperation({ summary: 'Get order performance analytics' })
  @ApiQuery({ name: 'period', required: false, enum: ['day', 'week', 'month'] })
  getPerformanceAnalytics(@Query() query: { startDate?: string; endDate?: string; period?: 'day' | 'week' | 'month' }) {
    return this.ordersService.getPerformanceAnalytics(query);
  }
}