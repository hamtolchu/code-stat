import * as ts from 'typescript';
import { Dirent } from 'fs';
import { readdir, readFile } from 'fs/promises';
import { pipe, filter, toArray, map, curry, add, toAsync, flat, take } from '@fxts/core';

/*
const code = `
    import test from 'app/test'
    import react from 'react'
    import { get, chain } from 'lodash';
    import { Dialog } from '@mui/dialog';
    function foo() { }
`;


const run = () => {
    const sourceFile = ts.createSourceFile('x.ts', code, ts.ScriptTarget.ES2015, true);
    parse(sourceFile);
};
run();
*/

// base dir
const PROJECT_DIR = '/Users/hamtori/kurly/kurlymall-nx';
const IGNORE_DIR = [
  '.git',
  '.github',
  '.next',
  '.storybook',
  '.idea',
  '.husky',
  '@types',
  '.vscode',
  '__mocks__',
  'documents',
  'fixtures',
  'libs',
  'nginx',
  'node_modules',
  'public',
  'styles',
  'stories',
  'util',
  'scripts',
];

const ALLOW_FILE_PATTERN = /.+(ts|tsx)$/;

const checkIsFile = (file: Dirent) => file.isFile();
const checkIsDir = (file: Dirent) => file.isDirectory();
const checkAllowedFilePattern = (fileName: string) => fileName.match(ALLOW_FILE_PATTERN);

const getFileName = (file: Dirent): string => file.name;

const extractAllTypescriptFiles = async (dirPath: string): Promise<string[]> => {
  const result: string[] = [];
  const currentDir = await readdir(dirPath, { withFileTypes: true });
  const concatPath = curry(add)(`${dirPath}/`);

  const files = pipe(
    currentDir,
    filter(checkIsFile),
    map(getFileName),
    filter(checkAllowedFilePattern),
    map((p) => add(`${dirPath}/`, p)),
    toArray,
  );
  const dirs = pipe(
    currentDir,
    filter(checkIsDir),
    map(getFileName),
    filter((fileName) => fileName !== 'node_modules'),
    map((p) => add(`${dirPath}/`, p)),
    toArray,
  );

  const child = await pipe(dirs, toAsync, map(extractAllTypescriptFiles), flat, toArray);

  return pipe([files, child], flat, toArray);
};

const parse = (node: ts.Node) => {
  if (ts.isImportDeclaration(node)) {
    const moduleName = node.moduleSpecifier.getText().replace(/['"]/g, '');
  }
  // TODO: extract import statements
  ts.forEachChild(node, parse);
};

const run = async () => {
  const allTypescriptFiles = await extractAllTypescriptFiles(PROJECT_DIR);

  const data = await pipe(
    allTypescriptFiles,
    toAsync,
    map(async (fileName) => {
      const buffer = await readFile(fileName);
      return [fileName, buffer.toString()];
    }),
    map((args) => {
      const [fileName, fileContent] = args;
      const sourceFile = ts.createSourceFile(fileName, fileContent, ts.ScriptTarget.ES2015, true);
      return [fileName, sourceFile];
    }),
    map((args) => {
      const [fileName, sourceFile] = args;
      return parse(sourceFile as ts.SourceFile);
    }),
    take(1),
    toArray,
  );
  console.log(data);
};

run();
