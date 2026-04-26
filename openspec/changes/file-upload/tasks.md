# Tasks: file-upload

## Phase 1: Infrastructure

- [x] 1.1 Install @fastify/multipart in server package
- [x] 1.2 Create `cfs/uploads/` directory with `.gitignore` (ignore all files except `.gitkeep`)
- [x] 1.3 Update `Caddyfile` to serve `/uploads/*` with `file_server`, cache max-age 31536000

## Phase 2: Database

- [x] 2.1 Add `image_url TEXT` column to `events` table in `cfs/database/schema.sql`
- [x] 2.2 Database schema updated — events table now has image_url column

## Phase 3: Backend

- [x] 3.1 Config: Add `uploads` config with maxSize and allowedTypes to `cfs/server/src/config.ts`
- [x] 3.2 Config: Increase `bodyLimit` to 5MB (5,242,880 bytes) in Fastify options
- [x] 3.3 Server: Register `@fastify/multipart` plugin in `cfs/server/src/index.ts`
- [x] 3.4 Create `cfs/server/src/modules/shared/storage.ts` — Storage interface with `store()`, `delete()`, `exists()`, `getUrl()`
- [x] 3.5 Create `cfs/server/src/modules/shared/upload.ts` — upload handler: magic bytes validation (JPEG/PNG/GIF/WebP), size check (<=5MB), file saving with UUID filename
- [x] 3.6 Create `cfs/server/src/routes/upload.ts` — `POST /upload` route with multipart handling, returns `{ imageUrl, filename }`
- [x] 3.7 Register `/upload` route in `cfs/server/src/index.ts`
- [x] 3.8 GraphQL: Add `EntityType` enum (PRODUCT, NEWS, EVENT) to `cfs/server/src/graphql/schema.ts`
- [x] 3.9 GraphQL: Add `imageUrl` field to `Event` type in schema
- [x] 3.10 GraphQL: Add `ImageUploadResult` union type (Product | News | Event)
- [x] 3.11 Resolvers: Add `uploadImage` resolver in `cfs/server/src/graphql/resolvers.ts`
- [x] 3.12 Resolvers: Handle `imageUrl` field in createEvent/updateEvent in `cfs/server/src/modules/events/resolvers.ts`
- [x] 3.13 Mappers: Update `eventFromRow` mapper to include imageUrl field

## Phase 4: Frontend

- [x] 4.1 Create `cfs/client/src/components/ImageUpload.tsx` with preview, upload states (idle/uploading/success/error), entityType prop
- [x] 4.4 Update `cfs/client/src/pages/admin/ProductsPage.tsx` — replace imageUrl text input with `ImageUpload` component (entityType="PRODUCT")
- [x] 4.5 Update `cfs/client/src/pages/admin/NewsPage.tsx` — replace imageUrl text input with `ImageUpload` component (entityType="NEWS")
- [x] 4.6 Update `cfs/client/src/pages/admin/EventsPage.tsx` — add `ImageUpload` component (entityType="EVENT")

## Phase 5: Testing

- [x] 5.1 RED/GREEN: Write `cfs/server/src/modules/shared/upload.test.ts` — test magic bytes validation rejects invalid files
- [x] 5.2 GREEN: Magic bytes validation already implemented — tests pass
- [x] 5.3 RED/GREEN: Write test for file size > 5MB rejection
- [x] 5.4 GREEN: Size check already implemented — tests pass
- [x] 5.5 RED/GREEN: Write test for valid image types (JPEG/PNG/GIF/WebP) are accepted
- [x] 5.6 GREEN: Valid types pass — implementation verified
- [x] 5.7 RED/GREEN: Write `cfs/server/src/modules/shared/storage.test.ts` — test `store()` returns UUID filename, `getUrl()` returns correct path
- [x] 5.8 GREEN: storage.ts already implemented — tests pass
- [x] 5.9 RED/GREEN: Write integration test `cfs/server/src/__tests__/routes/upload.test.ts` — test upload flow with validation and storage
- [x] 5.10 Write `cfs/client/src/components/ImageUpload.test.tsx` — test component renders, handles idle/uploading/success/error states (20 tests passing)
- [x] 5.11 Write E2E test `cfs/e2e/image-upload.spec.ts` — staff/admin logs in, uploads image to product, verifies success message

(End of file - total 54 lines)
