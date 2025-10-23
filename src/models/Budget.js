const { DataTypes } = require('sequelize');

module.exports = sequelize => {
  const Budget = sequelize.define('Budget', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false
    },
    limit: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    spent: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    period: {
      type: DataTypes.ENUM('weekly', 'monthly', 'quarterly', 'yearly'),
      defaultValue: 'monthly'
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    alertThreshold: {
      type: DataTypes.INTEGER,
      defaultValue: 80,
      validate: {
        min: 0,
        max: 100
      }
    },
    alertSent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'budgets',
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['category']
      },
      {
        fields: ['isActive']
      }
    ]
  });

  return Budget;
};
