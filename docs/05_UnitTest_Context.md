# 05 - Unit Test Context

## Test framework hien co

Du an dang dung built-in Node.js test runner:

```js
import test from "node:test";
import assert from "node:assert/strict";
```

Test files hien co nam trong:

- `frontend/src/services/packageEntitlement.test.js`
- `frontend/src/services/workoutPlanModel.test.js`
- `frontend/src/services/workoutScheduleGenerator.test.js`
- `frontend/src/services/workoutSessionConflict.test.js`
- `frontend/src/services/sessionModel.test.js`

## Cach chay test

Hien `frontend/package.json` chua co script `test`. Co the chay truc tiep:

```bash
node --test frontend/src/services/*.test.js
```

Goi y them script vao `frontend/package.json` neu can:

```json
{
  "scripts": {
    "test": "node --test src/services/*.test.js"
  }
}
```

Sau do chay:

```bash
npm --prefix frontend test
```

## Test da co

### `packageEntitlement.test.js`

Muc tieu: kiem tra rule so ngay nghi hop le theo thoi luong goi.

- Goi 1 thang -> 2 ngay nghi.
- Goi 12 thang -> 24 ngay nghi.
- Thieu duration -> fallback 1 thang -> 2 ngay nghi.

Ham duoc test:

- `getAllowedLeaveDaysForPackage`

### `workoutPlanModel.test.js`

Muc tieu: kiem tra normalize workout plan draft thanh payload database.

- Draft co member, name, goal, notes, exercises -> `plan` va `exercises` dung schema snake_case.
- Draft reusable khong co member -> `member_id = null`.

Ham duoc test:

- `normalizeWorkoutPlanDraft`

### `workoutScheduleGenerator.test.js`

Muc tieu: kiem tra sinh buoi tap theo lich co dinh trong khoang ngay cua goi.

- Sinh dung Monday/Wednesday trong khoang 2026-06-01 den 2026-06-07.
- Khong sinh session ngoai khoang khong khop weekday.
- Lap lai lich trong goi 30 ngay.

Ham duoc test:

- `generateSessionsForPackageRange`

### `workoutSessionConflict.test.js`

Muc tieu: phat hien buoi tap thu cong trung gio voi buoi PT.

- Candidate 07:30-08:30 trung session PT 07:00-08:00 -> tra conflict trainer.

Ham duoc test:

- `findConflictingPtSession`

## Test case de xuat them

### Auth service

| ID | Ham/flow | Input | Expected |
| --- | --- | --- | --- |
| UT-AUTH-01 | `isPasswordMatch` | plain password dung | `true` |
| UT-AUTH-02 | `isPasswordMatch` | legacy prefix + password dung | `true` |
| UT-AUTH-03 | `getRoleHome` | `owner`, `trainer`, `member` | `/admin`, `/pt`, `/member` |
| UT-AUTH-04 | session expiry | expired meta trong localStorage | clear session va return null |

### Package/member

| ID | Ham/flow | Input | Expected |
| --- | --- | --- | --- |
| UT-PKG-01 | `getAllowedLeaveDaysForPackage` | duration 3 | 6 |
| UT-PKG-02 | membership state | goi active con han | hasUsablePackage true |
| UT-PKG-03 | membership lock | goi expired | route/member content bi khoa |
| UT-PKG-04 | `createPackageChangeRequest` local fallback | supabase null | luu local request pending |

### Schedule/session

| ID | Ham/flow | Input | Expected |
| --- | --- | --- | --- |
| UT-SCH-01 | `parseFixedSchedule` | `"Monday / Wednesday, 07:00 - 08:00"` | day indexes + start/end time |
| UT-SCH-02 | `generateUpcomingSessions` | lich co dinh, count 4 | tra 4 session tu ngay hien tai |
| UT-SCH-03 | `findConflictingPtSession` | session cancelled | khong conflict |
| UT-SCH-04 | reschedule accept | request co source session | workout session duoc update |

### Workout plan

| ID | Ham/flow | Input | Expected |
| --- | --- | --- | --- |
| UT-WP-01 | `validateWorkoutPlanDraft` | thieu ten plan | error |
| UT-WP-02 | `validateWorkoutPlanDraft` | exercise thieu ten | error |
| UT-WP-03 | `normalizeWorkoutPlanDraft` | reps number | reps thanh string |
| UT-WP-04 | `normalizeWorkoutPlanDraft` | restTime rong | rest_seconds fallback |

### Staff

| ID | Ham/flow | Input | Expected |
| --- | --- | --- | --- |
| UT-ST-01 | split full name | `"Nguyen Van A"` | firstName `Nguyen`, lastName `Van A` |
| UT-ST-02 | toDisplayStatus | inactive | Disabled |
| UT-ST-03 | check-in same day | existing usage | already_checked |
| UT-ST-04 | equipment status map | `under_maintenance` | Under Maintenance |

### Admin analytics

| ID | Ham/flow | Input | Expected |
| --- | --- | --- | --- |
| UT-AD-01 | group revenue by month | payments paid | tong theo thang |
| UT-AD-02 | membership age group | DOB data | bucket dung |
| UT-AD-03 | feedback type | rating 1/5 | negative |
| UT-AD-04 | payment method map | `bank_transfer` | `Bank Transfer` |

## Unit test report template

| Test ID | Module | Function/Scenario | Test data | Expected result | Actual result | Status |
| --- | --- | --- | --- | --- | --- | --- |
| UT-001 | Package entitlement | So ngay nghi theo goi 1 thang | `{ packageDurationMonths: 1 }` | 2 | 2 | Pass |
| UT-002 | Workout plan | Normalize draft | Draft Upper Body | Payload DB dung | Payload DB dung | Pass |
| UT-003 | Schedule generator | Sinh lich Monday/Wednesday | 2026-06-01 -> 2026-06-07 | 2 sessions | 2 sessions | Pass |
| UT-004 | Session conflict | Trien khai overlap PT | 07:30-08:30 vs 07:00-08:00 | Conflict trainer-1 | Conflict trainer-1 | Pass |

## Ghi chu chat luong test

- Unit test hien tai tap trung vao logic pure service, day la huong tot vi de chay khong can browser/Supabase.
- Cac service phu thuoc Supabase nen tach mapper/validator thanh ham pure neu muon test them.
- Integration test voi Supabase can database test rieng hoac mock Supabase client.
- UI route guard can test bang React Testing Library neu bo sung test framework frontend.
