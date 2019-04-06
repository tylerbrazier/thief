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

    # after `heroku login` and such
    heroku container:push web -t tubethief
    heroku container:release web -t tubethief

<https://devcenter.heroku.com/articles/free-dyno-hours>
