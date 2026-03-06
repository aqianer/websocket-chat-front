# API Documentation - Document Upload Wizard

## Overview

This document describes the incremental API changes for the Document Upload Wizard feature, which allows users to continue uploading and processing existing documents in the knowledge base.

## New Endpoint

### Get Document Upload Wizard Information

**Endpoint:** `POST /api/v1/knowledge-base/document-upload-wizard/{kbId}/{documentId}`

**Description:** Retrieves comprehensive document information to determine the current processing status and navigate the user to the appropriate step in the upload wizard.

**Authentication:** Required (Bearer Token)

**Path Parameters:**

| Parameter  | Type   | Required | Description       |
| ---------- | ------ | -------- | ----------------- |
| kbId       | number | Yes      | Knowledge Base ID |
| documentId | number | Yes      | Document ID       |

**Request Body:** None

**Success Response:**

- **Status Code:** `200 OK`
- **Response Body:**

```json
{
  "code": 200,
  "msg": "Success",
  "data": {
    "documentId": 123,
    "fileName": "example.pdf",
    "status": "uploaded_not_chunked",
    "chunkData": null,
    "uploadTime": "2024-01-15T10:30:00Z",
    "fileSize": "2.5MB",
    "fileType": "application/pdf"
  }
}
```

**Response Fields:**

| Field           | Type   | Description                                                 |
| --------------- | ------ | ----------------------------------------------------------- |
| code            | number | Response status code (200 for success)                      |
| msg             | string | Response message                                            |
| data            | object | Document information object                                 |
| data.documentId | number | Document ID                                                 |
| data.fileName   | string | Document file name                                          |
| data.status     | string | Document processing status (see Status Values below)        |
| data.chunkData  | array  | Array of chunk data (only present when status is 'chunked') |
| data.uploadTime | string | Document upload timestamp (ISO 8601 format)                 |
| data.fileSize   | string | File size (optional)                                        |
| data.fileType   | string | File type/MIME type (optional)                              |

**Status Values:**

| Status                   | Description                                                               |
| ------------------------ | ------------------------------------------------------------------------- |
| `uploaded_not_chunked` | Document has been uploaded but not yet chunked. User should go to Step 2. |
| `chunked`              | Document has been chunked. User should go to Step 3 to preview chunks.    |

**Error Responses:**

- **Status Code:** `400 Bad Request`

```json
{
  "code": 400,
  "msg": "Invalid request parameters"
}
```

- **Status Code:** `401 Unauthorized`

```json
{
  "code": 401,
  "msg": "Unauthorized access"
}
```

- **Status Code:** `404 Not Found`

```json
{
  "code": 404,
  "msg": "Document not found"
}
```

- **Status Code:** `500 Internal Server Error`

```json
{
  "code": 500,
  "msg": "Internal server error"
}
```

## Frontend Behavior

### User Flow

1. **User clicks "继续上传" (Continue Upload) button** in Knowledge Base Detail page
2. **Frontend sends POST request** to `/api/v1/knowledge-base/document-upload-wizard/{kbId}/{documentId}`
3. **Backend responds** with document information and current status
4. **Frontend navigates** based on response status:
   - If `status === 'uploaded_not_chunked'`: Navigate to Step 2 (Creation Settings)
   - If `status === 'chunked'`: Navigate to Step 3 (Chunk Preview) with chunk data

### Navigation Parameters

When navigating to the Document Upload Wizard, the frontend passes the following query parameters:

**For Step 2 (uploaded_not_chunked):**

```
/document-upload-wizard/{kbId}?documentId={documentId}&step=2
```

**For Step 3 (chunked):**

```
/document-upload-wizard/{kbId}?documentId={documentId}&step=3&chunkData={JSON_stringified_chunk_data}
```

## Implementation Notes

### Backend Requirements

1. **Document Status Tracking**: The backend must track the processing status of each document
2. **Chunk Data Storage**: When a document is chunked, store the chunk data for retrieval
3. **Error Handling**: Provide appropriate error messages for various failure scenarios
4. **Authentication**: Validate the user's access to the specified knowledge base and document

### Frontend Implementation

1. **API Integration**: The frontend uses the `knowledgeBaseApi.getDocumentUploadWizard()` method
2. **Type Safety**: TypeScript interfaces are defined for request/response structures
3. **Error Handling**: User-friendly error notifications are displayed on failure
4. **State Management**: The Document Upload Wizard component handles query parameters to initialize the correct step

## Example Usage

