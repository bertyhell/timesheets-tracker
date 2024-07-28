import { Test, type TestingModule } from '@nestjs/testing';
import { AutoTagsService } from './auto-tags.service';

describe('TagNamesService', () => {
  let service: AutoTagsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AutoTagsService],
    }).compile();

    service = module.get<AutoTagsService>(AutoTagsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
