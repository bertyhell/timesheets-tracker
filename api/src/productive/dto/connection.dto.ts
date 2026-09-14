import { ApiProperty } from '@nestjs/swagger';

export class ProductiveConnectionDto {
  @ApiProperty({
    type: Boolean,
    description:
      'Whether the configured base url, organisation id, user id and token can reach Productive',
  })
  ok: boolean;

  @ApiProperty({
    type: String,
    description: 'Name of the Productive person the configured user id belongs to',
    example: 'Jane Doe',
    required: false,
    nullable: true,
  })
  name?: string;

  @ApiProperty({
    type: String,
    description: 'Why the connection failed, when it did',
    example: 'Productive people request failed: 401 — Unauthorized',
    required: false,
    nullable: true,
  })
  error?: string;
}
