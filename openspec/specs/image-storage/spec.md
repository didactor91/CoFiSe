# Spec: image-storage

## Purpose

Defines local filesystem storage for uploaded images, including directory structure, filename generation, and security constraints.

## Requirements

### Requirement: Storage Directory

The system SHALL store uploaded files in a configured uploads directory.

#### Scenario: Default uploads directory

- GIVEN the application is configured with uploads_dir = "./uploads"
- WHEN a file upload occurs
- THEN the file is stored relative to project root

| Config Key | Default | Purpose |
|-----------|---------|---------|
| uploads_dir | "./uploads" | Base directory for stored files |
| max_file_size | 5,242,880 | 5MB in bytes |

### Requirement: Filename Generation

The system SHALL generate UUID v4 filenames preserving the original file extension.

#### Scenario: Generate UUID filename with extension

- GIVEN an uploaded file with original name "photo.jpg"
- WHEN the file is processed for storage
- THEN filename is generated as "{uuid-v4}.jpg"
- AND original filename is NOT used (no spaces, special chars, unicode)

#### Scenario: Preserve extension mapping

| Extension | MIME Type | Stored As |
|-----------|-----------|-----------|
| .jpg / .jpeg | image/jpeg | {uuid}.jpg |
| .png | image/png | {uuid}.png |
| .gif | image/gif | {uuid}.gif |
| .webp | image/webp | {uuid}.webp |

#### Scenario: Lowercase extension only

- GIVEN an uploaded file with name "Photo.PNG"
- WHEN the file is processed
- THEN stored filename uses ".png" (lowercase)

### Requirement: Static File Serving

The system SHALL serve uploaded files via HTTP at `/uploads/{filename}`.

#### Scenario: Serve uploaded file

- GIVEN a file exists at uploads/abc123.jpg
- WHEN a request arrives at GET /uploads/abc123.jpg
- THEN the file is served with Content-Type: image/jpeg
- AND Cache-Control: public, max-age=31536000 (1 year)

#### Scenario: Request non-existent file

- GIVEN no file exists at uploads/nonexistent.jpg
- WHEN a request arrives at GET /uploads/nonexistent.jpg
- THEN 404 Not Found is returned

### Requirement: Path Traversal Prevention

The system MUST prevent path traversal attacks via `..` in filenames or requests.

#### Scenario: Block path traversal in upload

- GIVEN an attacker attempts to upload a file with name "../../../etc/passwd"
- WHEN the filename is processed
- THEN only the filename is used (no path components)
- AND the file is stored in uploads/ with UUID name

#### Scenario: Block path traversal in URL

- GIVEN a request arrives at GET /uploads/../../etc/passwd
- WHEN the URL is parsed
- THEN the request is rejected with 400 Bad Request
- AND only filenames matching UUID pattern are served

### Requirement: File System Permissions

The system SHALL ensure uploaded files are readable by the web server.

#### Scenario: Set readable permissions

- WHEN a file is written to uploads/
- THEN file permissions are set to 0644 (rw-r--r--)
- AND the web server process can read the file

#### Scenario: Directory permissions

- GIVEN the uploads/ directory does not exist
- WHEN the storage system initializes
- THEN the directory is created with 0755 permissions (rwxr-xr-x)
- AND parent directories are created as needed

### Requirement: Storage Operations

The system SHALL provide a storage interface with the following operations:

```typescript
interface Storage {
  // Store a file and return the public URL path
  store(file: File): Promise<{ url: string; path: string }>
  
  // Delete a file by path
  delete(path: string): Promise<void>
  
  // Check if a file exists
  exists(path: string): Promise<boolean>
  
  // Get the URL for a stored file
  getUrl(filename: string): string
}
```

## Acceptance Criteria

1. Files stored in uploads/ with UUID v4 filenames
2. Extensions preserved (jpg, png, gif, webp only)
3. Files served at /uploads/{filename}
4. Path traversal attacks blocked
5. Files readable by web server (0644)
6. Directory created with 0755 if missing