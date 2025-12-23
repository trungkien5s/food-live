// src/modules/orders/orders.service.ts
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, isValidObjectId, PipelineStage } from 'mongoose';
import { Order, OrderDocument, OrderStatus, PaymentStatus, PaymentMethod } from './schemas/order.schema';
import { CreateOrderDto, UpdateDeliveryAddressDto, RateOrderDto, CancelOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Restaurant, RestaurantDocument } from '../restaurants/schemas/restaurant.schema';
import { Cart } from '../carts/schemas/carts.schema';
import { CartItem } from '../cart.items/schemas/cart.items.schema';
import { MenuItem } from '../menu.items/schemas/menu.item.schema';
import { MenuItemOption } from '../menu.item.options/schemas/menu.item.option.schema';
import { OrderDetail } from '../order.detail/schemas/order.detail.schema';
import { Shipper, ShipperDocument } from '../shippers/schemas/shipper.schema';
import { ShipperService } from '../shippers/shipper.service';

interface PopulatedMenuItemDocument extends Omit<MenuItem, 'menu'> {
  _id: Types.ObjectId;
  menu: {
    restaurant: Restaurant & { _id: Types.ObjectId };
  };
  basePrice: number;
}

interface PopulatedMenuItemOptionDocument extends MenuItemOption {
  _id: Types.ObjectId;
  priceAdjustment: number;
}

interface PopulatedCartItemDocument extends Omit<CartItem, 'menuItem' | 'selectedOptions'> {
  _id: Types.ObjectId;
  menuItem: PopulatedMenuItemDocument;
  selectedOptions: PopulatedMenuItemOptionDocument[];
  quantity: number;
}

