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

		var $el = $('#canvas-cropper');
		var $catlinks = $('#catnav').find('a');
		var imgSrc = $($catlinks[0]).data('href');

		this.canvasCropper = new CanvasCropper($el, {imgSrc:imgSrc});

		$catlinks.on('click', function(e){
			e.preventDefault();
			var imgSrc = $(this).data('href');
			self.canvasCropper.setImgSrc(imgSrc);
		});


	}

};

module.exports = Application;

},{"./widgets/CanvasCropper":3}],3:[function(require,module,exports){

var CanvasCropper = function($el, objOptions){

	this.$el = $el;

	this.options = $.extend({
		selectorExportBtn: '.canvas-filters .btn-export',
		selectorExportImg: '.canvas-export img',
		selectorFilters: '.canvas-filters input[type=radio]',
		selectorCanvas: '.canvas-holder canvas',
		fillStyle: 'rgba(0,0,0,0.5)',
		strokeStyle: '#000',
		lineWidth: 2,
		imgSrc: '' //str: path to image src
	}, objOptions || {});

	this.$xBtn = this.$el.find(this.options.selectorExportBtn);
	this.$xImg = this.$el.find(this.options.selectorExportImg);

	this.$filters = this.$el.find(this.options.selectorFilters);
	this.$currFltr = this.$filters.filter(':checked');
	if (!this.$currFltr.length) {
		this.$currFltr = $(this.$filters[0]);
		this.$currFltr.prop({'checked':true});
	}

	this.$canvas = this.$el.find(this.options.selectorCanvas);
	this.canvas = this.$canvas[0];

	this.context = this.canvas.getContext('2d');
	this.context.strokeStyle = this.options.strokeStyle;
	this.context.lineWidth = this.options.lineWidth;
	//why is this needed?
	//this.imgData = this.context.getImageData(0, 0, this.width, this.height);

	this.w = this.canvas.width;
	this.h = this.canvas.height;

	this.centerX = this.w / 2;
	this.centerY = this.h / 2;

	this.offset = this.$canvas.offset();

	this.cropData = {w: 0, h: 0, x: 0, y: 0};

	this.bDrag = false;

	this.init();

};

CanvasCropper.prototype = {

	init: function(){
		var self = this;

		this.bindEvents();

		this.setCropData();

		if (this.options.imgSrc) {
			this.setImgSrc(this.options.imgSrc);
		}
		

	},

	bindEvents: function(){
		var self = this;

		this.$xBtn.on('click', function(e) {
			e.preventDefault();
			self.exportImg();
		});

		this.$filters.on('click', function(e) {
			self.$currFltr = $(this);
			self.setCropData();
			self.drawCanvas();
			self.drawCropTool();
		});

		this.$canvas
			.on('mousemove', function(e) {
				console.log('mousemove');
				var canvasOffset = self.$canvas.offset();
				var iMouseX = Math.floor(e.pageX - canvasOffset.left);
				var iMouseY = Math.floor(e.pageY - canvasOffset.top);

				if (self.bDrag) {
					self.cropData.x = iMouseX;
					self.cropData.y = iMouseY;

					self.drawCanvas();
					self.drawCropTool();

				}

			})
			.on('mousedown', function(e) {
				console.log('mousedown');
				var canvasOffset = self.$canvas.offset();
				var iMouseX = Math.floor(e.pageX - canvasOffset.left);
				var iMouseY = Math.floor(e.pageY - canvasOffset.top);

				if (iMouseX > self.cropData.x && iMouseX < self.cropData.x + self.cropData.w &&
					iMouseY > self.cropData.y && iMouseY < self.cropData.y + self.cropData.h) {
					self.bDrag = true;
				}

			})
			.on('mouseup', function(e) {
				console.log('mouseup');
				self.bDrag = false;
			});

	},

	setCropData: function(){
		this.cropData.w = this.$currFltr.data('w');
		this.cropData.h = this.$currFltr.data('h');
		this.cropData.x = this.centerX - (this.cropData.w / 2);
		this.cropData.y = this.centerY - (this.cropData.h / 2);
	},

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
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvY2hyaXMvU2l0ZXMvR2l0SHViL2NuZWxzb244Ny9jYW52YXMtY3JvcHBlci9zcmMvc2NyaXB0cy9pbml0aWFsaXplLmpzIiwiL1VzZXJzL2NocmlzL1NpdGVzL0dpdEh1Yi9jbmVsc29uODcvY2FudmFzLWNyb3BwZXIvc3JjL3NjcmlwdHMvQXBwbGljYXRpb24uanMiLCIvVXNlcnMvY2hyaXMvU2l0ZXMvR2l0SHViL2NuZWxzb244Ny9jYW52YXMtY3JvcHBlci9zcmMvc2NyaXB0cy93aWRnZXRzL0NhbnZhc0Nyb3BwZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQXBwbGljYXRpb24gSW5pdGlhbGl6ZXJcbiAqIFxuICogQGF1dGhvciBDaHJpcyBOZWxzb25cbiAqIEBzaW5jZSAgOC41LjEzXG4gKi9cblxudmFyIEFwcGxpY2F0aW9uID0gcmVxdWlyZSgnLi9BcHBsaWNhdGlvbicpO1xuXG4kKGZ1bmN0aW9uKCkge1xuXG5cdC8vIEluaXRpYWxpemUgQXBwbGljYXRpb25cblx0QXBwbGljYXRpb24uaW5pdGlhbGl6ZSgpO1xuXG59KTsiLCIvKipcbiAqIEFwcGxpY2F0aW9uIEJvb3RzdHJhcHBlclxuICogXG4gKiBAYXV0aG9yIENocmlzIE5lbHNvblxuICogQHNpbmNlICA4LjUuMTNcbiAqL1xuXG52YXIgQ2FudmFzQ3JvcHBlciA9IHJlcXVpcmUoJy4vd2lkZ2V0cy9DYW52YXNDcm9wcGVyJyk7XG5cbnZhciBBcHBsaWNhdGlvbiA9IHtcblxuXHQvKipcblx0ICogSW5pdGlhbGl6ZSB0aGUgYXBwXG5cdCAqKi9cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oKSB7XG5cdFx0Ly9jb25zb2xlLmxvZygnQXBwbGljYXRpb246aW5pdGlhbGl6ZScpO1xuXHRcdHZhciBzZWxmID0gdGhpcztcblxuXHRcdHRoaXMuJHdpbmRvdyA9ICQod2luZG93KTtcblx0XHR0aGlzLiRkb2N1bWVudCA9ICQoZG9jdW1lbnQpO1xuXHRcdHRoaXMuJGh0bWwgPSAkKCdodG1sJyk7XG5cdFx0dGhpcy4kYm9keSA9ICQoJ2JvZHknKTtcblxuXHRcdHZhciAkZWwgPSAkKCcjY2FudmFzLWNyb3BwZXInKTtcblx0XHR2YXIgJGNhdGxpbmtzID0gJCgnI2NhdG5hdicpLmZpbmQoJ2EnKTtcblx0XHR2YXIgaW1nU3JjID0gJCgkY2F0bGlua3NbMF0pLmRhdGEoJ2hyZWYnKTtcblxuXHRcdHRoaXMuY2FudmFzQ3JvcHBlciA9IG5ldyBDYW52YXNDcm9wcGVyKCRlbCwge2ltZ1NyYzppbWdTcmN9KTtcblxuXHRcdCRjYXRsaW5rcy5vbignY2xpY2snLCBmdW5jdGlvbihlKXtcblx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHRcdHZhciBpbWdTcmMgPSAkKHRoaXMpLmRhdGEoJ2hyZWYnKTtcblx0XHRcdHNlbGYuY2FudmFzQ3JvcHBlci5zZXRJbWdTcmMoaW1nU3JjKTtcblx0XHR9KTtcblxuXG5cdH1cblxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBBcHBsaWNhdGlvbjtcbiIsIlxudmFyIENhbnZhc0Nyb3BwZXIgPSBmdW5jdGlvbigkZWwsIG9iak9wdGlvbnMpe1xuXG5cdHRoaXMuJGVsID0gJGVsO1xuXG5cdHRoaXMub3B0aW9ucyA9ICQuZXh0ZW5kKHtcblx0XHRzZWxlY3RvckV4cG9ydEJ0bjogJy5jYW52YXMtZmlsdGVycyAuYnRuLWV4cG9ydCcsXG5cdFx0c2VsZWN0b3JFeHBvcnRJbWc6ICcuY2FudmFzLWV4cG9ydCBpbWcnLFxuXHRcdHNlbGVjdG9yRmlsdGVyczogJy5jYW52YXMtZmlsdGVycyBpbnB1dFt0eXBlPXJhZGlvXScsXG5cdFx0c2VsZWN0b3JDYW52YXM6ICcuY2FudmFzLWhvbGRlciBjYW52YXMnLFxuXHRcdGZpbGxTdHlsZTogJ3JnYmEoMCwwLDAsMC41KScsXG5cdFx0c3Ryb2tlU3R5bGU6ICcjMDAwJyxcblx0XHRsaW5lV2lkdGg6IDIsXG5cdFx0aW1nU3JjOiAnJyAvL3N0cjogcGF0aCB0byBpbWFnZSBzcmNcblx0fSwgb2JqT3B0aW9ucyB8fCB7fSk7XG5cblx0dGhpcy4keEJ0biA9IHRoaXMuJGVsLmZpbmQodGhpcy5vcHRpb25zLnNlbGVjdG9yRXhwb3J0QnRuKTtcblx0dGhpcy4keEltZyA9IHRoaXMuJGVsLmZpbmQodGhpcy5vcHRpb25zLnNlbGVjdG9yRXhwb3J0SW1nKTtcblxuXHR0aGlzLiRmaWx0ZXJzID0gdGhpcy4kZWwuZmluZCh0aGlzLm9wdGlvbnMuc2VsZWN0b3JGaWx0ZXJzKTtcblx0dGhpcy4kY3VyckZsdHIgPSB0aGlzLiRmaWx0ZXJzLmZpbHRlcignOmNoZWNrZWQnKTtcblx0aWYgKCF0aGlzLiRjdXJyRmx0ci5sZW5ndGgpIHtcblx0XHR0aGlzLiRjdXJyRmx0ciA9ICQodGhpcy4kZmlsdGVyc1swXSk7XG5cdFx0dGhpcy4kY3VyckZsdHIucHJvcCh7J2NoZWNrZWQnOnRydWV9KTtcblx0fVxuXG5cdHRoaXMuJGNhbnZhcyA9IHRoaXMuJGVsLmZpbmQodGhpcy5vcHRpb25zLnNlbGVjdG9yQ2FudmFzKTtcblx0dGhpcy5jYW52YXMgPSB0aGlzLiRjYW52YXNbMF07XG5cblx0dGhpcy5jb250ZXh0ID0gdGhpcy5jYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblx0dGhpcy5jb250ZXh0LnN0cm9rZVN0eWxlID0gdGhpcy5vcHRpb25zLnN0cm9rZVN0eWxlO1xuXHR0aGlzLmNvbnRleHQubGluZVdpZHRoID0gdGhpcy5vcHRpb25zLmxpbmVXaWR0aDtcblx0Ly93aHkgaXMgdGhpcyBuZWVkZWQ/XG5cdC8vdGhpcy5pbWdEYXRhID0gdGhpcy5jb250ZXh0LmdldEltYWdlRGF0YSgwLCAwLCB0aGlzLndpZHRoLCB0aGlzLmhlaWdodCk7XG5cblx0dGhpcy53ID0gdGhpcy5jYW52YXMud2lkdGg7XG5cdHRoaXMuaCA9IHRoaXMuY2FudmFzLmhlaWdodDtcblxuXHR0aGlzLmNlbnRlclggPSB0aGlzLncgLyAyO1xuXHR0aGlzLmNlbnRlclkgPSB0aGlzLmggLyAyO1xuXG5cdHRoaXMub2Zmc2V0ID0gdGhpcy4kY2FudmFzLm9mZnNldCgpO1xuXG5cdHRoaXMuY3JvcERhdGEgPSB7dzogMCwgaDogMCwgeDogMCwgeTogMH07XG5cblx0dGhpcy5iRHJhZyA9IGZhbHNlO1xuXG5cdHRoaXMuaW5pdCgpO1xuXG59O1xuXG5DYW52YXNDcm9wcGVyLnByb3RvdHlwZSA9IHtcblxuXHRpbml0OiBmdW5jdGlvbigpe1xuXHRcdHZhciBzZWxmID0gdGhpcztcblxuXHRcdHRoaXMuYmluZEV2ZW50cygpO1xuXG5cdFx0dGhpcy5zZXRDcm9wRGF0YSgpO1xuXG5cdFx0aWYgKHRoaXMub3B0aW9ucy5pbWdTcmMpIHtcblx0XHRcdHRoaXMuc2V0SW1nU3JjKHRoaXMub3B0aW9ucy5pbWdTcmMpO1xuXHRcdH1cblx0XHRcblxuXHR9LFxuXG5cdGJpbmRFdmVudHM6IGZ1bmN0aW9uKCl7XG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xuXG5cdFx0dGhpcy4keEJ0bi5vbignY2xpY2snLCBmdW5jdGlvbihlKSB7XG5cdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRzZWxmLmV4cG9ydEltZygpO1xuXHRcdH0pO1xuXG5cdFx0dGhpcy4kZmlsdGVycy5vbignY2xpY2snLCBmdW5jdGlvbihlKSB7XG5cdFx0XHRzZWxmLiRjdXJyRmx0ciA9ICQodGhpcyk7XG5cdFx0XHRzZWxmLnNldENyb3BEYXRhKCk7XG5cdFx0XHRzZWxmLmRyYXdDYW52YXMoKTtcblx0XHRcdHNlbGYuZHJhd0Nyb3BUb29sKCk7XG5cdFx0fSk7XG5cblx0XHR0aGlzLiRjYW52YXNcblx0XHRcdC5vbignbW91c2Vtb3ZlJywgZnVuY3Rpb24oZSkge1xuXHRcdFx0XHRjb25zb2xlLmxvZygnbW91c2Vtb3ZlJyk7XG5cdFx0XHRcdHZhciBjYW52YXNPZmZzZXQgPSBzZWxmLiRjYW52YXMub2Zmc2V0KCk7XG5cdFx0XHRcdHZhciBpTW91c2VYID0gTWF0aC5mbG9vcihlLnBhZ2VYIC0gY2FudmFzT2Zmc2V0LmxlZnQpO1xuXHRcdFx0XHR2YXIgaU1vdXNlWSA9IE1hdGguZmxvb3IoZS5wYWdlWSAtIGNhbnZhc09mZnNldC50b3ApO1xuXG5cdFx0XHRcdGlmIChzZWxmLmJEcmFnKSB7XG5cdFx0XHRcdFx0c2VsZi5jcm9wRGF0YS54ID0gaU1vdXNlWDtcblx0XHRcdFx0XHRzZWxmLmNyb3BEYXRhLnkgPSBpTW91c2VZO1xuXG5cdFx0XHRcdFx0c2VsZi5kcmF3Q2FudmFzKCk7XG5cdFx0XHRcdFx0c2VsZi5kcmF3Q3JvcFRvb2woKTtcblxuXHRcdFx0XHR9XG5cblx0XHRcdH0pXG5cdFx0XHQub24oJ21vdXNlZG93bicsIGZ1bmN0aW9uKGUpIHtcblx0XHRcdFx0Y29uc29sZS5sb2coJ21vdXNlZG93bicpO1xuXHRcdFx0XHR2YXIgY2FudmFzT2Zmc2V0ID0gc2VsZi4kY2FudmFzLm9mZnNldCgpO1xuXHRcdFx0XHR2YXIgaU1vdXNlWCA9IE1hdGguZmxvb3IoZS5wYWdlWCAtIGNhbnZhc09mZnNldC5sZWZ0KTtcblx0XHRcdFx0dmFyIGlNb3VzZVkgPSBNYXRoLmZsb29yKGUucGFnZVkgLSBjYW52YXNPZmZzZXQudG9wKTtcblxuXHRcdFx0XHRpZiAoaU1vdXNlWCA+IHNlbGYuY3JvcERhdGEueCAmJiBpTW91c2VYIDwgc2VsZi5jcm9wRGF0YS54ICsgc2VsZi5jcm9wRGF0YS53ICYmXG5cdFx0XHRcdFx0aU1vdXNlWSA+IHNlbGYuY3JvcERhdGEueSAmJiBpTW91c2VZIDwgc2VsZi5jcm9wRGF0YS55ICsgc2VsZi5jcm9wRGF0YS5oKSB7XG5cdFx0XHRcdFx0c2VsZi5iRHJhZyA9IHRydWU7XG5cdFx0XHRcdH1cblxuXHRcdFx0fSlcblx0XHRcdC5vbignbW91c2V1cCcsIGZ1bmN0aW9uKGUpIHtcblx0XHRcdFx0Y29uc29sZS5sb2coJ21vdXNldXAnKTtcblx0XHRcdFx0c2VsZi5iRHJhZyA9IGZhbHNlO1xuXHRcdFx0fSk7XG5cblx0fSxcblxuXHRzZXRDcm9wRGF0YTogZnVuY3Rpb24oKXtcblx0XHR0aGlzLmNyb3BEYXRhLncgPSB0aGlzLiRjdXJyRmx0ci5kYXRhKCd3Jyk7XG5cdFx0dGhpcy5jcm9wRGF0YS5oID0gdGhpcy4kY3VyckZsdHIuZGF0YSgnaCcpO1xuXHRcdHRoaXMuY3JvcERhdGEueCA9IHRoaXMuY2VudGVyWCAtICh0aGlzLmNyb3BEYXRhLncgLyAyKTtcblx0XHR0aGlzLmNyb3BEYXRhLnkgPSB0aGlzLmNlbnRlclkgLSAodGhpcy5jcm9wRGF0YS5oIC8gMik7XG5cdH0sXG5cblx0c2V0SW1nU3JjOiBmdW5jdGlvbihpbWdTcmMpe1xuXHRcdHZhciBzZWxmID0gdGhpcztcblx0XHR2YXIgbmV3SW1nID0gbmV3IEltYWdlKCk7XG5cdFx0Ly90aGlzLnNyY0ltZyA9IG5ldyBJbWFnZSgpO1xuXHRcdG5ld0ltZy5vbmxvYWQgPSBmdW5jdGlvbigpe1xuXHRcdFx0c2VsZi5zcmNJbWcgPSBuZXdJbWc7XG5cdFx0XHRzZWxmLmRyYXdDYW52YXMoKTtcblx0XHRcdHNlbGYuZHJhd0Nyb3BUb29sKCk7XG5cdFx0fTtcblx0XHRuZXdJbWcuc3JjID0gaW1nU3JjO1xuXG5cdH0sXG5cblx0ZHJhd0NhbnZhczogZnVuY3Rpb24oKXtcblx0XHR0aGlzLmNvbnRleHQuY2xlYXJSZWN0KDAsIDAsIHRoaXMudywgdGhpcy5oKTsgLy8gY2xlYXIgY2FudmFzXG5cdFx0dGhpcy5jb250ZXh0LmRyYXdJbWFnZSh0aGlzLnNyY0ltZywgMCwgMCk7XG5cdFx0dGhpcy5jb250ZXh0LmZpbGxTdHlsZSA9IHRoaXMub3B0aW9ucy5maWxsU3R5bGU7XG5cdFx0dGhpcy5jb250ZXh0LmZpbGxSZWN0KDAsIDAsIHRoaXMudywgdGhpcy5oKTtcblx0fSxcblxuXHRkcmF3Q3JvcFRvb2w6IGZ1bmN0aW9uKCl7XG5cdFx0dGhpcy5jb250ZXh0LnN0cm9rZVJlY3QodGhpcy5jcm9wRGF0YS54LCB0aGlzLmNyb3BEYXRhLnksIHRoaXMuY3JvcERhdGEudywgdGhpcy5jcm9wRGF0YS5oKTtcblx0XHR0aGlzLmNvbnRleHQuZHJhd0ltYWdlKHRoaXMuc3JjSW1nLCB0aGlzLmNyb3BEYXRhLngsIHRoaXMuY3JvcERhdGEueSwgdGhpcy5jcm9wRGF0YS53LCB0aGlzLmNyb3BEYXRhLmgsIHRoaXMuY3JvcERhdGEueCwgdGhpcy5jcm9wRGF0YS55LCB0aGlzLmNyb3BEYXRhLncsIHRoaXMuY3JvcERhdGEuaCk7XG5cdH0sXG5cblx0ZXhwb3J0SW1nOiBmdW5jdGlvbigpe1xuXHRcdHZhciB0ZW1wQ2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG5cdFx0dmFyIHRlbXBDb250ZXh0ID0gdGVtcENhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuXHRcdHZhciBkYXRhVXJsO1xuXG5cdFx0dGVtcENhbnZhcy53aWR0aCA9IHRoaXMuY3JvcERhdGEudztcblx0XHR0ZW1wQ2FudmFzLmhlaWdodCA9IHRoaXMuY3JvcERhdGEuaDtcblx0XHR0ZW1wQ29udGV4dC5kcmF3SW1hZ2UodGhpcy5zcmNJbWcsIHRoaXMuY3JvcERhdGEueCwgdGhpcy5jcm9wRGF0YS55LCB0aGlzLmNyb3BEYXRhLncsIHRoaXMuY3JvcERhdGEuaCwgMCwgMCwgdGhpcy5jcm9wRGF0YS53LCB0aGlzLmNyb3BEYXRhLmgpO1xuXHRcdGRhdGFVcmwgPSB0ZW1wQ2FudmFzLnRvRGF0YVVSTCgnaW1hZ2UvcG5nJyk7XG5cblx0XHR0aGlzLiR4SW1nLmF0dHIoeydzcmMnOiBkYXRhVXJsfSk7XG5cblx0fVxuXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IENhbnZhc0Nyb3BwZXI7XG4iXX0=
;