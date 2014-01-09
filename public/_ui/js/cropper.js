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
		var $output = $('#size-output');

		this.canvasCropper = new CanvasCropper($el, {imgSrc:imgSrc});

		$catlinks.on('click', function(e){
			e.preventDefault();
			var imgSrc = $(this).data('href');
			self.canvasCropper.setImgSrc(imgSrc);
		});

		this.$document.on('CanvasCropper:drawCanvas', function(e, data){
			$output.text('crop size: ' + data.w + ' x ' + data.h);
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
		selectorZoomRange: '.canvas-filters input[type=range]',
		selectorCanvas: '.canvas-holder canvas',
		initialZoomLevel: 100,
		fillStyle: 'rgba(0,0,0,0.5)',
		strokeStyle: '#f00',
		lineWidth: 2,
		imgSrc: '', //str: path to image src
		customEventPrfx: 'CanvasCropper'
	}, objOptions || {});

	this.$xBtn = this.$el.find(this.options.selectorExportBtn);
	this.$xImg = this.$el.find(this.options.selectorExportImg);

	this.$filters = this.$el.find(this.options.selectorFilters);
	this.$currFltr = this.$filters.filter(':checked');
	if (!this.$currFltr.length) {
		this.$currFltr = $(this.$filters[0]);
		this.$currFltr.prop({'checked':true});
	}

	this.$inputZoom = this.$el.find(this.options.selectorZoomRange);
	this.$outputZoom = this.$inputZoom.next('output');

	this.$canvas = this.$el.find(this.options.selectorCanvas);
	this.canvas = this.$canvas[0];

	this.context = this.canvas.getContext('2d');
	this.context.strokeStyle = this.options.strokeStyle;
	this.context.lineWidth = this.options.lineWidth;
	this.context.fillStyle = this.options.fillStyle;

	this.w = this.canvas.width;
	this.h = this.canvas.height;

	this.centerX = this.w / 2;
	this.centerY = this.h / 2;

	this.cropData = {w: 0, h: 0, x: 0, y: 0};
	this.adjX = this.cropData.x;
	this.adjY = this.cropData.y;

	this.coords = {};

	this.bDrag = false;
	this.bZoom = false;

	this.zoomLevel = this.options.initialZoomLevel;

	this.init();

};