### cURL Example

```bash
curl -X POST \
  'http://localhost:7676/api/v1/knowledge-base/document-upload-wizard/1/123' \
  -H 'Authorization: Bearer YOUR_TOKEN_HERE' \
  -H 'Content-Type: application/json'
```

### JavaScript/TypeScript Example

```typescript
import { knowledgeBaseApi } from '@/api/knowledgeBase'

const response = await knowledgeBaseApi.getDocumentUploadWizard({
  kbId: 1,
  documentId: 123
})

if (response.code === 200) {
  const documentData = response.data
  
  if (documentData.status === 'uploaded_not_chunked') {
    // Navigate to Step 2
    router.push({
      path: '/document-upload-wizard/1',
      query: { documentId: documentData.documentId, step: '2' }
    })
  } else if (documentData.status === 'chunked') {
    // Navigate to Step 3 with chunk data
    router.push({
      path: '/document-upload-wizard/1',
      query: {
        documentId: documentData.documentId,
        step: '3',
        chunkData: JSON.stringify(documentData.chunkData)
      }
    })
  }
}
```

### Process Files (File Parsing and Chunking)

**Endpoint:** `POST /api/v1/file/process`

**Description:** Parse and chunk uploaded documents with specified parsing and segmentation strategies. Supports batch processing of multiple documents.

**Authentication:** Required (Bearer Token)

**Request Body:**

```json
{
  "kbId": 1,
  "documentIds": [123, 124, 125],
  "parseStrategy": "precise",
  "extractContent": ["image", "ocr", "table"],
  "segmentStrategy": "auto"
}
```

**Request Parameters:**

| Parameter       | Type     | Required | Description                                                                 |
| --------------- | -------- | -------- | --------------------------------------------------------------------------- |
| kbId            | number   | Yes      | Knowledge Base ID                                                           |
| documentIds     | number[] | Yes      | Array of document IDs (multiple for new upload, single for continue upload) |
| parseStrategy   | string   | Yes      | Document parsing strategy (precise/fast)                                    |
| extractContent  | string[] | Yes      | Content extraction types (image/ocr/table)                                  |
| segmentStrategy | string   | Yes      | Segmentation strategy (auto/custom/hierarchy)                               |

**Parsing Strategy Values:**

| Value       | Description                                                   |
| ----------- | ------------------------------------------------------------- |
| `precise` | Precise parsing - extracts images, tables, and other elements |
| `fast`    | Fast parsing - extracts text content only                     |

**Segmentation Strategy Values:**

| Value         | Description                                                        |
| ------------- | ------------------------------------------------------------------ |
| `auto`      | Automatic segmentation with preprocessing rules                    |
| `custom`    | Custom segmentation rules, segment length, and preprocessing rules |
| `hierarchy` | Hierarchical segmentation based on document structure              |

**Extraction Content Types:**

| Type      | Description                                   |
| --------- | --------------------------------------------- |
| `image` | Extract image content from documents          |
| `ocr`   | Perform text recognition on scanned documents |
| `table` | Extract table data from documents             |

**Success Response:**

- **Status Code:** `200 OK`
- **Response Body:**

```json
{
  "code": 200,
  "msg": "Success",
  "data": {
    "processedDocuments": [
      {
        "documentId": 123,
        "fileName": "Technical Document.pdf",
        "originalContent": "This is the original document content...",
        "chunkData": [
          {
            "content": "This is the first chunk content containing the main information...",
            "tokenCount": 256,
            "vectorStatus": "vectorized"
          },
          {
            "content": "This is the second chunk content continuing with relevant information...",
            "tokenCount": 198,
            "vectorStatus": "vectorized"
          }
        ]
      }
    ]
  }
}
```

**Response Fields:**

| Field                                              | Type   | Description                            |
| -------------------------------------------------- | ------ | -------------------------------------- |
| code                                               | number | Response status code (200 for success) |
| msg                                                | string | Response message                       |
| data                                               | object | Processing result object               |
| data.processedDocuments                            | array  | Array of processed documents           |
| data.processedDocuments[].documentId               | number | Document ID                            |
| data.processedDocuments[].fileName                 | string | Document file name                     |
| data.processedDocuments[].originalContent          | string | Original document content              |
| data.processedDocuments[].chunkData                | array  | Array of chunk data                    |
| data.processedDocuments[].chunkData[].content      | string | Chunk content                          |
| data.processedDocuments[].chunkData[].tokenCount   | number | Token count                            |
| data.processedDocuments[].chunkData[].vectorStatus | string | Vectorization status                   |

