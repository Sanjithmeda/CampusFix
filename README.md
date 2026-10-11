# CampusFix — Intelligent Campus Maintenance Prioritization & Resolution Management System

CampusFix is a production-grade, responsive college campus facilities maintenance and resolution management web application engineered with **React 19**, **TypeScript**, **Tailwind CSS**, and **Google Cloud Firestore & Firebase Authentication**.

---

## 🏛️ System Overview & Architecture

CampusFix coordinates campus facility issues across four distinct stakeholder roles:
1. **Student**: Report hostel, classroom, and water problems; track status; verify resolutions with 1–5 star ratings.
2. **Faculty**: Submit academic wing, departmental laboratory, and IT connectivity tickets.
3. **Maintenance Team**: View assigned work orders, accept dispatches, log repair hours and parts replaced, and broadcast maintenance activities.
4. **Main Admin**: High-level triage, automated multi-factor prioritization scoring, duplicate linking, team dispatching, user approval gatekeeping, and facilities analytics.

---

## 🔑 User Roles & Account Approval Workflow

| Role | Self-Registration Policy | Account State on Signup | Permissions |
|---|---|---|---|
| **Student** | Allowed via Registration Page | `active` | Report issues, track personal tickets, submit post-resolution feedback |
| **Faculty** | Allowed via Registration Page | `active` | Report departmental/lab issues, track personal tickets, submit feedback |
| **Maintenance Team** | Allowed via Registration Page | `pending_approval` | Restricted until Main Admin verifies employee ID in User Approvals tab |
| **Main Admin** | Restricted (Whitelisted in `/admins/{uid}`) | `active` | Full governance, prioritization, duplicate grouping, team dispatch, user approvals |

---

## ⚖️ Intelligent Prioritization Algorithm

Every submitted ticket is evaluated through a multi-factor weighting formula:

$$\text{Priority Score} = \text{Severity Weight} + \text{Affected User Impact} + \text{High-Density Zone Weight} + \text{Wait Time} + \text{Linked Duplicates}$$

- **Base Severity**:
  - `Critical`: 65 pts
  - `High`: 45 pts
  - `Medium`: 25 pts
  - `Low`: 10 pts
- **Campus Population Impact**:
  - $\ge 100$ people: +18 pts
  - $\ge 30$ people: +12 pts
  - $\ge 5$ people: +6 pts
- **High-Density Zone Criticality**: Hostels, Laboratories, Washrooms, Dining Hall: +10 pts
- **Repeated Incident Factor**: +4 pts per linked duplicate report
- **Water Contamination Safeguard**: Any report flagging suspected water contamination is automatically escalated to **CRITICAL (Score: 90+)** and triggers an urgent campus notification.

> **Statutory Water Disclaimer**: *CampusFix does not independently test or certify chemical, biological, or potable water safety. Flagged issues trigger priority alerts for human laboratory inspection.*

---

## 🗄️ Firestore Database Schema

The database follows the formal schema defined in `firebase-blueprint.json`:

- `/users/{userId}`: User profiles, institutional roll/employee IDs, department, role, account status (`active`, `pending_approval`, `suspended`, `rejected`).
- `/admins/{adminId}`: Authorized administrator whitelist.
- `/complaints/{complaintId}`: Tickets containing complaint number (`CF-2026-XXX`), severity, priority score, location, water indicators, SLA due dates, resolution notes, and linked duplicates.
- `/complaints/{complaintId}/history/{activityId}`: Immutable audit trail logging state transitions, notes, and actors.
- `/announcements/{announcementId}`: Scheduled maintenance broadcasts with affected campus areas and alternate routes.
- `/campus_areas/{areaId}`: Configurable campus zones (Hostels, Laboratories, Classrooms, Internal Roads, Washrooms, etc.).
- `/categories/{categoryId}`: Configurable maintenance disciplines (Plumbing, Electrical, Water Systems, IT, Structural Safety, etc.).
- `/maintenance_teams/{teamId}`: Operational teams (Plumbing & Sanitation, Electrical Division, Water Quality Team, IT, etc.).
- `/notifications/{notificationId}`: Persistent in-app user notifications with timestamps and read states.

---

## 🛡️ Security Rules

Firestore security rules in `firestore.rules` are hardened with zero-trust validation:
- **Default Deny**: `match /{document=**} { allow read, write: if false; }`
- **Role Verification**: Admin permissions require document validation in `/admins/{uid}` or verification against the bootstrapped administrator email.
- **Identity Invariant**: Users cannot modify their assigned `role` or `status` via client-side updates.
- **Audit Immutability**: Documents in `/complaints/{id}/history` are append-only (`allow update, delete: if false`).

