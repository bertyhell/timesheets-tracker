import { PartialType } from '@nestjs/mapped-types';
import { CreateActiveStateDto } from './create-active-state.dto';

export class UpdateActiveStateDto extends PartialType(CreateActiveStateDto) {}
