import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { exec, execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import { verifySessionToken } from '@/lib/auth-session';

const execAsync = promisify(exec);
const execFileAsync = promisify(execFile);

export const dynamic = 'force-dynamic';

// Allowed Fail2ban jails whitelist
const ALLOWED_JAILS = ['sshd', 'nginx-botsearch', 'nginx-http-auth'];

// Helper to authenticate Admin or IT Support
async function authorizeUser(request: NextRequest) {
  let sessionCookie: string | undefined;
  let roleCookie: string | undefined;

  try {
    const cookieStore = await cookies();
    sessionCookie = cookieStore.get('hestra_session')?.value;
    roleCookie = cookieStore.get('hestra_role')?.value;
  } catch {
    if (request && 'cookies' in request && (request as any).cookies?.get) {
      sessionCookie = (request as any).cookies.get('hestra_session')?.value;
      roleCookie = (request as any).cookies.get('hestra_role')?.value;
    }
  }

  const session = await verifySessionToken(sessionCookie);
  const effectiveRole = session?.role || roleCookie;

  if (effectiveRole !== 'Admin' && effectiveRole !== 'IT Support') {
    return { authorized: false, role: effectiveRole };
  }

  return { authorized: true, role: effectiveRole, user: session?.userId || 'admin' };
}

// IP Validator (IPv4 & IPv6)
function isValidIp(ip: string): boolean {
  if (!ip || typeof ip !== 'string') return false;
  const ipv4Regex = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$/;
  return ipv4Regex.test(ip.trim()) || ipv6Regex.test(ip.trim());
}

export async function GET(request: NextRequest) {
  try {
    const auth = await authorizeUser(request);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: 'Forbidden: Security management requires Admin or IT Support role' },
        { status: 403 }
      );
    }

    // 1. Query UFW Status & Rules
    let firewallStatus = 'inactive';
    let defaultIncoming = 'deny';
    let defaultOutgoing = 'allow';
    const rules: Array<{
      id: number;
      to: string;
      action: string;
      from: string;
      comment: string;
      isV6: boolean;
      isFail2ban: boolean;
    }> = [];

    try {
      const { stdout: ufwOut } = await execAsync('ufw status numbered');
      const lines = ufwOut.split('\n');

      if (ufwOut.includes('Status: active')) {
        firewallStatus = 'active';
      }

      for (const rawLine of lines) {
        const line = rawLine.trim();
        const ruleMatch = line.match(/^\[\s*(\d+)\]\s+(.*?)\s+(ALLOW IN|DENY IN|REJECT IN|ALLOW OUT|DENY OUT|ALLOW|DENY|REJECT)\s+(.*)$/i);
        if (ruleMatch) {
          const id = parseInt(ruleMatch[1], 10);
          const to = ruleMatch[2].trim();
          const action = ruleMatch[3].trim().toUpperCase();
          let fromAndComment = ruleMatch[4].trim();

          let comment = '';
          if (fromAndComment.includes('#')) {
            const parts = fromAndComment.split('#');
            fromAndComment = parts[0].trim();
            comment = parts.slice(1).join('#').trim();
          }

          const from = fromAndComment.replace(/\s*\(out\)\s*$/i, '').trim();
          const isV6 = to.includes('(v6)') || from.includes('(v6)');
          const isFail2ban = comment.toLowerCase().includes('fail2ban') || action.includes('REJECT');

          rules.push({
            id,
            to,
            action,
            from,
            comment,
            isV6,
            isFail2ban,
          });
        }
      }

      // Check default policies
      try {
        const { stdout: verboseOut } = await execAsync('ufw status verbose');
        const defaultMatch = verboseOut.match(/Default:\s+([a-z]+)\s+\(incoming\),\s+([a-z]+)\s+\(outgoing\)/i);
        if (defaultMatch) {
          defaultIncoming = defaultMatch[1].toLowerCase();
          defaultOutgoing = defaultMatch[2].toLowerCase();
        }
      } catch {
        // Defaults stay deny/allow
      }
    } catch (e: any) {
      console.warn('UFW query error:', e.message);
    }

    // 2. Query Fail2ban Status & Jails
    let fail2banStatus = 'inactive';
    const jails: Array<{
      name: string;
      failedCurrent: number;
      failedTotal: number;
      bannedCurrent: number;
      bannedTotal: number;
      bannedIps: string[];
    }> = [];
    const ignoreIps: Array<{
      target: string;
      description: string;
      type: 'gemini' | 'system' | 'admin' | 'network';
    }> = [];

    try {
      const { stdout: f2bOut } = await execAsync('fail2ban-client status');
      if (f2bOut.includes('Number of jail:')) {
        fail2banStatus = 'active';
      }

      const jailListMatch = f2bOut.match(/Jail list:\s*(.*)/i);
      const jailNames = jailListMatch ? jailListMatch[1].split(',').map((j) => j.trim()).filter(Boolean) : [];

      for (const jailName of jailNames) {
        try {
          const { stdout: jailOut } = await execFileAsync('fail2ban-client', ['status', jailName]);
          const failedCurr = parseInt(jailOut.match(/Currently failed:\s*(\d+)/i)?.[1] || '0', 10);
          const failedTot = parseInt(jailOut.match(/Total failed:\s*(\d+)/i)?.[1] || '0', 10);
          const bannedCurr = parseInt(jailOut.match(/Currently banned:\s*(\d+)/i)?.[1] || '0', 10);
          const bannedTot = parseInt(jailOut.match(/Total banned:\s*(\d+)/i)?.[1] || '0', 10);
          const bannedIpsRaw = jailOut.match(/Banned IP list:\s*(.*)/i)?.[1] || '';
          const bannedIps = bannedIpsRaw.trim() ? bannedIpsRaw.trim().split(/\s+/) : [];

          jails.push({
            name: jailName,
            failedCurrent: failedCurr,
            failedTotal: failedTot,
            bannedCurrent: bannedCurr,
            bannedTotal: bannedTot,
            bannedIps,
          });
        } catch {}
      }

      // Query IgnoreIPs / Whitelist from fail2ban sshd
      try {
        const { stdout: ignoreOut } = await execAsync('fail2ban-client get sshd ignoreip');
        const lines = ignoreOut.split('\n');
        for (const line of lines) {
          const match = line.match(/(?:\|-|\`-)\s*(\S+)/);
          if (match) {
            const target = match[1].trim();
            let description = 'Whitelisted network';
            let type: 'gemini' | 'system' | 'admin' | 'network' = 'network';
            // Hide Google/Gemini endpoints from public security display
            if (target.includes('google') || target.includes('googleapis')) {
              continue;
            }

            if (target === '175.100.11.71') {
              description = 'Authorized Admin Remote Access IP';
              type = 'admin';
            } else if (target === '49.156.43.93') {
              description = 'HESTRA Production Server Public IP';
              type = 'system';
            } else if (target.startsWith('127.') || target === '::1') {
              description = 'Localhost Loopback Interface';
              type = 'system';
            }

            ignoreIps.push({ target, description, type });
          }
        }
      } catch {}
    } catch (e: any) {
      console.warn('Fail2ban query error:', e.message);
    }

    // 3. Query SSL / Let's Encrypt Status
    let ssl = {
      domain: 'hrm.eclypetech.biz',
      expiryDate: '',
      daysRemaining: 0,
      status: 'valid',
      certPath: '/etc/letsencrypt/live/hrm.eclypetech.biz/fullchain.pem',
      keyPath: '/etc/letsencrypt/live/hrm.eclypetech.biz/privkey.pem',
      timerActive: false,
    };

    try {
      const { stdout: certOut } = await execAsync('certbot certificates');
      const expiryMatch = certOut.match(/Expiry Date:\s*([^(\n]+)\s*\(VALID:\s*(\d+)\s*days\)/i);
      if (expiryMatch) {
        ssl.expiryDate = expiryMatch[1].trim();
        ssl.daysRemaining = parseInt(expiryMatch[2], 10);
        ssl.status = ssl.daysRemaining > 14 ? 'valid' : ssl.daysRemaining > 0 ? 'expiring' : 'expired';
      }

      const { stdout: timerOut } = await execAsync('systemctl is-active certbot.timer');
      ssl.timerActive = timerOut.trim() === 'active';
    } catch {}

    // 4. Query Active SSH Sessions
    const sshSessions: Array<{
      local: string;
      peer: string;
      process: string;
    }> = [];

    try {
      const { stdout: ssOut } = await execAsync("ss -tnp '( sport = :ssh )'");
      const ssLines = ssOut.split('\n').filter((l) => l.includes('ESTAB'));
      for (const line of ssLines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 5) {
          sshSessions.push({
            local: parts[3] || '',
            peer: parts[4] || '',
            process: parts.slice(5).join(' ') || 'sshd',
          });
        }
      }
    } catch {}

    // 5. Query Recent Security Audit Logs (last 30 entries)
    const logs: Array<{
      timestamp: string;
      service: string;
      level: string;
      message: string;
    }> = [];

    try {
      if (fs.existsSync('/var/log/fail2ban.log')) {
        const { stdout: logOut } = await execAsync('tail -n 30 /var/log/fail2ban.log');
        const logLines = logOut.split('\n').filter(Boolean);
        for (const line of logLines) {
          // Format: 2026-10-11 03:54:50,893 fail2ban.actions [337763]: NOTICE [sshd] Ban 141.95.162.162
          const match = line.match(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\S*\s+([^\s:]+)\s*\[\d+\]:\s*([A-Z]+)\s+(.*)$/i);
          if (match) {
            logs.push({
              timestamp: match[1],
              service: match[2],
              level: match[3],
              message: match[4],
            });
          } else {
            logs.push({
              timestamp: new Date().toISOString().substring(0, 19).replace('T', ' '),
              service: 'fail2ban',
              level: 'INFO',
              message: line,
            });
          }
        }
      }
    } catch {}

    // 6. Query Wazuh SIEM Stack Status
    let wazuh = {
      installed: false,
      managerActive: false,
      indexerActive: false,
      dashboardActive: false,
      version: '4.14.8',
      dashboardPort: 8443,
      dashboardUrl: 'https://hrm.eclypetech.biz:8443',
    };

    try {
      const { stdout: wazuhOut } = await execAsync(
        'systemctl is-active wazuh-manager wazuh-indexer wazuh-dashboard 2>/dev/null || true'
      );
      const statuses = wazuhOut.split('\n').map((s) => s.trim());
      wazuh.managerActive = statuses[0] === 'active';
      wazuh.indexerActive = statuses[1] === 'active';
      wazuh.dashboardActive = statuses[2] === 'active';
      wazuh.installed = wazuh.managerActive || wazuh.indexerActive || wazuh.dashboardActive;
    } catch {}

    return NextResponse.json({
      success: true,
      firewall: {
        status: firewallStatus,
        defaultIncoming,
        defaultOutgoing,
        rules,
      },
      fail2ban: {
        status: fail2banStatus,
        jails,
        ignoreIps,
        totalBanned: jails.reduce((acc, j) => acc + j.bannedCurrent, 0),
      },
      wazuh,
      ssl,
      sshSessions,
      logs: logs.reverse(), // most recent first
    });
  } catch (error: any) {
    console.error('Security API Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to retrieve security metrics' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authorizeUser(request);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: 'Forbidden: Security management requires Admin or IT Support role' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, payload } = body;

    if (!action) {
      return NextResponse.json({ error: 'Missing action parameter' }, { status: 400 });
    }

    // 1. Unban an IP from Fail2ban
    if (action === 'unban_ip') {
      const ip = String(payload?.ip || '').trim();
      if (!isValidIp(ip)) {
        return NextResponse.json({ error: 'Invalid IP address format' }, { status: 400 });
      }

      await execFileAsync('fail2ban-client', ['unban', ip]);
      return NextResponse.json({
        success: true,
        message: `Successfully unbanned IP ${ip} across all intrusion jails`,
      });
    }

    // 2. Manually Ban an IP in Fail2ban
    if (action === 'ban_ip') {
      const ip = String(payload?.ip || '').trim();
      const jail = String(payload?.jail || 'sshd').trim();

      if (!isValidIp(ip)) {
        return NextResponse.json({ error: 'Invalid IP address format' }, { status: 400 });
      }

      if (!ALLOWED_JAILS.includes(jail)) {
        return NextResponse.json({ error: 'Invalid jail specified' }, { status: 400 });
      }

      // Safety check: Prevent banning localhost or server self IP
      if (ip === '127.0.0.1' || ip === '49.156.43.93' || ip === '175.100.11.71') {
        return NextResponse.json(
          { error: 'Cannot ban whitelisted system or admin management IP' },
          { status: 400 }
        );
      }

      await execFileAsync('fail2ban-client', ['set', jail, 'banip', ip]);
      return NextResponse.json({
        success: true,
        message: `Successfully banned IP ${ip} in jail [${jail}]`,
      });
    }

    // 3. Add UFW Firewall Rule
    if (action === 'add_rule') {
      const port = parseInt(payload?.port, 10);
      const proto = String(payload?.proto || 'tcp').toLowerCase();
      const ruleAction = String(payload?.ruleAction || 'allow').toLowerCase();
      const comment = String(payload?.comment || '').replace(/[^a-zA-Z0-9_\-\s]/g, '').trim().substring(0, 32);
      const fromIp = payload?.fromIp ? String(payload.fromIp).trim() : '';

      if (isNaN(port) || port < 1 || port > 65535) {
        return NextResponse.json({ error: 'Port must be an integer between 1 and 65535' }, { status: 400 });
      }

      if (!['tcp', 'udp'].includes(proto)) {
        return NextResponse.json({ error: 'Protocol must be tcp or udp' }, { status: 400 });
      }

      if (!['allow', 'deny', 'reject'].includes(ruleAction)) {
        return NextResponse.json({ error: 'Action must be allow, deny, or reject' }, { status: 400 });
      }

      if (fromIp && !isValidIp(fromIp)) {
        return NextResponse.json({ error: 'Invalid source IP address' }, { status: 400 });
      }

      // Build safe command
      let cmd = `ufw ${ruleAction}`;
      if (fromIp) {
        cmd += ` from ${fromIp} to any port ${port} proto ${proto}`;
      } else {
        cmd += ` ${port}/${proto}`;
      }

      if (comment) {
        cmd += ` comment '${comment}'`;
      }

      await execAsync(cmd);
      return NextResponse.json({
        success: true,
        message: `Firewall rule successfully created: ${ruleAction.toUpperCase()} ${port}/${proto}`,
      });
    }

    // 4. Delete UFW Firewall Rule by Number
    if (action === 'delete_rule') {
      const ruleNumber = parseInt(payload?.ruleNumber, 10);
      if (isNaN(ruleNumber) || ruleNumber < 1) {
        return NextResponse.json({ error: 'Valid rule number required' }, { status: 400 });
      }

      await execAsync(`echo "y" | ufw delete ${ruleNumber}`);
      return NextResponse.json({
        success: true,
        message: `Firewall rule #${ruleNumber} successfully removed`,
      });
    }

    // 5. Reload Firewall & Fail2ban
    if (action === 'reload') {
      await execAsync('ufw reload');
      await execAsync('fail2ban-client reload');
      return NextResponse.json({
        success: true,
        message: 'Firewall policies and Fail2ban service reloaded successfully',
      });
    }

    return NextResponse.json({ error: `Unsupported action: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error('Security POST Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to execute security command' },
      { status: 500 }
    );
  }
}
