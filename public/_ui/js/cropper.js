;(function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){
var Application = require('./Application');

$(function() {
	Application.initialize();
});

},{"./Application":2}],2:[function(require,module,exports){

var CanvasCropper = require('./widgets/CanvasCropper');

var Application = {
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
		var x = (this.w - this.srcImg.width) / 2;
		var y = (this.h - this.srcImg.height) / 2;
		console.log(x, y);
		this.context.clearRect(0, 0, this.w, this.h); // clear canvas
		this.context.drawImage(this.srcImg, x, y);
		this.context.fillStyle = this.options.fillStyle;
		this.context.fillRect(0, 0, this.w, this.h);
	},

	drawCropTool: function() {
		var x = (this.w - this.srcImg.width) / 2;
		var y = (this.h - this.srcImg.height) / 2;
		console.log(this.cropData.x + x, this.cropData.y + y);
		console.log(this.cropData.x - x, this.cropData.y - y);
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
		dataUrl = tempCanvas.toDataURL('image/jpeg', 0.8);

		this.$xImg.attr({'src': dataUrl});

	}

};

module.exports = CanvasCropper;

},{}]},{},[1])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvY2hyaXMvU2l0ZXMvR2l0SHViL2NuZWxzb244Ny9jYW52YXMtY3JvcHBlci9zcmMvc2NyaXB0cy9pbml0aWFsaXplLmpzIiwiL1VzZXJzL2NocmlzL1NpdGVzL0dpdEh1Yi9jbmVsc29uODcvY2FudmFzLWNyb3BwZXIvc3JjL3NjcmlwdHMvQXBwbGljYXRpb24uanMiLCIvVXNlcnMvY2hyaXMvU2l0ZXMvR2l0SHViL2NuZWxzb244Ny9jYW52YXMtY3JvcHBlci9zcmMvc2NyaXB0cy93aWRnZXRzL0NhbnZhc0Nyb3BwZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbInZhciBBcHBsaWNhdGlvbiA9IHJlcXVpcmUoJy4vQXBwbGljYXRpb24nKTtcblxuJChmdW5jdGlvbigpIHtcblx0QXBwbGljYXRpb24uaW5pdGlhbGl6ZSgpO1xufSk7XG4iLCJcbnZhciBDYW52YXNDcm9wcGVyID0gcmVxdWlyZSgnLi93aWRnZXRzL0NhbnZhc0Nyb3BwZXInKTtcblxudmFyIEFwcGxpY2F0aW9uID0ge1xuXHRpbml0aWFsaXplOiBmdW5jdGlvbigpIHtcblx0XHQvL2NvbnNvbGUubG9nKCdBcHBsaWNhdGlvbjppbml0aWFsaXplJyk7XG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xuXG5cdFx0dGhpcy4kd2luZG93ID0gJCh3aW5kb3cpO1xuXHRcdHRoaXMuJGRvY3VtZW50ID0gJChkb2N1bWVudCk7XG5cdFx0dGhpcy4kaHRtbCA9ICQoJ2h0bWwnKTtcblx0XHR0aGlzLiRib2R5ID0gJCgnYm9keScpO1xuXG5cdFx0dmFyICRlbCA9ICQoJyNjYW52YXMtY3JvcHBlcicpO1xuXHRcdHZhciAkY2F0bGlua3MgPSAkKCcjY2F0bmF2JykuZmluZCgnYScpO1xuXHRcdHZhciBpbWdTcmMgPSAkKCRjYXRsaW5rc1swXSkuZGF0YSgnaHJlZicpO1xuXG5cdFx0dGhpcy5jYW52YXNDcm9wcGVyID0gbmV3IENhbnZhc0Nyb3BwZXIoJGVsLCB7aW1nU3JjOmltZ1NyY30pO1xuXG5cdFx0JGNhdGxpbmtzLm9uKCdjbGljaycsIGZ1bmN0aW9uKGUpe1xuXHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0dmFyIGltZ1NyYyA9ICQodGhpcykuZGF0YSgnaHJlZicpO1xuXHRcdFx0c2VsZi5jYW52YXNDcm9wcGVyLnNldEltZ1NyYyhpbWdTcmMpO1xuXHRcdH0pO1xuXG5cdH1cblxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBBcHBsaWNhdGlvbjtcbiIsIlxudmFyIENhbnZhc0Nyb3BwZXIgPSBmdW5jdGlvbigkZWwsIG9iak9wdGlvbnMpe1xuXG5cdHRoaXMuJGVsID0gJGVsO1xuXG5cdHRoaXMub3B0aW9ucyA9ICQuZXh0ZW5kKHtcblx0XHRzZWxlY3RvckV4cG9ydEJ0bjogJy5jYW52YXMtZmlsdGVycyAuYnRuLWV4cG9ydCcsXG5cdFx0c2VsZWN0b3JFeHBvcnRJbWc6ICcuY2FudmFzLWV4cG9ydCBpbWcnLFxuXHRcdHNlbGVjdG9yRmlsdGVyczogJy5jYW52YXMtZmlsdGVycyBpbnB1dFt0eXBlPXJhZGlvXScsXG5cdFx0c2VsZWN0b3JDYW52YXM6ICcuY2FudmFzLWhvbGRlciBjYW52YXMnLFxuXHRcdGZpbGxTdHlsZTogJ3JnYmEoMCwwLDAsMC41KScsXG5cdFx0c3Ryb2tlU3R5bGU6ICcjMDAwJyxcblx0XHRsaW5lV2lkdGg6IDIsXG5cdFx0aW1nU3JjOiAnJyAvL3N0cjogcGF0aCB0byBpbWFnZSBzcmNcblx0fSwgb2JqT3B0aW9ucyB8fCB7fSk7XG5cblx0dGhpcy4keEJ0biA9IHRoaXMuJGVsLmZpbmQodGhpcy5vcHRpb25zLnNlbGVjdG9yRXhwb3J0QnRuKTtcblx0dGhpcy4keEltZyA9IHRoaXMuJGVsLmZpbmQodGhpcy5vcHRpb25zLnNlbGVjdG9yRXhwb3J0SW1nKTtcblxuXHR0aGlzLiRmaWx0ZXJzID0gdGhpcy4kZWwuZmluZCh0aGlzLm9wdGlvbnMuc2VsZWN0b3JGaWx0ZXJzKTtcblx0dGhpcy4kY3VyckZsdHIgPSB0aGlzLiRmaWx0ZXJzLmZpbHRlcignOmNoZWNrZWQnKTtcblx0aWYgKCF0aGlzLiRjdXJyRmx0ci5sZW5ndGgpIHtcblx0XHR0aGlzLiRjdXJyRmx0ciA9ICQodGhpcy4kZmlsdGVyc1swXSk7XG5cdFx0dGhpcy4kY3VyckZsdHIucHJvcCh7J2NoZWNrZWQnOnRydWV9KTtcblx0fVxuXG5cdHRoaXMuJGNhbnZhcyA9IHRoaXMuJGVsLmZpbmQodGhpcy5vcHRpb25zLnNlbGVjdG9yQ2FudmFzKTtcblx0dGhpcy5jYW52YXMgPSB0aGlzLiRjYW52YXNbMF07XG5cblx0dGhpcy5jb250ZXh0ID0gdGhpcy5jYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblx0dGhpcy5jb250ZXh0LnN0cm9rZVN0eWxlID0gdGhpcy5vcHRpb25zLnN0cm9rZVN0eWxlO1xuXHR0aGlzLmNvbnRleHQubGluZVdpZHRoID0gdGhpcy5vcHRpb25zLmxpbmVXaWR0aDtcblx0Ly93aHkgaXMgdGhpcyBuZWVkZWQ/XG5cdC8vdGhpcy5pbWdEYXRhID0gdGhpcy5jb250ZXh0LmdldEltYWdlRGF0YSgwLCAwLCB0aGlzLndpZHRoLCB0aGlzLmhlaWdodCk7XG5cblx0dGhpcy53ID0gdGhpcy5jYW52YXMud2lkdGg7XG5cdHRoaXMuaCA9IHRoaXMuY2FudmFzLmhlaWdodDtcblxuXHR0aGlzLmNlbnRlclggPSB0aGlzLncgLyAyO1xuXHR0aGlzLmNlbnRlclkgPSB0aGlzLmggLyAyO1xuXG5cdHRoaXMub2Zmc2V0ID0gdGhpcy4kY2FudmFzLm9mZnNldCgpO1xuXG5cdHRoaXMuY3JvcERhdGEgPSB7dzogMCwgaDogMCwgeDogMCwgeTogMH07XG5cdHRoaXMuYWRqWCA9IHRoaXMuY3JvcERhdGEueDtcblx0dGhpcy5hZGpZID0gdGhpcy5jcm9wRGF0YS55O1xuXG5cdHRoaXMuYkRyYWcgPSBmYWxzZTtcblxuXHR0aGlzLmluaXQoKTtcblxufTtcblxuQ2FudmFzQ3JvcHBlci5wcm90b3R5cGUgPSB7XG5cblx0aW5pdDogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xuXG5cdFx0dGhpcy5iaW5kRXZlbnRzKCk7XG5cblx0XHR0aGlzLmluaXRDcm9wRGF0YSgpO1xuXG5cdFx0aWYgKHRoaXMub3B0aW9ucy5pbWdTcmMpIHtcblx0XHRcdHRoaXMuc2V0SW1nU3JjKHRoaXMub3B0aW9ucy5pbWdTcmMpO1xuXHRcdH1cblx0XHRcblxuXHR9LFxuXG5cdGJpbmRFdmVudHM6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBzZWxmID0gdGhpcztcblxuXHRcdHRoaXMuJHhCdG4ub24oJ2NsaWNrJywgZnVuY3Rpb24oZSl7XG5cdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRzZWxmLmV4cG9ydEltZygpO1xuXHRcdH0pO1xuXG5cdFx0dGhpcy4kZmlsdGVycy5vbignY2xpY2snLCBmdW5jdGlvbihlKXtcblx0XHRcdHNlbGYuJGN1cnJGbHRyID0gJCh0aGlzKTtcblx0XHRcdHNlbGYuaW5pdENyb3BEYXRhKCk7XG5cdFx0XHRzZWxmLmRyYXdDYW52YXMoKTtcblx0XHRcdHNlbGYuZHJhd0Nyb3BUb29sKCk7XG5cdFx0fSk7XG5cblx0XHR0aGlzLiRjYW52YXNcblx0XHRcdC5vbignbW91c2Vtb3ZlJywgZnVuY3Rpb24oZSl7XG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ21vdXNlbW92ZScpO1xuXHRcdFx0XHR2YXIgY2FudmFzT2Zmc2V0ID0gc2VsZi4kY2FudmFzLm9mZnNldCgpO1xuXHRcdFx0XHR2YXIgbW91c2VYID0gTWF0aC5mbG9vcihlLnBhZ2VYIC0gY2FudmFzT2Zmc2V0LmxlZnQpO1xuXHRcdFx0XHR2YXIgbW91c2VZID0gTWF0aC5mbG9vcihlLnBhZ2VZIC0gY2FudmFzT2Zmc2V0LnRvcCk7XG5cblx0XHRcdFx0aWYgKHNlbGYuYkRyYWcpIHtcblx0XHRcdFx0XHRzZWxmLmNyb3BEYXRhLnggPSBtb3VzZVggLSBzZWxmLmFkalg7XG5cdFx0XHRcdFx0c2VsZi5jcm9wRGF0YS55ID0gbW91c2VZIC0gc2VsZi5hZGpZO1xuXG5cdFx0XHRcdFx0aWYgKHNlbGYuY3JvcERhdGEueCA8IDApIHtcblx0XHRcdFx0XHRcdHNlbGYuY3JvcERhdGEueCA9IDA7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGlmIChzZWxmLmNyb3BEYXRhLnkgPCAwKSB7XG5cdFx0XHRcdFx0XHRzZWxmLmNyb3BEYXRhLnkgPSAwO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRpZiAoc2VsZi5jcm9wRGF0YS54ICsgc2VsZi5jcm9wRGF0YS53ID4gc2VsZi53KSB7XG5cdFx0XHRcdFx0XHRzZWxmLmNyb3BEYXRhLnggPSBzZWxmLncgLSBzZWxmLmNyb3BEYXRhLnc7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGlmIChzZWxmLmNyb3BEYXRhLnkgKyBzZWxmLmNyb3BEYXRhLmggPiBzZWxmLmgpIHtcblx0XHRcdFx0XHRcdHNlbGYuY3JvcERhdGEueSA9IHNlbGYuaCAtIHNlbGYuY3JvcERhdGEuaDtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRzZWxmLmRyYXdDYW52YXMoKTtcblx0XHRcdFx0XHRzZWxmLmRyYXdDcm9wVG9vbCgpO1xuXG5cdFx0XHRcdH1cblxuXHRcdFx0fSlcblx0XHRcdC5vbignbW91c2Vkb3duJywgZnVuY3Rpb24oZSl7XG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ21vdXNlZG93bicpO1xuXHRcdFx0XHR2YXIgY2FudmFzT2Zmc2V0ID0gc2VsZi4kY2FudmFzLm9mZnNldCgpO1xuXHRcdFx0XHR2YXIgbW91c2VYID0gTWF0aC5mbG9vcihlLnBhZ2VYIC0gY2FudmFzT2Zmc2V0LmxlZnQpO1xuXHRcdFx0XHR2YXIgbW91c2VZID0gTWF0aC5mbG9vcihlLnBhZ2VZIC0gY2FudmFzT2Zmc2V0LnRvcCk7XG5cblx0XHRcdFx0aWYgKG1vdXNlWCA+IHNlbGYuY3JvcERhdGEueCAmJiBtb3VzZVggPCBzZWxmLmNyb3BEYXRhLnggKyBzZWxmLmNyb3BEYXRhLncgJiYgXG5cdFx0XHRcdFx0bW91c2VZID4gc2VsZi5jcm9wRGF0YS55ICYmIG1vdXNlWSA8IHNlbGYuY3JvcERhdGEueSArIHNlbGYuY3JvcERhdGEuaCkge1xuXHRcdFx0XHRcdHNlbGYuYkRyYWcgPSB0cnVlO1xuXHRcdFx0XHRcdHNlbGYuYWRqWCA9IG1vdXNlWCAtIHNlbGYuY3JvcERhdGEueDtcblx0XHRcdFx0XHRzZWxmLmFkalkgPSBtb3VzZVkgLSBzZWxmLmNyb3BEYXRhLnk7XG5cdFx0XHRcdH1cblxuXHRcdFx0fSlcblx0XHRcdC5vbignbW91c2V1cCcsIGZ1bmN0aW9uKGUpe1xuXHRcdFx0XHQvL2NvbnNvbGUubG9nKCdtb3VzZXVwJyk7XG5cdFx0XHRcdHNlbGYuYkRyYWcgPSBmYWxzZTtcblxuXHRcdFx0XHRzZWxmLmFkalggPSBzZWxmLmNyb3BEYXRhLng7XG5cdFx0XHRcdHNlbGYuYWRqWSA9IHNlbGYuY3JvcERhdGEueTtcblxuXHRcdFx0fSlcblx0XHRcdC5vbignbW91c2VvdXQnLCBmdW5jdGlvbihlKXtcblx0XHRcdFx0Ly9jb25zb2xlLmxvZygnbW91c2VvdXQnKTtcblx0XHRcdFx0c2VsZi5iRHJhZyA9IGZhbHNlO1xuXG5cdFx0XHRcdHNlbGYuYWRqWCA9IHNlbGYuY3JvcERhdGEueDtcblx0XHRcdFx0c2VsZi5hZGpZID0gc2VsZi5jcm9wRGF0YS55O1xuXG5cdFx0XHR9KTtcblxuXHR9LFxuXG5cdGluaXRDcm9wRGF0YTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5jcm9wRGF0YS53ID0gdGhpcy4kY3VyckZsdHIuZGF0YSgndycpO1xuXHRcdHRoaXMuY3JvcERhdGEuaCA9IHRoaXMuJGN1cnJGbHRyLmRhdGEoJ2gnKTtcblx0XHR0aGlzLmNyb3BEYXRhLnggPSB0aGlzLmNlbnRlclggLSAodGhpcy5jcm9wRGF0YS53IC8gMik7XG5cdFx0dGhpcy5jcm9wRGF0YS55ID0gdGhpcy5jZW50ZXJZIC0gKHRoaXMuY3JvcERhdGEuaCAvIDIpO1xuXHRcdHRoaXMuYWRqWCA9IHRoaXMuY3JvcERhdGEueDtcblx0XHR0aGlzLmFkalkgPSB0aGlzLmNyb3BEYXRhLnk7XG5cdH0sXG5cblx0c2V0SW1nU3JjOiBmdW5jdGlvbihpbWdTcmMpIHtcblx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cdFx0dmFyIG5ld0ltZyA9IG5ldyBJbWFnZSgpO1xuXHRcdC8vdGhpcy5zcmNJbWcgPSBuZXcgSW1hZ2UoKTtcblx0XHRuZXdJbWcub25sb2FkID0gZnVuY3Rpb24oKXtcblx0XHRcdHNlbGYuc3JjSW1nID0gbmV3SW1nO1xuXHRcdFx0c2VsZi5kcmF3Q2FudmFzKCk7XG5cdFx0XHRzZWxmLmRyYXdDcm9wVG9vbCgpO1xuXHRcdH07XG5cdFx0bmV3SW1nLnNyYyA9IGltZ1NyYztcblxuXHR9LFxuXG5cdGRyYXdDYW52YXM6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciB4ID0gKHRoaXMudyAtIHRoaXMuc3JjSW1nLndpZHRoKSAvIDI7XG5cdFx0dmFyIHkgPSAodGhpcy5oIC0gdGhpcy5zcmNJbWcuaGVpZ2h0KSAvIDI7XG5cdFx0Y29uc29sZS5sb2coeCwgeSk7XG5cdFx0dGhpcy5jb250ZXh0LmNsZWFyUmVjdCgwLCAwLCB0aGlzLncsIHRoaXMuaCk7IC8vIGNsZWFyIGNhbnZhc1xuXHRcdHRoaXMuY29udGV4dC5kcmF3SW1hZ2UodGhpcy5zcmNJbWcsIHgsIHkpO1xuXHRcdHRoaXMuY29udGV4dC5maWxsU3R5bGUgPSB0aGlzLm9wdGlvbnMuZmlsbFN0eWxlO1xuXHRcdHRoaXMuY29udGV4dC5maWxsUmVjdCgwLCAwLCB0aGlzLncsIHRoaXMuaCk7XG5cdH0sXG5cblx0ZHJhd0Nyb3BUb29sOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgeCA9ICh0aGlzLncgLSB0aGlzLnNyY0ltZy53aWR0aCkgLyAyO1xuXHRcdHZhciB5ID0gKHRoaXMuaCAtIHRoaXMuc3JjSW1nLmhlaWdodCkgLyAyO1xuXHRcdGNvbnNvbGUubG9nKHRoaXMuY3JvcERhdGEueCArIHgsIHRoaXMuY3JvcERhdGEueSArIHkpO1xuXHRcdGNvbnNvbGUubG9nKHRoaXMuY3JvcERhdGEueCAtIHgsIHRoaXMuY3JvcERhdGEueSAtIHkpO1xuXHRcdHRoaXMuY29udGV4dC5zdHJva2VSZWN0KHRoaXMuY3JvcERhdGEueCwgdGhpcy5jcm9wRGF0YS55LCB0aGlzLmNyb3BEYXRhLncsIHRoaXMuY3JvcERhdGEuaCk7XG5cdFx0dGhpcy5jb250ZXh0LmRyYXdJbWFnZSh0aGlzLnNyY0ltZywgdGhpcy5jcm9wRGF0YS54LCB0aGlzLmNyb3BEYXRhLnksIHRoaXMuY3JvcERhdGEudywgdGhpcy5jcm9wRGF0YS5oLCB0aGlzLmNyb3BEYXRhLngsIHRoaXMuY3JvcERhdGEueSwgdGhpcy5jcm9wRGF0YS53LCB0aGlzLmNyb3BEYXRhLmgpO1xuXHR9LFxuXG5cdGV4cG9ydEltZzogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHRlbXBDYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcblx0XHR2YXIgdGVtcENvbnRleHQgPSB0ZW1wQ2FudmFzLmdldENvbnRleHQoJzJkJyk7XG5cdFx0dmFyIGRhdGFVcmw7XG5cblx0XHR0ZW1wQ2FudmFzLndpZHRoID0gdGhpcy5jcm9wRGF0YS53O1xuXHRcdHRlbXBDYW52YXMuaGVpZ2h0ID0gdGhpcy5jcm9wRGF0YS5oO1xuXHRcdHRlbXBDb250ZXh0LmRyYXdJbWFnZSh0aGlzLnNyY0ltZywgdGhpcy5jcm9wRGF0YS54LCB0aGlzLmNyb3BEYXRhLnksIHRoaXMuY3JvcERhdGEudywgdGhpcy5jcm9wRGF0YS5oLCAwLCAwLCB0aGlzLmNyb3BEYXRhLncsIHRoaXMuY3JvcERhdGEuaCk7XG5cdFx0ZGF0YVVybCA9IHRlbXBDYW52YXMudG9EYXRhVVJMKCdpbWFnZS9qcGVnJywgMC44KTtcblxuXHRcdHRoaXMuJHhJbWcuYXR0cih7J3NyYyc6IGRhdGFVcmx9KTtcblxuXHR9XG5cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQ2FudmFzQ3JvcHBlcjtcbiJdfQ==
;