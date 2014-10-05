#angular-basicauth

[![Build Status](https://travis-ci.org/iandotkelly/angular-basicauth.svg?branch=master)](https://travis-ci.org/iandotkelly/angular-basicauth)

[![Coverage Status](https://img.shields.io/coveralls/iandotkelly/angular-basicauth.svg)](https://coveralls.io/r/iandotkelly/angular-basicauth?branch=master)

[![Dependency Status](https://gemnasium.com/iandotkelly/angular-basicauth.svg)](https://gemnasium.com/iandotkelly/angular-basicauth)

## Purpose
Simple AngularJs service for managing login and logout, and protection
of server API endpoints using basic authentication. It provides
the following features:

- Service for handling login and logout operations
- Validates login against a configurable server endpoint
defaulting to /api/authentication
- Promise API for success/error on login
- Broadcasts 'login', 'logout' and 'authentication-failed' events on $rootScope
to allow all parts of the application to respond to auth events
- Once logged in provides an $http interceptor to add Authorization http header
to all requests
- Stores username and authentication credentials in local-storage or
cookies as a fallback
- Automatically logs user out on failed authentication
- Automatic logout after 3 hours (configurable)

Basic authentication sends usernames and passwords unencrypted in each request, so
should only be used over a HTTPS protected request.

**Please note this module stores unencypted username & password in local-storage or cookies, so is
susceptible to attack from code from the same domain**

**As with all security and authentication related software, I strongly encourage the user of this
software to thoroughly review it and understand how it work and assure themselves that it is
suitable before using it in their own project**



## Installation

You can clone this repository and include angular-basicauth.js or
angular-basicauth.min.js as a script in your application.

Alternatively you can use [bower.js](http://bower.io/) to install, which will install the
module and all its dependencies.

```sh
bower install angular-basicauth
```
## Use

### Include scripts

You should include the following scripts that comprise the module
and its bower installed dependencies.

 * angular-basicauth.js
 * bower_components/angular-base64/angular-base64.js
 * bower_components/angular-local-storage/dist/angular-local-storage.js

... or the minified equivalents.

### Add dependency in your Angular.Js app

Include the script in your angular.js web application:

```javascript
var app = angular.module('myApp', ['angularBasicAuth']);
```

### Configure Authentication URL

The authentication URL is any URL that will process a simple
GET request and return 200 if the user/password combination
encoded in the Basic Authentication header authenticates.
Any other response will be assumed to be a failure in login.

By default this URL is /api/authenticate

You can modify the URL by modifying the defaults, by injecting the
authDefaults values object, for example:

```javascript
var controller = app.controller('MyController',
	[
		'authDefaults',
		function(authDefaults) {
			// modify the auth service URL
			authDefaults.authenticateUrl = '/my/other/api.aspx';
		}
	]);
```

### Login / Logout

You can use the service to manage login & logout, by injecting
authService into your controller, for example this controller has
two methods on its scope for handling login and logout actions (say
from buttons in your UI) and listens to the broadcast events for
login/logout events that happen elsewhere.


```javascript
var controller = app.controller('MyController',
	[
		'authService', // the authentication service
		'$rootScope',  // (optional) if you want to receive auth events
		'$scope',
		function(authService, $rootScope, $scope) {

			// define the endpoints that will be authenticated
			authService.addEndpoint(); // the current hostname
			authService.addEndpoint('https://some.other.hostname.com');

			// listen for login events
			$rootScope.$on('login', function() {
				$scope.loggedInUsername = authService.username();
			});

			// listen for logout events
			$rootScope.$on('logout', function() {
				$scope.loggedInUsername = null;
			});

			// method to log-in
			$scope.onLoginButton = function () {
				// pass input username and password to
				// the service for authentication
				authService
				.login($scope.username, $scope.password)
				.success(function() {
					// handle login success
				})
				.error(function() {
					// handle login error
				});
			};

			// method to log out
			$scope.onLogoutButton = function () {
				// simply call the logout button
				authService.logout();
			};
		}
	]);
```

### HTTP Intercept

When logged in, requests generated with the $http service
have the 'Authorization' header appended to them so that
every request is authenticated.  

Please note that this means you MUST TRUST the endpoint of
these requests.

Only hostnames that have been added with a call to addEndpoint()
will have an authentication header, e.g.:

```javascript
// authenticate all requests to the current hostname
authService.addEndpoint();

// authenticate another hostname
authService.addEndpoint('https://some.other.domain.com');
```
## License

The MIT License (MIT)

Copyright (c) 2014 Ian Kelly

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
