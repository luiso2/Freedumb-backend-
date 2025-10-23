const { DataTypes } = require('sequelize');

module.exports = sequelize => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    monthlyIncome: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    savingsGoal: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    riskTolerance: {
      type: DataTypes.ENUM('low', 'moderate', 'high'),
      defaultValue: 'moderate'
    },
    filingStatus: {
      type: DataTypes.ENUM('single', 'married', 'head_of_household'),
      defaultValue: 'single'
    },
    incomeBracket: {
      type: DataTypes.STRING,
      allowNull: true
    },
    selfEmployed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'users',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['email']
      }
    ]
  });

  return User;
};
