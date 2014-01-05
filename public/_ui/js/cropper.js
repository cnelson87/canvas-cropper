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
	this.adjX = this.cropData.x;
	this.adjY = this.cropData.y;

	this.bDrag = false;

	this.init();

};

CanvasCropper.prototype = {

	init: function() {
		var self = this;

		this.bindEvents();

		this.initCropData();

		if (this.options.imgSrc) {
			this.setImgSrc(this.options.imgSrc);
		}
		

	},

	bindEvents: function() {
		var self = this;

		this.$xBtn.on('click', function(e){
			e.preventDefault();
			self.exportImg();
		});

		this.$filters.on('click', function(e){
			self.$currFltr = $(this);
			self.initCropData();
			self.drawCanvas();
			self.drawCropTool();
		});

		this.$canvas
			.on('mousemove', function(e){
				//console.log('mousemove');
				var canvasOffset = self.$canvas.offset();
				var mouseX = Math.floor(e.pageX - canvasOffset.left);
				var mouseY = Math.floor(e.pageY - canvasOffset.top);

				if (self.bDrag) {
					self.cropData.x = mouseX - self.adjX;
					self.cropData.y = mouseY - self.adjY;

					if (self.cropData.x < 0) {
						self.cropData.x = 0;
					}
					if (self.cropData.y < 0) {
						self.cropData.y = 0;
					}
					if (self.cropData.x + self.cropData.w > self.w) {
						self.cropData.x = self.w - self.cropData.w;
					}
					if (self.cropData.y + self.cropData.h > self.h) {
						self.cropData.y = self.h - self.cropData.h;
					}

					self.drawCanvas();
					self.drawCropTool();

				}

			})
			.on('mousedown', function(e){
				//console.log('mousedown');
				var canvasOffset = self.$canvas.offset();
				var mouseX = Math.floor(e.pageX - canvasOffset.left);
				var mouseY = Math.floor(e.pageY - canvasOffset.top);

				if (mouseX > self.cropData.x && mouseX < self.cropData.x + self.cropData.w && 
					mouseY > self.cropData.y && mouseY < self.cropData.y + self.cropData.h) {
					self.bDrag = true;
					self.adjX = mouseX - self.cropData.x;
					self.adjY = mouseY - self.cropData.y;
				}

			})
			.on('mouseup', function(e){
				//console.log('mouseup');
				self.bDrag = false;

				self.adjX = self.cropData.x;
				self.adjY = self.cropData.y;

			})
			.on('mouseout', function(e){
				//console.log('mouseout');
				self.bDrag = false;

				self.adjX = self.cropData.x;
				self.adjY = self.cropData.y;

			});

	},

	initCropData: function() {
		this.cropData.w = this.$currFltr.data('w');
		this.cropData.h = this.$currFltr.data('h');
		this.cropData.x = this.centerX - (this.cropData.w / 2);
		this.cropData.y = this.centerY - (this.cropData.h / 2);
		this.adjX = this.cropData.x;
		this.adjY = this.cropData.y;
	},

	setImgSrc: function(imgSrc) {
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

	drawCanvas: function() {
		this.context.clearRect(0, 0, this.w, this.h); // clear canvas
		this.context.drawImage(this.srcImg, 0, 0);
		this.context.fillStyle = this.options.fillStyle;
		this.context.fillRect(0, 0, this.w, this.h);
	},

	drawCropTool: function() {
		this.context.strokeRect(this.cropData.x, this.cropData.y, this.cropData.w, this.cropData.h);
		this.context.drawImage(this.srcImg, this.cropData.x, this.cropData.y, this.cropData.w, this.cropData.h, this.cropData.x, this.cropData.y, this.cropData.w, this.cropData.h);
	},

	exportImg: function() {
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
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvY2hyaXMvU2l0ZXMvR2l0SHViL2NuZWxzb244Ny9jYW52YXMtY3JvcHBlci9zcmMvc2NyaXB0cy9pbml0aWFsaXplLmpzIiwiL1VzZXJzL2NocmlzL1NpdGVzL0dpdEh1Yi9jbmVsc29uODcvY2FudmFzLWNyb3BwZXIvc3JjL3NjcmlwdHMvQXBwbGljYXRpb24uanMiLCIvVXNlcnMvY2hyaXMvU2l0ZXMvR2l0SHViL2NuZWxzb244Ny9jYW52YXMtY3JvcHBlci9zcmMvc2NyaXB0cy93aWRnZXRzL0NhbnZhc0Nyb3BwZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBBcHBsaWNhdGlvbiBJbml0aWFsaXplclxuICogXG4gKiBAYXV0aG9yIENocmlzIE5lbHNvblxuICogQHNpbmNlICA4LjUuMTNcbiAqL1xuXG52YXIgQXBwbGljYXRpb24gPSByZXF1aXJlKCcuL0FwcGxpY2F0aW9uJyk7XG5cbiQoZnVuY3Rpb24oKSB7XG5cblx0Ly8gSW5pdGlhbGl6ZSBBcHBsaWNhdGlvblxuXHRBcHBsaWNhdGlvbi5pbml0aWFsaXplKCk7XG5cbn0pOyIsIi8qKlxuICogQXBwbGljYXRpb24gQm9vdHN0cmFwcGVyXG4gKiBcbiAqIEBhdXRob3IgQ2hyaXMgTmVsc29uXG4gKiBAc2luY2UgIDguNS4xM1xuICovXG5cbnZhciBDYW52YXNDcm9wcGVyID0gcmVxdWlyZSgnLi93aWRnZXRzL0NhbnZhc0Nyb3BwZXInKTtcblxudmFyIEFwcGxpY2F0aW9uID0ge1xuXG5cdC8qKlxuXHQgKiBJbml0aWFsaXplIHRoZSBhcHBcblx0ICoqL1xuXHRpbml0aWFsaXplOiBmdW5jdGlvbigpIHtcblx0XHQvL2NvbnNvbGUubG9nKCdBcHBsaWNhdGlvbjppbml0aWFsaXplJyk7XG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xuXG5cdFx0dGhpcy4kd2luZG93ID0gJCh3aW5kb3cpO1xuXHRcdHRoaXMuJGRvY3VtZW50ID0gJChkb2N1bWVudCk7XG5cdFx0dGhpcy4kaHRtbCA9ICQoJ2h0bWwnKTtcblx0XHR0aGlzLiRib2R5ID0gJCgnYm9keScpO1xuXG5cdFx0dmFyICRlbCA9ICQoJyNjYW52YXMtY3JvcHBlcicpO1xuXHRcdHZhciAkY2F0bGlua3MgPSAkKCcjY2F0bmF2JykuZmluZCgnYScpO1xuXHRcdHZhciBpbWdTcmMgPSAkKCRjYXRsaW5rc1swXSkuZGF0YSgnaHJlZicpO1xuXG5cdFx0dGhpcy5jYW52YXNDcm9wcGVyID0gbmV3IENhbnZhc0Nyb3BwZXIoJGVsLCB7aW1nU3JjOmltZ1NyY30pO1xuXG5cdFx0JGNhdGxpbmtzLm9uKCdjbGljaycsIGZ1bmN0aW9uKGUpe1xuXHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0dmFyIGltZ1NyYyA9ICQodGhpcykuZGF0YSgnaHJlZicpO1xuXHRcdFx0c2VsZi5jYW52YXNDcm9wcGVyLnNldEltZ1NyYyhpbWdTcmMpO1xuXHRcdH0pO1xuXG5cblx0fVxuXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEFwcGxpY2F0aW9uO1xuIiwiXG52YXIgQ2FudmFzQ3JvcHBlciA9IGZ1bmN0aW9uKCRlbCwgb2JqT3B0aW9ucyl7XG5cblx0dGhpcy4kZWwgPSAkZWw7XG5cblx0dGhpcy5vcHRpb25zID0gJC5leHRlbmQoe1xuXHRcdHNlbGVjdG9yRXhwb3J0QnRuOiAnLmNhbnZhcy1maWx0ZXJzIC5idG4tZXhwb3J0Jyxcblx0XHRzZWxlY3RvckV4cG9ydEltZzogJy5jYW52YXMtZXhwb3J0IGltZycsXG5cdFx0c2VsZWN0b3JGaWx0ZXJzOiAnLmNhbnZhcy1maWx0ZXJzIGlucHV0W3R5cGU9cmFkaW9dJyxcblx0XHRzZWxlY3RvckNhbnZhczogJy5jYW52YXMtaG9sZGVyIGNhbnZhcycsXG5cdFx0ZmlsbFN0eWxlOiAncmdiYSgwLDAsMCwwLjUpJyxcblx0XHRzdHJva2VTdHlsZTogJyMwMDAnLFxuXHRcdGxpbmVXaWR0aDogMixcblx0XHRpbWdTcmM6ICcnIC8vc3RyOiBwYXRoIHRvIGltYWdlIHNyY1xuXHR9LCBvYmpPcHRpb25zIHx8IHt9KTtcblxuXHR0aGlzLiR4QnRuID0gdGhpcy4kZWwuZmluZCh0aGlzLm9wdGlvbnMuc2VsZWN0b3JFeHBvcnRCdG4pO1xuXHR0aGlzLiR4SW1nID0gdGhpcy4kZWwuZmluZCh0aGlzLm9wdGlvbnMuc2VsZWN0b3JFeHBvcnRJbWcpO1xuXG5cdHRoaXMuJGZpbHRlcnMgPSB0aGlzLiRlbC5maW5kKHRoaXMub3B0aW9ucy5zZWxlY3RvckZpbHRlcnMpO1xuXHR0aGlzLiRjdXJyRmx0ciA9IHRoaXMuJGZpbHRlcnMuZmlsdGVyKCc6Y2hlY2tlZCcpO1xuXHRpZiAoIXRoaXMuJGN1cnJGbHRyLmxlbmd0aCkge1xuXHRcdHRoaXMuJGN1cnJGbHRyID0gJCh0aGlzLiRmaWx0ZXJzWzBdKTtcblx0XHR0aGlzLiRjdXJyRmx0ci5wcm9wKHsnY2hlY2tlZCc6dHJ1ZX0pO1xuXHR9XG5cblx0dGhpcy4kY2FudmFzID0gdGhpcy4kZWwuZmluZCh0aGlzLm9wdGlvbnMuc2VsZWN0b3JDYW52YXMpO1xuXHR0aGlzLmNhbnZhcyA9IHRoaXMuJGNhbnZhc1swXTtcblxuXHR0aGlzLmNvbnRleHQgPSB0aGlzLmNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuXHR0aGlzLmNvbnRleHQuc3Ryb2tlU3R5bGUgPSB0aGlzLm9wdGlvbnMuc3Ryb2tlU3R5bGU7XG5cdHRoaXMuY29udGV4dC5saW5lV2lkdGggPSB0aGlzLm9wdGlvbnMubGluZVdpZHRoO1xuXHQvL3doeSBpcyB0aGlzIG5lZWRlZD9cblx0Ly90aGlzLmltZ0RhdGEgPSB0aGlzLmNvbnRleHQuZ2V0SW1hZ2VEYXRhKDAsIDAsIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0KTtcblxuXHR0aGlzLncgPSB0aGlzLmNhbnZhcy53aWR0aDtcblx0dGhpcy5oID0gdGhpcy5jYW52YXMuaGVpZ2h0O1xuXG5cdHRoaXMuY2VudGVyWCA9IHRoaXMudyAvIDI7XG5cdHRoaXMuY2VudGVyWSA9IHRoaXMuaCAvIDI7XG5cblx0dGhpcy5vZmZzZXQgPSB0aGlzLiRjYW52YXMub2Zmc2V0KCk7XG5cblx0dGhpcy5jcm9wRGF0YSA9IHt3OiAwLCBoOiAwLCB4OiAwLCB5OiAwfTtcblx0dGhpcy5hZGpYID0gdGhpcy5jcm9wRGF0YS54O1xuXHR0aGlzLmFkalkgPSB0aGlzLmNyb3BEYXRhLnk7XG5cblx0dGhpcy5iRHJhZyA9IGZhbHNlO1xuXG5cdHRoaXMuaW5pdCgpO1xuXG59O1xuXG5DYW52YXNDcm9wcGVyLnByb3RvdHlwZSA9IHtcblxuXHRpbml0OiBmdW5jdGlvbigpIHtcblx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cblx0XHR0aGlzLmJpbmRFdmVudHMoKTtcblxuXHRcdHRoaXMuaW5pdENyb3BEYXRhKCk7XG5cblx0XHRpZiAodGhpcy5vcHRpb25zLmltZ1NyYykge1xuXHRcdFx0dGhpcy5zZXRJbWdTcmModGhpcy5vcHRpb25zLmltZ1NyYyk7XG5cdFx0fVxuXHRcdFxuXG5cdH0sXG5cblx0YmluZEV2ZW50czogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xuXG5cdFx0dGhpcy4keEJ0bi5vbignY2xpY2snLCBmdW5jdGlvbihlKXtcblx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHRcdHNlbGYuZXhwb3J0SW1nKCk7XG5cdFx0fSk7XG5cblx0XHR0aGlzLiRmaWx0ZXJzLm9uKCdjbGljaycsIGZ1bmN0aW9uKGUpe1xuXHRcdFx0c2VsZi4kY3VyckZsdHIgPSAkKHRoaXMpO1xuXHRcdFx0c2VsZi5pbml0Q3JvcERhdGEoKTtcblx0XHRcdHNlbGYuZHJhd0NhbnZhcygpO1xuXHRcdFx0c2VsZi5kcmF3Q3JvcFRvb2woKTtcblx0XHR9KTtcblxuXHRcdHRoaXMuJGNhbnZhc1xuXHRcdFx0Lm9uKCdtb3VzZW1vdmUnLCBmdW5jdGlvbihlKXtcblx0XHRcdFx0Ly9jb25zb2xlLmxvZygnbW91c2Vtb3ZlJyk7XG5cdFx0XHRcdHZhciBjYW52YXNPZmZzZXQgPSBzZWxmLiRjYW52YXMub2Zmc2V0KCk7XG5cdFx0XHRcdHZhciBtb3VzZVggPSBNYXRoLmZsb29yKGUucGFnZVggLSBjYW52YXNPZmZzZXQubGVmdCk7XG5cdFx0XHRcdHZhciBtb3VzZVkgPSBNYXRoLmZsb29yKGUucGFnZVkgLSBjYW52YXNPZmZzZXQudG9wKTtcblxuXHRcdFx0XHRpZiAoc2VsZi5iRHJhZykge1xuXHRcdFx0XHRcdHNlbGYuY3JvcERhdGEueCA9IG1vdXNlWCAtIHNlbGYuYWRqWDtcblx0XHRcdFx0XHRzZWxmLmNyb3BEYXRhLnkgPSBtb3VzZVkgLSBzZWxmLmFkalk7XG5cblx0XHRcdFx0XHRpZiAoc2VsZi5jcm9wRGF0YS54IDwgMCkge1xuXHRcdFx0XHRcdFx0c2VsZi5jcm9wRGF0YS54ID0gMDtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0aWYgKHNlbGYuY3JvcERhdGEueSA8IDApIHtcblx0XHRcdFx0XHRcdHNlbGYuY3JvcERhdGEueSA9IDA7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGlmIChzZWxmLmNyb3BEYXRhLnggKyBzZWxmLmNyb3BEYXRhLncgPiBzZWxmLncpIHtcblx0XHRcdFx0XHRcdHNlbGYuY3JvcERhdGEueCA9IHNlbGYudyAtIHNlbGYuY3JvcERhdGEudztcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0aWYgKHNlbGYuY3JvcERhdGEueSArIHNlbGYuY3JvcERhdGEuaCA+IHNlbGYuaCkge1xuXHRcdFx0XHRcdFx0c2VsZi5jcm9wRGF0YS55ID0gc2VsZi5oIC0gc2VsZi5jcm9wRGF0YS5oO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHNlbGYuZHJhd0NhbnZhcygpO1xuXHRcdFx0XHRcdHNlbGYuZHJhd0Nyb3BUb29sKCk7XG5cblx0XHRcdFx0fVxuXG5cdFx0XHR9KVxuXHRcdFx0Lm9uKCdtb3VzZWRvd24nLCBmdW5jdGlvbihlKXtcblx0XHRcdFx0Ly9jb25zb2xlLmxvZygnbW91c2Vkb3duJyk7XG5cdFx0XHRcdHZhciBjYW52YXNPZmZzZXQgPSBzZWxmLiRjYW52YXMub2Zmc2V0KCk7XG5cdFx0XHRcdHZhciBtb3VzZVggPSBNYXRoLmZsb29yKGUucGFnZVggLSBjYW52YXNPZmZzZXQubGVmdCk7XG5cdFx0XHRcdHZhciBtb3VzZVkgPSBNYXRoLmZsb29yKGUucGFnZVkgLSBjYW52YXNPZmZzZXQudG9wKTtcblxuXHRcdFx0XHRpZiAobW91c2VYID4gc2VsZi5jcm9wRGF0YS54ICYmIG1vdXNlWCA8IHNlbGYuY3JvcERhdGEueCArIHNlbGYuY3JvcERhdGEudyAmJiBcblx0XHRcdFx0XHRtb3VzZVkgPiBzZWxmLmNyb3BEYXRhLnkgJiYgbW91c2VZIDwgc2VsZi5jcm9wRGF0YS55ICsgc2VsZi5jcm9wRGF0YS5oKSB7XG5cdFx0XHRcdFx0c2VsZi5iRHJhZyA9IHRydWU7XG5cdFx0XHRcdFx0c2VsZi5hZGpYID0gbW91c2VYIC0gc2VsZi5jcm9wRGF0YS54O1xuXHRcdFx0XHRcdHNlbGYuYWRqWSA9IG1vdXNlWSAtIHNlbGYuY3JvcERhdGEueTtcblx0XHRcdFx0fVxuXG5cdFx0XHR9KVxuXHRcdFx0Lm9uKCdtb3VzZXVwJywgZnVuY3Rpb24oZSl7XG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ21vdXNldXAnKTtcblx0XHRcdFx0c2VsZi5iRHJhZyA9IGZhbHNlO1xuXG5cdFx0XHRcdHNlbGYuYWRqWCA9IHNlbGYuY3JvcERhdGEueDtcblx0XHRcdFx0c2VsZi5hZGpZID0gc2VsZi5jcm9wRGF0YS55O1xuXG5cdFx0XHR9KVxuXHRcdFx0Lm9uKCdtb3VzZW91dCcsIGZ1bmN0aW9uKGUpe1xuXHRcdFx0XHQvL2NvbnNvbGUubG9nKCdtb3VzZW91dCcpO1xuXHRcdFx0XHRzZWxmLmJEcmFnID0gZmFsc2U7XG5cblx0XHRcdFx0c2VsZi5hZGpYID0gc2VsZi5jcm9wRGF0YS54O1xuXHRcdFx0XHRzZWxmLmFkalkgPSBzZWxmLmNyb3BEYXRhLnk7XG5cblx0XHRcdH0pO1xuXG5cdH0sXG5cblx0aW5pdENyb3BEYXRhOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmNyb3BEYXRhLncgPSB0aGlzLiRjdXJyRmx0ci5kYXRhKCd3Jyk7XG5cdFx0dGhpcy5jcm9wRGF0YS5oID0gdGhpcy4kY3VyckZsdHIuZGF0YSgnaCcpO1xuXHRcdHRoaXMuY3JvcERhdGEueCA9IHRoaXMuY2VudGVyWCAtICh0aGlzLmNyb3BEYXRhLncgLyAyKTtcblx0XHR0aGlzLmNyb3BEYXRhLnkgPSB0aGlzLmNlbnRlclkgLSAodGhpcy5jcm9wRGF0YS5oIC8gMik7XG5cdFx0dGhpcy5hZGpYID0gdGhpcy5jcm9wRGF0YS54O1xuXHRcdHRoaXMuYWRqWSA9IHRoaXMuY3JvcERhdGEueTtcblx0fSxcblxuXHRzZXRJbWdTcmM6IGZ1bmN0aW9uKGltZ1NyYykge1xuXHRcdHZhciBzZWxmID0gdGhpcztcblx0XHR2YXIgbmV3SW1nID0gbmV3IEltYWdlKCk7XG5cdFx0Ly90aGlzLnNyY0ltZyA9IG5ldyBJbWFnZSgpO1xuXHRcdG5ld0ltZy5vbmxvYWQgPSBmdW5jdGlvbigpe1xuXHRcdFx0c2VsZi5zcmNJbWcgPSBuZXdJbWc7XG5cdFx0XHRzZWxmLmRyYXdDYW52YXMoKTtcblx0XHRcdHNlbGYuZHJhd0Nyb3BUb29sKCk7XG5cdFx0fTtcblx0XHRuZXdJbWcuc3JjID0gaW1nU3JjO1xuXG5cdH0sXG5cblx0ZHJhd0NhbnZhczogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5jb250ZXh0LmNsZWFyUmVjdCgwLCAwLCB0aGlzLncsIHRoaXMuaCk7IC8vIGNsZWFyIGNhbnZhc1xuXHRcdHRoaXMuY29udGV4dC5kcmF3SW1hZ2UodGhpcy5zcmNJbWcsIDAsIDApO1xuXHRcdHRoaXMuY29udGV4dC5maWxsU3R5bGUgPSB0aGlzLm9wdGlvbnMuZmlsbFN0eWxlO1xuXHRcdHRoaXMuY29udGV4dC5maWxsUmVjdCgwLCAwLCB0aGlzLncsIHRoaXMuaCk7XG5cdH0sXG5cblx0ZHJhd0Nyb3BUb29sOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmNvbnRleHQuc3Ryb2tlUmVjdCh0aGlzLmNyb3BEYXRhLngsIHRoaXMuY3JvcERhdGEueSwgdGhpcy5jcm9wRGF0YS53LCB0aGlzLmNyb3BEYXRhLmgpO1xuXHRcdHRoaXMuY29udGV4dC5kcmF3SW1hZ2UodGhpcy5zcmNJbWcsIHRoaXMuY3JvcERhdGEueCwgdGhpcy5jcm9wRGF0YS55LCB0aGlzLmNyb3BEYXRhLncsIHRoaXMuY3JvcERhdGEuaCwgdGhpcy5jcm9wRGF0YS54LCB0aGlzLmNyb3BEYXRhLnksIHRoaXMuY3JvcERhdGEudywgdGhpcy5jcm9wRGF0YS5oKTtcblx0fSxcblxuXHRleHBvcnRJbWc6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciB0ZW1wQ2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG5cdFx0dmFyIHRlbXBDb250ZXh0ID0gdGVtcENhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuXHRcdHZhciBkYXRhVXJsO1xuXG5cdFx0dGVtcENhbnZhcy53aWR0aCA9IHRoaXMuY3JvcERhdGEudztcblx0XHR0ZW1wQ2FudmFzLmhlaWdodCA9IHRoaXMuY3JvcERhdGEuaDtcblx0XHR0ZW1wQ29udGV4dC5kcmF3SW1hZ2UodGhpcy5zcmNJbWcsIHRoaXMuY3JvcERhdGEueCwgdGhpcy5jcm9wRGF0YS55LCB0aGlzLmNyb3BEYXRhLncsIHRoaXMuY3JvcERhdGEuaCwgMCwgMCwgdGhpcy5jcm9wRGF0YS53LCB0aGlzLmNyb3BEYXRhLmgpO1xuXHRcdGRhdGFVcmwgPSB0ZW1wQ2FudmFzLnRvRGF0YVVSTCgnaW1hZ2UvcG5nJyk7XG5cblx0XHR0aGlzLiR4SW1nLmF0dHIoeydzcmMnOiBkYXRhVXJsfSk7XG5cblx0fVxuXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IENhbnZhc0Nyb3BwZXI7XG4iXX0=
;