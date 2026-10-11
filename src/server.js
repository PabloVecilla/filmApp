const app = require("./app"); 
const { sequelize } = require("../config/db_pg"); 
const connectDB = require("../config/db_mongo");

const PORT = process.env.PORT || 3000; 
const HOST = process.env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1";  // explicit host necessary to run render deployment
async function startServer() { // -> only accept http requests if connection is successful
    try {
      await Promise.all([sequelize.authenticate(), connectDB()]); // -> test connection to DB
      console.log("Database Connected"); 
  
      // await sequelize.sync(); // -> updates DB to match the sequelize model --> ONLY for development. 
      // console.log("Models synced"); 
  
      app.listen(PORT, HOST, () => {
        console.log(`API listening on port: ${PORT}`);
      });
  
    } catch (err) {
      console.error("Database connection failed: ", err); 
    }
  }
  startServer(); 