interface GroupedCartItem {
  menuItem: PopulatedMenuItemDocument;
  quantity: number;
  selectedOptions: PopulatedMenuItemOptionDocument[];
}

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Cart.name) private cartModel: Model<Cart>,
    @InjectModel(CartItem.name) private cartItemModel: Model<CartItem>,
    @InjectModel(Restaurant.name) private restaurantModel: Model<RestaurantDocument>,
    @InjectModel(MenuItemOption.name) private menuItemOptionModel: Model<MenuItemOption>,
    @InjectModel(OrderDetail.name) private orderDetailModel: Model<OrderDetail>,
    @InjectModel(Shipper.name) private shipperModel: Model<ShipperDocument>,
    private readonly shipperService: ShipperService,
  ) {}

  // ---------- helpers ----------
  private calculateDeliveryFee(distanceKm: number): number {
    const baseRate = 15000; // 15k for first 3km
    const additionalRate = 5000; // 5k per km after
    if (!distanceKm || distanceKm <= 3) return baseRate;
    return baseRate + Math.ceil(distanceKm - 3) * additionalRate;
  }

  private calculateEstimatedDeliveryTime(distanceKm: number, preparationMinutes: number = 20): Date {
    const deliveryMinutes = Math.max(10, Math.round((distanceKm || 0) * 4));
    const total = preparationMinutes + deliveryMinutes;
    return new Date(Date.now() + total * 60 * 1000);
  }

  private validateDeliveryAddress(address: any): void {
    if (!address || !Array.isArray(address.coordinates) || address.coordinates.length !== 2) {
      throw new BadRequestException('Tọa độ địa chỉ không hợp lệ');
    }
    const [lng, lat] = address.coordinates;
    if (typeof lng !== 'number' || typeof lat !== 'number' || lng < -180 || lng > 180 || lat < -90 || lat > 90) {
      throw new BadRequestException('Tọa độ địa chỉ nằm ngoài phạm vi cho phép');
    }
  }

  private haversineDistance([lng1, lat1]: [number, number], [lng2, lat2]: [number, number]): number {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }

  // ---------- createFromCartItems (full implementation) ----------
  async createFromCartItems(userId: string, dto: CreateOrderDto): Promise<OrderDocument> {
    const { cartItemIds, deliveryAddress, distanceKm, estimatedDeliveryMinutes, paymentMethod, fees } = dto;

    if (!cartItemIds || !Array.isArray(cartItemIds) || cartItemIds.length === 0) {
      throw new BadRequestException('Danh sách CartItem không được rỗng');
    }

    this.validateDeliveryAddress(deliveryAddress);

    if (distanceKm && distanceKm > 50) {
      throw new BadRequestException('Khoảng cách giao hàng không được vượt quá 50km');
    }

    for (const id of cartItemIds) {
      if (!isValidObjectId(id)) throw new BadRequestException(`CartItem ID không hợp lệ: ${id}`);
    }

    const cart = await this.cartModel.findOne({ user: userId });
    if (!cart) throw new NotFoundException('Không tìm thấy giỏ hàng');

    const cartItems = await this.cartItemModel
      .find({ _id: { $in: cartItemIds }, cart: cart._id })
      .populate({
        path: 'menuItem',
        populate: { path: 'menu', populate: { path: 'restaurant' } },
      })
      .populate({ path: 'selectedOptions', select: 'priceAdjustment' }) as unknown as PopulatedCartItemDocument[];

    if (!cartItems || cartItems.length === 0) throw new NotFoundException('Không tìm thấy CartItem nào phù hợp');
    if (cartItems.length !== cartItemIds.length) throw new BadRequestException('Một số CartItem không tồn tại hoặc không thuộc về giỏ hàng của bạn');

    // Ensure same restaurant
    const restaurantIds = [...new Set(cartItems.map(ci => ci.menuItem?.menu?.restaurant?._id?.toString()))].filter(Boolean);
    if (restaurantIds.length !== 1) throw new BadRequestException('Tất cả món phải thuộc cùng một nhà hàng');
    const restaurantId = restaurantIds[0];

    const restaurant = await this.restaurantModel.findById(restaurantId);
    if (!restaurant || !restaurant.isOpen) throw new BadRequestException('Nhà hàng hiện đang đóng cửa');

    // Group identical items
    const itemMap = new Map<string, GroupedCartItem>();
    for (const item of cartItems) {
      const menuItemId = item.menuItem._id.toString();
      const selectedOptionIds = (item.selectedOptions || []).map(o => o._id.toString()).sort();
      const key = `${menuItemId}::${selectedOptionIds.join(',')}`;
      if (!itemMap.has(key)) {
        itemMap.set(key, { menuItem: item.menuItem, quantity: item.quantity, selectedOptions: item.selectedOptions || [] });
      } else {
        const ex = itemMap.get(key)!;
        ex.quantity += item.quantity;
      }
    }

    // Calculate subtotal
    let calculatedSubtotal = 0;
    for (const { menuItem, quantity, selectedOptions } of itemMap.values()) {
      const optionExtra = (selectedOptions || []).reduce((s, o) => s + (o.priceAdjustment || 0), 0);
      const price = (menuItem.basePrice || 0) + optionExtra;
      calculatedSubtotal += price * quantity;
    }

    if (fees && Math.abs(calculatedSubtotal - fees.subtotal) > 1000) {
      throw new BadRequestException('Tổng tiền món ăn không chính xác');
    }

    // Delivery fee validation
    const expectedDeliveryFee = this.calculateDeliveryFee(distanceKm || 0);
    if (fees && Math.abs(expectedDeliveryFee - (fees.deliveryFee || 0)) > 1000) {
      throw new BadRequestException('Phí giao hàng không chính xác');
    }

    const now = dto.orderTime ? new Date(dto.orderTime) : new Date();
    const estimatedDeliveryTime = this.calculateEstimatedDeliveryTime(distanceKm || 0 || 20);

    const order = await this.orderModel.create({
      user: new Types.ObjectId(userId),
      restaurant: new Types.ObjectId(restaurantId),
      status: (OrderStatus as any).PENDING || 'PENDING',
      deliveryAddress,
      distanceKm: distanceKm || 0,
      estimatedDeliveryMinutes: estimatedDeliveryMinutes || 30,
      paymentMethod: paymentMethod || PaymentMethod.CASH,
      paymentStatus: paymentMethod === PaymentMethod.CASH ? PaymentStatus.PENDING : PaymentStatus.PENDING,
      paymentTransactionId: dto.paymentTransactionId,
      fees: {
        subtotal: calculatedSubtotal,
        deliveryFee: fees?.deliveryFee ?? expectedDeliveryFee,
        serviceFee: fees?.serviceFee ?? 0,
        discount: fees?.discount ?? 0,
        tax: fees?.tax ?? Math.round(calculatedSubtotal * 0.05),
        totalAmount: fees?.totalAmount ?? (calculatedSubtotal + (fees?.deliveryFee ?? expectedDeliveryFee) + (fees?.serviceFee ?? 0) - (fees?.discount ?? 0) + Math.round(calculatedSubtotal * 0.05)),
      },
      timing: {
        orderTime: now,
        estimatedDeliveryTime,
      },
      orderNote: dto.orderNote,
      deliveryNote: dto.deliveryNote,
      couponCode: dto.couponCode,
      // store preparation minutes as an extra field to compute later if schema doesn't include it
      preparationMinutes: 20,
    } as any);

    // create order details
    for (const { menuItem, quantity, selectedOptions } of itemMap.values()) {
      const optionExtra = (selectedOptions || []).reduce((s, o) => s + (o.priceAdjustment || 0), 0);
      const price = ((menuItem.basePrice || 0) + optionExtra) * quantity;
      await this.orderDetailModel.create({
        order: order._id,
        menuItem: menuItem._id,
        quantity,
        selectedOptions: (selectedOptions || []).map(o => o._id),
        price,
      } as any);
    }

    // delete cart items
    await this.cartItemModel.deleteMany({ _id: { $in: cartItemIds } });

    const populatedOrder = await this.orderModel
      .findById(order._id)
      .populate('user', 'name phone email')
      .populate('restaurant', 'name address phone image');

    if (!populatedOrder) throw new NotFoundException('Không thể tìm thấy đơn hàng vừa tạo');
    return populatedOrder;
  }

  // ---------- createFromCart (create from all cart items for restaurant) ----------
  async createFromCart(userId: string, restaurantId: string, dto: any): Promise<OrderDocument> {
    const cart = await this.cartModel.findOne({ user: userId });
    if (!cart) throw new NotFoundException('Không tìm thấy giỏ hàng');

    const cartItems = await this.cartItemModel
      .find({ cart: cart._id })
      .populate({
        path: 'menuItem',
        populate: { path: 'menu', populate: { path: 'restaurant' } },
      }) as unknown as PopulatedCartItemDocument[];

    if (!cartItems || cartItems.length === 0) throw new NotFoundException('Giỏ hàng trống');

    const items = cartItems.filter(it => it.menuItem?.menu?.restaurant?._id?.toString() === restaurantId);
    if (items.length === 0) throw new BadRequestException('Không có món nào thuộc nhà hàng đã chọn');

    let subtotal = 0;
    for (const item of items) {
      const optionExtra = (item.selectedOptions || []).reduce((s, o) => s + (o.priceAdjustment || 0), 0);
      subtotal += ((item.menuItem?.basePrice || 0) + optionExtra) * item.quantity;
    }

    const deliveryFee = this.calculateDeliveryFee(dto.distanceKm || 5);
    const createDto: CreateOrderDto = {
      cartItemIds: items.map(i => i._id.toString()),
      deliveryAddress: dto.deliveryAddress,
      distanceKm: dto.distanceKm || 5,
      estimatedDeliveryMinutes: dto.estimatedDeliveryMinutes || 30,
      paymentMethod: dto.paymentMethod || PaymentMethod.CASH,
      fees: {
        subtotal,
        deliveryFee,
        serviceFee: dto.serviceFee || 0,
        discount: dto.discount || 0,
        tax: dto.tax || Math.round(subtotal * 0.05),
        totalAmount: subtotal + deliveryFee + (dto.serviceFee || 0) - (dto.discount || 0) + Math.round(subtotal * 0.05),
      },
      orderNote: dto.orderNote,
      deliveryNote: dto.deliveryNote,
      couponCode: dto.couponCode,
      orderTime: dto.orderTime,
      estimatedPreparationMinutes: dto.estimatedPreparationMinutes,
    } as any;

    return this.createFromCartItems(userId, createDto);
  }

  // ---------- updateDeliveryAddress ----------
  async updateDeliveryAddress(orderId: string, userId: string, dto: UpdateDeliveryAddressDto): Promise<OrderDocument> {
    if (!isValidObjectId(orderId)) throw new NotFoundException('ID đơn hàng không hợp lệ');
    const order = await this.orderModel.findOne({ _id: orderId, user: new Types.ObjectId(userId) });
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');

    // allow only when PENDING or CONFIRMED
    const allowStates = [(OrderStatus as any).PENDING || 'PENDING', (OrderStatus as any).CONFIRMED || 'CONFIRMED'];
    if (!allowStates.includes(order.status as any)) {
      throw new BadRequestException(`Không thể cập nhật địa chỉ giao hàng khi đơn hàng ở trạng thái ${order.status}`);
    }

    if (dto.deliveryAddress) {
      this.validateDeliveryAddress(dto.deliveryAddress);
      order.deliveryAddress = dto.deliveryAddress as any;
    }

    if (dto.distanceKm) {
      order.distanceKm = dto.distanceKm as any;
      order.estimatedDeliveryMinutes = dto.estimatedDeliveryMinutes || Math.max(20, dto.distanceKm * 4);
      const newDeliveryFee = dto.deliveryFee || this.calculateDeliveryFee(dto.distanceKm);
      if (!order.fees) order.fees = {} as any;
      order.fees.deliveryFee = newDeliveryFee;
      order.fees.totalAmount = (order.fees.subtotal || 0) + newDeliveryFee + (order.fees.serviceFee || 0) - (order.fees.discount || 0) + (order.fees.tax || 0);
      // update estimate
      const prepMins = (order as any).preparationMinutes || 20;
      (order as any).timing = order.timing || {};
      (order as any).timing.estimatedDeliveryTime = this.calculateEstimatedDeliveryTime(dto.distanceKm, prepMins);
    }

    await order.save();
    return order;
  }

  // ---------- restaurant list helper ----------
  async findRestaurantOrders(restaurantId: string, query: any) {
    const { page = 1, limit = 10, status } = query || {};
    const filter: any = { restaurant: new Types.ObjectId(restaurantId) };
    if (status) filter.status = status;
    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      this.orderModel.find(filter).sort({ 'timing.orderTime': -1 }).skip(skip).limit(Number(limit)).populate('user', 'name phone'),
      this.orderModel.countDocuments(filter),
    ]);
    return { data, pagination: { page: Number(page), limit: Number(limit), total } };
  }

  // ---------- findAll (admin) ----------
  async findAll(query: any) {
    const { page = 1, limit = 10, status, paymentMethod, paymentStatus } = query || {};
    const filter: any = {};
    if (status) filter.status = status;
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      this.orderModel.find(filter).sort({ 'timing.orderTime': -1 }).skip(skip).limit(Number(limit)).populate('user', 'name phone email').populate('restaurant', 'name address phone image').populate('shipper', 'name phone'),
      this.orderModel.countDocuments(filter),
    ]);
    return { data, pagination: { page: Number(page), limit: Number(limit), total } };
  }

  // ---------- user orders ----------
