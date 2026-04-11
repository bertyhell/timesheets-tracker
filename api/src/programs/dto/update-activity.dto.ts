import { PartialType } from '@nestjs/mapped-types';
import { CreateProgramDto } from './create-activity.dto';

export class UpdateProgramDto extends PartialType(CreateProgramDto) {}
