# ZookLabs API
![Deploy](https://github.com/ZookLabs/zooklabs/workflows/Deploy/badge.svg)
[![Scala Steward badge](https://img.shields.io/badge/Scala_Steward-helping-blue.svg?style=flat&logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAQCAMAAAARSr4IAAAAVFBMVEUAAACHjojlOy5NWlrKzcYRKjGFjIbp293YycuLa3pYY2LSqql4f3pCUFTgSjNodYRmcXUsPD/NTTbjRS+2jomhgnzNc223cGvZS0HaSD0XLjbaSjElhIr+AAAAAXRSTlMAQObYZgAAAHlJREFUCNdNyosOwyAIhWHAQS1Vt7a77/3fcxxdmv0xwmckutAR1nkm4ggbyEcg/wWmlGLDAA3oL50xi6fk5ffZ3E2E3QfZDCcCN2YtbEWZt+Drc6u6rlqv7Uk0LdKqqr5rk2UCRXOk0vmQKGfc94nOJyQjouF9H/wCc9gECEYfONoAAAAASUVORK5CYII=)](https://scala-steward.org)

ZookLabs is the backend api of [zooklabs.com](https://github.com/ZookLabs/zooklabs.com)

## Setup

### Requirements
- PostgresSQL Database Instance (Docker Recommended)
- JVM (atleast 1.8)

### Compiling
#### Compile zookCoreStub
zookcoreStub is a stub of zookcore used for local development.
```bash
sbt zookcoreStub / publishLocal
```
_what is zookcore?_
zookcore is a private library that is used to decrypt zooks, the stub returns fixed data.

#### Compiling zooklabs
```bash
sbt compile
```

### Running

#### Setup Database
```bash
docker-compose -f src/test/resources\docker-compose.yml up -d
```
#### Environment Variables
`CLIENT_ID` & `CLIENT_SECRET` are required for Discord OAuth2. (User Login)

#### Setup Test Discord Application
- Create a [New Application](https://discord.com/developers/applications)
- Give it a name
- Under `OAuth2` tab
- Add Redirect `http://localhost:3000/login`
- `CLIENT ID` & `CLIENT SECRET` are found under `General Information`

#### Run
```bash
sbt run
```

### Testing
Testing is lacking in this project currently.
#### Unit
```bash
sbt test
```

#### Integration
```bash
sbt it:test
```

## Need Help?

Come chat on the [Bamzooki Discord](http://discord.zooklabs.com)!


## Contributing
Issues & Pull requests are welcome. For major changes, please open an issue or discuss on the discord what you would like to change.
