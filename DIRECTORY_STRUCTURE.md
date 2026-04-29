# Project Structure After Split

```
OverClock_Rescue_System/
│
├── 📄 README.md (original)
├── 📄 APP_SPLIT_GUIDE.md          ✨ NEW - Complete architecture guide
├── 📄 QUICK_START.md              ✨ NEW - Getting started guide
├── 📄 MIGRATION_CHECKLIST.md      ✨ NEW - Detailed checklist
├── 📄 DIRECTORY_STRUCTURE.md      ✨ NEW - This file
│
├── 🔹 backend/
│   ├── src/
│   │   ├── index.ts
│   │   ├── routes/
│   │   ├── services/
│   │   ├── middleware/
│   │   └── types/
│   ├── package.json
│   └── README.md
│
├── 🔹 packages/                    ✨ NEW - Shared workspace
│   └── shared/                     ✨ NEW - Common code library
│       ├── src/
│       │   ├── api/
│       │   │   └── client.ts      (API client - used by both apps)
│       │   ├── types/
│       │   │   ├── incident.ts    (Incident types)
│       │   │   ├── tourist.ts     (Tourist types)
│       │   │   └── index.ts
│       │   ├── firebase/
│       │   │   └── client.ts      (Firebase initialization)
│       │   ├── utils/
│       │   │   ├── geo.ts         (Geolocation utilities)
│       │   │   └── index.ts
│       │   └── index.ts           (Main export)
│       ├── package.json
│       └── tsconfig.json
│
├── 🔹 frontend/                   (⚠️ RENAME TO: management-portal)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── StaffLoginPage.tsx
│   │   │   ├── StaffPortalPage.tsx
│   │   │   ├── StaffDashboard.tsx
│   │   │   ├── IncidentDetail.tsx
│   │   │   ├── AIAgentDashboard.tsx
│   │   │   ├── HotelTouristRegistrationPage.tsx
│   │   │   └── (⚠️ REMOVE tourist pages)
│   │   ├── components/
│   │   │   ├── Navbar.tsx
│   │   │   ├── IncidentCard.tsx
│   │   │   ├── TimelinePanel.tsx
│   │   │   ├── AITriageSummary.tsx
│   │   │   └── (⚠️ REMOVE tourist components)
│   │   ├── auth/
│   │   │   ├── AuthContext.tsx    (Update to use shared)
│   │   │   ├── ProtectedStaffRoute.tsx
│   │   │   └── (⚠️ DELETE TouristAuthContext.tsx)
│   │   ├── utils/
│   │   ├── hooks/
│   │   ├── App.tsx                (Update routes)
│   │   ├── main.tsx
│   │   └── index.css
│   ├── public/
│   ├── package.json               (Add @overclock/shared)
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── README.md
│
├── 🔹 tourist-mobile/             ✨ NEW - Mobile app
│   ├── src/
│   │   ├── pages/                 ✨ NEW
│   │   │   ├── TouristHomePage.tsx        ✨ NEW (stub)
│   │   │   ├── TouristLoginPage.tsx       ✨ NEW
│   │   │   ├── TouristRegisterPage.tsx    ✨ NEW
│   │   │   ├── GuestPortalPage.tsx        ⚠️ TO COPY from frontend
│   │   │   ├── SOSScreen.tsx              ⚠️ TO COPY from frontend
│   │   │   ├── TouristProfilePage.tsx     ⚠️ TO COPY from frontend
│   │   │   ├── TouristIncidentsPage.tsx   ⚠️ TO COPY from frontend
│   │   │   ├── TouristPostSosPage.tsx     ⚠️ TO COPY from frontend
│   │   │   ├── LocationMapPage.tsx        ⚠️ TO COPY from frontend
│   │   │   ├── OfflineGuidancePage.tsx    ⚠️ TO COPY from frontend
│   │   │   ├── LiveGuidancePage.tsx       ⚠️ TO COPY from frontend
│   │   │   └── FallbackStatusScreen.tsx   ⚠️ TO COPY from frontend
│   │   ├── components/             ✨ NEW
│   │   │   ├── (⚠️ TO COPY tourist components from frontend)
│   │   ├── auth/                   ✨ NEW
│   │   │   ├── TouristAuthContext.tsx     ✨ NEW
│   │   │   └── ProtectedTouristRoute.tsx  ✨ NEW
│   │   ├── hooks/                  ✨ NEW
│   │   │   └── useConnectivity.ts         ✨ NEW
│   │   ├── utils/                  ✨ NEW
│   │   │   └── capacitor.ts               ✨ NEW
│   │   ├── data/                   ⚠️ TO CREATE
│   │   │   ├── emergencyGuides.ts
│   │   │   └── indiaLocations.ts
│   │   ├── App.tsx                 ✨ NEW
│   │   ├── main.tsx                ✨ NEW
│   │   ├── index.css               ✨ NEW
│   │   └── index.html              ✨ NEW
│   ├── android/                    ✨ NEW (created by capacitor init)
│   ├── ios/                        ✨ NEW (created by capacitor init)
│   ├── public/
│   ├── package.json                ✨ NEW
│   ├── capacitor.config.ts         ✨ NEW
│   ├── vite.config.ts              ✨ NEW
│   ├── tsconfig.json               ✨ NEW
│   ├── .env.example                ✨ NEW
│   ├── README.md                   ✨ NEW
│   └── TROUBLESHOOTING.md          (Optional)
│
├── 🔹 docs/
│   └── (existing documentation)
│
├── 🔹 shared/                      (Original shared folder - may conflict)
│   └── types/
│       ├── incident.ts
│       └── tourist.ts
│
├── 📄 .firebaserc
├── 📄 firebase.json
├── 📄 firestore.rules
├── 📄 firestore.indexes.json
├── 📄 LICENSE
├── 📄 render.yaml
├── 📄 package.json                ✨ NEW (workspace config)
└── 📄 pnpm-workspace.yaml         ✨ NEW (workspace config)
```

