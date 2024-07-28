import { Test, type TestingModule } from '@nestjs/testing';
import { ActiveStatesService } from './active-states.service';

describe('ActiveStatesService', () => {
  let service: ActiveStatesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ActiveStatesService],
    }).compile();

    service = module.get<ActiveStatesService>(ActiveStatesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
