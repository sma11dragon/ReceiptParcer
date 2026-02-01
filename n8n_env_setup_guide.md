# n8n Environment Variable Setup Guide

## Current Situation
You're logged into your server but need `sudo` for Docker commands.

## Step 1: Check Current n8n Setup

Run these commands on your server:

```bash
# Check if you're in the docker group
groups sma11dragon

# Check n8n container with sudo
sudo docker ps | grep n8n

# Get detailed container info
sudo docker ps -a --filter "name=n8n" --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"

# Check if there's a docker-compose file
ls -la docker-compose*.yml
ls -la *.yml
```

## Step 2: Check Current Environment Variables

```bash
# Inspect the n8n container
CONTAINER_ID=$(sudo docker ps -q --filter "name=n8n")
sudo docker inspect $CONTAINER_ID | grep -i env

# Check container logs
sudo docker logs $CONTAINER_ID --tail 20
```

## Step 3: Add Environment Variable

You have **three options**:

### Option A: Add to Existing Container (Temporary)
```bash
# Stop the container
sudo docker stop $CONTAINER_ID

# Create new container with added environment variable
# First, get the original run command
sudo docker inspect $CONTAINER_ID | grep -A10 "Config"

# Then recreate with environment variable
# Example command (adjust based on your setup):
sudo docker run -d \
  --name n8n \
  -e GOOGLE_VISION_API_KEY="AIzaSyAdy2k4kTr8Z-Gi0NMK8nk9X957BwmcKCc" \
  -e N8N_PROTOCOL=https \
  -e N8N_HOST=n8ntest.daeit.com.sg \
  -p 5678:5678 \
  -v n8n_data:/home/node/.n8n \
  n8nio/n8n:latest
```

### Option B: Use Docker Compose (Recommended)
If you have a `docker-compose.yml` file:

```bash
# Edit the docker-compose.yml
nano docker-compose.yml

# Add environment variable under n8n service:
# environment:
#   - GOOGLE_VISION_API_KEY=AIzaSyAdy2k4kTr8Z-Gi0NMK8nk9X957BwmcKCc

# Restart with compose
sudo docker-compose down
sudo docker-compose up -d
```

### Option C: Use Portainer (Easiest)
1. Go to: `http://100.90.68.68:9000/#!/auth`
2. Login to Portainer
3. Find your n8n container
4. Click "Duplicate/Edit"
5. Add environment variable: `GOOGLE_VISION_API_KEY=AIzaSyAdy2k4kTr8Z-Gi0NMK8nk9X957BwmcKCc`
6. Redeploy container

## Step 4: Verify Environment Variable

```bash
# Check if environment variable is set
sudo docker exec $CONTAINER_ID printenv | grep GOOGLE

# Test in n8n workflow
# Create a simple workflow with Code node:
# return [{ json: { api_key: process.env.GOOGLE_VISION_API_KEY } }];
```

## Step 5: Update n8n Workflow

After setting the environment variable, update your workflow:

1. **Change the Google Vision OCR node URL** from:
   ```
   https://vision.googleapis.com/v1/images:annotate?key=AIzaSyAdy2k4kTr8Z-Gi0NMK8nk9X957BwmcKCc
   ```
   to:
   ```
   https://vision.googleapis.com/v1/images:annotate?key={{ $env.GOOGLE_VISION_API_KEY }}
   ```

2. **Import updated workflow** to n8n

## Quick Commands Summary

```bash
# 1. Check current setup
sudo docker ps | grep n8n
CONTAINER_ID=$(sudo docker ps -q --filter "name=n8n")

# 2. Check current env vars
sudo docker inspect $CONTAINER_ID | grep -i env

# 3. Add user to docker group (optional, to avoid sudo)
sudo usermod -aG docker sma11dragon
# Log out and log back in for changes to take effect

# 4. Check for docker-compose
ls -la *.yml

# 5. If using docker-compose, edit and restart
sudo nano docker-compose.yml
sudo docker-compose down
sudo docker-compose up -d

# 6. Verify
sudo docker exec $CONTAINER_ID printenv GOOGLE_VISION_API_KEY
```

## Troubleshooting

### Permission Denied
```bash
# Add yourself to docker group
sudo usermod -aG docker sma11dragon

# Log out and log back in
exit
ssh -p 25 sma11dragon@100.90.68.68

# Now try without sudo
docker ps
```

### Container Won't Start
```bash
# Check logs
sudo docker logs n8n

# Check port conflicts
sudo netstat -tulpn | grep :5678
```

### Environment Variable Not Working
```bash
# Test from inside container
sudo docker exec -it n8n /bin/bash
printenv | grep GOOGLE
exit
```

## Next Steps After Setup

1. **Update workflow files** using the Python script:
   ```bash
   python3 update_n8n_workflows.py
   ```

2. **Import updated workflow** to n8n

3. **Test the workflow** with a receipt image

4. **Set Google Cloud quotas** for the API key

5. **Monitor usage** in Google Cloud Console