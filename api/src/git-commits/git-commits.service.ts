import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fg from 'fast-glob';
import * as path from 'path';
import { v4 as uuid } from 'uuid';
import { CustomError } from '../shared/CustomError';

const execAsync = promisify(exec);

const SEARCH_DEPTH = 3;
const IGNORE_PATTERNS = ['node_modules/**', 'dist/**'];
const COMMIT_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export interface GitCommitEvent {
  id: string;
  repoName: string;
  commitMessage: string;
  startedAt: string;
  endedAt: string;
}

@Injectable()
export class GitCommitsService {
  private findGitRepoPaths(baseDir: string): string[] {
    const gitDirs: string[] = fg.sync('**/.git', {
      cwd: baseDir,
      absolute: true,
      onlyDirectories: true,
      deep: SEARCH_DEPTH,
      ignore: IGNORE_PATTERNS,
    });
    return gitDirs.map((gitDir) => gitDir.slice(0, -'/.git'.length));
  }

  private async getRepoCommits(
    repoPath: string,
    startedAt: string,
    endedAt: string
  ): Promise<GitCommitEvent[]> {
    // %H = full hash, %ai = author date ISO 8601, %s = subject
    const command = `git log --all --since="${startedAt}" --until="${endedAt}" --pretty=format:"%ai|%s"`;
    try {
      const { stdout } = await execAsync(command, { cwd: repoPath });
      const trimmed = stdout.trim();
      if (!trimmed) return [];

      const repoName = path.basename(repoPath);
      return trimmed
        .split('\n')
        .filter(Boolean)
        .map((line): GitCommitEvent => {
          const [dateStr, ...rest] = line.split('|');
          const message = rest.join('|'); // subject (may contain '|' characters)
          const commitTime = new Date(dateStr.trim()).getTime();
          return {
            id: uuid(),
            repoName,
            commitMessage: message.trim(),
            startedAt: new Date(commitTime).toISOString(),
            endedAt: new Date(commitTime + COMMIT_DURATION_MS).toISOString(),
          };
        });
    } catch {
      // repo may not have commits in range or git may fail — silently skip
      return [];
    }
  }

  async getEvents(
    folderPath: string | undefined | null,
    startedAt: string,
    endedAt: string
  ): Promise<GitCommitEvent[]> {
    try {
      if (!folderPath) return [];

      const repoPaths = this.findGitRepoPaths(folderPath);
      const results = await Promise.all(
        repoPaths.map((repoPath) => this.getRepoCommits(repoPath, startedAt, endedAt))
      );
      return results.flat();
    } catch (err) {
      throw new CustomError('Failed to get git commit events', err, {
        folderPath,
        startedAt,
        endedAt,
      });
    }
  }
}
