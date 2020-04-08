# Thief

Web service for downloading youtube videos and songs.

## Development
First go to <https://console.cloud.google.com/>,
create a project, enable youtube v3 api, and add an API key;
make a file containing the key named `YOUTUBE_API_KEY` at the project root.

Get `youtube-dl` from <http://ytdl-org.github.io/youtube-dl/download.html>

Then run:

    sudo npm install -g nodemon  # if you don't have it
    npm install
    nodemon app.js

To build the docker image and run the container locally:

    docker build -t thief .
    docker run --init -p 80:8080 --env YOUTUBE_API_KEY=... thief

- Include `-d` to run in the background
- Add `--restart=unless-stopped` to run on host startup.
- If there's networking issues when building/running, add
  `--network host` to the build & run commands and use
  `--env PORT=80` instead of `-p 80:8080` for run.

## Production
To build and deploy on heroku:

    npm version <major|minor|patch>

    # after `heroku login` and `heroku container:login` and such
    heroku container:push web -a tubethief
    heroku container:release web -a tubethief

<https://devcenter.heroku.com/articles/free-dyno-hours>

## TODO
- add some kind of `/gc` route to clean up in `/downloads`
- paginate lists
- embedded video preview on `/ready` page
- favicon
- configurable path to youtube-dl executable
