import { PartialType } from '@nestjs/swagger';

import { CreateAutoNoteDto } from './create-auto-note.dto';

export class UpdateAutoNoteDto extends PartialType(CreateAutoNoteDto) {}
