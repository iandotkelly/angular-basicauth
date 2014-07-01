
'use strict';

describe('basic auth service', function () {

	describe('MODULE_VERSION', function() {

		var MODULE_VERSION;

		beforeEach(module('angularBasicAuth'));

		beforeEach(inject(function($injector) {
			MODULE_VERSION = $injector.get('MODULE_VERSION');
		}));

		it('should be a string', function () {
			expect(typeof MODULE_VERSION).toBe('string');
		});

	});

	describe('authDefaults', function() {

		var authDefaults;

		beforeEach(module('angularBasicAuth'));

		beforeEach(inject(function ($injector) {
			authDefaults = $injector.get('authDefaults');
		}));

		it('should be an object', function () {
			expect(typeof authDefaults).toBe('object');
		});

		it('should have an authenticateUrl property', function() {
			expect(authDefaults.authenticateUrl).toBeDefined();
			expect(typeof authDefaults.authenticateUrl).toBe('string');
		});

		it('should have an sessonMinutes property', function() {
			expect(authDefaults.sessionMinutes).toBeDefined();
			expect(typeof authDefaults.sessionMinutes).toBe('number');
		});

	});

	describe('authService', function() {

		describe('uninitialized', function() {

			var authService;

			beforeEach(module('angularBasicAuth'));

			beforeEach(inject(function ($injector) {
				authService = $injector.get('authService');
			}));

			it('should be an onbject', function () {
				expect(typeof authService).toBe('object');
			});

			it('shoud have a defined api', function () {
				expect(typeof authService.login).toBe('function');
				expect(typeof authService.logout).toBe('function');
				expect(typeof authService.username).toBe('function');
				expect(typeof authService.getAuth).toBe('function');
				expect(typeof authService.activity).toBe('function');
				expect(typeof authService.handleAuthFailure).toBe('function');
			});

		});

		describe('before credentials', function() {

			var authService;
			var $httpBackend;
			var $http;

			beforeEach(module('angularBasicAuth'));

			beforeEach(inject(function ($injector) {
				$httpBackend = $injector.get('$httpBackend');
				$httpBackend.resetExpectations();
				$http = $injector.get('$http');
				authService = $injector.get('authService');
			}));

			afterEach(function() {
				$httpBackend.verifyNoOutstandingExpectation ();
				$httpBackend.verifyNoOutstandingRequest ();
				$httpBackend.resetExpectations();
			});

			it('#getAuth should return null', function() {
				expect(authService.getAuth()).toBeNull();
			});

			it('#username should return null', function() {
				expect(authService.username()).toBeNull();
			});

			it('an http request should not have an Authorization header', function() {

				$httpBackend.expectGET('/fred').respond(function(method, url, data, headers) {
					expect(headers.Authorization).toBeUndefined();
					return [200, ''];
				});

				$http.get('/fred');
				$httpBackend.flush();
			});
		});

		describe('logging in with incorrect credentials', function() {

			var authService;
			var server;
			var $rootScope;

			beforeEach(module('angularBasicAuth'));

			beforeEach(inject(function ($injector) {
				authService = $injector.get('authService');
				$rootScope = $injector.get('$rootScope');

				// cannot use $httpBackend as the service bypasses $http
				// for the authenticate calls to avoid a circular reference
				// so use the sinon fake server API
				server = sinon.fakeServer.create();
			}));

			afterEach(function() {
				server.restore();
			});

			it('should invoke a request to /api/authenticate with a header', function(done) {

				server.respondWith(function(request) {
					expect(request.requestHeaders.Authorization).toBe('Basic aWFuQG1lOmZyZWQ=');
					request.respond(401, {}, '');
					done();
				});

				authService.login('ian@me', 'fred');
				server.respond();
			});

			it('should call the error function of the promise', function(done) {

				server.respondWith(function(request) {
					request.respond(401, {}, '');
				});

				authService.login('ian@me', 'fred').success(function() {
					// this should not be called
					expect(true).toBe(false);
					done();
				}).error(function() {
					// hurrah
					expect(authService.username()).toBeNull();
					expect(authService.getAuth()).toBeNull();
					done();
				});

				server.respond();
				$rootScope.$apply();
			});

			it('should emit the correct events from $rootScope', function(done) {

				server.respondWith(function(request) {
					request.respond(401, {}, '');
				});

				authService.login('ian@me', 'fred');

				$rootScope.$on('login', function() {
					// this should not be called
					expect(true).toBe(false);
					done();
				});

				$rootScope.$on('authentication-failed', function() {
					done();
				});

				server.respond();
				$rootScope.$apply();
			});
		});

		describe('logging in with correct credentials', function() {

			var authService;
			var server;
			var $rootScope;

			beforeEach(module('angularBasicAuth'));

			beforeEach(inject(function ($injector) {
				authService = $injector.get('authService');
				$rootScope = $injector.get('$rootScope');

				// cannot use $httpBackend as the service bypasses $http
				// for the authenticate calls to avoid a circular reference
				// so use the sinon fake server API
				server = sinon.fakeServer.create();
			}));

			afterEach(function() {
				server.restore();
			});

			it('should invoke a request to /api/authenticate with a header', function(done) {

				server.respondWith(function(request) {
					expect(request.requestHeaders.Authorization).toBe('Basic aWFuQG1lOmZyZWQ=');
					request.respond(200, {}, '');
					done();
				});

				authService.login('ian@me', 'fred');
				server.respond();
			});

			it('should call the success function of the promise and record user', function(done) {

				server.respondWith(function(request) {
					request.respond(200, {}, '');
				});

				authService.login('ian@me', 'fred').success(function() {
					// hurrah
					expect(authService.username()).toBe('ian@me');
					expect(authService.getAuth()).toBe('Basic aWFuQG1lOmZyZWQ=');
					done();
				}).error(function() {
					// this should not be called
					expect(true).toBe(false);
					done();
				});

				server.respond();
				$rootScope.$apply();
			});

			it('should emit the correct events from $rootScope', function(done) {

				server.respondWith(function(request) {
					request.respond(200, {}, '');
				});

				authService.login('ian@me', 'fred');

				$rootScope.$on('login', function() {
					done();
				});

				$rootScope.$on('authentication-failed', function() {
					// this should not be called
					expect(true).toBe(false);
					done();
				});

				server.respond();
				$rootScope.$apply();
			});
		});


		describe('after valid credentials', function() {

			var authService;
			var $httpBackend;
			var $http;

			beforeEach(module('angularBasicAuth'));

			beforeEach(inject(function ($injector) {
				$httpBackend = $injector.get('$httpBackend');
				$httpBackend.resetExpectations();
				$http = $injector.get('$http');
				authService = $injector.get('authService');
			}));

			afterEach(function() {
				$httpBackend.verifyNoOutstandingExpectation ();
				$httpBackend.verifyNoOutstandingRequest ();
				$httpBackend.resetExpectations();
			});

			it('#getAuth should return the auth string', function() {
				expect(authService.getAuth()).toBe('Basic aWFuQG1lOmZyZWQ=');
			});

			it('#username should return the username', function() {
				expect(authService.username()).toBe('ian@me');
			});

			it('an http request should have an Authorization header', function() {

				$httpBackend.expectGET('/fred').respond(function(method, url, data, headers) {
					expect(headers.Authorization).toBe('Basic aWFuQG1lOmZyZWQ=');
					return [200, ''];
				});

				$http.get('/fred');
				$httpBackend.flush();
			});
		});

	});
});
