import { Test, type TestingModule } from '@nestjs/testing';
import { TagNamesService } from './tag-names.service';

describe('TagNamesService', () => {
  let service: TagNamesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TagNamesService],
    }).compile();

    service = module.get<TagNamesService>(TagNamesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
