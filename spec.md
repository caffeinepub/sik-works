# SIK Works

## Current State
New project. No existing code.

## Requested Changes (Diff)

### Add
- Splash screen with animated SIK Works logo (yellow & black construction theme)
- Light/Dark mode toggle
- Dashboard with two main menu cards: Workers and Owner/Builder
- Workers section: form-based daily attendance and salary management
  - Fields: Worker Name, Mobile Number, Site Location (dropdown with add-new), Date (auto current date), Morning/Afternoon attendance toggles, Daily Salary
  - Salary calculations: Daily, Weekly (auto), Advance input, Balanced (auto)
  - Payment history per worker
  - Weekly report view
  - Search, Edit, Delete worker
- Owner/Builder section:
  - Owner/Builder Name, Site Location, Week Selection, Date
  - Labor categories as tabs: Skilled Labor, Semi-Skilled Labor, Technician/Supervisor
  - Each category: Date, Morning/Afternoon attendance, Salary per day/week, Total auto-calculation
  - Salary Summary: Previous Week Balance, This Week Total, Advance/Deduction, Final Payable Amount
  - Generate Weekly Invoice, Download PDF Report, Share via WhatsApp button
- Dashboard analytics: Total Workers, Total Salary, Pending Balance
- Multi-site management
- Admin login with PIN/password (OTP not supported on platform)
- Data stored in backend canister (no Firebase; platform uses Motoko backend on ICP)

### Modify
- Nothing (new project)

### Remove
- Nothing (new project)

## Implementation Plan
1. Generate construction-themed logo image (yellow & black, helmet/tools iconography)
2. Select authorization component for admin login
3. Generate Motoko backend:
   - Worker management (CRUD)
   - Attendance records (morning/afternoon per worker per date)
   - Salary records and calculations
   - Site locations management
   - Owner/Builder records with labor categories
   - Weekly report data aggregation
4. Build frontend:
   - Splash screen with animated logo
   - Login page
   - Dashboard with Workers and Owner/Builder cards + analytics
   - Workers module: list, add/edit form, attendance, salary, search
   - Owner/Builder module: tabbed labor categories, salary summary, invoice/PDF export
   - Light/Dark mode toggle
   - Yellow & black construction theme (Tailwind OKLCH tokens)

## UX Notes
- Yellow & black color palette (construction style)
- Large bold card-based navigation on dashboard
- Attendance as toggle switches (Present/Absent)
- Salary calculations auto-update on input changes
- PDF export using browser print/jsPDF
- WhatsApp share via wa.me link with pre-filled text
- Offline note: ICP canisters have local state; true offline sync not supported, but data persists on-chain
- Firebase/Firestore/React Native/Flutter not supported -- using Motoko + React on ICP
