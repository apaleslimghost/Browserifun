var λ = require('livewire');
var http = require('http');
var handle = require('oban');
var ρ = require('dram');
var Nedb = require('nedb');
var σ = require('highland');
var corps = require('corps');
var browserify = require('browserify');
var n = require('npm');
var npm = n.commands;
var detective = require('detective');

n.load({});

var db = new Nedb({
	filename: 'browserifun.db',
	autoload: true
});

function δ(method) {
	return σ.wrapCallback(db[method].bind(db));
}

var redirectToDoc = σ.flatMap(function(doc) {
	return ρ.found('/' + doc._id, '');
});

var docsList = σ.map(function(docs) {
	return docs.map(function(doc) {
		return '<div>' + doc.updated + ': ' + '<a href="/' + doc._id + '">' + doc._id + '</a></div>';
	});
});

var toHtml = σ.flatMap(ρ.html);

var server = http.createServer(handle(λ.route([
	λ.get('/', function() {
		return δ('find')({})
			.through(docsList)
			.through(toHtml);
	}),

	λ.post('/', function(req) {
		return corps.raw(req).flatMap(function(src) {
			return δ('insert')({
				src: src.toString('utf8'),
				updated: new Date()
			});
		}).through(redirectToDoc);
	}),

	λ.put('/:id', function(req) {
		return corps.raw(req).flatMap(function(src) {
			return δ('update')({
				_id: req.params.id
			}, {
				src: src.toString('utf8'),
				updated: new Date()
			});
		}).flatMap(function(doc) {
			return ρ.found('/' + req.params.id, '');
		});
	}),

	λ.get('/:id.js', function(req) {
		var b = browserify();

		return δ('findOne')({
			_id: req.params.id
		}).flatMap(function(doc) {
			return σ.wrapCallback(npm.install)(detective(doc.src)).flatMap(function() {
				return σ([doc.src]);
			});
		}).flatMap(function(src) {
			return σ(browserify(σ([src])).bundle());
		}).collect().map(function(xs) {
			return xs.join('');
		}).flatMap(ρ.type('application/javascript'));
	}),

	λ.get('/:id', function(req) {
		return ρ.html('<body><script src="/' + req.params.id + '.js"></script></body>');
	}),

	λ.delete('/:id', function(req) {
		return δ('remove')({
			_id: req.params.id
		}, {}).flatMap(function() {
			return ρ.withStatus(204, '');
		});
	})
])));

server.listen(process.env.PORT || 8000);