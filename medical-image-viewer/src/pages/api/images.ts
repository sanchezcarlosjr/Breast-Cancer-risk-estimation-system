import type { NextApiRequest, NextApiResponse } from 'next'
import {read, explore} from '@/lib/ftp'; 
import path from 'path';
import fs from 'fs';

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

function list_images_from_path(path_consultant) {
	function memo(public_directory) {
		return fs.promises.readdir(public_directory).then(files => files.map(file => ({
			local_location: path.join(public_directory, file)
		})));
	}
	async function query_images(public_directory) {
		return Promise.all((await global.dfs(path_consultant)).map(async image => {
			image.local_location = path.join(public_directory, image.name);
			if (!fs.existsSync(path.dirname(image.local_location))) {
				fs.mkdirSync(path.dirname(image.local_location), { recursive: true });
			}
			await read(image.remote_location, image.local_location);
			return image;
		}));
	}
	return ((public_directory) => fs.existsSync(public_directory) ? memo(public_directory) : query_images(public_directory))(identify(path_consultant));
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
) { 
  res.status(200).json(await list_images_from_path(req.query.path));
}
