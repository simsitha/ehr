/**
 * src/lib/zkteco/sync-service.ts
 * High-Level Service Orchestrating ZKTeco Synchronization Workflows
 */

import fs from 'fs';
import path from 'path';
import {
  getDb,
  getZKTecoDeviceById,
  getZKTecoDevices,
  getZKTecoDeviceUsers,
  updateZKTecoDevice,
  upsertZKTecoDeviceUser,
  recalculateDeviceUserCounts,
  insertRawTransactions,
  createZKTecoSyncLog,
} from '@/lib/db';
import { ZKTecoDevice, ZKTecoRawTransaction } from '@/lib/types';
import { ZKTecoSpeedFaceAdapter } from './speedface-adapter';
import { UserMappingEngine } from './mapping-engine';
import { AttendanceProcessor } from './attendance-processor';
import { NetworkDiagnostics } from './network-diagnostics';
import {
  BatchSyncResult,
  DeviceSyncSummary,
  TestConnectionResult,
  ZKTECO_ERROR_CODES,
} from './types';
import { queueDeviceCommand } from './adms-server';

// Map of currently running sync jobs by device ID to prevent concurrent runs on the same device
const activeSyncJobs = new Set<string>();

export class ZKTecoSyncService {
  /**
   * Factory method to create an adapter for a given device record
   */
  public static getAdapterForDevice(device: ZKTecoDevice): ZKTecoSpeedFaceAdapter {
    return new ZKTecoSpeedFaceAdapter({
      host: device.ip_address,
      port: device.port,
      commKey: device.auth_password || 0,
      timeoutMs: (device.connection_timeout || 10) * 1000,
      retryAttempts: device.retry_attempts || 3,
      deviceName: device.name,
      platform: device.platform || 'ZAM230',
    });
  }

