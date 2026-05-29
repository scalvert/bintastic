import { json, text } from 'bintastic';

project.files = {
  'src/index.js': text`
    export default 42;
  `,
  'package.json': json`{ "name": "test" }`,
};
await project.write();
