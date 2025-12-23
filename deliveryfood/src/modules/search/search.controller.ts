import { Controller, Get, Query } from '@nestjs/common';
import { SearchQueryDto } from './dto/search.dto';
import { ApiTags, ApiQuery } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { Public } from '@/decorator/customize';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

@Get()
@Public()
  async search(@Query() q: SearchQueryDto) {
    return this.searchService.search(q);
  }

  @Get('/setup-search')
  @Public()
    async setupSearch() {
  await this.searchService.setupSearchIndexes();
  await this.searchService.rebuildSearchData();
  return { message: 'Search setup completed!' };
}
}
