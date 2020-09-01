# https://nodejs.org/en/docs/guides/nodejs-docker-webapp/

# https://docs.docker.com/engine/reference/commandline/pull/#pull-an-image-by-digest-immutable-identifier
FROM node:12.18.3-alpine@sha256:c8efbb31ceea05eb063ce1e598593237c73735ee0055190b8d8c48f0176b5721

WORKDIR /usr/src/app

RUN apk add --update ffmpeg curl python

# https://github.com/ytdl-org/youtube-dl
RUN curl -L https://yt-dl.org/downloads/latest/youtube-dl -o /usr/local/bin/youtube-dl
RUN chmod a+rx /usr/local/bin/youtube-dl

# install deps first to take advantage of layer caching
COPY package*.json ./
RUN npm ci --production && npm cache clean --force

# copy the app sources
COPY . .

# heroku maps incoming traffic on port 80 to a $PORT env variable that it sets
# https://devcenter.heroku.com/articles/container-registry-and-runtime#dockerfile-commands-and-runtime
EXPOSE $PORT

CMD ["node", "app.js"]
