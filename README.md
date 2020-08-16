# Thief

Web service for downloading youtube videos and songs.

## Development
First go to <https://console.cloud.google.com/>,
create a project, enable youtube v3 api, and add an API key;
then make a `.env` file at the project root with `YOUTUBE_API_KEY=<key>`.

Get `youtube-dl` from <http://ytdl-org.github.io/youtube-dl/download.html>

Then run:

    npm install
    npm run dev

## Production
To build the docker image and run the container locally:

    docker build -t thief .
    docker run --init -p 80:8080 -e NODE_ENV=production -e YOUTUBE_API_KEY=... -e BASIC_AUTH_CREDS=... thief

- Include `-d` to run in the background
- Add `--restart=unless-stopped` to run on host startup.
- If there's networking issues when building/running, add
  `--network host` to the build & run commands and use
  `-e PORT=80` instead of `-p 80:8080` for the run command.

To build and deploy on heroku:

    npm version <major|minor|patch>

    # after `heroku login` and `heroku container:login` and such
    heroku container:push web -a tubethief
    heroku container:release web -a tubethief

<https://devcenter.heroku.com/articles/free-dyno-hours>

## TODO
- keep localstorage memory of downloaded songs and offer to skip them when downloading a playlist
- persist playlist selection when paging thru a playlist on /ready (may require js? unless the next button is a form submit?)
