
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
