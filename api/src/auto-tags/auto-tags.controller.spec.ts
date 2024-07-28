import { Test, type TestingModule } from '@nestjs/testing';
import { AutoTagsController } from './auto-tags.controller';
import { AutoTagsService } from './auto-tags.service';

describe('TagNamesController', () => {
  let controller: AutoTagsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AutoTagsController],
      providers: [AutoTagsService],
    }).compile();

    controller = module.get<AutoTagsController>(AutoTagsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
