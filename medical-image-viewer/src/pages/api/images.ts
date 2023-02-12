// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import {FTPClient} from '@/lib/ftp'; 


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
) {
  res.status(200).json(await ((await FTPClient.connectFrom(process.env.SFTP_URL)).keepAlive()).list("."));
}
