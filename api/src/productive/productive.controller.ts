import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ProductiveService } from './productive.service';
import { ProductiveCompanyDto } from './dto/company.dto';
import { ProductiveDealDto } from './dto/deal.dto';
import { ProductiveServiceDto } from './dto/service.dto';
import { ProductiveServiceTreeNodeDto } from './dto/service-tree.dto';
import { SyncTimeEntriesDto, SyncTimeEntriesResultDto } from './dto/sync-time-entries.dto';

@ApiTags('productive')
@Controller('api/productive')
export class ProductiveController {
  constructor(private readonly productiveService: ProductiveService) {}

  @ApiOkResponse({ type: ProductiveCompanyDto, isArray: true })
  @Get('companies')
  getCompanies(): Promise<ProductiveCompanyDto[]> {
    return this.productiveService.getCompanies();
  }

  @ApiOkResponse({ type: ProductiveDealDto, isArray: true })
  @ApiQuery({ type: 'string', name: 'companyId', required: true })
  @Get('deals')
  getDeals(@Query('companyId') companyId: string): Promise<ProductiveDealDto[]> {
    return this.productiveService.getDealsByCompany(companyId);
  }

  @ApiOkResponse({ type: ProductiveServiceDto, isArray: true })
  @ApiQuery({ type: 'string', name: 'dealId', required: true })
  @ApiQuery({ type: 'string', name: 'date', required: true, example: '2026-07-17' })
  @Get('services')
  getServices(
    @Query('dealId') dealId: string,
    @Query('date') date: string
  ): Promise<ProductiveServiceDto[]> {
    return this.productiveService.getServicesByDeal(dealId, date);
  }

  @ApiOkResponse({ type: ProductiveServiceTreeNodeDto, isArray: true })
  @ApiQuery({ type: 'string', name: 'date', required: true, example: '2026-07-17' })
  @ApiQuery({ type: 'string', name: 'q', required: false, description: 'Server-side search query' })
  @Get('service-tree')
  getServiceTree(
    @Query('date') date: string,
    @Query('q') q?: string
  ): Promise<ProductiveServiceTreeNodeDto[]> {
    return this.productiveService.getServiceTree(date, q ?? '');
  }

  @ApiOkResponse({ type: SyncTimeEntriesResultDto })
  @Post('sync')
  sync(@Body() dto: SyncTimeEntriesDto): Promise<SyncTimeEntriesResultDto> {
    return this.productiveService.createTimeEntries(dto.date, dto.entries);
  }
}
