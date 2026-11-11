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
      <li><b>My account:</b> change password, upload your e-signature (approvers) and delegate someone while on leave.</li>
      <li><b>Apps screen:</b> the starting point — every section of the system is an icon, and you only see what your permissions allow (see "Apps screen & navigation").</li>
      <li><b>Top bar:</b> apps, 💬 chat, ✉️ mail, 🔔 notifications, and your name. Clicking your name opens the account menu: my account, dark mode, language, user guide, settings and log out.</li>
      <li><b>Language:</b> choose العربية, English or اردو from the account menu. Letters and clearances always print in Arabic.</li>
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
      true,
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
      <p><b>Something changed but you don't see it?</b> Refresh the page (F5).</p><p><b>How do I change the language?</b> Choose the language from the account menu (click your name at the top). Letters always print in Arabic.</p><p><b>Attachment won't upload?</b> Check the type (PDF, images, Word, Excel, ZIP) and allowed size.</p>
      <p><b>Having a problem with the system?</b> Open Sanad and click "🛠 Technical support request"; your message reaches the administrator with the page name.</p><p><b>Where are my sticky notes?</b> From the STICKY NOTES icon in Apps; open notes stay floating over every page.</p>`,
    ],
    news: [
      '✨',
      "What's new in the system",
      `<div class="gx-news">
        <a href="#/supervision"><b>Branch Management</b><span>Branches by region with a file for each branch, reports from branch to region to the Branch Management manager, complaints and escalation, transfers and assignments, and periodic reports to the CEO.</span></a>
        <a href="#/governance"><b>Governance &amp; Compliance</b><span>Risk register and risk map, delegation of authority matrix, internal audit, policies with read acknowledgement, conflict of interest, and a confidential reporting channel.</span></a>
        <a href="#/hse"><b>Health &amp; Safety</b><span>Incident reports, safety observations, work permits, checklist inspections, and a counter of days without injuries.</span></a>
        <a href="#/analysis"><b>Analysis tools</b><span>17 tools (SWOT, PESTEL and more) saved on the server and shared with the team, moving between linked tools, and a full PDF report.</span></a>
        <a href="#/docs"><b>Documents</b><span>Companies as tiles; each company has a summary, its documents and its branches' documents with expiry date, time left and file preview. Uploading the file is mandatory.</span></a>
        <a href="#/employees"><b>Employee file</b><span>Postgraduate studies, master's and doctorate, categorised documents, CV, classification and Saudization for Saudis, and fingerprint exemption.</span></a>
        <a href="javascript:void 0" data-gjump="labor"><b>Labor law</b><span>All types of end of service and leave under the Saudi Labor Law, with their effect and durations.</span></a>
        <a href="javascript:void 0" data-gjump="mobile"><b>SES app</b><span>The camera saves automatically, "My qualifications &amp; documents", signing the advance, the approved PDF form, cancellation reason, and a unified chat look.</span></a>
      </div>`,
    ],
    supervision: [
      '🧭',
      'Branch Management',
      `<p>Route: <b>Branch manager → Region manager → Branch Management manager → CEO</b>. Regions: Southern, Northern, Western, Eastern and Central (the administrator sets each region's branches and manager).</p>
      <ul>
        <li><b>Branches &amp; regions:</b> each branch is a tile (with the number of employees, projects and open complaints); clicking it opens the <b>branch file</b>: structure (job titles, departments and managers), equipment (vehicles, rigs and inventory), capabilities, weaknesses and challenges, needs and requirements, and current projects and workload. Data comes from the system automatically; the descriptive fields are written by the branch, region or Branch Management manager.</li>
        <li><b>Submit a report:</b> the branch manager submits a report (weekly / monthly / quarterly / special) to the region manager, who reviews it or <b>forwards it to the Branch Management manager</b>. The region manager submits the region's report.</li>
        <li><b>Work complaint / problem:</b> from the branch manager → the region manager resolves it or <b>escalates it</b> → the Branch Management manager. Once resolved, its owner closes or reopens it.</li>
        <li><b>Transfer / assignment request:</b> the Branch Management manager sends it to HR (employee, requested branch, duration and reason). After "Executed", <b>the system counts the assignment in attendance</b> so it is not treated as absence.</li>
        <li><b>Periodic reports:</b> monthly, quarterly, semi-annual and annual for the CEO; the system calculates the period and its statistics automatically (reports, resolved and open complaints, transfers and assignments, their distribution by region, and branches that did not report), with summary, achievements, challenges and recommendations, PDF printing, and the CEO confirms "Reviewed".</li>
      </ul>`,
    ],
    governance: [
      '🏛️',
      'Governance & Compliance',
      `<ul>
        <li><b>Governance dashboard:</b> high and critical risks, open and overdue audit findings, the <b>5×5 risk map</b>, and "Required from you" for each user.</li>
        <li><b>Risk register:</b> the risk and its category, likelihood and impact (1–5) from which the score and level are calculated (low / medium / high / critical), its owner, treatment approach, plan and dates. The owner is notified and writes a response and plan.</li>
        <li><b>Delegation of authority (DoA):</b> the approval limit in riyals for each approver (for all financial requests or for a group of forms). If the request amount exceeds the current approver's limit, a warning appears on the request page.</li>
        <li><b>Internal audit:</b> audit engagements (area, branch, auditor, period, scope), and findings with their significance, recommendation, owner and due date; the owner responds and the governance team closes.</li>
        <li><b>Policies &amp; procedures:</b> text, file, version and effective date; each user acknowledges reading, <b>a new version requires a new acknowledgement</b>, and the team sees who acknowledged and who did not.</li>
        <li><b>Conflict of interest:</b> an annual declaration of commitment to the code of conduct and disclosure of any conflict.</li>
        <li><b>Reporting channel:</b> a confidential report that can be <b>anonymous</b>; you get a <b>tracking code</b> to check the status and reply. Only the governance team can see it.</li>
      </ul>
      <div class="g-tip">💡 The administrator sets the "Governance, compliance and internal audit team" in Settings → Approval routes → Operations management teams.</div>`,
    ],
    docs: [
      '📁',
      'Documents',
      `<ul>
        <li><b>Companies appear as tiles</b> like the apps page; inside each company: a <b>summary</b>, <b>company documents</b> and <b>branch documents</b> (each branch is a tile with its documents inside).</li>
        <li>Each document is one row: name, expiry date, time left (red for expired, orange for expiring soon) and <b>file preview</b>, with filtering by status and type, and search.</li>
        <li><b>Uploading the document file is mandatory</b> when adding. A commercial registration that belongs to a branch appears inside that branch.</li>
        <li>Mudad subscriptions, compliance rate and the <b>wage protection compliance certificate</b> are in Payroll → Mudad &amp; wage protection.</li>
        <li>The administrator edits the names of required documents in General settings, and the system flags the missing ones. The branch accountant and branch manager can view their branch's documents.</li>
      </ul>`,
    ],
    empfile: [
      '🪪',
      'Employee file',
      `<ul>
        <li><b>Education:</b> after the basic qualification, "Yes / No" choices for <b>postgraduate studies</b>, <b>master's</b> and <b>doctorate</b>; "Yes" shows the major, university and date, and makes <b>its certificate mandatory</b>. The employee can also add them from the SES app (My qualifications &amp; documents).</li>
        <li><b>Documents are categorised:</b> ID / Iqama, passport, graduation certificate, and postgraduate, master's and doctorate certificates (shown in red "Mandatory, not uploaded" until uploaded), then "Other documents".</li>
        <li><b>CV:</b> a tab built automatically from the employee's data, experience, qualifications, courses and licences, with print / PDF.</li>
        <li><b>Insurance:</b> the file shows its data as fields. "Current period" was removed from Work and Team.</li>
        <li><b>Saudis only:</b> "Classification" (1 or 2) and "Counted in Saudization" (Yes / No), from which the <b>Saudization rate</b> and the counted and uncounted numbers appear in the employee register summary.</li>
        <li><b>Exempt from fingerprint:</b> set from the file or "Attendance &amp; fingerprint"; the system does not count absence, lateness or early leave for the employee.</li>
      </ul>`,
    ],
    punch: [
      '🕘',
      'Fingerprint & attendance',
      `<ul>
        <li>Punching is from the SES app: office (inside the branch area) or flexible (from anywhere), depending on the shift type or the employee file.</li>
        <li><b>Assignment:</b> appears on the punch screen; during it punching is not required and the system counts no absence or lateness (from an approved work mission or an assignment executed from Branch Management).</li>
        <li><b>Fingerprint exemption:</b> an exempt employee's days show "Exempt from fingerprint" and no absence is counted.</li>
        <li>The system calculates attendance, lateness and overtime from the shift and grace period, and shows them in the employee file, the SES app and payroll data.</li>
      </ul>`,
    ],
    labor: [
      '📘',
      'Labor law: leave and end of service',
      {
        leaveH: 'Leave types (under the Saudi Labor Law)',
        leaveCols: ['Type', 'Maximum', 'Deducted from balance', 'Details'],
        endH: 'End of service types and their effect',
        endCols: ['Type', 'Notice (open-ended contract)', 'End of service award'],
        days: '{0} days',
        yes: 'Yes',
        no: 'No',
        resign: 'By length of service (Art. 85): under 2 years nothing, 2–5 one third, 5–10 two thirds, 10 or more in full',
        tip: '💡 The administrator updates the values in Settings → Human resources with a dated version when regulations change, and the effect of the chosen type appears in the end of service request letter.',
      },
    ],
    mobile: [
      '📱',
      'SES mobile app',
      `<ul>
        <li><b>Punching</b> with location and face photo, and the assignment appears in it.</li>
        <li><b>Requests:</b> submit the available requests, see the leave balance when requesting leave, sign the advance (saved signature or "Sign" with uploading the signed request), and <b>cancel a request with a mandatory reason</b>.</li>
        <li><b>Approved PDF form:</b> after final approval, "View" and "Download PDF" with the same system letter and its signatures (experience certificate, leave, advance…).</li>
        <li><b>My job file</b> and <b>My qualifications &amp; documents</b>: add postgraduate studies, master's and doctorate, and upload certificates, ID and passport.</li>
        <li><b>Camera:</b> opens directly; the app stamps every photo (logo, address, coordinates, time) and <b>saves it automatically</b> to the phone gallery.</li>
        <li><b>Chat &amp; mail:</b> the same look as the system; the mail icon in contacts opens internal mail, and the chat button opens the conversation directly.</li>
        <li><b>Notifications</b> reach the phone, and the administrator opens the system apps (including correspondence monitoring and analysis tools) inside the app.</li>
      </ul>`,
    ],
    facilities: [
      '🏢',
      'Facilities',
      `<ul>
        <li>Each branch has its buildings, and each building has a plan you draw with <b>ready-made blocks</b> (room, bathroom, corridor, stairs, laboratory…) that you drag, resize from every side and rotate, and you can change the <b>door direction</b>.</li>
        <li>The branch documents appear inside the facility page for viewing.</li>
      </ul>`,
    ],
    analysis: [
      '📊',
      'Analysis tools, full guide',
      {
        intro:
          '<b>Analysis tools</b> is a standalone app in the system (Apps → "Analysis tools") with {0} strategic and management analysis tools used by specialists. Each tool has an explanation and a worksheet that you fill in, save and print as PDF.',
        stepsH: 'How it works, step by step',
        steps: [
          '<b>Choose the tool</b> from the home page (tiles like the apps page, with search). The number on a tile = the saved analyses for that tool. Below, <b>"Which tool should I use?"</b> suggests a tool for your goal, and <b>"Recent analyses"</b> opens what you saved or the team shared.',
          '<b>Read the explanation</b> at the top of the tool page: what is the tool, when to use it, and how to use it step by step.',
          '<b>Fill in the worksheet:</b> analysis subject, prepared by and date (and in some tools "Problem" or "Goal"), then the coloured boxes, <b>one point per line</b>.',
          '<b>Write the "Result &amp; conclusion"</b> at the end of the sheet: what you found, the decision, recommendations and next steps.',
          '<b>Saving is automatic on the server</b> from the first keystroke, and "✔ Saved" appears with the time. Open the analysis from any device; each tool can have several analyses (e.g. one per branch or project) listed under "Saved analyses" at the bottom of the page, and "New analysis" starts an empty sheet.',
          '<b>Share with the team:</b> turn the option on and everyone with analysis tools can see and edit the analysis (the last editor is shown). Sharing and deleting are for the owner and the administrator. An unshared analysis is visible only to you.',
          '<b>Move to the linked tool:</b> under the sheet, "Next step" has a "Go to …" button when the tool is linked to another one. The button saves your analysis and creates a new one in the next tool <b>with the same subject and linked to it</b>; the results of the previous tool appear at the top of the new sheet under "Inputs from …" for reference, with the chain path (e.g. PESTEL → SWOT → TOWS) where each name links to its analysis.',
          '<b>Download PDF:</b> "Download result PDF" prints this tool (with logo, subject, sections and result), and <b>"Full chain report PDF"</b> combines all the tools of the chain in one report: a page per tool in order, starting with the analysis stages. In the print window choose "Save as PDF".',
        ],
        chainsH: 'Suggested analysis chains',
        chains: [
          '<b>Setting strategy:</b> PESTEL → SWOT → TOWS → Balanced scorecard → SMART goals.',
          '<b>Competition and growth:</b> Porter forces → SWOT, and BCG matrix → Ansoff → Business model.',
          '<b>Problem solving and quality:</b> Fishbone → Five whys → SMART goals (the corrective action becomes a goal).',
          '<b>Projects and risks:</b> Stakeholders → Risk matrix → Eisenhower.',
          '<b>Organisation and improvement:</b> McKinsey 7S → Gap analysis → SMART, and Value chain → SWOT.',
        ],
        toolsH: 'The tools explained',
        open: 'Open tool →',
        what: 'What is it?',
        when: 'When to use it?',
        how: 'How to use:',
        fields: 'Worksheet boxes:',
        problem: 'Problem',
        sep: ', ',
        thenResult: 'then the result and conclusion.',
        next: 'Next step:',
        tipsH: 'Tips',
        tips: [
          'Define the analysis subject precisely (branch, project, service, competitor); one analysis per subject.',
          'Write short, clear points, preferably with numbers and facts rather than impressions.',
          'Involve the concerned team (turn sharing on) and agree on the result before printing.',
          'The result and conclusion is the most important part: an actionable decision or recommendation with an owner and a date.',
        ],
      },
    ],
    hse: [
      '🦺',
      'Health & Safety (HSE)',
      `<p>The "Health &amp; Safety" app on the apps page has a dashboard and four sections:</p>
      <ul>
        <li><b>Safety dashboard:</b> days without work injuries, this month's incidents and near misses, observations, open and overdue actions, valid permits, inspections needing action, lost work days, and the open actions table.</li>
        <li><b>Incident report:</b> "Report an incident" → date, time, branch and location, type (work injury, incident without injury, near miss, property damage, vehicle accident, fire, leak), severity, injured persons, description, immediate action and photos. Safety officers and the branch manager are notified immediately; the safety officer investigates and writes the root cause, corrective action, owner and due date, then closes it (and the reporter is notified of the status).</li>
        <li><b>Safety observation:</b> an unsafe act, unsafe condition or positive observation, with category and severity level; the system notifies immediately about a "high" severity observation.</li>
        <li><b>Work permit:</b> for hazardous work (hot work, confined spaces, heights, excavation, electricity, heavy lifting) with validity period, supervisor, workers, hazards and precautions; issued by the safety officer or branch manager, and becomes "Expired" automatically after its date.</li>
        <li><b>Safety inspection:</b> ready checklists (rig, vehicle, work site, fire equipment, lifting equipment, protective equipment) with "Compliant / Non-compliant / Not applicable" for each item; any "Non-compliant" makes the inspection "Needs action" and the safety officer is notified.</li>
        <li><b>Permissions:</b> all accounts (except self-service) can report and see their branch records and what they submitted; safety officers (set by the administrator in Settings → Approval routes → Operations management teams) see all branches, investigate and close; deletion is for the administrator.</li>
      </ul>`,
    ],
    chat: [
      '💬',
      'Quick communication (chat)',
      `<ul>
        <li><b>Conversations:</b> a private chat with any colleague ("New conversation" then choose the name), a group for each branch or department that includes its employees automatically, and a chat for each request with its submitter and approvers.</li>
        <li><b>Messages:</b> text, files and photos, poll, appointment, location, contact, and replying to a specific message. The read mark is shown to the sender.</li>
        <li><b>Alerts:</b> the number of new messages on the 💬 icon in the top bar, and a notification on mobile and desktop if you enable it.</li>
      </ul>
      <div class="g-tip">💡 For official matters that need a record (approval, document) use requests or internal mail; use chat for quick coordination.</div>`,
    ],
    hrrec: [
      '🪪',
      'Iqamas, contracts, GOSI and former employees',
      `<ul>
        <li><b>Iqama tracking:</b> every expired Iqama in red and those expiring within 60 days in orange, with branch filtering, Excel export, and submitting an "Iqama renewal" request from the row itself.</li>
        <li><b>Contracts:</b> each employee's contract status (fixed / open-ended), those nearing their end, and the Labor Law Article 55 warning before renewal.</li>
        <li><b>Social insurance (GOSI):</b> registered and unregistered employees, the insurable wage and contribution, and matching the employee register with the GOSI file.</li>
        <li><b>Former employees:</b> the archive of employees after end of service with its reason, date and settlement file; the file can be restored on return to work.</li>
      </ul>`,
    ],
    advot: [
      '💵',
      'Advances and overtime',
      `<ul>
        <li><b>Advances:</b> each employee's advances ledger (paid, deducted and outstanding balance) from short and long advance requests; the monthly deduction is recorded automatically with the payroll.</li>
        <li><b>My overtime:</b> the employee records overtime hours for each day in the month sheet and sends it.</li>
        <li><b>Overtime approval:</b> the direct manager approves the sheet or returns it with a note, and the approved hours enter the month's payroll.</li>
      </ul>`,
    ],
    payTotals: [
      '💰',
      'Monthly payroll amounts (for senior management)',
      `<p>A screen filled in by the payroll preparer (or the administrator) and seen by the CEO and the general manager in the senior management dashboard.</p>
      <ul>
        <li><b>Month:</b> choose it from the month field or from the recorded months at the top of the page.</li>
        <li><b>Under sponsorship:</b> a row for each of the group's sponsorships with its payroll amount for the month (sponsorship names recorded in employee files are offered for selection).</li>
        <li><b>Outside sponsorship:</b> amounts for employees on an external sponsorship or with no recorded sponsorship.</li>
        <li><b>Cards:</b> total under sponsorship, total outside sponsorship, and total payroll amounts for the month, updated as you type.</li>
        <li><b>Estimated fill:</b> a button fills both tables from the wages of active employees in the employee register by each employee's sponsorship; then you adjust the actual amounts and save.</li>
      </ul>`,
    ],
    legalAff: [
      '⚖️',
      'Legal affairs: cases and investigations',
      `<ul>
        <li><b>External cases:</b> record the case (by or against the company) with the court, case number, opponent, amount and lawyer, then its hearings, what happened in each and the next hearing date, and its status until judgment or settlement. A reminder comes before each hearing.</li>
        <li><b>Administrative investigations:</b> open an investigation with an employee with its subject and incident date, then the session minutes, then the decision (the penalty under the work regulations), which is recorded in the employee file. If the penalty is a deduction, a "Legal affairs deduction decision" is submitted from it.</li>
      </ul>`,
    ],
    reports: [
      '📈',
      'Dashboard, reports and letters register',
      `<ul>
        <li><b>Dashboard:</b> figures for the period you choose compared with the previous period: employees and Saudization, requests and approvals, amounts, branches and alerts.</li>
        <li><b>Reports:</b> ready reports with filters (branch, period, type), Excel export and printing.</li>
        <li><b>Letters register:</b> all letters issued from approved requests with their numbers and dates, with search and reprinting.</li>
      </ul>`,
    ],
    crm: [
      '🤝',
      'Customers (CRM) and marketing',
      `<ul>
        <li><b>Customers:</b> a card for each customer (company, government entity, establishment, individual) with the commercial registration, contacts and the branches dealing with it, and its status (active / prospect).</li>
        <li><b>Activities:</b> record everything done with the customer: call, visit, meeting, quotation, contract, collection, with the next follow-up date. A contract or collection turns a prospect into an active customer.</li>
        <li><b>Marketing:</b> page under construction.</li>
      </ul>`,
    ],
    training: [
      '🎓',
      'Training center and professions library',
      `<ul>
        <li><b>Training center:</b> the course (in person, online, blended) with its trainer, sessions and target employees, whether it is mandatory, then attendance for each session, results and pass mark, and trainee evaluation. Each employee sees their courses.</li>
        <li><b>Professions library:</b> an explanation of each profession with work procedures, tests and tools, with search, categories and attachments.</li>
      </ul>`,
    ],
    kpi: [
      '🎯',
      'Performance indicators',
      `<ul>
        <li>Indicators and their weights are defined, then each employee is evaluated monthly, showing the total and rating (excellent, very good ...).</li>
        <li>The employee sees the evaluation and can appeal it with a "Performance evaluation appeal" request.</li>
      </ul>`,
    ],
    company: [
      '🏢',
      'About the company and branch map',
      `<ul>
        <li><b>About the company:</b> the company profile, vision, services, certificates and social media accounts.</li>
        <li><b>Branch map:</b> all branches and sites on the map with the region, branch manager, accountant and contact method.</li>
      </ul>`,
    ],
    group: [
      '🏛️',
      'Group management and group companies',
      `<p>For group members (those with more than one company) this is the first screen after login. It has:</p>
      <ul>
        <li><b>Companies bar</b> with their logos: clicking a company enters its system with the same account; you can also switch from the companies menu in the top bar.</li>
        <li><b>Departments</b> in three sections: core (Finance, Human resources, Operations, Projects), control (Governance &amp; compliance, Branch Management, Quality &amp; performance indicators, Legal affairs) and support (IT, Training, Marketing; Strategy and Procurement are under construction).</li>
        <li><b>Each department page:</b> its figures aggregated from all companies: total cards, then a table with a row per company and the group total. Clicking the company name enters its system.</li>
        <li><b>Group settings</b> (for its manager): company names, logos and letterheads, and group members with the companies available to each member.</li>
      </ul>`,
    ],
  };
  window.SES_GUIDE = Object.assign(window.SES_GUIDE || {}, { GUIDE_EN });
})();
