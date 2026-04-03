# Admin Users

Admin access for `/admin/*` and `/api/admin/*` uses HTTP Basic Auth transport with database-backed credentials.

- Username: admin email
- Password: plain password provided by operator
- Source of truth: `AdminUser` collection in MongoDB

## Prerequisites

Set these environment variables before running the script:

- `MONGODB_URI` (required)
- `MONGODB_DB_NAME` (optional, defaults to `macarena`)

## Create Admin User

Command format:

```bash
npm run admin:create -- --email <email> --password <password>
```

Copy/paste example:

```bash
npm run admin:create -- --email admin@macarena.mx --password "super-secure-password"
```

Expected success output:

```text
Admin user created successfully: admin@macarena.mx
```

## Common Failures

Duplicate email:

```text
Admin user "admin@macarena.mx" already exists
```

Missing args / unknown args:

```text
Both --email and --password are required
```

```text
Unknown argument: --foo
```

Invalid email:

```text
Invalid email format: invalid-email
```

Weak password:

```text
Password must be at least 8 characters long
```

Missing DB env:

```text
Missing MONGODB_URI environment variable
```

Database connection failures:

- The script exits non-zero and prints the underlying connection error message from MongoDB.

## Security Note

Passing passwords directly in CLI args can leak to shell history.

Safer pattern:

```bash
read -s ADMIN_PASSWORD
npm run admin:create -- --email admin@macarena.mx --password "$ADMIN_PASSWORD"
unset ADMIN_PASSWORD
```

## Verify It Works

1. Run the create command and confirm success output.
2. Open `/admin` in browser and authenticate with the same `email:password`.
3. Call any protected endpoint (`/api/admin/orders`) with Basic Auth and verify it returns `200` instead of `401`.

## Rotation / Reset

Password reset/rotation flow is not implemented in this script.
Current behavior is create-only: if the email exists, creation fails and no overwrite is performed.
