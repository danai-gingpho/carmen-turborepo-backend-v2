import {
  Body,
  Request,
  Response,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { NewsService } from './news.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import { TenantHeaderGuard } from 'src/common/guard/tenant-header.guard';
import {
  ApiUserFilterQueries,
  ApiVersionMinRequest,
} from 'src/common/decorator/userfilter.decorator';
import { IPaginateQuery, PaginateQuery } from 'src/shared-dto/paginate.dto';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';
import { BaseHttpController } from '@/common';

@Controller('/api/news')
@ApiTags('Application - News')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard, TenantHeaderGuard)
@ApiBearerAuth()
export class NewsController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    NewsController.name,
  );

  constructor(private readonly newsService: NewsService) {
    super();
  }

  @Get()
  @UseGuards(new AppIdGuard('news.findAll'))
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all news',
    description: 'Get all news',
    tags: ['[Method] Get'],
  })
  async findAll(
    @Req() req: Request,
    @Res() res: Response,
    @Query() query: IPaginateQuery,
    @Query('version') version: string = 'latest',
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'findAll',
        query,
        version,
      },
      NewsController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    
    const result = await this.newsService.findAll(user_id, paginate, version);
    this.respond(res, result);
  }

  @Get(':id')
  @UseGuards(new AppIdGuard('news.findOne'))
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get a news by ID',
    description: 'Retrieve a news by its unique identifier',
    tags: ['[Method] Get'],
  })
  async findOne(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
    @Query('version') version: string = 'latest',
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'findOne',
        id,
        version,
      },
      NewsController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.newsService.findOne(id, user_id, version);
    this.respond(res, result);
  }

  @Post()
  @UseGuards(new AppIdGuard('news.create'))
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a news',
    description: 'Create a new news item',
    tags: ['[Method] Post'],
  })
  async create(
    @Req() req: Request,
    @Res() res: Response,
    @Body() createNewsDto: any,
    @Query('version') version: string = 'latest',
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'create',
        createNewsDto,
        version,
      },
      NewsController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.newsService.create(
      createNewsDto,
      user_id,
      version,
    );
    this.respond(res, result);
  }

  @Put(':id')
  @UseGuards(new AppIdGuard('news.update'))
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update a news by ID',
    description: 'Update an existing news item by its unique identifier',
    tags: ['[Method] Put'],
  })
  async update(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
    @Body() updateNewsDto: any,
    @Query('version') version: string = 'latest',
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'update',
        id,
        updateNewsDto,
        version,
      },
      NewsController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.newsService.update(
      id,
      updateNewsDto,
      user_id,
      version,
    );
    this.respond(res, result);
  }

  @Delete(':id')
  @UseGuards(new AppIdGuard('news.delete'))
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a news by ID',
    description: 'Delete a news item by its unique identifier',
    tags: ['[Method] Delete'],
  })
  async delete(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
    @Query('version') version: string = 'latest',
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'delete',
        id,
        version,
      },
      NewsController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.newsService.delete(id, user_id, version);
    this.respond(res, result);
  }
}
