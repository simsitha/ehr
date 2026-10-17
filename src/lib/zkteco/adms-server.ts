/**
 * src/lib/zkteco/adms-server.ts
 * High-performance ZKTeco ADMS / IClock Push Protocol Receiver for HESTRA HRM.
 * 
 * Supports:
 * - SpeedFace-V5L / ZAM230 / BioTime Push Protocol
 * - Handshake / Initial configuration: GET /iclock/cdata
 * - Real-time Attendance Punches: POST /iclock/cdata?table=ATTLOG
 * - Device Command Polling & Heartbeat: GET /iclock/getrequest
 * - Command Execution Response: POST /iclock/devicecmd
 * - Device Registry: GET /iclock/registry
 * - Health Check & Diagnostics: GET / or GET /health
 */

import http from 'http';
import url from 'url';
import fs from 'fs';
import path from 'path';
import {
  getDb,
  getZKTecoDevices,
  updateZKTecoDevice,
  insertRawTransactions,
  createZKTecoSyncLog,
  upsertZKTecoDeviceUser,
  queueDeviceCommand,
  getPendingDeviceCommands,
  markDeviceCommandDelivered,
  markDeviceCommandExecuted,
} from '@/lib/db';
import { AttendanceProcessor } from '@/lib/zkteco/attendance-processor';
import { UserMappingEngine } from '@/lib/zkteco/mapping-engine';
import { ZKTecoDevice } from '@/lib/types';

export { queueDeviceCommand };

export interface AdmsServerConfig {
  port: number;
  host: string;
}

export const DEFAULT_ADMS_CONFIG: AdmsServerConfig = {
  port: 8081,
  host: '0.0.0.0',
};

let activeServer: http.Server | null = null;
let serverStartTime: number = 0;

/**
 * Handle incoming ZKTeco ADMS / IClock HTTP requests
 */
