# TaxDome Feature Analysis  

Below is a detailed analysis of TaxDome’s major feature modules, including what each feature does and how accounting firms use it. Features are classified as **CORE** (essential for an MVP), **IMPORTANT** (beneficial but can be simplified), **OPTIONAL**, or **ENTERPRISE** (unneeded for small firms). Citations from official sources and user feedback are provided where relevant.

## CRM (Client Accounts & Contacts)  

- **Client Accounts & Contacts:** TaxDome lets firms create **client records** (“Accounts”) and link **Contacts** (people) to them【22†L61-L64】. Accounts can represent individuals or businesses; contacts (spouses, employees) share access. Firms use this to store all client data (names, emails, addresses, statuses). In practice, an accountant creates a new account for each client, adds contacts, and updates account status (e.g. Active, Archived). *(Category: CORE)*【22†L61-L64】.  
- **Account Linking:** Related accounts (e.g. spouses or multiple businesses) can be **linked** so that tasks or documents propagate across them. This avoids duplicate data entry when clients have multiple related entities. Firms use linking to ensure, say, husband-wife client tasks appear in both accounts. *(IMPORTANT)*【22†L61-L64】.  
- **Custom Fields:** Firms define custom fields (text, date, dropdown, etc.) on accounts and contacts【24†L659-L668】. These let them capture firm-specific data (e.g. industry type, tax ID). For example, a firm might add a “Client since” date field or a dropdown for “Service type.” These fields can be merged into documents and used in filters. *(IMPORTANT)*【24†L659-L668】.  
- **Tags & Filters:** TaxDome supports global **tags** on accounts【28†L645-L652】. Firms tag accounts (e.g. “Payroll client”, “VIP”) to group and filter them. In practice, an accountant might tag clients by service type or priority to quickly filter lists or trigger automations. Tags also serve as simple segmentation. *(IMPORTANT)*【28†L645-L652】.  
- **Bulk Actions & Import/Export:** Teams can select multiple accounts and apply bulk actions (archive, send requests, add tags)【44†L736-L744】. For example, sending an invitation or organizer to many new clients at once. They can also import contacts via CSV. *(IMPORTANT)*【44†L736-L744】.  
- **Client Notes:** Each account has an internal note section. Staff add notes (meeting summaries, reminders) visible only to the team. For instance, after a call, the accountant might log “Discussed documents due” on the client’s profile. *(OPTIONAL)*.  
- **Client Portal Invite:** TaxDome lets accountants **invite clients** to the secure portal【22†L61-L64】. Clients receive an email to set up login. Firms use this on-boarding method rather than emailing attachments. *(CORE)*【22†L61-L64】.  
- **Account Roles (Staff Assignment):** Firms can define custom **roles** (e.g. “Bookkeeper”, “Manager”) and assign team members to roles on each account【131†L699-L707】. This helps distribute work. For instance, when a pipeline tasks a “Bookkeeper” for a client, any staff with that role on the account will get it. *(ENTERPRISE)*.  
- **Access Rights & Permissions:** TaxDome has system roles (Owner/Admin/Employee) and fine-grained rights【130†L1-L4】【134†L678-L687】. For solo/small firms, this is mostly simplified: typically one user is Owner with full rights, others as needed. *(ENTERPRISE)*.  

## Client Portal  

