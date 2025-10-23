const { DataTypes } = require('sequelize');

module.exports = sequelize => {
  const Investment = sequelize.define('Investment', {
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
    symbol: {
      type: DataTypes.STRING,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('stock', 'bond', 'crypto', 'etf', 'mutual_fund', 'real_estate', 'other'),
      allowNull: false
    },
    quantity: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: false
    },
    purchasePrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    currentPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    purchaseDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    lastUpdated: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'investments',
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['symbol']
      },
      {
        fields: ['type']
      }
    ]
  });

  // Virtual fields for calculations
  Investment.prototype.getTotalValue = function () {
    return parseFloat(this.quantity) * parseFloat(this.currentPrice);
  };

  Investment.prototype.getTotalCost = function () {
    return parseFloat(this.quantity) * parseFloat(this.purchasePrice);
  };

  Investment.prototype.getGainLoss = function () {
    return this.getTotalValue() - this.getTotalCost();
  };

  Investment.prototype.getGainLossPercentage = function () {
    const cost = this.getTotalCost();
    if (cost === 0) return 0;
    return ((this.getGainLoss() / cost) * 100).toFixed(2);
  };

  return Investment;
};
