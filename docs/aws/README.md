# AWS config for the `sayfyho-memorial` bucket (eu-central-1)

- `iam-uploads-policy.json`: attach to the **app's** IAM user (Vercel env). It's least privilege:
  object put/get/delete plus `ListBucket`, the last one only for `scripts/s3-orphans.ts`. Use a
  **separate** user and test bucket (e.g. `sayfyho-memorial-test`) with the same policy (ARNs
  swapped) for local dev.
- `s3-bucket-policy.json`: public read. Legacy image URLs are plain public S3 URLs, so this must stay
  as it is (confirm the live policy matches before changing anything).
- `s3-cors.json`: the browser PUTs uploads straight to S3 with presigned URLs. Production origin is
  `https://www.sayfy.cz` (the apex redirects to `www`, so it never makes requests itself). Add
  `http://localhost:3000` **only on the test bucket**. Preview deployments use random hostnames, so
  test uploads on previews go against the test bucket, whose CORS can be broader.

Apply with:
```bash
aws s3api put-bucket-cors --bucket sayfyho-memorial --cors-configuration "{\"CORSRules\": $(cat s3-cors.json)}"
```
Turn on **bucket versioning** before the first `s3-orphans --delete` run (Phase 7).
