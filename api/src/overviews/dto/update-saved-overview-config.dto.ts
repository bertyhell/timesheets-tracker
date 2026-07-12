import { PartialType } from '@nestjs/swagger';
import { CreateSavedOverviewConfigDto } from './create-saved-overview-config.dto';

export class UpdateSavedOverviewConfigDto extends PartialType(CreateSavedOverviewConfigDto) {}
