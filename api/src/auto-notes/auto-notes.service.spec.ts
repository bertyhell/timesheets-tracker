import { Test, type TestingModule } from '@nestjs/testing';
import { AutoNotesService } from './auto-notes.service';

describe('AutoNotesService', () => {
  let service: AutoNotesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AutoNotesService],
    }).compile();

    service = module.get<AutoNotesService>(AutoNotesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
