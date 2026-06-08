import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Liveness probe', description: 'Returns a static string. Used by Docker/Kubernetes to verify the process is alive. This service is a stub — routing/ETA endpoints have not been implemented yet.' })
  @ApiResponse({ status: 200, description: 'Service is alive.', schema: { type: 'string', example: 'Hello World!' } })
  getHello(): string {
    return this.appService.getHello();
  }
}
