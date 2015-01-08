var λ = require('livewire');
var http = require('http');
var handle = require('oban');
var ρ = require('dram');
var Nedb = require('nedb');
var σ = require('highland');
var corps = require('corps');
var browserify = require('browserify');

var db = new Nedb({
	filename: 'browserifun.db',
	autoload: true
});

function δ(method) {
	return σ.wrapCallback(db[method].bind(db));
}

var server = http.createServer(handle(λ.route([
	λ.get('/', function() {
		return δ('find')({}).map(function(docs) {
			return docs.map(function(doc) {
				return '<div>' + doc.created + ': ' + '<a href="/' + doc._id + '">' + doc._id + '</a></div>';
			});
		}).flatMap(ρ.html);
	}),

	λ.post('/', function(req) {
		return corps.raw(req).flatMap(function(src) {
			return δ('insert')({
				src: src.toString('utf8'),
				created: new Date()
			});
		}).flatMap(function(doc) {
			return ρ.found('/' + doc._id, '');
		});
	}),

	λ.get('/:id.js', function(req) {
		return δ('findOne')({
			_id: req.params.id
		}).flatMap(function(doc) {
			return σ(browserify(σ([doc.src])).bundle());
		});
	}),

	λ.get('/:id', function(req) {
		return ρ.html('<script src="/' + req.params.id + '.js"></script>');
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