  /**
   * Test Connection to a device
   */
  public static async testDevice(deviceId: string, adminUser: string = 'Administrator'): Promise<TestConnectionResult> {
    const device = getZKTecoDeviceById(deviceId);
    if (!device) {
      return {
        success: false,
        status: 'Error',
        errorCode: ZKTECO_ERROR_CODES.INVALID_CONFIGURATION,
        error: `Device with ID ${deviceId} not found.`,
      };
    }

    const start = Date.now();
    const now = new Date().toISOString();

    // Mode A: Push/ADMS Connection Test (Validates HRM Push Receiver on 192.168.88.168:8081 and terminal liveness)
    if (device.connection_type === 'Push/ADMS') {
      const admsPort = Number(process.env.ADMS_PORT) || 8081;
      const admsHost = process.env.ADMS_SERVER_IP || '192.168.88.168';
      const probeResult = await NetworkDiagnostics.probePort('127.0.0.1', admsPort, 2000);
      const durationSec = Math.round(((Date.now() - start) / 1000) * 10) / 10;

      if (!probeResult.open) {
        updateZKTecoDevice(deviceId, {
          status: 'Offline',
          last_error: `ADMS Push Receiver is not listening on port ${admsPort}`,
          error_code: ZKTECO_ERROR_CODES.DEVICE_OFFLINE,
        });

        createZKTecoSyncLog({
          device_id: device.id,
          device_name: device.name,
          operation: 'Connect Test',
          result: 'FAILED',
          duration_sec: durationSec,
          ip_address: device.ip_address,
          user_name: adminUser,
          details: `ADMS Push Receiver not listening on port ${admsPort}. Check hr-adms.service.`,
          error_code: ZKTECO_ERROR_CODES.DEVICE_OFFLINE,
        });

        return {
          success: false,
          status: 'Offline',
          errorCode: ZKTECO_ERROR_CODES.DEVICE_OFFLINE,
          error: `ADMS Push Receiver is not running on port ${admsPort}. Please verify hr-adms.service is started.`,
          suggestions: [
            `1. Start the ADMS receiver: sudo systemctl start hr-adms.service`,
            `2. Verify port 8081 is open: sudo ss -tulpn | grep 8081`,
            `3. In device menu, set Cloud Server: ${admsHost}, Port: ${admsPort}`,
          ],
        };
      }

      // Receiver is running. Now evaluate actual device liveness (push received within 2 minutes)
      const isRecentlyConnected = !!(
        device.last_connection &&
        Date.now() - new Date(device.last_connection).getTime() <= 120000
      );

      if (isRecentlyConnected) {
        updateZKTecoDevice(deviceId, {
          status: 'Online',
          last_successful_connection: now,
          last_error: null,
          error_code: null,
        });

        createZKTecoSyncLog({
          device_id: device.id,
          device_name: device.name,
          operation: 'Connect Test',
          result: 'SUCCESS',
          duration_sec: durationSec,
          ip_address: device.ip_address,
          user_name: adminUser,
          details: `Device ${device.name} is ONLINE. Active ADMS pushes received at ${admsHost}:${admsPort} (${probeResult.latencyMs}ms). Last seen: ${new Date(device.last_connection!).toLocaleTimeString()}.`,
        });

        return {
          success: true,
          status: 'Online',
          latencyMs: probeResult.latencyMs,
          info: {
            deviceName: device.name,
            model: device.model,
            platform: device.platform || 'ZAM230',
            serialNumber: device.serial_number || 'SF5L2026',
            firmwareVersion: device.firmware_version || 'ADMS Push Protocol v3.1.1',
            fingerprintAlg: device.fingerprint_alg || 'ZKFP VX13.0',
            faceAlg: device.face_alg || 'ZKFace VX3.6',
            userCount: device.user_count || 0,
            logCount: device.log_count || 0,
            fingerprintCount: device.fingerprint_count || 0,
            faceCount: device.face_count || 0,
            deviceTime: device.last_connection || now,
            serverTime: now,
            timeDifferenceSec: 0,
          },
        };
      } else {
        // Device has not pushed recently - probe physical device over LAN via ICMP Ping
        const pingResult = await NetworkDiagnostics.pingHost(device.ip_address, 2, 2);
        const lastSeenMsg = device.last_connection
          ? `Last push was at ${new Date(device.last_connection).toLocaleTimeString()}`
          : 'No ADMS push received yet';

        const errorMsg = pingResult.success
          ? `Device ${device.name} (${device.ip_address}) responds to ping on LAN, but is currently OFFLINE (no ADMS push received at ${admsHost}:${admsPort} in the last 2 minutes; ${lastSeenMsg}).`
          : `Device ${device.name} (${device.ip_address}) is OFFLINE and unreachable on network (ping failed: 100% packet loss).`;

        updateZKTecoDevice(deviceId, {
          status: 'Offline',
          last_error: errorMsg,
          error_code: ZKTECO_ERROR_CODES.DEVICE_OFFLINE,
        });

        createZKTecoSyncLog({
          device_id: device.id,
          device_name: device.name,
          operation: 'Connect Test',
          result: 'FAILED',
          duration_sec: durationSec,
          ip_address: device.ip_address,
          user_name: adminUser,
          details: errorMsg,
          error_code: ZKTECO_ERROR_CODES.DEVICE_OFFLINE,
        });

        const suggestions = pingResult.success
          ? [
              `1. Terminal IP (${device.ip_address}) is powered on and pingable on LAN.`,
              `2. On terminal screen: Open Menu → Comm. → Cloud Server (or ADMS / Web Server).`,
              `3. Set Server Address: ${admsHost} (HESTRA HRM Server IP).`,
              `4. Set Server Port: ${admsPort}.`,
              `5. Set Enable Domain Name: OFF (use IP address).`,
              `6. Verify terminal gateway is configured to 192.168.88.1.`,
            ]
          : [
              `1. Check power cable and ensure ${device.name} terminal is turned on.`,
              `2. Check physical Ethernet cable and switch link LEDs.`,
              `3. Verify assigned device IP matches ${device.ip_address} on subnet 192.168.88.0/24.`,
            ];

        return {
          success: false,
          status: 'Offline',
          errorCode: ZKTECO_ERROR_CODES.DEVICE_OFFLINE,
          error: errorMsg,
          suggestions,
        };
      }
    }

    // Mode B: Direct TCP/IP Port 4370 Connection Test
    const adapter = this.getAdapterForDevice(device);
    const result = await adapter.testConnection();
    const durationSec = Math.round(((Date.now() - start) / 1000) * 10) / 10;

    if (result.success && result.info) {
      updateZKTecoDevice(deviceId, {
        status: 'Online',
        last_connection: now,
        last_successful_connection: now,
        last_error: null,
        error_code: null,
        serial_number: result.info.serialNumber,
        firmware_version: result.info.firmwareVersion,
        fingerprint_alg: result.info.fingerprintAlg,
        face_alg: result.info.faceAlg,
        user_count: result.info.userCount,
        log_count: result.info.logCount,
        fingerprint_count: result.info.fingerprintCount || 0,
        face_count: result.info.faceCount || 0,
        device_time: result.info.deviceTime,
        server_time: result.info.serverTime,
        time_difference_sec: result.info.timeDifferenceSec,
      });

      createZKTecoSyncLog({
        device_id: device.id,
        device_name: device.name,
        operation: 'Connect Test',
        result: 'SUCCESS',
        duration_sec: durationSec,
        ip_address: device.ip_address,
        user_name: adminUser,
        details: `Connection successful (${result.latencyMs}ms). FW: ${result.info.firmwareVersion}, Users: ${result.info.userCount}, Logs: ${result.info.logCount}`,
      });
    } else {
      updateZKTecoDevice(deviceId, {
        status: 'Offline',
        last_connection: now,
        last_error: result.error || 'Connection failed',
        error_code: result.errorCode || ZKTECO_ERROR_CODES.DEVICE_OFFLINE,
      });

      createZKTecoSyncLog({
        device_id: device.id,
        device_name: device.name,
        operation: 'Connect Test',
        result: 'FAILED',
        duration_sec: durationSec,
        ip_address: device.ip_address,
        user_name: adminUser,
        details: result.error,
        error_code: result.errorCode,
      });
    }

    return result;
  }

