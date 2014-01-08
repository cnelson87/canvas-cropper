
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
		var img = this.srcImg;
		var dw = img.width;
		var dh = img.height;
		var dx = (this.w - dw) / 2;
		var dy = (this.h - dh) / 2;
		// console.log(dw, dh, dx, dy);
		this.context.clearRect(0, 0, this.w, this.h); // clear canvas
		this.context.drawImage(img, dx, dy, dw, dh);
		this.context.fillStyle = this.options.fillStyle;
		this.context.fillRect(0, 0, this.w, this.h);
	},

	drawCropTool: function() {
		var img = this.srcImg;
		var dw = img.width;
		var dh = img.height;
		var dx = (this.w - dw) / 2;
		var dy = (this.h - dh) / 2;
		var sw = this.cropData.w;
		var sh = this.cropData.h;
		var sx = this.cropData.x - dx;
		var sy = this.cropData.y - dy;
		// console.log(dw, dh, dx, dy);
		// console.log(sw, sh, sx, sy);
		// console.log(this.cropData);
		this.context.strokeRect(this.cropData.x, this.cropData.y, this.cropData.w, this.cropData.h);
		this.context.drawImage(img, sx, sy, sw, sh, this.cropData.x, this.cropData.y, this.cropData.w, this.cropData.h);
	},

	exportImg: function() {
		var img = this.srcImg;
		var dw = img.width;
		var dh = img.height;
		var dx = (this.w - dw) / 2;
		var dy = (this.h - dh) / 2;
		var sw = this.cropData.w;
		var sh = this.cropData.h;
		var sx = this.cropData.x - dx;
		var sy = this.cropData.y - dy;
		var isJpg = img.src.indexOf('.jpg') != -1 || img.src.indexOf('.jpeg') != -1;
		var tempCanvas = document.createElement('canvas');
		var tempContext = tempCanvas.getContext('2d');
		var dataUrl;
		console.log(isJpg);

		tempCanvas.width = this.cropData.w;
		tempCanvas.height = this.cropData.h;
		tempContext.drawImage(img, sx, sy, sw, sh, 0, 0, this.cropData.w, this.cropData.h);
		if (isJpg) {
			dataUrl = tempCanvas.toDataURL('image/jpeg', 0.8);
		} else {
			dataUrl = tempCanvas.toDataURL();
		}

		this.$xImg.attr({'src': dataUrl});

	}

};

module.exports = CanvasCropper;
