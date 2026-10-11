# CampusFix Security Specification & Penetration Test Matrix

## 1. Data Invariants

1. **User Identity Invariant**: A user document ID in `/users/{userId}` must strictly equal `request.auth.uid`. A user cannot alter their assigned role (`student`, `faculty`, `maintenance`, `admin`) or account status (`active`, `pending_approval`, `rejected`, `suspended`).
2. **Admin Verification Invariant**: Admin privileges require presence in `/admins/{adminId}` where `adminId == request.auth.uid`, or verification against bootstrapped admin email `sanjithmeda123@gmail.com`.
3. **Complaint Ownership & Submission Invariant**: A reporter can only submit complaints where `reporterId == request.auth.uid`. The reporter cannot self-assign a ticket or mark it closed upon creation.
4. **Maintenance Team Guard Invariant**: Maintenance staff can only transition status for tickets assigned to their team or under their operational scope, transitioning between `assigned`, `in_progress`, and `resolved`.
5. **Admin Gate Invariant**: Reopening, priority override, team assignment, user approval, category and campus area configuration can only be performed by verified Main Admins.
6. **Water Safety Safeguard**: Water issues marked as suspected contamination trigger emergency alert flags and priority escalation, and users cannot modify system audit logs.
7. **Audit Log Immutability**: Documents in `/complaints/{complaintId}/history/{activityId}` cannot be edited or deleted once written.

---

## 2. The Dirty Dozen Payloads

| # | Attack Vector | Target Path | Malicious Payload | Expected Result |
|---|---|---|---|---|
| 1 | Self-Elevation to Admin | `/users/user_123` | `{"role": "admin", "status": "active"}` | PERMISSION_DENIED |
| 2 | Spoofed Reporter Identity | `/complaints/comp_99` | `{"reporterId": "victim_uid", "title": "Leak"}` | PERMISSION_DENIED |
| 3 | Ghost Field / Shadow Injection | `/users/user_123` | `{"isSuperUser": true, "vip": 1}` | PERMISSION_DENIED |
| 4 | Direct Ticket Closure by Student | `/complaints/comp_99` | `{"status": "closed"}` by student | PERMISSION_DENIED |
| 5 | Unauthorized Team Assignment | `/complaints/comp_99` | `{"assignedTeamId": "team_x"}` by student | PERMISSION_DENIED |
| 6 | Audit Trail Tampering | `/complaints/comp_99/history/act_1` | `update` or `delete` operation | PERMISSION_DENIED |
| 7 | Global Announcement Hijack | `/announcements/ann_1` | `create` by unapproved user | PERMISSION_DENIED |
| 8 | Large Payload DoS Injection | `/complaints/comp_99` | `{"description": "A" * 50000}` | PERMISSION_DENIED |
| 9 | Direct Category Modification | `/categories/cat_1` | `delete` by maintenance staff | PERMISSION_DENIED |
| 10| Unauthenticated Data Scraping | `/users` | `getDocs` unauthenticated | PERMISSION_DENIED |
| 11| Campus Area Poisoning | `/campus_areas/area_1`| `update` without admin role | PERMISSION_DENIED |
| 12| Notification Forgery | `/notifications/notif_1`| `create` pointing to fake alert | PERMISSION_DENIED |

---

## 3. Test Runner
Verification is carried out across simulated auth contexts:
- Anonymous user -> all restricted endpoints blocked
- Student user -> can only read announcements, read/create their own tickets, read their notifications
- Maintenance user -> can read assigned tickets, update progress and resolution
- Main Admin -> full governance access across all collections
