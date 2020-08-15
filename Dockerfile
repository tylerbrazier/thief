# https://nodejs.org/en/docs/guides/nodejs-docker-webapp/

FROM node:12-alpine

WORKDIR /usr/src/app

RUN apk add --update ffmpeg curl python

# https://github.com/ytdl-org/youtube-dl
RUN curl -L https://yt-dl.org/downloads/latest/youtube-dl -o /usr/local/bin/youtube-dl
RUN chmod a+rx /usr/local/bin/youtube-dl

# install deps first to take advantage of layer caching
COPY package*.json ./
RUN npm ci --only=production

# copy the app sources
COPY . .

# heroku maps incoming traffic on port 80 to a $PORT env variable that it sets
# https://devcenter.heroku.com/articles/container-registry-and-runtime#dockerfile-commands-and-runtime
EXPOSE $PORT

CMD ["node", "app.js"]
