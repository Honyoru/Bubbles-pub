# Bubbles — Job Board

A job board where visitors browse job offers, read the full details inline, and apply. Signed-in users apply in one click, and admins manage every table from an administration page.

- **Front end**: Next.js 16 (App Router), React 19, Tailwind CSS 4
- **Back end**: Next.js Route Handlers exposing a REST API (`app/api`)
- **Database**: PostgreSQL 16 (Docker), accessed through Prisma ORM

## Install & run

Requirements: Node.js ≥ 20, Docker.

```bash
# 1. Install dependencies (also generates the Prisma client)
npm install

# 2. Start PostgreSQL (port 5433). The schema in db/db-bubbles.sql is applied on first start.
docker compose up -d

# 3. Sync the schema (only needed if your DB volume predates the latest schema)
npm run db:push

# 4. Fill the database through the backend (wipes existing rows)
npm run db:seed

# 5. Start the app
npm run dev
```

Open <http://localhost:3000>.

### Configuration

`.env`:

| Variable         | Description                                       | Default                                                                        |
| ---------------- | ------------------------------------------------- | ------------------------------------------------------------------------------ |
| `DATABASE_URL`   | PostgreSQL connection string                      | `postgresql://myuser:mypassword@localhost:5433/db-bubbles?schema=public`        |
| `SESSION_SECRET` | Secret used to sign session cookies (set in prod) | a development fallback                                                         |

### Demo accounts (created by the seed)

| Role      | Email                      | Password   |
| --------- | -------------------------- | ---------- |
| admin     | `admin@bubbles.dev`        | `admin123` |
| candidate | `alice.dupont@example.com` | `password` |
| recruiter | `bob.martin@example.com`   | `password` |

## Pages

| Route      | Description                                                                                                                                                                                                                         |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`        | Job board. Each ad shows its title, company and a short description. **Learn more** fetches the full ad from the API and expands the card in place (no reload, no popup). **Apply** expands an inline form. Search, contract filters and pagination are included. |
| `/login`   | Sign in. Admins are redirected to `/admin`, everyone else to `/`.                                                                                                                                                                    |
| `/account` | Create an account (signed out) or edit your profile and see your applications (signed in).                                                                                                                                         |
| `/admin`   | Admin only. Lists every table with pagination and search, and lets the admin create, edit and delete records.                                                                                                                       |

Signed-in users don't have to fill in their personal details when applying: the form only asks for a message.

## Database schema

Schema: `db/db-bubbles.sql` (Prisma mirror: `prisma/schema.prisma`, diagram: `db/schema-diagram-bubble.png`).

| Table                | Purpose                                         | Main columns                                                                                                                                  |
| -------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `people`             | Candidates, recruiters and admins               | `person_id`, `first_name`, `name`, `pseudo`, `email` (unique), `cellphone_number`, `location`, `role` (`candidate`/`recruiter`/`meeter`/`admin`), `status`, `password_hash` |
| `company`            | Companies, owned by the person in charge of them | `id_company`, `person_id` → people, `name`, `description`                                                                                     |
| `advertisements`     | Job offers                                      | `advertisement_id`, `company_id` → company, `title`, `description`, `location`, `contract_type`, `remote_status`, `category`, `salary`, `working_time`, `created_at` |
| `applications`       | One application of a person to an ad            | `application_id`, `person_id` → people, `advertisement_id` → advertisements, `message`, `resume_url`, `applied_at`; unique (person, ad)       |
| `messages`           | Messages sent, e.g. the one sent to the ad owner on each application | `message_id`, `sender_id`, `receiver_id` → people, `application_id` → applications, `content`, `sent_at`, `read_at`                 |
| `events`             | Job fairs and meetups                           | `event_id`, `title`, `description`, `event_date`, `location`, `company_id`, `organizer_id`                                                    |
| `event_participants` | People registered to an event                   | (`event_id`, `person_id`), `registered_at`                                                                                                    |

When someone applies, an `applications` row is created, along with a `messages` row from the applicant to the company's owner. Visitors without an account get a `people` row (without a password), and they can claim it later by registering with the same email.

## REST API

Every route returns JSON. Errors look like `{ "error": "..." }` and use these status codes: `400` invalid or missing field, `401` not signed in, `403` not admin, `404` unknown id, `409` conflict (duplicate, or a related record is missing or still in use).

List routes are paginated with `?page=1&limit=10` (max 100) and return `{ data, page, limit, total, totalPages }`. They accept `?q=` for full-text search and `?<column>=<value>` for exact filters (e.g. `/api/ads?contract_type=CDI`).

### Resources (generic CRUD)

Available for `ads`, `companies`, `people`, `applications`, `messages` and `events`:

| Method   | Route                | Description                        | Access                                         |
| -------- | -------------------- | ---------------------------------- | ---------------------------------------------- |
| `GET`    | `/api/<resource>`    | List (paginated)                   | public for `ads`, `companies`, `events`; admin otherwise |
| `POST`   | `/api/<resource>`    | Create → `201`                     | admin                                          |
| `GET`    | `/api/<resource>/:id`| Read one                           | same as list                                   |
| `PUT`    | `/api/<resource>/:id`| Replace (all required fields)      | admin                                          |
| `PATCH`  | `/api/<resource>/:id`| Partial update                     | admin                                          |
| `DELETE` | `/api/<resource>/:id`| Delete → `204`                     | admin                                          |

For `people`, send `password` in clear text: it is stored as a scrypt hash, and password hashes are never returned.

### Nested & auth routes

| Method   | Route                        | Description                                                                                       | Access      |
| -------- | ---------------------------- | ------------------------------------------------------------------------------------------------- | ----------- |
| `GET`    | `/api/companies/:id/ads`     | Ads posted by a company                                                                           | public      |
| `POST`   | `/api/ads/:id/applications`  | Apply to an ad. Body: `message`, optional `resume_url`; visitors also send `first_name`, `name`, `email`, `cellphone_number`, `location` → `201` | public      |
| `GET`    | `/api/ads/:id/applications`  | Applications for an ad                                                                            | admin       |
| `POST`   | `/api/session`               | Sign in (`email`, `password`) → `201` `{ user, redirect }`                                        | public      |
| `GET`    | `/api/session`               | Current user                                                                                      | signed in   |
| `DELETE` | `/api/session`               | Sign out → `204`                                                                                  | public      |
| `POST`   | `/api/account`               | Create an account and sign in → `201`                                                             | signed out  |
| `GET`    | `/api/account`               | Own profile and applications                                                                      | signed in   |
| `PATCH`  | `/api/account`               | Update own profile (cannot change `role`/`status`)                                                | signed in   |

Example:

```bash
curl localhost:3000/api/ads/1
curl -X POST localhost:3000/api/ads/1/applications -H 'Content-Type: application/json' \
  -d '{"first_name":"Zoe","name":"Doe","email":"zoe@example.com","cellphone_number":"0600000000","location":"Paris","message":"Hello!"}'
```
  login/ account/ admin/   pages
db/                 SQL schema, diagram
prisma/             Prisma schema and seed script
```
