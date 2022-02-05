import Sequelize from 'sequelize';

let dialectOptions = { insecureAuth: true };
if (process.env.POSTGRES_DB_SSL_REQUIRE === 'true') {
  dialectOptions.ssl = { require: true };
}

// const db = new Sequelize(process.env.POSTGRES_DB, process.env.POSTGRES_USER, process.env.POSTGRES_PASSWORD, {
const db = new Sequelize('ddj8eekbkbq1q2', 'obshfybgymvctv', '2ab13aad96747deb6cdd159c003905820e8585793262822f92b62b63ff380620', {
  // host: process.env.POSTGRES_HOST,
  host: 'ec2-52-204-72-14.compute-1.amazonaws.com',
  // port: process.env.POSTGRES_PORT,
  port: '5432',
  dialect: 'postgres',
  // dialectOptions,
  dialectOptions: {
    ssl: {
      require: true, // This will help you. But you will see nwe error
      rejectUnauthorized: false // This line will fix new error
    }
  },
  pool: {
    idleTimeoutMillis: 10000,
    min: 2,
    max: 5,
    evict: 10000,
  },
  define: {
    timestamp: false,
    freezeTableName: true,
  },
  // logging: false
});

export default db;
