import { Test, type TestingModule } from '@nestjs/testing';
import { AutoNotesController } from './auto-notes.controller';
import { AutoNotesService } from './auto-notes.service';

describe('AutoNotesController', () => {
  let controller: AutoNotesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AutoNotesController],
      providers: [AutoNotesService],
    }).compile();

    controller = module.get<AutoNotesController>(AutoNotesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
