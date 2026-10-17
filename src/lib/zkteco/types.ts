/**
 * src/lib/zkteco/types.ts
 * Type definitions and error codes for ZKTeco SpeedFace-V5L Integration
 */

export const ZKTECO_ERROR_CODES = {
  DEVICE_OFFLINE: 'DEVICE_OFFLINE',
  CONNECTION_TIMEOUT: 'CONNECTION_TIMEOUT',
  CONNECTION_REFUSED: 'CONNECTION_REFUSED',
  AUTHENTICATION_FAILED: 'AUTHENTICATION_FAILED',
  INVALID_CONFIGURATION: 'INVALID_CONFIGURATION',
  UNSUPPORTED_DEVICE: 'UNSUPPORTED_DEVICE',
  SYNC_IN_PROGRESS: 'SYNC_IN_PROGRESS',
  SYNC_FAILED: 'SYNC_FAILED',
  USER_MAPPING_FAILED: 'USER_MAPPING_FAILED',
  DUPLICATE_TRANSACTION: 'DUPLICATE_TRANSACTION',
} as const;

export type ZKTecoErrorCode = typeof ZKTECO_ERROR_CODES[keyof typeof ZKTECO_ERROR_CODES];

export interface DeviceConnectionConfig {
  host: string;
  port: number;
  commKey?: number | string;
  timeoutMs?: number;
  retryAttempts?: number;
  transport?: 'tcp' | 'udp';
}

export interface DeviceInfoResult {
  deviceName: string;
  model: string;
  platform: string;
  serialNumber: string;
  macAddress?: string;
  firmwareVersion: string;
  fingerprintAlg: string;
  faceAlg: string;
  userCount: number;
  logCount: number;
  fingerprintCount?: number;
  faceCount?: number;
  deviceTime: string;
  serverTime: string;
  timeDifferenceSec: number;
}

export interface DeviceUserRecord {
  uid: number;
  userId: string; // PIN / string user ID on device
  name: string;
  cardNumber?: string;
  password?: string;
  role: 'User' | 'Enroller' | 'Admin' | 'SuperAdmin';
  hasFingerprint: boolean;
  hasFace: boolean;
  hasCard: boolean;
  hasPassword: boolean;
}

export interface DeviceAttendanceLog {
  uid?: number;
  userId: string;
  timestamp: string; // ISO string '2026-10-05T08:02:31.000Z'
  punchDate: string; // YYYY-MM-DD
  punchTime: string; // HH:MM:SS
  punchType: 'Check-In' | 'Check-Out' | 'Break-Out' | 'Break-In' | 'OT-In' | 'OT-Out';
  verificationMethod: 'Fingerprint' | 'Face' | 'Card' | 'PIN' | 'Password' | 'Other';
  transactionId: string;
  rawPayload?: any;
}

export interface TestConnectionResult {
  success: boolean;
  status: 'Online' | 'Offline' | 'Error';
  info?: DeviceInfoResult;
  error?: string;
  errorCode?: ZKTecoErrorCode;
  suggestions?: string[];
  latencyMs?: number;
}

export interface DeviceSyncSummary {
  deviceId: string;
  deviceName: string;
  success: boolean;
  operation: string;
  recordsRetrieved: number;
  recordsCreated: number;
  duplicates: number;
  errors: number;
  durationSec: number;
  errorCode?: string;
  errorMessage?: string;
}

export interface BatchSyncResult {
  success: boolean;
  totalDevices: number;
  successfulDevices: number;
  failedDevices: number;
  totalRetrieved: number;
  totalNew: number;
  totalDuplicates: number;
  totalErrors: number;
  deviceResults: DeviceSyncSummary[];
  processedAttendanceCount: number;
  durationSec: number;
}
