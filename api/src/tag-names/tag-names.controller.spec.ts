import { Test, type TestingModule } from '@nestjs/testing';
import { TagNamesController } from './tag-names.controller';
import { TagNamesService } from './tag-names.service';

describe('TagNamesController', () => {
  let controller: TagNamesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TagNamesController],
      providers: [TagNamesService],
    }).compile();

    controller = module.get<TagNamesController>(TagNamesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