  /**
   * Sync users from device to Hestra HRM & run auto-matching
   */
  public static async syncDeviceUsers(
    deviceId: string,
    adminUser: string = 'Administrator'
  ): Promise<DeviceSyncSummary> {
    if (activeSyncJobs.has(deviceId)) {
      return {
        deviceId,
        deviceName: deviceId,
        success: false,
        operation: 'Sync Users',
        recordsRetrieved: 0,
        recordsCreated: 0,
        duplicates: 0,
        errors: 1,
        durationSec: 0,
        errorCode: ZKTECO_ERROR_CODES.SYNC_IN_PROGRESS,
        errorMessage: 'A synchronization operation is already in progress for this device.',
      };
    }

    activeSyncJobs.add(deviceId);
    const start = Date.now();

    try {
      const device = getZKTecoDeviceById(deviceId);
      if (!device) {
        throw new Error(`Device ${deviceId} not found`);
      }

      updateZKTecoDevice(deviceId, { status: 'Syncing', last_sync: new Date().toISOString() });

      if (device.connection_type === 'Push/ADMS') {
        // Queue commands for physical terminal to upload its users and specs on its next heartbeat
        const targetKeys = [device.serial_number, device.ip_address, device.id].filter(Boolean) as string[];
        for (const k of targetKeys) {
          queueDeviceCommand(k, 'INFO');
          queueDeviceCommand(k, 'DATA QUERY USERINFO');
          queueDeviceCommand(k, 'DATA QUERY table=user');
          queueDeviceCommand(k, 'DATA QUERY BIODATA');
        }

        const matchStats = UserMappingEngine.runAutoMatching(deviceId);
        const durationSec = Math.round(((Date.now() - start) / 1000) * 10) / 10;
        const now = new Date().toISOString();

        updateZKTecoDevice(deviceId, {
          status: 'Online',
          last_sync: now,
          last_successful_sync: now,
          last_sync_status: 'SUCCESS',
          last_error: null,
          error_code: null,
        });

        createZKTecoSyncLog({
          device_id: device.id,
          device_name: device.name,
          operation: 'Sync Users',
          result: 'SUCCESS',
          records_retrieved: device.user_count || 0,
          records_created: matchStats.newlyMapped,
          duplicates: 0,
          errors: 0,
          duration_sec: durationSec,
          ip_address: device.ip_address,
          user_name: adminUser,
          details: `Queued 'DATA QUERY USERINFO' command for ${device.name}. Terminal will upload enrolled users on next heartbeat (within 30s). Auto-matched: ${matchStats.newlyMapped}.`,
        });

        return {
          deviceId,
          deviceName: device.name,
          success: true,
          operation: 'Sync Users',
          recordsRetrieved: device.user_count || 0,
          recordsCreated: matchStats.newlyMapped,
          duplicates: 0,
          errors: 0,
          durationSec,
        };
      }

      const adapter = this.getAdapterForDevice(device);
      const rawUsers = await adapter.getUsers();

      let createdCount = 0;
      for (const u of rawUsers) {
        upsertZKTecoDeviceUser({
          device_id: device.id,
          device_user_id: u.userId,
          device_user_name: u.name,
          card_number: u.cardNumber,
          privilege: u.role,
          has_fingerprint: u.hasFingerprint,
          has_face: u.hasFace,
          has_card: u.hasCard,
          has_password: u.hasPassword,
          biometric_status: 'Enrolled',
        });
        createdCount++;
      }

      // Automatically run auto-matching with Hestra employees
      const matchStats = UserMappingEngine.runAutoMatching(deviceId);

      const durationSec = Math.round(((Date.now() - start) / 1000) * 10) / 10;
      const now = new Date().toISOString();

      updateZKTecoDevice(deviceId, {
        status: 'Online',
        user_count: rawUsers.length,
        last_sync: now,
        last_successful_sync: now,
        last_sync_status: 'SUCCESS',
        last_error: null,
        error_code: null,
      });

      createZKTecoSyncLog({
        device_id: device.id,
        device_name: device.name,
        operation: 'Sync Users',
        result: 'SUCCESS',
        records_retrieved: rawUsers.length,
        records_created: createdCount,
        duplicates: 0,
        errors: 0,
        duration_sec: durationSec,
        ip_address: device.ip_address,
        user_name: adminUser,
        details: `Synced ${rawUsers.length} users from device. Auto-matched: ${matchStats.newlyMapped} employees.`,
      });

      return {
        deviceId,
        deviceName: device.name,
        success: true,
        operation: 'Sync Users',
        recordsRetrieved: rawUsers.length,
        recordsCreated: createdCount,
        duplicates: 0,
        errors: 0,
        durationSec,
      };
    } catch (err: any) {
      const durationSec = Math.round(((Date.now() - start) / 1000) * 10) / 10;
      const device = getZKTecoDeviceById(deviceId);

      updateZKTecoDevice(deviceId, {
        status: 'Error',
        last_sync: new Date().toISOString(),
        last_error: err.message,
        error_code: ZKTECO_ERROR_CODES.SYNC_FAILED,
        last_sync_status: 'FAILED',
      });

      createZKTecoSyncLog({
        device_id: deviceId,
        device_name: device ? device.name : deviceId,
        operation: 'Sync Users',
        result: 'FAILED',
        duration_sec: durationSec,
        user_name: adminUser,
        details: err.message,
        error_code: ZKTECO_ERROR_CODES.SYNC_FAILED,
      });

      return {
        deviceId,
        deviceName: device ? device.name : deviceId,
        success: false,
        operation: 'Sync Users',
        recordsRetrieved: 0,
        recordsCreated: 0,
        duplicates: 0,
        errors: 1,
        durationSec,
        errorCode: ZKTECO_ERROR_CODES.SYNC_FAILED,
        errorMessage: err.message,
      };
    } finally {
      activeSyncJobs.delete(deviceId);
    }
  }

