import { json, text } from 'bintastic';

await project.write({
  'src/index.js': text`
    export default 42;
  `,
  'tsconfig.json': json`{ "compilerOptions": { "strict": true } }`,
});
