# ShortcutAI Agent API

This is a simple API built on Express using the Playwright library. It allows you to create and manage browser instances and navigate pages remotely. You can also take screenshots of the web pages. This API uses the Chromium browser, but you can easily change the `browserType` in the code to use other browsers supported by Playwright, such as WebKit and Firefox.

## Installation

1. Clone the repository.
2. Navigate to the project directory.
3. Run `npm install` to install all dependencies.

## Usage

1. Start the API server by running `npm start`. The server will be listening on port 3000.
2. Use API endpoints to interact with the browser instances by sending HTTP requests.

## API Endpoints

### Launch Browser

- **URL**: `/launch`
- **Method**: `POST`
- **Response**
  - **Content-Type**: `application/json`
  - **Body**: `{ "session_id": string }`

### Close Browser

- **URL**: `/close`
- **Method**: `POST`
- **Request**
  - **Content-Type**: `application/json`
  - **Body**: `{ "session_id": string }`
- **Response**
  - **Content-Type**: `application/json`
  - **Body**: `{ "session_id": string }`

### Create New Page

- **URL**: `/new_page`
- **Method**: `POST`
- **Request**
  - **Content-Type**: `application/json`
  - **Body**: `{ "session_id": string }`
- **Response**
  - **Content-Type**: `application/json`
  - **Body**: `{ "session_id": string, "page_id": string }`

### Go to URL

- **URL**: `/goto`
- **Method**: `POST`
- **Request**
  - **Content-Type**: `application/json`
  - **Body**: `{ "session_id": string, "page_id": string, "url": string }`
- **Response**
  - **Content-Type**: `application/json`
  - **Body**: `{ "session_id": string, "page_id": string, "url": string }`

### Take Screenshot

- **URL**: `/screenshot`
- **Method**: `POST`
- **Request**
  - **Content-Type**: `application/json`
  - **Body**: `{ "session_id": string, "page_id": string }`
- **Response**
  - **Content-Type**: `application/json`
  - **Body**: `{ "session_id": string, "page_id": string, "fileName": string }`

### Get Screenshot

- **URL**: `/screenshots/:fileName`
- **Method**: `GET`

## Example Usage

```
POST http://localhost:3000/launch
Response: { "session_id": "1" }

POST http://localhost:3000/new_page
Body: { "session_id": "1" }
Response: { "session_id": "1", "page_id": "1" }

POST http://localhost:3000/goto
Body: { "session_id": "1", "page_id": "1", "url": "https://example.com" }
Response: { "session_id": "1", "page_id": "1", "url": "https://example.com" }

POST http://localhost:3000/screenshot
Body: { "session_id": "1", "page_id": "1" }
Response: { "session_id": "1", "page_id": "1", "fileName": "some-uuid.png" }

GET http://localhost:3000/screenshots/some-uuid.png
```

## Deployment

Setup a new Ubuntu 20.04 server on DigitalOcean. Then create a new user and add it to the sudo group:

```
adduser shrtct
usermod -aG sudo shrtct
su - shrtct
```

To deploy to the server, first install Playwright:

```
npx playwright install --with-deps
```

```
rsync -avz --delete --progress ./ root@159.223.17.188:/home/shrtct
```

Then re-install node_modules:

```
rm -rf node_modules
yarn
```

To exclude node_modules from rsync:

```
rsync -avz --delete --progress --exclude='node_modules' --exclude='shrtct_video/node_modules' --exclude='shrtct_video/out' --exclude='.git' ./ root@159.223.17.188:/home/shrtct
```

Setup pm2:

```
yarn global add pm2
```

Then start the server:

```
pm2 start src/index.js --name shortcutai
```

To restart the server:

```
pm2 restart shortcutai
```

For fast release of new changes only in /src, use:

```
rsync -avz --delete --progress ./src/ root@159.223.17.188:/home/shrtct/src
```

## Redis deployment
Install:

- https://redis.io/docs/getting-started/installation/install-redis-on-linux/

Add this to `/etc/redis/redis.conf`:

```
loadmodule /home/redisearch.so
```

Restart:

```
systemctl restart redis-server.service 
```

If service not found:
```
systemctl list-units --type=service | grep redis
```
