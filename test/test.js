
'use strict';

describe('basic auth service', function () {


	describe('MODULE_VERSION', function() {

		var MODULE_VERSION;

		beforeEach(module('angularBasicAuth'));

		beforeEach(inject(function(_MODULE_VERSION_) {
			MODULE_VERSION = _MODULE_VERSION_;
		}));

		it('should be a string', function () {
			expect(typeof MODULE_VERSION).toBe('string');
		});
	});

	describe('authDefaults', function() {

		var authDefaults;

		beforeEach(module('angularBasicAuth'));

		beforeEach(inject(function (_authDefaults_) {
			authDefaults = _authDefaults_;
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
			var httpBackend;
			var http;

			beforeEach(module('angularBasicAuth'));

			beforeEach(inject(function (_authService_, $httpBackend, $http) {
				authService = _authService_;
				httpBackend = $httpBackend;
				http = $http;
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
			var httpBackend;
			var http;

			beforeEach(module('angularBasicAuth'));

			beforeEach(inject(function (_authService_, $httpBackend, $http) {
				authService = _authService_;
				httpBackend = $httpBackend;
				http = $http;
			}));

			it('#getAuth should return null', function() {
				expect(authService.getAuth()).toBeNull();
			});

			it('#username should return null', function() {
				expect(authService.username()).toBeNull();
			});

			it('an http request should not have an Authorization header', function() {

				httpBackend.expectGET('/fred').respond(function(method, url, data, headers) {
					expect(headers.Authorization).toBeUndefined();
					return [200, ''];
				});

				http.get('/fred');
				httpBackend.flush();
			});
		});

		describe('logging in with incorrect credentials', function() {

			var authService;
			var httpBackend;
			var http;

			beforeEach(module('angularBasicAuth'));

			beforeEach(inject(function (_authService_, $httpBackend, $http) {
				authService = _authService_;
				httpBackend = $httpBackend;
				http = $http;
			}));


			it('should invoke a request to /api/authenticate with a header', function() {

				httpBackend.expectGET('/api/authenticate').respond(function(method, url, data, headers) {
					console.log(url);

					expect(headers.Authorization).toBeUndefined();
					return [401, ''];
				});

				authService.login('ian@me', 'fred')
				.success(function() {

				})
				.error(function() {
					expect(false).toBe(true);
				});

				httpBackend.flush();

			});
		});
	});
});
