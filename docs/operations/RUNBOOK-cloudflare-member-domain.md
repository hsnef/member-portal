# Fix `member.hsnef.org` — Cloudflare DNS

> ## ✅ DONE 2026-09-02 — this runbook is historical
>
> The record is now a CNAME to `b71df0496b881ead.vercel-dns-017.com` with
> **Proxy status: DNS only**, and `member.hsnef.org` returns `200` with
> `Server: Vercel` (verified 2026-09-03). Nothing below needs doing.
> Keep the file as the record of what the problem was and how it was fixed.

**For whoever has admin access to the `hsnef.org` zone in Cloudflare.**
You need no knowledge of the application. This is a DNS change, about five
minutes, and it is reversible.

---

## The problem

`member.hsnef.org` never reaches the server that hosts it. It answers with a
redirect to itself, forever:

```
$ curl -sI https://member.hsnef.org
HTTP/2 308
location: https://member.hsnef.org/     <-- redirects to itself
server: cloudflare
cf-ray: a350f9d6bd1abfd8-ATL
```

The site behind it is healthy and deployed. Only DNS is in the way.

## Why it happens

The `member` record is **proxied** through Cloudflare (the orange cloud). It
currently resolves to Cloudflare's own IPs:

```
member.hsnef.org      ->  172.67.142.57, 104.21.39.23     (Cloudflare)
```

The host, Vercel, terminates TLS itself and issues its own certificate. With
Cloudflare proxying in front — especially with **SSL/TLS mode set to Flexible** —
Cloudflare connects to the origin over plain HTTP, the origin answers "please use
HTTPS", and Cloudflare loops that redirect back on itself indefinitely.

Vercel flags the same thing in its dashboard as **"Proxy Detected."**

## The proof it is only this

A sibling record on the same zone, pointing at the same platform, works
perfectly — because it is **not** proxied:

| | `member.hsnef.org` (broken) | `dev.member.hsnef.org` (works) |
|---|---|---|
| Record | proxied — resolves to Cloudflare IPs | CNAME → `b71df0496b881ead.vercel-dns-017.com` |
| Proxy | **On** (orange cloud) | **Off** (grey cloud) |
| Response | `308` redirect loop | `200 OK` |
| `server:` header | `cloudflare` | `Vercel` |

**The goal is simply to make `member` look like `dev.member`.**

---

## The fix

Cloudflare dashboard → select the **`hsnef.org`** zone → **DNS → Records** →
find the record named **`member`**.

### Step 1 — Turn the proxy off

Click the **orange cloud** in the Proxy status column so it becomes a **grey
cloud** (“DNS only”). Save.

This is the change that matters. Everything else below is only to confirm the
record is otherwise correct.

### Step 2 — Confirm the record points at the host

It should be:

| Field | Value |
|---|---|
| Type | `CNAME` |
| Name | `member` |
| Target | `b71df0496b881ead.vercel-dns-017.com` |
| Proxy status | **DNS only** (grey cloud) |
| TTL | Auto |

If the target is anything else, change it to that value. (`cname.vercel-dns.com`
also works but is the second-choice value — prefer the one above, which is what
the sibling `dev.member` record already uses.)

### Step 3 — Only if the loop persists

With the proxy off, Cloudflare's SSL mode no longer applies to this record. But
if the record must stay proxied for some other reason, then
**SSL/TLS → Overview** must be set to **Full (strict)**. Never **Flexible** —
that setting is what creates the loop.

Also check **Rules → Redirect Rules** and **Page Rules** for anything matching
`member.hsnef.org`. A rule redirecting the hostname to itself would produce the
same symptom independently of the proxy setting.

---

## Verify

DNS changes take a few minutes. Then:

```bash
curl -sI https://member.hsnef.org | head -3
```

**Expected — the fix worked:**

```
HTTP/2 200
server: Vercel
```

**Still broken:**

```
HTTP/2 308
location: https://member.hsnef.org/
server: cloudflare
```

A browser check is not reliable here — the redirect loop is often cached. Use
`curl`, or a private window.

## If something goes wrong

Turning the proxy back on (grey → orange) restores the previous state exactly.
Nothing else in the zone is touched, and no other hostname is affected.

## What this does not change

- No mail, no other subdomain, no other record in the zone.
- Cloudflare's DDoS protection and WAF stop applying **to this one hostname**,
  because traffic no longer passes through Cloudflare's proxy for it. The host
  provides its own TLS, CDN and DDoS mitigation. This is the normal, documented
  way to serve a Vercel-hosted site through a Cloudflare-managed zone, and it is
  exactly how `dev.member.hsnef.org` is already configured.
