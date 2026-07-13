# Data Layer

`src/lib/local-data/index.ts` is now a unified data layer with two backends:

1. MongoDB Atlas (recommended)
2. Local JSON files (`local-data/`)

Backend selection:
- Uses MongoDB when `ANA_DATA_BACKEND=mongodb` or `MONGODB_URI` is present
- Otherwise falls back to local files

Main entities:
- users
- testimonials
- notifications
- feedback
- community posts
- chats
- brain files

Brain data source:
- In Mongo mode: `brain_files` collection
- In local mode: `local-data/brain/`
