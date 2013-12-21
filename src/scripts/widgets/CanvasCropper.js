
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
