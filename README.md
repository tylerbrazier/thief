# Thief

Web service for downloading youtube videos and songs.

For development:

    npm install
    node app.js

To deploy on heroku (production):

    # after `heroku login` and such
    heroku container:push web -t tubethief
    heroku container:release web -t tubethief
