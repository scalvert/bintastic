import { json, text } from 'bintastic';

project.files = {
  'src/index.js': text`
    export default 42;
  `,
  'tsconfig.json': json`{ "compilerOptions": { "strict": true } }`,
};
await project.write();
