const { queryRef, executeQuery, validateArgsWithOptions, mutationRef, executeMutation, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'foratour-erp-connector',
  service: 'foratour-erp',
  location: 'us-central1'
};
exports.connectorConfig = connectorConfig;

const listPaymentVouchersRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListPaymentVouchers');
}
listPaymentVouchersRef.operationName = 'ListPaymentVouchers';
exports.listPaymentVouchersRef = listPaymentVouchersRef;

exports.listPaymentVouchers = function listPaymentVouchers(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(listPaymentVouchersRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const insertPaymentVoucherRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'InsertPaymentVoucher', inputVars);
}
insertPaymentVoucherRef.operationName = 'InsertPaymentVoucher';
exports.insertPaymentVoucherRef = insertPaymentVoucherRef;

exports.insertPaymentVoucher = function insertPaymentVoucher(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(insertPaymentVoucherRef(dcInstance, inputVars));
}
;

const updatePaymentVoucherRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdatePaymentVoucher', inputVars);
}
updatePaymentVoucherRef.operationName = 'UpdatePaymentVoucher';
exports.updatePaymentVoucherRef = updatePaymentVoucherRef;

exports.updatePaymentVoucher = function updatePaymentVoucher(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(updatePaymentVoucherRef(dcInstance, inputVars));
}
;

const insertReservationRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'InsertReservation', inputVars);
}
insertReservationRef.operationName = 'InsertReservation';
exports.insertReservationRef = insertReservationRef;

exports.insertReservation = function insertReservation(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(insertReservationRef(dcInstance, inputVars));
}
;

const updateReservationStatusRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateReservationStatus', inputVars);
}
updateReservationStatusRef.operationName = 'UpdateReservationStatus';
exports.updateReservationStatusRef = updateReservationStatusRef;

exports.updateReservationStatus = function updateReservationStatus(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(updateReservationStatusRef(dcInstance, inputVars));
}
;

const updateReservationRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateReservation', inputVars);
}
updateReservationRef.operationName = 'UpdateReservation';
exports.updateReservationRef = updateReservationRef;

exports.updateReservation = function updateReservation(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(updateReservationRef(dcInstance, inputVars));
}
;

const insertClientRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'InsertClient', inputVars);
}
insertClientRef.operationName = 'InsertClient';
exports.insertClientRef = insertClientRef;

exports.insertClient = function insertClient(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(insertClientRef(dcInstance, inputVars));
}
;

const insertInvoiceRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'InsertInvoice', inputVars);
}
insertInvoiceRef.operationName = 'InsertInvoice';
exports.insertInvoiceRef = insertInvoiceRef;

exports.insertInvoice = function insertInvoice(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(insertInvoiceRef(dcInstance, inputVars));
}
;

const insertDetailedPropertyRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'InsertDetailedProperty', inputVars);
}
insertDetailedPropertyRef.operationName = 'InsertDetailedProperty';
exports.insertDetailedPropertyRef = insertDetailedPropertyRef;

exports.insertDetailedProperty = function insertDetailedProperty(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(insertDetailedPropertyRef(dcInstance, inputVars));
}
;

const updateDetailedPropertyRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateDetailedProperty', inputVars);
}
updateDetailedPropertyRef.operationName = 'UpdateDetailedProperty';
exports.updateDetailedPropertyRef = updateDetailedPropertyRef;

exports.updateDetailedProperty = function updateDetailedProperty(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(updateDetailedPropertyRef(dcInstance, inputVars));
}
;

const insertRoomTypeRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'InsertRoomType', inputVars);
}
insertRoomTypeRef.operationName = 'InsertRoomType';
exports.insertRoomTypeRef = insertRoomTypeRef;

exports.insertRoomType = function insertRoomType(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(insertRoomTypeRef(dcInstance, inputVars));
}
;

const updateRoomTypeRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateRoomType', inputVars);
}
updateRoomTypeRef.operationName = 'UpdateRoomType';
exports.updateRoomTypeRef = updateRoomTypeRef;

exports.updateRoomType = function updateRoomType(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(updateRoomTypeRef(dcInstance, inputVars));
}
;

const insertRatePlanRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'InsertRatePlan', inputVars);
}
insertRatePlanRef.operationName = 'InsertRatePlan';
exports.insertRatePlanRef = insertRatePlanRef;

exports.insertRatePlan = function insertRatePlan(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(insertRatePlanRef(dcInstance, inputVars));
}
;

const updateRatePlanRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateRatePlan', inputVars);
}
updateRatePlanRef.operationName = 'UpdateRatePlan';
exports.updateRatePlanRef = updateRatePlanRef;

exports.updateRatePlan = function updateRatePlan(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(updateRatePlanRef(dcInstance, inputVars));
}
;

const insertStopSaleRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'InsertStopSale', inputVars);
}
insertStopSaleRef.operationName = 'InsertStopSale';
exports.insertStopSaleRef = insertStopSaleRef;

exports.insertStopSale = function insertStopSale(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(insertStopSaleRef(dcInstance, inputVars));
}
;

const updateStopSaleRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateStopSale', inputVars);
}
updateStopSaleRef.operationName = 'UpdateStopSale';
exports.updateStopSaleRef = updateStopSaleRef;

exports.updateStopSale = function updateStopSale(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(updateStopSaleRef(dcInstance, inputVars));
}
;

const insertFlightTicketRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'InsertFlightTicket', inputVars);
}
insertFlightTicketRef.operationName = 'InsertFlightTicket';
exports.insertFlightTicketRef = insertFlightTicketRef;

exports.insertFlightTicket = function insertFlightTicket(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(insertFlightTicketRef(dcInstance, inputVars));
}
;

const updateFlightTicketRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateFlightTicket', inputVars);
}
updateFlightTicketRef.operationName = 'UpdateFlightTicket';
exports.updateFlightTicketRef = updateFlightTicketRef;

exports.updateFlightTicket = function updateFlightTicket(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(updateFlightTicketRef(dcInstance, inputVars));
}
;

const deleteFlightTicketRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeleteFlightTicket', inputVars);
}
deleteFlightTicketRef.operationName = 'DeleteFlightTicket';
exports.deleteFlightTicketRef = deleteFlightTicketRef;

exports.deleteFlightTicket = function deleteFlightTicket(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(deleteFlightTicketRef(dcInstance, inputVars));
}
;

const insertTransferServiceRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'InsertTransferService', inputVars);
}
insertTransferServiceRef.operationName = 'InsertTransferService';
exports.insertTransferServiceRef = insertTransferServiceRef;

exports.insertTransferService = function insertTransferService(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(insertTransferServiceRef(dcInstance, inputVars));
}
;

const updateTransferServiceRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateTransferService', inputVars);
}
updateTransferServiceRef.operationName = 'UpdateTransferService';
exports.updateTransferServiceRef = updateTransferServiceRef;

exports.updateTransferService = function updateTransferService(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(updateTransferServiceRef(dcInstance, inputVars));
}
;

const deleteTransferServiceRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeleteTransferService', inputVars);
}
deleteTransferServiceRef.operationName = 'DeleteTransferService';
exports.deleteTransferServiceRef = deleteTransferServiceRef;

exports.deleteTransferService = function deleteTransferService(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(deleteTransferServiceRef(dcInstance, inputVars));
}
;

const insertFleetVehicleRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'InsertFleetVehicle', inputVars);
}
insertFleetVehicleRef.operationName = 'InsertFleetVehicle';
exports.insertFleetVehicleRef = insertFleetVehicleRef;

exports.insertFleetVehicle = function insertFleetVehicle(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(insertFleetVehicleRef(dcInstance, inputVars));
}
;

const updateFleetVehicleRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateFleetVehicle', inputVars);
}
updateFleetVehicleRef.operationName = 'UpdateFleetVehicle';
exports.updateFleetVehicleRef = updateFleetVehicleRef;

exports.updateFleetVehicle = function updateFleetVehicle(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(updateFleetVehicleRef(dcInstance, inputVars));
}
;

const deleteFleetVehicleRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeleteFleetVehicle', inputVars);
}
deleteFleetVehicleRef.operationName = 'DeleteFleetVehicle';
exports.deleteFleetVehicleRef = deleteFleetVehicleRef;

exports.deleteFleetVehicle = function deleteFleetVehicle(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(deleteFleetVehicleRef(dcInstance, inputVars));
}
;

const insertFleetDriverRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'InsertFleetDriver', inputVars);
}
insertFleetDriverRef.operationName = 'InsertFleetDriver';
exports.insertFleetDriverRef = insertFleetDriverRef;

exports.insertFleetDriver = function insertFleetDriver(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(insertFleetDriverRef(dcInstance, inputVars));
}
;

const updateFleetDriverRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateFleetDriver', inputVars);
}
updateFleetDriverRef.operationName = 'UpdateFleetDriver';
exports.updateFleetDriverRef = updateFleetDriverRef;

exports.updateFleetDriver = function updateFleetDriver(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(updateFleetDriverRef(dcInstance, inputVars));
}
;

const deleteFleetDriverRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeleteFleetDriver', inputVars);
}
deleteFleetDriverRef.operationName = 'DeleteFleetDriver';
exports.deleteFleetDriverRef = deleteFleetDriverRef;

exports.deleteFleetDriver = function deleteFleetDriver(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(deleteFleetDriverRef(dcInstance, inputVars));
}
;

const updateInvoiceRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateInvoice', inputVars);
}
updateInvoiceRef.operationName = 'UpdateInvoice';
exports.updateInvoiceRef = updateInvoiceRef;

exports.updateInvoice = function updateInvoice(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(updateInvoiceRef(dcInstance, inputVars));
}
;

const updateClientRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateClient', inputVars);
}
updateClientRef.operationName = 'UpdateClient';
exports.updateClientRef = updateClientRef;

exports.updateClient = function updateClient(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(updateClientRef(dcInstance, inputVars));
}
;

const deleteInvoiceRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeleteInvoice', inputVars);
}
deleteInvoiceRef.operationName = 'DeleteInvoice';
exports.deleteInvoiceRef = deleteInvoiceRef;

exports.deleteInvoice = function deleteInvoice(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(deleteInvoiceRef(dcInstance, inputVars));
}
;

const deleteClientRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeleteClient', inputVars);
}
deleteClientRef.operationName = 'DeleteClient';
exports.deleteClientRef = deleteClientRef;

exports.deleteClient = function deleteClient(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(deleteClientRef(dcInstance, inputVars));
}
;

const deletePaymentVoucherRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeletePaymentVoucher', inputVars);
}
deletePaymentVoucherRef.operationName = 'DeletePaymentVoucher';
exports.deletePaymentVoucherRef = deletePaymentVoucherRef;

exports.deletePaymentVoucher = function deletePaymentVoucher(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(deletePaymentVoucherRef(dcInstance, inputVars));
}
;

const deleteReservationRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeleteReservation', inputVars);
}
deleteReservationRef.operationName = 'DeleteReservation';
exports.deleteReservationRef = deleteReservationRef;

exports.deleteReservation = function deleteReservation(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(deleteReservationRef(dcInstance, inputVars));
}
;

const deleteDetailedPropertyRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeleteDetailedProperty', inputVars);
}
deleteDetailedPropertyRef.operationName = 'DeleteDetailedProperty';
exports.deleteDetailedPropertyRef = deleteDetailedPropertyRef;

exports.deleteDetailedProperty = function deleteDetailedProperty(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(deleteDetailedPropertyRef(dcInstance, inputVars));
}
;

const deleteRoomTypeRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeleteRoomType', inputVars);
}
deleteRoomTypeRef.operationName = 'DeleteRoomType';
exports.deleteRoomTypeRef = deleteRoomTypeRef;

exports.deleteRoomType = function deleteRoomType(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(deleteRoomTypeRef(dcInstance, inputVars));
}
;

const deleteRatePlanRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeleteRatePlan', inputVars);
}
deleteRatePlanRef.operationName = 'DeleteRatePlan';
exports.deleteRatePlanRef = deleteRatePlanRef;

