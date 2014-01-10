
var CanvasCropper = require('../views/CanvasCropper');

var CanvasApp = Backbone.View.extend({

	collection: null,

	template: null,

	events: {

	},

	initialize: function() {


		this.canvasCropper = new CanvasCropper({
			el: '#canvas-cropper',
			imgSrc: '/data/fat-cat.png',
			cropWidth: 160,
			cropHeight: 120
		});

	},

	render: function() {


	}

});

module.exports = CanvasApp;
