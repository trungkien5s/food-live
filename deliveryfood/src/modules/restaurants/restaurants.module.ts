import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RestaurantsService } from './restaurants.service';
import { Restaurant, RestaurantSchema } from './schemas/restaurant.schema';
import { RestaurantsController } from './restaurants.controller';
import { CloudinaryModule } from '@/cloudinary/cloudinary.module';
import { MulterModule } from '@nestjs/platform-express';

import { Menu, MenuSchema } from '@/modules/menus/schemas/menu.schema';
import { MenuItem, MenuItemSchema } from '@/modules/menu.items/schemas/menu.item.schema';
import { Cart, CartSchema } from '../carts/schemas/carts.schema';
import { CartItem, CartItemSchema } from '../cart.items/schemas/cart.items.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Restaurant.name, schema: RestaurantSchema },
      { name: Menu.name, schema: MenuSchema },
      { name: MenuItem.name, schema: MenuItemSchema },
      { name: Cart.name, schema: CartSchema },   
      { name: CartItem.name, schema: CartItemSchema }, 
    ]),
    CloudinaryModule,
    MulterModule.register({
      dest: './uploads/restaurants',
    }),
  ],
  controllers: [RestaurantsController],
  providers: [RestaurantsService],
  exports: [RestaurantsService], // ✅ hữu ích nếu module khác cần gọi
})
export class RestaurantsModule {}