CanvasCropper.prototype = {

	init: function() {
		var self = this;

		this.$inputZoom.val(this.zoomLevel);
		this.$outputZoom.text(this.zoomLevel);

		this.bindEvents();
		this.bindCanvasEvents();

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
		});

		this.$inputZoom
			.on('change', function(e){
				//console.log('change');
				self.zoomLevel = self.$inputZoom.val();
				self.$outputZoom.text(self.zoomLevel);
				self.drawCanvas();
				
			})
			.on('mousemove', function(e){
				if (self.bZoom) {
					self.$inputZoom.trigger('change');
				}
			})
			.on('mousedown', function(e){
				self.bZoom = true;
				self.$inputZoom.focus();
			})
			.on('mouseup', function(e){
				self.bZoom = false;
			});

	},

	bindCanvasEvents: function() {
		var self = this;

		this.$canvas
			.on('mousemove', function(e){
				//console.log('mousemove');
				var canvasOffset = self.$canvas.offset();
				var mouseX = Math.floor(e.pageX - canvasOffset.left);
				var mouseY = Math.floor(e.pageY - canvasOffset.top);

				if (self.bDrag) {
					self.cropData.x = mouseX - self.adjX;
					self.cropData.y = mouseY - self.adjY;

					// make sure cropData coords aren't outside canvas boundary
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
		newImg.onload = function(){
			self.srcImg = newImg;
			self.drawCanvas();
		};
		newImg.src = imgSrc;
	},

	drawCanvas: function() {
		var line = this.options.lineWidth;
		var zoom = this.zoomLevel / 100.0;
		var img = this.srcImg;
		var dw = Math.floor(img.width * zoom);
		var dh = Math.floor(img.height * zoom);
		var dx = Math.floor((this.w - dw) / 2);
		var dy = Math.floor((this.h - dh) / 2);
		var sw, sh, sx, sy;

		if (this.cropData.x < dx) {
			this.cropData.x = dx;
		}
		if (this.cropData.y < dy) {
			this.cropData.y = dy;
		}
		if (this.cropData.x + this.cropData.w > dx + dw) {
			this.cropData.x = (dx + dw) - this.cropData.w;
		}
		if (this.cropData.y + this.cropData.h > dy + dh) {
			this.cropData.y = (dy + dh) - this.cropData.h;
		}

		sw = Math.floor(this.cropData.w / zoom);
		sh = Math.floor(this.cropData.h / zoom);
		sx = Math.floor((this.cropData.x - dx) / zoom);
		sy = Math.floor((this.cropData.y - dy) / zoom);

		this.context.clearRect(0, 0, this.w, this.h);
		this.context.drawImage(img, dx, dy, dw, dh);
		this.context.fillRect(0, 0, this.w, this.h);
		this.context.strokeRect(this.cropData.x - line, this.cropData.y - line, this.cropData.w + line * 2, this.cropData.h + line * 2);
		this.context.drawImage(img, sx, sy, sw, sh, this.cropData.x, this.cropData.y, this.cropData.w, this.cropData.h);

		$.event.trigger(this.options.customEventPrfx + ':drawCanvas', [{w:this.cropData.w,h:this.cropData.h}]);

	},

	exportImg: function() {
		var isJpg = this.srcImg.src.indexOf('.jpg') != -1 || this.srcImg.src.indexOf('.jpeg') != -1;
		var tempCanvas = document.createElement('canvas');
		var tempContext = tempCanvas.getContext('2d');
		var dataUrl;
		// console.log(isJpg);

		tempCanvas.width = this.cropData.w;
		tempCanvas.height = this.cropData.h;
		tempContext.drawImage(this.canvas, this.cropData.x, this.cropData.y, this.cropData.w, this.cropData.h, 0, 0, this.cropData.w, this.cropData.h);
		if (isJpg) {
			dataUrl = tempCanvas.toDataURL('image/jpeg', 0.8);
		} else {
			dataUrl = tempCanvas.toDataURL();
		}

		this.$xImg.attr({'src': dataUrl});

	}

};

module.exports = CanvasCropper;

},{}]},{},[1])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvY2hyaXNuL1NpdGVzL0dpdEh1Yi9jbmVsc29uODcvY2FudmFzLWNyb3BwZXIvc3JjL3NjcmlwdHMvaW5pdGlhbGl6ZS5qcyIsIi9Vc2Vycy9jaHJpc24vU2l0ZXMvR2l0SHViL2NuZWxzb244Ny9jYW52YXMtY3JvcHBlci9zcmMvc2NyaXB0cy9BcHBsaWNhdGlvbi5qcyIsIi9Vc2Vycy9jaHJpc24vU2l0ZXMvR2l0SHViL2NuZWxzb244Ny9jYW52YXMtY3JvcHBlci9zcmMvc2NyaXB0cy93aWRnZXRzL0NhbnZhc0Nyb3BwZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbInZhciBBcHBsaWNhdGlvbiA9IHJlcXVpcmUoJy4vQXBwbGljYXRpb24nKTtcblxuJChmdW5jdGlvbigpIHtcblx0QXBwbGljYXRpb24uaW5pdGlhbGl6ZSgpO1xufSk7XG4iLCJcbnZhciBDYW52YXNDcm9wcGVyID0gcmVxdWlyZSgnLi93aWRnZXRzL0NhbnZhc0Nyb3BwZXInKTtcblxudmFyIEFwcGxpY2F0aW9uID0ge1xuXHRpbml0aWFsaXplOiBmdW5jdGlvbigpIHtcblx0XHQvL2NvbnNvbGUubG9nKCdBcHBsaWNhdGlvbjppbml0aWFsaXplJyk7XG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xuXG5cdFx0dGhpcy4kd2luZG93ID0gJCh3aW5kb3cpO1xuXHRcdHRoaXMuJGRvY3VtZW50ID0gJChkb2N1bWVudCk7XG5cdFx0dGhpcy4kaHRtbCA9ICQoJ2h0bWwnKTtcblx0XHR0aGlzLiRib2R5ID0gJCgnYm9keScpO1xuXG5cdFx0dmFyICRlbCA9ICQoJyNjYW52YXMtY3JvcHBlcicpO1xuXHRcdHZhciAkY2F0bGlua3MgPSAkKCcjY2F0bmF2JykuZmluZCgnYScpO1xuXHRcdHZhciBpbWdTcmMgPSAkKCRjYXRsaW5rc1swXSkuZGF0YSgnaHJlZicpO1xuXHRcdHZhciAkb3V0cHV0ID0gJCgnI3NpemUtb3V0cHV0Jyk7XG5cblx0XHR0aGlzLmNhbnZhc0Nyb3BwZXIgPSBuZXcgQ2FudmFzQ3JvcHBlcigkZWwsIHtpbWdTcmM6aW1nU3JjfSk7XG5cblx0XHQkY2F0bGlua3Mub24oJ2NsaWNrJywgZnVuY3Rpb24oZSl7XG5cdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHR2YXIgaW1nU3JjID0gJCh0aGlzKS5kYXRhKCdocmVmJyk7XG5cdFx0XHRzZWxmLmNhbnZhc0Nyb3BwZXIuc2V0SW1nU3JjKGltZ1NyYyk7XG5cdFx0fSk7XG5cblx0XHR0aGlzLiRkb2N1bWVudC5vbignQ2FudmFzQ3JvcHBlcjpkcmF3Q2FudmFzJywgZnVuY3Rpb24oZSwgZGF0YSl7XG5cdFx0XHQkb3V0cHV0LnRleHQoJ2Nyb3Agc2l6ZTogJyArIGRhdGEudyArICcgeCAnICsgZGF0YS5oKTtcblx0XHR9KTtcblxuXHR9XG5cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQXBwbGljYXRpb247XG4iLCJcbnZhciBDYW52YXNDcm9wcGVyID0gZnVuY3Rpb24oJGVsLCBvYmpPcHRpb25zKXtcblxuXHR0aGlzLiRlbCA9ICRlbDtcblxuXHR0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh7XG5cdFx0c2VsZWN0b3JFeHBvcnRCdG46ICcuY2FudmFzLWZpbHRlcnMgLmJ0bi1leHBvcnQnLFxuXHRcdHNlbGVjdG9yRXhwb3J0SW1nOiAnLmNhbnZhcy1leHBvcnQgaW1nJyxcblx0XHRzZWxlY3RvckZpbHRlcnM6ICcuY2FudmFzLWZpbHRlcnMgaW5wdXRbdHlwZT1yYWRpb10nLFxuXHRcdHNlbGVjdG9yWm9vbVJhbmdlOiAnLmNhbnZhcy1maWx0ZXJzIGlucHV0W3R5cGU9cmFuZ2VdJyxcblx0XHRzZWxlY3RvckNhbnZhczogJy5jYW52YXMtaG9sZGVyIGNhbnZhcycsXG5cdFx0aW5pdGlhbFpvb21MZXZlbDogMTAwLFxuXHRcdGZpbGxTdHlsZTogJ3JnYmEoMCwwLDAsMC41KScsXG5cdFx0c3Ryb2tlU3R5bGU6ICcjZjAwJyxcblx0XHRsaW5lV2lkdGg6IDIsXG5cdFx0aW1nU3JjOiAnJywgLy9zdHI6IHBhdGggdG8gaW1hZ2Ugc3JjXG5cdFx0Y3VzdG9tRXZlbnRQcmZ4OiAnQ2FudmFzQ3JvcHBlcidcblx0fSwgb2JqT3B0aW9ucyB8fCB7fSk7XG5cblx0dGhpcy4keEJ0biA9IHRoaXMuJGVsLmZpbmQodGhpcy5vcHRpb25zLnNlbGVjdG9yRXhwb3J0QnRuKTtcblx0dGhpcy4keEltZyA9IHRoaXMuJGVsLmZpbmQodGhpcy5vcHRpb25zLnNlbGVjdG9yRXhwb3J0SW1nKTtcblxuXHR0aGlzLiRmaWx0ZXJzID0gdGhpcy4kZWwuZmluZCh0aGlzLm9wdGlvbnMuc2VsZWN0b3JGaWx0ZXJzKTtcblx0dGhpcy4kY3VyckZsdHIgPSB0aGlzLiRmaWx0ZXJzLmZpbHRlcignOmNoZWNrZWQnKTtcblx0aWYgKCF0aGlzLiRjdXJyRmx0ci5sZW5ndGgpIHtcblx0XHR0aGlzLiRjdXJyRmx0ciA9ICQodGhpcy4kZmlsdGVyc1swXSk7XG5cdFx0dGhpcy4kY3VyckZsdHIucHJvcCh7J2NoZWNrZWQnOnRydWV9KTtcblx0fVxuXG5cdHRoaXMuJGlucHV0Wm9vbSA9IHRoaXMuJGVsLmZpbmQodGhpcy5vcHRpb25zLnNlbGVjdG9yWm9vbVJhbmdlKTtcblx0dGhpcy4kb3V0cHV0Wm9vbSA9IHRoaXMuJGlucHV0Wm9vbS5uZXh0KCdvdXRwdXQnKTtcblxuXHR0aGlzLiRjYW52YXMgPSB0aGlzLiRlbC5maW5kKHRoaXMub3B0aW9ucy5zZWxlY3RvckNhbnZhcyk7XG5cdHRoaXMuY2FudmFzID0gdGhpcy4kY2FudmFzWzBdO1xuXG5cdHRoaXMuY29udGV4dCA9IHRoaXMuY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG5cdHRoaXMuY29udGV4dC5zdHJva2VTdHlsZSA9IHRoaXMub3B0aW9ucy5zdHJva2VTdHlsZTtcblx0dGhpcy5jb250ZXh0LmxpbmVXaWR0aCA9IHRoaXMub3B0aW9ucy5saW5lV2lkdGg7XG5cdHRoaXMuY29udGV4dC5maWxsU3R5bGUgPSB0aGlzLm9wdGlvbnMuZmlsbFN0eWxlO1xuXG5cdHRoaXMudyA9IHRoaXMuY2FudmFzLndpZHRoO1xuXHR0aGlzLmggPSB0aGlzLmNhbnZhcy5oZWlnaHQ7XG5cblx0dGhpcy5jZW50ZXJYID0gdGhpcy53IC8gMjtcblx0dGhpcy5jZW50ZXJZID0gdGhpcy5oIC8gMjtcblxuXHR0aGlzLmNyb3BEYXRhID0ge3c6IDAsIGg6IDAsIHg6IDAsIHk6IDB9O1xuXHR0aGlzLmFkalggPSB0aGlzLmNyb3BEYXRhLng7XG5cdHRoaXMuYWRqWSA9IHRoaXMuY3JvcERhdGEueTtcblxuXHR0aGlzLmNvb3JkcyA9IHt9O1xuXG5cdHRoaXMuYkRyYWcgPSBmYWxzZTtcblx0dGhpcy5iWm9vbSA9IGZhbHNlO1xuXG5cdHRoaXMuem9vbUxldmVsID0gdGhpcy5vcHRpb25zLmluaXRpYWxab29tTGV2ZWw7XG5cblx0dGhpcy5pbml0KCk7XG5cbn07XG5cbkNhbnZhc0Nyb3BwZXIucHJvdG90eXBlID0ge1xuXG5cdGluaXQ6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBzZWxmID0gdGhpcztcblxuXHRcdHRoaXMuJGlucHV0Wm9vbS52YWwodGhpcy56b29tTGV2ZWwpO1xuXHRcdHRoaXMuJG91dHB1dFpvb20udGV4dCh0aGlzLnpvb21MZXZlbCk7XG5cblx0XHR0aGlzLmJpbmRFdmVudHMoKTtcblx0XHR0aGlzLmJpbmRDYW52YXNFdmVudHMoKTtcblxuXHRcdHRoaXMuaW5pdENyb3BEYXRhKCk7XG5cblx0XHRpZiAodGhpcy5vcHRpb25zLmltZ1NyYykge1xuXHRcdFx0dGhpcy5zZXRJbWdTcmModGhpcy5vcHRpb25zLmltZ1NyYyk7XG5cdFx0fVxuXG5cblxuXHR9LFxuXG5cdGJpbmRFdmVudHM6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBzZWxmID0gdGhpcztcblxuXHRcdHRoaXMuJHhCdG4ub24oJ2NsaWNrJywgZnVuY3Rpb24oZSl7XG5cdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRzZWxmLmV4cG9ydEltZygpO1xuXHRcdH0pO1xuXG5cdFx0dGhpcy4kZmlsdGVycy5vbignY2xpY2snLCBmdW5jdGlvbihlKXtcblx0XHRcdHNlbGYuJGN1cnJGbHRyID0gJCh0aGlzKTtcblx0XHRcdHNlbGYuaW5pdENyb3BEYXRhKCk7XG5cdFx0XHRzZWxmLmRyYXdDYW52YXMoKTtcblx0XHR9KTtcblxuXHRcdHRoaXMuJGlucHV0Wm9vbVxuXHRcdFx0Lm9uKCdjaGFuZ2UnLCBmdW5jdGlvbihlKXtcblx0XHRcdFx0Ly9jb25zb2xlLmxvZygnY2hhbmdlJyk7XG5cdFx0XHRcdHNlbGYuem9vbUxldmVsID0gc2VsZi4kaW5wdXRab29tLnZhbCgpO1xuXHRcdFx0XHRzZWxmLiRvdXRwdXRab29tLnRleHQoc2VsZi56b29tTGV2ZWwpO1xuXHRcdFx0XHRzZWxmLmRyYXdDYW52YXMoKTtcblx0XHRcdFx0XG5cdFx0XHR9KVxuXHRcdFx0Lm9uKCdtb3VzZW1vdmUnLCBmdW5jdGlvbihlKXtcblx0XHRcdFx0aWYgKHNlbGYuYlpvb20pIHtcblx0XHRcdFx0XHRzZWxmLiRpbnB1dFpvb20udHJpZ2dlcignY2hhbmdlJyk7XG5cdFx0XHRcdH1cblx0XHRcdH0pXG5cdFx0XHQub24oJ21vdXNlZG93bicsIGZ1bmN0aW9uKGUpe1xuXHRcdFx0XHRzZWxmLmJab29tID0gdHJ1ZTtcblx0XHRcdFx0c2VsZi4kaW5wdXRab29tLmZvY3VzKCk7XG5cdFx0XHR9KVxuXHRcdFx0Lm9uKCdtb3VzZXVwJywgZnVuY3Rpb24oZSl7XG5cdFx0XHRcdHNlbGYuYlpvb20gPSBmYWxzZTtcblx0XHRcdH0pO1xuXG5cdH0sXG5cblx0YmluZENhbnZhc0V2ZW50czogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xuXG5cdFx0dGhpcy4kY2FudmFzXG5cdFx0XHQub24oJ21vdXNlbW92ZScsIGZ1bmN0aW9uKGUpe1xuXHRcdFx0XHQvL2NvbnNvbGUubG9nKCdtb3VzZW1vdmUnKTtcblx0XHRcdFx0dmFyIGNhbnZhc09mZnNldCA9IHNlbGYuJGNhbnZhcy5vZmZzZXQoKTtcblx0XHRcdFx0dmFyIG1vdXNlWCA9IE1hdGguZmxvb3IoZS5wYWdlWCAtIGNhbnZhc09mZnNldC5sZWZ0KTtcblx0XHRcdFx0dmFyIG1vdXNlWSA9IE1hdGguZmxvb3IoZS5wYWdlWSAtIGNhbnZhc09mZnNldC50b3ApO1xuXG5cdFx0XHRcdGlmIChzZWxmLmJEcmFnKSB7XG5cdFx0XHRcdFx0c2VsZi5jcm9wRGF0YS54ID0gbW91c2VYIC0gc2VsZi5hZGpYO1xuXHRcdFx0XHRcdHNlbGYuY3JvcERhdGEueSA9IG1vdXNlWSAtIHNlbGYuYWRqWTtcblxuXHRcdFx0XHRcdC8vIG1ha2Ugc3VyZSBjcm9wRGF0YSBjb29yZHMgYXJlbid0IG91dHNpZGUgY2FudmFzIGJvdW5kYXJ5XG5cdFx0XHRcdFx0aWYgKHNlbGYuY3JvcERhdGEueCA8IDApIHtcblx0XHRcdFx0XHRcdHNlbGYuY3JvcERhdGEueCA9IDA7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGlmIChzZWxmLmNyb3BEYXRhLnkgPCAwKSB7XG5cdFx0XHRcdFx0XHRzZWxmLmNyb3BEYXRhLnkgPSAwO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRpZiAoc2VsZi5jcm9wRGF0YS54ICsgc2VsZi5jcm9wRGF0YS53ID4gc2VsZi53KSB7XG5cdFx0XHRcdFx0XHRzZWxmLmNyb3BEYXRhLnggPSBzZWxmLncgLSBzZWxmLmNyb3BEYXRhLnc7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGlmIChzZWxmLmNyb3BEYXRhLnkgKyBzZWxmLmNyb3BEYXRhLmggPiBzZWxmLmgpIHtcblx0XHRcdFx0XHRcdHNlbGYuY3JvcERhdGEueSA9IHNlbGYuaCAtIHNlbGYuY3JvcERhdGEuaDtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRzZWxmLmRyYXdDYW52YXMoKTtcblx0XHRcdFx0fVxuXG5cdFx0XHR9KVxuXHRcdFx0Lm9uKCdtb3VzZWRvd24nLCBmdW5jdGlvbihlKXtcblx0XHRcdFx0Ly9jb25zb2xlLmxvZygnbW91c2Vkb3duJyk7XG5cdFx0XHRcdHZhciBjYW52YXNPZmZzZXQgPSBzZWxmLiRjYW52YXMub2Zmc2V0KCk7XG5cdFx0XHRcdHZhciBtb3VzZVggPSBNYXRoLmZsb29yKGUucGFnZVggLSBjYW52YXNPZmZzZXQubGVmdCk7XG5cdFx0XHRcdHZhciBtb3VzZVkgPSBNYXRoLmZsb29yKGUucGFnZVkgLSBjYW52YXNPZmZzZXQudG9wKTtcblxuXHRcdFx0XHRpZiAobW91c2VYID4gc2VsZi5jcm9wRGF0YS54ICYmIG1vdXNlWCA8IHNlbGYuY3JvcERhdGEueCArIHNlbGYuY3JvcERhdGEudyAmJiBcblx0XHRcdFx0XHRtb3VzZVkgPiBzZWxmLmNyb3BEYXRhLnkgJiYgbW91c2VZIDwgc2VsZi5jcm9wRGF0YS55ICsgc2VsZi5jcm9wRGF0YS5oKSB7XG5cdFx0XHRcdFx0c2VsZi5iRHJhZyA9IHRydWU7XG5cdFx0XHRcdFx0c2VsZi5hZGpYID0gbW91c2VYIC0gc2VsZi5jcm9wRGF0YS54O1xuXHRcdFx0XHRcdHNlbGYuYWRqWSA9IG1vdXNlWSAtIHNlbGYuY3JvcERhdGEueTtcblx0XHRcdFx0fVxuXG5cdFx0XHR9KVxuXHRcdFx0Lm9uKCdtb3VzZXVwJywgZnVuY3Rpb24oZSl7XG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ21vdXNldXAnKTtcblx0XHRcdFx0c2VsZi5iRHJhZyA9IGZhbHNlO1xuXHRcdFx0XHRzZWxmLmFkalggPSBzZWxmLmNyb3BEYXRhLng7XG5cdFx0XHRcdHNlbGYuYWRqWSA9IHNlbGYuY3JvcERhdGEueTtcblx0XHRcdH0pXG5cdFx0XHQub24oJ21vdXNlb3V0JywgZnVuY3Rpb24oZSl7XG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ21vdXNlb3V0Jyk7XG5cdFx0XHRcdHNlbGYuYkRyYWcgPSBmYWxzZTtcblx0XHRcdFx0c2VsZi5hZGpYID0gc2VsZi5jcm9wRGF0YS54O1xuXHRcdFx0XHRzZWxmLmFkalkgPSBzZWxmLmNyb3BEYXRhLnk7XG5cdFx0XHR9KTtcblxuXHR9LFxuXG5cdGluaXRDcm9wRGF0YTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5jcm9wRGF0YS53ID0gdGhpcy4kY3VyckZsdHIuZGF0YSgndycpO1xuXHRcdHRoaXMuY3JvcERhdGEuaCA9IHRoaXMuJGN1cnJGbHRyLmRhdGEoJ2gnKTtcblx0XHR0aGlzLmNyb3BEYXRhLnggPSB0aGlzLmNlbnRlclggLSAodGhpcy5jcm9wRGF0YS53IC8gMik7XG5cdFx0dGhpcy5jcm9wRGF0YS55ID0gdGhpcy5jZW50ZXJZIC0gKHRoaXMuY3JvcERhdGEuaCAvIDIpO1xuXHRcdHRoaXMuYWRqWCA9IHRoaXMuY3JvcERhdGEueDtcblx0XHR0aGlzLmFkalkgPSB0aGlzLmNyb3BEYXRhLnk7XG5cdH0sXG5cblx0c2V0SW1nU3JjOiBmdW5jdGlvbihpbWdTcmMpIHtcblx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cdFx0dmFyIG5ld0ltZyA9IG5ldyBJbWFnZSgpO1xuXHRcdG5ld0ltZy5vbmxvYWQgPSBmdW5jdGlvbigpe1xuXHRcdFx0c2VsZi5zcmNJbWcgPSBuZXdJbWc7XG5cdFx0XHRzZWxmLmRyYXdDYW52YXMoKTtcblx0XHR9O1xuXHRcdG5ld0ltZy5zcmMgPSBpbWdTcmM7XG5cdH0sXG5cblx0ZHJhd0NhbnZhczogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGxpbmUgPSB0aGlzLm9wdGlvbnMubGluZVdpZHRoO1xuXHRcdHZhciB6b29tID0gdGhpcy56b29tTGV2ZWwgLyAxMDAuMDtcblx0XHR2YXIgaW1nID0gdGhpcy5zcmNJbWc7XG5cdFx0dmFyIGR3ID0gTWF0aC5mbG9vcihpbWcud2lkdGggKiB6b29tKTtcblx0XHR2YXIgZGggPSBNYXRoLmZsb29yKGltZy5oZWlnaHQgKiB6b29tKTtcblx0XHR2YXIgZHggPSBNYXRoLmZsb29yKCh0aGlzLncgLSBkdykgLyAyKTtcblx0XHR2YXIgZHkgPSBNYXRoLmZsb29yKCh0aGlzLmggLSBkaCkgLyAyKTtcblx0XHR2YXIgc3csIHNoLCBzeCwgc3k7XG5cblx0XHRpZiAodGhpcy5jcm9wRGF0YS54IDwgZHgpIHtcblx0XHRcdHRoaXMuY3JvcERhdGEueCA9IGR4O1xuXHRcdH1cblx0XHRpZiAodGhpcy5jcm9wRGF0YS55IDwgZHkpIHtcblx0XHRcdHRoaXMuY3JvcERhdGEueSA9IGR5O1xuXHRcdH1cblx0XHRpZiAodGhpcy5jcm9wRGF0YS54ICsgdGhpcy5jcm9wRGF0YS53ID4gZHggKyBkdykge1xuXHRcdFx0dGhpcy5jcm9wRGF0YS54ID0gKGR4ICsgZHcpIC0gdGhpcy5jcm9wRGF0YS53O1xuXHRcdH1cblx0XHRpZiAodGhpcy5jcm9wRGF0YS55ICsgdGhpcy5jcm9wRGF0YS5oID4gZHkgKyBkaCkge1xuXHRcdFx0dGhpcy5jcm9wRGF0YS55ID0gKGR5ICsgZGgpIC0gdGhpcy5jcm9wRGF0YS5oO1xuXHRcdH1cblxuXHRcdHN3ID0gTWF0aC5mbG9vcih0aGlzLmNyb3BEYXRhLncgLyB6b29tKTtcblx0XHRzaCA9IE1hdGguZmxvb3IodGhpcy5jcm9wRGF0YS5oIC8gem9vbSk7XG5cdFx0c3ggPSBNYXRoLmZsb29yKCh0aGlzLmNyb3BEYXRhLnggLSBkeCkgLyB6b29tKTtcblx0XHRzeSA9IE1hdGguZmxvb3IoKHRoaXMuY3JvcERhdGEueSAtIGR5KSAvIHpvb20pO1xuXG5cdFx0dGhpcy5jb250ZXh0LmNsZWFyUmVjdCgwLCAwLCB0aGlzLncsIHRoaXMuaCk7XG5cdFx0dGhpcy5jb250ZXh0LmRyYXdJbWFnZShpbWcsIGR4LCBkeSwgZHcsIGRoKTtcblx0XHR0aGlzLmNvbnRleHQuZmlsbFJlY3QoMCwgMCwgdGhpcy53LCB0aGlzLmgpO1xuXHRcdHRoaXMuY29udGV4dC5zdHJva2VSZWN0KHRoaXMuY3JvcERhdGEueCAtIGxpbmUsIHRoaXMuY3JvcERhdGEueSAtIGxpbmUsIHRoaXMuY3JvcERhdGEudyArIGxpbmUgKiAyLCB0aGlzLmNyb3BEYXRhLmggKyBsaW5lICogMik7XG5cdFx0dGhpcy5jb250ZXh0LmRyYXdJbWFnZShpbWcsIHN4LCBzeSwgc3csIHNoLCB0aGlzLmNyb3BEYXRhLngsIHRoaXMuY3JvcERhdGEueSwgdGhpcy5jcm9wRGF0YS53LCB0aGlzLmNyb3BEYXRhLmgpO1xuXG5cdFx0JC5ldmVudC50cmlnZ2VyKHRoaXMub3B0aW9ucy5jdXN0b21FdmVudFByZnggKyAnOmRyYXdDYW52YXMnLCBbe3c6dGhpcy5jcm9wRGF0YS53LGg6dGhpcy5jcm9wRGF0YS5ofV0pO1xuXG5cdH0sXG5cblx0ZXhwb3J0SW1nOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgaXNKcGcgPSB0aGlzLnNyY0ltZy5zcmMuaW5kZXhPZignLmpwZycpICE9IC0xIHx8IHRoaXMuc3JjSW1nLnNyYy5pbmRleE9mKCcuanBlZycpICE9IC0xO1xuXHRcdHZhciB0ZW1wQ2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG5cdFx0dmFyIHRlbXBDb250ZXh0ID0gdGVtcENhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuXHRcdHZhciBkYXRhVXJsO1xuXHRcdC8vIGNvbnNvbGUubG9nKGlzSnBnKTtcblxuXHRcdHRlbXBDYW52YXMud2lkdGggPSB0aGlzLmNyb3BEYXRhLnc7XG5cdFx0dGVtcENhbnZhcy5oZWlnaHQgPSB0aGlzLmNyb3BEYXRhLmg7XG5cdFx0dGVtcENvbnRleHQuZHJhd0ltYWdlKHRoaXMuY2FudmFzLCB0aGlzLmNyb3BEYXRhLngsIHRoaXMuY3JvcERhdGEueSwgdGhpcy5jcm9wRGF0YS53LCB0aGlzLmNyb3BEYXRhLmgsIDAsIDAsIHRoaXMuY3JvcERhdGEudywgdGhpcy5jcm9wRGF0YS5oKTtcblx0XHRpZiAoaXNKcGcpIHtcblx0XHRcdGRhdGFVcmwgPSB0ZW1wQ2FudmFzLnRvRGF0YVVSTCgnaW1hZ2UvanBlZycsIDAuOCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGRhdGFVcmwgPSB0ZW1wQ2FudmFzLnRvRGF0YVVSTCgpO1xuXHRcdH1cblxuXHRcdHRoaXMuJHhJbWcuYXR0cih7J3NyYyc6IGRhdGFVcmx9KTtcblxuXHR9XG5cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQ2FudmFzQ3JvcHBlcjtcbiJdfQ==
;