import { apiRequest } from 'utils/api/client';

import type { QrDecodeResult, QrIdentifierParts, QrOutletDetails, QrScanBox, QrScanConnector, QrVehicleType } from './types';

type CollectionResponse<T> =
  | T[]
  | {
      data?: T[];
      'hydra:member'?: T[];
      member?: T[];
    };

type QrDecodeApiResponse = {
  identifier?: unknown;
  vehicle_type?: unknown;
};

function unwrapCollection<T>(response: CollectionResponse<T>) {
  if (Array.isArray(response)) return response;
  return response.data || response['hydra:member'] || response.member || [];
}

function isQrVehicleType(value: unknown): value is QrVehicleType {
  return value === 'bike' || value === 'car';
}

export async function decodeQrCode(qrText: string): Promise<QrDecodeResult> {
  const response = await apiRequest<QrDecodeApiResponse, { qr_text: string }>('/api/controller/ocpi/qr/decode', {
    data: { qr_text: qrText },
    method: 'POST',
  });
  const vehicleType = typeof response.vehicle_type === 'string' ? response.vehicle_type.toLowerCase() : response.vehicle_type;
  const identifier = typeof response.identifier === 'string' ? response.identifier.trim() : '';

  if (!isQrVehicleType(vehicleType) || !identifier) {
    throw new Error('The QR decode response is missing a supported vehicle type or identifier.');
  }

  return { identifier, vehicle_type: vehicleType };
}

export function parseQrIdentifier(identifier: string): QrIdentifierParts {
  const match = /^(.*)_(\d+)$/.exec(identifier.trim());
  const vendorId = match?.[1]?.trim();
  const connectorOrder = Number(match?.[2]);

  if (!vendorId || !Number.isSafeInteger(connectorOrder) || connectorOrder < 0) {
    throw new Error('The QR identifier does not contain a valid box vendor ID and connector number.');
  }

  return { connectorOrder, vendorId };
}

function getConnectors(box: QrScanBox, vehicleType: QrVehicleType) {
  if (vehicleType === 'car') return box.carConnectors || [];
  return box.outlets || box.bikeConnectors || [];
}

function findConnector(connectors: QrScanConnector[], connectorOrder: number) {
  return (
    connectors.find(connector => connector.orderOnBox === connectorOrder) || connectors.find(connector => connector.uniqueId?.endsWith(`_${connectorOrder}`))
  );
}

function getResourceId(resource?: string) {
  const match = resource?.match(/\/(\d+)\/?$/);
  return match?.[1];
}

export async function fetchQrOutletDetails(decoded: QrDecodeResult): Promise<QrOutletDetails> {
  const { connectorOrder, vendorId } = parseQrIdentifier(decoded.identifier);
  const path = decoded.vehicle_type === 'car' ? '/api/car_boxes' : '/api/bike_boxes';
  const response = await apiRequest<CollectionResponse<QrScanBox>>(path, { params: { vendorId } });
  const boxes = unwrapCollection(response);
  const exactBox = boxes.find(box => box.vendorId === vendorId);
  const box = exactBox || (boxes.length === 1 ? boxes[0] : undefined);

  if (!box) {
    throw new Error(`No ${decoded.vehicle_type} box was found for vendor ID ${vendorId}.`);
  }

  const connector = findConnector(getConnectors(box, decoded.vehicle_type), connectorOrder);
  if (!connector) {
    throw new Error(`Connector ${connectorOrder} was not found on box ${vendorId}.`);
  }

  const station = box.station && typeof box.station === 'object' ? box.station : undefined;
  const stationReference = typeof box.station === 'string' ? box.station : station?.iriId;
  const stationId = station?.id || getResourceId(stationReference);

  if (!stationId) {
    throw new Error(`Station information was not found on box ${vendorId}.`);
  }

  return {
    box,
    connector,
    connectorOrder,
    station,
    stationId,
    stationReference,
    vehicleType: decoded.vehicle_type,
    vendorId,
  };
}
