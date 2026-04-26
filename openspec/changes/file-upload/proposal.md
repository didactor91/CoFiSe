# Proposal: file-upload

## Intent

Add file upload capability so STAFF and ADMIN users can upload images for products, news, and events directly in the admin panel, eliminating the need to rely on external image URLs.

## Scope

### In Scope
- Install and configure `@fastify/multipart` for file upload handling
- Local filesystem storage in `uploads/` directory with UUID-based filenames
- Create `uploadImage` GraphQL mutation for uploading images to entities
- Add `image_url` column to `events` table (database migration)
- Add `imageUrl` field to Event GraphQL type
- Create reusable `ImageUpload` component with preview
- Update admin forms for Products, News, and Events
- Configure Caddy static file serving for `/uploads/*`
- Increase body size limit (5MB)

### Out of Scope
- Cloud storage (S3, Cloudinary, etc.)
- Image processing (resize, optimize, thumbnails)
- Orphaned file cleanup on entity deletion
- Drag-and-drop support (basic file input only)
- Multiple image uploads per entity

## Capabilities

### New Capabilities
- `file-upload`: Upload images to Products, News, and Events via multipart GraphQL mutation
- `image-storage`: Local filesystem storage with UUID filenames served statically

### Modified Capabilities
- `event-management`: Add `imageUrl` field and image upload support to events
- `product-management`: Change image input from text URL to file upload
- `news-management`: Change image input from text URL to file upload

## Approach

**Technology Stack**:
- Backend: `@fastify/multipart` plugin for handling `multipart/form-data`
- Storage: Local filesystem (`uploads/` directory) with UUID-generated filenames
- Frontend: HTML5 file input with client-side preview before upload
- Serving: Caddy `file_server` directive for `/uploads/*`

**Upload Flow**:
1. Admin selects image file in form
2. Client shows preview immediately (FileReader API)
3. On form submit, `uploadImage` mutation sends file as `multipart/form-data`
4. Server validates file type (images only: jpg, png, gif, webp) and size (max 5MB)
5. Server saves file to `uploads/{uuid}.{ext}`
6. Server updates entity's `image_url` in database
7. Server returns entity with new `imageUrl`
8. Client updates form state with response

**GraphQL Mutation**:
```graphql
mutation UploadImage($entityType: String!, $entityId: ID!, $file: Upload!) {
  uploadImage(entityType: $entityType, entityId: $entityId, file: $file) {
    # Returns the updated entity with imageUrl
    id
    imageUrl
    # ... other fields
  }
}
```

**File Validation**:
- Allowed types: `image/jpeg`, `image/png`, `image/gif`, `image/webp`
- Max size: 5MB
- Filename: UUID v4 generated, original extension preserved
- Content validation: Check magic bytes, not just MIME type

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `cfs/server/package.json` | Modified | Add `@fastify/multipart` dependency |
| `cfs/server/src/index.ts` | Modified | Register multipart plugin |
| `cfs/server/src/config.ts` | Modified | Increase BODY_LIMIT to 5MB |
| `cfs/server/src/graphql/schema.ts` | Modified | Add `imageUrl` to Event, new uploadImage mutation |
| `cfs/server/src/modules/shared/upload.ts` | New | Upload handler with validation logic |
| `cfs/server/src/modules/{products,news,events}/resolvers.ts` | Modified | Handle uploadImage mutation |
| `cfs/database/schema.sql` | Modified | Add `image_url TEXT` to events table |
| `cfs/database/migrations.ts` | Modified | Add events image_url migration |
| `cfs/client/src/components/ImageUpload.tsx` | New | Reusable image upload with preview |
| `cfs/client/src/pages/admin/ProductsPage.tsx` | Modified | Use ImageUpload component |
| `cfs/client/src/pages/admin/NewsPage.tsx` | Modified | Use ImageUpload component |
| `cfs/client/src/pages/admin/EventsPage.tsx` | Modified | Add ImageUpload component |
| `cfs/client/src/graphql/mutations.ts` | Modified | Add UPLOAD_IMAGE_MUTATION |
| `cfs/Caddyfile` | Modified | Add static file serving for `/uploads/*` |
| `cfs/uploads/` | New | Directory for uploaded files (gitignored) |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Body limit too small | High | Increase BODY_LIMIT to 5MB in config.ts |
| File type bypass | Medium | Validate magic bytes, not just MIME type |
| Caddy routing conflict | Low | Test `/uploads/*` routing after config |
| Storage quota exhaustion | Low | Set 5MB limit per file; monitor disk |
| No cleanup on delete | Low | Document as deferred work |

## Rollback Plan

1. **Config**: Revert `BODY_LIMIT` in `config.ts`
2. **Dependencies**: Remove `@fastify/multipart` from `package.json`
3. **Database**: Remove `image_url` column from events table via migration
4. **GraphQL**: Revert Event type and remove `uploadImage` mutation
5. **Filesystem**: Delete `uploads/` directory
6. **Frontend**: Revert ImageUpload changes, restore text inputs

## Dependencies

- `@fastify/multipart` npm package
- Caddy file_server configuration

## Success Criteria

- [ ] Staff/admin can upload JPG, PNG, GIF, WebP images (max 5MB) to products
- [ ] Staff/admin can upload images to news items
- [ ] Staff/admin can upload images to events
- [ ] Uploaded images are served at `/uploads/{filename}` via Caddy
- [ ] Image preview shows in admin form before saving
- [ ] Invalid file types are rejected with error message
- [ ] Files exceeding 5MB are rejected with error message
- [ ] GraphQL types and generated types are updated correctly
- [ ] All existing tests pass
- [ ] E2E tests verify upload flow end-to-end