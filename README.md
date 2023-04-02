# [WIP] code-stat
코드로 코드 분석하는...?

## Usage
```shell
# use node 18.15.0 
nvm use

# install pnpm
npm i -g pnpm

# install dependencies
pnpm i

# generate report
pnpm start 'target source code dir (absolute path)'
```

## Output
```
├── output
│   └── $projectName
│       ├── DIR_LIST.json
│       ├── FILE_EXT_LIST.json
│       └── FILE_LIST.json
...
```
- (dir) $projectName: created by command line argument (ex: /home/a/b/c -> 'c')
- (file) DIR_LIST.json: all directory list
- (file) FILE_LIST.json: all file list
- (file) FILE_EXT_LIST.json: file resource (ext) summary
  ```json
    {".js":21,".md":2,".yaml":13,".sh":4,".ts":1071,".json":49,".yml":1,".iml":1,".xml":63,".jpg":4,".svg":237,".png":60,".html":9,".conf":1,".tsx":2345,".ico":1,".txt":1,".mdx":1,".css":1,".scss":1}
  ``` 


## TODO
- generate dependency summarize with Typescript Compiler API
```
/*
TODO: Typescript Compiler API 를 이용해서 개별 파일들을 모두 읽어들여 개별 파일들이 의존하고 있는 의존성 패키지 요약..
import * as ts from 'typescript';
const code = `
    import test from 'app/test'
    import react from 'react'
    import { get, chain } from 'lodash';
    import { Dialog } from '@mui/dialog';
    function foo() { }
`;
const parse = (node: ts.Node) => {
    if (ts.isImportDeclaration(node)) {
        // console.log(node.getText()); // full import statemenet
        const moduleName = node.moduleSpecifier.getText().replace(/['"]/g, '');
        console.log(moduleName, node.moduleSpecifier.getText());
    }
    ts.forEachChild(node, parse);
}
const run = () => {
    const sourceFile = ts.createSourceFile("x.ts", code, ts.ScriptTarget.ES2015, true);
    parse(sourceFile);
};
run();
 */

```