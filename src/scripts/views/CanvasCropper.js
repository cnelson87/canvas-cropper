
var CanvasCropper = Backbone.View.extend({

	collection: null,
	model: null,
	template: null,

	sourceImg: null,

	cropData: {w: 0, h: 0, x: 0, y: 0, xx: 0, yy: 0},
	imageData: {w: 0, h: 0, x: 0, y: 0},
	moveData: {startX: 0, startY: 0, moveX: 0, moveY: 0},

	events: {
		//canvas events
		'mousemove canvas': 'onCanvasMousemove',
		'mousedown canvas': 'activateCanvas',
		'mouseup canvas': 'deactivateCanvas',
		'mouseout canvas': 'deactivateCanvas',
		//zoom events
		'change input[type=range]': 'onZoomChange',
		'mousemove input[type=range]': 'onZoomMove',
		'mousedown input[type=range]': 'activateZoom',
		'mouseup input[type=range]': 'deactivateZoom',
		//export
		'click button': 'export'
	},

	initialize: function(objOptions) {
		var self = this;
		var newImg = new Image();

		this.options = $.extend({
			fillStyle: 'rgba(0,0,0,0.5)',
			strokeStyle: '#f00',
			lineWidth: 2,
			cropWidth: 100,
			cropHeight: 100,
			initialZoomLevel: 100
		}, objOptions || {});

		this.$exportBtn = this.$el.find('button');
		this.$exportImg = this.$el.find('img');

		this.$zoomInput = this.$el.find('input[type=range]');
		this.$zoomOutput = this.$zoomInput.next('output');

		this.$canvas = this.$el.find('canvas');
		this.canvas = this.$canvas[0];
		this.context = this.canvas.getContext('2d');
		this.context.strokeStyle = this.options.strokeStyle;
		this.context.lineWidth = this.options.lineWidth;
		this.context.fillStyle = this.options.fillStyle;

		this.canvasW = this.canvas.width;
		this.canvasH = this.canvas.height;
		this.centerX = this.canvasW / 2;
		this.centerY = this.canvasH / 2;
		this.currCenterX = this.centerX;
		this.currCenterY = this.centerY;

		this.bDragCanvas = false;
		this.bDragCropper = false;
		this.bCanvasActive = false;
		this.bZoom = false;

		this.zoomLevel = this.options.initialZoomLevel;

		this.isJpgSource = this.options.imgSrc.indexOf('.jpg') != -1 || this.options.imgSrc.indexOf('.jpeg') != -1;

		this.tempCanvas = document.createElement('canvas');
		this.tempContext = this.tempCanvas.getContext('2d');
		this.tempCanvas.width = this.options.cropWidth;
		this.tempCanvas.height = this.options.cropHeight;
		this.dataUrl = null;

		this.$zoomInput.val(this.zoomLevel);
		this.$zoomOutput.text(this.zoomLevel);

		newImg.onload = function(){
			self.sourceImg = newImg;
			self.initData();
		};
		newImg.src = this.options.imgSrc;

	},

	initData: function() {
		var zoom = this.zoomLevel / 100.0;

		this.cropData.w = this.options.cropWidth;
		this.cropData.h = this.options.cropHeight;
		this.cropData.x = this.centerX - (this.cropData.w / 2); //centered horiz
		this.cropData.y = this.centerY - (this.cropData.h / 2); //centered vert
		this.cropData.xx = this.cropData.x; //reference to original x
		this.cropData.yy = this.cropData.y; //reference to original y

		this.imageData.w = Math.floor(this.sourceImg.width * zoom);
		this.imageData.h = Math.floor(this.sourceImg.height * zoom);
		this.imageData.x = this.centerX - (this.imageData.w / 2); //centered horiz
		this.imageData.y = this.centerY - (this.imageData.h / 2); //centered vert

		this.moveData.startX = 0;
		this.moveData.startY = 0;
		this.moveData.moveX = 0;
		this.moveData.moveY = 0;

		this.render();
	},

	onZoomChange: function() {
		this.zoomLevel = this.$zoomInput.val();
		this.$zoomOutput.text(this.zoomLevel);
		this.updateZoomData();
		this.checkCropData();
		this.render();
	},
	onZoomMove: function() {
		if (this.bZoom) {
			this.$zoomInput.trigger('change');
		}
	},
	activateZoom: function() {
		this.bZoom = true;
		this.$zoomInput.focus();
	},
	deactivateZoom: function() {
		this.bZoom = false;
	},
	updateZoomData: function() {
		var zoom = this.zoomLevel / 100.0;

		this.imageData.w = Math.floor(this.sourceImg.width * zoom);
		this.imageData.h = Math.floor(this.sourceImg.height * zoom);
		this.imageData.x = this.currCenterX - (this.imageData.w / 2);
		this.imageData.y = this.currCenterY - (this.imageData.h / 2);

	},

	checkCropData: function() {

		// make sure cropData coords aren't outside sourceImg boundary
		if (this.cropData.x < this.imageData.x) {
			this.cropData.x = this.imageData.x;
			this.cropData.xx = this.cropData.x;
		}
		if (this.cropData.y < this.imageData.y) {
			this.cropData.y = this.imageData.y;
			this.cropData.yy = this.cropData.y;
		}
		if (this.cropData.x + this.cropData.w > this.imageData.x + this.imageData.w) {
			this.cropData.x = (this.imageData.x + this.imageData.w) - this.cropData.w;
			this.cropData.xx = this.cropData.x;
		}
		if (this.cropData.y + this.cropData.h > this.imageData.y + this.imageData.h) {
			this.cropData.y = (this.imageData.y + this.imageData.h) - this.cropData.h;
			this.cropData.yy = this.cropData.y;
		}

	},

	onCanvasMousemove: function(e) {
		//console.log('onMousemove');
		var canvasOffset = this.$canvas.offset();
		var mouseX = Math.floor(e.pageX - canvasOffset.left);
		var mouseY = Math.floor(e.pageY - canvasOffset.top);

		if (this.bCanvasActive) {

			this.moveData.moveX = (this.moveData.startX - mouseX) * -1;
			this.moveData.moveY = (this.moveData.startY - mouseY) * -1;

			if (this.bDragCropper) {
				//console.log('bDragCropper');

				this.cropData.x = this.cropData.xx + this.moveData.moveX;
				this.cropData.y = this.cropData.yy + this.moveData.moveY;

				// make sure cropData coords aren't outside canvas boundary
				if (this.cropData.x < 0) {
					this.cropData.x = 0;
					this.cropData.xx = 0;
				}
				if (this.cropData.y < 0) {
					this.cropData.y = 0;
					this.cropData.yy = 0;
				}
				if (this.cropData.x + this.cropData.w > this.canvasW) {
					this.cropData.x = this.canvasW - this.cropData.w;
					this.cropData.xx = this.cropData.x;
				}
				if (this.cropData.y + this.cropData.h > this.canvasH) {
					this.cropData.y = this.canvasH - this.cropData.h;
					this.cropData.yy = this.cropData.y;
				}

			} else if (this.bDragCanvas) {
				//console.log('bDragCanvas');

				this.currCenterX = this.centerX + this.moveData.moveX;
				this.currCenterY = this.centerY + this.moveData.moveY;
				this.imageData.x = this.currCenterX - (this.imageData.w / 2);
				this.imageData.y = this.currCenterY - (this.imageData.h / 2);

			}

			this.checkCropData();
			this.render();

		}

	},

	activateCanvas: function(e) {
		//console.log('activateCanvas');
		var canvasOffset = this.$canvas.offset();
		var mouseX = Math.floor(e.pageX - canvasOffset.left);
		var mouseY = Math.floor(e.pageY - canvasOffset.top);

		this.moveData.startX = mouseX;
		this.moveData.startY = mouseY;
		this.moveData.moveX = mouseX;
		this.moveData.moveY = mouseY;

		if (mouseX > this.cropData.x && mouseX < this.cropData.x + this.cropData.w && 
			mouseY > this.cropData.y && mouseY < this.cropData.y + this.cropData.h) {

			this.bDragCropper = true;
			this.bDragCanvas = false;
			this.bCanvasActive = true;

		} else {

			this.bDragCropper = false;
			this.bDragCanvas = true;
			this.bCanvasActive = true;

		}

	},

	deactivateCanvas: function(e) {
		
		if (this.bCanvasActive) {

			if (this.bDragCanvas) {
				this.centerX = this.currCenterX;
				this.centerY = this.currCenterY;
			}

			if (this.bDragCropper) {
				this.cropData.xx = this.cropData.x;
				this.cropData.yy = this.cropData.y;
			}

			this.moveData.startX = 0;
			this.moveData.startY = 0;
			this.moveData.moveX = 0;
			this.moveData.moveY = 0;

			this.bDragCanvas = false;
			this.bDragCropper = false;
			this.bCanvasActive = false;

		}

	},

	render: function() {

		//clear canvas and draw image
		this.context.clearRect(0, 0, this.canvasW, this.canvasH);
		this.context.drawImage(this.sourceImg, this.imageData.x, this.imageData.y, this.imageData.w, this.imageData.h);

		//clear temp canvas and draw temp image
		this.tempContext.clearRect(0, 0, this.cropData.w, this.cropData.h);
		this.tempContext.drawImage(this.canvas, this.cropData.x, this.cropData.y, this.cropData.w, this.cropData.h, 0, 0, this.cropData.w, this.cropData.h);
		this.dataUrl = this.isJpgSource ? this.tempCanvas.toDataURL('image/jpeg', 0.8) : this.tempCanvas.toDataURL();

		//dim canvas and inject temp image 
		this.context.fillRect(0, 0, this.canvasW, this.canvasH);
		this.context.strokeRect(this.cropData.x - 1, this.cropData.y - 1, this.cropData.w + 2, this.cropData.h + 2);
		this.context.drawImage(this.tempCanvas, 0, 0, this.cropData.w, this.cropData.h, this.cropData.x, this.cropData.y, this.cropData.w, this.cropData.h);

	},

	export: function() {
		this.$exportImg.attr({'src': this.dataUrl});
	}

});

module.exports = CanvasCropper;
