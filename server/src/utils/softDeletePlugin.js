module.exports = function softDeletePlugin(schema) {
  schema.add({ 
    isDeleted: { type: Boolean, default: false }, 
    deletedAt: { type: Date, default: null } 
  });

  const excludeDeleted = function(next) {
    if (this.getFilter && this.getFilter().isDeleted === undefined) {
      this.where({ isDeleted: { $ne: true } });
    }
    next();
  };

  const typesFindQueryMiddleware = [
    'countDocuments',
    'find',
    'findOne',
    'findOneAndDelete',
    'findOneAndRemove',
    'findOneAndUpdate',
    'update',
    'updateOne',
    'updateMany'
  ];

  typesFindQueryMiddleware.forEach((type) => {
    schema.pre(type, excludeDeleted);
  });
};
