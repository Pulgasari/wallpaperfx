// the native side: the Browser plugin (tabs = native content webviews, see
// ../../ARCHITECTURE.md) or the mock outside capacitor, and the session state it
// pushes. that state is the single source of truth for tabs, the chrome keeps no
// copy of its own.

import { createMock } from './mock.js';

const plugins = window.Capacitor?.Plugins ?? {};

export const plugin = plugins.Browser ?? createMock();

// @capacitor/filesystem, registered on Capacitor.Plugins by cap sync. null on web
export const filesystem = plugins.Filesystem ?? null;

// calls a plugin method without letting a rejection (mock, older native build)
// escape: the chrome never depends on these succeeding
export const call = async (method, args = {}) => {
  try   { return await plugin[method](args); }
  catch { return undefined; }
};

export const session = { tabs: [], activeId: '', expanded: false };

export const activeTab = () => session.tabs.find(tab => tab.id === session.activeId) ?? null;

export const setSession = state => Object.assign(session, state);
