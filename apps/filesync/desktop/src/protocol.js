// localsend v2 protocol constants shared across the desktop modules.
// the on-the-wire shapes are documented in ../../PROTOCOL.md and MUST stay in
// sync with the android client (apps/filesync/android FileSyncPlugin).

export const PROTOCOL_VERSION = '2.1';
export const DEFAULT_PORT = 53317;      // localsend tcp (http/https) + udp multicast
export const MULTICAST_GROUP = '224.0.0.167';
export const API_BASE = '/api/localsend/v2';

// device types used in the info dto
export const DEVICE_TYPE = 'desktop';
export const DEVICE_MODEL = 'linux';
