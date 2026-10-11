const { DataTypes } = require("sequelize"); 
const { sequelize } = require("../../config/db_pg.js"); 

const Favorite = sequelize.define("favorite", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true, 
        autoIncrement: true,
    }, 
    userId: {
        type: DataTypes.INTEGER, 
        allowNull: false, 
        references: {               // add reference to Users
            model: "users",
            key: "id"
        },
        onDelete: "CASCADE",        // if user is deleted, favorites are too
        onUpdate: "CASCADE"         // if user is edited, favorites(userId) is too
    }, 
    movieSource: {
        type: DataTypes.ENUM("omdb", "mongo"),      // only two options are valid (NOT case-sensitive)
        allowNull: false, 
    }, 
    movieSourceId: {
        type: DataTypes.STRING,
        allowNull: false, 
    }, 
},
{
    tableName: "favorites", 
    timestamps: true, 
    underscored: true, 
    indexes: [{
            unique:true, 
            fields: ["userId", "movieSource", "movieSourceId"]  // joint indexes to ensure unicity
    } ]
}); 

module.exports = Favorite; 