
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

	this.$zoomInput = this.$el.find(this.options.selectorZoomRange);
	this.$zoomOutput = this.$zoomInput.next('output');

	this.$canvas = this.$el.find(this.options.selectorCanvas);
	this.canvas = this.$canvas[0];

	this.context = this.canvas.getContext('2d');
	this.context.strokeStyle = this.options.strokeStyle;
	this.context.lineWidth = this.options.lineWidth;
	this.context.fillStyle = this.options.fillStyle;

	this.canvasW = this.canvas.width;
	this.canvasH = this.canvas.height;
	this.centerX = this.canvasW / 2;
	this.centerY = this.canvasH / 2;

	this.cropData = {w: 0, h: 0, x: 0, y: 0, adjX: 0, adjY: 0, moveX: 0, moveY: 0, startX: 0, startY: 0};

	this.bDragCanvas = false;
	this.bDragCropper = false;
	this.bZoom = false;

	this.zoomLevel = this.options.initialZoomLevel;

	this.init();

};

CanvasCropper.prototype = {

	init: function() {
		var self = this;

		this.$zoomInput.val(this.zoomLevel);
		this.$zoomOutput.text(this.zoomLevel);

		this.bindEvents();
		this.bindZoomEvents();
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

	},

	bindZoomEvents: function() {
		var self = this;

		this.$zoomInput
			.on('change', function(e){
				//console.log('change');
				self.zoomLevel = self.$zoomInput.val();
				self.$zoomOutput.text(self.zoomLevel);
				self.drawCanvas();
				
			})
			.on('mousemove', function(e){
				if (self.bZoom) {
					self.$zoomInput.trigger('change');
				}
			})
			.on('mousedown', function(e){
				self.bZoom = true;
				self.$zoomInput.focus();
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

				if (self.bDragCropper) {
					//console.log('bDragCropper');

					self.cropData.x = mouseX - self.cropData.adjX;
					self.cropData.y = mouseY - self.cropData.adjY;

					// make sure cropData coords aren't outside canvas boundary
					if (self.cropData.x < 0) {
						self.cropData.x = 0;
					}
					if (self.cropData.y < 0) {
						self.cropData.y = 0;
					}
					if (self.cropData.x + self.cropData.w > self.canvasW) {
						self.cropData.x = self.canvasW - self.cropData.w;
					}
					if (self.cropData.y + self.cropData.h > self.canvasH) {
						self.cropData.y = self.canvasH - self.cropData.h;
					}

					self.drawCanvas();

				} else if (self.bDragCanvas) {
					//console.log('bDragCanvas');
					self.cropData.moveX = (self.cropData.startX - mouseX) * -1;
					self.cropData.moveY = (self.cropData.startY - mouseY) * -1;
					console.log(self.cropData.startX,self.cropData.startY,self.cropData.moveX,self.cropData.moveY);

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
					self.bDragCropper = true;
					self.bDragCanvas = false;
					self.cropData.adjX = mouseX - self.cropData.x;
					self.cropData.adjY = mouseY - self.cropData.y;
				} else {
					self.bDragCropper = false;
					self.bDragCanvas = true;
					self.cropData.startX = mouseX;
					self.cropData.startY = mouseY;
				}

			})
			.on('mouseup', function(e){
				//console.log('mouseup');
				self.deactivateCanvas();
			})
			.on('mouseout', function(e){
				//console.log('mouseout');
				self.deactivateCanvas();
			});

	},

	deactivateCanvas: function() {
		if (this.bDragCanvas) {
			// this.cropData.adjX = this.cropData.x + this.cropData.moveX;
			// this.cropData.adjXY = this.cropData.x + this.cropData.moveY;
		} else {
			
		}
		this.cropData.adjX = this.cropData.x;
		this.cropData.adjY = this.cropData.y;
		this.cropData.moveX = 0;
		this.cropData.moveY = 0;
		this.cropData.startX = 0;
		this.cropData.startY = 0;
		this.bDragCanvas = false;
		this.bDragCropper = false;
	},

	initCropData: function() {
		this.cropData.w = this.$currFltr.data('w');
		this.cropData.h = this.$currFltr.data('h');
		this.cropData.x = this.centerX - (this.cropData.w / 2);
		this.cropData.y = this.centerY - (this.cropData.h / 2);
		this.cropData.adjX = this.cropData.x;
		this.cropData.adjY = this.cropData.y;
		this.cropData.moveX = 0;
		this.cropData.moveY = 0;
		this.cropData.startX = 0;
		this.cropData.startY = 0;
	},

	setImgSrc: function(imgSrc) {
		var self = this;
		var newImg = new Image();
		newImg.onload = function(){
			self.sourceImg = newImg;
			self.drawCanvas();
		};
		newImg.src = imgSrc;
	},

	drawCanvas: function() {
		var line = this.options.lineWidth;
		var zoom = this.zoomLevel / 100.0;
		var img = this.sourceImg;
		var dw = Math.floor(img.width * zoom);
		var dh = Math.floor(img.height * zoom);
		var dx = Math.floor((this.canvasW - dw) / 2) + this.cropData.moveX;
		var dy = Math.floor((this.canvasH - dh) / 2) + this.cropData.moveY;
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

		this.context.clearRect(0, 0, this.canvasW, this.canvasH);
		this.context.drawImage(img, dx, dy, dw, dh);
		this.context.fillRect(0, 0, this.canvasW, this.canvasH);
		this.context.strokeRect(this.cropData.x - line, this.cropData.y - line, this.cropData.w + line * 2, this.cropData.h + line * 2);
		this.context.drawImage(img, sx, sy, sw, sh, this.cropData.x, this.cropData.y, this.cropData.w, this.cropData.h);

		$.event.trigger(this.options.customEventPrfx + ':drawCanvas', [{w:this.cropData.w,h:this.cropData.h}]);

	},

	exportImg: function() {
		var isJpg = this.sourceImg.src.indexOf('.jpg') != -1 || this.sourceImg.src.indexOf('.jpeg') != -1;
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
