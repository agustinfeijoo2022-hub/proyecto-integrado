import mongoose from 'mongoose';

export const conectarMongo = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/fyag_logs');
    console.log(' [MongoDB] Conexión establecida correctamente.');
  } catch (error) {
    console.error(' [MongoDB] Error de conexión:', error.message);
  }
};