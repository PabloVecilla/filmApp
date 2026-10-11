const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db_pg');

const User = sequelize.define('User', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('user', 'admin'),
    defaultValue: 'user'
  }
}, {
  tableName: 'users',  // fuerza que use la tabla existente del grupo
  timestamps: true,
  underscored: true
});

module.exports = User;