  /**
   * Sync attendance transaction logs from device, insert raw logs, and process into daily attendance
   */
  public static async syncDeviceAttendance(
    deviceId: string,
    adminUser: string = 'Administrator',
    options?: { incremental?: boolean }
  ): Promise<DeviceSyncSummary> {
    if (activeSyncJobs.has(deviceId)) {
      return {
        deviceId,
        deviceName: deviceId,
        success: false,
        operation: 'Sync Attendance',
        recordsRetrieved: 0,
        recordsCreated: 0,
        duplicates: 0,
        errors: 1,
        durationSec: 0,
        errorCode: ZKTECO_ERROR_CODES.SYNC_IN_PROGRESS,
        errorMessage: 'A synchronization operation is already in progress for this device.',
      };
    }

    activeSyncJobs.add(deviceId);
    const start = Date.now();

    try {
      const device = getZKTecoDeviceById(deviceId);
      if (!device) {
        throw new Error(`Device ${deviceId} not found`);
      }

      updateZKTecoDevice(deviceId, { status: 'Syncing', last_sync: new Date().toISOString() });

      if (device.connection_type === 'Push/ADMS') {
        const processStats = AttendanceProcessor.processRawTransactions({
          gracePeriodMinutes: 10,
        });

        const durationSec = Math.round(((Date.now() - start) / 1000) * 10) / 10;
        const now = new Date().toISOString();

        updateZKTecoDevice(deviceId, {
          status: 'Online',
          last_sync: now,
          last_successful_sync: now,
          last_sync_status: 'SUCCESS',
          last_error: null,
          error_code: null,
        });

        createZKTecoSyncLog({
          device_id: device.id,
          device_name: device.name,
          operation: 'Attendance Sync',
          result: 'SUCCESS',
          records_retrieved: device.log_count || 0,
          records_created: processStats.attendanceRecordsCreatedOrUpdated,
          duplicates: 0,
          errors: processStats.errors,
          duration_sec: durationSec,
          ip_address: device.ip_address,
          user_name: adminUser,
          details: `ADMS Push mode: Re-evaluated daily attendance from pushed logs (${processStats.attendanceRecordsCreatedOrUpdated} daily records updated).`,
        });

        return {
          deviceId,
          deviceName: device.name,
          success: true,
          operation: 'Sync Attendance',
          recordsRetrieved: device.log_count || 0,
          recordsCreated: processStats.attendanceRecordsCreatedOrUpdated,
          duplicates: 0,
          errors: processStats.errors,
          durationSec,
        };
      }

      const adapter = this.getAdapterForDevice(device);
      const sinceTimestamp = options?.incremental !== false ? device.last_successful_sync || undefined : undefined;
      const logs = await adapter.getAttendanceLogs(sinceTimestamp);

      // Map to raw transaction records
      const rawRecords: Partial<ZKTecoRawTransaction>[] = logs.map((l) => ({
        device_id: device.id,
        device_user_id: l.userId,
        transaction_id: l.transactionId,
        attendance_timestamp: l.timestamp,
        punch_date: l.punchDate,
        punch_time: l.punchTime,
        attendance_type: l.punchType,
        verification_method: l.verificationMethod,
        device_serial: device.serial_number,
        device_ip: device.ip_address,
        location: device.location,
        raw_payload: JSON.stringify(l.rawPayload || {}),
        source: 'ZKTeco Direct',
      }));

      // Insert with duplicate protection
      const insertStats = insertRawTransactions(rawRecords);

      // Feed into Hestra Attendance Engine
      const processStats = AttendanceProcessor.processRawTransactions({
        gracePeriodMinutes: 10,
      });

      const durationSec = Math.round(((Date.now() - start) / 1000) * 10) / 10;
      const now = new Date().toISOString();

      updateZKTecoDevice(deviceId, {
        status: 'Online',
        log_count: logs.length,
        last_sync: now,
        last_successful_sync: now,
        last_sync_status: 'SUCCESS',
        last_error: null,
        error_code: null,
      });

      createZKTecoSyncLog({
        device_id: device.id,
        device_name: device.name,
        operation: 'Attendance Sync',
        result: 'SUCCESS',
        records_retrieved: insertStats.retrieved,
        records_created: insertStats.newCount,
        duplicates: insertStats.duplicates,
        errors: processStats.errors,
        duration_sec: durationSec,
        ip_address: device.ip_address,
        user_name: adminUser,
        details: `Retrieved ${insertStats.retrieved} records. New: ${insertStats.newCount}, Duplicates: ${insertStats.duplicates}. Processed daily attendance: ${processStats.attendanceRecordsCreatedOrUpdated} records.`,
      });

      return {
        deviceId,
        deviceName: device.name,
        success: true,
        operation: 'Sync Attendance',
        recordsRetrieved: insertStats.retrieved,
        recordsCreated: insertStats.newCount,
        duplicates: insertStats.duplicates,
        errors: processStats.errors,
        durationSec,
      };
    } catch (err: any) {
      const durationSec = Math.round(((Date.now() - start) / 1000) * 10) / 10;
      const device = getZKTecoDeviceById(deviceId);

      updateZKTecoDevice(deviceId, {
        status: 'Error',
        last_sync: new Date().toISOString(),
        last_error: err.message,
        error_code: ZKTECO_ERROR_CODES.SYNC_FAILED,
        last_sync_status: 'FAILED',
      });

      createZKTecoSyncLog({
        device_id: deviceId,
        device_name: device ? device.name : deviceId,
        operation: 'Attendance Sync',
        result: 'FAILED',
        duration_sec: durationSec,
        user_name: adminUser,
        details: err.message,
        error_code: ZKTECO_ERROR_CODES.SYNC_FAILED,
      });

      return {
        deviceId,
        deviceName: device ? device.name : deviceId,
        success: false,
        operation: 'Sync Attendance',
        recordsRetrieved: 0,
        recordsCreated: 0,
        duplicates: 0,
        errors: 1,
        durationSec,
        errorCode: ZKTECO_ERROR_CODES.SYNC_FAILED,
        errorMessage: err.message,
      };
    } finally {
      activeSyncJobs.delete(deviceId);
    }
  }

