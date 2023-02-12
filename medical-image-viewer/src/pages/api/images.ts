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
  const concat_path = (path, curr) => path + `/${curr.name}`;
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
) {
  const localPath = `public/images/${req.query.path.replace("/", ".")}`;
  if (fs.existsSync(localPath)) {
	  const files = await fs.promises.readdir(localPath).then(files => files.map(file => ({
                  local_location: `${localPath}/${file}`
	  })));
	  return res.status(200).json(files);
  }
  const images = await global.dfs(req.query.path);
  await Promise.all(images.map(image => {
	  const localFile = "public/images/"+req.query.path.replace("/", ".")+"/"+image.name;
	  image.local_location = localFile;
	  if (!fs.existsSync(path.dirname(localFile))) {
		  fs.mkdirSync(path.dirname(localFile), { recursive: true });
	  }
	  return read(image.remote_location, localFile);
  }));
  res.status(200).json(images);
}