exports.deleteRatePlan = function deleteRatePlan(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(deleteRatePlanRef(dcInstance, inputVars));
}
;

const deleteStopSaleRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeleteStopSale', inputVars);
}
deleteStopSaleRef.operationName = 'DeleteStopSale';
exports.deleteStopSaleRef = deleteStopSaleRef;

exports.deleteStopSale = function deleteStopSale(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(deleteStopSaleRef(dcInstance, inputVars));
}
;

const insertPayableObligationRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'InsertPayableObligation', inputVars);
}
insertPayableObligationRef.operationName = 'InsertPayableObligation';
exports.insertPayableObligationRef = insertPayableObligationRef;

exports.insertPayableObligation = function insertPayableObligation(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(insertPayableObligationRef(dcInstance, inputVars));
}
;

const updatePayableObligationRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdatePayableObligation', inputVars);
}
updatePayableObligationRef.operationName = 'UpdatePayableObligation';
exports.updatePayableObligationRef = updatePayableObligationRef;

exports.updatePayableObligation = function updatePayableObligation(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(updatePayableObligationRef(dcInstance, inputVars));
}
;

const deletePayableObligationRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeletePayableObligation', inputVars);
}
deletePayableObligationRef.operationName = 'DeletePayableObligation';
exports.deletePayableObligationRef = deletePayableObligationRef;

exports.deletePayableObligation = function deletePayableObligation(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(deletePayableObligationRef(dcInstance, inputVars));
}
;

const insertProviderStatementRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'InsertProviderStatement', inputVars);
}
insertProviderStatementRef.operationName = 'InsertProviderStatement';
exports.insertProviderStatementRef = insertProviderStatementRef;

exports.insertProviderStatement = function insertProviderStatement(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(insertProviderStatementRef(dcInstance, inputVars));
}
;

const deleteProviderStatementRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeleteProviderStatement', inputVars);
}
deleteProviderStatementRef.operationName = 'DeleteProviderStatement';
exports.deleteProviderStatementRef = deleteProviderStatementRef;

exports.deleteProviderStatement = function deleteProviderStatement(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(deleteProviderStatementRef(dcInstance, inputVars));
}
;

const insertExtraServiceRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'InsertExtraService', inputVars);
}
insertExtraServiceRef.operationName = 'InsertExtraService';
exports.insertExtraServiceRef = insertExtraServiceRef;

exports.insertExtraService = function insertExtraService(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(insertExtraServiceRef(dcInstance, inputVars));
}
;

const updateExtraServiceRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateExtraService', inputVars);
}
updateExtraServiceRef.operationName = 'UpdateExtraService';
exports.updateExtraServiceRef = updateExtraServiceRef;

exports.updateExtraService = function updateExtraService(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(updateExtraServiceRef(dcInstance, inputVars));
}
;

const deleteExtraServiceRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeleteExtraService', inputVars);
}
deleteExtraServiceRef.operationName = 'DeleteExtraService';
exports.deleteExtraServiceRef = deleteExtraServiceRef;

exports.deleteExtraService = function deleteExtraService(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(deleteExtraServiceRef(dcInstance, inputVars));
}
;

const insertServiceRateRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'InsertServiceRate', inputVars);
}
insertServiceRateRef.operationName = 'InsertServiceRate';
exports.insertServiceRateRef = insertServiceRateRef;

exports.insertServiceRate = function insertServiceRate(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(insertServiceRateRef(dcInstance, inputVars));
}
;

const updateServiceRateRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateServiceRate', inputVars);
}
updateServiceRateRef.operationName = 'UpdateServiceRate';
exports.updateServiceRateRef = updateServiceRateRef;

exports.updateServiceRate = function updateServiceRate(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(updateServiceRateRef(dcInstance, inputVars));
}
;

const deleteServiceRateRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeleteServiceRate', inputVars);
}
deleteServiceRateRef.operationName = 'DeleteServiceRate';
exports.deleteServiceRateRef = deleteServiceRateRef;

