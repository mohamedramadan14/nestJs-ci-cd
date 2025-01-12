import { MongooseModuleOptions } from '@nestjs/mongoose';

export const testDbConfig: MongooseModuleOptions = {
  uri: process.env.DB_URI || 'mongodb://localhost:27017/test-db',
  useNewUrlParser: true,
  useUnifiedTopology: true,
}; 