// imports: ensure orderDetailModel được InjectModel (bạn đã có)
async findByUser(userId: string, query: any) {
  const { page = 1, limit = 10, status } = query || {};
  const filter: any = { user: new Types.ObjectId(userId) };
  if (status) filter.status = status;
  const skip = (Number(page) - 1) * Number(limit);

  const [orders, total] = await Promise.all([
    this.orderModel
      .find(filter)
      .sort({ 'timing.orderTime': -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('restaurant', 'name address image'), // keep other populates if needed
    this.orderModel.countDocuments(filter),
  ]);

  // Lấy order details tương ứng (nếu bạn muốn trả về cùng payload)
  const orderIds = orders.map(o => o._id);
  const details = await this.orderDetailModel.find({ order: { $in: orderIds } }).populate('menuItem', 'name image title');

  // Nhóm details theo order id
  const detailsByOrder = details.reduce((acc, d: any) => {
    const k = d.order.toString();
    if (!acc[k]) acc[k] = [];
    acc[k].push(d);
    return acc;
  }, {} as Record<string, any[]>);

  // Gắn vào từng order object trả về
  const ordersWithDetails = orders.map(o => {
    const plain = o.toObject ? o.toObject() : (o as any);
    plain.orderDetails = detailsByOrder[o._id.toString()] || [];
    return plain;
  });

  return {
    data: ordersWithDetails,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
    },
  };
}


  // ---------- tracking ----------
  async getOrderTracking(orderId: string, requesterId: string) {
    if (!isValidObjectId(orderId)) throw new NotFoundException('ID đơn hàng không hợp lệ');
    const order = await this.orderModel.findById(orderId).populate('shipper', 'name phone');
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');

    const shipperLocation = (order as any).shipperLocation || ((order as any).shipper ? (order as any).shipper.location : null);
    const deliveryCoords = order.deliveryAddress?.coordinates || null;
    const tracking: any = {
      orderId: order._id.toString(),
      status: order.status,
      estimatedDeliveryTime: order.timing?.estimatedDeliveryTime,
      shipperLocation,
      deliveryAddress: { coordinates: deliveryCoords },
      distanceToDestination: null,
      estimatedTimeRemaining: null,
    };

    try {
      if (shipperLocation && Array.isArray(shipperLocation) && deliveryCoords && Array.isArray(deliveryCoords)) {
        const dist = this.haversineDistance(shipperLocation as [number, number], deliveryCoords as [number, number]);
        tracking.distanceToDestination = dist;
        tracking.estimatedTimeRemaining = Math.max(1, Math.round(dist * 4));
      }
    } catch (e) {
      // ignore
    }

    return tracking;
  }

  // ---------- restaurant confirm / status ----------
  async confirmOrder(orderId: string, restaurantId: string, dto: { preparationTime?: number; note?: string }) {
    if (!isValidObjectId(orderId)) throw new NotFoundException('ID đơn hàng không hợp lệ');
    const order = await this.orderModel.findById(orderId);
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
    if (order.restaurant?.toString() !== restaurantId?.toString()) throw new ForbiddenException('Bạn không có quyền thao tác đơn hàng này');
    if ((order.status as any) !== ((OrderStatus as any).PENDING || 'PENDING')) throw new BadRequestException(`Không thể xác nhận đơn hàng khi trạng thái là ${order.status}`);

    order.status = (OrderStatus as any).CONFIRMED || 'CONFIRMED';
    // store preparation minutes in flexible field
    (order as any).preparationMinutes = dto.preparationTime || (order as any).preparationMinutes || 20;
    // set preparingTime (schema uses preparingTime)
    (order as any).timing = order.timing || {};
    (order as any).timing.preparingTime = new Date();
    order.orderNote = dto.note || order.orderNote;

    if (typeof order.distanceKm === 'number') {
      const prepMins = (order as any).preparationMinutes || 20;
      (order as any).timing.estimatedDeliveryTime = this.calculateEstimatedDeliveryTime(order.distanceKm, prepMins);
    }

    await order.save();
    return order;
  }

  async updateOrderStatusByRestaurant(orderId: string, restaurantId: string, newStatus: any) {
    if (!isValidObjectId(orderId)) throw new NotFoundException('ID đơn hàng không hợp lệ');
    const order = await this.orderModel.findById(orderId);
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
    if (order.restaurant?.toString() !== restaurantId?.toString()) throw new ForbiddenException('Bạn không có quyền thao tác đơn hàng này');

    // do not enforce a strict enum transition map here (keeps type-safety problems away)
    order.status = newStatus;
    if (String(newStatus) === String((OrderStatus as any).PREPARING || 'PREPARING')) (order as any).timing.preparingTime = new Date();
    if (String(newStatus) === String((OrderStatus as any).READY || 'READY')) (order as any).timing.readyTime = new Date();

    await order.save();
    return order;
  }

  // ---------- shipper endpoints ----------
  async getAvailableOrdersForShipper(shipperId: string, query: any) {
    const { maxDistance = 10, lat, lng } = query || {};
    const filter: any = {
      status: { $in: [(OrderStatus as any).CONFIRMED || 'CONFIRMED', (OrderStatus as any).READY || 'READY'] },
      shipper: { $exists: false },
    };

    const orders = await this.orderModel.find(filter).sort({ 'timing.orderTime': 1 }).limit(100).populate('restaurant', 'name address');
    if (lat && lng) {
      const shipCoords: [number, number] = [Number(lng), Number(lat)];
      const maxD = Number(maxDistance);
      return orders.filter(o => {
        const coords = (o as any).deliveryAddress?.coordinates;
        if (!coords) return false;
        const dist = this.haversineDistance(shipCoords, coords as [number, number]);
        (o as any).distanceFromShipper = dist;
        return dist <= maxD;
      });
    }
    return orders;
  }

  async findShipperOrders(shipperId: string, query: any) {
    const { page = 1, limit = 10, status } = query || {};
    const filter: any = { shipper: new Types.ObjectId(shipperId) };
    if (status) filter.status = status;
    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      this.orderModel.find(filter).sort({ 'timing.orderTime': -1 }).skip(skip).limit(Number(limit)).populate('user', 'name phone').populate('restaurant', 'name'),
      this.orderModel.countDocuments(filter),
    ]);
    return { data, pagination: { page: Number(page), limit: Number(limit), total } };
  }

  async acceptOrderByShipper(orderId: string, shipperId: string) {
    if (!isValidObjectId(orderId)) throw new NotFoundException('ID đơn hàng không hợp lệ');
    const order = await this.orderModel.findById(orderId);
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
    if (![(OrderStatus as any).CONFIRMED || 'CONFIRMED', (OrderStatus as any).READY || 'READY'].includes(order.status as any)) {
      throw new BadRequestException(`Không thể nhận đơn khi trạng thái là ${order.status}`);
    }
    if (order.shipper) throw new BadRequestException('Đơn đã được giao cho shipper khác');

    order.shipper = new Types.ObjectId(shipperId) as any;
    order.status = (OrderStatus as any).ASSIGNED || 'ASSIGNED';
    (order as any).timing.assignedTime = new Date();

    await order.save();
    return order;
  }

  async updateShipperLocation(orderId: string, shipperId: string, coordinates: [number, number]) {
    if (!isValidObjectId(orderId)) throw new NotFoundException('ID đơn hàng không hợp lệ');
    const order = await this.orderModel.findById(orderId);
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
    if (!order.shipper || order.shipper.toString() !== shipperId.toString()) throw new ForbiddenException('Bạn không có quyền cập nhật vị trí cho đơn hàng này');

    (order as any).shipperLocation = coordinates;
    (order as any).timing.lastLocationUpdateAt = new Date();

    if (order.deliveryAddress?.coordinates) {
      const dist = this.haversineDistance(coordinates as [number, number], order.deliveryAddress.coordinates as [number, number]);
      (order as any).lastComputedDistanceToDestination = dist;
    }

    await order.save();
    return order;
  }

  async updateStatusByShipper(orderId: string, shipperId: string, newStatus: any) {
    if (!isValidObjectId(orderId)) throw new NotFoundException('ID đơn hàng không hợp lệ');
    const order = await this.orderModel.findById(orderId);
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
    if (!order.shipper || order.shipper.toString() !== shipperId.toString()) throw new ForbiddenException('Bạn không có quyền cập nhật trạng thái cho đơn này');

    order.status = newStatus;
    if (String(newStatus) === String((OrderStatus as any).PICKED_UP || 'PICKED_UP')) (order as any).timing.pickedUpTime = new Date();
    if (String(newStatus) === String((OrderStatus as any).DELIVERED || 'DELIVERED')) (order as any).timing.deliveredTime = new Date();

    await order.save();
    return order;
  }

  // ---------- admin actions ----------
  async update(orderId: string, dto: UpdateOrderDto) {
    if (!isValidObjectId(orderId)) throw new NotFoundException('ID không hợp lệ');
    const order = await this.orderModel.findById(orderId);
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
    Object.keys(dto || {}).forEach(k => (order as any)[k] = (dto as any)[k]);
    await order.save();
    return order;
  }

  async remove(orderId: string) {
    if (!isValidObjectId(orderId)) throw new NotFoundException('ID không hợp lệ');
    const res = await this.orderModel.deleteOne({ _id: orderId });
    return { success: res.deletedCount === 1 };
  }

  async assignShipper(orderId: string, shipperId: string) {
    if (!isValidObjectId(orderId) || !isValidObjectId(shipperId)) throw new NotFoundException('ID không hợp lệ');
    const order = await this.orderModel.findById(orderId);
    const shipper = await this.shipperModel.findById(shipperId);
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
    if (!shipper) throw new NotFoundException('Không tìm thấy shipper');

    order.shipper = new Types.ObjectId(shipperId) as any;
    order.status = (OrderStatus as any).ASSIGNED || 'ASSIGNED';
    (order as any).timing.assignedTime = new Date();

    await order.save();
    return order;
  }

  async processRefund(orderId: string, refundAmount: number, reason: string) {
    if (!isValidObjectId(orderId)) throw new NotFoundException('ID không hợp lệ');
    const order = await this.orderModel.findById(orderId);
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');

    order.paymentStatus = (PaymentStatus as any).REFUNDED || PaymentStatus.PENDING;
    (order as any).refunds = (order as any).refunds || [];
    (order as any).refunds.push({ amount: refundAmount, reason, refundedAt: new Date() });
    order.fees = order.fees || ({} as any);
    order.fees.totalAmount = (order.fees.totalAmount || 0) - (refundAmount || 0);

    await order.save();
    return order;
  }

  // ---------- rating & cancel ----------
  async rateOrder(orderId: string, userId: string, dto: RateOrderDto) {
    if (!isValidObjectId(orderId)) throw new NotFoundException('ID không hợp lệ');
    const order = await this.orderModel.findOne({ _id: orderId, user: new Types.ObjectId(userId) });
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
    if (order.status !== ((OrderStatus as any).DELIVERED || 'DELIVERED')) throw new BadRequestException('Chỉ có thể đánh giá đơn hàng đã giao thành công');
    if ((order as any).rating) throw new BadRequestException('Đơn hàng này đã được đánh giá');

    (order as any).rating = dto.rating;
    (order as any).ratingComment = dto.comment;
    (order as any).ratingTime = new Date();
    await order.save();
    return order;
  }

  async cancelOrder(orderId: string, userId: string, dto: CancelOrderDto) {
    if (!isValidObjectId(orderId)) throw new NotFoundException('ID không hợp lệ');
    const order = await this.orderModel.findOne({ _id: orderId, user: new Types.ObjectId(userId) });
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');

    const cancellable = [
      (OrderStatus as any).PENDING || 'PENDING',
      (OrderStatus as any).CONFIRMED || 'CONFIRMED',
      (OrderStatus as any).PREPARING || 'PREPARING',
    ];
    if (!cancellable.includes(order.status as any)) throw new BadRequestException(`Không thể hủy đơn hàng ở trạng thái ${order.status}`);

    order.status = (OrderStatus as any).CANCELLED || 'CANCELLED';
    (order as any).cancellationReason = dto.reason;
    (order as any).cancelledBy = dto.cancelledBy || 'user';
    (order as any).cancelledTime = new Date();

    if (order.paymentStatus === PaymentStatus.PAID) {
      order.paymentStatus = (PaymentStatus as any).REFUND_PENDING || PaymentStatus.PAID;
      (order as any).refunds = (order as any).refunds || [];
      (order as any).refunds.push({ amount: order.fees?.totalAmount || 0, reason: 'Auto refund for cancelled order', requestedAt: new Date() });
    }

    await order.save();
    return order;
  }
    async findOne(id: string): Promise<OrderDocument> {
    if (!isValidObjectId(id)) throw new NotFoundException('ID đơn hàng không hợp lệ');
    const order = await this.orderModel
      .findById(id)
      .populate('user', 'name phone email')
      .populate('restaurant')
      .populate('shipper', 'name phone');
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
    return order;
  }

  // ---------- analytics ----------
  async getRevenueAnalytics(query: any, user: any) {
    const { startDate, endDate, restaurantId, period = 'day' } = query || {};
    const match: any = { status: (OrderStatus as any).DELIVERED || 'DELIVERED' };

    if (startDate) match['timing.orderTime'] = { $gte: new Date(startDate) };
    if (endDate) match['timing.orderTime'] = match['timing.orderTime'] ? { ...match['timing.orderTime'], $lte: new Date(endDate) } : { $lte: new Date(endDate) };
    if (restaurantId) match.restaurant = new Types.ObjectId(restaurantId);

    let groupId: any;
    if (period === 'month') groupId = { year: { $year: '$timing.orderTime' }, month: { $month: '$timing.orderTime' } };
    else if (period === 'week') groupId = { year: { $year: '$timing.orderTime' }, week: { $week: '$timing.orderTime' } };
    else groupId = { year: { $year: '$timing.orderTime' }, month: { $month: '$timing.orderTime' }, day: { $dayOfMonth: '$timing.orderTime' } };

    const pipeline: PipelineStage[] = [];
    pipeline.push({ $match: match } as any);
    pipeline.push({
      $group: {
        _id: groupId,
        revenue: { $sum: '$fees.totalAmount' },
        orders: { $sum: 1 },
        avgOrderValue: { $avg: '$fees.totalAmount' },
      },
    } as any);

    const sortObj: any = {};
    if (period === 'month') { sortObj['_id.year'] = 1; sortObj['_id.month'] = 1; }
    else if (period === 'week') { sortObj['_id.year'] = 1; sortObj['_id.week'] = 1; }
    else { sortObj['_id.year'] = 1; sortObj['_id.month'] = 1; sortObj['_id.day'] = 1; }

    pipeline.push({ $sort: sortObj } as any);

    const res = await this.orderModel.aggregate(pipeline as any);
    return res;
  }

  async getPerformanceAnalytics(query: any) {
    const match: any = {};
    if (query.startDate) match['timing.orderTime'] = { $gte: new Date(query.startDate) };
    if (query.endDate) match['timing.orderTime'] = match['timing.orderTime'] ? { ...match['timing.orderTime'], $lte: new Date(query.endDate) } : { $lte: new Date(query.endDate) };

    const pipeline: PipelineStage[] = [
      { $match: match } as any,
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          deliveredCount: { $sum: { $cond: [{ $eq: ['$status', (OrderStatus as any).DELIVERED || 'DELIVERED'] }, 1, 0] } },
          cancelledCount: { $sum: { $cond: [{ $eq: ['$status', (OrderStatus as any).CANCELLED || 'CANCELLED'] }, 1, 0] } },
          avgFulfillmentMinutes: {
            $avg: {
              $divide: [{ $subtract: ['$timing.deliveredTime', '$timing.orderTime'] }, 1000 * 60],
            },
          },
        },
      } as any,
    ];

    const agg = await this.orderModel.aggregate(pipeline as any);
    return agg[0] || { totalOrders: 0, deliveredCount: 0, cancelledCount: 0, avgFulfillmentMinutes: null };
  }
}
