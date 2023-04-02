import { stat, readdir, writeFile, mkdir } from 'fs/promises';
import type { Stats } from 'fs';
import { resolve, extname } from 'path';
import { pipe, map, toArray, concurrent, toAsync, filter, flat, isEmpty, countBy, last } from '@fxts/core';

const PROJECT_ROOT_DIR = process.argv[2];
const PROJECT_NAME = last(PROJECT_ROOT_DIR.split('/'));

const OUTPUT_DIR_PATH = `${__dirname}/output/${PROJECT_NAME}`;

const EXCLUDE_DIR_MAP = new Map([
  ['.bin', true],
  ['.git', true],
  ['node_modules', true],
  ['.next', true],
  ['.DS_Store', true],
  ['.vscode', true],
  ['coverage', true],
]);

type ResourceTuple = [string, Stats];

const getResourceTuple = async (path: string): Promise<ResourceTuple> => {
  const stats = await stat(path);
  return [path, stats];
};

const getFileTupleList = (tupleList: ResourceTuple[]) =>
  pipe(
    tupleList,
    filter(([_, stats]) => stats.isFile()),
    toArray,
  );

const getDirectoryTupleList = (tupleList: ResourceTuple[]) =>
  pipe(
    tupleList,
    filter(([_, stats]) => stats.isDirectory()),
    toArray,
  );

const getPath = (resourceTuple: ResourceTuple) => {
  const [path] = resourceTuple;
  return path;
};

const getFileExt = (path: string) => extname(path);

const getOutputResourcePath = (resourceName: string) => `${OUTPUT_DIR_PATH}/${resourceName}`;

const checkOutputDir = async () => {
  try {
    await readdir(OUTPUT_DIR_PATH);
    return true;
  } catch (error) {
    return false;
  }
};
const createOutputDir = async () => {
  const result = await checkOutputDir();
  if (result) {
    return true;
  }
  console.log('Output directory created');
  await mkdir(OUTPUT_DIR_PATH, { recursive: true });
  return true;
};

const retrieveDir = async (path: string): Promise<ResourceTuple[]> => {
  const pathList = await readdir(path);
  const absolutePathList = pipe(
    pathList,
    filter((name) => !EXCLUDE_DIR_MAP.get(name)),
    map((name) => resolve(path, name)),
    toArray,
  );
  const resourceTupleList = await pipe(absolutePathList, toAsync, map(getResourceTuple), concurrent(10), toArray);
  const childFileList = getFileTupleList(resourceTupleList);
  const childDirectoryList = getDirectoryTupleList(resourceTupleList);
  const retrieveChildDirResult = await pipe(
    childDirectoryList,
    toAsync,
    map(async ([path]) => await retrieveDir(path)),
    flat,
    toArray,
  );
  return [...childFileList, ...childDirectoryList, ...retrieveChildDirResult];
};

const run = async (rootDir: string) => {
  const start = Date.now();
  const retrieveResultList = await retrieveDir(rootDir);
  const finalFileList = pipe(getFileTupleList(retrieveResultList), map(getPath), toArray);
  const finalDirList = pipe(getDirectoryTupleList(retrieveResultList), map(getPath), toArray);
  const fileExtSummary = pipe(
    finalFileList,
    map(getFileExt),
    filter((ext) => !isEmpty(ext)),
    countBy((ext) => ext),
  );

  await createOutputDir();

  await writeFile(getOutputResourcePath('FILE_LIST.json'), JSON.stringify(finalFileList));
  await writeFile(getOutputResourcePath('DIR_LIST.json'), JSON.stringify(finalDirList));
  await writeFile(getOutputResourcePath('FILE_EXT_LIST.json'), JSON.stringify(fileExtSummary));

  console.log(Date.now() - start);
};

run(PROJECT_ROOT_DIR);
