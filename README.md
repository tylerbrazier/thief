# Thief

Web service for downloading youtube videos and songs.

For development:

    sudo npm install -g nodemon  # if you don't have it
    npm install
    nodemon app.js

To build the docker image and run the container locally:

    docker build -t thief .
    docker run -p 8080:8080 thief

    # to kill it:
    docker ps  # get its id
    docker kill <id>

To build and deploy on heroku (production):

    npm run lint
    npm version <major|minor|patch> -m 'v%s'

    # after `heroku login` and such
    heroku container:push web -a tubethief
    heroku container:release web -a tubethief

<https://devcenter.heroku.com/articles/free-dyno-hours>

## TODO
- Search
- Allow downloading a whole playlist (zip all files)
- Try to fill tag fields based on video name (split on `-`)
- Downloading large videos still fails on heroku; probably need to send
  periodic pings to client to keep the connection alive.
