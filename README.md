
# Scirocco Server
[![Build Status](https://travis-ci.org/eloylp/scirocco-server.svg?branch=develop)](https://travis-ci.org/eloylp/scirocco-server)

Scirocco its a data distribution service (near real-time) over the HTTP protocol. It can act as data bus and gateway. Its a way to centralize and simplify inter service communications (ISC) as well as IoT communications.

## Organization

This readme only shows how to bring up this service and links for some of the available client libraries for interact with it.
For more information about the endpoints , requests and project internals, please visit the [wiki](../../wiki) .

If you want to contribute, please read [this](CONTRIBUTING.md)

## Setting up the service

#### For docker

This service can be launched in several ways. If you choose to follow the main stream and use docker you must take care about 
this environment vars at start up:

 * SCIROCCO_ENV                   - 'development' or 'production'
 * SCIROCCO_PORT                  -  Unsigned Integer
 * SCIROCCO_MONGO_URL             -  string, you can se an example below.
 * SCIROCCO_MASTER_TOKEN          -  string
 * SCIROCCO_MAX_KB_SIZE_RAW       -  unsigned integer
 * SCIROCCO_MAX_KB_SIZE_TEXT      -  unsigned integer
 * SCIROCCO_MAX_KB_SIZE_JSON      -  unsigned integer
 * SCIROCCO_MAX_GET_ALL_MESSAGES  -  unsigned integer
 
None of them are mandatory but if you do not set it, they will set its own default, you can take a look [here](config.js) .

**NOTE:** If you already have a docker infrastructure , and want this to be one more service, feel free for tune up [this compose file](docker-compose.yml) .

#### Standalone
If you want to simply execute the server from nodejs interpreter, you can set the env 
values above commented by running "npm start" from the root of the project. An example could be:

```bash
git clone https://github.com/eloylp/scirocco-server.git
cd scirocco-server
npm install
SCIROCCO_PORT=9000 npm start
```
## Bringing up the service with Docker

We use Docker as containerization tool. We have splitted the service in two containers, one for the nodejs server and second one
for mongodb.

If you have [docker](https://www.docker.com/) and docker-compose installed you can clone this repo and launch the service.

```bash
git clone https://github.com/eloylp/scirocco-server.git
cd scirocco-server
SCIROCCO_DOCKER_HOST_PORT=8000 docker-compose up
```
Take care about environment variables. In this case, you can reach now the service.

```bash
curl -H 'Authorization: DEFAULT_TOKEN' http://localhost:8000
```
Perhaps you are thinking about adding this service in front of nginx reverse proxy or similar.
The SCIROCCO_DOCKER_HOST_PORT its only a binding for development to the local machine.
Adapt [this compose file](docker-compose.yml) file to your needs.


**NOTE:** If you already have a mongo instance and only want to execute the Scirocco endpoint, feel free for tune up [this docker file](docker/node/Dockerfile) . Remember to use environment variables for config as described above.

## Running tests
For running tests , you will need a mongodb instance at localhost.

```bash
git clone https://github.com/eloylp/scirocco-server.git
cd scirocco-server
npm install
npm test
```
## Available client libraries
* [Scirocco-pyclient](https://github.com/eloylp/scirocco-pyclient) , writed in python.

