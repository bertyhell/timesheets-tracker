import { Test, type TestingModule } from '@nestjs/testing';
import { ActiveStatesController } from './active-states.controller';
import { ActiveStatesService } from './active-states.service';

describe('ProgramsController', () => {
  let controller: ActiveStatesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ActiveStatesController],
      providers: [ActiveStatesService],
    }).compile();

    controller = module.get<ActiveStatesController>(ActiveStatesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
