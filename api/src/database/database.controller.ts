import { Controller } from '@nestjs/common';

import { type DatabaseService } from './database.service';

@Controller('api/database')
export class DatabaseController {
  constructor(private readonly databaseService: DatabaseService) {}
}
