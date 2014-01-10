
var Application = require('./Application');

var CanvasApp = require('./app/CanvasApp');

$(function() {
	if ($('body').hasClass('backbone-page')) {
		new CanvasApp();
	} else {
		Application.initialize();
	}
});
