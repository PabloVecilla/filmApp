// IMPORT
// importar libreria dotenv para manejar archivos .env depending on environment
require("dotenv").config({ path: process.env.NODE_ENV === "test" ? ".env.test" : ".env"});
// importar servidor express (framework de node.js)
const express = require("express");
// importar morgan para console.log de las peticiones al servidor para facilitar el desarrollo y debugging
const morgan = require("morgan");
// import helmet
const helmet = require("helmet");
const cookieParser = require("cookie-parser");

// importar config de bbdd
const connectDB = require("../config/db_mongo");
const { sequelize } = require("../config/db_pg");
//Swagger
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const path = require("path");
const openapiDocument = YAML.load(path.join(process.cwd(), "docs", "openapi.yaml"));

// Import api rateLimiter
const { apiLimiter } = require("./middlewares/rateLimit.middleware"); 

const app = express();

// Mandatory for express-rate-limit to function properly  
app.set('trust proxy', 1); 

//--------------------------------------
// DECLARACIONES DE USO EN NUESTRA APP:
// Motor de plantillas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, "views"));
// Middlewares
app.use(morgan("dev"));
// Configuracion de helmet: Securización de cabeceras HTTP y configuracion de csp
app.use(
  helmet({
    contentSecurityPolicy: { // cambiar config por defecto de helmet para poder cargar imagenes desde el html que vengan por url
      directives: {
        "default-src": ["'self'"],
        "img-src": [
          "'self'",
          "data:",       // por si usas base64
          "https:"       // permite imágenes externas
        ],
      },
    },
  })
);
app.use(express.json()); // para usar objetos en formaro json en las request
app.use(express.urlencoded({ extended: false })); // permitir a express leer formularios html
app.use(cookieParser()); // parsear las cookies que vienen en las cabezeras http: "It simplifies managing user sessions, authentication tokens, and preferences by converting raw request cookie headers into easily accessible JSON objects."

app.use(apiLimiter); 

// Configuracion del swagger para poder mostrar la ruta /docs con la documentacion de las apis/servicios/endpoints
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiDocument));

// Esto es FUNDAMENTAL porque: EJS genera HTML pero el navegador necesita: CSS y js e imagenes
app.use(express.static(path.join(__dirname, '../public')));

// --------------------------------------
// RUTAS
const authRoutes = require("./routes/auth.routes");
const favoritesRoutes = require("./routes/favorites.routes");
const usersRoutes = require("./routes/users.routes");
const filmsRoutes = require("./routes/films.routes");
const viewRoutes = require("./routes/view.routes");

app.use("/api", authRoutes);
app.use("/api", favoritesRoutes);
app.use("/api", usersRoutes);
app.use("/api", filmsRoutes);
app.use("/", viewRoutes);

// Dedicated for Infrastructure / Monitors
app.get("/health", async (_req, res) => {
  try {
    // Sequelize DB ping
    await sequelize.authenticate(); 
    
    res.status(200).json({ status: "UP", timestamp: new Date() });
  } catch (error) {
    res.status(503).json({ status: "DOWN", error: error.message });
  }
});

// errors
// 404
app.use((req, res) => {
  if (req.originalUrl.startsWith("/api")) { // si la ruta que da error es de /api (parte BE) devuelve 404 en formato json
    return res.status(404).json({ message: "Not found" });
  }

  return res.status(404).render("404"); // si la ruta que da error es de una vista devuelve 404 en formato html
});

// 500
app.use((err, req, res, next) => {
  console.error(err.stack);

  if (req.originalUrl.startsWith("/api")) {
    return res.status(500).json({ message: "Error interno del servidor" });
  }

  return res.status(500).render("500");
});

// Seguridad runtime
process.on("unhandledRejection", (err) => { //captura errores no controlados en promesas (awaits sin try/catch)
  console.error("Unhandled Rejection:", err);
});

process.on("uncaughtException", (err) => { // captura errores sin try/catch en código síncrono.
  console.error("Uncaught Exception:", err);
});

module.exports = app; 
