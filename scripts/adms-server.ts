#!/usr/bin/env tsx
/**
 * scripts/adms-server.ts
 * Standalone runner for HESTRA HRM ZKTeco ADMS Push Receiver
 * Listens on port 8081 (default) to receive pushes from ZKTeco biometric terminals.
 */

import { startAdmsServer } from '../src/lib/zkteco/adms-server';

const port = Number(process.env.ADMS_PORT) || 8081;
const host = process.env.ADMS_HOST || '0.0.0.0';

startAdmsServer(port, host);