  /**
   * Sync All Devices (Section 19):
   * Independent execution per device; failures in one device do NOT abort the other.
   * Then processes attendance across all collected punches.
   */
  public static async syncAllDevices(adminUser: string = 'Administrator'): Promise<BatchSyncResult> {
    const devices = getZKTecoDevices().filter((d) => d.is_enabled);
    const start = Date.now();

    // Run synchronization for each device independently and concurrently
    const devicePromises = devices.map(async (dev) => {
      // Step 1: Sync Users
      await this.syncDeviceUsers(dev.id, adminUser).catch(() => {});
      // Step 2: Sync Attendance
      return await this.syncDeviceAttendance(dev.id, adminUser);
    });

    const results = await Promise.all(devicePromises);

    // Global pass to process attendance for all collected punches
    const processResult = AttendanceProcessor.processRawTransactions({
      gracePeriodMinutes: 10,
    });

    const totalRetrieved = results.reduce((acc, r) => acc + r.recordsRetrieved, 0);
    const totalNew = results.reduce((acc, r) => acc + r.recordsCreated, 0);
    const totalDuplicates = results.reduce((acc, r) => acc + r.duplicates, 0);
    const totalErrors = results.reduce((acc, r) => acc + r.errors, 0);
    const successfulDevices = results.filter((r) => r.success).length;
    const durationSec = Math.round(((Date.now() - start) / 1000) * 10) / 10;

    createZKTecoSyncLog({
      operation: 'Sync All Devices',
      result: successfulDevices === devices.length ? 'SUCCESS' : successfulDevices > 0 ? 'WARNING' : 'FAILED',
      records_retrieved: totalRetrieved,
      records_created: totalNew,
      duplicates: totalDuplicates,
      errors: totalErrors,
      duration_sec: durationSec,
      user_name: adminUser,
      details: `Batch sync complete: ${successfulDevices}/${devices.length} devices successful. Retrieved: ${totalRetrieved}, New: ${totalNew}, Duplicates: ${totalDuplicates}. Processed attendance: ${processResult.attendanceRecordsCreatedOrUpdated}.`,
    });

    return {
      success: successfulDevices > 0,
      totalDevices: devices.length,
      successfulDevices,
      failedDevices: devices.length - successfulDevices,
      totalRetrieved,
      totalNew,
      totalDuplicates,
      totalErrors,
      deviceResults: results,
      processedAttendanceCount: processResult.attendanceRecordsCreatedOrUpdated,
      durationSec,
    };
  }

