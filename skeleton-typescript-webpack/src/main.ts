import {Aurelia} from 'aurelia-framework';
// we want font-awesome to load as soon as possible to show the fa-spinner
import '../styles/styles.css';
import 'font-awesome/css/font-awesome.css';
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap';

// comment out if you don't want a Promise polyfill (remove also from webpack.config.js)
import * as Bluebird from 'bluebird';
Bluebird.config({ warnings: false });

function configureAuth() {
    var config = {
      baseUrl : 'https://sybilla-auth.azurewebsites.net/solaris/is',
      tokenName : 'token',
      idTokenName : 'id_token',
      profileUrl: '/connect/userinfo',
      unlinkUrl : '/connect/endsession',
      logoutRedirect: '/',
      loginRedirect : window.location.origin || window.location.protocol + '//' + window.location.host,
      storage: 'localStorage',
      providers : {
          identSrv : {
              name: 'identSrv',
              url: '/connect/token',
              authorizationEndpoint: 'https://sybilla-auth.azurewebsites.net/solaris/is/connect/authorize',
              redirectUri: window.location.origin || window.location.protocol + '//' + window.location.host,
              scope: ["openid", "profile", "email", "abotApi",  "astroDriveApi", "plannerApi", "userManagementApi"],
              responseType :'id_token token',
              scopePrefix: '',
              scopeDelimiter: ' ',
              requiredUrlParams: ['scope', 'nonce'],
              optionalUrlParams: ['display'],
              state: 'session_state',
              display: 'popup',
              type: '2.0',
              clientId: "abot-ui-solaris",
              flow: 'implicit',
              nonce : function(){
                  var val = ((Date.now() + Math.random()) * Math.random()).toString().replace(".", "");
                  return encodeURIComponent(val);
              },
              popupOptions: { width: 452, height: 633 }
          }
      }
  };

  return config;
}

export async function configure(aurelia: Aurelia) {
  var authConfig = configureAuth();

  aurelia.use
    .plugin('aurelia-auth', (baseConfig) => {
        baseConfig.configure(authConfig);
    })
    .plugin("aurelia-dialog", (config) => {
      config.useDefaults();
    })
    .standardConfiguration()
    .developmentLogging();

  // Uncomment the line below to enable animation.
  // aurelia.use.plugin('aurelia-animator-css');
  // if the css animator is enabled, add swap-order="after" to all router-view elements

  // Anyone wanting to use HTMLImports to load views, will need to install the following plugin.
  // aurelia.use.plugin('aurelia-html-import-template-loader')

  await aurelia.start();
  aurelia.setRoot('app');

  // if you would like your website to work offline (Service Worker), 
  // install and enable the @easy-webpack/config-offline package in webpack.config.js and uncomment the following code:
  /*
  const offline = await System.import('offline-plugin/runtime');
  offline.install();
  */
}