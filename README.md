# API Demo

This SMART on FHIR applicaiton demos the use fo online EMR sandboxes along with Zynx API. This is a Java Spring Boot Server / Angular Web App demo application. It uses Node/Yarn/Web Pack for building the application.

## Get Zynx API Key

Please visit http://developer.zynx.com to request an API Key.

## Registering your Demo Application with Online EMR Sandbox

### Cerner

Go to [https://code.cerner.com/developer/smart-on-fhir/](https://code.cerner.com/developer/smart-on-fhir/) to register your localhost demo application.

### Smarthealth IT

Go to [https://sandbox.smarthealthit.org/]( https://sandbox.smarthealthit.org/) to registery your localhost demo application.

## Configuring Demo Application

The file "src/main/webapp/app/config.ts" needs to be configured as follows:

```
export var config = {
  smartFhirTokenServer: '< provided by sandbox EMR >',
  smartFhirAuthServer: '< provided by sandbox EMR >',
  smartFhirApiUrl: '< provided by sandbox EMRi>',
  smartFhirKey: '< retreived from the specific sandbox EMR being used',
  smartFhirRedirectUri: 'http://localhost:9000/#/smart_fhir'
}

export var zynx_config = {
  aPIKey :'< This is the Zynx API Key you request, see http://developer.zynx.com >',
  aPIURL :'< See the [getting started documentation](https://github.com/zynxhealth/documentation/blob/master/README.md), specifically the Zynx Health API Service Base URL. >'
}
```

## Running Demo Application

Before you can build this project, you must install and configure the following dependencies on your machine:

1. [Node.js][]: We use Node to run a development web server and build the project.
   Depending on your system, you can install Node either from source or as a pre-packaged bundle.
2. [Yarn][]: We use Yarn to manage Node dependencies.
   Depending on your system, you can install Yarn either from source or as a pre-packaged bundle.

After installing Node, you should be able to run the following command to install development tools.
You will only need to run this command when dependencies change in [package.json](package.json).

    yarn install

We use yarn scripts and [Webpack][] as our build system.

Run the following commands in two separate terminals to create a blissful development experience where your browser
auto-refreshes when files change on your hard drive.

    ./mvnw
    yarn start

[Yarn][] is also used to manage CSS and JavaScript dependencies used in this application. You can upgrade dependencies by
specifying a newer version in [package.json](package.json). You can also run `yarn update` and `yarn install` to manage dependencies.
Add the `help` flag on any command to see how you can use it. For example, `yarn help update`.

The `yarn run` command will list all of the scripts available to run for this project.

### Using angular-cli

You can also use [Angular CLI][] to generate some custom client code.

For example, the following command:

    ng generate component my-component

will generate few files:

    create src/main/webapp/app/my-component/my-component.component.html
    create src/main/webapp/app/my-component/my-component.component.ts
    update src/main/webapp/app/app.module.ts

## References 

This application was generated using JHipster 4.6.1, you can find documentation and help at [https://jhipster.github.io/documentation-archive/v4.6.1](https://jhipster.github.io/documentation-archive/v4.6.1).

[JHipster Homepage and latest documentation]: https://jhipster.github.io
[JHipster 4.6.1 archive]: https://jhipster.github.io/documentation-archive/v4.6.1

[Using JHipster in development]: https://jhipster.github.io/documentation-archive/v4.6.1/development/
[Using Docker and Docker-Compose]: https://jhipster.github.io/documentation-archive/v4.6.1/docker-compose
[Using JHipster in production]: https://jhipster.github.io/documentation-archive/v4.6.1/production/
[Running tests page]: https://jhipster.github.io/documentation-archive/v4.6.1/running-tests/
[Setting up Continuous Integration]: https://jhipster.github.io/documentation-archive/v4.6.1/setting-up-ci/

[Gatling]: http://gatling.io/
[Node.js]: https://nodejs.org/
[Yarn]: https://yarnpkg.org/
[Webpack]: https://webpack.github.io/
[Angular CLI]: https://cli.angular.io/
[BrowserSync]: http://www.browsersync.io/
[Karma]: http://karma-runner.github.io/
[Jasmine]: http://jasmine.github.io/2.0/introduction.html
[Protractor]: https://angular.github.io/protractor/
[Leaflet]: http://leafletjs.com/
[DefinitelyTyped]: http://definitelytyped.org/

