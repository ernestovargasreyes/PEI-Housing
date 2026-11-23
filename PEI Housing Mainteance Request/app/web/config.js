/*
 * Settings Tonya, Jordan or IT change without touching the form's code.
 *
 * Emergency numbers are not set here. Each property handles its own emergencies
 * (Matt, 2026-11-23), so the emergency screen shows the property's After-Hours Phone
 * from the SharePoint Properties list. Fill that column for every property.
 *
 * BEFORE WORKERS GET THE LINK: set the housing number. While it still holds X's, the form
 * shows a red "Not ready" bar and `npm run check:launch` fails.
 *
 * For the platform trial (trial-platform.md), leave testMode on: every number is shown
 * with "TEST – do not call" and a banner says requests go to the trial queue.
 */
window.PEI_CONFIG = {
  // Plateau housing: shown under every emergency number ("Can't reach them?"), and the
  // number workers text when the form will not send or call when rate-limited. Display format.
  housingNumber: '(XXX) XXX-XXXX',
  // Trial week only. Set to false for the January pilot.
  testMode: true,
  // Days nobody reviews the queue (YYYY-MM-DD). The confirmation skips them, and weekends,
  // when it tells the worker which day their request will be sent.
  holidays: ['2026-12-24', '2026-12-25', '2026-12-31', '2027-01-01'],
};
