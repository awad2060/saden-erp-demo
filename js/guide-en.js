'use strict';
/* «دليل الاستخدام» بالإنجليزية: [الأيقونة، العنوان، النص] لكل قسم بمعرّفه (يُعرض عند اختيار English).
 * كان داخل public/js/app.js ونُقل كما هو. أدوات app.js التي تحتاجها بعض الأقسام عند عرضها (can، today، AN_TOOLS، AN_CHAIN)
 * يمررها app.js مرة واحدة: SES_GUIDE.use(H). */
(function () {
  const GUIDE_EN = {
    start: [
      '🚀',
      'Getting started: login, menu and my account',
      `<ol><li><b>Login:</b> open the system link and enter the username and password given by the administrator.</li>
      <li><b>First login:</b> you must change the temporary password first. Choose a strong one and never share it.</li>
      <li><b>Side menu:</b> shows only what relates to your work and permissions.</li>
      <li><b>My account:</b> change password, upload your e-signature (approvers) and delegate someone while on leave.</li>
      <li><b>Apps screen:</b> the starting point — every section of the system is an icon, and you only see what your permissions allow (see "Apps screen & navigation").</li>
      <li><b>Top bar:</b> (from the left) your name, settings, log out, 🔔 notifications, ✉️ mail, 💬 chat, 📢 announcements, 🏠 home, apps, 📘 guide, 🌙 dark mode, and the language button.</li>
      <li><b>Language:</b> the <b>EN</b> button switches the interface to English and <b>ع</b> back to Arabic. Letters and clearances always print in Arabic.</li>
      <li><b>Dates</b> everywhere are shown as day/month/year (e.g. 04/11/2026).</li></ol>
      <div class="g-tip">💡 After several wrong attempts, login is locked for a while. Wait, or ask the administrator to reset your password.</div>`,
    ],
    notif: [
      '🔔',
      'Notifications',
      `<ul><li>Requests that reached you and await your approval or action.</li><li>Your request finally approved, returned for edit or rejected (with the reason).</li>
      <li>Daily reminder of late requests, and announcements 📢.</li></ul><p>Click a notification to open the request directly, or "Mark all as read". The count refreshes every minute.</p>`,
    ],
    legal: [
      '⚖️',
      'Legal affairs deduction (based on an investigation)',
      `<ol><li><b>Legal affairs</b> submits the "Legal affairs deduction form": employee data, the <b>employee's branch</b>, investigation number, date and result, the deduction reason and the <b>decided penalty</b> (e.g. two days' deduction), and attaches the <b>investigation report</b> (required).</li>
      <li>The <b>administrative manager</b> approves (or returns it to legal affairs if incomplete).</li>
      <li>The <b>payroll & wage protection manager</b> sets how the deduction is applied: single payment or monthly installments and their number, the starting payroll month, and instructions.</li>
      <li>The <b>finance manager</b> approves.</li>
      <li>The <b>payroll accountant</b> sets the <b>deduction value in SAR</b>, enters its payroll month and clicks "Deduction posted to payroll" — final approval.</li>
      <li>The <b>employee's branch accountant</b> is notified and finds the letter in the branch's letters register.</li></ol>
      <p>Letter signatures: legal affairs, the administrative manager and the finance manager. The input of the payroll manager and payroll accountant appears in section "Fourth: deduction application".</p>`,
    ],
    apps: [
      '🧩',
      'Apps screen & navigation',
      `<ul><li><b>Apps</b> are arranged in rows: main departments; then business & departments (Marketing, CRM, Tenders, Projects, Procurement, Quality, Legal, Documents); then daily tools (Requests center, Tasks, Calendar, CONTACTS, TO-DO, STICKY NOTES, Reports, Recycle bin); then account & system.</li>
      <li>An icon that contains other pages (e.g. Payroll, HR) opens to show them.</li>
      <li>The <b>Modern / Original</b> buttons change the look of icons and number tiles across the system, and <b>Grid / List</b> changes the layout. Your choice is saved on your device.</li>
      <li><b>Path bar</b> at the top of every page (like Windows Explorer): back, forward, "up" (previous level) and refresh, then your location, then <b>Search the system</b> (or Ctrl + K from any page) across pages, requests, employees and more.</li>
      <li><b>Page buttons</b> at the end of the bar: <b>– Minimize</b> (the page goes to a bar at the bottom; click its name to return), <b>□ Maximize</b> (full screen; Esc restores), <b>✕ Close</b> (back to the apps screen).</li>
      <li>Some apps (Finance, Supervision, Marketing, Tenders, Projects, Procurement) are under construction.</li></ul>`,
    ],
    sanad: [
      '🤖',
      'Sanad: system assistant & technical support',
      `<ul><li><b>Sanad</b> is the robot at the bottom of the screen. Click it to open the chat, or drag it anywhere.</li>
      <li>Ask in your own words (e.g. "renew Iqama", "my requests", "awaiting my approval") and it points you to the right page or form, or pick a suggestion.</li>
      <li>It reminds you from time to time of what is waiting for you: pending or late requests, returned requests, unread messages and announcements.</li>
      <li><b>🛠 Technical support request</b> is pinned at the top of Sanad's chat: describe the problem (what you were doing and what appeared), keep "Attach current page" ticked, then "Send to administrator". It reaches the administrator in internal chat with the page name, device and your branch, and the reply comes back in the same chat.</li>
      <li>The administrator sees "Technical support requests" instead and opens the chat from there.</li></ul>`,
    ],
    tools: [
      '🗂️',
      'Daily work tools',
      `<ul><li><b>💬 Internal chat:</b> instant conversations with colleagues (one-to-one or branch).</li>
      <li><b>Request chat:</b> on any request page, a quick chat about the request that includes only the submitter, the approvers and whoever the request is currently waiting on.</li>
      <li><b>Tasks:</b> tasks assigned by management with completion and review tracking.</li>
      <li><b>TO-DO:</b> your personal task list with due dates; the number due today shows on its icon.</li>
      <li><b>STICKY NOTES:</b> a new note floats over any page, saves automatically while you type, can be dragged anywhere and resized from any side. From the menu (⋯) change its color and priority (normal, important, urgent, very urgent — the pin color changes), open it in its own page or delete it. The formatting bar (bold, italic, lists, numeric font size) appears when you hover over the text. Nobody else can see your notes.</li>
      <li><b>Calendar & CONTACTS:</b> calendar and holidays, and a directory of colleagues' numbers and emails with WhatsApp contact.</li></ul>`,
    ],
    payroll: [
      '💵',
      'Payroll: branch statements & pay month',
      `<ul><li><b>Branch payroll statements:</b> the branch accountant prepares the branch's monthly statement and sends it; Payroll & Wage Protection reviews and approves it.</li>
      <li><b>Joining mid-month:</b> housing, transport and residence allowances are paid in full; basic salary, mobile, site, meals and other allowances are prorated by working days.</li>
      <li><b>Pay month:</b> when approving any allowance or deduction, the <b>payroll manager</b> chooses the payroll month it applies to; the employee file and the payroll statement update automatically.</li>
      <li>Visit housing and family visit allowances are one-time payments under "Other entitlements".</li>
      <li>Approved deductions flow automatically into the branch statement in their month: direct-manager deductions in <b>Penalties</b>, legal deductions in <b>Legal deduction</b>.</li>
      <li><b>Settlements:</b> the payroll accountant chooses which month's payroll expenses include the settlement; it then appears under "Settlements" when that month's payroll is prepared.</li></ul>`,
    ],
    hiring: [
      '🧑‍💼',
      'Hiring form (candidate data form)',
      `<ol><li>A <b>hiring officer</b> (e.g. HR or the recruiter) submits a "Hiring request": the candidate's personal data, job and location, qualifications and experience, contract data (type, duration, probation, sponsorship), chooses the <b>relevant technical committee member</b>, and attaches the <b>CV, qualification certificate and ID / Iqama</b> (required).</li>
      <li>The <b>technical committee member</b> enters the interview date and rates the candidate on four criteria (excellent to weak), with a recommendation and the committee's opinion.</li>
      <li>The <b>payroll manager</b> sets the financial offer: basic, housing, transport, communication, meals and other allowances (total calculated automatically), the <b>expected start date</b>, leave, medical insurance, GOSI and extra benefits.</li>
      <li>The <b>hiring committee head</b> decides: approve the proposed offer, approve with a salary change, or reject.</li>
      <li>After final approval the <b>job offer</b> is generated automatically and can be printed with or without the form.</li>
      <li>The request stays "Approved — awaiting the offer signed by the candidate" until the signed offer is uploaded from the request page, which closes the file.</li></ol>
      <p>The form is confidential: only the submitter, those on its route and the administrator can see it.</p>`,
    ],
    fleet: [
      '🚚',
      'Vehicle fleet & maintenance requests',
      `<p><b>Vehicle fleet:</b> a record of each vehicle with its branch, driver and documents (registration, periodic inspection, insurance, operating card). Expired documents show in red and those expiring within 30 days in orange, with a daily alert to the fleet manager. The branch accountant sees only the branch's vehicles.</p>
      <ol><li>The <b>branch accountant</b> submits a "Vehicle maintenance request": vehicle, odometer, maintenance type, fault description and workshop (company or external).</li>
      <li>The <b>workshop officer</b> enters the diagnosis, parts and labor cost and duration.</li>
      <li>The <b>branch manager</b> then the <b>fleet manager</b> approve the estimate.</li>
      <li>The <b>workshop officer</b> records the actual cost, invoice number and odometer at delivery; the request is finally approved and the vehicle record updated.</li></ol>
      <p><b>Traffic violations:</b> the fleet manager uploads the week's violations from Excel; the <b>responsible driver is identified automatically</b> from the handover record valid on the violation date, and each violation goes to its branch accountant to settle.</p>`,
    ],
    ops: [
      '🛠️',
      'Workshop, drilling & inventory',
      `<p><b>Workshop:</b> stock and issue vouchers (with 15% VAT, never above stock), manufacturing orders, and scrap supply and sale vouchers.</p>
      <p><b>Drilling department:</b> the rigs register with TUV certificates (expired in red, near expiry in orange, with daily alerts) and projects.</p>
      <p><b>Inventory management:</b> each branch's lab, site and housing inventory — count, brand, serial, barcode and condition — with transfers between branches, printing and export.</p>`,
    ],
    mail: [
      '✉️',
      'Internal mail & announcements',
      `<ul><li><b>✉️ Internal mail:</b> messages between users. "New message" → search a recipient by name, role or branch (or add a whole branch) → subject, text, attachments → Send.</li>
      <li>The number on the icon = unread messages, and you also get a bell notification. From a message: Reply, Reply all, Forward, or delete from your box only.</li>
      <li>In your sent messages you see who read them.</li><li><b>📢 Announcements:</b> all announcements sent to you; new ones are highlighted. The administrator sends them here and sees who read each one.</li></ul>`,
    ],
    acc: [
      '➕',
      'Branch accountant: submitting and tracking requests',
      `<ol><li>From <b>New request</b> choose the form (allowances, entitlements, advances...).</li><li>Fill in the data; a live preview shows the letter as it will be printed.</li>
      <li>Attach the <b>required attachments</b> (marked *); the request cannot be sent without them.</li><li>Click <b>Send for approval</b>. If a similar request exists for the same employee you are warned first.</li></ol>
      <p><b>My requests:</b> all your requests and their status. <b>Returned request:</b> open it, read the reason, edit and resubmit. You can cancel your request before anyone approves it.</p>
      <p><b>Letters register:</b> finally approved letters of your branch, for viewing and printing.</p>`,
    ],
    case: [
      '🧾',
      'Employee settlement request (step by step)',
      `<ol><li><b>Branch accountant</b> submits the request: type (leave / final), name, Iqama, job and notes.</li>
      <li><b>HR</b> fills hiring date, work start / return date, last working day (working days are calculated automatically), paid leave days, leave duration, sponsorship, nationality, and the termination reason for final settlements — then returns it to the accountant.</li>
      <li><b>Accountant</b> answers: advances/deductions? custody items? (<b>Yes / None</b>), fills the tables if any, and states whether there is a car. If there is a car: enter the car data, <b>print the record</b>, have the deliverer and receiver sign the same sheet, upload it and send.</li>
      <li><b>Fleet department</b> (only with a car) reviews the data and the signed record and approves; the accountant then forwards the file to the payroll accountant.</li>
      <li><b>Payroll accountant</b> opens the prefilled settlement program, completes salary and entitlements, enters the <b>End-of-service award</b> for final settlements and sends for approval.</li>
      <li><b>Approval chain</b>; after final approval the settlement and the automatic <b>clearance</b> are printed.</li>
      <li><b>Closing the file:</b> the accountant prints the clearance, the employee signs and fingerprints it, and the accountant uploads it from the request page to close the file.</li></ol>`,
    ],
    appr: [
      '✅',
      'Approvers: making decisions',
      `<ol><li>Open <b>Awaiting my approval</b>; late requests are marked.</li><li>Review the letter, attachments and history.</li>
      <li>Decide: <b>Approve</b> (moves to the next stage or final approval), <b>Return</b> to the accountant (write the reason) or <b>Reject</b> (final, write the reason).</li></ol>
      <p><b>E-signature:</b> upload it from My account to appear on letters you approve. <b>Delegation:</b> before your leave, delegate a colleague to approve on your behalf.</p>
      <p><b>Branch manager:</b> in some requests (e.g. direct manager deduction) the first approval goes automatically to the request's branch manager; each manager gets only his branch.</p>`,
    ],
    hr: [
      '👥',
      'HR',
      `<ul><li>Fill in the dates; <b>working days</b> are calculated automatically.</li><li>Your <b>notes / decision</b> are printed under the employee data on the "Employee data from HR" page of the settlement file.</li><li>What you write in <b>Sponsorship</b> appears as the company name in the settlement program and clearance.</li>
      <li><b>Leave duration</b> moves to the program as is. For final settlements choose the <b>termination reason</b>, then "Approve & return to accountant".</li></ul>`,
    ],
    traffic: [
      '🚗',
      'Fleet department',
      `<ul><li>You receive the request when the employee has a car.</li><li>Review the car data and open the <b>signed paper record</b>.</li><li>Enter the receiver and approve, or return it if the record is incomplete.</li></ul>`,
    ],
    wps: [
      '🧮',
      'Payroll accountant',
      `<ul><li>Click <b>Prepare settlement in program</b>; data, deductions and custody are prefilled.</li><li>Complete basic salary and entitlements and review.</li>
      <li>For final settlements enter the award in the "End-of-service award" row.</li><li>Choose <b>"Paid by (on clearance)"</b>: Saden or the subsidiary sponsoring the employee (external sponsorship = Saden), then send for approval.</li></ul>`,
    ],
    routes: [
      '🧭',
      'Approval routes for all requests',
      `<p>Each route starts with the submitter and passes the stages in order. Each stage owner is notified, and the request moves on only after approval. Routes are read from the current settings.</p>
      <div id="gRoutes" class="muted">Loading...</div>`,
    ],
    qr: [
      '🔍',
      'Verifying letters (QR)',
      `<p>Every approved letter carries a QR code. Scan it with a phone camera to open a page confirming the letter was issued by the system, with its status and main data. "Not found" means the letter is invalid or deleted.</p>`,
    ],
    admin: [
      '⚙️',
      'Administrator',
      `<ul><li><b>Users and roles:</b> add users and define what each role sees and does.</li><li><b>Approval routes</b>, the settlement cycle and the legal deduction cycle.</li>
      <li><b>Forms & branches:</b> edit forms and create new ones. <b>Announcements:</b> from 📢 send to everyone, a branch or selected users.</li>
      <li><b>Branch managers:</b> set the branch exactly as in the accountant's account, tick "Manager of this branch", then use "🏢 Branch manager (by request branch)" in routes. <b>Group companies</b> (General settings) feed the clearance "Paid by" choices.</li>
      <li><b>Recycle bin</b> (its own app icon): deleted items stay 30 days. It shows to the administrator, and to others by enabling "Recycle bin" in their role or user permissions.</li>
      <li><b>Icon visibility:</b> role and user permissions include "App icons and their contents" to hide any icon or part of it (hide only; what permissions don't allow never shows).</li>
      <li><b>Technical support requests</b> from users reach you through Sanad in internal chat, with the page, device and branch, plus a notification.</li>
      <li><b>Organized archive:</b> every approved or rejected request and every approved payroll statement is copied automatically to <span dir="ltr">data/archive</span>: branch or department → data type → month → request (data, printable letter, attachments).</li>
      <li><b>Verification code (OTP):</b> Settings → Email: after setting up email send a test code and enable it; emergency file data/otp-off disables it.</li>
      <li><b>Backup, activity log, email and holidays.</b></li></ul>`,
    ],
    policy: [
      '📜',
      'Acceptable use policy',
      `<p>Your use of the system is subject to the <b>acceptable use policy</b>: data confidentiality, account protection, permitted and prohibited use, the legal effect of approvals and e-signatures, and logging and monitoring.</p>
      <p><a class="btn" href="#/policy">📜 Read the acceptable use policy</a></p>`,
    ],
    faq: [
      '❓',
      'FAQ',
      `<p><b>Forgot your password?</b> Ask the administrator to reset it.</p><p><b>Can't see a page or form?</b> Pages depend on your permissions; ask the administrator.</p>
      <p><b>Something changed but you don't see it?</b> Refresh the page (F5).</p><p><b>How do I change the language?</b> Use the EN / ع button in the top bar. Letters always print in Arabic.</p><p><b>Attachment won't upload?</b> Check the type (PDF, images, Word, Excel, ZIP) and allowed size.</p>
      <p><b>Having a problem with the system?</b> Open Sanad and click "🛠 Technical support request"; your message reaches the administrator with the page name.</p><p><b>Where are my sticky notes?</b> From the STICKY NOTES icon in Apps; open notes stay floating over every page.</p>`,
    ],
  };
  window.SES_GUIDE = Object.assign(window.SES_GUIDE || {}, { GUIDE_EN });
})();
