# Thief

Web service for downloading youtube videos and songs.

## Development
First go to <https://console.cloud.google.com/>,
create a project, enable youtube v3 api, and add an API key;
then make a `.env` file at the project root with `YOUTUBE_API_KEY=<key>`.

Get `youtube-dl` from <http://ytdl-org.github.io/youtube-dl/download.html>

Then run:

    sudo npm install -g nodemon  # if you don't have it
    npm install
    nodemon app.js

## Production
To build the docker image and run the container locally:

    docker build -t thief .
    docker run --init -p 80:8080 --env YOUTUBE_API_KEY=... --env BASIC_AUTH_CREDS=... thief

- Include `-d` to run in the background
- Add `--restart=unless-stopped` to run on host startup.
- If there's networking issues when building/running, add
  `--network host` to the build & run commands and use
  `--env PORT=80` instead of `-p 80:8080` for the run command.

To build and deploy on heroku:

    npm version <major|minor|patch>

    # after `heroku login` and `heroku container:login` and such
    heroku container:push web -a tubethief
    heroku container:release web -a tubethief

<https://devcenter.heroku.com/articles/free-dyno-hours>
