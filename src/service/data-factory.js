const {DataFactory} = require('n3');

const DataFactoryAdjusted = DataFactory;
// DataFactoryAdjusted.internal = DataFactory;

DataFactoryAdjusted.internal = {NamedNode: DataFactory.namedNode};

module.exports = DataFactory;
