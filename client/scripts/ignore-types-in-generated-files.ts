import * as fs from 'fs';
import * as path from 'path';

const indexPath = path.resolve('./src/generated/api/queries/index.ts');
const indexContent = fs.readFileSync(indexPath);
const indexContentWithIgnoreTypes =
  `// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
` + indexContent;

fs.writeFileSync(indexPath, indexContentWithIgnoreTypes);
