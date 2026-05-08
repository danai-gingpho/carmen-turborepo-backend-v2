import { describe, it, expect } from 'bun:test';
import { parseControllerSource } from '../parser/controller';

const simpleController = `
import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';

@Controller('good-received-note')
export class GoodReceivedNoteController {
  @Get()
  findAll(@Query('limit') limit: string) { return []; }

  @Get(':id')
  findOne(@Param('id') id: string) { return {}; }

  @Post()
  createOne(@Body() dto: CreateGrnDto) { return {}; }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateGrnDto) { return {}; }

  @Delete(':id')
  remove(@Param('id') id: string) { return {}; }
}
`;

describe('parseControllerSource', () => {
  it('extracts all HTTP method endpoints', () => {
    const endpoints = parseControllerSource(simpleController, '/fake/grn.controller.ts', '');
    expect(endpoints).toHaveLength(5);
    expect(endpoints.map((e) => e.method).sort()).toEqual(['DELETE', 'GET', 'GET', 'PATCH', 'POST']);
  });

  it('joins controller prefix with method path', () => {
    const endpoints = parseControllerSource(simpleController, '/fake/grn.controller.ts', '');
    const findOne = endpoints.find((e) => e.methodName === 'findOne')!;
    expect(findOne.fullPath).toBe('/good-received-note/:id');
  });

  it('prepends global prefix when provided', () => {
    const endpoints = parseControllerSource(simpleController, '/fake/grn.controller.ts', 'api');
    const findAll = endpoints.find((e) => e.methodName === 'findAll')!;
    expect(findAll.fullPath).toBe('/api/good-received-note');
  });

  it('collects path params from @Param decorators', () => {
    const endpoints = parseControllerSource(simpleController, '/fake/grn.controller.ts', '');
    const findOne = endpoints.find((e) => e.methodName === 'findOne')!;
    expect(findOne.pathParams).toEqual(['id']);
  });

  it('collects query params from @Query decorators', () => {
    const endpoints = parseControllerSource(simpleController, '/fake/grn.controller.ts', '');
    const findAll = endpoints.find((e) => e.methodName === 'findAll')!;
    expect(findAll.queryParams).toEqual(['limit']);
  });

  it('captures body DTO class name', () => {
    const endpoints = parseControllerSource(simpleController, '/fake/grn.controller.ts', '');
    const createOne = endpoints.find((e) => e.methodName === 'createOne')!;
    expect(createOne.bodyDto).toBe('CreateGrnDto');
  });

  it('marks method as non-public when no @Public decorator', () => {
    const endpoints = parseControllerSource(simpleController, '/fake/grn.controller.ts', '');
    expect(endpoints.every((e) => e.isPublic === false)).toBe(true);
  });
});

describe('controller edge cases', () => {
  it('handles empty @Controller() with no argument', () => {
    const src = `
      import { Controller, Get } from '@nestjs/common';
      @Controller()
      export class RootController {
        @Get('health') health() { return 'ok'; }
      }
    `;
    const endpoints = parseControllerSource(src, '/fake/root.controller.ts', '');
    expect(endpoints).toHaveLength(1);
    expect(endpoints[0].fullPath).toBe('/health');
  });

  it('handles multi-segment controller path with params', () => {
    const src = `
      @Controller('bu/:bu_code/grn')
      export class BuGrnController {
        @Get(':id') findOne(@Param('bu_code') bu: string, @Param('id') id: string) {}
      }
    `;
    const endpoints = parseControllerSource(src, '/fake/bu-grn.controller.ts', '');
    expect(endpoints[0].fullPath).toBe('/bu/:bu_code/grn/:id');
    expect(endpoints[0].pathParams.sort()).toEqual(['bu_code', 'id']);
  });

  it('detects @Public() decorator', () => {
    const src = `
      @Controller('auth')
      export class AuthController {
        @Public()
        @Post('login') login() {}
      }
    `;
    const endpoints = parseControllerSource(src, '/fake/auth.controller.ts', '');
    expect(endpoints[0].isPublic).toBe(true);
  });

  it('captures array body DTO without brackets', () => {
    const src = `
      @Controller('batch')
      export class BatchController {
        @Post() bulk(@Body() dtos: CreateXDto[]) {}
      }
    `;
    const endpoints = parseControllerSource(src, '/fake/batch.controller.ts', '');
    expect(endpoints[0].bodyDto).toBe('CreateXDto');
  });

  it('ignores non-HTTP methods on controller class', () => {
    const src = `
      @Controller('x')
      export class XController {
        private helperFn() {}
        @Get() list() {}
      }
    `;
    const endpoints = parseControllerSource(src, '/fake/x.controller.ts', '');
    expect(endpoints).toHaveLength(1);
    expect(endpoints[0].methodName).toBe('list');
  });

  it('extracts moduleSlug from file path under application/', () => {
    const src = `
      @Controller('grn') export class X { @Get() list() {} }
    `;
    const path = '/repo/apps/backend-gateway/src/application/good-received-note/grn.controller.ts';
    const endpoints = parseControllerSource(src, path, '');
    expect(endpoints[0].module).toBe('application/good-received-note');
    expect(endpoints[0].moduleSlug).toBe('good-received-note');
  });
});
