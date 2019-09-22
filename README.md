# Thief

Web service for downloading youtube videos and songs.

For development:

    sudo npm install -g nodemon  # if you don't have it
    npm install
    nodemon app.js

To build the docker image and run the container locally:

    docker build -t thief .
    docker run --init -p 8080:8080 thief

To build and deploy on heroku (production):

    npm version <major|minor|patch>

    # after `heroku login` and such
    heroku container:push web -a tubethief
    heroku container:release web -a tubethief

<https://devcenter.heroku.com/articles/free-dyno-hours>

## TODO
- Search
- Allow downloading a whole playlist (zip all files)
