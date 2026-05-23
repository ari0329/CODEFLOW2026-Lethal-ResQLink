resqlink/
├── README.md
├── docker-compose.yml
│
├── ai-service/                          # Python NLP Microservice (Pillar 3)
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── main.py                          # FastAPI entry point
│   ├── config.py
│   ├── models/
│   │   ├── distress_classifier.py       # Fine-tuned XLM-RoBERTa classifier
│   │   ├── ner_extractor.py             # spaCy/Transformers NER pipeline
│   │   ├── severity_scorer.py           # Rule + ML severity ranking
│   │   └── duplicate_detector.py        # Semantic similarity dedup
│   ├── pipelines/
│   │   ├── ingestion_pipeline.py        # Kafka consumer → process → store
│   │   └── geocoding.py                 # Location string → lat/lon
│   ├── training/                        # DATASET & TRAINING (manual step)
│   │   ├── DATASET_GUIDE.md             # ← Dataset format & sources guide
│   │   ├── train_classifier.py          # Fine-tuning script
│   │   ├── train_ner.py                 # NER training script
│   │   └── evaluate.py                  # Evaluation metrics
│   └── utils/
│       ├── text_cleaner.py              # Noise removal, slang expansion
│       ├── language_detector.py         # langdetect wrapper
│       └── encryption.py               # AES-256 field encryption (Pillar 4)
│
├── backend/                             # Node.js REST + WebSocket API
│   ├── Dockerfile
│   ├── package.json
│   ├── server.js                        # Express + Socket.IO entry
│   ├── config/
│   │   ├── db.js                        # MongoDB connection
│   │   ├── kafka.js                     # Kafka producer config
│   │   └── security.js                  # Helmet, rate-limit, JWT (Pillar 4)
│   ├── routes/
│   │   ├── alerts.js                    # CRUD for SOS alerts
│   │   ├── responders.js                # First responder actions
│   │   ├── analytics.js                 # Historical data queries
│   │   └── auth.js                      # JWT auth endpoints
│   ├── middleware/
│   │   ├── authMiddleware.js            # JWT verify + role-based access
│   │   ├── rateLimiter.js               # Express rate limiting
│   │   └── auditLogger.js              # Encrypted audit trail (Pillar 4)
│   ├── models/
│   │   ├── Alert.js                     # Mongoose alert schema
│   │   ├── Responder.js                 # Responder schema
│   │   └── AuditLog.js                  # Encrypted audit log schema
│   ├── services/
│   │   ├── kafkaConsumer.js             # Consume processed alerts from Kafka
│   │   ├── socketService.js             # WebSocket broadcast service
│   │   ├── geocodeService.js            # Geocoding API wrapper
│   │   └── alertService.js              # Business logic layer
│   └── utils/
│       └── encryption.js               # Field-level AES encryption (Pillar 4)
│
├── frontend/                            # React.js Dashboard (Pillar 1)
│   ├── Dockerfile
│   ├── package.json
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── index.js
│       ├── App.js
│       ├── config.js
│       ├── components/
│       │   ├── Map/
│       │   │   ├── EmergencyMap.jsx     # Leaflet map with live pins
│       │   │   ├── AlertPin.jsx         # Custom severity-colored markers
│       │   │   └── HeatmapLayer.jsx     # Leaflet.heat heatmap
│       │   ├── Dashboard/
│       │   │   ├── Dashboard.jsx        # Main dashboard layout
│       │   │   ├── AlertFeed.jsx        # Live scrolling alert feed
│       │   │   ├── SeverityBadge.jsx    # Color-coded severity display
│       │   │   └── StatsPanel.jsx       # Real-time stats cards
│       │   ├── Responder/
│       │   │   ├── ResponderPanel.jsx   # First responder action panel
│       │   │   └── ActionLog.jsx        # Audit log viewer
│       │   ├── Analytics/
│       │   │   ├── AnalyticsPage.jsx    # Charts + heatmaps
│       │   │   ├── TimelineChart.jsx    # Alert timeline
│       │   │   └── TypeBreakdown.jsx    # Emergency type pie chart
│       │   └── Auth/
│       │       ├── Login.jsx
│       │       └── ProtectedRoute.jsx
│       ├── hooks/
│       │   ├── useSocket.js             # WebSocket hook
│       │   └── useAlerts.js             # Alert data fetching
│       ├── store/
│       │   ├── alertSlice.js            # Redux Toolkit alert state
│       │   └── store.js
│       └── styles/
│           └── global.css
│
├── mobile/                              # React Native App (Pillar 2)
│   ├── package.json
│   ├── app.json
│   ├── App.js
│   └── src/
│       ├── screens/
│       │   ├── HomeScreen.js            # Live alert map
│       │   ├── SOSSubmitScreen.js       # Manual SOS submission
│       │   ├── AlertDetailScreen.js     # Alert detail view
│       │   └── LoginScreen.js
│       ├── components/
│       │   ├── AlertCard.js
│       │   └── SeverityIndicator.js
│       ├── hooks/
│       │   └── useSocket.js
│       └── services/
│           ├── api.js
│           └── auth.js
│
├── kafka/                               # Kafka + Zookeeper configs
│   └── docker-compose.kafka.yml
│
└── nginx/                               # Reverse proxy (Pillar 4 - zero trust)
    └── nginx.conf






cd ai-service

py -3.11 -m venv myenv

myenv\Scripts\activate

pip install -r requirements.txt

python training/train_classifier.py

python training/train_ner.py

python training/evaluate.py

uvicorn main:app --reload