exports.deleteServiceRate = function deleteServiceRate(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(deleteServiceRateRef(dcInstance, inputVars));
}
;

const listReservationsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListReservations');
}
listReservationsRef.operationName = 'ListReservations';
exports.listReservationsRef = listReservationsRef;

exports.listReservations = function listReservations(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(listReservationsRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const listClientsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListClients');
}
listClientsRef.operationName = 'ListClients';
exports.listClientsRef = listClientsRef;

exports.listClients = function listClients(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(listClientsRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const listInvoicesRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListInvoices');
}
listInvoicesRef.operationName = 'ListInvoices';
exports.listInvoicesRef = listInvoicesRef;

exports.listInvoices = function listInvoices(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(listInvoicesRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const listPropertiesRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListProperties');
}
listPropertiesRef.operationName = 'ListProperties';
exports.listPropertiesRef = listPropertiesRef;

exports.listProperties = function listProperties(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(listPropertiesRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const listDetailedPropertiesRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListDetailedProperties');
}
listDetailedPropertiesRef.operationName = 'ListDetailedProperties';
exports.listDetailedPropertiesRef = listDetailedPropertiesRef;

exports.listDetailedProperties = function listDetailedProperties(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(listDetailedPropertiesRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const listRoomTypesRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListRoomTypes');
}
listRoomTypesRef.operationName = 'ListRoomTypes';
exports.listRoomTypesRef = listRoomTypesRef;

exports.listRoomTypes = function listRoomTypes(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(listRoomTypesRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const listRatePlansRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListRatePlans');
}
listRatePlansRef.operationName = 'ListRatePlans';
exports.listRatePlansRef = listRatePlansRef;

exports.listRatePlans = function listRatePlans(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(listRatePlansRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const listStopSalesRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListStopSales');
}
listStopSalesRef.operationName = 'ListStopSales';
exports.listStopSalesRef = listStopSalesRef;

exports.listStopSales = function listStopSales(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(listStopSalesRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const listFlightTicketsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListFlightTickets');
}
listFlightTicketsRef.operationName = 'ListFlightTickets';
exports.listFlightTicketsRef = listFlightTicketsRef;

exports.listFlightTickets = function listFlightTickets(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(listFlightTicketsRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const listTransferServicesRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListTransferServices');
}
listTransferServicesRef.operationName = 'ListTransferServices';
exports.listTransferServicesRef = listTransferServicesRef;

exports.listTransferServices = function listTransferServices(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(listTransferServicesRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const listFleetVehiclesRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListFleetVehicles');
}
listFleetVehiclesRef.operationName = 'ListFleetVehicles';
exports.listFleetVehiclesRef = listFleetVehiclesRef;

exports.listFleetVehicles = function listFleetVehicles(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(listFleetVehiclesRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const listFleetDriversRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListFleetDrivers');
}
listFleetDriversRef.operationName = 'ListFleetDrivers';
exports.listFleetDriversRef = listFleetDriversRef;

exports.listFleetDrivers = function listFleetDrivers(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(listFleetDriversRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const listPayableObligationsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListPayableObligations');
}
listPayableObligationsRef.operationName = 'ListPayableObligations';
exports.listPayableObligationsRef = listPayableObligationsRef;

exports.listPayableObligations = function listPayableObligations(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(listPayableObligationsRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const listProviderStatementsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListProviderStatements');
}
listProviderStatementsRef.operationName = 'ListProviderStatements';
exports.listProviderStatementsRef = listProviderStatementsRef;

exports.listProviderStatements = function listProviderStatements(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(listProviderStatementsRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const listExtraServicesRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListExtraServices');
}
listExtraServicesRef.operationName = 'ListExtraServices';
exports.listExtraServicesRef = listExtraServicesRef;

exports.listExtraServices = function listExtraServices(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(listExtraServicesRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const listServiceRatesRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListServiceRates');
}
listServiceRatesRef.operationName = 'ListServiceRates';
exports.listServiceRatesRef = listServiceRatesRef;

exports.listServiceRates = function listServiceRates(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(listServiceRatesRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;
