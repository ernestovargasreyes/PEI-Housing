/*
 * Settings Tonya, Jordan or IT change without touching the form's code.
 *
 * BEFORE WORKERS GET THE LINK: set both numbers. While either still holds X's, the form
 * shows a red "Not ready" bar and `npm test` fails. The emergency number is the one
 * placeholder in this project with a safety consequence (spec/risks-and-blockers.md §1).
 *
 * For the platform trial (trial-platform.md), leave testMode on: every number is shown
 * with "TEST – do not call" and a banner says requests go to the trial queue.
 */
window.PEI_CONFIG = {
  // The 24-hour line shown on the emergency screen and the confirmation. Display format.
  emergencyNumber: '(XXX) XXX-XXXX',
  // The coordinators' number workers text when the form will not send, or call when rate-limited.
  housingNumber: '(XXX) XXX-XXXX',
  // Trial week only. Set to false for the January pilot.
  testMode: true,
  // Days nobody reviews the queue (YYYY-MM-DD). The confirmation skips them, and weekends,
  // when it tells the worker which day their request will be sent.
  holidays: ['2026-12-24', '2026-12-25', '2026-12-31', '2027-01-01'],
};
