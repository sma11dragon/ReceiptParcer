# Phase 1: Architecture Overview

## Data Flow

```mermaid
graph TD
    User((User)) -->|Uploads Receipt| Telegram[Telegram Bot]
    Telegram -->|Webhook| n8n[n8n Workflow]
    
    subgraph "Phase 1: Foundation"
        n8n -->|1. Insert Pending| DB[(PostgreSQL)]
        DB -->|Generate| SessionID[Session UUID]
        DB -->|Assign| Queue[Queue Position]
        
        n8n -->|2. Fix Message| Telegram
        n8n -->|3. Callback| Telegram
    end
    
    Telegram -->|Callback Click| n8n
    n8n -->|4. Lookup Session| DB
    DB -->|Return| Receipt[Receipt Data]
```

## Key Components

1.  **Session Tracking**: Every receipt gets a `receipt_session_id` (UUID) upon insertion.
2.  **Queue Management**: `queue_position` is assigned using `get_next_receipt_number()`.
3.  **Optimistic Locking**: `row_version` prevents race conditions during concurrent updates.
4.  **Content Hashing**: `content_hash` stored for future duplicate detection.
