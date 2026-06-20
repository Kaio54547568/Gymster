# Gymster standalone demo database

This directory is a complete, destructive demo installer. It does not read or
depend on `database/seed.sql`.

## Demo accounts

| Role | Email | Password |
|---|---|---|
| Owner | `owner.demo@gymster.local` | `Owner@123` |
| Admin | `admin.demo@gymster.local` | `Admin@123` |
| Staff | `staff01.demo@gymster.local` | `Staff@123` |
| Staff | `staff02.demo@gymster.local` | `Staff@123` |
| Trainer | `trainer01.demo@gymster.local` | `Trainer@123` |
| Trainer | `trainer02.demo@gymster.local` | `Trainer@123` |
| Member | `member01.demo@gymster.local` ... `member06.demo@gymster.local` | `Member@123` |

## Before running

1. Use a Supabase project dedicated to Gymster demo/development.
2. Back up anything you need. The reset removes all `public` objects and every
   Supabase Auth user.
3. Set these values in `backend/.env`:

   ```env
   SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
   ```

4. Stop the frontend and backend while resetting.

## Exact run order

### 1. Reset Supabase Auth and Gymster storage objects

From the repository root:

```powershell
cd backend
npm run reset:demo-auth -- --confirm RESET_GYMSTER_DEMO
cd ..
```

The command empties `payment-proofs` and `pics`, then deletes all Auth users.
It deliberately refuses to run without the exact confirmation text.

### 2. Rebuild the public database

Open **Supabase Dashboard -> SQL Editor**. Create a new query for each file and
run them in this exact order:

1. `database/demo/00_reset_public.sql`
2. `database/demo/01_complete_schema.sql`
3. `database/demo/02_demo_seed.sql`

Wait for each query to finish successfully before running the next one. Do not
run the legacy `database/seed.sql` or the old upgrade files afterward; their
contents are already represented in this standalone demo schema.

### 3. Create login identities

```powershell
cd backend
npm run sync:auth-users
cd ..
```

Expected summary:

- `created: 12` on the first clean run.
- `secured: 12`, confirming plaintext seed passwords were replaced with bcrypt
  hashes in `public.users`.

### 4. Verify

Run `database/demo/03_verify_demo.sql` in Supabase SQL Editor.

Every returned `status` must be `ok`. In particular:

- `auth_links_complete = 12`
- `auth_users_matched = 12`
- duplicate and orphan counts are `0`
- one member has `pending_activation`
- one reserved PT slot has no real assignment yet
- `payment-proofs` and `pics` buckets exist

### 5. Start the app

Terminal 1:

```powershell
cd backend
npm run dev
```

Terminal 2:

```powershell
cd frontend
npm run dev
```

Open `http://localhost:5173` and sign in using one of the demo accounts above.

## Rebuilding again

To start over, repeat all four phases. The SQL files are not incremental
migrations; they are a clean demo installer and should always begin with
`00_reset_public.sql`.