**Error Responses:**

- **Status Code:** `400 Bad Request`

```json
{
  "code": 400,
  "msg": "Invalid request parameters"
}
```

- **Status Code:** `401 Unauthorized`

```json
{
  "code": 401,
  "msg": "Unauthorized access"
}
```

- **Status Code:** `403 Forbidden`

```json
{
  "code": 403,
  "msg": "No permission to access this document"
}
```

- **Status Code:** `404 Not Found`

```json
{
  "code": 404,
  "msg": "Document not found"
}
```

- **Status Code:** `500 Internal Server Error`

```json
{
  "code": 500,
  "msg": "Internal server error"
}
```

**Usage Scenarios:**

1. User configures parsing and segmentation strategies in Step 2 of upload wizard
2. User clicks "Next" button
3. Frontend determines document ID list based on upload mode:
   - **New Upload Mode**: Pass all document IDs from Step 1 upload
   - **Continue Upload Mode**: Pass only the current document ID
4. Backend parses and chunks documents according to configured strategies
5. Backend returns processed documents with chunk data
6. Frontend automatically navigates to Step 3 (Chunk Preview) to display results

**cURL Example:**

```bash
curl -X POST \
  'http://localhost:7676/api/v1/file/process' \
  -H 'Authorization: Bearer YOUR_TOKEN_HERE' \
  -H 'Content-Type: application/json' \
  -d '{
    "kbId": 1,
    "documentIds": [123],
    "parseStrategy": "precise",
    "extractContent": ["image", "ocr", "table"],
    "segmentStrategy": "auto"
  }'
```

**JavaScript/TypeScript Example:**

```typescript
import { knowledgeBaseApi } from '@/api/knowledgeBase'

// New upload mode: process multiple documents
const response = await knowledgeBaseApi.processFiles({
  kbId: 1,
  documentIds: [123, 124, 125],
  parseStrategy: 'precise',
  extractContent: ['image', 'ocr', 'table'],
  segmentStrategy: 'auto'
})

// Continue upload mode: process single document
const response = await knowledgeBaseApi.processFiles({
  kbId: 1,
  documentIds: [123],
  parseStrategy: 'precise',
  extractContent: ['image', 'ocr', 'table'],
  segmentStrategy: 'auto'
})

if (response.code === 200) {
  const processedDocuments = response.data.processedDocuments
  
  // Update document list
  documentList.value = processedDocuments.map(doc => ({
    id: doc.documentId,
    name: doc.fileName,
    originalContent: doc.originalContent,
    segmentedContent: doc.chunkData.map(chunk => chunk.content).join('\n\n'),
    status: 'completed'
  }))
  
  // Navigate to Step 3
  currentStep.value = 3
}
```

## Testing Checklist

- [ ] Test with valid knowledge base ID and document IDs
- [ ] Test with invalid document IDs (404 error)
- [ ] Test with unauthorized access (401 error)
- [ ] Test new upload mode with multiple documents
- [ ] Test continue upload mode with single document
- [ ] Verify different parsing strategies (precise/fast)
- [ ] Verify different segmentation strategies (auto/custom/hierarchy)
- [ ] Verify chunk data is correctly formatted and displayed in Step 3
- [ ] Test error handling and user notifications
- [ ] **WebSocket Connection**: Test WebSocket connection establishment
- [ ] **WebSocket Progress**: Test real-time progress updates for multiple documents
- [ ] **WebSocket Complete**: Test complete message with chunk data
- [ ] **WebSocket Error**: Test error message handling and connection cleanup
- [ ] **WebSocket Reconnection**: Test automatic reconnection on connection loss
- [ ] **WebSocket Cleanup**: Test connection cleanup on component unmount
- [ ] Test with valid knowledge base ID and document ID
- [ ] Test with invalid document ID (404 error)
- [ ] Test with unauthorized access (401 error)
- [ ] Test navigation to Step 2 when status is 'uploaded_not_chunked'
- [ ] Test navigation to Step 3 when status is 'chunked'
- [ ] Verify chunk data is correctly formatted and displayed in Step 3
- [ ] Test error handling and user notifications

## Version History

| Version | Date       | Description                                                    |
| ------- | ---------- | -------------------------------------------------------------- |
| 1.1.0   | 2024-03-01 | Added Process Files endpoint for document parsing and chunking |
| 1.0.0   | 2024-01-15 | Initial API documentation                                      |
