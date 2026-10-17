/**
 * src/lib/zkteco/network-diagnostics.ts
 * Diagnostics and Network Reachability Testing for ZKTeco Biometric Devices
 */

import net from 'net';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface DeviceNetworkReport {
  ip: string;
  port: number;
  name?: string;
  connectionType?: string;
  status: 'Online' | 'Offline';
  pingSuccess: boolean;
  pingOutput: string;
  tcpPortOpen: boolean;
  tcpLatencyMs: number;
  tcpError?: string;
  overallReachable: boolean;
  lastConnection?: string | null;
  troubleshooting?: string[];
}

export interface NetworkDiagnosticsSummary {
  timestamp: string;
  serverIp: string;
  admsPort: number;
  admsReceiverRunning: boolean;
  admsReceiverLatencyMs: number;
  reports: Record<string, DeviceNetworkReport>;
  allDevicesReachable: boolean;
  checklist: string[];
}

export class NetworkDiagnostics {
  public static async pingHost(ip: string, count: number = 2, timeoutSec: number = 2): Promise<{ success: boolean; output: string }> {
    try {
      const { stdout } = await execAsync(`ping -c ${count} -W ${timeoutSec} ${ip}`);
      return { success: true, output: stdout.trim() };
    } catch (err: any) {
      if (err.message && err.message.includes('not found')) {
        return { success: false, output: 'Ping utility not available on host system' };
      }
      return {
        success: false,
        output: err.stdout ? err.stdout.trim() : 'Ping failed with 100% packet loss (Host unreachable)',
      };
    }
  }

  public static async probePort(host: string, port: number = 4370, timeoutMs: number = 3000): Promise<{ open: boolean; latencyMs: number; error?: string }> {
    const start = Date.now();
    return new Promise((resolve) => {
      const socket = new net.Socket();
      let finished = false;

      socket.setTimeout(timeoutMs);

      socket.on('connect', () => {
        if (!finished) {
          finished = true;
          const latencyMs = Date.now() - start;
          socket.destroy();
          resolve({ open: true, latencyMs });
        }
      });

      socket.on('timeout', () => {
        if (!finished) {
          finished = true;
          socket.destroy();
          resolve({ open: false, latencyMs: Date.now() - start, error: `Connection timed out after ${timeoutMs}ms` });
        }
      });

      socket.on('error', (err: any) => {
        if (!finished) {
          finished = true;
          socket.destroy();
          resolve({ open: false, latencyMs: Date.now() - start, error: err.message });
        }
      });

      socket.connect(port, host);
    });
  }

  public static async diagnoseDevice(
    target: string | { ip: string; port?: number; name?: string; connection_type?: string; last_connection?: string | null; status?: string },
    defaultPort: number = 4370
  ): Promise<DeviceNetworkReport> {
    const ip = typeof target === 'string' ? target : target.ip;
    const port = typeof target === 'string' ? defaultPort : (target.port || defaultPort);
    const name = typeof target === 'string' ? undefined : target.name;
    const connectionType = typeof target === 'string' ? 'TCP/IP' : (target.connection_type || 'Push/ADMS');
    const lastConnection = typeof target === 'string' ? null : (target.last_connection || null);

    const isPush = connectionType === 'Push/ADMS';
    const isRecentlyConnected = !!(
      lastConnection &&
      Date.now() - new Date(lastConnection).getTime() <= 120000
    );

    const pingRes = await this.pingHost(ip);

    let tcpPortOpen = false;
    let tcpLatencyMs = 0;
    let tcpError: string | undefined;

    if (isPush) {
      tcpPortOpen = isRecentlyConnected;
      tcpLatencyMs = isRecentlyConnected ? 5 : 0;
      if (!isRecentlyConnected) {
        tcpError = pingRes.success
          ? 'Device responsive to ping on LAN, but has not pushed to ADMS (:8081) in the last 2 minutes'
          : 'Host unreachable on LAN';
      }
    } else {
      const portRes = await this.probePort(ip, port);
      tcpPortOpen = portRes.open;
      tcpLatencyMs = portRes.latencyMs;
      tcpError = portRes.error;
    }

    const reachable = isPush ? isRecentlyConnected : tcpPortOpen;
    const status: 'Online' | 'Offline' = reachable ? 'Online' : 'Offline';

    const troubleshooting: string[] = isPush
      ? (pingRes.success
          ? [
              `1. Terminal IP (${ip}) is online and responsive on LAN via Ping.`,
              `2. On terminal menu: Comm. → Cloud Server (or ADMS / Web Server).`,
              `3. Set Server IP: 192.168.88.168, Port: 8081.`,
              `4. Set Domain Name: OFF (use IP mode).`,
              `5. Check terminal gateway setting (192.168.88.1).`,
            ]
          : [
              `1. IP Address: Confirm device is configured with IP ${ip} and powered on.`,
              `2. Physical Link: Verify Ethernet cable connection and link LED.`,
              `3. Routing: Ensure route exists between HRM server and device subnet (192.168.88.0/24).`,
            ])
      : [
          `1. IP Address: Confirm device is configured with IP ${ip} and powered on.`,
          `2. VLAN / Subnet: Ensure route exists between HRM host and device subnet (192.168.88.0/24).`,
          `3. Routing / Gateway: Verify default gateway and routing table on device and server.`,
          `4. Firewall: Check if intermediate router or firewall drops TCP port ${port}.`,
          `5. Device Menu: On SpeedFace-V5L screen, check Menu → Comm. → Ethernet.`,
        ];

    return {
      ip,
      port,
      name,
      connectionType,
      status,
      pingSuccess: pingRes.success,
      pingOutput: pingRes.output,
      tcpPortOpen,
      tcpLatencyMs,
      tcpError,
      overallReachable: reachable,
      lastConnection,
      troubleshooting: reachable ? undefined : troubleshooting,
    };
  }

  public static async runFullDiagnostics(devices: (string | { ip: string; port?: number; name?: string; connection_type?: string; last_connection?: string | null; status?: string })[]): Promise<NetworkDiagnosticsSummary> {
    let serverIp = process.env.ADMS_SERVER_IP || '192.168.88.168';
    try {
      const { stdout } = await execAsync("hostname -I | awk '{print $1}'");
      const hostIp = stdout.trim();
      if (hostIp && !process.env.ADMS_SERVER_IP) {
        serverIp = hostIp;
      }
    } catch {}

    const admsPort = Number(process.env.ADMS_PORT) || 8081;
    const admsProbe = await this.probePort('127.0.0.1', admsPort, 2000);

    const reports: Record<string, DeviceNetworkReport> = {};
    for (const d of devices) {
      const ip = typeof d === 'string' ? d : d.ip;
      reports[ip] = await this.diagnoseDevice(d as any);
    }

    const allDevicesReachable = Object.values(reports).every((r) => r.overallReachable);

    return {
      timestamp: new Date().toISOString(),
      serverIp,
      admsPort,
      admsReceiverRunning: admsProbe.open,
      admsReceiverLatencyMs: admsProbe.latencyMs,
      reports,
      allDevicesReachable,
      checklist: [
        'Physical power and Ethernet link LEDs on SpeedFace-V5L',
        'Valid IP address on subnet 192.168.88.0/24',
        'ZKTeco ADMS Cloud Server set to 192.168.88.168 port 8081',
        'Active Site-to-Site VPN / Secure Tunnel between Cloud and On-Premise LAN',
        'Router NAT / Port Forwarding or direct routed subnet',
        'ADMS Push HTTP Port 8081 and TCP 4370 allowed in firewall',
      ],
    };
  }
}
