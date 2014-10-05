/**
 * Basic Authentication Module for AngularJs
 *
 * Copyright (C) Ian Kelly
 * License: MIT
 */

'use strict';

(function() {

	var angularBasicAuth = angular.module(
		'angularBasicAuth',
		[
			'LocalStorageModule',
			'base64'
		]);

	// Constants
	var MS_PER_MINUTE = 1000 * 60;

	/**
	* Difference between two dates in hours
	*
	* @param {Date} a First date
	* @param {Date} b Second date
	*/
	function dateDiffInMinutes(earlier, later) {
		return (later.getTime() - earlier.getTime()) / MS_PER_MINUTE;
	}

	/**
	 * Constants
	 */
	angularBasicAuth.constant('MODULE_VERSION', '0.0.0');

	/**
	 * Defaults
	 */
	angularBasicAuth.value('authDefaults', {
		authenticateUrl: '/api/authenticate',
		sessionMinutes: 180
	});

	/**
	* HTTP Interceptor to add Authorization headers to all requests if the
	* auth local storage property has been set
	*/
	angularBasicAuth.factory('authInterceptor',
		[
			'$q',
			'authService',
			function ($q, authService) {

				var isEndpoint = authService.isEndpoint;

				var authInterceptor = {

					/**
					* Request Interceptor
					*
					* Adds an authorization header, if and only if there
					* is one found in the local storage
					*/
					request: function(config) {
						if (isEndpoint(config.url)) {
							var auth = authService.getAuth();
							var headers = authService.headers;
							if (auth) {
								config.headers.Authorization = auth;
								for (var key in headers) {
									if (headers.hasOwnProperty(key)) {
										config.headers[key] = headers[key];
									}
								}
							}
						}
						return config;
					},

					/**
					* Error Interceptor
					*
					* Used to trap an authentication error
					*/
					responseError: function(rejection) {
						// this is a failure to authenticate
						// so inform the authenticaton service
						if (rejection.status === 401) {
							authService.handleAuthFailure();
						}

						return $q.reject(rejection);
					}
				};

				return authInterceptor;
			}
		]);

	/**
	* Service to handle user authentication
	*
	* This is a singleton service, so we will instantiate this once in an iife
	*/
	(function() {
		angularBasicAuth.factory('authService',
			[
				'$log',
				'localStorageService',
				'$base64',
				'$q',
				'$rootScope',
				'$interval',
				'authDefaults',
				function ($log, localStorage, $base64, $q, $rootScope, $interval, authDefaults) {

					$log.debug('authService constructed');

					var LS_USERNAME = 'username';
					var LS_AUTHENTICATION = 'auth';
					var LS_LASTACTIVITY = 'last-activity';

					// array to store protected endpoints
					var endpoints = [];
					// use an anchor element to parse urls
					var urlParser = document.createElement('a');

					/**
					 * Whether a hostname is in the endpoint collection
					 * @param {String} hostname  The hostname of a URL, e.g. www.google.com
					 */
					function inEndpoints(hostname) {
						for (var index = 0, len = endpoints.length; index < len; index++) {
							if (hostname === endpoints[index]) {
								return true;
							}
						}
						return false;
					}

					/**
					* Logout and wipe the local storage
					*/
					function logout() {
						$log.debug('logout event');
						localStorage.remove(LS_AUTHENTICATION);
						localStorage.remove(LS_LASTACTIVITY);
						localStorage.remove(LS_USERNAME);
						$rootScope.$emit('logout');
					}

					/**
					* Set the user credentials
					*
					* @param {String} username Username
					* @param {String} password Unencryped password
					*/
					function setCredentials(username, password) {
						$log.debug('Setting credentials for user: ' + username);

						localStorage.set(LS_USERNAME, username);

						// set the value of the auth-header
						localStorage.set(LS_AUTHENTICATION,
							'Basic ' + $base64.encode(username + ':' + password));

						recordActivity();
					}

					/**
					* Record account activity
					*/
					function recordActivity() {
						localStorage.set(LS_LASTACTIVITY, (new Date()).toString());
					}

					/**
					* Is the login current
					*/
					function isCurrent() {
						// retrieve the last activity of the account
						var lastActivity = localStorage.get(LS_LASTACTIVITY) || '';

						if (lastActivity === '') {
							return false;
						}

						return (dateDiffInMinutes(new Date(lastActivity), new Date()) < authDefaults.sessionMinutes);
					}

					/**
					* Confirm the account is current
					*/
					function confirmCurrent() {
						if (!isCurrent()) {
							$log.debug('Authentication credentials missing or out of date');
							logout();
						}
					}

					/**
					* Returns the current authentication header
					*/
					function getAuth() {
						return localStorage.get(LS_AUTHENTICATION);
					}

					// we should work out whether we are current or not
					confirmCurrent();

					// set an inteval to do this regularly
					$interval(confirmCurrent, 60000);

					return {
						/**
						* Get any current authentication header
						*/
						getAuth: getAuth,

						/**
						* Handles logout
						*/
						logout: logout,

						/**
						* Record activity
						*/
						activity: recordActivity,

						/**
						 * Add an endpoint
						 *
						 * @param {String} endpoint  The URL of an endpoint, or undefined if current location
						 */
						addEndpoint: function(endpoint) {
							endpoint = endpoint || window.location;
							urlParser.href = endpoint;
							var hostname = urlParser.hostname;
							if (inEndpoints(hostname)) {
								return;
							}
							endpoints.push(hostname);
						},

						/**
						 * Additional headers to add to authenticated
						 * requests.
						 */
						headers: {},

						/**
						 * Is an URL a defined endpoint requiring authentication
						 *
						 * @param {String} url The URL of a potential endpoint
						 */
						isEndpoint: function(url) {
							urlParser.href = url;
							var hostname = urlParser.hostname;
							return inEndpoints(hostname);
						},

						/**
						* The current username
						*
						* @return {String} The current username
						*/
						username: function() {
							confirmCurrent();
							return localStorage.get(LS_USERNAME);
						},

						/**
						* Handle an authentication failure
						*/
						handleAuthFailure: function() {
							logout();
							$rootScope.$emit('authentication-failure');
						},

						/**
						* Handles login to the application
						*
						* @param  {String} username The username
						* @param  {String} password The password
						* @return {Object}          Promise for the transaction
						*/
						login: function(username, password, headers) {
							$log.debug('login event');

							// record the credentials
							setCredentials(username, password);

							var deferred = $q.defer();

							/**
							* Process the response, and if there are any issues
							* the reject the promise
							*/
							function processResponse() {
								/* jshint validthis: true */
								if (this.status !== 200) {
									deferred.reject();
								} else {
									deferred.resolve();
								}
							}

							// don't use $http to avoid circular reference, so
							// directly use XMLHttpRequest and $q
							var promise = deferred.promise;
							var request = new XMLHttpRequest();
							request.onload = processResponse;
							request.open('GET', authDefaults.authenticateUrl);
							request.setRequestHeader('Accept', 'application/json');
							request.setRequestHeader('Authorization', getAuth());
							for (var key in this.headers) {
							  if (this.headers.hasOwnProperty(key)) {
									request.setRequestHeader(key, this.headers[key]);
							  }
							}
							request.send(null);

							/**
							* Allow subscribers to the promise to add a
							* success function to the login event
							*/
							promise.success = function(fn) {
								promise.then(function() {
									fn();
								});
								return promise;
							};

							/**
							* Allow subscribers to the promise to add
							* an error function to the login event
							*/
							promise.error = function(fn) {
								promise.then(null, function() {
									fn();
								});
								return promise;
							};

							/**
							* Handle the promise being rejected or resolved
							*/
							promise.then(function () {
								// we've confirmed credentials match a user
								$log.debug('Successfully authenticated');
								$rootScope.$broadcast('login', username);
							}, function () {
								// some error in credential check
								$log.debug('Test authentication failed');
								logout();
								$rootScope.$broadcast('authentication-failed', username);
							});

							return promise;
						}
					};
				}
			]
		);
	})();

	// add the interceptor to the http service
	angularBasicAuth.config(['$httpProvider', function($httpProvider) {
		$httpProvider.interceptors.push('authInterceptor');
	}]);

})();
