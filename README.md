# Thief

Web service for downloading youtube videos and songs.

For development:

    sudo npm install -g nodemon  # if you don't have it
    npm install
    nodemon app.js

To build the docker image and run the container locally:

    docker build -t thief .
    docker run --init -p 80:8080 thief

Add `--restart=unless-stopped` to run on host startup.

If there's networking issues when building/running, add
`--network host` to the build & run commands and use
`--env PORT=80` instead of `-p 80:8080` for run.

To build and deploy on heroku (production):

    npm version <major|minor|patch>

    # after `heroku login` and `heroku container:login` and such
    heroku container:push web -a tubethief
    heroku container:release web -a tubethief

<https://devcenter.heroku.com/articles/free-dyno-hours>

## TODO
- Search (in progress on `search` branch)
