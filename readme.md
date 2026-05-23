# ResQLink — AI-Powered Emergency Response Platform

## Project Structure


resqlink/
├── docker-compose.yml          ← Full stack orchestration
├── ai-service/                 ← Python NLP microservice (Pillar 3)
├── backend/                    ← Node.js REST + WebSocket API
├── frontend/                   ← React.js dashboard (Pillar 1)
├── mobile/                     ← React Native app (Pillar 2)
├── nginx/                      ← Reverse proxy (Pillar 4)
├── kafka/                      ← Message streaming
└── docs/                       ← Dataset guide
```



## ⚙️ Prerequisites

```
Docker Desktop (v24+) and Docker Compose v2
Node.js 20+
Python 3.11+
Expo CLI (for mobile)
```

---

## 🚀 FULL RUN PROCEDURE

### Step 1 — Clone and setup environment

```bash
git clone https://github.com/yourname/resqlink.git
cd resqlink
cp .env.example .env
# Edit .env with your values (see below)
```

### Step 2 — (OPTIONAL) Train custom AI models

**Only needed if you have a labeled dataset. System works with keyword heuristics without training.**

```bash
cd ai-service

# Install Python deps
pip install -r requirements.txt
python -m spacy download en_core_web_sm

# Validate your dataset first
python validate_dataset.py --data data/emergency_dataset.csv

# Train both models (needs GPU for speed, CPU works too)
python training/train_classifier.py --data data/emergency_dataset.csv --epochs 5
python training/train_ner.py        --data data/emergency_dataset.csv --epochs 5

# Evaluate
python training/evaluate.py --data data/emergency_dataset.csv --task both

cd ..
```

**→ Dataset format:** See `docs/DATASET_GUIDE.md`

### Step 3 — Start full stack with Docker

```bash
# Build and start all services
docker compose up --build

# Or run detached (background)
docker compose up --build -d

# Watch logs
docker compose logs -f
```

**Services started:**
| Service     | URL                        |
|-------------|----------------------------|
| Frontend    | http://localhost:3000      |
| Backend API | http://localhost:5000      |
| AI Service  | http://localhost:8000      |
| MongoDB     | localhost:27017            |
| Kafka       | localhost:9092             |
| Kafka UI    | http://localhost:8080 (optional) |

### Step 4 — Create first admin account

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@resqlink.io","password":"Admin@1234","role":"admin"}'
```

### Step 5 — Test the AI pipeline

```bash
# Send a test SOS message
curl -X POST http://localhost:5000/api/alerts/ingest \
  -H "Content-Type: application/json" \
  -d '{"message":"HELP flood in Sector 7 Guwahati near Brahmaputra Ghat 3 families trapped","source":"test"}'

# Check AI service directly
curl -X POST http://localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{"message":"भवन में आग लग गई है 5वी मंजिल पर लोग फंसे हैं FC रोड पुणे","source":"test"}'
```

### Step 6 — Open dashboard

Go to **http://localhost:3000**, log in with your admin credentials.

---

## 📱 Mobile App Setup

```bash
cd mobile

# Install dependencies
npm install

# Install Expo CLI globally
npm install -g expo-cli

# Set backend URL (for physical device use your machine's local IP)
echo 'EXPO_PUBLIC_BACKEND_URL=http://192.168.1.x:5000' > .env

# Start
expo start

# Scan QR code with Expo Go app (iOS/Android)
# Or press 'a' for Android emulator, 'i' for iOS simulator
```

---

## 🔧 Development (without Docker)

### Terminal 1 — MongoDB
```bash
mongod --dbpath ./data/db
```

### Terminal 2 — Kafka (use Docker just for Kafka)
```bash
cd kafka
docker compose -f docker-compose.kafka.yml up
```

### Terminal 3 — AI Service
```bash
cd ai-service
pip install -r requirements.txt
python -m spacy download en_core_web_sm
MODEL_PATH=./models/saved/emergency_ner uvicorn main:app --port 8000 --reload
```

### Terminal 4 — Backend
```bash
cd backend
npm install
npm run dev
```

### Terminal 5 — Frontend
```bash
cd frontend
npm install
npm start
# Opens http://localhost:3000
```

---

## 🌐 Deploy to Render (Free Tier)

### Backend
1. New Web Service → Connect GitHub repo → Root: `backend`
2. Build: `npm install`  |  Start: `node server.js`
3. Add environment variables from `.env`

### AI Service
1. New Web Service → Root: `ai-service`
2. Build: `pip install -r requirements.txt && python -m spacy download en_core_web_sm`
3. Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Frontend
1. New Static Site → Root: `frontend`
2. Build: `npm install && npm run build`
3. Publish dir: `build`
4. Set `REACT_APP_BACKEND_URL` to your Render backend URL

---

## 🔐 Environment Variables

| Variable | Service | Description |
|----------|---------|-------------|
| `MONGO_URI` | backend | MongoDB connection string |
| `JWT_SECRET` | backend | JWT signing secret (32+ chars) |
| `ENCRYPTION_KEY` | backend + ai | AES-256 key (exactly 32 chars) |
| `AI_SERVICE_URL` | backend | URL of AI FastAPI service |
| `KAFKA_BROKER` | all | Kafka broker address |
| `MODEL_PATH` | ai | Path to trained model directory |
| `FRONTEND_URL` | backend | Allowed CORS origin |

---

## 📊 Dataset for AI Training

See **`docs/DATASET_GUIDE.md`** for:
- Full CSV schema (classifier + NER)
- Minimum row counts per class
- Free public data sources (CrisisLex, HumAID, AI4Bharat)
- Annotation tools (Label Studio, Doccano)
- Data augmentation tips

**Provide your dataset at:** `ai-service/data/emergency_dataset.csv`

---

## 🧪 API Reference

```
POST /api/auth/register        Register responder
POST /api/auth/login           Login → JWT token
GET  /api/auth/me              Current user

GET  /api/alerts               List alerts (filters: severity, type, status)
POST /api/alerts/ingest        Submit raw message → AI pipeline
GET  /api/alerts/:id           Get single alert
PATCH /api/alerts/:id/status   Update status (dispatch/resolve)
PATCH /api/alerts/:id/verify   Mark verified

GET  /api/analytics/summary    KPI summary
GET  /api/analytics/heatmap    Lat/lng points for heatmap
GET  /api/analytics/recent     Recent 20 alerts

POST /ai-service/analyze       Direct AI analysis
POST /ai-service/analyze/batch Batch analysis
GET  /ai-service/health        AI service health
```



cd ai-service

py -3.11 -m venv myenv

myenv\Scripts\activate

pip install -r requirements.txt

python training/train_classifier.py

python training/train_ner.py

python training/evaluate.py

uvicorn main:app --reload