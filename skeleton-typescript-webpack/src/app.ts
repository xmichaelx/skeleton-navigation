import {Aurelia} from 'aurelia-framework';
import {Router, RouterConfiguration} from 'aurelia-router';
import { AuthService, AuthorizeStep } from 'aurelia-auth';

export class App {
  router: Router;

  configureRouter(config: RouterConfiguration, router: Router) {
    config.title = 'Aurelia';
    config.map([
      { route: ['', 'welcome'], name: 'welcome',      moduleId: './welcome',      nav: true, title: 'Welcome' },
    ]);

    config.addPipelineStep('authorize', AuthorizeStep);
    this.router = router;
  }
}
