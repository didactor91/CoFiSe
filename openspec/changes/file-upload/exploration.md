# Exploration: File Upload System for CFS

## Current State

### Image Handling (Today)
- **Database**: `image_url TEXT` columns exist in `news` and `products` tables
- **Events table**: NO `image_url` column (missing feature)
- **Admin forms**: Text inputs accepting external URLs only — no actual file upload
- **Public views**: Render images via `<img src={imageUrl}>` when present

### Affected Areas
| File | Impact |
|------|--------|
| `cfs/database/schema.sql` | Need to add `image_url TEXT` to events table |
| `cfs/server/src/graphql/schema.ts` | Need `imageUrl` on Event type, new upload mutations |
| `cfs/server/src/modules/{products,news,events}/resolvers.ts` | Handle file upload + storage |
| `cfs/server/src/index.ts` | Register `@fastify/multipart` plugin |
| `cfs/server/src/config.ts` | May need upload size/config |
| `cfs/client/src/pages/admin/ProductsPage.tsx` | Replace text input with file picker |
| `cfs/client/src/pages/admin/NewsPage.tsx` | Replace text input with file picker |
| `cfs/client/src/pages/admin/EventsPage.tsx` | Add image field (currently none) |
| `cfs/Caddyfile` | Add static file serving for `/uploads/*` |

---

## Approaches

### 1. Local Filesystem Storage (`uploads/` directory)
Files stored at `{server}/uploads/{uuid}.{ext}`, served statically.

| Pros | Cons |
|------|------|
| Simple to implement | No CDN/distribution for scaling |
| No external service dependencies | Storage on same disk as app |
| Works with Caddy's `file_server` | Must handle cleanup of orphaned files |

**Effort**: Low

### 2. @fastify/multipart Plugin
Standard Fastify plugin for handling `multipart/form-data` uploads.

| Pros | Cons |
|------|------|
| Official Fastify plugin | Need to handle temp file cleanup |
| Works with Fastify v5 | Need to validate file types manually |
| Supports streaming | Memory considerations for large files |

**Effort**: Low

### 3. File Input with Preview (Frontend)
Replace text input with `<input type="file">` + client-side preview before upload.

| Pros | Cons |
|------|------|
| Better UX — see image before saving | Requires client-side preview logic |
| Consistent across Products/News/Events | Must handle image URL updates |
| Can validate file type client-side | May need drag-and-drop support |

**Effort**: Low

---

## Recommendation

**Approach**: `@fastify/multipart` + Local Filesystem + File Input Preview

### Rationale
1. **Simplicity**: Local storage avoids external service complexity (S3, Cloudinary)
2. **Caddy integration**: `file_server` directive already works for static assets
3. **Incremental scope**: Start with Products/News (which already have `image_url` columns), then add Events
4. **Single upload mutation**: Can handle all entity types with `entityType` + `entityId` parameters

### Architecture Flow
```
[Admin Form] → POST /graphql (multipart) → [@fastify/multipart] → [Upload Handler]
                                                                  ↓
                                                           [Save to uploads/]
                                                                  ↓
                                                           [Return URL]
                                                                  ↓
[Form State Update] ← [GraphQL Response] ← [imageUrl in response]
```

---

## Security Considerations

| Concern | Mitigation |
|---------|------------|
| File type | Validate `Content-Type` header + magic bytes (file signature) |
| File size | Set limit (5MB per image seems reasonable for product photos) |
| Filename | Generate UUID-based filenames, discard original |
| Path traversal | Reject filenames with `/`, `..`, or null bytes |
| Storage quota | Consider disk usage monitoring |

---

## Risks

1. **Body limit too small**: Current `BODY_LIMIT` is 1MB — images exceed this easily
2. **No cleanup mechanism**: Deleted Products/News leave orphaned files
3. **Caddy routing**: Must verify `/uploads/*` routing doesn't conflict with existing proxies
4. **Migration complexity**: Adding `image_url` to events requires schema migration

---

## Suggested Initial Scope (file-upload change)

### Phase 1: Infrastructure
- [ ] Install `@fastify/multipart`
- [ ] Create upload directory (`uploads/`) with gitignore
- [ ] Configure Caddy static file serving for `/uploads`
- [ ] Increase body limit in config (5MB suggested)

### Phase 2: Backend
- [ ] Database: Add `image_url` column to `events` table
- [ ] GraphQL: Add `imageUrl` to Event type
- [ ] GraphQL: Create `uploadImage` mutation (entityType, entityId, file)
- [ ] Resolvers: Implement upload handler with validation

### Phase 3: Frontend
- [ ] Create reusable ImageUpload component with preview
- [ ] Update ProductsPage form
- [ ] Update NewsPage form
- [ ] Update EventsPage form (add new image field)

### Phase 4: Polish
- [ ] File cleanup on entity deletion (optional, can be deferred)
- [ ] Error handling for upload failures
- [ ] Loading states during upload

---

## Ready for Proposal

**Yes** — framework is clear, scope is defined, and risks are manageable.

The approach leverages existing patterns (URL-based `imageUrl` field) while adding actual file upload capability. Starting with local storage keeps complexity low and demonstrates the pattern before considering cloud storage.
