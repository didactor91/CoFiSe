# Design: file-upload

## Technical Approach

Implement a multipart file upload system for images using `@fastify/multipart`. Since Mercurius does not natively support GraphQL multipart file uploads (the `Upload` scalar spec), the design uses a **separate REST endpoint** (`POST /upload`) that handles multipart uploads and returns an image URL, which the client then passes to the existing entity mutations.

This approach keeps GraphQL schema clean while leveraging Fastify's native multipart handling.

## Architecture Decisions

### Decision: Upload endpoint architecture

**Choice**: Separate REST endpoint `/upload` for file handling, not GraphQL mutation
**Alternatives considered**: 
- GraphQL multipart spec with `Upload` scalar — not supported by Mercurius
- Base64-encoded file in GraphQL mutation — adds ~33% payload size, messy
- Caddy upload endpoint — server-side processing needed for validation
**Rationale**: Mercurius has no multipart support. Separating concerns keeps GraphQL schema focused on data operations while Fastify handles file transport.

### Decision: Storage location

**Choice**: Local filesystem `uploads/` directory with UUID filenames
**Alternatives considered**: S3/Cloudinary — adds external dependencies, cost, latency
**Rationale**: Spec requires local storage. UUID filenames prevent collisions and path traversal.

### Decision: Magic byte validation

**Choice**: Validate file type by checking magic bytes (file signature), not MIME header
**Alternatives considered**: MIME type from Content-Type header — trivially spoofed
**Rationale**: Attackers can rename `.exe` to `.jpg`. Magic bytes are harder to fake.

## Data Flow

```
Admin Form (ImageUpload component)
    │
    │ 1. Select file → FileReader preview
    │
    ▼
Client ──POST /upload (multipart)──► Server (@fastify/multipart)
    │                                      │
    │ 2. Validate: magic bytes, size       │
    │                                      ▼
    │                              3. Save to uploads/{uuid}.{ext}
    │                                      │
    │ 4. Return { imageUrl: "/uploads/{uuid}.{ext}" }
    ▼                                      │
Client ◄─────────────────────────────────┘
    │
    │ 5. Call createEntity/updateEntity with imageUrl (or uploadImage mutation)
    │
    ▼
GraphQL Mutation ──► Database updated ──► Entity returned
```

### Sequence: uploadImage mutation (if we add it later)

```
Client                      Server                      DB
  │                           │                         │
  │─POST /upload (file)──────►│                         │
  │                           │─validate & save file───►│
  │                           │◄─────────────────────────│
  │◄──{ imageUrl }────────────│                         │
  │                           │─UPDATE entity SET───────►│
  │◄──Entity with imageUrl───│◄─────────────────────────│
```

## Database Changes

**Migration**: Add `image_url` column to `events` table.

```sql
-- cfs/database/schema.sql
ALTER TABLE events ADD COLUMN image_url TEXT;
```

Note: `products.image_url` and `news.image_url` already exist in schema.

## GraphQL Schema Changes

```graphql
# cfs/server/src/graphql/schema.ts

# ADD: EntityType enum
enum EntityType {
  PRODUCT
  NEWS
  EVENT
}

# ADD: Upload scalar (graphQL-upload spec)
scalar Upload

# ADD: imageUrl to Event (already exists on Product/News)
type Event {
  id: ID!
  name: String!
  description: String
  location: String!
  startTime: DateTime!
  endTime: DateTime!
  imageUrl: String  # ADDED
  createdAt: DateTime!
  updatedAt: DateTime!
}

# ADD: uploadImage mutation
type Mutation {
  uploadImage(entityType: EntityType!, entityId: ID!, file: Upload!): ImageUploadResult!
}

# ADD: union for return type
union ImageUploadResult = Product | News | Event
```

### Remove from input types

Per delta specs, `imageUrl` is **removed** from `CreateProductInput`, `UpdateProductInput`, `CreateNewsInput`, `UpdateNewsInput`. The upload happens via `uploadImage` mutation instead of text input.

## API Design

### REST Upload Endpoint

```
POST /upload
Content-Type: multipart/form-data

Fields:
  - file: File (the image)
  - entityType: "PRODUCT" | "NEWS" | "EVENT"
  - entityId: ID (optional — if provided, auto-links after upload)

Response 200:
{
  "imageUrl": "/uploads/{uuid}.{ext}",
  "filename": "{uuid}.{ext}"
}

Response 400:
{
  "error": "Invalid file type. Allowed: JPEG, PNG, GIF, WebP"
}
```

