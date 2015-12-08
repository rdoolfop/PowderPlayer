var Trakt = require('trakt.tv');
var trakttv = new Trakt({
    client_id: window.atob('MTBkYTI2ZGYwYmI4NzQ5MTY5OTQ4YzU3ODJjYmEyZjMxZDJlNWQ0N2I1NzNlNGFjZDE1MzgwN2U3NjFlZWRjYQ=='),
    client_secret: window.atob('MGE4Y2E2ZjIxNGUzN2JiYmIwOTcxOGI5MGU2NjE0YzRlZDlmYmIxZDkwZmEwOWVlZjZiMmE1MTcwMTY4YWQ5MA==')
});
var trakt = {};
	
trakt.loggedIn = false;
	
// this allows the user to open trakt in browser, log in, authorize powder & get a pin
// TODO: openExternal() to replace by smth to open 'url' in default browser (or new window)
trakt.openTraktAuth = () => {
	var url = trakttv.get_url();
	console.log('url: '+url);
	require('electron').shell.openExternal(url);
};

// this will exchange user's pasted pin for a set of tokens
// @param pin = the pin the user pasted back in powder
trakt.exchangePin = pin => {
	trakttv.exchange_code(pin).then( result => {
		console.log(trakttv.export_token());
		localStorage.traktTokens = JSON.stringify(trakttv.export_token()); // store tokens in app
		trakt.loggedIn = true;
	}).catch( err => {
		console.error('Trakt exchange pin failed', err);
		trakt.loggedIn = false;
	});
};

// this is called on app start to relogin user
// TODO: use a promise to know if user is logged in or not (to change settings accordingly)
trakt.autoLogin = () => {
	if (!localStorage.traktTokens || localStorage.traktTokens == '') {
		throw new Error('This is not how this works, this is not how any of this works!');
	}
	trakttv.import_token(JSON.parse(localStorage.traktTokens)).then( tokens => {
		localStorage.traktTokens = JSON.stringify(tokens); // store tokens in app
		trakt.loggedIn = true;
	}).catch( err => {
		console.error('Trakt auto login failed', err);
		trakt.loggedIn = false;
	});
};
	
trakt.addToHistory = (id, type) => {
	var item = {};
	item[type + 's'] = [{
		ids: {
			imdb: id
		}
	}];
	trakttv.sync.history.add(item).catch( err => {
		console.error('Trakt add to history failed', err);
	});
};
	
trakt.logOut = () => {
	trakttv._authentication = {};
	delete localStorage.traktTokens;
	trakt.loggedIn = false;
};

// call to scrobble
// @param state = 'start', 'pause', 'stop';
// @param percent = float between 1-100 of progress percentage
// @param id = the imdbid of the movie/episode
// @param type = 'movie' or 'episode';
trakt.scrobble = (state, percent, id, type) => {
	var item = {
		progress: percent
	};
	item[type] = {
		ids: {
			imdb: id
		}
	};
	trakttv.scrobble[state](item).catch( err => {
		console.error('Trakt scrobble failed', err);
	});
};

// search on trakt
// RETURNS A PROMISE ATM
// todo: parse here?
// todo: cleanse 'query' before searching?
trakt.search = query => {
	return trakttv.search(query);
}

trakt.movieInfo = trakttv.movies.summary;

trakt.episodeInfo = trakttv.episodes.summary;

trakt.summary = query => {
	if (query.type == 'movie') {
		return trakttv.movies.summary({ id: query.imdb, id_type: 'imdb', extended: query.extended });
	} else if (query.type == 'series') {
		return trakttv.episodes.summary({ id: query.imdb, id_type: 'imdb', season: query.season, episode: query.episode[0], extended: query.extended });
	}
	return false;
}

module.exports = trakt;