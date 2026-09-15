import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { JiraConnectionDto } from './dto/jira-connection.dto';
import { JiraService } from './jira.service';

@ApiTags('jira')
@Controller('api/jira')
export class JiraController {
  constructor(private readonly jiraService: JiraService) {}

  @ApiOkResponse({
    description:
      'Check whether the configured Jira credentials work. Returns ok:false with the reason rather than an error status, so the settings form can show it.',
    type: JiraConnectionDto,
  })
  @Get('test-connection')
  testConnection(): Promise<JiraConnectionDto> {
    return this.jiraService.testConnection();
  }
}
