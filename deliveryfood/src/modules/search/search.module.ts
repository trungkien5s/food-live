import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { Restaurant, RestaurantSchema } from '@/modules/restaurants/schemas/restaurant.schema';
import { MenuItem, MenuItemSchema } from '@/modules/menu.items/schemas/menu.item.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Restaurant.name, schema: RestaurantSchema },
      { name: MenuItem.name, schema: MenuItemSchema },
    ])
  ],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