- **Branded Portal:** Each firm has a white-labeled portal (custom URL, logo, colours) for clients【15†L407-L416】. Clients log in to upload/download files, sign forms, complete tasks, and view invoices. Firms configure this to match their branding. *(CORE)*【15†L407-L416】.  
- **Secure Document Exchange:** Clients upload documents to their account’s portal without needing email. Staff get notified. This replaces email attachments: one reviewer noted that TaxDome “helps save time with organizing sending and receiving documents”【146†L1-L4】. *(CORE)*【146†L1-L4】.  
- **Client Tasks & Organizers:** The portal presents clients with **to-do tasks** and questionnaires (organizers). For example, a bookkeeper can send a “Year-End Organizer” to a client; the client completes it online and uploads any requested files. This guides client onboarding and data collection. *(IMPORTANT)*.  
- **E-Signatures:** Clients can sign documents via the portal. Firms send any PDF for e-signature; clients sign in-app. Completed signatures are saved automatically. This eliminates printing/scanning; as one user praised, “clients tell me that they love using [the portal] and it’s easy to use”【145†L142-L150】. *(IMPORTANT)*.  
- **Invoice Payment:** Clients see outstanding invoices in the portal and can pay online (via Stripe or CPACharge)【110†L710-L719】. Automated reminders can nudge clients to pay. For solo bookkeepers, having an integrated payment link addresses the common pain of chasing invoices. *(CORE)*【146†L1-L4】.  
- **Announcements & Help:** Firms can post announcements on the portal home (e.g. tax season reminders). Clients also have a “Help” or “FAQ” section. For MVP, this might be minimal. *(OPTIONAL)*.  

## Document Management System  

- **Folder Structure & Templates:** TaxDome provides each account with a structured **Docs** area【83†L656-L664】. Firms set up a default folder template (e.g. “Client Uploads”, “Tax Returns”) that is auto-created for new clients. This ensures consistency (clients always know where to upload files). *(CORE)*【83†L656-L664】.  
- **File Upload & Storage:** Both staff and clients can upload files to folders. The system stores unlimited documents. Once uploaded, staff receive notifications (Inbox+) that prompt review. For small firms, this centralizes all client files in one place. *(CORE)*.  
- **File Preview & Annotations:** TaxDome can preview PDFs, images, Word/Excel in-browser. Staff can annotate or request changes on a file. For instance, an accountant might review a client’s bank statement in the viewer and comment that a needed page is missing. *(IMPORTANT)*.  
- **Document Sharing:** Staff can generate secure links to share files with clients or third parties (no login needed). This is useful for quick sharing of large files. *(OPTIONAL)*.  
- **Document Linking & Locking:** Documents can be linked to jobs or invoices. When an invoice is finalized, linked docs can be “sealed” to prevent edits. This prevents errors (e.g. editing a tax return after it’s sent). *(IMPORTANT)*.  
- **Audit Trail:** TaxDome logs all document events (upload, edit, download). The Activity Feed shows who did what. This gives firms confidence they can track document history. *(IMPORTANT)*【139†L683-L692】.  
- **Document Request Features:** TaxDome offers various ways to request files: a shareable **file request link** to upload into a folder, **client request forms** (checklists with upload fields), or email/chat requests【87†L719-L727】. For example, a bookkeeper can send a link for clients to upload tax forms without logging in. These features directly address the pain of chasing documents via email. *(IMPORTANT)*【87†L719-L727】.  

## Workflow & Task Management  

- **Pipelines & Stages:** TaxDome lets firms define **Pipelines** (visual workflows) with customizable **stages** (e.g. “Awaiting Docs → Preparing → Review → Complete”). Moving a client’s job through stages reflects its progress. Firms use this to standardize processes. For MVP, a simplified pipeline (e.g. “Onboard → Work in Progress → Done”) helps track status. *(IMPORTANT)*.  
- **Jobs:** A **Job** is a task bundle for one client, moving through the pipeline. It contains linked tasks and documents. For example, an “Annual Bookkeeping” job for a client would include uploading last year’s data, reconciling accounts, preparing statements, etc. *(OPTIONAL)*.  
- **Tasks:** **Tasks** are actionable items (with assignees, due dates, and status) that can be stand-alone or part of a job. Small firms use tasks as reminders: e.g. “Email client for missing receipts by Friday.” Each task can have notes and checklists. *(CORE)*.  
- **Task Views & Calendar:** Staff can see tasks in list form or calendar view. The calendar helps manage deadlines across clients. A user noted that reminders “save hours each week and keep client tasks organized”【143†L972-L980】. *(IMPORTANT)*【143†L974-L982】.  
- **Checklists & Templates:** Firms can create task templates (e.g. “Client Onboarding Steps”) to reuse. Each template lists tasks needed for a process. For MVP, static checklists may suffice instead of full automation. *(OPTIONAL)*.  
- **Automated Reminders:** TaxDome can auto-email/SMS clients or staff about due tasks or deadlines. For example, if a client hasn’t uploaded a needed document by a set date, a reminder can be sent. A reviewer highlighted that “auto-reminds clients to complete outstanding tasks is worth [the price] alone”【145†L175-L180】. *(IMPORTANT)*.  
- **Basic Workflow Rules:** Instead of a full automation engine, the MVP could allow simple rules (e.g. “When invoice is X days overdue, send reminder email”). More complex triggers (e.g. conditional branch in a pipeline) are **optional**. *(OPTIONAL)*.  

