import { PartialType } from '@nestjs/swagger';

import { CreateAutoTagDto } from './create-auto-tag.dto';

export class UpdateAutoTagsDto extends PartialType(CreateAutoTagDto) {
  id: string;
}