export async function handleAdmsRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse
): Promise<void> {
  const reqUrl = req.url || '/';
  const parsedUrl = url.parse(reqUrl, true);
  const pathname = (parsedUrl.pathname || '').replace(/\/+/g, '/');
  const query = parsedUrl.query;
  const method = (req.method || 'GET').toUpperCase();

  // Helper for case-insensitive query parameter extraction
  const getQueryParam = (name: string): string => {
    for (const key of Object.keys(query)) {
      if (key.toLowerCase() === name.toLowerCase()) {
        const val = query[key];
        return Array.isArray(val) ? String(val[0] || '') : String(val || '');
      }
    }
    return '';
  };

  // Extract Device Serial Number and Client IP
  const sn = (getQueryParam('sn') || '').trim();
  const clientIp = (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
    req.socket.remoteAddress ||
    '127.0.0.1'
  ).replace('::ffff:', '');

  // Helpers to read request buffer and body
  const readBuffer = (): Promise<Buffer> =>
    new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      req.on('data', (chunk) => {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      });
      req.on('end', () => resolve(Buffer.concat(chunks)));
      req.on('error', reject);
    });

  const readBody = async (): Promise<string> => {
    const buf = await readBuffer();
    return buf.toString('utf8');
  };

  // CORS and base headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // 1. Healthcheck / Status endpoint
  if (pathname === '/' || pathname === '/health' || pathname === '/status') {
    const devices = getZKTecoDevices();
    const currentServerIp = process.env.ADMS_SERVER_IP || '127.0.0.1';
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'online',
        service: 'HESTRA HRM - ZKTeco ADMS Push Receiver',
        server_ip: currentServerIp,
        port: Number(process.env.ADMS_PORT) || DEFAULT_ADMS_CONFIG.port,
        uptime_seconds: serverStartTime ? Math.round((Date.now() - serverStartTime) / 1000) : 0,
        configured_devices: devices.map((d) => ({
          id: d.id,
          name: d.name,
          ip: d.ip_address,
          port: d.port,
          connection_type: d.connection_type,
          status: d.status,
          last_connection: d.last_connection,
          last_sync: d.last_sync,
        })),
        timestamp: new Date().toISOString(),
      })
    );
    return;
  }

  console.log(`[ADMS] Incoming ${method} ${reqUrl} from IP: ${clientIp}, SN: "${sn}"`);

  // Find or identify associated device record in database
  const identifyDevice = () => {
    const devices = getZKTecoDevices();
    let dev = devices.find((d) => sn && d.serial_number && d.serial_number.toLowerCase() === sn.toLowerCase());
    if (!dev && clientIp) {
      dev = devices.find((d) => d.ip_address === clientIp);
    }
    return dev || null;
  };

  // 2. Handshake / Configuration options: GET /iclock/cdata
  if (pathname === '/iclock/cdata' && method === 'GET') {
    const dev = identifyDevice();
    const nowStr = new Date().toISOString();

    if (dev) {
      updateZKTecoDevice(dev.id, {
        status: 'Online',
        last_connection: nowStr,
        last_connected_at: nowStr,
        serial_number: sn || dev.serial_number,
        last_error: null,
        error_code: null,
      });
    }

    const responseText = [
      `GET OPTION FROM: ${sn || (dev ? dev.serial_number : 'SF5L2026')}`,
      `Stamp=9999`,
      `OpStamp=None`,
      `PhotoStamp=None`,
      `ErrorDelay=60`,
      `Delay=30`,
      `TransTimes=00:00;14:05`,
      `TransInterval=1`,
      `TransFlag=1111000000`,
      `TimeZone=7`,
      `Realtime=1`,
      `Encrypt=0`,
      `ServerVersion=3.1.1`,
    ].join('\r\n') + '\r\n';

    res.writeHead(200, {
      'Content-Type': 'text/plain',
      'Content-Length': Buffer.byteLength(responseText),
    });
    res.end(responseText);
    return;
  }

  // 3. Real-time Attendance & Data Push: POST /iclock/cdata
  if (pathname === '/iclock/cdata' && method === 'POST') {
    const body = await readBody();
    const table = (getQueryParam('table') || getQueryParam('tablename') || getQueryParam('type') || '').toUpperCase();
    const dev = identifyDevice();
    const now = new Date();
    const nowIso = now.toISOString();

    console.log(`[ADMS] POST /iclock/cdata table="${table}", query=${JSON.stringify(query)}, bodyLength=${body.length}, preview: ${body.trim().slice(0, 150).replace(/\r?\n/g, ' ')}`);

    if (table === 'ATTLOG') {
      const lines = body.split(/\r?\n/).filter((l) => l.trim().length > 0);
      const rawRecords: any[] = [];
      const distinctDaysToProcess = new Set<string>();

      // Load employees for auto-matching unknown device users
      let employeesCache: any[] | null = null;

      for (const line of lines) {
        // Tab-separated: PIN \t DateTime \t Status \t VerifyType \t WorkCode \t ...
        // Space-separated fallback: PIN DateTime Status VerifyType ...
        const parts = line.includes('\t')
          ? line.split('\t').map((p) => p.trim())
          : line.split(/\s+/).map((p) => p.trim());

        if (parts.length < 2) continue;

        const pin = parts[0];
        // Date and Time might be separate if space-delimited without quotes
        let punchDateTime = parts[1];
        let statusIdx = 2;
        let verifyIdx = 3;

        if (parts.length >= 3 && /^\d{2}:\d{2}:\d{2}/.test(parts[2])) {
          punchDateTime = `${parts[1]} ${parts[2]}`;
          statusIdx = 3;
          verifyIdx = 4;
        }

        if (!/^\d{4}-\d{2}-\d{2}/.test(punchDateTime)) {
          continue;
        }

        const statusCode = parts[statusIdx] !== undefined ? parseInt(parts[statusIdx], 10) : 0;
        const verifyCode = parts[verifyIdx] !== undefined ? parseInt(parts[verifyIdx], 10) : 15;

        // Map status code
        let attendanceType: 'Check-In' | 'Check-Out' | 'Break-Out' | 'Break-In' | 'OT-In' | 'OT-Out' = 'Check-In';
        if (statusCode === 1) attendanceType = 'Check-Out';
        else if (statusCode === 2) attendanceType = 'Break-Out';
        else if (statusCode === 3) attendanceType = 'Break-In';
        else if (statusCode === 4) attendanceType = 'OT-In';
        else if (statusCode === 5) attendanceType = 'OT-Out';

        // Map verification method
        let verificationMethod: 'Fingerprint' | 'Face' | 'Card' | 'PIN' | 'Password' | 'Other' = 'Face';
        if (verifyCode === 1) verificationMethod = 'Fingerprint';
        else if (verifyCode === 4 || verifyCode === 2) verificationMethod = 'Card';
        else if (verifyCode === 15) verificationMethod = 'Face';
        else if (verifyCode === 0) verificationMethod = 'Password';

        const punchDate = punchDateTime.slice(0, 10);
        const punchTime = punchDateTime.length >= 19 ? punchDateTime.slice(11, 19) : '08:00:00';
        const deviceId = dev ? dev.id : 'zk-01';

        // Check or match employee
        const db = getDb();
        const mappedUser = db.prepare(`
          SELECT employee_id FROM attendance_device_users
          WHERE device_id = ? AND device_user_id = ? AND sync_status = 'Mapped'
        `).get(deviceId, pin) as any;

        let empId = mappedUser?.employee_id || null;

        if (!empId) {
          if (!employeesCache) {
            employeesCache = db.prepare('SELECT id, first_name, last_name, khmer_name FROM employees').all() as any[];
          }
          const match = UserMappingEngine.matchDeviceUser({ device_user_id: pin }, employeesCache);
          if (match.matched && match.employeeId) {
            empId = match.employeeId;
            upsertZKTecoDeviceUser({
              device_id: deviceId,
              device_user_id: pin,
              employee_id: empId,
              sync_status: 'Mapped',
              match_method: match.matchMethod,
              match_confidence: match.confidence,
              biometric_status: verificationMethod === 'Face' ? 'Enrolled' : 'Not Enrolled',
            });
          }
        }

        const transactionId = `tx-adms-${deviceId}-${pin}-${punchDate.replace(/-/g, '')}-${punchTime.replace(/:/g, '')}`;

        rawRecords.push({
          device_id: deviceId,
          device_user_id: pin,
          employee_id: empId,
          transaction_id: transactionId,
          attendance_timestamp: `${punchDate}T${punchTime}.000Z`,
          punch_date: punchDate,
          punch_time: punchTime,
          attendance_type: attendanceType,
          verification_method: verificationMethod,
          device_serial: sn || (dev ? dev.serial_number : ''),
          device_ip: clientIp,
          location: dev ? dev.location : 'Main Entrance',
          source: 'ZKTeco ADMS Push',
          raw_payload: JSON.stringify({ line, sn, table }),
        });

        distinctDaysToProcess.add(punchDate);
      }

      // Insert raw transactions into immutable audit table
      const insertStats = insertRawTransactions(rawRecords);

      // Run daily attendance calculation for affected dates
      for (const d of distinctDaysToProcess) {
        AttendanceProcessor.processRawTransactions({ date: d, gracePeriodMinutes: 10 });
      }

      if (dev) {
        updateZKTecoDevice(dev.id, {
          status: 'Online',
          last_connection: nowIso,
          last_sync: nowIso,
          last_successful_sync: nowIso,
          last_error: null,
          error_code: null,
          log_count: (dev.log_count || 0) + insertStats.newCount,
        });

        createZKTecoSyncLog({
          device_id: dev.id,
          device_name: dev.name,
          operation: 'ADMS Push Sync',
          result: 'SUCCESS',
          records_retrieved: rawRecords.length,
          records_created: insertStats.newCount,
          duplicates: insertStats.duplicates,
          errors: 0,
          duration_sec: 0.1,
          ip_address: clientIp,
          user_name: 'ZKTeco ADMS Push',
          details: `Received ${rawRecords.length} records via ADMS Push from ${dev.name} (${sn || clientIp}). Added ${insertStats.newCount} new.`,
        });
      }

      const resBody = `OK: ${rawRecords.length}\n`;
      res.writeHead(200, {
        'Content-Type': 'text/plain',
        'Content-Length': Buffer.byteLength(resBody),
      });
      res.end(resBody);
      return;
    }

    // 3c. User Profiles and User Biometric Photos Upload (USERINFO, USER, or OPERLOG payloads)
    const hasUserPic = body.includes('USERPIC PIN=') || body.includes('USERPIC\tPIN=') || table === 'USERPIC' || table === 'BIOPHOTO';
    const hasUserInfo = body.includes('USER PIN=') || body.includes('USER\tPIN=') || table === 'USERINFO' || table === 'USER' || table === 'USERS';

    if (hasUserPic || hasUserInfo || table === 'OPERLOG') {
      const dev = identifyDevice();
      const deviceId = dev ? dev.id : 'zk-01';
      const db = getDb();
      let handledUsers = 0;
      let handledPhotos = 0;

      // 1. Process USERPIC entries (base64 camera photos)
      if (hasUserPic) {
        const picEntries = body.split(/(?:\r?\n|\s+)(?=USERPIC\s+PIN=)/i).filter((s) => /USERPIC\s+PIN=/i.test(s));
        const avatarsDir = path.join(process.cwd(), 'public', 'avatars');
        if (!fs.existsSync(avatarsDir)) {
          fs.mkdirSync(avatarsDir, { recursive: true });
        }

        for (const entry of picEntries) {
          const parseField = (k: string) => {
            const m = entry.match(new RegExp(`(?:^|[\\t\\s&])${k}=([^\\t\\r\\n&]*)`, 'i'));
            return m ? m[1].trim() : '';
          };
          const pin = parseField('PIN');
          const content = parseField('Content');

          if (pin && content) {
            const fileName = `zkteco_${deviceId}_${pin}.jpg`;
            const filePath = path.join(avatarsDir, fileName);
            try {
              const imgBuf = Buffer.from(content, 'base64');
              if (imgBuf.length > 50) {
                fs.writeFileSync(filePath, imgBuf);
                const photoWebPath = `/avatars/${fileName}`;

                const updateRes = db.prepare(`
                  UPDATE attendance_device_users 
                  SET user_photo = ?, has_face = 1, biometric_status = 'Enrolled', updated_at = ?
                  WHERE device_id = ? AND device_user_id = ?
                `).run(photoWebPath, nowIso, deviceId, pin);

                if (updateRes.changes === 0) {
                  upsertZKTecoDeviceUser({
                    device_id: deviceId,
                    device_user_id: pin,
                    device_user_name: `User ${pin}`,
                    has_face: 1,
                    biometric_status: 'Enrolled',
                    user_photo: photoWebPath,
                    sync_status: 'Needs Mapping',
                  });
                }

                const uRec = db.prepare(`
                  SELECT employee_id FROM attendance_device_users 
                  WHERE device_id = ? AND device_user_id = ?
                `).get(deviceId, pin) as any;

                if (uRec?.employee_id) {
                  db.prepare(`UPDATE employees SET avatar = ? WHERE id = ?`).run(photoWebPath, uRec.employee_id);
                }
                handledPhotos++;
              }
            } catch (err: any) {
              console.error(`[ADMS] Error saving photo for PIN ${pin}:`, err.message);
            }
          }
        }
      }

      // 2. Process USER Profile entries
      if (hasUserInfo) {
        const userEntries = body.split(/(?:\r?\n|\s+)(?=USER\s+PIN=)/i).filter((s) => /USER\s+PIN=/i.test(s));
        let employeesCache = db.prepare('SELECT id, first_name, last_name, khmer_name FROM employees').all() as any[];

        for (const entry of userEntries) {
          const parseField = (k: string) => {
            const m = entry.match(new RegExp(`(?:^|[\\t\\s&])${k}=([^\\t\\r\\n&]*)`, 'i'));
            return m ? m[1].trim() : '';
          };
          const pin = parseField('PIN');
          const name = parseField('Name');
          const pri = parseField('Pri') || parseField('Privilege') || '0';
          const card = parseField('Card');
          const passwd = parseField('Passwd') || parseField('Password');

          if (!pin) continue;

          const match = UserMappingEngine.matchDeviceUser(
            { device_user_id: pin, device_user_name: name, card_number: card },
            employeesCache
          );

          const photoWebPath = `/avatars/zkteco_${deviceId}_${pin}.jpg`;
          const photoDiskPath = path.join(process.cwd(), 'public', 'avatars', `zkteco_${deviceId}_${pin}.jpg`);
          const hasPhotoOnDisk = fs.existsSync(photoDiskPath);

          upsertZKTecoDeviceUser({
            device_id: deviceId,
            device_user_id: pin,
            device_user_name: name || undefined,
            card_number: card || undefined,
            privilege: (pri === '14' || pri === 'SuperAdmin') ? 'Admin' : 'User',
            has_card: !!card,
            has_password: !!passwd,
            has_face: hasPhotoOnDisk ? 1 : undefined,
            biometric_status: 'Enrolled',
            sync_status: match.matched && match.employeeId ? 'Mapped' : 'Needs Mapping',
            employee_id: match.matched ? match.employeeId : undefined,
            match_method: match.matchMethod,
            match_confidence: match.confidence,
            user_photo: hasPhotoOnDisk ? photoWebPath : undefined,
          });

          handledUsers++;
        }
      }

      if (dev) {
        const totalUsers = db.prepare(`SELECT COUNT(*) as c FROM attendance_device_users WHERE device_id = ?`).get(dev.id) as any;
        const currentCount = Number(totalUsers?.c) || handledUsers;

        updateZKTecoDevice(dev.id, {
          status: 'Online',
          user_count: currentCount,
          last_connection: nowIso,
          last_sync: nowIso,
          last_successful_sync: nowIso,
        });

        if (handledUsers > 0 || handledPhotos > 0) {
          createZKTecoSyncLog({
            device_id: dev.id,
            device_name: dev.name,
            operation: 'Sync Users',
            result: 'SUCCESS',
            records_retrieved: handledUsers + handledPhotos,
            records_created: handledUsers,
            duplicates: 0,
            errors: 0,
            duration_sec: 0.1,
            ip_address: clientIp,
            user_name: 'ZKTeco ADMS Push',
            details: `Received ${handledUsers} users and ${handledPhotos} photos from ${dev.name} via ADMS push. Total enrolled: ${currentCount}.`,
          });
        }
      }

      const totalHandled = handledUsers + handledPhotos;
      const resBody = `OK: ${totalHandled || 1}\n`;
      res.writeHead(200, { 'Content-Type': 'text/plain', 'Content-Length': Buffer.byteLength(resBody) });
      res.end(resBody);
      return;
    }

    // Biometric Data Upload: table=BIODATA
    if (table === 'BIODATA') {
      const dev = identifyDevice();
      console.log(`[ADMS] Received BIODATA upload from ${dev ? dev.name : clientIp} (${body.length} bytes)`);

      const lines = body.split(/\r?\n/).filter((l) => l.trim().length > 0);
      const db = getDb();
      let bioCount = 0;

      for (const line of lines) {
        const pinMatch = line.match(/(?:Pin|PIN)=([^\t\s&]+)/i);
        const typeMatch = line.match(/(?:Type|TYPE)=([^\t\s&]+)/i);
        if (pinMatch && typeMatch) {
          const pin = pinMatch[1].trim();
          const type = typeMatch[1].trim();
          const deviceId = dev ? dev.id : 'zk-01';

          const updateRes = db.prepare(`
            UPDATE attendance_device_users 
            SET has_face = CASE WHEN ? = '9' THEN 1 ELSE has_face END,
                has_fingerprint = CASE WHEN ? = '1' THEN 1 ELSE has_fingerprint END,
                biometric_status = 'Enrolled'
            WHERE device_id = ? AND device_user_id = ?
          `).run(type, type, deviceId, pin);

          if (updateRes.changes === 0) {
            upsertZKTecoDeviceUser({
              device_id: deviceId,
              device_user_id: pin,
              device_user_name: `User ${pin}`,
              has_face: type === '9' ? 1 : 0,
              has_fingerprint: type === '1' ? 1 : 0,
              biometric_status: 'Enrolled',
              sync_status: 'Needs Mapping',
            });
          }
          bioCount++;
        }
      }

      if (dev) {
        updateZKTecoDevice(dev.id, {
          status: 'Online',
          last_connection: nowIso,
        });
      }

      const resBody = `OK: ${bioCount}\n`;
      res.writeHead(200, { 'Content-Type': 'text/plain', 'Content-Length': Buffer.byteLength(resBody) });
      res.end(resBody);
      return;
    }

    console.log(`[ADMS] Unhandled table "${table}" on /iclock/cdata from ${dev ? dev.name : clientIp} (${body.length} bytes):\n${body.slice(0, 300)}`);
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK\n');
    return;
  }

  // 3b. Photo & Biometric File Transfer: GET/POST /iclock/fdata
  if (pathname === '/iclock/fdata') {
    const dev = identifyDevice();
    const table = String(query.table || query.Table || '').toUpperCase();
    const pin = String(query.PIN || query.pin || query.Pin || '').trim();
    const nowIso = new Date().toISOString();
    const devId = dev ? dev.id : 'zk-01';

    // GET /iclock/fdata: Terminal downloads photo from server
    if (method === 'GET') {
      const db = getDb();
      const userRec = db.prepare(`
        SELECT u.user_photo, e.avatar 
        FROM attendance_device_users u 
        LEFT JOIN employees e ON e.id = u.employee_id 
        WHERE u.device_id = ? AND u.device_user_id = ?
      `).get(devId, pin) as any;

      const photoRel = userRec?.user_photo || userRec?.avatar;
      if (photoRel) {
        const filePath = path.join(process.cwd(), 'public', photoRel.replace(/^\//, ''));
        if (fs.existsSync(filePath)) {
          const fileBuf = fs.readFileSync(filePath);
          res.writeHead(200, {
            'Content-Type': 'image/jpeg',
            'Content-Length': fileBuf.length,
          });
          res.end(fileBuf);
          return;
        }
      }

      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('NOT FOUND\n');
      return;
    }

    // POST /iclock/fdata: Terminal uploads biometric photo
    if (method === 'POST') {
      const buffer = await readBuffer();
      console.log(`[ADMS] Received /iclock/fdata upload from ${dev ? dev.name : clientIp} (SN: ${sn}, PIN: ${pin}, size: ${buffer.length} bytes, table: ${table})`);

      if (buffer.length > 0 && pin) {
        const avatarsDir = path.join(process.cwd(), 'public', 'avatars');
        if (!fs.existsSync(avatarsDir)) {
          fs.mkdirSync(avatarsDir, { recursive: true });
        }
        const fileName = `zkteco_${devId}_${pin}.jpg`;
        const filePath = path.join(avatarsDir, fileName);
        fs.writeFileSync(filePath, buffer);

        const photoWebPath = `/avatars/${fileName}`;
        const db = getDb();
        const updateRes = db.prepare(`
          UPDATE attendance_device_users 
          SET user_photo = ?, has_face = 1, biometric_status = 'Enrolled', updated_at = ?
          WHERE device_id = ? AND device_user_id = ?
        `).run(photoWebPath, nowIso, devId, pin);

        if (updateRes.changes === 0) {
          upsertZKTecoDeviceUser({
            device_id: devId,
            device_user_id: pin,
            device_user_name: `User ${pin}`,
            has_face: true,
            biometric_status: 'Enrolled',
            user_photo: photoWebPath,
            sync_status: 'Unmapped',
          });
        }

        const userRec = db.prepare(`
          SELECT employee_id FROM attendance_device_users 
          WHERE device_id = ? AND device_user_id = ?
        `).get(devId, pin) as any;

        if (userRec?.employee_id) {
          db.prepare(`UPDATE employees SET avatar = ? WHERE id = ?`).run(photoWebPath, userRec.employee_id);
        }

        if (dev) {
          updateZKTecoDevice(dev.id, {
            status: 'Online',
            last_connection: nowIso,
          });
        }
      }

      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('OK\n');
      return;
    }
  }

  // 4. Device Command Polling & Heartbeat: GET /iclock/getrequest
  if (pathname === '/iclock/getrequest') {
    const dev = identifyDevice();
    const snKey = (sn || '').toLowerCase();
    const ipKey = (clientIp || '').toLowerCase();
    const devIdKey = (dev ? dev.id : '').toLowerCase();
    const devSnKey = (dev && dev.serial_number ? dev.serial_number : '').toLowerCase();

    if (dev) {
      updateZKTecoDevice(dev.id, {
        status: 'Online',
        last_connection: new Date().toISOString(),
        last_error: null,
        error_code: null,
      });
    }

    // Deliver any pending commands queued for this device
    const pending = getPendingDeviceCommands([snKey, ipKey, devIdKey, devSnKey]);
    if (pending.length > 0) {
      const responsePayload = pending.map((c) => `C:${c.id}:${c.command}`).join('\n') + '\n';
      markDeviceCommandDelivered(pending.map((c) => c.id));
      console.log(`[ADMS] Delivering ${pending.length} command(s) to ${dev ? dev.name : clientIp} (SN: ${sn}):\n${responsePayload.trim()}`);
      res.writeHead(200, {
        'Content-Type': 'text/plain',
        'Content-Length': Buffer.byteLength(responsePayload),
      });
      res.end(responsePayload);
      return;
    }

    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK\n');
    return;
  }

  // 5. Command Response: POST /iclock/devicecmd
  if (pathname === '/iclock/devicecmd') {
    const body = await readBody();
    const dev = identifyDevice();
    console.log(`[ADMS] Received devicecmd response from ${dev ? dev.name : clientIp} (SN: ${sn}):\n${body.trim()}`);

    if (dev && body) {
      const parseKey = (key: string): string | null => {
        const regex = new RegExp(`(?:^|[&\\r\\n\\t\\s])${key}=([^&\\r\\n\\t\\s]+)`, 'i');
        const match = body.match(regex);
        return match ? match[1] : null;
      };

      const cmdId = parseKey('ID') || parseKey('id');
      if (cmdId) {
        markDeviceCommandExecuted(cmdId);
      }

      const userCountStr = parseKey('UserCount');
      const fpCountStr = parseKey('FPCount');
      const faceCountStr = parseKey('FaceCount');
      const recordCountStr = parseKey('RecordCount');
      const fwVersion = parseKey('FWVersion');

      const updates: Partial<ZKTecoDevice> = {
        status: 'Online',
        last_connection: new Date().toISOString(),
      };

      if (userCountStr !== null) updates.user_count = parseInt(userCountStr, 10) || 0;
      if (fpCountStr !== null) updates.fingerprint_count = parseInt(fpCountStr, 10) || 0;
      if (faceCountStr !== null) updates.face_count = parseInt(faceCountStr, 10) || 0;
      if (recordCountStr !== null) updates.log_count = parseInt(recordCountStr, 10) || 0;
      if (fwVersion) updates.firmware_version = fwVersion;

      updateZKTecoDevice(dev.id, updates);
      console.log(`[ADMS] Updated ${dev.name} specs from devicecmd: UserCount=${updates.user_count ?? 'N/A'}, RecordCount=${updates.log_count ?? 'N/A'}`);
    }

    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK\n');
    return;
  }

  // 6. Registry: GET /iclock/registry
  if (pathname === '/iclock/registry') {
    const dev = identifyDevice();
    if (dev) {
      updateZKTecoDevice(dev.id, {
        status: 'Online',
        last_connection: new Date().toISOString(),
        last_error: null,
        error_code: null,
      });
    }
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('RegistryCode=1\nOK\n');
    return;
  }

  // 7. Ping: GET/POST /iclock/ping
  if (pathname === '/iclock/ping') {
    const dev = identifyDevice();
    if (dev) {
      updateZKTecoDevice(dev.id, {
        status: 'Online',
        last_connection: new Date().toISOString(),
        last_error: null,
        error_code: null,
      });
    }
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK\n');
    return;
  }

  // Fallback
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('OK\n');
}

/**
 * Start the standalone ADMS Push HTTP Server on port 8081
 */
export function startAdmsServer(
  port: number = DEFAULT_ADMS_CONFIG.port,
  host: string = DEFAULT_ADMS_CONFIG.host
): http.Server {
  if (activeServer) {
    return activeServer;
  }

  const server = http.createServer(async (req, res) => {
    try {
      await handleAdmsRequest(req, res);
    } catch (err: any) {
      console.error('[ZKTeco ADMS Server] Error handling request:', err);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(`ERROR: ${err.message}\n`);
    }
  });

  server.listen(port, host, () => {
    serverStartTime = Date.now();
    const pushIp = process.env.ADMS_SERVER_IP || (host === '0.0.0.0' ? '127.0.0.1' : host);
    console.log(`====================================================`);
    console.log(`  HESTRA HRM — ZKTeco ADMS Push Receiver Started`);
    console.log(`  Server Address : ${host}:${port}`);
    console.log(`  Network Push IP: ${pushIp}:${port}`);
    console.log(`  Push URL       : http://${pushIp}:${port}/iclock/cdata`);
    console.log(`====================================================`);
  });

  server.on('error', (err: any) => {
    console.error(`[ZKTeco ADMS Server] Server error:`, err.message);
  });

  activeServer = server;
  return server;
}

export function stopAdmsServer(): Promise<void> {
  return new Promise((resolve) => {
    if (activeServer) {
      activeServer.close(() => {
        activeServer = null;
        resolve();
      });
    } else {
      resolve();
    }
  });
}