## Billing & Payments  

- **Invoicing:** The system supports one-time invoices. Staff can create an invoice for a client including services or time entries, and email it through TaxDome. Clients pay via the portal. For solo bookkeepers, this replaces external invoicing/email. *(CORE)*.  
- **Recurring Invoices (Optional):** TaxDome allows scheduled recurring invoices【96†L658-L667】, but for an MVP targeting solo practitioners, this can be simplified or omitted. Many small bookkeepers bill irregularly, so manual invoicing may suffice. *(OPTIONAL)*【96†L658-L667】.  
- **Time Tracking:** Staff can log hours worked on clients, then convert unbilled hours into invoices【97†L702-L711】. Time tracking is a common small-firm pain; at minimum, a simple timer or manual entry is useful for time-based billing. *(IMPORTANT)*【97†L702-L711】.  
- **Payment Processing:** Integrate a payment gateway (e.g. Stripe) so clients can pay invoices with card/ACH online【110†L710-L719】. This speeds up collections and avoids manual payment logging. One review notes “I have not yet used the payment portal, but I do like that feature”【146†L1-L4】. *(IMPORTANT)*【146†L1-L4】.  
- **Credit Notes & Taxes:** Handling tax rates or issuing credits is often needed. Basic support (e.g. one tax rate field, simple credit memo) is **optional** for MVP. *(OPTIONAL)*.  
- **Payment Reminders:** Automated reminders for unpaid invoices can be included (this overlaps with workflow reminders). *This addresses the pain of chasing payments*. *(CORE)*.  
- **Simple Reports:** A dashboard showing outstanding invoices and cash collected helps track receivables. *(OPTIONAL)*.  

## Communication  

- **Client Messaging (Chat):** TaxDome’s built-in **chat** allows secure messaging with clients【100†L659-L668】. Each client account has a chat thread. Staff and clients can exchange text and files there. This replaces email for sensitive info. Users report that centralized chat and messaging is a major benefit (“TaxDome centralizes everything… It has eliminated the need for multiple systems”【143†L974-L982】). *(CORE)*【143†L974-L982】.  
- **Email Integration:** While TaxDome can sync email, small firms often continue using Gmail/Outlook externally. Full email syncing can be omitted in MVP; instead allow recording email addresses and sending basic email replies/templates. *(OPTIONAL)*.  
- **SMS Messaging:** Optional Twilio integration for text reminders. Could boost response rates (some firms like texting clients overdue reminders【145†L175-L180】). But for core MVP, email is primary. *(OPTIONAL)*.  
- **Notifications:** The system generates notifications for new messages, uploads, tasks, etc. MVP should include email or app notifications for critical events (new message, new invoice). Inbox+ style in-app alerts can be replaced by simple badges or alert emails. *(IMPORTANT)*.  
- **Unified Inbox (Optional):** TaxDome’s “Inbox+” consolidates alerts. A lightweight MVP might skip this complexity, relying on standard notifications. *(OPTIONAL)*.  

## Client Requests & Organizers  

