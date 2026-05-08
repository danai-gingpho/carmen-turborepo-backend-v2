import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { NewsService } from './news.service';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateNewsRequestDto, UpdateNewsRequestDto } from './swagger/request';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import {
  ApiUserFilterQueries,
  ApiVersionMinRequest,
} from 'src/common/decorator/userfilter.decorator';
import { IPaginateQuery, PaginateQuery } from 'src/shared-dto/paginate.dto';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';
import { BaseHttpController, EnrichAuditUsers } from '@/common';

@Controller('/api/news')
@ApiTags('Reports: News')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class NewsController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    NewsController.name,
  );

  constructor(private readonly newsService: NewsService) {
    super();
  }

  /**
   * List all news articles
   * ค้นหารายการข่าวสารทั้งหมด
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param query - Pagination query / คำค้นหาการแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated list of news / รายการข่าวสารแบบแบ่งหน้า
   */
  @Get()
  @UseGuards(new AppIdGuard('news.findAll'))
  @EnrichAuditUsers()
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all news',
    description: 'Retrieves all internal announcements and news articles published within the business unit, used to communicate operational updates, policy changes, and important notices to hotel staff.',
    'x-description-th': 'แสดงรายการข่าวสารทั้งหมดพร้อมการแบ่งหน้าและค้นหา',
    operationId: 'findAllNews',
    responses: {
      200: { description: 'News list retrieved successfully' },
    },
  } as any)
  async findAll(
    @Req() req: Request,
    @Res() res: Response,
    @Query() query: IPaginateQuery,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
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

  /**
   * Find a news article by ID
   * ค้นหาข่าวสารรายการเดียวตาม ID
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param id - News article ID / รหัสข่าวสาร
   * @param version - API version / เวอร์ชัน API
   * @returns News article details / รายละเอียดข่าวสาร
   */
  @Get(':id')
  @UseGuards(new AppIdGuard('news.findOne'))
  @EnrichAuditUsers()
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get a news by ID',
    description: 'Retrieves a specific internal announcement or news article by its ID, including its full content, publication date, and target audience within the business unit.',
    'x-description-th': 'ดึงข้อมูลข่าวสารรายการเดียวตาม ID',
    operationId: 'findOneNews',
    responses: {
      200: { description: 'News article retrieved successfully' },
      404: { description: 'News article not found' },
    },
  } as any)
  async findOne(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
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

  /**
   * Create a new news article
   * สร้างข่าวสารใหม่
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param createNewsDto - News data to create / ข้อมูลข่าวสารที่จะสร้าง
   * @param version - API version / เวอร์ชัน API
   * @returns Created news article / ข่าวสารที่สร้างแล้ว
   */
  @Post()
  @UseGuards(new AppIdGuard('news.create'))
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a news',
    description: 'Publishes a new internal announcement or news article to inform business unit users about operational updates, procurement policy changes, or other important hotel-wide notices.',
    'x-description-th': 'สร้างข่าวสารใหม่',
    operationId: 'createNews',
    responses: {
      201: { description: 'News article created successfully' },
      400: { description: 'Bad request' },
    },
  })
  @ApiBody({ type: CreateNewsRequestDto })
  async create(
    @Req() req: Request,
    @Res() res: Response,
    @Body() createNewsDto: Record<string, unknown>,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
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

  /**
   * Update a news article by ID
   * อัปเดตข่าวสารตาม ID
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param id - News article ID / รหัสข่าวสาร
   * @param updateNewsDto - News data to update / ข้อมูลข่าวสารที่จะอัปเดต
   * @param version - API version / เวอร์ชัน API
   * @returns Updated news article / ข่าวสารที่อัปเดตแล้ว
   */
  @Put(':id')
  @UseGuards(new AppIdGuard('news.update'))
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update a news by ID',
    description: 'Modifies an existing internal announcement or news article, allowing administrators to correct content, update details, or change the publication scope within the business unit.',
    'x-description-th': 'อัปเดตข้อมูลข่าวสารที่มีอยู่',
    operationId: 'updateNews',
    responses: {
      200: { description: 'News article updated successfully' },
      404: { description: 'News article not found' },
    },
  })
  @ApiBody({ type: UpdateNewsRequestDto })
  async update(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateNewsDto: Record<string, unknown>,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
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

  /**
   * Delete a news article by ID
   * ลบข่าวสารตาม ID
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param id - News article ID / รหัสข่าวสาร
   * @param version - API version / เวอร์ชัน API
   * @returns Delete result / ผลลัพธ์การลบ
   */
  @Delete(':id')
  @UseGuards(new AppIdGuard('news.delete'))
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a news by ID',
    description: 'Removes an internal announcement or news article from the business unit, archiving it so it is no longer visible to staff.',
    'x-description-th': 'ลบข่าวสารตาม ID',
    operationId: 'deleteNews',
    responses: {
      200: { description: 'News article deleted successfully' },
      404: { description: 'News article not found' },
    },
  } as any)
  async delete(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
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
