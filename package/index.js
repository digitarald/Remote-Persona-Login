(function app() {
	'use strict';

	/**
	 * Remote origin for iframe
	 * @type {string}
	 */
	var REMOTE_ORIGIN = 'http://localhost:8080';

	/**
	 * Previously used email
	 * @type {string|null}
	 */
	var email = localStorage.getItem('email') || null;

	// Shared states
	var remoteFrame = null;
	var remote = null;

	// DOM
	var $log = document.getElementById('list-log');
	var $email = document.getElementById('list-log');
	var $btnLogin = document.getElementById('btn-login');
	var $btnLogout = document.getElementById('btn-logout');

	/**
	 * Load remote frame
	 * @param {Function} Done callback
	 */
	function loadRemote() {
		remoteFrame = document.createElement('iframe');
		remoteFrame.style.height = '1px';
		remoteFrame.onerror = function() {
			log('[Remote] Network Error');
		};
		remoteFrame.onload = function() {
			log('[Remote] Loaded DOM');
		};
		remoteFrame.src = REMOTE_ORIGIN + '/index.html';
		document.body.appendChild(remoteFrame);
		log('[Remote] Injected: ' + REMOTE_ORIGIN);
	}

	/**
	 * Send payload to remote window
	 * @param {object} Payload
	 */
	function toRemote(payload) {
		remote.postMessage(JSON.stringify(payload), REMOTE_ORIGIN);
	}

	function verify(assertion) {
		var req = new XMLHttpRequest({
			mozSystem: true
		});
		req.open('POST', 'https://verifier.login.persona.org/verify', true);

		req.addEventListener('load', function() {
			if (req.status != 200) {
				log('Verify request failed with bad status');
				return;
			}
			var response = JSON.parse(req.responseText);
			if (response.status != 'okay') {
				log('[Verify] Invalid assertion: ' + response.reason);
				return;
			}
			log('[Verify] Verified ' + response.email + ' for ' +
				response.audience + '. Issued by ' + response.issuer + ', valid until ' + response.expires);

			loginByEmail(response.email, true);
		})
		req.addEventListener('error', function() {
			log('[Verify] Request errored');
		});

		var data = 'assertion=' + encodeURIComponent(assertion) + '&audience=' + encodeURIComponent(REMOTE_ORIGIN);
		log('[Verify] Sending');
		req.send(data);
	}

	function loginByEmail(email, store) {
		if (store) {
			localStorage.setItem('email', email);
		}
		$email.textContent = email;
		document.documentElement.classList.add('state-loggedin');
	}

	function logout() {
		localStorage.removeItem('email');
		$email.textContent = '[none]';
		document.documentElement.classList.remove('state-loggedin');
	}

	window.addEventListener('message', function fromRemote(evt) {
		if (evt.origin != REMOTE_ORIGIN) {
			console.warn('Ignored message from ' + evt.origin);
			return;
		}
		evt.stopPropagation();
		var payload = JSON.parse(evt.data);

		switch (payload.event) {
			case 'load':
				log('[Remote] Loaded scripts');
				remote = remoteFrame.contentWindow;
				toRemote({
					event: 'setup',
					loggedInUser: email
				});
				break;
			case 'ready':
				log('[Persona] Ready');
				document.documentElement.classList.add('state-ready');
				break;
			case 'login':
				log('[Persona] Logged in');
				var assertion = payload.assertion;
				verify(assertion);
				break;
			case 'logout':
				log('[Persona] Logged out');
				logout();
				break;
		}
	}, false);

	$btnLogin.addEventListener('click', function(evt) {
		evt.preventDefault();
		log('[Remote] Message: login');
		toRemote({
			event: 'login'
		});
	});
	$btnLogout.addEventListener('click', function(evt) {
		evt.preventDefault();
		log('[Remote] Message: logout');
		toRemote({
			event: 'logout'
		});
	});

	log('App starting up ' + location.origin);

	// Update UI
	if (email) {
		loginByEmail(email);
	}

	loadRemote();

	// Utility logs
	function log(msg) {
		console.log(msg);
		var $item = document.createElement('li');
		$item.textContent = msg;
		$log.insertBefore($item, $log.firstChild);
	}


})();