- **Client Request Forms:** Firms can send short questionnaires (organizers) for clients to fill out (including file attachments). For example, a “New Client Form” could collect IDs and initial data. These are very useful but complex to build. A MVP could allow uploading a standard questionnaire PDF rather than dynamic forms. *(OPTIONAL)*.  
- **Document Checklist:** Some firms use checklists to track required docs. TaxDome even has a “Document Checklist” feature powered by AI. For MVP, a simple checklist email or shared folder might suffice. *(OPTIONAL)*.  

## E-Signature  

- **Digital Signature Requests:** As noted, TaxDome includes built-in signing. For MVP, include simple e-signing (e.g. Adobe Sign or Stripe Sign integration) so clients can sign engagement letters or invoices online. One major pain point is getting signed documents back; e-sign addresses this. *(CORE)*.  

## Time Tracking  

- **Timers and Time Sheets:** As mentioned, include basic time logging. For solo bookkeepers who bill by hour, a “start/stop” timer plus manual entry option is valuable. The system should let users easily invoice time. *(IMPORTANT)*【97†L702-L711】.  
- **No Overhead:** Advanced features like rounding rules, multiple rate levels, or deep analysis are **optional**. Keep it simple. *(OPTIONAL)*.  

## Reporting & Analytics  

- **Basic Financial Reports:** TaxDome offers analytics (cash flow, pipeline). For MVP, provide minimal reports: total invoices, outstanding AR, top clients. This helps small firms track business health. *(OPTIONAL)*.  
- **Workflow Metrics:** Not needed initially. *(ENTERPRISE)*.  
- **Benchmarks/Forecasting:** Skip (enterprise feature).  

## Integrations  

- **Accounting Software:** QuickBooks Online integration is supported by TaxDome. For MVP, one could offer export to QBO or basic sync of invoices/payments【104†L669-L677】. However, many solos manually export CSV, so this can be deferred. *(OPTIONAL)*.  
- **Calendar/Scheduler:** Embedding an external scheduler (Calendly) is convenient but optional. *(OPTIONAL)*.  
- **Zapier/Webhooks:** Likely too advanced for MVP. *(OPTIONAL)*.  
- **Payment Gateway:** Stripe or similar (as above) is a must for accepting payments. *(CORE)*【110†L710-L719】.  

## Security & Permissions  

- **Encryption & 2FA:** TaxDome emphasizes security (TLS, data encryption【127†L523-L531】). MVP should use TLS (HTTPS) and optional password protections. Two-factor auth can be optional for small firm. *(IMPORTANT)*.  
- **User Roles:** For a solo/small firm, user roles can be simple: one admin (firm owner) and perhaps one or two staff. Complex role management can be omitted. *(OPTIONAL)*.  

## Pain Points for Solo Bookkeepers  

Based on TaxDome documentation and user reviews【146†L1-L4】【143†L894-L903】, the top pain points are:  

1. **Chasing Clients for Documents:** Many bookkeepers spend hours emailing clients for missing files. (*Solution: client portal with upload requests and reminders*).  
2. **Disorganized Files:** Keeping track of versions and where files are stored (email inbox, local, etc.) is chaotic. (*Solution: central document storage with folders*).  
3. **Task and Workflow Tracking:** Without a system, to-dos fall through the cracks. (*Solution: simple task lists and reminders; one user noted “workflows and reminders save hours each week”【143†L974-L982】*).  
4. **Client Communication Overload:** Managing emails with clients (and CCs) is tedious. (*Solution: integrated messaging/chat within platform*).  
5. **Onboarding New Clients:** Collecting initial data and documents is manual and error-prone. (*Solution: client forms/organizers and checklists*).  
6. **Invoice & Payment Collection:** Late payments and manual invoicing slow cash flow. (*Solution: online invoicing with payment links and auto-reminders*).  
7. **Document Signing:** Getting signed forms back (engagement letters, etc.) is cumbersome. (*Solution: built-in e-signing*).  
8. **Email Workflow Chaos:** Using separate email leads to lost info. (*Solution: at minimum, log communications in one place or provide chat*).  
9. **Time Tracking:** Billable hours are hard to track across clients. (*Solution: simple timer and time entry billing*).  
10. **Data Duplication:** Multiple tools (Dropbox, Slack, QuickBooks) cause inefficiency. (*Solution: an all-in-one platform*).  

