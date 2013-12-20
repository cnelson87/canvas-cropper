
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
