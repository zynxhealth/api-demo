import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { ProdConfig } from './blocks/config/prod.config';
import { JpipeAppModule } from './app.module';



ProdConfig();

if (module['hot']) {
    module['hot'].accept();
}

let url: string = window.location.href

// Router hack for Smart Fhir Oauth callbacks
if(url.includes("?") && url.includes("#")){
  let fragment: string = url.replace(/^.+\?/, "").replace(/#.+$/, "")
  window["smartFhirParams"] = {}
  fragment.split("&").forEach( item => {
    let split = item.split("=")
    window["smartFhirParams"][split[0]] = split[1]
  })
}

platformBrowserDynamic().bootstrapModule(JpipeAppModule)
.then((success) => console.log(`Application started`))
.catch((err) => console.error(err));
