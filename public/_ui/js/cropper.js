;(function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){

var Application = require('./Application');

var CanvasApp = require('./app/CanvasApp');

$(function() {
	if ($('body').hasClass('backbone-page')) {
		new CanvasApp();
	} else {
		Application.initialize();
	}
});

},{"./Application":2,"./app/CanvasApp":3}],2:[function(require,module,exports){

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

},{"./widgets/CanvasCropper":4}],3:[function(require,module,exports){

var CanvasCropper = require('../views/CanvasCropper');

var CanvasApp = Backbone.View.extend({

	collection: null,

	template: null,

	events: {

	},

	initialize: function() {


		this.canvasCropper = new CanvasCropper({
			el: '#canvas-cropper',
			imgSrc: '/data/fat-cat.png',
			cropWidth: 160,
			cropHeight: 120
		});

	},

	render: function() {


	}

});

module.exports = CanvasApp;

},{"../views/CanvasCropper":5}],4:[function(require,module,exports){

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

},{}],5:[function(require,module,exports){

var CanvasCropper = Backbone.View.extend({

	collection: null,
	model: null,
	template: null,

	sourceImg: null,

	tabData: {w: 0, h: 0, x: 0, y: 0, yy: 0},
	cropData: {w: 0, h: 0, x: 0, y: 0, ww: 0, hh: 0, xx: 0, yy: 0},
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
			tabWidth: 30,
			tabHeight: 20,
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

		this.bDragTab = false;
		this.bDragCropper = false;
		this.bDragCanvas = false;
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
		this.cropData.ww = this.cropData.w; //reference to original w
		this.cropData.hh = this.cropData.h; //reference to original h
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

		this.tabData.w = this.options.tabWidth;
		this.tabData.h = this.options.tabHeight;
		this.syncTabData();

		this.render();
	},

	onZoomChange: function() {
		this.zoomLevel = this.$zoomInput.val();
		this.$zoomOutput.text(this.zoomLevel);
		this.updateZoomData();
		this.checkCropData();
		this.syncTabData();
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

	syncTabData: function() {
		this.tabData.x = this.cropData.x + (this.cropData.w / 2) - (this.tabData.w / 2);
		this.tabData.y = this.cropData.y + this.cropData.h - (this.tabData.h / 2);
		this.tabData.yy = this.tabData.y; //reference to original y

		this.tempCanvas.width = this.cropData.w;
		this.tempCanvas.height = this.cropData.h;

	},

	onCanvasMousemove: function(e) {
		//console.log('onMousemove');
		var canvasOffset = this.$canvas.offset();
		var mouseX = Math.floor(e.pageX - canvasOffset.left);
		var mouseY = Math.floor(e.pageY - canvasOffset.top);

		if (this.bCanvasActive) {

			this.moveData.moveX = (this.moveData.startX - mouseX) * -1;
			this.moveData.moveY = (this.moveData.startY - mouseY) * -1;

			if (this.bDragTab) {
				console.log('bDragTab');
				console.log(this.cropData.hh + this.moveData.moveY);

				this.cropData.h = this.cropData.hh + this.moveData.moveY;

			} else if (this.bDragCropper) {
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
			this.syncTabData();
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

		this.bCanvasActive = true;

		if (mouseX > this.tabData.x && mouseX < this.tabData.x + this.tabData.w && 
			mouseY > this.tabData.y && mouseY < this.tabData.y + this.tabData.h) {
			//activate tab drag
			this.bDragTab = true;
			console.log(this.cropData.h);

		} else if (mouseX > this.cropData.x && mouseX < this.cropData.x + this.cropData.w && 
			mouseY > this.cropData.y && mouseY < this.cropData.y + this.cropData.h) {
			//activate cropper drag
			this.bDragCropper = true;

		} else {
			//activate canvas drag
			this.bDragCanvas = true;
		}

	},

	deactivateCanvas: function(e) {
		
		if (this.bCanvasActive) {

			if (this.bDragTab) {
				this.cropData.hh = this.cropData.h;
			}

			if (this.bDragCropper) {
				this.cropData.xx = this.cropData.x;
				this.cropData.yy = this.cropData.y;
			}

			if (this.bDragCanvas) {
				this.centerX = this.currCenterX;
				this.centerY = this.currCenterY;
			}

			this.moveData.startX = 0;
			this.moveData.startY = 0;
			this.moveData.moveX = 0;
			this.moveData.moveY = 0;

			this.bDragTab = false;
			this.bDragCropper = false;
			this.bDragCanvas = false;
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

		//add drag tab
		this.context.fillStyle = this.options.strokeStyle;
		this.context.fillRect(this.tabData.x, this.tabData.y, this.tabData.w, this.tabData.h);
		this.context.fillStyle = this.options.fillStyle;

	},

	export: function() {
		this.$exportImg.attr({'src': this.dataUrl});
	}

});

module.exports = CanvasCropper;

},{}]},{},[1])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvY2hyaXNuL1NpdGVzL0dpdEh1Yi9jbmVsc29uODcvY2FudmFzLWNyb3BwZXIvc3JjL3NjcmlwdHMvaW5pdGlhbGl6ZS5qcyIsIi9Vc2Vycy9jaHJpc24vU2l0ZXMvR2l0SHViL2NuZWxzb244Ny9jYW52YXMtY3JvcHBlci9zcmMvc2NyaXB0cy9BcHBsaWNhdGlvbi5qcyIsIi9Vc2Vycy9jaHJpc24vU2l0ZXMvR2l0SHViL2NuZWxzb244Ny9jYW52YXMtY3JvcHBlci9zcmMvc2NyaXB0cy9hcHAvQ2FudmFzQXBwLmpzIiwiL1VzZXJzL2Nocmlzbi9TaXRlcy9HaXRIdWIvY25lbHNvbjg3L2NhbnZhcy1jcm9wcGVyL3NyYy9zY3JpcHRzL3dpZGdldHMvQ2FudmFzQ3JvcHBlci5qcyIsIi9Vc2Vycy9jaHJpc24vU2l0ZXMvR2l0SHViL2NuZWxzb244Ny9jYW52YXMtY3JvcHBlci9zcmMvc2NyaXB0cy92aWV3cy9DYW52YXNDcm9wcGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0U0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbIlxudmFyIEFwcGxpY2F0aW9uID0gcmVxdWlyZSgnLi9BcHBsaWNhdGlvbicpO1xuXG52YXIgQ2FudmFzQXBwID0gcmVxdWlyZSgnLi9hcHAvQ2FudmFzQXBwJyk7XG5cbiQoZnVuY3Rpb24oKSB7XG5cdGlmICgkKCdib2R5JykuaGFzQ2xhc3MoJ2JhY2tib25lLXBhZ2UnKSkge1xuXHRcdG5ldyBDYW52YXNBcHAoKTtcblx0fSBlbHNlIHtcblx0XHRBcHBsaWNhdGlvbi5pbml0aWFsaXplKCk7XG5cdH1cbn0pO1xuIiwiXG52YXIgQ2FudmFzQ3JvcHBlciA9IHJlcXVpcmUoJy4vd2lkZ2V0cy9DYW52YXNDcm9wcGVyJyk7XG5cbnZhciBBcHBsaWNhdGlvbiA9IHtcblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oKSB7XG5cdFx0Ly9jb25zb2xlLmxvZygnQXBwbGljYXRpb246aW5pdGlhbGl6ZScpO1xuXHRcdHZhciBzZWxmID0gdGhpcztcblxuXHRcdHRoaXMuJHdpbmRvdyA9ICQod2luZG93KTtcblx0XHR0aGlzLiRkb2N1bWVudCA9ICQoZG9jdW1lbnQpO1xuXHRcdHRoaXMuJGh0bWwgPSAkKCdodG1sJyk7XG5cdFx0dGhpcy4kYm9keSA9ICQoJ2JvZHknKTtcblxuXHRcdHZhciAkZWwgPSAkKCcjY2FudmFzLWNyb3BwZXInKTtcblx0XHR2YXIgJGNhdGxpbmtzID0gJCgnI2NhdG5hdicpLmZpbmQoJ2EnKTtcblx0XHR2YXIgaW1nU3JjID0gJCgkY2F0bGlua3NbMF0pLmRhdGEoJ2hyZWYnKTtcblx0XHR2YXIgJG91dHB1dCA9ICQoJyNzaXplLW91dHB1dCcpO1xuXG5cdFx0dGhpcy5jYW52YXNDcm9wcGVyID0gbmV3IENhbnZhc0Nyb3BwZXIoJGVsLCB7aW1nU3JjOmltZ1NyY30pO1xuXG5cdFx0JGNhdGxpbmtzLm9uKCdjbGljaycsIGZ1bmN0aW9uKGUpe1xuXHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0dmFyIGltZ1NyYyA9ICQodGhpcykuZGF0YSgnaHJlZicpO1xuXHRcdFx0c2VsZi5jYW52YXNDcm9wcGVyLnNldEltZ1NyYyhpbWdTcmMpO1xuXHRcdH0pO1xuXG5cdFx0dGhpcy4kZG9jdW1lbnQub24oJ0NhbnZhc0Nyb3BwZXI6ZHJhd0NhbnZhcycsIGZ1bmN0aW9uKGUsIGRhdGEpe1xuXHRcdFx0JG91dHB1dC50ZXh0KCdjcm9wIHNpemU6ICcgKyBkYXRhLncgKyAnIHggJyArIGRhdGEuaCk7XG5cdFx0fSk7XG5cblx0fVxuXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEFwcGxpY2F0aW9uO1xuIiwiXG52YXIgQ2FudmFzQ3JvcHBlciA9IHJlcXVpcmUoJy4uL3ZpZXdzL0NhbnZhc0Nyb3BwZXInKTtcblxudmFyIENhbnZhc0FwcCA9IEJhY2tib25lLlZpZXcuZXh0ZW5kKHtcblxuXHRjb2xsZWN0aW9uOiBudWxsLFxuXG5cdHRlbXBsYXRlOiBudWxsLFxuXG5cdGV2ZW50czoge1xuXG5cdH0sXG5cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oKSB7XG5cblxuXHRcdHRoaXMuY2FudmFzQ3JvcHBlciA9IG5ldyBDYW52YXNDcm9wcGVyKHtcblx0XHRcdGVsOiAnI2NhbnZhcy1jcm9wcGVyJyxcblx0XHRcdGltZ1NyYzogJy9kYXRhL2ZhdC1jYXQucG5nJyxcblx0XHRcdGNyb3BXaWR0aDogMTYwLFxuXHRcdFx0Y3JvcEhlaWdodDogMTIwXG5cdFx0fSk7XG5cblx0fSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXG5cblx0fVxuXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBDYW52YXNBcHA7XG4iLCJcbnZhciBDYW52YXNDcm9wcGVyID0gZnVuY3Rpb24oJGVsLCBvYmpPcHRpb25zKXtcblxuXHR0aGlzLiRlbCA9ICRlbDtcblxuXHR0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh7XG5cdFx0c2VsZWN0b3JFeHBvcnRCdG46ICcuY2FudmFzLWZpbHRlcnMgLmJ0bi1leHBvcnQnLFxuXHRcdHNlbGVjdG9yRXhwb3J0SW1nOiAnLmNhbnZhcy1leHBvcnQgaW1nJyxcblx0XHRzZWxlY3RvckZpbHRlcnM6ICcuY2FudmFzLWZpbHRlcnMgaW5wdXRbdHlwZT1yYWRpb10nLFxuXHRcdHNlbGVjdG9yWm9vbVJhbmdlOiAnLmNhbnZhcy1maWx0ZXJzIGlucHV0W3R5cGU9cmFuZ2VdJyxcblx0XHRzZWxlY3RvckNhbnZhczogJy5jYW52YXMtaG9sZGVyIGNhbnZhcycsXG5cdFx0aW5pdGlhbFpvb21MZXZlbDogMTAwLFxuXHRcdGZpbGxTdHlsZTogJ3JnYmEoMCwwLDAsMC41KScsXG5cdFx0c3Ryb2tlU3R5bGU6ICcjZjAwJyxcblx0XHRsaW5lV2lkdGg6IDIsXG5cdFx0aW1nU3JjOiAnJywgLy9zdHI6IHBhdGggdG8gaW1hZ2Ugc3JjXG5cdFx0Y3VzdG9tRXZlbnRQcmZ4OiAnQ2FudmFzQ3JvcHBlcidcblx0fSwgb2JqT3B0aW9ucyB8fCB7fSk7XG5cblx0dGhpcy4keEJ0biA9IHRoaXMuJGVsLmZpbmQodGhpcy5vcHRpb25zLnNlbGVjdG9yRXhwb3J0QnRuKTtcblx0dGhpcy4keEltZyA9IHRoaXMuJGVsLmZpbmQodGhpcy5vcHRpb25zLnNlbGVjdG9yRXhwb3J0SW1nKTtcblxuXHR0aGlzLiRmaWx0ZXJzID0gdGhpcy4kZWwuZmluZCh0aGlzLm9wdGlvbnMuc2VsZWN0b3JGaWx0ZXJzKTtcblx0dGhpcy4kY3VyckZsdHIgPSB0aGlzLiRmaWx0ZXJzLmZpbHRlcignOmNoZWNrZWQnKTtcblx0aWYgKCF0aGlzLiRjdXJyRmx0ci5sZW5ndGgpIHtcblx0XHR0aGlzLiRjdXJyRmx0ciA9ICQodGhpcy4kZmlsdGVyc1swXSk7XG5cdFx0dGhpcy4kY3VyckZsdHIucHJvcCh7J2NoZWNrZWQnOnRydWV9KTtcblx0fVxuXG5cdHRoaXMuJHpvb21JbnB1dCA9IHRoaXMuJGVsLmZpbmQodGhpcy5vcHRpb25zLnNlbGVjdG9yWm9vbVJhbmdlKTtcblx0dGhpcy4kem9vbU91dHB1dCA9IHRoaXMuJHpvb21JbnB1dC5uZXh0KCdvdXRwdXQnKTtcblxuXHR0aGlzLiRjYW52YXMgPSB0aGlzLiRlbC5maW5kKHRoaXMub3B0aW9ucy5zZWxlY3RvckNhbnZhcyk7XG5cdHRoaXMuY2FudmFzID0gdGhpcy4kY2FudmFzWzBdO1xuXG5cdHRoaXMuY29udGV4dCA9IHRoaXMuY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG5cdHRoaXMuY29udGV4dC5zdHJva2VTdHlsZSA9IHRoaXMub3B0aW9ucy5zdHJva2VTdHlsZTtcblx0dGhpcy5jb250ZXh0LmxpbmVXaWR0aCA9IHRoaXMub3B0aW9ucy5saW5lV2lkdGg7XG5cdHRoaXMuY29udGV4dC5maWxsU3R5bGUgPSB0aGlzLm9wdGlvbnMuZmlsbFN0eWxlO1xuXG5cdHRoaXMuY2FudmFzVyA9IHRoaXMuY2FudmFzLndpZHRoO1xuXHR0aGlzLmNhbnZhc0ggPSB0aGlzLmNhbnZhcy5oZWlnaHQ7XG5cdHRoaXMuY2VudGVyWCA9IHRoaXMuY2FudmFzVyAvIDI7XG5cdHRoaXMuY2VudGVyWSA9IHRoaXMuY2FudmFzSCAvIDI7XG5cblx0dGhpcy5jcm9wRGF0YSA9IHt3OiAwLCBoOiAwLCB4OiAwLCB5OiAwLCBhZGpYOiAwLCBhZGpZOiAwLCBtb3ZlWDogMCwgbW92ZVk6IDAsIHN0YXJ0WDogMCwgc3RhcnRZOiAwfTtcblxuXHR0aGlzLmJEcmFnQ2FudmFzID0gZmFsc2U7XG5cdHRoaXMuYkRyYWdDcm9wcGVyID0gZmFsc2U7XG5cdHRoaXMuYlpvb20gPSBmYWxzZTtcblxuXHR0aGlzLnpvb21MZXZlbCA9IHRoaXMub3B0aW9ucy5pbml0aWFsWm9vbUxldmVsO1xuXG5cdHRoaXMuaW5pdCgpO1xuXG59O1xuXG5DYW52YXNDcm9wcGVyLnByb3RvdHlwZSA9IHtcblxuXHRpbml0OiBmdW5jdGlvbigpIHtcblx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cblx0XHR0aGlzLiR6b29tSW5wdXQudmFsKHRoaXMuem9vbUxldmVsKTtcblx0XHR0aGlzLiR6b29tT3V0cHV0LnRleHQodGhpcy56b29tTGV2ZWwpO1xuXG5cdFx0dGhpcy5iaW5kRXZlbnRzKCk7XG5cdFx0dGhpcy5iaW5kWm9vbUV2ZW50cygpO1xuXHRcdHRoaXMuYmluZENhbnZhc0V2ZW50cygpO1xuXG5cdFx0dGhpcy5pbml0Q3JvcERhdGEoKTtcblxuXHRcdGlmICh0aGlzLm9wdGlvbnMuaW1nU3JjKSB7XG5cdFx0XHR0aGlzLnNldEltZ1NyYyh0aGlzLm9wdGlvbnMuaW1nU3JjKTtcblx0XHR9XG5cblx0fSxcblxuXHRiaW5kRXZlbnRzOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cblx0XHR0aGlzLiR4QnRuLm9uKCdjbGljaycsIGZ1bmN0aW9uKGUpe1xuXHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0c2VsZi5leHBvcnRJbWcoKTtcblx0XHR9KTtcblxuXHRcdHRoaXMuJGZpbHRlcnMub24oJ2NsaWNrJywgZnVuY3Rpb24oZSl7XG5cdFx0XHRzZWxmLiRjdXJyRmx0ciA9ICQodGhpcyk7XG5cdFx0XHRzZWxmLmluaXRDcm9wRGF0YSgpO1xuXHRcdFx0c2VsZi5kcmF3Q2FudmFzKCk7XG5cdFx0fSk7XG5cblx0fSxcblxuXHRiaW5kWm9vbUV2ZW50czogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xuXG5cdFx0dGhpcy4kem9vbUlucHV0XG5cdFx0XHQub24oJ2NoYW5nZScsIGZ1bmN0aW9uKGUpe1xuXHRcdFx0XHQvL2NvbnNvbGUubG9nKCdjaGFuZ2UnKTtcblx0XHRcdFx0c2VsZi56b29tTGV2ZWwgPSBzZWxmLiR6b29tSW5wdXQudmFsKCk7XG5cdFx0XHRcdHNlbGYuJHpvb21PdXRwdXQudGV4dChzZWxmLnpvb21MZXZlbCk7XG5cdFx0XHRcdHNlbGYuZHJhd0NhbnZhcygpO1xuXHRcdFx0XHRcblx0XHRcdH0pXG5cdFx0XHQub24oJ21vdXNlbW92ZScsIGZ1bmN0aW9uKGUpe1xuXHRcdFx0XHRpZiAoc2VsZi5iWm9vbSkge1xuXHRcdFx0XHRcdHNlbGYuJHpvb21JbnB1dC50cmlnZ2VyKCdjaGFuZ2UnKTtcblx0XHRcdFx0fVxuXHRcdFx0fSlcblx0XHRcdC5vbignbW91c2Vkb3duJywgZnVuY3Rpb24oZSl7XG5cdFx0XHRcdHNlbGYuYlpvb20gPSB0cnVlO1xuXHRcdFx0XHRzZWxmLiR6b29tSW5wdXQuZm9jdXMoKTtcblx0XHRcdH0pXG5cdFx0XHQub24oJ21vdXNldXAnLCBmdW5jdGlvbihlKXtcblx0XHRcdFx0c2VsZi5iWm9vbSA9IGZhbHNlO1xuXHRcdFx0fSk7XG5cblx0fSxcblxuXHRiaW5kQ2FudmFzRXZlbnRzOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cblx0XHR0aGlzLiRjYW52YXNcblx0XHRcdC5vbignbW91c2Vtb3ZlJywgZnVuY3Rpb24oZSl7XG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ21vdXNlbW92ZScpO1xuXHRcdFx0XHR2YXIgY2FudmFzT2Zmc2V0ID0gc2VsZi4kY2FudmFzLm9mZnNldCgpO1xuXHRcdFx0XHR2YXIgbW91c2VYID0gTWF0aC5mbG9vcihlLnBhZ2VYIC0gY2FudmFzT2Zmc2V0LmxlZnQpO1xuXHRcdFx0XHR2YXIgbW91c2VZID0gTWF0aC5mbG9vcihlLnBhZ2VZIC0gY2FudmFzT2Zmc2V0LnRvcCk7XG5cblx0XHRcdFx0aWYgKHNlbGYuYkRyYWdDcm9wcGVyKSB7XG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygnYkRyYWdDcm9wcGVyJyk7XG5cblx0XHRcdFx0XHRzZWxmLmNyb3BEYXRhLnggPSBtb3VzZVggLSBzZWxmLmNyb3BEYXRhLmFkalg7XG5cdFx0XHRcdFx0c2VsZi5jcm9wRGF0YS55ID0gbW91c2VZIC0gc2VsZi5jcm9wRGF0YS5hZGpZO1xuXG5cdFx0XHRcdFx0Ly8gbWFrZSBzdXJlIGNyb3BEYXRhIGNvb3JkcyBhcmVuJ3Qgb3V0c2lkZSBjYW52YXMgYm91bmRhcnlcblx0XHRcdFx0XHRpZiAoc2VsZi5jcm9wRGF0YS54IDwgMCkge1xuXHRcdFx0XHRcdFx0c2VsZi5jcm9wRGF0YS54ID0gMDtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0aWYgKHNlbGYuY3JvcERhdGEueSA8IDApIHtcblx0XHRcdFx0XHRcdHNlbGYuY3JvcERhdGEueSA9IDA7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGlmIChzZWxmLmNyb3BEYXRhLnggKyBzZWxmLmNyb3BEYXRhLncgPiBzZWxmLmNhbnZhc1cpIHtcblx0XHRcdFx0XHRcdHNlbGYuY3JvcERhdGEueCA9IHNlbGYuY2FudmFzVyAtIHNlbGYuY3JvcERhdGEudztcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0aWYgKHNlbGYuY3JvcERhdGEueSArIHNlbGYuY3JvcERhdGEuaCA+IHNlbGYuY2FudmFzSCkge1xuXHRcdFx0XHRcdFx0c2VsZi5jcm9wRGF0YS55ID0gc2VsZi5jYW52YXNIIC0gc2VsZi5jcm9wRGF0YS5oO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHNlbGYuZHJhd0NhbnZhcygpO1xuXG5cdFx0XHRcdH0gZWxzZSBpZiAoc2VsZi5iRHJhZ0NhbnZhcykge1xuXHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ2JEcmFnQ2FudmFzJyk7XG5cdFx0XHRcdFx0c2VsZi5jcm9wRGF0YS5tb3ZlWCA9IChzZWxmLmNyb3BEYXRhLnN0YXJ0WCAtIG1vdXNlWCkgKiAtMTtcblx0XHRcdFx0XHRzZWxmLmNyb3BEYXRhLm1vdmVZID0gKHNlbGYuY3JvcERhdGEuc3RhcnRZIC0gbW91c2VZKSAqIC0xO1xuXHRcdFx0XHRcdGNvbnNvbGUubG9nKHNlbGYuY3JvcERhdGEuc3RhcnRYLHNlbGYuY3JvcERhdGEuc3RhcnRZLHNlbGYuY3JvcERhdGEubW92ZVgsc2VsZi5jcm9wRGF0YS5tb3ZlWSk7XG5cblx0XHRcdFx0XHRzZWxmLmRyYXdDYW52YXMoKTtcblxuXHRcdFx0XHR9XG5cblx0XHRcdH0pXG5cdFx0XHQub24oJ21vdXNlZG93bicsIGZ1bmN0aW9uKGUpe1xuXHRcdFx0XHQvL2NvbnNvbGUubG9nKCdtb3VzZWRvd24nKTtcblx0XHRcdFx0dmFyIGNhbnZhc09mZnNldCA9IHNlbGYuJGNhbnZhcy5vZmZzZXQoKTtcblx0XHRcdFx0dmFyIG1vdXNlWCA9IE1hdGguZmxvb3IoZS5wYWdlWCAtIGNhbnZhc09mZnNldC5sZWZ0KTtcblx0XHRcdFx0dmFyIG1vdXNlWSA9IE1hdGguZmxvb3IoZS5wYWdlWSAtIGNhbnZhc09mZnNldC50b3ApO1xuXG5cdFx0XHRcdGlmIChtb3VzZVggPiBzZWxmLmNyb3BEYXRhLnggJiYgbW91c2VYIDwgc2VsZi5jcm9wRGF0YS54ICsgc2VsZi5jcm9wRGF0YS53ICYmIFxuXHRcdFx0XHRcdG1vdXNlWSA+IHNlbGYuY3JvcERhdGEueSAmJiBtb3VzZVkgPCBzZWxmLmNyb3BEYXRhLnkgKyBzZWxmLmNyb3BEYXRhLmgpIHtcblx0XHRcdFx0XHRzZWxmLmJEcmFnQ3JvcHBlciA9IHRydWU7XG5cdFx0XHRcdFx0c2VsZi5iRHJhZ0NhbnZhcyA9IGZhbHNlO1xuXHRcdFx0XHRcdHNlbGYuY3JvcERhdGEuYWRqWCA9IG1vdXNlWCAtIHNlbGYuY3JvcERhdGEueDtcblx0XHRcdFx0XHRzZWxmLmNyb3BEYXRhLmFkalkgPSBtb3VzZVkgLSBzZWxmLmNyb3BEYXRhLnk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0c2VsZi5iRHJhZ0Nyb3BwZXIgPSBmYWxzZTtcblx0XHRcdFx0XHRzZWxmLmJEcmFnQ2FudmFzID0gdHJ1ZTtcblx0XHRcdFx0XHRzZWxmLmNyb3BEYXRhLnN0YXJ0WCA9IG1vdXNlWDtcblx0XHRcdFx0XHRzZWxmLmNyb3BEYXRhLnN0YXJ0WSA9IG1vdXNlWTtcblx0XHRcdFx0fVxuXG5cdFx0XHR9KVxuXHRcdFx0Lm9uKCdtb3VzZXVwJywgZnVuY3Rpb24oZSl7XG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ21vdXNldXAnKTtcblx0XHRcdFx0c2VsZi5kZWFjdGl2YXRlQ2FudmFzKCk7XG5cdFx0XHR9KVxuXHRcdFx0Lm9uKCdtb3VzZW91dCcsIGZ1bmN0aW9uKGUpe1xuXHRcdFx0XHQvL2NvbnNvbGUubG9nKCdtb3VzZW91dCcpO1xuXHRcdFx0XHRzZWxmLmRlYWN0aXZhdGVDYW52YXMoKTtcblx0XHRcdH0pO1xuXG5cdH0sXG5cblx0ZGVhY3RpdmF0ZUNhbnZhczogZnVuY3Rpb24oKSB7XG5cdFx0aWYgKHRoaXMuYkRyYWdDYW52YXMpIHtcblx0XHRcdC8vIHRoaXMuY3JvcERhdGEuYWRqWCA9IHRoaXMuY3JvcERhdGEueCArIHRoaXMuY3JvcERhdGEubW92ZVg7XG5cdFx0XHQvLyB0aGlzLmNyb3BEYXRhLmFkalhZID0gdGhpcy5jcm9wRGF0YS54ICsgdGhpcy5jcm9wRGF0YS5tb3ZlWTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0XG5cdFx0fVxuXHRcdHRoaXMuY3JvcERhdGEuYWRqWCA9IHRoaXMuY3JvcERhdGEueDtcblx0XHR0aGlzLmNyb3BEYXRhLmFkalkgPSB0aGlzLmNyb3BEYXRhLnk7XG5cdFx0dGhpcy5jcm9wRGF0YS5tb3ZlWCA9IDA7XG5cdFx0dGhpcy5jcm9wRGF0YS5tb3ZlWSA9IDA7XG5cdFx0dGhpcy5jcm9wRGF0YS5zdGFydFggPSAwO1xuXHRcdHRoaXMuY3JvcERhdGEuc3RhcnRZID0gMDtcblx0XHR0aGlzLmJEcmFnQ2FudmFzID0gZmFsc2U7XG5cdFx0dGhpcy5iRHJhZ0Nyb3BwZXIgPSBmYWxzZTtcblx0fSxcblxuXHRpbml0Q3JvcERhdGE6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuY3JvcERhdGEudyA9IHRoaXMuJGN1cnJGbHRyLmRhdGEoJ3cnKTtcblx0XHR0aGlzLmNyb3BEYXRhLmggPSB0aGlzLiRjdXJyRmx0ci5kYXRhKCdoJyk7XG5cdFx0dGhpcy5jcm9wRGF0YS54ID0gdGhpcy5jZW50ZXJYIC0gKHRoaXMuY3JvcERhdGEudyAvIDIpO1xuXHRcdHRoaXMuY3JvcERhdGEueSA9IHRoaXMuY2VudGVyWSAtICh0aGlzLmNyb3BEYXRhLmggLyAyKTtcblx0XHR0aGlzLmNyb3BEYXRhLmFkalggPSB0aGlzLmNyb3BEYXRhLng7XG5cdFx0dGhpcy5jcm9wRGF0YS5hZGpZID0gdGhpcy5jcm9wRGF0YS55O1xuXHRcdHRoaXMuY3JvcERhdGEubW92ZVggPSAwO1xuXHRcdHRoaXMuY3JvcERhdGEubW92ZVkgPSAwO1xuXHRcdHRoaXMuY3JvcERhdGEuc3RhcnRYID0gMDtcblx0XHR0aGlzLmNyb3BEYXRhLnN0YXJ0WSA9IDA7XG5cdH0sXG5cblx0c2V0SW1nU3JjOiBmdW5jdGlvbihpbWdTcmMpIHtcblx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cdFx0dmFyIG5ld0ltZyA9IG5ldyBJbWFnZSgpO1xuXHRcdG5ld0ltZy5vbmxvYWQgPSBmdW5jdGlvbigpe1xuXHRcdFx0c2VsZi5zb3VyY2VJbWcgPSBuZXdJbWc7XG5cdFx0XHRzZWxmLmRyYXdDYW52YXMoKTtcblx0XHR9O1xuXHRcdG5ld0ltZy5zcmMgPSBpbWdTcmM7XG5cdH0sXG5cblx0ZHJhd0NhbnZhczogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGxpbmUgPSB0aGlzLm9wdGlvbnMubGluZVdpZHRoO1xuXHRcdHZhciB6b29tID0gdGhpcy56b29tTGV2ZWwgLyAxMDAuMDtcblx0XHR2YXIgaW1nID0gdGhpcy5zb3VyY2VJbWc7XG5cdFx0dmFyIGR3ID0gTWF0aC5mbG9vcihpbWcud2lkdGggKiB6b29tKTtcblx0XHR2YXIgZGggPSBNYXRoLmZsb29yKGltZy5oZWlnaHQgKiB6b29tKTtcblx0XHR2YXIgZHggPSBNYXRoLmZsb29yKCh0aGlzLmNhbnZhc1cgLSBkdykgLyAyKSArIHRoaXMuY3JvcERhdGEubW92ZVg7XG5cdFx0dmFyIGR5ID0gTWF0aC5mbG9vcigodGhpcy5jYW52YXNIIC0gZGgpIC8gMikgKyB0aGlzLmNyb3BEYXRhLm1vdmVZO1xuXHRcdHZhciBzdywgc2gsIHN4LCBzeTtcblxuXHRcdGlmICh0aGlzLmNyb3BEYXRhLnggPCBkeCkge1xuXHRcdFx0dGhpcy5jcm9wRGF0YS54ID0gZHg7XG5cdFx0fVxuXHRcdGlmICh0aGlzLmNyb3BEYXRhLnkgPCBkeSkge1xuXHRcdFx0dGhpcy5jcm9wRGF0YS55ID0gZHk7XG5cdFx0fVxuXHRcdGlmICh0aGlzLmNyb3BEYXRhLnggKyB0aGlzLmNyb3BEYXRhLncgPiBkeCArIGR3KSB7XG5cdFx0XHR0aGlzLmNyb3BEYXRhLnggPSAoZHggKyBkdykgLSB0aGlzLmNyb3BEYXRhLnc7XG5cdFx0fVxuXHRcdGlmICh0aGlzLmNyb3BEYXRhLnkgKyB0aGlzLmNyb3BEYXRhLmggPiBkeSArIGRoKSB7XG5cdFx0XHR0aGlzLmNyb3BEYXRhLnkgPSAoZHkgKyBkaCkgLSB0aGlzLmNyb3BEYXRhLmg7XG5cdFx0fVxuXG5cdFx0c3cgPSBNYXRoLmZsb29yKHRoaXMuY3JvcERhdGEudyAvIHpvb20pO1xuXHRcdHNoID0gTWF0aC5mbG9vcih0aGlzLmNyb3BEYXRhLmggLyB6b29tKTtcblx0XHRzeCA9IE1hdGguZmxvb3IoKHRoaXMuY3JvcERhdGEueCAtIGR4KSAvIHpvb20pO1xuXHRcdHN5ID0gTWF0aC5mbG9vcigodGhpcy5jcm9wRGF0YS55IC0gZHkpIC8gem9vbSk7XG5cblx0XHR0aGlzLmNvbnRleHQuY2xlYXJSZWN0KDAsIDAsIHRoaXMuY2FudmFzVywgdGhpcy5jYW52YXNIKTtcblx0XHR0aGlzLmNvbnRleHQuZHJhd0ltYWdlKGltZywgZHgsIGR5LCBkdywgZGgpO1xuXHRcdHRoaXMuY29udGV4dC5maWxsUmVjdCgwLCAwLCB0aGlzLmNhbnZhc1csIHRoaXMuY2FudmFzSCk7XG5cdFx0dGhpcy5jb250ZXh0LnN0cm9rZVJlY3QodGhpcy5jcm9wRGF0YS54IC0gbGluZSwgdGhpcy5jcm9wRGF0YS55IC0gbGluZSwgdGhpcy5jcm9wRGF0YS53ICsgbGluZSAqIDIsIHRoaXMuY3JvcERhdGEuaCArIGxpbmUgKiAyKTtcblx0XHR0aGlzLmNvbnRleHQuZHJhd0ltYWdlKGltZywgc3gsIHN5LCBzdywgc2gsIHRoaXMuY3JvcERhdGEueCwgdGhpcy5jcm9wRGF0YS55LCB0aGlzLmNyb3BEYXRhLncsIHRoaXMuY3JvcERhdGEuaCk7XG5cblx0XHQkLmV2ZW50LnRyaWdnZXIodGhpcy5vcHRpb25zLmN1c3RvbUV2ZW50UHJmeCArICc6ZHJhd0NhbnZhcycsIFt7dzp0aGlzLmNyb3BEYXRhLncsaDp0aGlzLmNyb3BEYXRhLmh9XSk7XG5cblx0fSxcblxuXHRleHBvcnRJbWc6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBpc0pwZyA9IHRoaXMuc291cmNlSW1nLnNyYy5pbmRleE9mKCcuanBnJykgIT0gLTEgfHwgdGhpcy5zb3VyY2VJbWcuc3JjLmluZGV4T2YoJy5qcGVnJykgIT0gLTE7XG5cdFx0dmFyIHRlbXBDYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcblx0XHR2YXIgdGVtcENvbnRleHQgPSB0ZW1wQ2FudmFzLmdldENvbnRleHQoJzJkJyk7XG5cdFx0dmFyIGRhdGFVcmw7XG5cdFx0Ly8gY29uc29sZS5sb2coaXNKcGcpO1xuXG5cdFx0dGVtcENhbnZhcy53aWR0aCA9IHRoaXMuY3JvcERhdGEudztcblx0XHR0ZW1wQ2FudmFzLmhlaWdodCA9IHRoaXMuY3JvcERhdGEuaDtcblx0XHR0ZW1wQ29udGV4dC5kcmF3SW1hZ2UodGhpcy5jYW52YXMsIHRoaXMuY3JvcERhdGEueCwgdGhpcy5jcm9wRGF0YS55LCB0aGlzLmNyb3BEYXRhLncsIHRoaXMuY3JvcERhdGEuaCwgMCwgMCwgdGhpcy5jcm9wRGF0YS53LCB0aGlzLmNyb3BEYXRhLmgpO1xuXHRcdGlmIChpc0pwZykge1xuXHRcdFx0ZGF0YVVybCA9IHRlbXBDYW52YXMudG9EYXRhVVJMKCdpbWFnZS9qcGVnJywgMC44KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0ZGF0YVVybCA9IHRlbXBDYW52YXMudG9EYXRhVVJMKCk7XG5cdFx0fVxuXG5cdFx0dGhpcy4keEltZy5hdHRyKHsnc3JjJzogZGF0YVVybH0pO1xuXG5cdH1cblxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBDYW52YXNDcm9wcGVyO1xuIiwiXG52YXIgQ2FudmFzQ3JvcHBlciA9IEJhY2tib25lLlZpZXcuZXh0ZW5kKHtcblxuXHRjb2xsZWN0aW9uOiBudWxsLFxuXHRtb2RlbDogbnVsbCxcblx0dGVtcGxhdGU6IG51bGwsXG5cblx0c291cmNlSW1nOiBudWxsLFxuXG5cdHRhYkRhdGE6IHt3OiAwLCBoOiAwLCB4OiAwLCB5OiAwLCB5eTogMH0sXG5cdGNyb3BEYXRhOiB7dzogMCwgaDogMCwgeDogMCwgeTogMCwgd3c6IDAsIGhoOiAwLCB4eDogMCwgeXk6IDB9LFxuXHRpbWFnZURhdGE6IHt3OiAwLCBoOiAwLCB4OiAwLCB5OiAwfSxcblx0bW92ZURhdGE6IHtzdGFydFg6IDAsIHN0YXJ0WTogMCwgbW92ZVg6IDAsIG1vdmVZOiAwfSxcblxuXHRldmVudHM6IHtcblx0XHQvL2NhbnZhcyBldmVudHNcblx0XHQnbW91c2Vtb3ZlIGNhbnZhcyc6ICdvbkNhbnZhc01vdXNlbW92ZScsXG5cdFx0J21vdXNlZG93biBjYW52YXMnOiAnYWN0aXZhdGVDYW52YXMnLFxuXHRcdCdtb3VzZXVwIGNhbnZhcyc6ICdkZWFjdGl2YXRlQ2FudmFzJyxcblx0XHQnbW91c2VvdXQgY2FudmFzJzogJ2RlYWN0aXZhdGVDYW52YXMnLFxuXHRcdC8vem9vbSBldmVudHNcblx0XHQnY2hhbmdlIGlucHV0W3R5cGU9cmFuZ2VdJzogJ29uWm9vbUNoYW5nZScsXG5cdFx0J21vdXNlbW92ZSBpbnB1dFt0eXBlPXJhbmdlXSc6ICdvblpvb21Nb3ZlJyxcblx0XHQnbW91c2Vkb3duIGlucHV0W3R5cGU9cmFuZ2VdJzogJ2FjdGl2YXRlWm9vbScsXG5cdFx0J21vdXNldXAgaW5wdXRbdHlwZT1yYW5nZV0nOiAnZGVhY3RpdmF0ZVpvb20nLFxuXHRcdC8vZXhwb3J0XG5cdFx0J2NsaWNrIGJ1dHRvbic6ICdleHBvcnQnXG5cdH0sXG5cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24ob2JqT3B0aW9ucykge1xuXHRcdHZhciBzZWxmID0gdGhpcztcblx0XHR2YXIgbmV3SW1nID0gbmV3IEltYWdlKCk7XG5cblx0XHR0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh7XG5cdFx0XHRmaWxsU3R5bGU6ICdyZ2JhKDAsMCwwLDAuNSknLFxuXHRcdFx0c3Ryb2tlU3R5bGU6ICcjZjAwJyxcblx0XHRcdGxpbmVXaWR0aDogMixcblx0XHRcdHRhYldpZHRoOiAzMCxcblx0XHRcdHRhYkhlaWdodDogMjAsXG5cdFx0XHRjcm9wV2lkdGg6IDEwMCxcblx0XHRcdGNyb3BIZWlnaHQ6IDEwMCxcblx0XHRcdGluaXRpYWxab29tTGV2ZWw6IDEwMFxuXHRcdH0sIG9iak9wdGlvbnMgfHwge30pO1xuXG5cdFx0dGhpcy4kZXhwb3J0QnRuID0gdGhpcy4kZWwuZmluZCgnYnV0dG9uJyk7XG5cdFx0dGhpcy4kZXhwb3J0SW1nID0gdGhpcy4kZWwuZmluZCgnaW1nJyk7XG5cblx0XHR0aGlzLiR6b29tSW5wdXQgPSB0aGlzLiRlbC5maW5kKCdpbnB1dFt0eXBlPXJhbmdlXScpO1xuXHRcdHRoaXMuJHpvb21PdXRwdXQgPSB0aGlzLiR6b29tSW5wdXQubmV4dCgnb3V0cHV0Jyk7XG5cblx0XHR0aGlzLiRjYW52YXMgPSB0aGlzLiRlbC5maW5kKCdjYW52YXMnKTtcblx0XHR0aGlzLmNhbnZhcyA9IHRoaXMuJGNhbnZhc1swXTtcblx0XHR0aGlzLmNvbnRleHQgPSB0aGlzLmNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuXHRcdHRoaXMuY29udGV4dC5zdHJva2VTdHlsZSA9IHRoaXMub3B0aW9ucy5zdHJva2VTdHlsZTtcblx0XHR0aGlzLmNvbnRleHQubGluZVdpZHRoID0gdGhpcy5vcHRpb25zLmxpbmVXaWR0aDtcblx0XHR0aGlzLmNvbnRleHQuZmlsbFN0eWxlID0gdGhpcy5vcHRpb25zLmZpbGxTdHlsZTtcblxuXHRcdHRoaXMuY2FudmFzVyA9IHRoaXMuY2FudmFzLndpZHRoO1xuXHRcdHRoaXMuY2FudmFzSCA9IHRoaXMuY2FudmFzLmhlaWdodDtcblx0XHR0aGlzLmNlbnRlclggPSB0aGlzLmNhbnZhc1cgLyAyO1xuXHRcdHRoaXMuY2VudGVyWSA9IHRoaXMuY2FudmFzSCAvIDI7XG5cdFx0dGhpcy5jdXJyQ2VudGVyWCA9IHRoaXMuY2VudGVyWDtcblx0XHR0aGlzLmN1cnJDZW50ZXJZID0gdGhpcy5jZW50ZXJZO1xuXG5cdFx0dGhpcy5iRHJhZ1RhYiA9IGZhbHNlO1xuXHRcdHRoaXMuYkRyYWdDcm9wcGVyID0gZmFsc2U7XG5cdFx0dGhpcy5iRHJhZ0NhbnZhcyA9IGZhbHNlO1xuXHRcdHRoaXMuYkNhbnZhc0FjdGl2ZSA9IGZhbHNlO1xuXHRcdHRoaXMuYlpvb20gPSBmYWxzZTtcblxuXHRcdHRoaXMuem9vbUxldmVsID0gdGhpcy5vcHRpb25zLmluaXRpYWxab29tTGV2ZWw7XG5cblx0XHR0aGlzLmlzSnBnU291cmNlID0gdGhpcy5vcHRpb25zLmltZ1NyYy5pbmRleE9mKCcuanBnJykgIT0gLTEgfHwgdGhpcy5vcHRpb25zLmltZ1NyYy5pbmRleE9mKCcuanBlZycpICE9IC0xO1xuXG5cdFx0dGhpcy50ZW1wQ2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG5cdFx0dGhpcy50ZW1wQ29udGV4dCA9IHRoaXMudGVtcENhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuXHRcdHRoaXMudGVtcENhbnZhcy53aWR0aCA9IHRoaXMub3B0aW9ucy5jcm9wV2lkdGg7XG5cdFx0dGhpcy50ZW1wQ2FudmFzLmhlaWdodCA9IHRoaXMub3B0aW9ucy5jcm9wSGVpZ2h0O1xuXHRcdHRoaXMuZGF0YVVybCA9IG51bGw7XG5cblx0XHR0aGlzLiR6b29tSW5wdXQudmFsKHRoaXMuem9vbUxldmVsKTtcblx0XHR0aGlzLiR6b29tT3V0cHV0LnRleHQodGhpcy56b29tTGV2ZWwpO1xuXG5cdFx0bmV3SW1nLm9ubG9hZCA9IGZ1bmN0aW9uKCl7XG5cdFx0XHRzZWxmLnNvdXJjZUltZyA9IG5ld0ltZztcblx0XHRcdHNlbGYuaW5pdERhdGEoKTtcblx0XHR9O1xuXHRcdG5ld0ltZy5zcmMgPSB0aGlzLm9wdGlvbnMuaW1nU3JjO1xuXG5cdH0sXG5cblx0aW5pdERhdGE6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciB6b29tID0gdGhpcy56b29tTGV2ZWwgLyAxMDAuMDtcblxuXHRcdHRoaXMuY3JvcERhdGEudyA9IHRoaXMub3B0aW9ucy5jcm9wV2lkdGg7XG5cdFx0dGhpcy5jcm9wRGF0YS5oID0gdGhpcy5vcHRpb25zLmNyb3BIZWlnaHQ7XG5cdFx0dGhpcy5jcm9wRGF0YS54ID0gdGhpcy5jZW50ZXJYIC0gKHRoaXMuY3JvcERhdGEudyAvIDIpOyAvL2NlbnRlcmVkIGhvcml6XG5cdFx0dGhpcy5jcm9wRGF0YS55ID0gdGhpcy5jZW50ZXJZIC0gKHRoaXMuY3JvcERhdGEuaCAvIDIpOyAvL2NlbnRlcmVkIHZlcnRcblx0XHR0aGlzLmNyb3BEYXRhLnd3ID0gdGhpcy5jcm9wRGF0YS53OyAvL3JlZmVyZW5jZSB0byBvcmlnaW5hbCB3XG5cdFx0dGhpcy5jcm9wRGF0YS5oaCA9IHRoaXMuY3JvcERhdGEuaDsgLy9yZWZlcmVuY2UgdG8gb3JpZ2luYWwgaFxuXHRcdHRoaXMuY3JvcERhdGEueHggPSB0aGlzLmNyb3BEYXRhLng7IC8vcmVmZXJlbmNlIHRvIG9yaWdpbmFsIHhcblx0XHR0aGlzLmNyb3BEYXRhLnl5ID0gdGhpcy5jcm9wRGF0YS55OyAvL3JlZmVyZW5jZSB0byBvcmlnaW5hbCB5XG5cblx0XHR0aGlzLmltYWdlRGF0YS53ID0gTWF0aC5mbG9vcih0aGlzLnNvdXJjZUltZy53aWR0aCAqIHpvb20pO1xuXHRcdHRoaXMuaW1hZ2VEYXRhLmggPSBNYXRoLmZsb29yKHRoaXMuc291cmNlSW1nLmhlaWdodCAqIHpvb20pO1xuXHRcdHRoaXMuaW1hZ2VEYXRhLnggPSB0aGlzLmNlbnRlclggLSAodGhpcy5pbWFnZURhdGEudyAvIDIpOyAvL2NlbnRlcmVkIGhvcml6XG5cdFx0dGhpcy5pbWFnZURhdGEueSA9IHRoaXMuY2VudGVyWSAtICh0aGlzLmltYWdlRGF0YS5oIC8gMik7IC8vY2VudGVyZWQgdmVydFxuXG5cdFx0dGhpcy5tb3ZlRGF0YS5zdGFydFggPSAwO1xuXHRcdHRoaXMubW92ZURhdGEuc3RhcnRZID0gMDtcblx0XHR0aGlzLm1vdmVEYXRhLm1vdmVYID0gMDtcblx0XHR0aGlzLm1vdmVEYXRhLm1vdmVZID0gMDtcblxuXHRcdHRoaXMudGFiRGF0YS53ID0gdGhpcy5vcHRpb25zLnRhYldpZHRoO1xuXHRcdHRoaXMudGFiRGF0YS5oID0gdGhpcy5vcHRpb25zLnRhYkhlaWdodDtcblx0XHR0aGlzLnN5bmNUYWJEYXRhKCk7XG5cblx0XHR0aGlzLnJlbmRlcigpO1xuXHR9LFxuXG5cdG9uWm9vbUNoYW5nZTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy56b29tTGV2ZWwgPSB0aGlzLiR6b29tSW5wdXQudmFsKCk7XG5cdFx0dGhpcy4kem9vbU91dHB1dC50ZXh0KHRoaXMuem9vbUxldmVsKTtcblx0XHR0aGlzLnVwZGF0ZVpvb21EYXRhKCk7XG5cdFx0dGhpcy5jaGVja0Nyb3BEYXRhKCk7XG5cdFx0dGhpcy5zeW5jVGFiRGF0YSgpO1xuXHRcdHRoaXMucmVuZGVyKCk7XG5cdH0sXG5cdG9uWm9vbU1vdmU6IGZ1bmN0aW9uKCkge1xuXHRcdGlmICh0aGlzLmJab29tKSB7XG5cdFx0XHR0aGlzLiR6b29tSW5wdXQudHJpZ2dlcignY2hhbmdlJyk7XG5cdFx0fVxuXHR9LFxuXHRhY3RpdmF0ZVpvb206IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuYlpvb20gPSB0cnVlO1xuXHRcdHRoaXMuJHpvb21JbnB1dC5mb2N1cygpO1xuXHR9LFxuXHRkZWFjdGl2YXRlWm9vbTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5iWm9vbSA9IGZhbHNlO1xuXHR9LFxuXHR1cGRhdGVab29tRGF0YTogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHpvb20gPSB0aGlzLnpvb21MZXZlbCAvIDEwMC4wO1xuXG5cdFx0dGhpcy5pbWFnZURhdGEudyA9IE1hdGguZmxvb3IodGhpcy5zb3VyY2VJbWcud2lkdGggKiB6b29tKTtcblx0XHR0aGlzLmltYWdlRGF0YS5oID0gTWF0aC5mbG9vcih0aGlzLnNvdXJjZUltZy5oZWlnaHQgKiB6b29tKTtcblx0XHR0aGlzLmltYWdlRGF0YS54ID0gdGhpcy5jdXJyQ2VudGVyWCAtICh0aGlzLmltYWdlRGF0YS53IC8gMik7XG5cdFx0dGhpcy5pbWFnZURhdGEueSA9IHRoaXMuY3VyckNlbnRlclkgLSAodGhpcy5pbWFnZURhdGEuaCAvIDIpO1xuXG5cdH0sXG5cblx0Y2hlY2tDcm9wRGF0YTogZnVuY3Rpb24oKSB7XG5cblx0XHQvLyBtYWtlIHN1cmUgY3JvcERhdGEgY29vcmRzIGFyZW4ndCBvdXRzaWRlIHNvdXJjZUltZyBib3VuZGFyeVxuXHRcdGlmICh0aGlzLmNyb3BEYXRhLnggPCB0aGlzLmltYWdlRGF0YS54KSB7XG5cdFx0XHR0aGlzLmNyb3BEYXRhLnggPSB0aGlzLmltYWdlRGF0YS54O1xuXHRcdFx0dGhpcy5jcm9wRGF0YS54eCA9IHRoaXMuY3JvcERhdGEueDtcblx0XHR9XG5cdFx0aWYgKHRoaXMuY3JvcERhdGEueSA8IHRoaXMuaW1hZ2VEYXRhLnkpIHtcblx0XHRcdHRoaXMuY3JvcERhdGEueSA9IHRoaXMuaW1hZ2VEYXRhLnk7XG5cdFx0XHR0aGlzLmNyb3BEYXRhLnl5ID0gdGhpcy5jcm9wRGF0YS55O1xuXHRcdH1cblx0XHRpZiAodGhpcy5jcm9wRGF0YS54ICsgdGhpcy5jcm9wRGF0YS53ID4gdGhpcy5pbWFnZURhdGEueCArIHRoaXMuaW1hZ2VEYXRhLncpIHtcblx0XHRcdHRoaXMuY3JvcERhdGEueCA9ICh0aGlzLmltYWdlRGF0YS54ICsgdGhpcy5pbWFnZURhdGEudykgLSB0aGlzLmNyb3BEYXRhLnc7XG5cdFx0XHR0aGlzLmNyb3BEYXRhLnh4ID0gdGhpcy5jcm9wRGF0YS54O1xuXHRcdH1cblx0XHRpZiAodGhpcy5jcm9wRGF0YS55ICsgdGhpcy5jcm9wRGF0YS5oID4gdGhpcy5pbWFnZURhdGEueSArIHRoaXMuaW1hZ2VEYXRhLmgpIHtcblx0XHRcdHRoaXMuY3JvcERhdGEueSA9ICh0aGlzLmltYWdlRGF0YS55ICsgdGhpcy5pbWFnZURhdGEuaCkgLSB0aGlzLmNyb3BEYXRhLmg7XG5cdFx0XHR0aGlzLmNyb3BEYXRhLnl5ID0gdGhpcy5jcm9wRGF0YS55O1xuXHRcdH1cblxuXHR9LFxuXG5cdHN5bmNUYWJEYXRhOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLnRhYkRhdGEueCA9IHRoaXMuY3JvcERhdGEueCArICh0aGlzLmNyb3BEYXRhLncgLyAyKSAtICh0aGlzLnRhYkRhdGEudyAvIDIpO1xuXHRcdHRoaXMudGFiRGF0YS55ID0gdGhpcy5jcm9wRGF0YS55ICsgdGhpcy5jcm9wRGF0YS5oIC0gKHRoaXMudGFiRGF0YS5oIC8gMik7XG5cdFx0dGhpcy50YWJEYXRhLnl5ID0gdGhpcy50YWJEYXRhLnk7IC8vcmVmZXJlbmNlIHRvIG9yaWdpbmFsIHlcblxuXHRcdHRoaXMudGVtcENhbnZhcy53aWR0aCA9IHRoaXMuY3JvcERhdGEudztcblx0XHR0aGlzLnRlbXBDYW52YXMuaGVpZ2h0ID0gdGhpcy5jcm9wRGF0YS5oO1xuXG5cdH0sXG5cblx0b25DYW52YXNNb3VzZW1vdmU6IGZ1bmN0aW9uKGUpIHtcblx0XHQvL2NvbnNvbGUubG9nKCdvbk1vdXNlbW92ZScpO1xuXHRcdHZhciBjYW52YXNPZmZzZXQgPSB0aGlzLiRjYW52YXMub2Zmc2V0KCk7XG5cdFx0dmFyIG1vdXNlWCA9IE1hdGguZmxvb3IoZS5wYWdlWCAtIGNhbnZhc09mZnNldC5sZWZ0KTtcblx0XHR2YXIgbW91c2VZID0gTWF0aC5mbG9vcihlLnBhZ2VZIC0gY2FudmFzT2Zmc2V0LnRvcCk7XG5cblx0XHRpZiAodGhpcy5iQ2FudmFzQWN0aXZlKSB7XG5cblx0XHRcdHRoaXMubW92ZURhdGEubW92ZVggPSAodGhpcy5tb3ZlRGF0YS5zdGFydFggLSBtb3VzZVgpICogLTE7XG5cdFx0XHR0aGlzLm1vdmVEYXRhLm1vdmVZID0gKHRoaXMubW92ZURhdGEuc3RhcnRZIC0gbW91c2VZKSAqIC0xO1xuXG5cdFx0XHRpZiAodGhpcy5iRHJhZ1RhYikge1xuXHRcdFx0XHRjb25zb2xlLmxvZygnYkRyYWdUYWInKTtcblx0XHRcdFx0Y29uc29sZS5sb2codGhpcy5jcm9wRGF0YS5oaCArIHRoaXMubW92ZURhdGEubW92ZVkpO1xuXG5cdFx0XHRcdHRoaXMuY3JvcERhdGEuaCA9IHRoaXMuY3JvcERhdGEuaGggKyB0aGlzLm1vdmVEYXRhLm1vdmVZO1xuXG5cdFx0XHR9IGVsc2UgaWYgKHRoaXMuYkRyYWdDcm9wcGVyKSB7XG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ2JEcmFnQ3JvcHBlcicpO1xuXG5cdFx0XHRcdHRoaXMuY3JvcERhdGEueCA9IHRoaXMuY3JvcERhdGEueHggKyB0aGlzLm1vdmVEYXRhLm1vdmVYO1xuXHRcdFx0XHR0aGlzLmNyb3BEYXRhLnkgPSB0aGlzLmNyb3BEYXRhLnl5ICsgdGhpcy5tb3ZlRGF0YS5tb3ZlWTtcblxuXHRcdFx0XHQvLyBtYWtlIHN1cmUgY3JvcERhdGEgY29vcmRzIGFyZW4ndCBvdXRzaWRlIGNhbnZhcyBib3VuZGFyeVxuXHRcdFx0XHRpZiAodGhpcy5jcm9wRGF0YS54IDwgMCkge1xuXHRcdFx0XHRcdHRoaXMuY3JvcERhdGEueCA9IDA7XG5cdFx0XHRcdFx0dGhpcy5jcm9wRGF0YS54eCA9IDA7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKHRoaXMuY3JvcERhdGEueSA8IDApIHtcblx0XHRcdFx0XHR0aGlzLmNyb3BEYXRhLnkgPSAwO1xuXHRcdFx0XHRcdHRoaXMuY3JvcERhdGEueXkgPSAwO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmICh0aGlzLmNyb3BEYXRhLnggKyB0aGlzLmNyb3BEYXRhLncgPiB0aGlzLmNhbnZhc1cpIHtcblx0XHRcdFx0XHR0aGlzLmNyb3BEYXRhLnggPSB0aGlzLmNhbnZhc1cgLSB0aGlzLmNyb3BEYXRhLnc7XG5cdFx0XHRcdFx0dGhpcy5jcm9wRGF0YS54eCA9IHRoaXMuY3JvcERhdGEueDtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAodGhpcy5jcm9wRGF0YS55ICsgdGhpcy5jcm9wRGF0YS5oID4gdGhpcy5jYW52YXNIKSB7XG5cdFx0XHRcdFx0dGhpcy5jcm9wRGF0YS55ID0gdGhpcy5jYW52YXNIIC0gdGhpcy5jcm9wRGF0YS5oO1xuXHRcdFx0XHRcdHRoaXMuY3JvcERhdGEueXkgPSB0aGlzLmNyb3BEYXRhLnk7XG5cdFx0XHRcdH1cblxuXHRcdFx0fSBlbHNlIGlmICh0aGlzLmJEcmFnQ2FudmFzKSB7XG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ2JEcmFnQ2FudmFzJyk7XG5cblx0XHRcdFx0dGhpcy5jdXJyQ2VudGVyWCA9IHRoaXMuY2VudGVyWCArIHRoaXMubW92ZURhdGEubW92ZVg7XG5cdFx0XHRcdHRoaXMuY3VyckNlbnRlclkgPSB0aGlzLmNlbnRlclkgKyB0aGlzLm1vdmVEYXRhLm1vdmVZO1xuXHRcdFx0XHR0aGlzLmltYWdlRGF0YS54ID0gdGhpcy5jdXJyQ2VudGVyWCAtICh0aGlzLmltYWdlRGF0YS53IC8gMik7XG5cdFx0XHRcdHRoaXMuaW1hZ2VEYXRhLnkgPSB0aGlzLmN1cnJDZW50ZXJZIC0gKHRoaXMuaW1hZ2VEYXRhLmggLyAyKTtcblxuXHRcdFx0fVxuXG5cdFx0XHR0aGlzLmNoZWNrQ3JvcERhdGEoKTtcblx0XHRcdHRoaXMuc3luY1RhYkRhdGEoKTtcblx0XHRcdHRoaXMucmVuZGVyKCk7XG5cblx0XHR9XG5cblx0fSxcblxuXHRhY3RpdmF0ZUNhbnZhczogZnVuY3Rpb24oZSkge1xuXHRcdC8vY29uc29sZS5sb2coJ2FjdGl2YXRlQ2FudmFzJyk7XG5cdFx0dmFyIGNhbnZhc09mZnNldCA9IHRoaXMuJGNhbnZhcy5vZmZzZXQoKTtcblx0XHR2YXIgbW91c2VYID0gTWF0aC5mbG9vcihlLnBhZ2VYIC0gY2FudmFzT2Zmc2V0LmxlZnQpO1xuXHRcdHZhciBtb3VzZVkgPSBNYXRoLmZsb29yKGUucGFnZVkgLSBjYW52YXNPZmZzZXQudG9wKTtcblxuXHRcdHRoaXMubW92ZURhdGEuc3RhcnRYID0gbW91c2VYO1xuXHRcdHRoaXMubW92ZURhdGEuc3RhcnRZID0gbW91c2VZO1xuXHRcdHRoaXMubW92ZURhdGEubW92ZVggPSBtb3VzZVg7XG5cdFx0dGhpcy5tb3ZlRGF0YS5tb3ZlWSA9IG1vdXNlWTtcblxuXHRcdHRoaXMuYkNhbnZhc0FjdGl2ZSA9IHRydWU7XG5cblx0XHRpZiAobW91c2VYID4gdGhpcy50YWJEYXRhLnggJiYgbW91c2VYIDwgdGhpcy50YWJEYXRhLnggKyB0aGlzLnRhYkRhdGEudyAmJiBcblx0XHRcdG1vdXNlWSA+IHRoaXMudGFiRGF0YS55ICYmIG1vdXNlWSA8IHRoaXMudGFiRGF0YS55ICsgdGhpcy50YWJEYXRhLmgpIHtcblx0XHRcdC8vYWN0aXZhdGUgdGFiIGRyYWdcblx0XHRcdHRoaXMuYkRyYWdUYWIgPSB0cnVlO1xuXHRcdFx0Y29uc29sZS5sb2codGhpcy5jcm9wRGF0YS5oKTtcblxuXHRcdH0gZWxzZSBpZiAobW91c2VYID4gdGhpcy5jcm9wRGF0YS54ICYmIG1vdXNlWCA8IHRoaXMuY3JvcERhdGEueCArIHRoaXMuY3JvcERhdGEudyAmJiBcblx0XHRcdG1vdXNlWSA+IHRoaXMuY3JvcERhdGEueSAmJiBtb3VzZVkgPCB0aGlzLmNyb3BEYXRhLnkgKyB0aGlzLmNyb3BEYXRhLmgpIHtcblx0XHRcdC8vYWN0aXZhdGUgY3JvcHBlciBkcmFnXG5cdFx0XHR0aGlzLmJEcmFnQ3JvcHBlciA9IHRydWU7XG5cblx0XHR9IGVsc2Uge1xuXHRcdFx0Ly9hY3RpdmF0ZSBjYW52YXMgZHJhZ1xuXHRcdFx0dGhpcy5iRHJhZ0NhbnZhcyA9IHRydWU7XG5cdFx0fVxuXG5cdH0sXG5cblx0ZGVhY3RpdmF0ZUNhbnZhczogZnVuY3Rpb24oZSkge1xuXHRcdFxuXHRcdGlmICh0aGlzLmJDYW52YXNBY3RpdmUpIHtcblxuXHRcdFx0aWYgKHRoaXMuYkRyYWdUYWIpIHtcblx0XHRcdFx0dGhpcy5jcm9wRGF0YS5oaCA9IHRoaXMuY3JvcERhdGEuaDtcblx0XHRcdH1cblxuXHRcdFx0aWYgKHRoaXMuYkRyYWdDcm9wcGVyKSB7XG5cdFx0XHRcdHRoaXMuY3JvcERhdGEueHggPSB0aGlzLmNyb3BEYXRhLng7XG5cdFx0XHRcdHRoaXMuY3JvcERhdGEueXkgPSB0aGlzLmNyb3BEYXRhLnk7XG5cdFx0XHR9XG5cblx0XHRcdGlmICh0aGlzLmJEcmFnQ2FudmFzKSB7XG5cdFx0XHRcdHRoaXMuY2VudGVyWCA9IHRoaXMuY3VyckNlbnRlclg7XG5cdFx0XHRcdHRoaXMuY2VudGVyWSA9IHRoaXMuY3VyckNlbnRlclk7XG5cdFx0XHR9XG5cblx0XHRcdHRoaXMubW92ZURhdGEuc3RhcnRYID0gMDtcblx0XHRcdHRoaXMubW92ZURhdGEuc3RhcnRZID0gMDtcblx0XHRcdHRoaXMubW92ZURhdGEubW92ZVggPSAwO1xuXHRcdFx0dGhpcy5tb3ZlRGF0YS5tb3ZlWSA9IDA7XG5cblx0XHRcdHRoaXMuYkRyYWdUYWIgPSBmYWxzZTtcblx0XHRcdHRoaXMuYkRyYWdDcm9wcGVyID0gZmFsc2U7XG5cdFx0XHR0aGlzLmJEcmFnQ2FudmFzID0gZmFsc2U7XG5cdFx0XHR0aGlzLmJDYW52YXNBY3RpdmUgPSBmYWxzZTtcblxuXHRcdH1cblxuXHR9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cblx0XHQvL2NsZWFyIGNhbnZhcyBhbmQgZHJhdyBpbWFnZVxuXHRcdHRoaXMuY29udGV4dC5jbGVhclJlY3QoMCwgMCwgdGhpcy5jYW52YXNXLCB0aGlzLmNhbnZhc0gpO1xuXHRcdHRoaXMuY29udGV4dC5kcmF3SW1hZ2UodGhpcy5zb3VyY2VJbWcsIHRoaXMuaW1hZ2VEYXRhLngsIHRoaXMuaW1hZ2VEYXRhLnksIHRoaXMuaW1hZ2VEYXRhLncsIHRoaXMuaW1hZ2VEYXRhLmgpO1xuXG5cdFx0Ly9jbGVhciB0ZW1wIGNhbnZhcyBhbmQgZHJhdyB0ZW1wIGltYWdlXG5cdFx0dGhpcy50ZW1wQ29udGV4dC5jbGVhclJlY3QoMCwgMCwgdGhpcy5jcm9wRGF0YS53LCB0aGlzLmNyb3BEYXRhLmgpO1xuXHRcdHRoaXMudGVtcENvbnRleHQuZHJhd0ltYWdlKHRoaXMuY2FudmFzLCB0aGlzLmNyb3BEYXRhLngsIHRoaXMuY3JvcERhdGEueSwgdGhpcy5jcm9wRGF0YS53LCB0aGlzLmNyb3BEYXRhLmgsIDAsIDAsIHRoaXMuY3JvcERhdGEudywgdGhpcy5jcm9wRGF0YS5oKTtcblx0XHR0aGlzLmRhdGFVcmwgPSB0aGlzLmlzSnBnU291cmNlID8gdGhpcy50ZW1wQ2FudmFzLnRvRGF0YVVSTCgnaW1hZ2UvanBlZycsIDAuOCkgOiB0aGlzLnRlbXBDYW52YXMudG9EYXRhVVJMKCk7XG5cblx0XHQvL2RpbSBjYW52YXMgYW5kIGluamVjdCB0ZW1wIGltYWdlIFxuXHRcdHRoaXMuY29udGV4dC5maWxsUmVjdCgwLCAwLCB0aGlzLmNhbnZhc1csIHRoaXMuY2FudmFzSCk7XG5cdFx0dGhpcy5jb250ZXh0LnN0cm9rZVJlY3QodGhpcy5jcm9wRGF0YS54IC0gMSwgdGhpcy5jcm9wRGF0YS55IC0gMSwgdGhpcy5jcm9wRGF0YS53ICsgMiwgdGhpcy5jcm9wRGF0YS5oICsgMik7XG5cdFx0dGhpcy5jb250ZXh0LmRyYXdJbWFnZSh0aGlzLnRlbXBDYW52YXMsIDAsIDAsIHRoaXMuY3JvcERhdGEudywgdGhpcy5jcm9wRGF0YS5oLCB0aGlzLmNyb3BEYXRhLngsIHRoaXMuY3JvcERhdGEueSwgdGhpcy5jcm9wRGF0YS53LCB0aGlzLmNyb3BEYXRhLmgpO1xuXG5cdFx0Ly9hZGQgZHJhZyB0YWJcblx0XHR0aGlzLmNvbnRleHQuZmlsbFN0eWxlID0gdGhpcy5vcHRpb25zLnN0cm9rZVN0eWxlO1xuXHRcdHRoaXMuY29udGV4dC5maWxsUmVjdCh0aGlzLnRhYkRhdGEueCwgdGhpcy50YWJEYXRhLnksIHRoaXMudGFiRGF0YS53LCB0aGlzLnRhYkRhdGEuaCk7XG5cdFx0dGhpcy5jb250ZXh0LmZpbGxTdHlsZSA9IHRoaXMub3B0aW9ucy5maWxsU3R5bGU7XG5cblx0fSxcblxuXHRleHBvcnQ6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuJGV4cG9ydEltZy5hdHRyKHsnc3JjJzogdGhpcy5kYXRhVXJsfSk7XG5cdH1cblxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQ2FudmFzQ3JvcHBlcjtcbiJdfQ==
;