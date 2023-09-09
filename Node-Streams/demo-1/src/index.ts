import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';

const filePath = path.resolve('assets', 'file-1.txt');
async function writeShitAppend(number: number) {
  let idx = 0;

  const timer = console.time('timer');

  while (idx < number) {
    await fsp.appendFile(filePath, Buffer.from(` ${idx} `));

    idx += 1;
  }

  console.timeEnd('timer');
}

async function writeShitFileOpen(number: number) {
  console.time('timer');

  const file = fs.open(filePath, 'w', (err: unknown, fd: number) => {
    if (err) {
      return console.error('Error opening file [%o]', err);
    }
    let idx = 0;

    while (idx < number) {
      fs.writeSync(fd, Buffer.from(` ${idx} `));

      idx += 1;
    }
  });

  console.timeEnd('timer');
}

writeShitAppend(1000000);
// writeShitFileOpen(1000000);
