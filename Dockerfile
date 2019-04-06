# https://nodejs.org/en/docs/guides/nodejs-docker-webapp/

FROM node:10
WORKDIR /usr/src/app

# install deps first to take advantage of layer caching
COPY package*.json ./
RUN npm install

# copy the app sources
COPY . .

# heroku maps incoming traffic on port 80 to a $PORT env variable that it sets
# https://devcenter.heroku.com/articles/container-registry-and-runtime#dockerfile-commands-and-runtime
EXPOSE $PORT

CMD ["node", "app.js"]
