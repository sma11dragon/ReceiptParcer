# 🔒 Secure Google Vision Proxy Setup Guide

## **Why Use a Proxy?**
- ✅ **API key never exposed** in n8n workflows
- ✅ **Rate limiting** to prevent abuse
- ✅ **Centralized key management**
- ✅ **Easy key rotation** without updating workflows
- ✅ **Additional security layers**

## **📋 Setup Steps:**

### **Step 1: Install Dependencies**
```bash
cd "/Users/siewloongchan/Documents/AI Projects/Receipts Parsing"
npm install express axios express-rate-limit
```

### **Step 2: Start Proxy Server**
```bash
# Option A: Direct run
node google-vision-proxy.js

# Option B: With environment variable (recommended)
GOOGLE_VISION_API_KEY=AIzaSyAdy2k4kTr8Z-Gi0NMK8nk9X957BwmcKCc node google-vision-proxy.js
```

### **Step 3: Test Proxy**
```bash
curl -X POST http://localhost:3001/health
# Should return: {"status":"ok","service":"google-vision-proxy"}

curl -X POST http://localhost:3001/vision/ocr \
  -H "Content-Type: application/json" \
  -d '{"image":{"content":"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="}}'
```

### **Step 4: Update n8n Workflow**
1. **Replace Google Vision HTTP Request node** with:
   - **URL:** `http://localhost:3001/vision/ocr`
   - **Method:** `POST`
   - **Headers:** `Content-Type: application/json`
   - **Body:** Same as before (image data)

2. **Example n8n node configuration:**
   ```
   URL: http://localhost:3001/vision/ocr
   Method: POST
   Headers:
     Content-Type: application/json
   Body: JSON
     {
       "image": {
         "content": "{{ $json.image_base64 }}"
       },
       "features": [
         {
           "type": "TEXT_DETECTION",
           "maxResults": 1
         }
       ]
     }
   ```

## **🔧 Production Deployment:**

### **Option A: PM2 (Recommended)**
```bash
# Install PM2
npm install -g pm2

# Start proxy with PM2
GOOGLE_VISION_API_KEY=AIzaSy... pm2 start google-vision-proxy.js --name "vision-proxy"

# Set to start on boot
pm2 startup
pm2 save

# Monitor
pm2 monit
```

### **Option B: Docker**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY google-vision-proxy.js .
EXPOSE 3001
CMD ["node", "google-vision-proxy.js"]
```

```bash
docker build -t vision-proxy .
docker run -d -p 3001:3001 \
  -e GOOGLE_VISION_API_KEY=AIzaSy... \
  --name vision-proxy \
  vision-proxy
```

### **Option C: Systemd Service**
Create `/etc/systemd/system/vision-proxy.service`:
```ini
[Unit]
Description=Google Vision Proxy
After=network.target

[Service]
Type=simple
User=nodejs
WorkingDirectory=/opt/vision-proxy
Environment=GOOGLE_VISION_API_KEY=AIzaSy...
ExecStart=/usr/bin/node google-vision-proxy.js
Restart=always

[Install]
WantedBy=multi-user.target
```

## **🔄 Update Script for n8n Workflows:**

Run this to update all workflows to use the proxy:

```bash
node update-n8n-proxy.js
```

## **🔒 Security Features:**

1. **Rate Limiting:** 100 requests per 15 minutes per IP
2. **Input Validation:** Checks for required image data
3. **Error Handling:** Proper error responses
4. **Timeout:** 30-second timeout for Google API calls
5. **Logging:** Request logging for monitoring

## **📊 Monitoring:**

### **Health Checks:**
```bash
curl http://localhost:3001/health
```

### **Logs:**
```bash
# PM2 logs
pm2 logs vision-proxy

# Docker logs
docker logs vision-proxy

# Direct logs
tail -f proxy.log
```

## **🚀 Quick Start:**

1. **Install:** `npm install`
2. **Start:** `GOOGLE_VISION_API_KEY=your_key node google-vision-proxy.js`
3. **Test:** `curl http://localhost:3001/health`
4. **Update n8n:** Change URL to `http://localhost:3001/vision/ocr`
5. **Test workflow:** Send a receipt

## **⚠️ Important Notes:**

1. **Keep proxy server running** 24/7
2. **Monitor logs** for errors
3. **Set up alerts** if proxy goes down
4. **Backup** the proxy configuration
5. **Rotate API key** every 3-6 months

## **🎯 Benefits:**

- ✅ **No API key in n8n workflows**
- ✅ **Centralized security controls**
- ✅ **Easy to update/rotate keys**
- ✅ **Additional rate limiting**
- ✅ **Better error handling**
- ✅ **Production ready**