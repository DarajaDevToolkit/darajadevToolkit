// ~/.daraja/config.json
{
"current_profile": "project1-dev",
"profiles": {
"project1-dev": {
"name": "Project 1 - Development",
"api_url": "https://api.daraja-toolkit.com",
"user_id": "user123",
"api_key": "encrypted_key_here",
"environments": {
"dev": "http://localhost:3000/webhooks/mpesa",
"staging": "https://staging.project1.com/webhooks/mpesa",
"production": "https://project1.com/webhooks/mpesa"
},
"permanent_urls": {
"dev": "https://webhook.daraja-toolkit.com/webhook/user123?env=dev",
"staging": "https://webhook.daraja-toolkit.com/webhook/user123?env=staging"
}
},
"project2-dev": {
"name": "Project 2 - Development",
// ... different project configuration
}
}
}

// CLI will use these existing APIs
const APIs = {
auth: {
login: 'POST /login',
refresh: 'POST /refresh'
},
settings: {
getAll: 'GET /settings/:userId',
upsert: 'POST /settings/:userId' // For environment URLs
},
webhooks: {
test: 'POST /test/:userId',
getUserUrl: 'GET /api/user/:userId/webhook-url/:environment'
},
monitoring: {
metrics: 'GET /api/metrics',
dlqStats: 'GET /api/dlq/stats',
realtimeMetrics: 'GET /api/metrics/realtime' // SSE stream
}
}
