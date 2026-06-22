import { queryRef, executeQuery, validateArgs } from 'firebase/data-connect';

export const connectorConfig = {
  connector: 'foratour-erp-connector',
  service: 'foratour-erp',
  location: 'us-central1'
};

export const listReservationsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListReservations');
}
listReservationsRef.operationName = 'ListReservations';

export function listReservations(dc) {
  return executeQuery(listReservationsRef(dc));
}

export const listClientsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListClients');
}
listClientsRef.operationName = 'ListClients';

export function listClients(dc) {
  return executeQuery(listClientsRef(dc));
}

export const listInvoicesRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListInvoices');
}
listInvoicesRef.operationName = 'ListInvoices';

export function listInvoices(dc) {
  return executeQuery(listInvoicesRef(dc));
}

export const listPropertiesRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListProperties');
}
listPropertiesRef.operationName = 'ListProperties';

export function listProperties(dc) {
  return executeQuery(listPropertiesRef(dc));
}