### GraphQL Mutation (optional enhancement)

```graphql
mutation UploadProductImage($id: ID!, $file: Upload!) {
  uploadImage(entityType: PRODUCT, entityId: $id, file: $file) {
    ... on Product {
      id
      imageUrl
    }
  }
}
```

## Component Design

### ImageUpload Component

```typescript
// cfs/client/src/components/ImageUpload.tsx

interface ImageUploadProps {
  entityType: 'PRODUCT' | 'NEWS' | 'EVENT'
  entityId?: string  // if provided, auto-uploads on file select
  onUploadComplete: (imageUrl: string) => void
  currentImageUrl?: string
  // ... styling props
}

type UploadState = 'idle' | 'uploading' | 'success' | 'error'

// Behavior:
// 1. idle: shows current image (if any) + file input button
// 2. uploading: progress indicator
// 3. success: checkmark + new image URL displayed
// 4. error: error message + retry button
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `cfs/server/src/modules/shared/upload.ts` | Create | Upload handler: validation (magic bytes, size), storage, file operations |
| `cfs/server/src/modules/shared/storage.ts` | Create | Storage interface: `store()`, `delete()`, `exists()`, `getUrl()` |
| `cfs/server/src/routes/upload.ts` | Create | `POST /upload` route with `@fastify/multipart` |
| `cfs/server/src/index.ts` | Modify | Register `@fastify/multipart` plugin, register `/upload` route |
| `cfs/server/src/config.ts` | Modify | Add `uploads_dir` config, increase `bodyLimit` to 5MB+ |
| `cfs/server/src/graphql/schema.ts` | Modify | Add `EntityType` enum, `uploadImage` mutation, add `imageUrl` to `Event` |
| `cfs/server/src/graphql/resolvers.ts` | Modify | Add `uploadImage` resolver |
| `cfs/server/src/modules/events/resolvers.ts` | Modify | Handle `imageUrl` field in createEvent/updateEvent |
| `cfs/database/schema.sql` | Modify | Add `image_url TEXT` to `events` table |
| `cfs/client/src/components/ImageUpload.tsx` | Create | Reusable image upload component with preview |
| `cfs/client/src/pages/admin/ProductsPage.tsx` | Modify | Replace imageUrl text input with `ImageUpload` component |
| `cfs/client/src/pages/admin/NewsPage.tsx` | Modify | Replace imageUrl text input with `ImageUpload` component |
| `cfs/client/src/pages/admin/EventsPage.tsx` | Modify | Add `ImageUpload` component (no existing image field) |
| `cfs/client/src/graphql/mutations.ts` | Modify | Add `UPLOAD_IMAGE_MUTATION` if using GraphQL upload |
| `cfs/uploads/` | Create | Upload directory (gitignored) |

## Security

| Threat | Mitigation |
|--------|------------|
| File type bypass | Magic bytes validation for JPEG (FF D8 FF), PNG (89 50 4E 47), GIF (47 49 46 38), WebP (52 49 46 46) |
| Oversized files | Reject > 5MB at multipart parsing stage |
| Path traversal | UUID filenames only, no user input in path construction |
| Unauthorized upload | Require JWT with STAFF or ADMIN role |
| XSS via uploaded file | Caddy serves with `Content-Type` header only, no script execution |

## Static File Serving

Caddy route (assumed in `Caddyfile`):
```
handle /uploads/* {
  file_server {
    hide .gitignore
  }
  cache {
    max_age 31536000  # 1 year
  }
}
```

## Open Questions

- [ ] Should we add orphan file cleanup when an entity is deleted?
- [ ] Do we need image dimension validation (e.g., min 200x200)?
- [ ] Should the upload endpoint auto-link to entity, or require explicit `uploadImage` mutation call?

## Migration / Rollout

1. Add `image_url` column to `events` (non-breaking — nullable)
2. Install `@fastify/multipart`, register in `index.ts`
3. Create `storage.ts` and `upload.ts` modules
4. Add `uploadImage` GraphQL resolver
5. Create `ImageUpload` component on client
6. Update admin forms one by one
7. No data migration needed — existing URLs in products/news still work

**No migration required** for existing data. New images will use UUID filenames, existing `image_url` values remain valid.
