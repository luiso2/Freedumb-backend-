const { getSequelize } = require('../database/postgresql');

let models = {};

const initModels = () => {
  const sequelize = getSequelize();

  if (!sequelize) {
    console.warn('Sequelize not initialized. Models will not be loaded.');
    return models;
  }

  // Import model definitions
  // eslint-disable-next-line global-require
  const User = require('./User')(sequelize);
  // eslint-disable-next-line global-require
  const Transaction = require('./Transaction')(sequelize);
  // eslint-disable-next-line global-require
  const Budget = require('./Budget')(sequelize);
  // eslint-disable-next-line global-require
  const Investment = require('./Investment')(sequelize);
  // eslint-disable-next-line global-require
  const Notification = require('./Notification')(sequelize);

  // Define associations
  User.hasMany(Transaction, {
    foreignKey: 'userId',
    as: 'transactions',
    onDelete: 'CASCADE'
  });
  Transaction.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
  });

  User.hasMany(Budget, {
    foreignKey: 'userId',
    as: 'budgets',
    onDelete: 'CASCADE'
  });
  Budget.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
  });

  User.hasMany(Investment, {
    foreignKey: 'userId',
    as: 'investments',
    onDelete: 'CASCADE'
  });
  Investment.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
  });

  User.hasMany(Notification, {
    foreignKey: 'userId',
    as: 'notifications',
    onDelete: 'CASCADE'
  });
  Notification.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
  });

  models = {
    User,
    Transaction,
    Budget,
    Investment,
    Notification,
    sequelize
  };

  return models;
};

const getModels = () => {
  if (Object.keys(models).length === 0) {
    return initModels();
  }
  return models;
};

module.exports = {
  initModels,
  getModels
};
