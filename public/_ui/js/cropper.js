;(function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){
/**
 * Application Initializer
 * 
 * @author Chris Nelson
 * @since  8.5.13
 */

var Application = require('./Application');

$(function() {

	// Initialize Application
	Application.initialize();

});
},{"./Application":2}],2:[function(require,module,exports){
/**
 * Application Bootstrapper
 * 
 * @author Chris Nelson
 * @since  8.5.13
 */

var CanvasCropper = require('./widgets/CanvasCropper');

var Application = {

	/**
	 * Initialize the app
	 **/
	initialize: function() {
		//console.log('Application:initialize');
		var self = this;

		this.$window = $(window);
		this.$document = $(document);
		this.$html = $('html');
		this.$body = $('body');

		var $canvas = $('#canvas-cropper').find('canvas');

		this.canvasCropper = new CanvasCropper($canvas);

	}

};

module.exports = Application;

},{"./widgets/CanvasCropper":3}],3:[function(require,module,exports){

var CanvasCropper = function($canvas, objOptions){

	this.$canvas = $canvas;
	this.canvas = $canvas[0];

	this.options = $.extend({
		selectorExportBtn: '#btn-export',
		selectorExportImg: '#img-export',
		fillStyle: 'rgba(0,0,0,0.5)',
		strokeStyle: '#000',
		lineWidth: 2,
		cropX: 160,
		cropY: 120,
		cropW: 320,
		cropH: 240,
		imgSrc: '/data/cat1.jpg'
	}, objOptions || {});

	this.context = this.canvas.getContext('2d');
	this.context.strokeStyle = this.options.strokeStyle;
	this.context.lineWidth = this.options.lineWidth;
	//why is this needed?
	//this.imgData = this.context.getImageData(0, 0, this.width, this.height);

	this.w = this.canvas.width;
	this.h = this.canvas.height;

	this.cropData = {
		x: this.options.cropX,
		y: this.options.cropY,
		w: this.options.cropW,
		h: this.options.cropH
	};

	this.$xBtn = $(this.options.selectorExportBtn);
	this.$xImg = $(this.options.selectorExportImg);

	this._init();

};

CanvasCropper.prototype = {

/**
*	Private Methods
**/
	_init: function(){
		var self = this;

		this._bindEvents();

		this.setImgSrc();

	},

	_bindEvents: function(){
		var self = this;


		this.$xBtn.on('click', function(e) {
			e.preventDefault();
			self.exportImg();
		});


	},


/**
*	Event Handlers
**/




/**
*	Public API
**/

	setImgSrc: function(){
		var self = this;
		this.srcImg = new Image();
		this.srcImg.onload = function(){
			self.drawCanvas();
			self.drawCropTool();
		};
		this.srcImg.src = this.options.imgSrc;
	},

	drawCanvas: function(){
		this.context.clearRect(0, 0, this.w, this.h); // clear canvas
		this.context.drawImage(this.srcImg, 0, 0);
		this.context.fillStyle = this.options.fillStyle;
		this.context.fillRect(0, 0, this.w, this.h);
	},

	drawCropTool: function(){
		this.context.strokeRect(this.cropData.x, this.cropData.y, this.cropData.w, this.cropData.h);
		this.context.drawImage(this.srcImg, this.cropData.x, this.cropData.y, this.cropData.w, this.cropData.h, this.cropData.x, this.cropData.y, this.cropData.w, this.cropData.h);
	},

	exportImg: function(){
		var tempCanvas = document.createElement('canvas');
		var tempContext = tempCanvas.getContext('2d');
		var dataUrl;

		tempCanvas.width = this.cropData.w;
		tempCanvas.height = this.cropData.h;
		tempContext.drawImage(this.srcImg, this.cropData.x, this.cropData.y, this.cropData.w, this.cropData.h, 0, 0, this.cropData.w, this.cropData.h);
		dataUrl = tempCanvas.toDataURL('image/png');

		this.$xImg.attr({'src': dataUrl});

	}

};

module.exports = CanvasCropper;

},{}]},{},[1])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvY2hyaXNuL1NpdGVzL0dpdEh1Yi9jbmVsc29uODcvY2FudmFzLWNyb3BwZXIvc3JjL3NjcmlwdHMvaW5pdGlhbGl6ZS5qcyIsIi9Vc2Vycy9jaHJpc24vU2l0ZXMvR2l0SHViL2NuZWxzb244Ny9jYW52YXMtY3JvcHBlci9zcmMvc2NyaXB0cy9BcHBsaWNhdGlvbi5qcyIsIi9Vc2Vycy9jaHJpc24vU2l0ZXMvR2l0SHViL2NuZWxzb244Ny9jYW52YXMtY3JvcHBlci9zcmMvc2NyaXB0cy93aWRnZXRzL0NhbnZhc0Nyb3BwZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQXBwbGljYXRpb24gSW5pdGlhbGl6ZXJcbiAqIFxuICogQGF1dGhvciBDaHJpcyBOZWxzb25cbiAqIEBzaW5jZSAgOC41LjEzXG4gKi9cblxudmFyIEFwcGxpY2F0aW9uID0gcmVxdWlyZSgnLi9BcHBsaWNhdGlvbicpO1xuXG4kKGZ1bmN0aW9uKCkge1xuXG5cdC8vIEluaXRpYWxpemUgQXBwbGljYXRpb25cblx0QXBwbGljYXRpb24uaW5pdGlhbGl6ZSgpO1xuXG59KTsiLCIvKipcbiAqIEFwcGxpY2F0aW9uIEJvb3RzdHJhcHBlclxuICogXG4gKiBAYXV0aG9yIENocmlzIE5lbHNvblxuICogQHNpbmNlICA4LjUuMTNcbiAqL1xuXG52YXIgQ2FudmFzQ3JvcHBlciA9IHJlcXVpcmUoJy4vd2lkZ2V0cy9DYW52YXNDcm9wcGVyJyk7XG5cbnZhciBBcHBsaWNhdGlvbiA9IHtcblxuXHQvKipcblx0ICogSW5pdGlhbGl6ZSB0aGUgYXBwXG5cdCAqKi9cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oKSB7XG5cdFx0Ly9jb25zb2xlLmxvZygnQXBwbGljYXRpb246aW5pdGlhbGl6ZScpO1xuXHRcdHZhciBzZWxmID0gdGhpcztcblxuXHRcdHRoaXMuJHdpbmRvdyA9ICQod2luZG93KTtcblx0XHR0aGlzLiRkb2N1bWVudCA9ICQoZG9jdW1lbnQpO1xuXHRcdHRoaXMuJGh0bWwgPSAkKCdodG1sJyk7XG5cdFx0dGhpcy4kYm9keSA9ICQoJ2JvZHknKTtcblxuXHRcdHZhciAkY2FudmFzID0gJCgnI2NhbnZhcy1jcm9wcGVyJykuZmluZCgnY2FudmFzJyk7XG5cblx0XHR0aGlzLmNhbnZhc0Nyb3BwZXIgPSBuZXcgQ2FudmFzQ3JvcHBlcigkY2FudmFzKTtcblxuXHR9XG5cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQXBwbGljYXRpb247XG4iLCJcbnZhciBDYW52YXNDcm9wcGVyID0gZnVuY3Rpb24oJGNhbnZhcywgb2JqT3B0aW9ucyl7XG5cblx0dGhpcy4kY2FudmFzID0gJGNhbnZhcztcblx0dGhpcy5jYW52YXMgPSAkY2FudmFzWzBdO1xuXG5cdHRoaXMub3B0aW9ucyA9ICQuZXh0ZW5kKHtcblx0XHRzZWxlY3RvckV4cG9ydEJ0bjogJyNidG4tZXhwb3J0Jyxcblx0XHRzZWxlY3RvckV4cG9ydEltZzogJyNpbWctZXhwb3J0Jyxcblx0XHRmaWxsU3R5bGU6ICdyZ2JhKDAsMCwwLDAuNSknLFxuXHRcdHN0cm9rZVN0eWxlOiAnIzAwMCcsXG5cdFx0bGluZVdpZHRoOiAyLFxuXHRcdGNyb3BYOiAxNjAsXG5cdFx0Y3JvcFk6IDEyMCxcblx0XHRjcm9wVzogMzIwLFxuXHRcdGNyb3BIOiAyNDAsXG5cdFx0aW1nU3JjOiAnL2RhdGEvY2F0MS5qcGcnXG5cdH0sIG9iak9wdGlvbnMgfHwge30pO1xuXG5cdHRoaXMuY29udGV4dCA9IHRoaXMuY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG5cdHRoaXMuY29udGV4dC5zdHJva2VTdHlsZSA9IHRoaXMub3B0aW9ucy5zdHJva2VTdHlsZTtcblx0dGhpcy5jb250ZXh0LmxpbmVXaWR0aCA9IHRoaXMub3B0aW9ucy5saW5lV2lkdGg7XG5cdC8vd2h5IGlzIHRoaXMgbmVlZGVkP1xuXHQvL3RoaXMuaW1nRGF0YSA9IHRoaXMuY29udGV4dC5nZXRJbWFnZURhdGEoMCwgMCwgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpO1xuXG5cdHRoaXMudyA9IHRoaXMuY2FudmFzLndpZHRoO1xuXHR0aGlzLmggPSB0aGlzLmNhbnZhcy5oZWlnaHQ7XG5cblx0dGhpcy5jcm9wRGF0YSA9IHtcblx0XHR4OiB0aGlzLm9wdGlvbnMuY3JvcFgsXG5cdFx0eTogdGhpcy5vcHRpb25zLmNyb3BZLFxuXHRcdHc6IHRoaXMub3B0aW9ucy5jcm9wVyxcblx0XHRoOiB0aGlzLm9wdGlvbnMuY3JvcEhcblx0fTtcblxuXHR0aGlzLiR4QnRuID0gJCh0aGlzLm9wdGlvbnMuc2VsZWN0b3JFeHBvcnRCdG4pO1xuXHR0aGlzLiR4SW1nID0gJCh0aGlzLm9wdGlvbnMuc2VsZWN0b3JFeHBvcnRJbWcpO1xuXG5cdHRoaXMuX2luaXQoKTtcblxufTtcblxuQ2FudmFzQ3JvcHBlci5wcm90b3R5cGUgPSB7XG5cbi8qKlxuKlx0UHJpdmF0ZSBNZXRob2RzXG4qKi9cblx0X2luaXQ6IGZ1bmN0aW9uKCl7XG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xuXG5cdFx0dGhpcy5fYmluZEV2ZW50cygpO1xuXG5cdFx0dGhpcy5zZXRJbWdTcmMoKTtcblxuXHR9LFxuXG5cdF9iaW5kRXZlbnRzOiBmdW5jdGlvbigpe1xuXHRcdHZhciBzZWxmID0gdGhpcztcblxuXG5cdFx0dGhpcy4keEJ0bi5vbignY2xpY2snLCBmdW5jdGlvbihlKSB7XG5cdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRzZWxmLmV4cG9ydEltZygpO1xuXHRcdH0pO1xuXG5cblx0fSxcblxuXG4vKipcbipcdEV2ZW50IEhhbmRsZXJzXG4qKi9cblxuXG5cblxuLyoqXG4qXHRQdWJsaWMgQVBJXG4qKi9cblxuXHRzZXRJbWdTcmM6IGZ1bmN0aW9uKCl7XG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xuXHRcdHRoaXMuc3JjSW1nID0gbmV3IEltYWdlKCk7XG5cdFx0dGhpcy5zcmNJbWcub25sb2FkID0gZnVuY3Rpb24oKXtcblx0XHRcdHNlbGYuZHJhd0NhbnZhcygpO1xuXHRcdFx0c2VsZi5kcmF3Q3JvcFRvb2woKTtcblx0XHR9O1xuXHRcdHRoaXMuc3JjSW1nLnNyYyA9IHRoaXMub3B0aW9ucy5pbWdTcmM7XG5cdH0sXG5cblx0ZHJhd0NhbnZhczogZnVuY3Rpb24oKXtcblx0XHR0aGlzLmNvbnRleHQuY2xlYXJSZWN0KDAsIDAsIHRoaXMudywgdGhpcy5oKTsgLy8gY2xlYXIgY2FudmFzXG5cdFx0dGhpcy5jb250ZXh0LmRyYXdJbWFnZSh0aGlzLnNyY0ltZywgMCwgMCk7XG5cdFx0dGhpcy5jb250ZXh0LmZpbGxTdHlsZSA9IHRoaXMub3B0aW9ucy5maWxsU3R5bGU7XG5cdFx0dGhpcy5jb250ZXh0LmZpbGxSZWN0KDAsIDAsIHRoaXMudywgdGhpcy5oKTtcblx0fSxcblxuXHRkcmF3Q3JvcFRvb2w6IGZ1bmN0aW9uKCl7XG5cdFx0dGhpcy5jb250ZXh0LnN0cm9rZVJlY3QodGhpcy5jcm9wRGF0YS54LCB0aGlzLmNyb3BEYXRhLnksIHRoaXMuY3JvcERhdGEudywgdGhpcy5jcm9wRGF0YS5oKTtcblx0XHR0aGlzLmNvbnRleHQuZHJhd0ltYWdlKHRoaXMuc3JjSW1nLCB0aGlzLmNyb3BEYXRhLngsIHRoaXMuY3JvcERhdGEueSwgdGhpcy5jcm9wRGF0YS53LCB0aGlzLmNyb3BEYXRhLmgsIHRoaXMuY3JvcERhdGEueCwgdGhpcy5jcm9wRGF0YS55LCB0aGlzLmNyb3BEYXRhLncsIHRoaXMuY3JvcERhdGEuaCk7XG5cdH0sXG5cblx0ZXhwb3J0SW1nOiBmdW5jdGlvbigpe1xuXHRcdHZhciB0ZW1wQ2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG5cdFx0dmFyIHRlbXBDb250ZXh0ID0gdGVtcENhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuXHRcdHZhciBkYXRhVXJsO1xuXG5cdFx0dGVtcENhbnZhcy53aWR0aCA9IHRoaXMuY3JvcERhdGEudztcblx0XHR0ZW1wQ2FudmFzLmhlaWdodCA9IHRoaXMuY3JvcERhdGEuaDtcblx0XHR0ZW1wQ29udGV4dC5kcmF3SW1hZ2UodGhpcy5zcmNJbWcsIHRoaXMuY3JvcERhdGEueCwgdGhpcy5jcm9wRGF0YS55LCB0aGlzLmNyb3BEYXRhLncsIHRoaXMuY3JvcERhdGEuaCwgMCwgMCwgdGhpcy5jcm9wRGF0YS53LCB0aGlzLmNyb3BEYXRhLmgpO1xuXHRcdGRhdGFVcmwgPSB0ZW1wQ2FudmFzLnRvRGF0YVVSTCgnaW1hZ2UvcG5nJyk7XG5cblx0XHR0aGlzLiR4SW1nLmF0dHIoeydzcmMnOiBkYXRhVXJsfSk7XG5cblx0fVxuXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IENhbnZhc0Nyb3BwZXI7XG4iXX0=
;