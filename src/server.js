const app = require("./app"); 
const { sequelize } = require("../config/db_pg"); 
const connectDB = require("../config/db_mongo");

const PORT = process.env.PORT || 3000; 
const HOST = process.env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1";  // explicit host necessary to run render deployment
async function startServer() { 
    try {
      await Promise.all([sequelize.authenticate(), connectDB()]); // -> only accept http requests if connection is successful
      console.log("Database Connected"); 
  
      console.log("Database Connected Successfully"); 
  
      app.listen(PORT, HOST, () => {
        console.log(`API listening on port: ${PORT}`);
      });
  
    } catch (err) {
      console.error("Database connection failed: ", err); 
      process.exit(1); 
    }
  }
  startServer(); 