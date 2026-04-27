# Skill: db-sync — VPS → Local MySQL Migration

## Purpose

Dump the production NerveCenter MySQL database from the Castles of Light VPS
(`31.97.99.86`) and import it into the developer's local MySQL instance.
Useful after any production schema migration or data change that needs to be
reflected in the local development environment.

---

## Files

| File | Description |
|---|---|
| `sync-vps-db.sh` | Main migration script (schema-only, data-only, or full) |
| `SKILL.md` | This documentation |

---

## Prerequisites (local machine)

Install the following tools before running the script:

```bash
# macOS
brew install sshpass mysql-client

# Ubuntu / Debian
sudo apt install sshpass mysql-client
```

---

## Usage

```bash
# Make executable (first time only)
chmod +x sync-vps-db.sh

# Full sync — schema + data  [DEFAULT]
./sync-vps-db.sh

# Schema only (DDL, no rows) — useful for fresh local setup
./sync-vps-db.sh --schema-only

# Data only (rows, tables must already exist locally)
./sync-vps-db.sh --data-only
```

---

## Configuration

All credentials are embedded near the top of `sync-vps-db.sh`.
Edit these variables if anything changes:

| Variable | Default | Notes |
|---|---|---|
| `VPS_HOST` | `31.97.99.86` | Hostinger VPS IP |
| `VPS_USER` | `root` | SSH user |
| `VPS_PASS` | `N8NR0ck&12345` | SSH password |
| `VPS_DB_NAME` | `nervecenter` | MySQL database name |
| `VPS_DB_USER` | `nervecenter` | MySQL user on VPS |
| `VPS_DB_PASS` | `castles-nc-db-2026` | MySQL password on VPS |
| `LOCAL_DB_USER` | `root` | **Change to your local MySQL user** |
| `LOCAL_DB_PASS` | *(empty)* | **Set if your local MySQL has a password** |
| `LOCAL_DB_NAME` | `nervecenter` | Local database name (created if missing) |

---

## What the Script Does

1. **SSH into VPS** using `sshpass` and runs `mysqldump` with safe flags
   (`--single-transaction`, `--no-tablespaces`, `--set-gtid-purged=OFF`).
2. **Streams the dump** to a timestamped temp file on the local machine
   (`/tmp/nervecenter_vps_dump_YYYYMMDD_HHMMSS.sql`).
3. **Creates the local database** if it does not already exist.
4. **Imports the dump** into the local MySQL instance.
5. **Removes** the temporary dump file.

---

## After Running the Script

Apply any pending Drizzle ORM migrations that are in the repo but not yet in
the imported schema:

```bash
cd ~/Learn/AI/CastlesOfLight/castlesoflight
pnpm drizzle-kit push
```

If the `users.password` column is missing after import, run:

```bash
# From the project root
pnpm drizzle-kit push
```

Then inject the admin credentials into the local database:

```sql
-- Run in your local MySQL client
INSERT INTO users (email, password, role)
VALUES (
  'chriscotton@castlesoflight.com',
  '$2b$10$<bcrypt_hash>',   -- generate with: node -e "const b=require('bcryptjs');b.hash('COLR0ckz123',10).then(console.log)"
  'admin'
)
ON DUPLICATE KEY UPDATE role = 'admin';
```

Or use the one-liner to generate and insert in a single step:

```bash
node -e "
const b = require('bcryptjs');
b.hash('COLR0ckz123', 10).then(hash => {
  console.log(\`INSERT INTO users (email, password, role)
VALUES ('chriscotton@castlesoflight.com', '\${hash}', 'admin')
ON DUPLICATE KEY UPDATE password='\${hash}', role='admin';\`);
});
"
```

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `sshpass: not found` | Install via brew / apt (see Prerequisites) |
| `mysqldump: command not found` on VPS | VPS has `mysql-server` — already installed |
| `Access denied` on local MySQL | Update `LOCAL_DB_USER` / `LOCAL_DB_PASS` in script |
| `ERROR 1227` (GTID) | Already handled by `--set-gtid-purged=OFF` flag |
| Dump is empty | Check VPS DB credentials; test with `ssh root@31.97.99.86 mysql -u nervecenter -pcastles-nc-db-2026 nervecenter -e "SHOW TABLES;"` |

---

## VPS Connection Details (reference)

```
Host : 31.97.99.86
User : root
Pass : N8NR0ck&12345
DB   : mysql://nervecenter:castles-nc-db-2026@localhost:3306/nervecenter
```

---

## Invocation by Manus Agent

When this skill is active, the agent should:

1. Read this `SKILL.md` to confirm credentials are current.
2. Run `sync-vps-db.sh` (or generate an equivalent Python/shell command) from
   the user's local machine or the Manus sandbox.
3. After import, remind the user to run `pnpm drizzle-kit push` and seed admin
   credentials if needed.
