/**
 * src/lib/zkteco/adapter.ts
 * Attendance Device Communication Abstraction Interface (Vendor-Agnostic)
 */

import {
  DeviceInfoResult,
  DeviceUserRecord,
  DeviceAttendanceLog,
  TestConnectionResult,
} from './types';

export interface AttendanceDeviceAdapter {
  /**
   * Connect to the device over its native transport protocol
   */
  connect(): Promise<boolean>;

  /**
   * Disconnect and release network socket/resources
   */
  disconnect(): Promise<void>;

  /**
   * Test physical and protocol connectivity, returning comprehensive device info or error diagnostic
   */
  testConnection(): Promise<TestConnectionResult>;

  /**
   * Read firmware, hardware, platform, algorithms, user counts and logs from device
   */
  getDeviceInfo(): Promise<DeviceInfoResult>;

  /**
   * Retrieve all registered users and biometric enrollment status from device
   */
  getUsers(): Promise<DeviceUserRecord[]>;

  /**
   * Retrieve attendance transaction logs (optionally since given timestamp)
   */
  getAttendanceLogs(sinceTimestamp?: string): Promise<DeviceAttendanceLog[]>;

  /**
   * Push a user or update user details to the physical device
   */
  pushUser(user: {
    userId: string;
    name: string;
    cardNumber?: string;
    password?: string;
    role?: 'User' | 'Enroller' | 'Admin' | 'SuperAdmin';
  }): Promise<boolean>;

  /**
   * Update an existing user on the device
   */
  updateUser(user: {
    userId: string;
    name: string;
    cardNumber?: string;
    password?: string;
    role?: 'User' | 'Enroller' | 'Admin' | 'SuperAdmin';
  }): Promise<boolean>;

  /**
   * Disable a user on the device
   */
  disableUser(userId: string): Promise<boolean>;

  /**
   * Synchronize the physical device clock with server time (with confirmation)
   */
  syncDeviceTime(targetDate?: Date): Promise<{
    success: boolean;
    deviceTime: string;
    serverTime: string;
    timeDifferenceSec: number;
  }>;

  /**
   * Get current live connectivity status of the device
   */
  getDeviceStatus(): Promise<'Online' | 'Offline' | 'Error'>;
}
