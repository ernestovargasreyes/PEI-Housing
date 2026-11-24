'use strict';
/*
 * Who is signed in, from the x-ms-client-principal header that Azure Static Web Apps adds
 * after Microsoft sign-in (base64 JSON with userRoles). The "coordinator" role is given to
 * Tonya, Jordan and Matt by invitation in the Static Web App (app/README.md).
 */
function principalFrom(header) {
  if (!header) return null;
  try { return JSON.parse(Buffer.from(String(header), 'base64').toString('utf8')) || null; } catch { return null; }
}
function isCoordinator(header) {
  const p = principalFrom(header);
  return !!(p && Array.isArray(p.userRoles) && p.userRoles.includes('coordinator'));
}
module.exports = { principalFrom, isCoordinator };