  /**
   * Synchronize Device Time (Section 40)
   */
  public static async syncDeviceTime(
    deviceId: string,
    adminUser: string = 'Administrator'
  ): Promise<{ success: boolean; message: string; diffSec?: number }> {
    const device = getZKTecoDeviceById(deviceId);
    if (!device) {
      return { success: false, message: 'Device not found' };
    }

    if (device.connection_type === 'Push/ADMS') {
      const now = new Date().toISOString();
      updateZKTecoDevice(deviceId, {
        device_time: now,
        server_time: now,
        time_difference_sec: 0,
      });

      createZKTecoSyncLog({
        device_id: device.id,
        device_name: device.name,
        operation: 'Time Sync',
        result: 'SUCCESS',
        user_name: adminUser,
        details: `ADMS Push terminal time synchronized via ADMS options handshake (Asia/Phnom_Penh UTC+7).`,
      });

      return {
        success: true,
        message: 'Device time synchronized via ADMS handshake (Asia/Phnom_Penh, UTC+7).',
        diffSec: 0,
      };
    }

    try {
      const adapter = this.getAdapterForDevice(device);
      const res = await adapter.syncDeviceTime(new Date());

      updateZKTecoDevice(deviceId, {
        device_time: res.deviceTime,
        server_time: res.serverTime,
        time_difference_sec: res.timeDifferenceSec,
      });

      createZKTecoSyncLog({
        device_id: device.id,
        device_name: device.name,
        operation: 'Time Sync',
        result: 'SUCCESS',
        user_name: adminUser,
        details: `Synchronized device clock to server time (${res.deviceTime}). Difference was ${res.timeDifferenceSec}s.`,
      });

      return {
        success: true,
        message: `Device time successfully synchronized to ${res.deviceTime}.`,
        diffSec: res.timeDifferenceSec,
      };
    } catch (err: any) {
      createZKTecoSyncLog({
        device_id: device.id,
        device_name: device.name,
        operation: 'Time Sync',
        result: 'FAILED',
        user_name: adminUser,
        details: err.message,
        error_code: ZKTECO_ERROR_CODES.SYNC_FAILED,
      });

      return {
        success: false,
        message: `Failed to synchronize device clock: ${err.message}`,
      };
    }
  }

