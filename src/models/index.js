const User = require("./User.model");
const Favorite = require("./Favorite.model");

User.hasMany(Favorite, {
  foreignKey: "userId",
  as: "favorites",
});

Favorite.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

module.exports = {
  User,
  Favorite,
};