These pain points align with user feedback: e.g. one reviewer praised TaxDome for centralizing all work (“eliminated the need for multiple systems”【143†L974-L982】) and another for saving time on document collection【146†L1-L4】.

# Lean MVP Design  

To address the above pain points in a lightweight way, we propose an MVP with roughly 25% of TaxDome’s full features. It focuses on core problems, omitting enterprise-level complexity.

## MVP Feature Set  

- **Light CRM:** Create/manage client profiles and contacts (name, emails, basic info). Tag or label clients (simple) to group them. Allow staff to log notes. *(Solves: organizing client data)*.  
- **Client Document Portal:** A secure portal where each client logs in to upload/download files. Basic branding (firm logo). Staff can drag/drop client files. *(Solves: centralized document exchange)*.  
- **File Upload & Request:** Staff can request files by email from clients with a secure upload link (no login needed). Clients click and upload to their portal folder. *(Solves: chasing documents)*.  
- **Document Storage:** Cloud file storage per client, with simple folder view. All files are stored securely in the platform. Version control can be rudimentary (overwrite updates). *(Solves: file organization)*.  
- **Client Communication:** Built-in messaging (chat) per client. Staff can send clients secure messages and attach files via the portal. Clients can reply. Optionally, notify clients by email about new messages. *(Solves: email chaos, communication log)*.  
- **Task Tracking:** A simple to-do list per client. Staff can create tasks (with due dates) and mark them complete. Staff get reminders via email for upcoming/overdue tasks. *(Solves: task tracking, follow-ups)*.  
- **Workflow Stages:** Instead of complex pipelines, offer 2–3 status stages (e.g. “In Progress”, “Awaiting Client”, “Done”) that can be set on each client/project. Tasks and reminders are associated with these. *(Solves: basic workflow visibility)*.  
- **Basic Invoicing:** Create and send simple invoices (line items for services) to clients. Clients see invoices in portal and can pay online. The system tracks paid/unpaid status. *(Solves: billing and collections)*.  
- **Online Payments:** Integrate Stripe (or similar) so clients can pay invoices with card/ACH. This generates payment records linked to the invoice. *(Solves: chasing payments)*.  
- **Auto-Reminders:** Automate email reminders for overdue tasks or invoices. For example, send a reminder if a file is requested and not received in 7 days, or if an invoice is unpaid after 10 days. *(Solves: follow-up burden)*.  
- **E-Signature:** Offer basic e-signing for documents (e.g. engagement letter). For MVP, we can integrate a simple e-sign API or even use Stripe’s built-in signing. *(Solves: signing hassles)*.  
- **Time Logging (Optional):** A simple timer or manual entry form for recording hours per client. Generate line items from recorded time when invoicing. *(Solves: time billing)*.  
- **User Accounts:** Firm owner and optional team members. Owner can invite others and set view/edit permissions per client. *(For security)*.  

All these components are simplified compared to TaxDome’s full suite. Notably **excluded** are: complex automation engines, full email integration, marketing campaigns, advanced reporting, multi-currency, multi-office roles, etc. The focus is on everyday tasks of a solo bookkeeper: managing clients, files, tasks, billing, and communication in one place.

## MVP System Architecture  

### Data Model (Core Entities)  