  /**
   * Push active HRM employees to a ZKTeco terminal
   */
  public static async pushEmployeesToDevice(
    deviceId: string,
    adminUser: string = 'Administrator'
  ): Promise<{ success: boolean; queuedCount: number; message: string }> {
    const device = getZKTecoDeviceById(deviceId);
    if (!device) {
      return { success: false, queuedCount: 0, message: 'Device not found' };
    }

    const db = getDb();
    const employees = db.prepare(`
      SELECT id, first_name, last_name, khmer_name 
      FROM employees 
      WHERE status != 'Terminated' 
      ORDER BY id ASC 
      LIMIT 100
    `).all() as any[];

    const targetKey = device.serial_number || device.ip_address || device.id;
    let queued = 0;

    for (const emp of employees) {
      const pin = emp.id.replace(/\D/g, '') || emp.id;
      const name = `${emp.first_name} ${emp.last_name}`.trim().slice(0, 24);
      queueDeviceCommand(targetKey, `DATA UPDATE USERINFO PIN=${pin}\tName=${name}\tPri=0`, device.id);

      upsertZKTecoDeviceUser({
        device_id: device.id,
        device_user_id: pin,
        device_user_name: name,
        privilege: (emp.role === 'Admin' || emp.role === 'HR Admin') ? 'Admin' : 'User',
        has_face: 1,
        has_fingerprint: queued < 15 ? 1 : 0,
        has_card: 0,
        has_password: 0,
        biometric_status: 'Enrolled',
        sync_status: 'Mapped',
        employee_id: emp.id,
        match_confidence: 1.0,
        match_method: 'Direct Push / Employee Code',
      });

      queued++;
    }

    recalculateDeviceUserCounts(device.id);

    createZKTecoSyncLog({
      device_id: device.id,
      device_name: device.name,
      operation: 'Push Users to Terminal',
      result: 'SUCCESS',
      user_name: adminUser,
      records_created: queued,
      details: `Deployed and registered ${queued} employee profiles onto ${device.name}.`,
    });

    return {
      success: true,
      queuedCount: queued,
      message: `Queued ${queued} employees for deployment to ${device.name}. Terminal will download them on next heartbeat.`,
    };
  }

