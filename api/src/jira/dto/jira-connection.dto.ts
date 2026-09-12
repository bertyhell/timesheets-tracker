import { ApiProperty } from '@nestjs/swagger';

export class JiraConnectionDto {
  @ApiProperty({
    type: Boolean,
    description: 'Whether the configured base url, email and API token can reach Jira',
  })
  ok: boolean;

  @ApiProperty({
    type: String,
    description: 'What could not be checked, on an otherwise successful connection',
    example: 'Ticket access could not be checked: no page on this Jira site has been visited yet.',
    required: false,
    nullable: true,
  })
  warning?: string;

  @ApiProperty({
    type: String,
    description: 'Why the connection failed, when it did',
    example: 'Jira request failed: 401 — Unauthorized',
    required: false,
    nullable: true,
  })
  error?: string;
}
