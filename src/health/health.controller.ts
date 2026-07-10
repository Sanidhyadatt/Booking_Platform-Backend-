import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ResponseMessage } from '../common/decorators/response-message.decorator';

@ApiTags('Health Check')
@Controller({
  path: 'health',
  version: VERSION_NEUTRAL,
})
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Check API and Database status (Public)' })
  @ApiResponse({ status: 200, description: 'Service health check status report' })
  @ResponseMessage('Health status retrieved successfully')
  async getHealth() {
    let dbStatus = 'down';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbStatus = 'up';
    } catch (e) {
      console.error('Database health check failed:', e);
    }

    return {
      status: 'up',
      database: dbStatus,
      uptime: Math.floor(process.uptime()),
      version: '1.0.0',
    };
  }
}
