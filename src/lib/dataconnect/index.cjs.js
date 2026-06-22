const { queryRef, executeQuery, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'foratour-erp-connector',
  service: 'foratour-erp',
  location: 'us-central1'
};
exports.connectorConfig = connectorConfig;

const listReservationsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListReservations');
}
listReservationsRef.operationName = 'ListReservations';
exports.listReservationsRef = listReservationsRef;

exports.listReservations = function listReservations(dc) {
  return executeQuery(listReservationsRef(dc));
};

const listClientsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListClients');
}
listClientsRef.operationName = 'ListClients';
exports.listClientsRef = listClientsRef;

exports.listClients = function listClients(dc) {
  return executeQuery(listClientsRef(dc));
};

const listInvoicesRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListInvoices');
}
listInvoicesRef.operationName = 'ListInvoices';
exports.listInvoicesRef = listInvoicesRef;

exports.listInvoices = function listInvoices(dc) {
  return executeQuery(listInvoicesRef(dc));
};

const listPropertiesRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListProperties');
}
listPropertiesRef.operationName = 'ListProperties';
exports.listPropertiesRef = listPropertiesRef;

exports.listProperties = function listProperties(dc) {
  return executeQuery(listPropertiesRef(dc));
};
