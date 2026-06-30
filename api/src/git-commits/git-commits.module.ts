import { Module } from '@nestjs/common';
import { GitCommitsService } from './git-commits.service';

@Module({
  providers: [GitCommitsService],
  exports: [GitCommitsService],
})
export class GitCommitsModule {}
