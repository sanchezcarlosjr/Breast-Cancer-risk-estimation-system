import Client from 'ssh2-sftp-client';

export function connect() {
   return FTPClient.connectFrom(process.env.SFTP_URL).then(connection => connection.keepAlive());
}

export function explore(path) {
   return connect().then(connection => connection.list(path));
}

export function read(remotePath, localPath) {
    return connect().then(connection => connection.read(remotePath, localPath));
}

export class FTPClient {
  constructor() {
    this.client = new Client();
  }

  static async connectFrom(url: string): FTPClient {
	  if (global.ftpClient) {
		  return global.ftpClient;
	  }
	  const client = new FTPClient();
	  const { hostname, port = 22, username, password } = new URL(url);
	  await client.connect({ host: hostname, port, username, password });
	  return client;
  }

  keepAlive() {
	  global.ftpClient = this;
	  return this;
  }

  connect(options) {
    return this.client.connect(options);
  }

  disconnect() {
    return this.client.end();
  }

  list(remoteDir, fileGlob) {
    return this.client.list(remoteDir, fileGlob);
  }

  write(localFile, remoteFile) {
    return this.client.put(localFile, remoteFile);
  }

  read(remoteFile, localFile) { 
    return this.client.get(remoteFile, localFile);
  }

  delete(remoteFile) {
       return this.client.delete(remoteFile);
  }
}
