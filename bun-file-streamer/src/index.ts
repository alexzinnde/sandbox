import {readdir} from 'fs/promises';

const PORT = process.env.PORT ?? 8888;
const rootPath = process.env.ROOT_PATH;

if (!rootPath) {
  throw new Error('RootPath Env Var missing!');
}

console.log('rootPAth [%s]', rootPath);

Bun.serve({
  port: PORT,
  development: true,
  async fetch(req) {
    const reqUrl = new URL(req.url);
    switch (reqUrl.pathname) {
      case '/list':
        return new Response(Bun.file('./src/list/list.html'));

      case '/list.js':
        return new Response(Bun.file('./src/list/list.js'));

      case '/filelist':
        return new Response(JSON.stringify(await readdir(rootPath)));

      case '/file':
        const reqFileName = reqUrl.searchParams.get('name');
        if (!reqFileName) {
          return new Response('file name not found');
        }

        const fileName = decodeURIComponent(reqFileName);

        if (!fileName) {
          return new Response('file name not found');
        }
        return new Response(Bun.file(rootPath + '/' + fileName).stream());

      case '/':
        return new Response('hello');

      default:
        return new Response('404');
    }
  }
});

console.log('Server listening on [%s]!', PORT);