---

## 📷 Direct Camera Access & Photo Evidence

CampusFix features direct hardware camera capture using WebRTC MediaDevices (`getUserMedia`):
- **Live Viewfinder**: Real-time camera stream overlay with environmental crosshair guides.
- **Sensor Switching**: Flip between rear/environment camera (optimal for inspecting campus leaks/panels) and front camera.
- **On-the-fly Image Compression**: Photos snapped via the shutter button are scaled and compressed to clean JPEG data URLs (~50–80 KB), allowing instant, storage-efficient persistence into Firestore without external bucket delays.
- **Device Gallery & File Upload Fallback**: Supports selecting existing images from mobile camera rolls or desktop files.
- **Maintenance Proof**: Maintenance technicians can also snap a photo of the completed repair when recording resolutions.
- **IFrame Permissions**: Registered `"camera"` in `requestFramePermissions` within `metadata.json`.

---

---

## 🤖 OpenAI & AI Prioritization Engine Integration

CampusFix features an intelligent multi-model AI prioritization system:
1. **OpenAI API (GPT-4o-mini / Free Compatible Endpoints)**:
   - Configurable via server environment variable `OPENAI_API_KEY` or dynamically through the in-app **AI Engine** modal.
   - Compatible with free OpenAI-compatible providers (such as OpenRouter, Groq, local LLM proxies).
   - In-app **Test AI Connection** latency check and interactive **Prioritization Simulator**.
2. **Google Gemini AI**:
   - Institutional safety reasoning via `gemini-3.8-flash`.
3. **Campus Rules Heuristic Engine**:
   - Zero-latency, 100% offline fallback calculating multi-factor weights (severity, population impact, hazard zones, water contamination safeguards).

---

## 💾 Backend Data Persistence & Offline Resiliency

To prevent data loss:
- **Sanitized Firestore Writes**: Recursive cleaning of `undefined` keys (`sanitizeForFirestore`) prevents Firestore SDK serialization errors.
- **Dual-Storage Synchronization**: All submitted complaints and work-order updates write to Firestore and synchronize with client-side cache (`localStorage`), ensuring instant responsiveness, zero-lag UI feedback, and resilience even during connectivity interruptions.
- **Subcollection History & Audit Logs**: Immutable activity trails stored in `/complaints/{id}/history` preserve every status transition and assignment.

---

## 🚀 Environment Variables

Documented in `.env.example`:
```env
# GEMINI_API_KEY: Optional runtime token for Gemini AI
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"

# OPENAI_API_KEY: Optional OpenAI API key or free compatible provider key
OPENAI_API_KEY="sk-..."

# OPENAI_BASE_URL: Base URL for OpenAI API or free compatible endpoints
OPENAI_BASE_URL="https://api.openai.com/v1"

# OPENAI_MODEL: Model identifier (defaults to gpt-4o-mini)
OPENAI_MODEL="gpt-4o-mini"

# APP_URL: Current web host URL
APP_URL="https://ais-dev-cnlmmoge3idgc3sngceef2-693823437461.asia-southeast1.run.app"
```

Firebase credentials are auto-injected in `firebase-applet-config.json`.

---

## 🧪 College Viva / Demonstration Quick Test Plan

The application includes an **Evaluation Demo Quick-Switcher** in the top navigation bar and login card to easily evaluate all 4 user perspectives:

1. **Student Perspective**:
   - Click **View as: Student** (Aarav Nair).
   - Click **Report New Complaint**.
   - Notice the live priority score calculation update dynamically.
   - Submit a ticket and view it in **My Complaints & Tracking**.
2. **Main Admin Perspective**:
   - Click **View as: Main Admin** (Dr. Suresh Venkatesh).
   - Review the Executive KPI numbers.
   - Click **Seed Demo Campus Data** to populate realistic complaints across hostels and labs.
   - Open a complaint, click **Assign Team & Priority**, assign to "Water Quality Team" with "Critical".
   - Switch to **User Approvals & Roles** tab to approve or suspend accounts.
3. **Maintenance Perspective**:
   - Click **View as: Maintenance** (Vikram Joshi).
   - Review assigned work orders in **Assigned Work Orders**.
   - Click **Accept & Start Work**, then **Record Resolution & Mark Resolved** with hours spent and replaced parts.
   - Switch to **Publish Announcements** to issue a planned outage broadcast.
4. **Student Verification**:
   - Switch back to **Student**. Notice the resolution alert.
   - Click the resolved ticket and provide a **5-star satisfaction rating** with feedback.
