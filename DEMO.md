# NOVA × ROUTES demo branches

NOVA's Next.js API routes (`app/api/**`) are the target of the ROUTES demo. Each `demo/*` branch
contains a known set of vulnerabilities, one per OWASP class, written so that ROUTES can **find**
them (static analysis), **prove** them (sandbox baseline) and **fix** them (verified remediation
loop).

| Branch | What is vulnerable |
|---|---|
| `demo/base` | Nothing in `app/api`: the secure reference ("after" state) |
| `demo/sqli` | SQL injection |
| `demo/xss` | Reflected XSS |
| `demo/access-control` | Broken access control |
| `demo/misconfig` | Security misconfiguration |
| `demo/all` | All four together: the branch handed to ROUTES in the demo |

## The planted vulnerabilities

| Class | Where | What is wrong | How ROUTES proves it at runtime |
|---|---|---|---|
| SQL injection | `app/api/products/search/route.js` | `q` is interpolated into the SQL text | a `'` causes a 500 / DB error; a stacked `pg_sleep(3)` delays the response |
| XSS | `app/api/products/preview/route.js` | `name` is written into an HTML response unescaped | a `<script>` marker comes back verbatim in `text/html` |
| Access control | `app/api/admin/products/[id]/route.js` | `DELETE` has no session or role check | an anonymous `DELETE` succeeds instead of 401/403 |
| Access control | `app/api/orders/[id]/route.js` | the order is looked up by id only, not by owner | static only (needs two signed-in users) |
| Misconfiguration | `next.config.mjs` | no CSP/HSTS/X-Frame-Options/nosniff/Referrer-Policy; `Access-Control-Allow-Origin: *` | the page lacks the headers; a foreign `Origin` is granted access |
| Misconfiguration | `lib/auth.js` | hardcoded fallback JWT secret | static only |

`demo/base` shows the intended fixes: parameterised query, `escapeHtml`, `auth()` + role/owner checks,
explicit security headers and CORS origin, and a secret read from the environment only.

## Running the demo

```bash
routes analyze https://github.com/Anish-16-N/nova-ecommerce --ref demo/all
routes findings                 # grouped by severity; the app/api ones are the planted set
routes remediate                # pick findings, e.g. the SQL injection one, then watch the loop
```

The sandbox builds the Next.js app with `npm ci` + `next build`, creates a disposable PostgreSQL
database from `database/schema.sql` and the seed files, and points `DATABASE_URL` at it.

Good to know:

* The older Express code (`backend/`, `security-lab/`) and the Vite pages under `frontend/` also
  produce findings. They are pattern matches without a traced HTTP route, so the loop can only end
  `inconclusive` for them. Use the `app/api` findings for the live demo.
* `app/api/products/search` is public on purpose. ROUTES also reports it as "database read with no
  authentication check" (low confidence). Do not "fix" that one.
