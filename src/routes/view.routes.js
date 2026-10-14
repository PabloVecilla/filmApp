const express = require("express");
const router = express.Router();
const {
  authenticateJWT,
  authorizeAdmin,
} = require("../middlewares/auth.middleware");

// Redirección a vista de inicio
router.get('/', (req, res) => {
  res.redirect('/home');
});

// Vista de inicio
router.get("/home", (req, res) => {
  res.render("index", { title: "Film App", user: null, page: "home" });
});

// Login
router.get("/login", (req, res) => {
  res.render("login", { title: "Login", user: null, page: "login" });
});

// Signup
router.get("/signup", (req, res) => {
  res.render("signup", { title: "Registro", user: null, page: "signup" });
});

// Admin - Admin Movies
router.get("/admin-movies", authenticateJWT, authorizeAdmin, (req, res) => {
  res.render("admin-movies", {
    title: "Gestion de películas",
    user: req.user,
    page: "admin-movies",
  });
});

// Admin - usuarios
router.get("/admin-users", authenticateJWT, authorizeAdmin, (req, res) => {
  res.render("admin-users", {
    title: "Usuarios",
    user: req.user,
    page: "admin-users",
  });
});

// Dashboard
router.get("/dashboard", authenticateJWT, (req, res) => {
  res.render("dashboard", {
    title: "Dashboard",
    user: req.user,
    page: "dashboard",
  });
});

// Movie - detail
router.get('/search/:imdbID', authenticateJWT, (req, res) => {
  res.render('film-detail', { title: req.params.imdbID, user: req.user, page: 'film-detail' });
});

// Favorites
router.get('/favorites', authenticateJWT, (req, res) => {
  res.render('favorites', { 
    title: "Favorites", 
    user: req.user, 
    page: 'favorites' });
});


module.exports = router;
