import mongoose from 'mongoose';

const connection: { isConnected?: boolean } = {};

async function connect(uri: string) {
  if (connection.isConnected) {
    return;
  }

  const db = await mongoose.connect(uri);

  connection.isConnected = db.connections[0].readyState === mongoose.STATES.connected;
}

async function disconnect() {
  if (!connection.isConnected) {
    return;
  }

  await mongoose.connection.close();
  connection.isConnected = false;
}

export { connect, disconnect };
