const { DataTypes } = require('sequelize');

module.exports = sequelize => {
  const Transaction = sequelize.define('Transaction', {
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
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('income', 'expense'),
      allowNull: false
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false
    },
    subCategory: {
      type: DataTypes.STRING,
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    merchant: {
      type: DataTypes.STRING,
      allowNull: true
    },
    paymentMethod: {
      type: DataTypes.ENUM('cash', 'credit_card', 'debit_card', 'bank_transfer', 'other'),
      defaultValue: 'cash'
    },
    cardName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    businessType: {
      type: DataTypes.ENUM('personal', 'business'),
      defaultValue: 'personal'
    },
    businessName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    isTaxDeductible: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isRecurring: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    recurringFrequency: {
      type: DataTypes.ENUM('daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'),
      allowNull: true
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    confidence: {
      type: DataTypes.FLOAT,
      defaultValue: 1.0,
      validate: {
        min: 0,
        max: 1
      }
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'transactions',
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['date']
      },
      {
        fields: ['type']
      },
      {
        fields: ['category']
      }
    ]
  });

  return Transaction;
};
