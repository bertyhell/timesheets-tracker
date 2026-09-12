import { ApiProperty } from '@nestjs/swagger';

export class JiraConnectionDto {
  @ApiProperty({
    type: Boolean,
    description: 'Whether the configured base url, email and API token can reach Jira',
  })
  ok: boolean;

  @ApiProperty({
    type: String,
    description: 'Display name of the Atlassian account the token belongs to',
    example: 'Jane Doe',
    required: false,
    nullable: true,
  })
  displayName?: string;

  @ApiProperty({
    type: String,
    description: 'Why the connection failed, when it did',
    example: 'Jira request failed: 401 — Unauthorized',
    required: false,
    nullable: true,
  })
  error?: string;
}