- **User:** (Staff member) with fields: name, email, password hash, role (owner/staff).  
- **ClientAccount:** (CRM record) with fields: name, type (Individual/Company), status, custom tags, contact details, portal credentials, assigned staff.  
- **ClientContact:** Linked to ClientAccount; holds contact info (name, email, phone).  
- **Folder:** Represents a top-level folder within a client’s docs (e.g. “Tax Documents”). Has permission flags (client can upload?).  
- **Document:** File metadata (filename, type, uploaded_by, upload_date, link to stored file). Each Document belongs to one Folder.  
- **Message (Chat):** Text messages exchanged with a client. Fields: sender (user/client), recipient, timestamp, content, attachments link.  
- **Task:** To-do item with fields: title, description, due_date, assigned_to (user), client, status (open/closed).  
- **Invoice:** Fields: invoice_number, client, issue_date, due_date, line_items (description, amount), status (paid/unpaid), payment_link_id.  
- **Payment:** For recording a payment. Fields: invoice, amount, payment_date, payment_method, transaction_id.  
- **Session/Notification:** For user login sessions and alerts (e.g. new message alert).  

*(Additional tables for settings, e-sign records, etc.)*

### Core APIs / Backend Logic  

- **Authentication:** Signup/Login, password reset, 2FA (if enabled).  
- **Client Management:** CRUD APIs for clients and contacts. Assign team members to clients.  
- **Document Storage:** File upload/download endpoints. Links generate secure URLs.  
- **Messaging:** Send/get messages API for chats. Possibly real-time (websockets) or periodic refresh.  
- **Task Management:** CRUD APIs for tasks, with filtering by client or due date.  
- **Status Updates:** Endpoint to change a client’s workflow stage/status.  
- **Invoice API:** Create/send invoices, list invoices for a client, mark as paid.  
- **Payments:** Webhook endpoint for payment gateway notifications to record payments. Payment initiation endpoint (generates Stripe Checkout link).  
- **Reminders:** Scheduled jobs or triggers to send emails for overdue tasks/invoices.  
- **Portal APIs:** Secure endpoints for client actions (upload file, view tasks, view invoices, send message).  
- **E-Sign Integration:** Endpoints to generate/sign documents (could use third-party API or hosted signing page).  

### Frontend Pages / UI  

- **Login/Signup:** For staff and clients (separate portals).  
- **Dashboard:** Summary of tasks, invoices, and messages. Owner’s view and client’s view differ.  
- **Clients List:** Table of all clients (searchable). Clicking a client opens their profile.  
- **Client Profile:** Tabs/sections for: **Info** (contacts, status), **Documents** (folder tree, upload button), **Messages** (chat interface), **Tasks** (to-do list with add/edit), **Invoices**.  
- **Documents Page:** List of files in each folder; preview image/PDF; upload button; request file button.  
- **Chat Interface:** Message thread with text input; show attachments inline.  
- **Tasks Page:** List of tasks (with checkboxes to complete); form to add new task. Calendar view optional.  
- **Invoice Page:** List existing invoices, button to create new; invoice creation form (line items). Show payment status, link to pay.  
- **Client Portal (Limited):** After login, client sees **Documents**, **Tasks**, **Invoices**, **Messages** relevant to them. They can upload files, mark tasks done, view and pay invoices, and send messages to firm.  
- **Settings:** Firm settings for branding (logo upload), default email templates, payment gateway keys.  

### User Roles and Permissions  

- **Owner/Administrator:** Full access to all clients, settings, and billing.  
- **Staff Member:** Access only to assigned clients (or all if given). Can upload files, send messages, create tasks/invoices for those clients.  
- **Client:** Portal account; can only see their own data (upload to their docs, view tasks/invoices assigned to them, chat with staff).  

## MVP Feature Specification  

Below is a concise specification of MVP features, intended UI screens, and backend logic:

1. **Client CRM Screen:** List clients with search. Click to edit contact info, tags, or view details. *(Complexity: Medium)*  
2. **Client Profile Page:** Shows client details and has tabs for **Documents**, **Tasks**, **Invoices**, **Chat**. *(Complexity: Medium)*  
   - *Documents Tab:* Shows folder structure. Staff can create new folders, upload files. Clients see “Client Uploads” folder to add files. Clicking a file previews it. Staff can move files between folders and delete. *(Core)*  
   - *Tasks Tab:* Staff can add tasks (title, due date, notes) for this client. Tasks are listed with status. Client sees tasks assigned to them and can mark them done. Due tasks show warning. *(Core)*  
   - *Invoices Tab:* Staff generates invoice with items. List shows status and amount. Client sees invoice in portal with “Pay” button. *(Core)*  
   - *Chat Tab:* Real-time message thread. Staff and client can send text and files. Includes timestamp and sender. *(Core)*  