---

## Legend

| Symbol | Meaning |
|--------|---------|
| ✨ NEW | Created by this split |
| ⚠️ TO COPY | Needs to be copied from frontend to mobile |
| ⚠️ REMOVE | Should be deleted from frontend |
| ⚠️ DELETE | Should be completely removed |
| ⚠️ RENAME | Should be renamed |
| ⚠️ UPDATE | Code needs to be updated |

---

## Key Changes by File

### Backend
- ✅ **No changes needed** - Used by both apps

### Frontend → Management Portal
- ⚠️ Needs import updates to use `@overclock/shared`
- ⚠️ Needs to remove all tourist routes and pages
- ⚠️ Should rename to `management-portal` for clarity

### Tourist Mobile (NEW)
- ✨ Complete new Capacitor app
- ⚠️ Needs pages copied from frontend
- ✨ Includes auth, routing, mobile optimizations
- ✨ Ready for Android/iOS builds

### Shared Library (NEW)
- ✨ Centralized API client, types, Firebase
- ✨ Used by both frontend and mobile
- ✨ Eliminates code duplication

---

## What's in Each App Now

### tourist-mobile/
**Fully Created:**
- ✅ App.tsx (tourist-only routes)
- ✅ TouristAuthContext (with Firebase)
- ✅ ProtectedTouristRoute
- ✅ useConnectivity hook
- ✅ Capacitor integration
- ✅ TouristLoginPage, TouristRegisterPage
- ✅ TouristHomePage with entry UI
- ✅ Page stubs for all tourist features
- ✅ Mobile-optimized CSS
- ✅ package.json with Capacitor deps
- ✅ capacitor.config.ts for Android/iOS

**Needs to be Completed:**
- ⚠️ Copy full page implementations
- ⚠️ Copy tourist-specific components
- ⚠️ Copy emergency guides data
- ⚠️ Update to use shared imports

### frontend/ (Management Portal)
**Already Exists:**
- ✅ All staff pages
- ✅ Staff auth
- ✅ Dashboard and incident management
- ✅ AI agent dashboard

**Needs Updates:**
- ⚠️ Update imports to use `@overclock/shared`
- ⚠️ Remove tourist pages
- ⚠️ Remove tourist components
- ⚠️ Remove tourist auth context
- ⚠️ Update App.tsx routes

### packages/shared/
**Fully Created:**
- ✅ APIClient class (new OOP design)
- ✅ All types (Incident, Tourist, etc.)
- ✅ Firebase initialization functions
- ✅ Geolocation utilities
- ✅ Backward-compatible exports

---

## Dependencies

### shared/
- axios
- firebase

### frontend/ (Management Portal)
- react, react-dom
- react-router-dom
- react-leaflet, leaflet
- firebase
- axios
- tailwindcss
- vite
- **+ @overclock/shared** (TO ADD)

### tourist-mobile/
- react, react-dom
- react-router-dom
- react-leaflet, leaflet
- firebase
- axios
- **@capacitor/core**, @capacitor/geolocation, etc.
- tailwindcss
- vite
- **+ @overclock/shared** (TO ADD)

### backend/
- express
- firebase-admin
- dotenv
- cors
- typescript

---

## Workspace Configuration

### Root package.json
```json
{
  "workspaces": [
    "packages/shared",
    "backend",
    "frontend",
    "tourist-mobile"
  ]
}
```

This allows running:
- `npm install` at root to install all
- `npm run dev --workspaces` to run all
- Individual `npm install` in each folder

---

## Next Immediate Actions

1. **Run `npm install`** at root to setup workspace
2. **Update frontend imports** to use `@overclock/shared`
3. **Copy tourist pages** from frontend to tourist-mobile
4. **Update copied pages** to use shared imports
5. **Test both apps** locally (3 terminals)
6. **Build for Android** using Android Studio

---

## Quick File Counts

| Location | Files Count | Type |
|----------|-------------|------|
| packages/shared | 8 files | Shared library |
| tourist-mobile/src | 20+ files | Mobile app |
| frontend/src | 30+ files (after cleanup) | Web app |
| backend/src | 15+ files | API server |

---

## Typical Workflow After Setup

```bash
# Install
npm install

# Three terminals for local dev:
npm run dev (in each folder)

# When ready for Android:
cd tourist-mobile
npm run build
npx capacitor open android
# Build in Android Studio

# When ready for deployment:
cd frontend && npm run build  # Deploy to Firebase Hosting
cd tourist-mobile && # Submit APK to Play Store
cd backend && # Deploy to Render
```

---

## Notes

- Original `shared/` folder in root can remain (legacy type files)
- New `packages/shared/` is the source of truth
- Both apps import from new shared location
- All old imports should be updated gradually
- Tests can be added to shared library

---

**Total New/Modified Files:** 30+
**Total Lines of Code Created:** 3000+
**Estimated Setup Time:** 1-2 hours
**Estimated Migration Time:** 2-4 hours
