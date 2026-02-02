import { Controller, Get, Post, Put, Delete, Body, Param, Res, HttpCode, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { ConfigCronjobService } from './config_cronjob.service';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { BaseHttpController } from '@/common';
import { CreateCronjobDto } from './dto/create-cronjob.dto';
import { UpdateCronjobDto } from './dto/update-cronjob.dto';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';


@ApiTags('Config - Cronjob')
@ApiHeaderRequiredXAppId()
@Controller('api/config/cronjobs')
export class ConfigCronjobController extends BaseHttpController {
  constructor(private readonly configCronjobService: ConfigCronjobService) {
    super();
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all cron jobs', description: 'Retrieves a list of all configured cron jobs' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved all cron jobs' })
  @ApiResponse({ status: 503, description: 'Failed to connect to cronjob service' })
  async getAll(@Res() res: Response): Promise<void> {
    // Call the getAll method from the configCronjobService
    console.log('Fetching all cron jobs');
    const result = await this.configCronjobService.getAll();
    this.respond(res, result);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get cron job by ID', description: 'Retrieves a specific cron job by its ID' })
  @ApiParam({ name: 'id', description: 'Cron job ID', example: 'cron_123' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved cron job' })
  @ApiResponse({ status: 404, description: 'Cron job not found' })
  @ApiResponse({ status: 503, description: 'Failed to connect to cronjob service' })
  async getById(@Param('id') id: string, @Res() res: Response): Promise<void> {
    const result = await this.configCronjobService.getById(id);
    this.respond(res, result);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new cron job', description: 'Creates a new cron job with the specified configuration' })
  @ApiBody({ type: CreateCronjobDto })
  @ApiResponse({ status: 201, description: 'Cron job created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({ status: 503, description: 'Failed to connect to cronjob service' })
  async create(@Body() body: CreateCronjobDto, @Res() res: Response): Promise<void> {
    const result = await this.configCronjobService.create(body);
    this.respond(res, result, HttpStatus.CREATED);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update cron job', description: 'Updates an existing cron job configuration' })
  @ApiParam({ name: 'id', description: 'Cron job ID', example: 'cron_123' })
  @ApiBody({ type: UpdateCronjobDto })
  @ApiResponse({ status: 200, description: 'Cron job updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({ status: 404, description: 'Cron job not found' })
  @ApiResponse({ status: 503, description: 'Failed to connect to cronjob service' })
  async update(@Param('id') id: string, @Body() body: UpdateCronjobDto, @Res() res: Response): Promise<void> {
    const result = await this.configCronjobService.update(id, body);
    this.respond(res, result);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete cron job', description: 'Deletes a cron job and removes it from the scheduler' })
  @ApiParam({ name: 'id', description: 'Cron job ID', example: 'cron_123' })
  @ApiResponse({ status: 200, description: 'Cron job deleted successfully' })
  @ApiResponse({ status: 404, description: 'Cron job not found' })
  @ApiResponse({ status: 503, description: 'Failed to connect to cronjob service' })
  async delete(@Param('id') id: string, @Res() res: Response): Promise<void> {
    const result = await this.configCronjobService.delete(id);
    this.respond(res, result);
  }

  @Post(':id/start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start cron job', description: 'Activates and starts a cron job' })
  @ApiParam({ name: 'id', description: 'Cron job ID', example: 'cron_123' })
  @ApiResponse({ status: 200, description: 'Cron job started successfully' })
  @ApiResponse({ status: 404, description: 'Cron job not found' })
  @ApiResponse({ status: 503, description: 'Failed to connect to cronjob service' })
  async start(@Param('id') id: string, @Res() res: Response): Promise<void> {
    const result = await this.configCronjobService.start(id);
    this.respond(res, result);
  }

  @Post(':id/stop')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stop cron job', description: 'Deactivates and stops a running cron job' })
  @ApiParam({ name: 'id', description: 'Cron job ID', example: 'cron_123' })
  @ApiResponse({ status: 200, description: 'Cron job stopped successfully' })
  @ApiResponse({ status: 404, description: 'Cron job not found' })
  @ApiResponse({ status: 503, description: 'Failed to connect to cronjob service' })
  async stop(@Param('id') id: string, @Res() res: Response): Promise<void> {
    const result = await this.configCronjobService.stop(id);
    this.respond(res, result);
  }

  @Post(':id/execute')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Execute cron job immediately', description: 'Manually triggers a cron job to run immediately' })
  @ApiParam({ name: 'id', description: 'Cron job ID', example: 'cron_123' })
  @ApiResponse({ status: 200, description: 'Cron job executed successfully' })
  @ApiResponse({ status: 404, description: 'Cron job not found' })
  @ApiResponse({ status: 503, description: 'Failed to connect to cronjob service' })
  async execute(@Param('id') id: string, @Res() res: Response): Promise<void> {
    const result = await this.configCronjobService.execute(id);
    this.respond(res, result);
  }

  @Get('debug/memory')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get active jobs in memory', description: 'Retrieves all currently active cron jobs loaded in memory' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved active jobs in memory' })
  @ApiResponse({ status: 503, description: 'Failed to connect to cronjob service' })
  async getActiveInMemory(@Res() res: Response): Promise<void> {
    const result = await this.configCronjobService.getActiveInMemory();
    this.respond(res, result);
  }
}