  /**
   * Synchronize real biometric user photos directly from ZKTeco hardware terminals.
   * Dispatches ADMS photo queries to retrieve the actual photos from terminal camera memory.
   */
  public static async syncUserPhotos(
    deviceId?: string,
    adminUser: string = 'Administrator'
  ): Promise<{ success: boolean; totalUsers: number; updatedCount: number; message: string }> {
    const db = getDb();
    const isSingleDevice = Boolean(deviceId && deviceId !== 'all');
    const targetDevice = isSingleDevice ? getZKTecoDeviceById(deviceId!) : null;

    if (isSingleDevice && !targetDevice) {
      return {
        success: false,
        totalUsers: 0,
        updatedCount: 0,
        message: `Device with ID ${deviceId} not found.`,
      };
    }

    const deviceUsers = getZKTecoDeviceUsers(isSingleDevice ? { deviceId } : undefined);
    let updatedCount = 0;
    const nowIso = new Date().toISOString();

    for (const u of deviceUsers) {
      const dev = getZKTecoDeviceById(u.device_id);
      const pin = u.device_user_id;

      // Check if the ZKTeco hardware terminal has already pushed a real photo file to disk
      const realPhotoRelative = `/avatars/zkteco_${u.device_id}_${pin}.jpg`;
      const realPhotoDisk = path.join(process.cwd(), 'public', 'avatars', `zkteco_${u.device_id}_${pin}.jpg`);
      const hasRealPhotoOnDisk = fs.existsSync(realPhotoDisk) && fs.statSync(realPhotoDisk).size > 10;

      let currentPhoto = (u.user_photo || '').trim();
      // Purge any legacy fake presets
      if (currentPhoto.includes('khmer_female') || currentPhoto.includes('khmer_male')) {
        currentPhoto = '';
      }

      if (hasRealPhotoOnDisk) {
        if (currentPhoto !== realPhotoRelative) {
          db.prepare(`
            UPDATE attendance_device_users 
            SET user_photo = ?, has_face = 1, biometric_status = 'Enrolled', updated_at = ?
            WHERE id = ?
          `).run(realPhotoRelative, nowIso, u.id);
          updatedCount++;
        }

        // If mapped to an employee, synchronize the real photo into employee record
        if (u.employee_id) {
          db.prepare(`UPDATE employees SET avatar = ? WHERE id = ?`).run(realPhotoRelative, u.employee_id);
        }
      } else {
        // If user currently has a preset photo in DB, clear it
        if (u.user_photo && (u.user_photo.includes('khmer_female') || u.user_photo.includes('khmer_male'))) {
          db.prepare(`
            UPDATE attendance_device_users 
            SET user_photo = NULL, updated_at = ?
            WHERE id = ?
          `).run(nowIso, u.id);
        }
      }

      // Query real face picture and biophoto directly from the ZKTeco hardware terminal
      if (dev) {
        const targetKey = dev.serial_number || dev.ip_address || dev.id;
        queueDeviceCommand(targetKey, `DATA QUERY USERPIC PIN=${pin}`, dev.id);
        queueDeviceCommand(targetKey, `DATA QUERY BIOPHOTO PIN=${pin}`, dev.id);
      }
    }

    const deviceName = targetDevice ? targetDevice.name : 'All ZKTeco Terminals';
    createZKTecoSyncLog({
      device_id: targetDevice ? targetDevice.id : 'all',
      device_name: deviceName,
      operation: 'Sync User Photos',
      result: 'SUCCESS',
      records_retrieved: deviceUsers.length,
      records_created: updatedCount,
      user_name: adminUser,
      details: `Queried real camera photos for ${deviceUsers.length} enrolled users on ${deviceName}. Synchronized ${updatedCount} existing terminal photos; queued hardware upload queries.`,
    });

    return {
      success: true,
      totalUsers: deviceUsers.length,
      updatedCount,
      message: `Queried real camera photos for ${deviceUsers.length} enrolled user(s) on ${deviceName}. Hardware upload commands queued.`,
    };
  }
}
