import type { NextApiRequest, NextApiResponse } from 'next'
import {FTPClient} from '@/lib/ftp'; 
import path from 'path';
import fs from 'fs';

function connect() {
   return FTPClient.connectFrom(process.env.SFTP_URL).then(connection => connection.keepAlive());
}

function explore(path) {
   return connect().then(connection => connection.list(path));
}

function read(remotePath, localPath) {
    return connect().then(connection => connection.read(remotePath, localPath));
}

function index_all_images() {
  const concat_path = (current_path, curr) => path.join(current_path, curr.name);
  const add_location = (obj, location) => {
	  obj['remote_location'] = location
	  return obj;
  }
  const dfs = async (path) => (await explore(path)).reduce(
    async (promise, curr, index) =>
      promise.then(async (acc) => [
        ...acc,
        ...(curr.type === 'd' ? await dfs(concat_path(path, curr)) : /.*\.dcm/.test(curr.name) ? [add_location(curr, concat_path(path, curr))] : [] ),
      ]),
    Promise.resolve([])
  );
  return dfs;
}

global.dfs = index_all_images();

function identify(file) {
  return path.join('public', 'images', file.replace("/", "."));
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
) {
  const public_directory = identify(req.query.path);
  if (fs.existsSync(public_directory)) {
	  const files = await fs.promises.readdir(public_directory).then(files => files.map(file => ({
                  local_location: path.join(public_directory, file)
	  })));
	  return res.status(200).json(files);
  }
  const images = await global.dfs(req.query.path);
  await Promise.all(images.map(image => {
	  image.local_location = path.join(public_directory, image.name);
	  if (!fs.existsSync(path.dirname(image.local_location))) {
		  fs.mkdirSync(path.dirname(image.local_location), { recursive: true });
	  }
	  return read(image.remote_location, image.local_location);
  }));
  res.status(200).json(images);
}
