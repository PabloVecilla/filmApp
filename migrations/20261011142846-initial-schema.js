'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction(); 

    try {
      await queryInterface.createTable(
        "users", {
          id: {
            type: Sequelize.INTEGER, 
            allowNull: false, 
            autoIncrement: true, 
            primaryKey: true,
          }, 
          name: {
            type: Sequelize.STRING, 
            allowNull: false
          }, 
          email: {
            type: Sequelize.STRING, 
            allowNull: false, 
            unique: true
          }, 
          password_hash: {
            type: Sequelize.STRING, 
            allowNull: false
          }, 
          role: {
            type: Sequelize.ENUM("user", "admin"), 
            defaultValue: "user"
          }, created_at: {
            type: Sequelize.DATE,
            allowNull: false,
          },
          updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
          }
        }, { transaction }
      ); 
      await queryInterface.createTable(
        "favorites", {
          id: {
            type: Sequelize.INTEGER, 
            allowNull: false, 
            autoIncrement: true, 
            primaryKey: true
          }, 
          // foreign key
          user_id: {
            type: Sequelize.INTEGER, 
            allowNull: false, 
            references: {
              model: "users", 
              key: "id"
            },
            onDelete: "CASCADE", 
            onUpdate: "CASCADE"
          }, 
          movie_source: {
            type: Sequelize.ENUM("omdb", "mongo"),
            allowNull: false,
          }, 
          movie_source_id: {
            type: Sequelize.STRING, 
            allowNull:false
          }, 
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
          },
          updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
          }
        }, { transaction }
      ); 

      await queryInterface.addIndex(
        "favorites",
        ["user_id", "movie_source", "movie_source_id"], {
          unique: true,
          name: "users_user_movie_unique_idx", 
          transaction
        }
      ); 
      await transaction.commit(); 

    } catch (error) {
      await transaction.rollback(); 
      throw error; 
    }
  },

  async down (queryInterface) {
    const transaction = await queryInterface.sequelize.transaction(); 
     try {
        await queryInterface.dropTable("favorites", { transaction }); 
        await queryInterface.dropTable("users", { transaction });
        await queryInterface.sequelize.query(
          'DROP TYPE IF EXISTS "enum_users_role";', { transaction }
        ); 
        await queryInterface.sequelize.query(
          'DROP TYPE IF EXISTS "enum_favorites_movie_source";', { transaction }
        ); 

        await transaction.commit(); 
     } catch (error) {
        await transaction.rollback(); 
        throw error; 
     }
  }
};
