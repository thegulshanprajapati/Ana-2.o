# Ana AI (ana.v-01)

Ana AI is a Next.js app with chat, code studio, image tools, documents, admin dashboard, and community features.

This version supports:
- `ana.v-01` as the text generation runtime
- MongoDB Atlas as primary database
- Brain context loading directly from database

## Can Brain Data From MongoDB Be Used As Brain Context?

Yes.

If your brain files are stored in MongoDB (`brain_files` collection), the chat flow reads them and uses them as context for responses.

## Core Stack

- Next.js 14 (App Router)
- React 18 + TypeScript
- Tailwind CSS + shadcn/ui
- `ana.v-01` model integration
- MongoDB Atlas (or local JSON fallback)

## Data Backend Modes

The app supports two modes:

1. MongoDB mode (recommended)
2. Local JSON mode (`local-data/` fallback)

MongoDB mode activates when either:
- `ANA_DATA_BACKEND=mongodb`, or
- `MONGODB_URI` / `MONGO_URI` is set

## Environment Setup

Create `.env` and configure:

```env
ANA_V01_API_KEY=your_ana_v01_api_key
ANA_V01_MODEL=llama-3.3-70b-versatile

ANA_DATA_BACKEND=mongodb
MONGODB_URI=your_mongodb_atlas_connection_string
MONGODB_DB_NAME=ana
# OR
MONGO_URI=your_mongodb_atlas_connection_string
MONGO_DB_NAME=ana

ANA_SEARCH_API_KEY=your_search_api_key
GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id

# Optional (only if you use image/audio generation flows)
ANA_IMAGE_API_KEY=your_optional_media_key

NEXT_PUBLIC_APP_URL=http://localhost:9002
```

You can also use:
- [`.env.example`](/d:/Ana/.env.example)

## Upload Existing `local-data` To MongoDB Atlas

Run migration:

```bash
npm run migrate:atlas
```

This uploads:
- users
- testimonials
- notifications
- feedback
- community posts
- chat sessions
- brain files (`local-data/brain/*`)

## Run Project

```bash
npm install
npm run dev
```

App URL: `http://localhost:9002`

## Brain Storage Format

Brain files are stored in MongoDB collection `brain_files`:

- `fileName` (example: `defaultt.json`, `Doctor Ana.json`, `notes.txt`)
- `content` (full text/json content)
- `updatedAt`

Chat response flow:
- Loads all brain files
- Parses conversational JSON files (`conversations` array)
- Uses these as context while generating responses

## Important Paths

- Data layer: [index.ts](/d:/Ana/src/lib/local-data/index.ts)
- Mongo client: [mongodb.ts](/d:/Ana/src/lib/mongodb.ts)
- Chat response flow: [generate-response.ts](/d:/Ana/src/ai/flows/generate-response.ts)
- Migration script: [migrate-local-data-to-mongodb.mjs](/d:/Ana/scripts/migrate-local-data-to-mongodb.mjs)

## Notes

- For production, add proper password hashing, validation, and rate limits.
- If MongoDB is not configured, app can still run on local file storage.
