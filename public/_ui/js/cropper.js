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
		var $catlinks = $('#catnav').find('a');

		this.canvasCropper = new CanvasCropper($canvas);

		$catlinks.on('click', function(e){
			e.preventDefault();
			var imgSrc = $(this).data('href');
			self.canvasCropper.setImgSrc(imgSrc);
		});


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
		imgSrc: '' //str: path to image src
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

		if (this.options.imgSrc) {
			this.setImgSrc(this.options.imgSrc);
		}
		

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

	setImgSrc: function(imgSrc){
		var self = this;
		var newImg = new Image();
		//this.srcImg = new Image();
		newImg.onload = function(){
			self.srcImg = newImg;
			self.drawCanvas();
			self.drawCropTool();
		};
		newImg.src = imgSrc;

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
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvY2hyaXNuL1NpdGVzL0dpdEh1Yi9jbmVsc29uODcvY2FudmFzLWNyb3BwZXIvc3JjL3NjcmlwdHMvaW5pdGlhbGl6ZS5qcyIsIi9Vc2Vycy9jaHJpc24vU2l0ZXMvR2l0SHViL2NuZWxzb244Ny9jYW52YXMtY3JvcHBlci9zcmMvc2NyaXB0cy9BcHBsaWNhdGlvbi5qcyIsIi9Vc2Vycy9jaHJpc24vU2l0ZXMvR2l0SHViL2NuZWxzb244Ny9jYW52YXMtY3JvcHBlci9zcmMvc2NyaXB0cy93aWRnZXRzL0NhbnZhc0Nyb3BwZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEFwcGxpY2F0aW9uIEluaXRpYWxpemVyXG4gKiBcbiAqIEBhdXRob3IgQ2hyaXMgTmVsc29uXG4gKiBAc2luY2UgIDguNS4xM1xuICovXG5cbnZhciBBcHBsaWNhdGlvbiA9IHJlcXVpcmUoJy4vQXBwbGljYXRpb24nKTtcblxuJChmdW5jdGlvbigpIHtcblxuXHQvLyBJbml0aWFsaXplIEFwcGxpY2F0aW9uXG5cdEFwcGxpY2F0aW9uLmluaXRpYWxpemUoKTtcblxufSk7IiwiLyoqXG4gKiBBcHBsaWNhdGlvbiBCb290c3RyYXBwZXJcbiAqIFxuICogQGF1dGhvciBDaHJpcyBOZWxzb25cbiAqIEBzaW5jZSAgOC41LjEzXG4gKi9cblxudmFyIENhbnZhc0Nyb3BwZXIgPSByZXF1aXJlKCcuL3dpZGdldHMvQ2FudmFzQ3JvcHBlcicpO1xuXG52YXIgQXBwbGljYXRpb24gPSB7XG5cblx0LyoqXG5cdCAqIEluaXRpYWxpemUgdGhlIGFwcFxuXHQgKiovXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCkge1xuXHRcdC8vY29uc29sZS5sb2coJ0FwcGxpY2F0aW9uOmluaXRpYWxpemUnKTtcblx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cblx0XHR0aGlzLiR3aW5kb3cgPSAkKHdpbmRvdyk7XG5cdFx0dGhpcy4kZG9jdW1lbnQgPSAkKGRvY3VtZW50KTtcblx0XHR0aGlzLiRodG1sID0gJCgnaHRtbCcpO1xuXHRcdHRoaXMuJGJvZHkgPSAkKCdib2R5Jyk7XG5cblx0XHR2YXIgJGNhbnZhcyA9ICQoJyNjYW52YXMtY3JvcHBlcicpLmZpbmQoJ2NhbnZhcycpO1xuXHRcdHZhciAkY2F0bGlua3MgPSAkKCcjY2F0bmF2JykuZmluZCgnYScpO1xuXG5cdFx0dGhpcy5jYW52YXNDcm9wcGVyID0gbmV3IENhbnZhc0Nyb3BwZXIoJGNhbnZhcyk7XG5cblx0XHQkY2F0bGlua3Mub24oJ2NsaWNrJywgZnVuY3Rpb24oZSl7XG5cdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHR2YXIgaW1nU3JjID0gJCh0aGlzKS5kYXRhKCdocmVmJyk7XG5cdFx0XHRzZWxmLmNhbnZhc0Nyb3BwZXIuc2V0SW1nU3JjKGltZ1NyYyk7XG5cdFx0fSk7XG5cblxuXHR9XG5cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQXBwbGljYXRpb247XG4iLCJcbnZhciBDYW52YXNDcm9wcGVyID0gZnVuY3Rpb24oJGNhbnZhcywgb2JqT3B0aW9ucyl7XG5cblx0dGhpcy4kY2FudmFzID0gJGNhbnZhcztcblx0dGhpcy5jYW52YXMgPSAkY2FudmFzWzBdO1xuXG5cdHRoaXMub3B0aW9ucyA9ICQuZXh0ZW5kKHtcblx0XHRzZWxlY3RvckV4cG9ydEJ0bjogJyNidG4tZXhwb3J0Jyxcblx0XHRzZWxlY3RvckV4cG9ydEltZzogJyNpbWctZXhwb3J0Jyxcblx0XHRmaWxsU3R5bGU6ICdyZ2JhKDAsMCwwLDAuNSknLFxuXHRcdHN0cm9rZVN0eWxlOiAnIzAwMCcsXG5cdFx0bGluZVdpZHRoOiAyLFxuXHRcdGNyb3BYOiAxNjAsXG5cdFx0Y3JvcFk6IDEyMCxcblx0XHRjcm9wVzogMzIwLFxuXHRcdGNyb3BIOiAyNDAsXG5cdFx0aW1nU3JjOiAnJyAvL3N0cjogcGF0aCB0byBpbWFnZSBzcmNcblx0fSwgb2JqT3B0aW9ucyB8fCB7fSk7XG5cblx0dGhpcy5jb250ZXh0ID0gdGhpcy5jYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblx0dGhpcy5jb250ZXh0LnN0cm9rZVN0eWxlID0gdGhpcy5vcHRpb25zLnN0cm9rZVN0eWxlO1xuXHR0aGlzLmNvbnRleHQubGluZVdpZHRoID0gdGhpcy5vcHRpb25zLmxpbmVXaWR0aDtcblx0Ly93aHkgaXMgdGhpcyBuZWVkZWQ/XG5cdC8vdGhpcy5pbWdEYXRhID0gdGhpcy5jb250ZXh0LmdldEltYWdlRGF0YSgwLCAwLCB0aGlzLndpZHRoLCB0aGlzLmhlaWdodCk7XG5cblx0dGhpcy53ID0gdGhpcy5jYW52YXMud2lkdGg7XG5cdHRoaXMuaCA9IHRoaXMuY2FudmFzLmhlaWdodDtcblxuXHR0aGlzLmNyb3BEYXRhID0ge1xuXHRcdHg6IHRoaXMub3B0aW9ucy5jcm9wWCxcblx0XHR5OiB0aGlzLm9wdGlvbnMuY3JvcFksXG5cdFx0dzogdGhpcy5vcHRpb25zLmNyb3BXLFxuXHRcdGg6IHRoaXMub3B0aW9ucy5jcm9wSFxuXHR9O1xuXG5cdHRoaXMuJHhCdG4gPSAkKHRoaXMub3B0aW9ucy5zZWxlY3RvckV4cG9ydEJ0bik7XG5cdHRoaXMuJHhJbWcgPSAkKHRoaXMub3B0aW9ucy5zZWxlY3RvckV4cG9ydEltZyk7XG5cblx0dGhpcy5faW5pdCgpO1xuXG59O1xuXG5DYW52YXNDcm9wcGVyLnByb3RvdHlwZSA9IHtcblxuLyoqXG4qXHRQcml2YXRlIE1ldGhvZHNcbioqL1xuXHRfaW5pdDogZnVuY3Rpb24oKXtcblx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cblx0XHR0aGlzLl9iaW5kRXZlbnRzKCk7XG5cblx0XHRpZiAodGhpcy5vcHRpb25zLmltZ1NyYykge1xuXHRcdFx0dGhpcy5zZXRJbWdTcmModGhpcy5vcHRpb25zLmltZ1NyYyk7XG5cdFx0fVxuXHRcdFxuXG5cdH0sXG5cblx0X2JpbmRFdmVudHM6IGZ1bmN0aW9uKCl7XG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xuXG5cblx0XHR0aGlzLiR4QnRuLm9uKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcblx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHRcdHNlbGYuZXhwb3J0SW1nKCk7XG5cdFx0fSk7XG5cblxuXHR9LFxuXG5cbi8qKlxuKlx0RXZlbnQgSGFuZGxlcnNcbioqL1xuXG5cblxuXG4vKipcbipcdFB1YmxpYyBBUElcbioqL1xuXG5cdHNldEltZ1NyYzogZnVuY3Rpb24oaW1nU3JjKXtcblx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cdFx0dmFyIG5ld0ltZyA9IG5ldyBJbWFnZSgpO1xuXHRcdC8vdGhpcy5zcmNJbWcgPSBuZXcgSW1hZ2UoKTtcblx0XHRuZXdJbWcub25sb2FkID0gZnVuY3Rpb24oKXtcblx0XHRcdHNlbGYuc3JjSW1nID0gbmV3SW1nO1xuXHRcdFx0c2VsZi5kcmF3Q2FudmFzKCk7XG5cdFx0XHRzZWxmLmRyYXdDcm9wVG9vbCgpO1xuXHRcdH07XG5cdFx0bmV3SW1nLnNyYyA9IGltZ1NyYztcblxuXHR9LFxuXG5cdGRyYXdDYW52YXM6IGZ1bmN0aW9uKCl7XG5cdFx0dGhpcy5jb250ZXh0LmNsZWFyUmVjdCgwLCAwLCB0aGlzLncsIHRoaXMuaCk7IC8vIGNsZWFyIGNhbnZhc1xuXHRcdHRoaXMuY29udGV4dC5kcmF3SW1hZ2UodGhpcy5zcmNJbWcsIDAsIDApO1xuXHRcdHRoaXMuY29udGV4dC5maWxsU3R5bGUgPSB0aGlzLm9wdGlvbnMuZmlsbFN0eWxlO1xuXHRcdHRoaXMuY29udGV4dC5maWxsUmVjdCgwLCAwLCB0aGlzLncsIHRoaXMuaCk7XG5cdH0sXG5cblx0ZHJhd0Nyb3BUb29sOiBmdW5jdGlvbigpe1xuXHRcdHRoaXMuY29udGV4dC5zdHJva2VSZWN0KHRoaXMuY3JvcERhdGEueCwgdGhpcy5jcm9wRGF0YS55LCB0aGlzLmNyb3BEYXRhLncsIHRoaXMuY3JvcERhdGEuaCk7XG5cdFx0dGhpcy5jb250ZXh0LmRyYXdJbWFnZSh0aGlzLnNyY0ltZywgdGhpcy5jcm9wRGF0YS54LCB0aGlzLmNyb3BEYXRhLnksIHRoaXMuY3JvcERhdGEudywgdGhpcy5jcm9wRGF0YS5oLCB0aGlzLmNyb3BEYXRhLngsIHRoaXMuY3JvcERhdGEueSwgdGhpcy5jcm9wRGF0YS53LCB0aGlzLmNyb3BEYXRhLmgpO1xuXHR9LFxuXG5cdGV4cG9ydEltZzogZnVuY3Rpb24oKXtcblx0XHR2YXIgdGVtcENhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuXHRcdHZhciB0ZW1wQ29udGV4dCA9IHRlbXBDYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblx0XHR2YXIgZGF0YVVybDtcblxuXHRcdHRlbXBDYW52YXMud2lkdGggPSB0aGlzLmNyb3BEYXRhLnc7XG5cdFx0dGVtcENhbnZhcy5oZWlnaHQgPSB0aGlzLmNyb3BEYXRhLmg7XG5cdFx0dGVtcENvbnRleHQuZHJhd0ltYWdlKHRoaXMuc3JjSW1nLCB0aGlzLmNyb3BEYXRhLngsIHRoaXMuY3JvcERhdGEueSwgdGhpcy5jcm9wRGF0YS53LCB0aGlzLmNyb3BEYXRhLmgsIDAsIDAsIHRoaXMuY3JvcERhdGEudywgdGhpcy5jcm9wRGF0YS5oKTtcblx0XHRkYXRhVXJsID0gdGVtcENhbnZhcy50b0RhdGFVUkwoJ2ltYWdlL3BuZycpO1xuXG5cdFx0dGhpcy4keEltZy5hdHRyKHsnc3JjJzogZGF0YVVybH0pO1xuXG5cdH1cblxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBDYW52YXNDcm9wcGVyO1xuIl19
;