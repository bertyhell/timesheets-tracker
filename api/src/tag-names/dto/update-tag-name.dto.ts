import { PartialType } from '@nestjs/swagger';

import { CreateTagNameDto } from './create-tag-name.dto';

export class UpdateTagNameDto extends PartialType(CreateTagNameDto) {}