3. **Document Request:** From a client profile, staff clicks “Request Document”. Generates an email to client with a secure upload link for a selected folder. Backend generates a one-time upload token. *(Important)*  

4. **Reminders:** System sends automated email reminders (configurable) for: (a) Unpaid invoices past due date, (b) Tasks nearing due date, (c) File requests not completed within X days. SMTP service (e.g. SendGrid) handles emails. *(Important)*  

5. **Invoicing Screen:** UI to create/edit invoices with line items (description, amount). Field for tax if needed. “Send” button emails invoice PDF to client. Invoices stored and track payment. *(Core)*  

6. **Payment Integration:** Stripe checkout for invoices. On “Pay” click, redirect client to Stripe. On success webhook, mark invoice paid and record payment. *(Core)*  

7. **E-Sign Document:** UI to upload a PDF (e.g. engagement letter) and send for signature. Could use a third-party signing widget or simple email link to a signing page. Track signing status. *(Important)*  

8. **Time Logging (Optional):** Timer widget on each client profile to start/stop time entry. Time entries listed (date, hours). Option to add entries manually. When invoicing, allow adding time entries as line items. *(Optional)*  

9. **Dashboard:** Simple home page with summary: number of open tasks, total due invoices, recent activity. For owner. *(Optional)*  

10. **Notifications:** Top bar shows unread messages or alerts (e.g. “3 documents uploaded today”). Clicking goes to relevant page. Email notifications for key events (new upload, new message). *(Important)*  

11. **Admin Settings:** Single page for firm settings: company info, portal logo, payment key, email templates (for invoice, reminder). *(Important)*  

## Development Effort Estimate  

- **Team:** 2 frontend developers, 2 backend developers, 1 QA, 1 UI/UX designer.  
- **Timeline:**  
  - *Planning & Design:* 4 weeks (requirements, UI mockups)  
  - *Backend Development:* 8–12 weeks (APIs for clients, docs, tasks, invoices, payments, auth)  
  - *Frontend Development:* 8–12 weeks (React/Vue or similar for portal UI, staff dashboard)  
  - *Integration & Testing:* 4 weeks (Stripe, email service, security audit)  
  - *Beta & Iteration:* 4 weeks (user feedback, bug fixes)  

Overall, ~6–8 months for a fully functional MVP with the above features. Some tasks (e-sign, scheduler integration) could be parallel or phased.  

## MVP Market Viability & MRR Projections  

- **$5k MRR (~250 users at $20/mo):** Achievable if product provides clear relief on daily pains. The solo bookkeeper market is large; capturing 250 users is plausible within ~1 year if well marketed. Features align with common needs (docs, tasks, invoicing).  
- **$20k MRR (~1000 users):** More challenging but possible with strong sales and referrals. Requires differentiation and possibly some marketing/incentives. Adding a referral program and integrations (e.g. QuickBooks sync) could accelerate growth.  
- **$50k MRR (~2500 users):** Difficult for niche practice management in early stage. Likely need product-market fit proof, possibly after adding second-tier features.  

These are rough estimates; success depends on execution and competition. The MVP targets a $15–$25/month price, which is comparable to similar tools. The major value proposition (all-in-one platform solving doc chase and task chaos) is validated by user praise【143†L894-L903】【145†L166-L175】. By focusing on  core pain points, the MVP has a credible path to early revenue.  

Overall, this lean system balances functionality with simplicity, aiming to provide small accounting firms with an affordable, integrated solution to their most pressing workflow challenges. 

