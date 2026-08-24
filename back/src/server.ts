import app from './app';
import database from './config/database';
import { env } from './config/env';

const startServer = async (): Promise<void> => {
  try {
    await database.initialize();

    app.listen(env.PORT, () => {
      console.log(`Servidor ejecutandose en http://localhost:${env.PORT}`);
      console.log(`API disponible en http://localhost:${env.PORT}/api`);
    });
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

startServer();
