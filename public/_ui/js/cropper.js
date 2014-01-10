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
				//console.log('bDragTab');

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
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvY2hyaXNuL1NpdGVzL0dpdEh1Yi9jbmVsc29uODcvY2FudmFzLWNyb3BwZXIvc3JjL3NjcmlwdHMvaW5pdGlhbGl6ZS5qcyIsIi9Vc2Vycy9jaHJpc24vU2l0ZXMvR2l0SHViL2NuZWxzb244Ny9jYW52YXMtY3JvcHBlci9zcmMvc2NyaXB0cy9BcHBsaWNhdGlvbi5qcyIsIi9Vc2Vycy9jaHJpc24vU2l0ZXMvR2l0SHViL2NuZWxzb244Ny9jYW52YXMtY3JvcHBlci9zcmMvc2NyaXB0cy9hcHAvQ2FudmFzQXBwLmpzIiwiL1VzZXJzL2Nocmlzbi9TaXRlcy9HaXRIdWIvY25lbHNvbjg3L2NhbnZhcy1jcm9wcGVyL3NyYy9zY3JpcHRzL3dpZGdldHMvQ2FudmFzQ3JvcHBlci5qcyIsIi9Vc2Vycy9jaHJpc24vU2l0ZXMvR2l0SHViL2NuZWxzb244Ny9jYW52YXMtY3JvcHBlci9zcmMvc2NyaXB0cy92aWV3cy9DYW52YXNDcm9wcGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0U0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsiXG52YXIgQXBwbGljYXRpb24gPSByZXF1aXJlKCcuL0FwcGxpY2F0aW9uJyk7XG5cbnZhciBDYW52YXNBcHAgPSByZXF1aXJlKCcuL2FwcC9DYW52YXNBcHAnKTtcblxuJChmdW5jdGlvbigpIHtcblx0aWYgKCQoJ2JvZHknKS5oYXNDbGFzcygnYmFja2JvbmUtcGFnZScpKSB7XG5cdFx0bmV3IENhbnZhc0FwcCgpO1xuXHR9IGVsc2Uge1xuXHRcdEFwcGxpY2F0aW9uLmluaXRpYWxpemUoKTtcblx0fVxufSk7XG4iLCJcbnZhciBDYW52YXNDcm9wcGVyID0gcmVxdWlyZSgnLi93aWRnZXRzL0NhbnZhc0Nyb3BwZXInKTtcblxudmFyIEFwcGxpY2F0aW9uID0ge1xuXHRpbml0aWFsaXplOiBmdW5jdGlvbigpIHtcblx0XHQvL2NvbnNvbGUubG9nKCdBcHBsaWNhdGlvbjppbml0aWFsaXplJyk7XG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xuXG5cdFx0dGhpcy4kd2luZG93ID0gJCh3aW5kb3cpO1xuXHRcdHRoaXMuJGRvY3VtZW50ID0gJChkb2N1bWVudCk7XG5cdFx0dGhpcy4kaHRtbCA9ICQoJ2h0bWwnKTtcblx0XHR0aGlzLiRib2R5ID0gJCgnYm9keScpO1xuXG5cdFx0dmFyICRlbCA9ICQoJyNjYW52YXMtY3JvcHBlcicpO1xuXHRcdHZhciAkY2F0bGlua3MgPSAkKCcjY2F0bmF2JykuZmluZCgnYScpO1xuXHRcdHZhciBpbWdTcmMgPSAkKCRjYXRsaW5rc1swXSkuZGF0YSgnaHJlZicpO1xuXHRcdHZhciAkb3V0cHV0ID0gJCgnI3NpemUtb3V0cHV0Jyk7XG5cblx0XHR0aGlzLmNhbnZhc0Nyb3BwZXIgPSBuZXcgQ2FudmFzQ3JvcHBlcigkZWwsIHtpbWdTcmM6aW1nU3JjfSk7XG5cblx0XHQkY2F0bGlua3Mub24oJ2NsaWNrJywgZnVuY3Rpb24oZSl7XG5cdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHR2YXIgaW1nU3JjID0gJCh0aGlzKS5kYXRhKCdocmVmJyk7XG5cdFx0XHRzZWxmLmNhbnZhc0Nyb3BwZXIuc2V0SW1nU3JjKGltZ1NyYyk7XG5cdFx0fSk7XG5cblx0XHR0aGlzLiRkb2N1bWVudC5vbignQ2FudmFzQ3JvcHBlcjpkcmF3Q2FudmFzJywgZnVuY3Rpb24oZSwgZGF0YSl7XG5cdFx0XHQkb3V0cHV0LnRleHQoJ2Nyb3Agc2l6ZTogJyArIGRhdGEudyArICcgeCAnICsgZGF0YS5oKTtcblx0XHR9KTtcblxuXHR9XG5cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQXBwbGljYXRpb247XG4iLCJcbnZhciBDYW52YXNDcm9wcGVyID0gcmVxdWlyZSgnLi4vdmlld3MvQ2FudmFzQ3JvcHBlcicpO1xuXG52YXIgQ2FudmFzQXBwID0gQmFja2JvbmUuVmlldy5leHRlbmQoe1xuXG5cdGNvbGxlY3Rpb246IG51bGwsXG5cblx0dGVtcGxhdGU6IG51bGwsXG5cblx0ZXZlbnRzOiB7XG5cblx0fSxcblxuXHRpbml0aWFsaXplOiBmdW5jdGlvbigpIHtcblxuXG5cdFx0dGhpcy5jYW52YXNDcm9wcGVyID0gbmV3IENhbnZhc0Nyb3BwZXIoe1xuXHRcdFx0ZWw6ICcjY2FudmFzLWNyb3BwZXInLFxuXHRcdFx0aW1nU3JjOiAnL2RhdGEvZmF0LWNhdC5wbmcnLFxuXHRcdFx0Y3JvcFdpZHRoOiAxNjAsXG5cdFx0XHRjcm9wSGVpZ2h0OiAxMjBcblx0XHR9KTtcblxuXHR9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cblxuXHR9XG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IENhbnZhc0FwcDtcbiIsIlxudmFyIENhbnZhc0Nyb3BwZXIgPSBmdW5jdGlvbigkZWwsIG9iak9wdGlvbnMpe1xuXG5cdHRoaXMuJGVsID0gJGVsO1xuXG5cdHRoaXMub3B0aW9ucyA9ICQuZXh0ZW5kKHtcblx0XHRzZWxlY3RvckV4cG9ydEJ0bjogJy5jYW52YXMtZmlsdGVycyAuYnRuLWV4cG9ydCcsXG5cdFx0c2VsZWN0b3JFeHBvcnRJbWc6ICcuY2FudmFzLWV4cG9ydCBpbWcnLFxuXHRcdHNlbGVjdG9yRmlsdGVyczogJy5jYW52YXMtZmlsdGVycyBpbnB1dFt0eXBlPXJhZGlvXScsXG5cdFx0c2VsZWN0b3Jab29tUmFuZ2U6ICcuY2FudmFzLWZpbHRlcnMgaW5wdXRbdHlwZT1yYW5nZV0nLFxuXHRcdHNlbGVjdG9yQ2FudmFzOiAnLmNhbnZhcy1ob2xkZXIgY2FudmFzJyxcblx0XHRpbml0aWFsWm9vbUxldmVsOiAxMDAsXG5cdFx0ZmlsbFN0eWxlOiAncmdiYSgwLDAsMCwwLjUpJyxcblx0XHRzdHJva2VTdHlsZTogJyNmMDAnLFxuXHRcdGxpbmVXaWR0aDogMixcblx0XHRpbWdTcmM6ICcnLCAvL3N0cjogcGF0aCB0byBpbWFnZSBzcmNcblx0XHRjdXN0b21FdmVudFByZng6ICdDYW52YXNDcm9wcGVyJ1xuXHR9LCBvYmpPcHRpb25zIHx8IHt9KTtcblxuXHR0aGlzLiR4QnRuID0gdGhpcy4kZWwuZmluZCh0aGlzLm9wdGlvbnMuc2VsZWN0b3JFeHBvcnRCdG4pO1xuXHR0aGlzLiR4SW1nID0gdGhpcy4kZWwuZmluZCh0aGlzLm9wdGlvbnMuc2VsZWN0b3JFeHBvcnRJbWcpO1xuXG5cdHRoaXMuJGZpbHRlcnMgPSB0aGlzLiRlbC5maW5kKHRoaXMub3B0aW9ucy5zZWxlY3RvckZpbHRlcnMpO1xuXHR0aGlzLiRjdXJyRmx0ciA9IHRoaXMuJGZpbHRlcnMuZmlsdGVyKCc6Y2hlY2tlZCcpO1xuXHRpZiAoIXRoaXMuJGN1cnJGbHRyLmxlbmd0aCkge1xuXHRcdHRoaXMuJGN1cnJGbHRyID0gJCh0aGlzLiRmaWx0ZXJzWzBdKTtcblx0XHR0aGlzLiRjdXJyRmx0ci5wcm9wKHsnY2hlY2tlZCc6dHJ1ZX0pO1xuXHR9XG5cblx0dGhpcy4kem9vbUlucHV0ID0gdGhpcy4kZWwuZmluZCh0aGlzLm9wdGlvbnMuc2VsZWN0b3Jab29tUmFuZ2UpO1xuXHR0aGlzLiR6b29tT3V0cHV0ID0gdGhpcy4kem9vbUlucHV0Lm5leHQoJ291dHB1dCcpO1xuXG5cdHRoaXMuJGNhbnZhcyA9IHRoaXMuJGVsLmZpbmQodGhpcy5vcHRpb25zLnNlbGVjdG9yQ2FudmFzKTtcblx0dGhpcy5jYW52YXMgPSB0aGlzLiRjYW52YXNbMF07XG5cblx0dGhpcy5jb250ZXh0ID0gdGhpcy5jYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblx0dGhpcy5jb250ZXh0LnN0cm9rZVN0eWxlID0gdGhpcy5vcHRpb25zLnN0cm9rZVN0eWxlO1xuXHR0aGlzLmNvbnRleHQubGluZVdpZHRoID0gdGhpcy5vcHRpb25zLmxpbmVXaWR0aDtcblx0dGhpcy5jb250ZXh0LmZpbGxTdHlsZSA9IHRoaXMub3B0aW9ucy5maWxsU3R5bGU7XG5cblx0dGhpcy5jYW52YXNXID0gdGhpcy5jYW52YXMud2lkdGg7XG5cdHRoaXMuY2FudmFzSCA9IHRoaXMuY2FudmFzLmhlaWdodDtcblx0dGhpcy5jZW50ZXJYID0gdGhpcy5jYW52YXNXIC8gMjtcblx0dGhpcy5jZW50ZXJZID0gdGhpcy5jYW52YXNIIC8gMjtcblxuXHR0aGlzLmNyb3BEYXRhID0ge3c6IDAsIGg6IDAsIHg6IDAsIHk6IDAsIGFkalg6IDAsIGFkalk6IDAsIG1vdmVYOiAwLCBtb3ZlWTogMCwgc3RhcnRYOiAwLCBzdGFydFk6IDB9O1xuXG5cdHRoaXMuYkRyYWdDYW52YXMgPSBmYWxzZTtcblx0dGhpcy5iRHJhZ0Nyb3BwZXIgPSBmYWxzZTtcblx0dGhpcy5iWm9vbSA9IGZhbHNlO1xuXG5cdHRoaXMuem9vbUxldmVsID0gdGhpcy5vcHRpb25zLmluaXRpYWxab29tTGV2ZWw7XG5cblx0dGhpcy5pbml0KCk7XG5cbn07XG5cbkNhbnZhc0Nyb3BwZXIucHJvdG90eXBlID0ge1xuXG5cdGluaXQ6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBzZWxmID0gdGhpcztcblxuXHRcdHRoaXMuJHpvb21JbnB1dC52YWwodGhpcy56b29tTGV2ZWwpO1xuXHRcdHRoaXMuJHpvb21PdXRwdXQudGV4dCh0aGlzLnpvb21MZXZlbCk7XG5cblx0XHR0aGlzLmJpbmRFdmVudHMoKTtcblx0XHR0aGlzLmJpbmRab29tRXZlbnRzKCk7XG5cdFx0dGhpcy5iaW5kQ2FudmFzRXZlbnRzKCk7XG5cblx0XHR0aGlzLmluaXRDcm9wRGF0YSgpO1xuXG5cdFx0aWYgKHRoaXMub3B0aW9ucy5pbWdTcmMpIHtcblx0XHRcdHRoaXMuc2V0SW1nU3JjKHRoaXMub3B0aW9ucy5pbWdTcmMpO1xuXHRcdH1cblxuXHR9LFxuXG5cdGJpbmRFdmVudHM6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBzZWxmID0gdGhpcztcblxuXHRcdHRoaXMuJHhCdG4ub24oJ2NsaWNrJywgZnVuY3Rpb24oZSl7XG5cdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRzZWxmLmV4cG9ydEltZygpO1xuXHRcdH0pO1xuXG5cdFx0dGhpcy4kZmlsdGVycy5vbignY2xpY2snLCBmdW5jdGlvbihlKXtcblx0XHRcdHNlbGYuJGN1cnJGbHRyID0gJCh0aGlzKTtcblx0XHRcdHNlbGYuaW5pdENyb3BEYXRhKCk7XG5cdFx0XHRzZWxmLmRyYXdDYW52YXMoKTtcblx0XHR9KTtcblxuXHR9LFxuXG5cdGJpbmRab29tRXZlbnRzOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cblx0XHR0aGlzLiR6b29tSW5wdXRcblx0XHRcdC5vbignY2hhbmdlJywgZnVuY3Rpb24oZSl7XG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ2NoYW5nZScpO1xuXHRcdFx0XHRzZWxmLnpvb21MZXZlbCA9IHNlbGYuJHpvb21JbnB1dC52YWwoKTtcblx0XHRcdFx0c2VsZi4kem9vbU91dHB1dC50ZXh0KHNlbGYuem9vbUxldmVsKTtcblx0XHRcdFx0c2VsZi5kcmF3Q2FudmFzKCk7XG5cdFx0XHRcdFxuXHRcdFx0fSlcblx0XHRcdC5vbignbW91c2Vtb3ZlJywgZnVuY3Rpb24oZSl7XG5cdFx0XHRcdGlmIChzZWxmLmJab29tKSB7XG5cdFx0XHRcdFx0c2VsZi4kem9vbUlucHV0LnRyaWdnZXIoJ2NoYW5nZScpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KVxuXHRcdFx0Lm9uKCdtb3VzZWRvd24nLCBmdW5jdGlvbihlKXtcblx0XHRcdFx0c2VsZi5iWm9vbSA9IHRydWU7XG5cdFx0XHRcdHNlbGYuJHpvb21JbnB1dC5mb2N1cygpO1xuXHRcdFx0fSlcblx0XHRcdC5vbignbW91c2V1cCcsIGZ1bmN0aW9uKGUpe1xuXHRcdFx0XHRzZWxmLmJab29tID0gZmFsc2U7XG5cdFx0XHR9KTtcblxuXHR9LFxuXG5cdGJpbmRDYW52YXNFdmVudHM6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBzZWxmID0gdGhpcztcblxuXHRcdHRoaXMuJGNhbnZhc1xuXHRcdFx0Lm9uKCdtb3VzZW1vdmUnLCBmdW5jdGlvbihlKXtcblx0XHRcdFx0Ly9jb25zb2xlLmxvZygnbW91c2Vtb3ZlJyk7XG5cdFx0XHRcdHZhciBjYW52YXNPZmZzZXQgPSBzZWxmLiRjYW52YXMub2Zmc2V0KCk7XG5cdFx0XHRcdHZhciBtb3VzZVggPSBNYXRoLmZsb29yKGUucGFnZVggLSBjYW52YXNPZmZzZXQubGVmdCk7XG5cdFx0XHRcdHZhciBtb3VzZVkgPSBNYXRoLmZsb29yKGUucGFnZVkgLSBjYW52YXNPZmZzZXQudG9wKTtcblxuXHRcdFx0XHRpZiAoc2VsZi5iRHJhZ0Nyb3BwZXIpIHtcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdiRHJhZ0Nyb3BwZXInKTtcblxuXHRcdFx0XHRcdHNlbGYuY3JvcERhdGEueCA9IG1vdXNlWCAtIHNlbGYuY3JvcERhdGEuYWRqWDtcblx0XHRcdFx0XHRzZWxmLmNyb3BEYXRhLnkgPSBtb3VzZVkgLSBzZWxmLmNyb3BEYXRhLmFkalk7XG5cblx0XHRcdFx0XHQvLyBtYWtlIHN1cmUgY3JvcERhdGEgY29vcmRzIGFyZW4ndCBvdXRzaWRlIGNhbnZhcyBib3VuZGFyeVxuXHRcdFx0XHRcdGlmIChzZWxmLmNyb3BEYXRhLnggPCAwKSB7XG5cdFx0XHRcdFx0XHRzZWxmLmNyb3BEYXRhLnggPSAwO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRpZiAoc2VsZi5jcm9wRGF0YS55IDwgMCkge1xuXHRcdFx0XHRcdFx0c2VsZi5jcm9wRGF0YS55ID0gMDtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0aWYgKHNlbGYuY3JvcERhdGEueCArIHNlbGYuY3JvcERhdGEudyA+IHNlbGYuY2FudmFzVykge1xuXHRcdFx0XHRcdFx0c2VsZi5jcm9wRGF0YS54ID0gc2VsZi5jYW52YXNXIC0gc2VsZi5jcm9wRGF0YS53O1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRpZiAoc2VsZi5jcm9wRGF0YS55ICsgc2VsZi5jcm9wRGF0YS5oID4gc2VsZi5jYW52YXNIKSB7XG5cdFx0XHRcdFx0XHRzZWxmLmNyb3BEYXRhLnkgPSBzZWxmLmNhbnZhc0ggLSBzZWxmLmNyb3BEYXRhLmg7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0c2VsZi5kcmF3Q2FudmFzKCk7XG5cblx0XHRcdFx0fSBlbHNlIGlmIChzZWxmLmJEcmFnQ2FudmFzKSB7XG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygnYkRyYWdDYW52YXMnKTtcblx0XHRcdFx0XHRzZWxmLmNyb3BEYXRhLm1vdmVYID0gKHNlbGYuY3JvcERhdGEuc3RhcnRYIC0gbW91c2VYKSAqIC0xO1xuXHRcdFx0XHRcdHNlbGYuY3JvcERhdGEubW92ZVkgPSAoc2VsZi5jcm9wRGF0YS5zdGFydFkgLSBtb3VzZVkpICogLTE7XG5cdFx0XHRcdFx0Y29uc29sZS5sb2coc2VsZi5jcm9wRGF0YS5zdGFydFgsc2VsZi5jcm9wRGF0YS5zdGFydFksc2VsZi5jcm9wRGF0YS5tb3ZlWCxzZWxmLmNyb3BEYXRhLm1vdmVZKTtcblxuXHRcdFx0XHRcdHNlbGYuZHJhd0NhbnZhcygpO1xuXG5cdFx0XHRcdH1cblxuXHRcdFx0fSlcblx0XHRcdC5vbignbW91c2Vkb3duJywgZnVuY3Rpb24oZSl7XG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ21vdXNlZG93bicpO1xuXHRcdFx0XHR2YXIgY2FudmFzT2Zmc2V0ID0gc2VsZi4kY2FudmFzLm9mZnNldCgpO1xuXHRcdFx0XHR2YXIgbW91c2VYID0gTWF0aC5mbG9vcihlLnBhZ2VYIC0gY2FudmFzT2Zmc2V0LmxlZnQpO1xuXHRcdFx0XHR2YXIgbW91c2VZID0gTWF0aC5mbG9vcihlLnBhZ2VZIC0gY2FudmFzT2Zmc2V0LnRvcCk7XG5cblx0XHRcdFx0aWYgKG1vdXNlWCA+IHNlbGYuY3JvcERhdGEueCAmJiBtb3VzZVggPCBzZWxmLmNyb3BEYXRhLnggKyBzZWxmLmNyb3BEYXRhLncgJiYgXG5cdFx0XHRcdFx0bW91c2VZID4gc2VsZi5jcm9wRGF0YS55ICYmIG1vdXNlWSA8IHNlbGYuY3JvcERhdGEueSArIHNlbGYuY3JvcERhdGEuaCkge1xuXHRcdFx0XHRcdHNlbGYuYkRyYWdDcm9wcGVyID0gdHJ1ZTtcblx0XHRcdFx0XHRzZWxmLmJEcmFnQ2FudmFzID0gZmFsc2U7XG5cdFx0XHRcdFx0c2VsZi5jcm9wRGF0YS5hZGpYID0gbW91c2VYIC0gc2VsZi5jcm9wRGF0YS54O1xuXHRcdFx0XHRcdHNlbGYuY3JvcERhdGEuYWRqWSA9IG1vdXNlWSAtIHNlbGYuY3JvcERhdGEueTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRzZWxmLmJEcmFnQ3JvcHBlciA9IGZhbHNlO1xuXHRcdFx0XHRcdHNlbGYuYkRyYWdDYW52YXMgPSB0cnVlO1xuXHRcdFx0XHRcdHNlbGYuY3JvcERhdGEuc3RhcnRYID0gbW91c2VYO1xuXHRcdFx0XHRcdHNlbGYuY3JvcERhdGEuc3RhcnRZID0gbW91c2VZO1xuXHRcdFx0XHR9XG5cblx0XHRcdH0pXG5cdFx0XHQub24oJ21vdXNldXAnLCBmdW5jdGlvbihlKXtcblx0XHRcdFx0Ly9jb25zb2xlLmxvZygnbW91c2V1cCcpO1xuXHRcdFx0XHRzZWxmLmRlYWN0aXZhdGVDYW52YXMoKTtcblx0XHRcdH0pXG5cdFx0XHQub24oJ21vdXNlb3V0JywgZnVuY3Rpb24oZSl7XG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ21vdXNlb3V0Jyk7XG5cdFx0XHRcdHNlbGYuZGVhY3RpdmF0ZUNhbnZhcygpO1xuXHRcdFx0fSk7XG5cblx0fSxcblxuXHRkZWFjdGl2YXRlQ2FudmFzOiBmdW5jdGlvbigpIHtcblx0XHRpZiAodGhpcy5iRHJhZ0NhbnZhcykge1xuXHRcdFx0Ly8gdGhpcy5jcm9wRGF0YS5hZGpYID0gdGhpcy5jcm9wRGF0YS54ICsgdGhpcy5jcm9wRGF0YS5tb3ZlWDtcblx0XHRcdC8vIHRoaXMuY3JvcERhdGEuYWRqWFkgPSB0aGlzLmNyb3BEYXRhLnggKyB0aGlzLmNyb3BEYXRhLm1vdmVZO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRcblx0XHR9XG5cdFx0dGhpcy5jcm9wRGF0YS5hZGpYID0gdGhpcy5jcm9wRGF0YS54O1xuXHRcdHRoaXMuY3JvcERhdGEuYWRqWSA9IHRoaXMuY3JvcERhdGEueTtcblx0XHR0aGlzLmNyb3BEYXRhLm1vdmVYID0gMDtcblx0XHR0aGlzLmNyb3BEYXRhLm1vdmVZID0gMDtcblx0XHR0aGlzLmNyb3BEYXRhLnN0YXJ0WCA9IDA7XG5cdFx0dGhpcy5jcm9wRGF0YS5zdGFydFkgPSAwO1xuXHRcdHRoaXMuYkRyYWdDYW52YXMgPSBmYWxzZTtcblx0XHR0aGlzLmJEcmFnQ3JvcHBlciA9IGZhbHNlO1xuXHR9LFxuXG5cdGluaXRDcm9wRGF0YTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5jcm9wRGF0YS53ID0gdGhpcy4kY3VyckZsdHIuZGF0YSgndycpO1xuXHRcdHRoaXMuY3JvcERhdGEuaCA9IHRoaXMuJGN1cnJGbHRyLmRhdGEoJ2gnKTtcblx0XHR0aGlzLmNyb3BEYXRhLnggPSB0aGlzLmNlbnRlclggLSAodGhpcy5jcm9wRGF0YS53IC8gMik7XG5cdFx0dGhpcy5jcm9wRGF0YS55ID0gdGhpcy5jZW50ZXJZIC0gKHRoaXMuY3JvcERhdGEuaCAvIDIpO1xuXHRcdHRoaXMuY3JvcERhdGEuYWRqWCA9IHRoaXMuY3JvcERhdGEueDtcblx0XHR0aGlzLmNyb3BEYXRhLmFkalkgPSB0aGlzLmNyb3BEYXRhLnk7XG5cdFx0dGhpcy5jcm9wRGF0YS5tb3ZlWCA9IDA7XG5cdFx0dGhpcy5jcm9wRGF0YS5tb3ZlWSA9IDA7XG5cdFx0dGhpcy5jcm9wRGF0YS5zdGFydFggPSAwO1xuXHRcdHRoaXMuY3JvcERhdGEuc3RhcnRZID0gMDtcblx0fSxcblxuXHRzZXRJbWdTcmM6IGZ1bmN0aW9uKGltZ1NyYykge1xuXHRcdHZhciBzZWxmID0gdGhpcztcblx0XHR2YXIgbmV3SW1nID0gbmV3IEltYWdlKCk7XG5cdFx0bmV3SW1nLm9ubG9hZCA9IGZ1bmN0aW9uKCl7XG5cdFx0XHRzZWxmLnNvdXJjZUltZyA9IG5ld0ltZztcblx0XHRcdHNlbGYuZHJhd0NhbnZhcygpO1xuXHRcdH07XG5cdFx0bmV3SW1nLnNyYyA9IGltZ1NyYztcblx0fSxcblxuXHRkcmF3Q2FudmFzOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgbGluZSA9IHRoaXMub3B0aW9ucy5saW5lV2lkdGg7XG5cdFx0dmFyIHpvb20gPSB0aGlzLnpvb21MZXZlbCAvIDEwMC4wO1xuXHRcdHZhciBpbWcgPSB0aGlzLnNvdXJjZUltZztcblx0XHR2YXIgZHcgPSBNYXRoLmZsb29yKGltZy53aWR0aCAqIHpvb20pO1xuXHRcdHZhciBkaCA9IE1hdGguZmxvb3IoaW1nLmhlaWdodCAqIHpvb20pO1xuXHRcdHZhciBkeCA9IE1hdGguZmxvb3IoKHRoaXMuY2FudmFzVyAtIGR3KSAvIDIpICsgdGhpcy5jcm9wRGF0YS5tb3ZlWDtcblx0XHR2YXIgZHkgPSBNYXRoLmZsb29yKCh0aGlzLmNhbnZhc0ggLSBkaCkgLyAyKSArIHRoaXMuY3JvcERhdGEubW92ZVk7XG5cdFx0dmFyIHN3LCBzaCwgc3gsIHN5O1xuXG5cdFx0aWYgKHRoaXMuY3JvcERhdGEueCA8IGR4KSB7XG5cdFx0XHR0aGlzLmNyb3BEYXRhLnggPSBkeDtcblx0XHR9XG5cdFx0aWYgKHRoaXMuY3JvcERhdGEueSA8IGR5KSB7XG5cdFx0XHR0aGlzLmNyb3BEYXRhLnkgPSBkeTtcblx0XHR9XG5cdFx0aWYgKHRoaXMuY3JvcERhdGEueCArIHRoaXMuY3JvcERhdGEudyA+IGR4ICsgZHcpIHtcblx0XHRcdHRoaXMuY3JvcERhdGEueCA9IChkeCArIGR3KSAtIHRoaXMuY3JvcERhdGEudztcblx0XHR9XG5cdFx0aWYgKHRoaXMuY3JvcERhdGEueSArIHRoaXMuY3JvcERhdGEuaCA+IGR5ICsgZGgpIHtcblx0XHRcdHRoaXMuY3JvcERhdGEueSA9IChkeSArIGRoKSAtIHRoaXMuY3JvcERhdGEuaDtcblx0XHR9XG5cblx0XHRzdyA9IE1hdGguZmxvb3IodGhpcy5jcm9wRGF0YS53IC8gem9vbSk7XG5cdFx0c2ggPSBNYXRoLmZsb29yKHRoaXMuY3JvcERhdGEuaCAvIHpvb20pO1xuXHRcdHN4ID0gTWF0aC5mbG9vcigodGhpcy5jcm9wRGF0YS54IC0gZHgpIC8gem9vbSk7XG5cdFx0c3kgPSBNYXRoLmZsb29yKCh0aGlzLmNyb3BEYXRhLnkgLSBkeSkgLyB6b29tKTtcblxuXHRcdHRoaXMuY29udGV4dC5jbGVhclJlY3QoMCwgMCwgdGhpcy5jYW52YXNXLCB0aGlzLmNhbnZhc0gpO1xuXHRcdHRoaXMuY29udGV4dC5kcmF3SW1hZ2UoaW1nLCBkeCwgZHksIGR3LCBkaCk7XG5cdFx0dGhpcy5jb250ZXh0LmZpbGxSZWN0KDAsIDAsIHRoaXMuY2FudmFzVywgdGhpcy5jYW52YXNIKTtcblx0XHR0aGlzLmNvbnRleHQuc3Ryb2tlUmVjdCh0aGlzLmNyb3BEYXRhLnggLSBsaW5lLCB0aGlzLmNyb3BEYXRhLnkgLSBsaW5lLCB0aGlzLmNyb3BEYXRhLncgKyBsaW5lICogMiwgdGhpcy5jcm9wRGF0YS5oICsgbGluZSAqIDIpO1xuXHRcdHRoaXMuY29udGV4dC5kcmF3SW1hZ2UoaW1nLCBzeCwgc3ksIHN3LCBzaCwgdGhpcy5jcm9wRGF0YS54LCB0aGlzLmNyb3BEYXRhLnksIHRoaXMuY3JvcERhdGEudywgdGhpcy5jcm9wRGF0YS5oKTtcblxuXHRcdCQuZXZlbnQudHJpZ2dlcih0aGlzLm9wdGlvbnMuY3VzdG9tRXZlbnRQcmZ4ICsgJzpkcmF3Q2FudmFzJywgW3t3OnRoaXMuY3JvcERhdGEudyxoOnRoaXMuY3JvcERhdGEuaH1dKTtcblxuXHR9LFxuXG5cdGV4cG9ydEltZzogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGlzSnBnID0gdGhpcy5zb3VyY2VJbWcuc3JjLmluZGV4T2YoJy5qcGcnKSAhPSAtMSB8fCB0aGlzLnNvdXJjZUltZy5zcmMuaW5kZXhPZignLmpwZWcnKSAhPSAtMTtcblx0XHR2YXIgdGVtcENhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuXHRcdHZhciB0ZW1wQ29udGV4dCA9IHRlbXBDYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblx0XHR2YXIgZGF0YVVybDtcblx0XHQvLyBjb25zb2xlLmxvZyhpc0pwZyk7XG5cblx0XHR0ZW1wQ2FudmFzLndpZHRoID0gdGhpcy5jcm9wRGF0YS53O1xuXHRcdHRlbXBDYW52YXMuaGVpZ2h0ID0gdGhpcy5jcm9wRGF0YS5oO1xuXHRcdHRlbXBDb250ZXh0LmRyYXdJbWFnZSh0aGlzLmNhbnZhcywgdGhpcy5jcm9wRGF0YS54LCB0aGlzLmNyb3BEYXRhLnksIHRoaXMuY3JvcERhdGEudywgdGhpcy5jcm9wRGF0YS5oLCAwLCAwLCB0aGlzLmNyb3BEYXRhLncsIHRoaXMuY3JvcERhdGEuaCk7XG5cdFx0aWYgKGlzSnBnKSB7XG5cdFx0XHRkYXRhVXJsID0gdGVtcENhbnZhcy50b0RhdGFVUkwoJ2ltYWdlL2pwZWcnLCAwLjgpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRkYXRhVXJsID0gdGVtcENhbnZhcy50b0RhdGFVUkwoKTtcblx0XHR9XG5cblx0XHR0aGlzLiR4SW1nLmF0dHIoeydzcmMnOiBkYXRhVXJsfSk7XG5cblx0fVxuXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IENhbnZhc0Nyb3BwZXI7XG4iLCJcbnZhciBDYW52YXNDcm9wcGVyID0gQmFja2JvbmUuVmlldy5leHRlbmQoe1xuXG5cdGNvbGxlY3Rpb246IG51bGwsXG5cdG1vZGVsOiBudWxsLFxuXHR0ZW1wbGF0ZTogbnVsbCxcblxuXHRzb3VyY2VJbWc6IG51bGwsXG5cblx0dGFiRGF0YToge3c6IDAsIGg6IDAsIHg6IDAsIHk6IDAsIHl5OiAwfSxcblx0Y3JvcERhdGE6IHt3OiAwLCBoOiAwLCB4OiAwLCB5OiAwLCB3dzogMCwgaGg6IDAsIHh4OiAwLCB5eTogMH0sXG5cdGltYWdlRGF0YToge3c6IDAsIGg6IDAsIHg6IDAsIHk6IDB9LFxuXHRtb3ZlRGF0YToge3N0YXJ0WDogMCwgc3RhcnRZOiAwLCBtb3ZlWDogMCwgbW92ZVk6IDB9LFxuXG5cdGV2ZW50czoge1xuXHRcdC8vY2FudmFzIGV2ZW50c1xuXHRcdCdtb3VzZW1vdmUgY2FudmFzJzogJ29uQ2FudmFzTW91c2Vtb3ZlJyxcblx0XHQnbW91c2Vkb3duIGNhbnZhcyc6ICdhY3RpdmF0ZUNhbnZhcycsXG5cdFx0J21vdXNldXAgY2FudmFzJzogJ2RlYWN0aXZhdGVDYW52YXMnLFxuXHRcdCdtb3VzZW91dCBjYW52YXMnOiAnZGVhY3RpdmF0ZUNhbnZhcycsXG5cdFx0Ly96b29tIGV2ZW50c1xuXHRcdCdjaGFuZ2UgaW5wdXRbdHlwZT1yYW5nZV0nOiAnb25ab29tQ2hhbmdlJyxcblx0XHQnbW91c2Vtb3ZlIGlucHV0W3R5cGU9cmFuZ2VdJzogJ29uWm9vbU1vdmUnLFxuXHRcdCdtb3VzZWRvd24gaW5wdXRbdHlwZT1yYW5nZV0nOiAnYWN0aXZhdGVab29tJyxcblx0XHQnbW91c2V1cCBpbnB1dFt0eXBlPXJhbmdlXSc6ICdkZWFjdGl2YXRlWm9vbScsXG5cdFx0Ly9leHBvcnRcblx0XHQnY2xpY2sgYnV0dG9uJzogJ2V4cG9ydCdcblx0fSxcblxuXHRpbml0aWFsaXplOiBmdW5jdGlvbihvYmpPcHRpb25zKSB7XG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xuXHRcdHZhciBuZXdJbWcgPSBuZXcgSW1hZ2UoKTtcblxuXHRcdHRoaXMub3B0aW9ucyA9ICQuZXh0ZW5kKHtcblx0XHRcdGZpbGxTdHlsZTogJ3JnYmEoMCwwLDAsMC41KScsXG5cdFx0XHRzdHJva2VTdHlsZTogJyNmMDAnLFxuXHRcdFx0bGluZVdpZHRoOiAyLFxuXHRcdFx0dGFiV2lkdGg6IDMwLFxuXHRcdFx0dGFiSGVpZ2h0OiAyMCxcblx0XHRcdGNyb3BXaWR0aDogMTAwLFxuXHRcdFx0Y3JvcEhlaWdodDogMTAwLFxuXHRcdFx0aW5pdGlhbFpvb21MZXZlbDogMTAwXG5cdFx0fSwgb2JqT3B0aW9ucyB8fCB7fSk7XG5cblx0XHR0aGlzLiRleHBvcnRCdG4gPSB0aGlzLiRlbC5maW5kKCdidXR0b24nKTtcblx0XHR0aGlzLiRleHBvcnRJbWcgPSB0aGlzLiRlbC5maW5kKCdpbWcnKTtcblxuXHRcdHRoaXMuJHpvb21JbnB1dCA9IHRoaXMuJGVsLmZpbmQoJ2lucHV0W3R5cGU9cmFuZ2VdJyk7XG5cdFx0dGhpcy4kem9vbU91dHB1dCA9IHRoaXMuJHpvb21JbnB1dC5uZXh0KCdvdXRwdXQnKTtcblxuXHRcdHRoaXMuJGNhbnZhcyA9IHRoaXMuJGVsLmZpbmQoJ2NhbnZhcycpO1xuXHRcdHRoaXMuY2FudmFzID0gdGhpcy4kY2FudmFzWzBdO1xuXHRcdHRoaXMuY29udGV4dCA9IHRoaXMuY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG5cdFx0dGhpcy5jb250ZXh0LnN0cm9rZVN0eWxlID0gdGhpcy5vcHRpb25zLnN0cm9rZVN0eWxlO1xuXHRcdHRoaXMuY29udGV4dC5saW5lV2lkdGggPSB0aGlzLm9wdGlvbnMubGluZVdpZHRoO1xuXHRcdHRoaXMuY29udGV4dC5maWxsU3R5bGUgPSB0aGlzLm9wdGlvbnMuZmlsbFN0eWxlO1xuXG5cdFx0dGhpcy5jYW52YXNXID0gdGhpcy5jYW52YXMud2lkdGg7XG5cdFx0dGhpcy5jYW52YXNIID0gdGhpcy5jYW52YXMuaGVpZ2h0O1xuXHRcdHRoaXMuY2VudGVyWCA9IHRoaXMuY2FudmFzVyAvIDI7XG5cdFx0dGhpcy5jZW50ZXJZID0gdGhpcy5jYW52YXNIIC8gMjtcblx0XHR0aGlzLmN1cnJDZW50ZXJYID0gdGhpcy5jZW50ZXJYO1xuXHRcdHRoaXMuY3VyckNlbnRlclkgPSB0aGlzLmNlbnRlclk7XG5cblx0XHR0aGlzLmJEcmFnVGFiID0gZmFsc2U7XG5cdFx0dGhpcy5iRHJhZ0Nyb3BwZXIgPSBmYWxzZTtcblx0XHR0aGlzLmJEcmFnQ2FudmFzID0gZmFsc2U7XG5cdFx0dGhpcy5iQ2FudmFzQWN0aXZlID0gZmFsc2U7XG5cdFx0dGhpcy5iWm9vbSA9IGZhbHNlO1xuXG5cdFx0dGhpcy56b29tTGV2ZWwgPSB0aGlzLm9wdGlvbnMuaW5pdGlhbFpvb21MZXZlbDtcblxuXHRcdHRoaXMuaXNKcGdTb3VyY2UgPSB0aGlzLm9wdGlvbnMuaW1nU3JjLmluZGV4T2YoJy5qcGcnKSAhPSAtMSB8fCB0aGlzLm9wdGlvbnMuaW1nU3JjLmluZGV4T2YoJy5qcGVnJykgIT0gLTE7XG5cblx0XHR0aGlzLnRlbXBDYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcblx0XHR0aGlzLnRlbXBDb250ZXh0ID0gdGhpcy50ZW1wQ2FudmFzLmdldENvbnRleHQoJzJkJyk7XG5cdFx0dGhpcy50ZW1wQ2FudmFzLndpZHRoID0gdGhpcy5vcHRpb25zLmNyb3BXaWR0aDtcblx0XHR0aGlzLnRlbXBDYW52YXMuaGVpZ2h0ID0gdGhpcy5vcHRpb25zLmNyb3BIZWlnaHQ7XG5cdFx0dGhpcy5kYXRhVXJsID0gbnVsbDtcblxuXHRcdHRoaXMuJHpvb21JbnB1dC52YWwodGhpcy56b29tTGV2ZWwpO1xuXHRcdHRoaXMuJHpvb21PdXRwdXQudGV4dCh0aGlzLnpvb21MZXZlbCk7XG5cblx0XHRuZXdJbWcub25sb2FkID0gZnVuY3Rpb24oKXtcblx0XHRcdHNlbGYuc291cmNlSW1nID0gbmV3SW1nO1xuXHRcdFx0c2VsZi5pbml0RGF0YSgpO1xuXHRcdH07XG5cdFx0bmV3SW1nLnNyYyA9IHRoaXMub3B0aW9ucy5pbWdTcmM7XG5cblx0fSxcblxuXHRpbml0RGF0YTogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHpvb20gPSB0aGlzLnpvb21MZXZlbCAvIDEwMC4wO1xuXG5cdFx0dGhpcy5jcm9wRGF0YS53ID0gdGhpcy5vcHRpb25zLmNyb3BXaWR0aDtcblx0XHR0aGlzLmNyb3BEYXRhLmggPSB0aGlzLm9wdGlvbnMuY3JvcEhlaWdodDtcblx0XHR0aGlzLmNyb3BEYXRhLnggPSB0aGlzLmNlbnRlclggLSAodGhpcy5jcm9wRGF0YS53IC8gMik7IC8vY2VudGVyZWQgaG9yaXpcblx0XHR0aGlzLmNyb3BEYXRhLnkgPSB0aGlzLmNlbnRlclkgLSAodGhpcy5jcm9wRGF0YS5oIC8gMik7IC8vY2VudGVyZWQgdmVydFxuXHRcdHRoaXMuY3JvcERhdGEud3cgPSB0aGlzLmNyb3BEYXRhLnc7IC8vcmVmZXJlbmNlIHRvIG9yaWdpbmFsIHdcblx0XHR0aGlzLmNyb3BEYXRhLmhoID0gdGhpcy5jcm9wRGF0YS5oOyAvL3JlZmVyZW5jZSB0byBvcmlnaW5hbCBoXG5cdFx0dGhpcy5jcm9wRGF0YS54eCA9IHRoaXMuY3JvcERhdGEueDsgLy9yZWZlcmVuY2UgdG8gb3JpZ2luYWwgeFxuXHRcdHRoaXMuY3JvcERhdGEueXkgPSB0aGlzLmNyb3BEYXRhLnk7IC8vcmVmZXJlbmNlIHRvIG9yaWdpbmFsIHlcblxuXHRcdHRoaXMuaW1hZ2VEYXRhLncgPSBNYXRoLmZsb29yKHRoaXMuc291cmNlSW1nLndpZHRoICogem9vbSk7XG5cdFx0dGhpcy5pbWFnZURhdGEuaCA9IE1hdGguZmxvb3IodGhpcy5zb3VyY2VJbWcuaGVpZ2h0ICogem9vbSk7XG5cdFx0dGhpcy5pbWFnZURhdGEueCA9IHRoaXMuY2VudGVyWCAtICh0aGlzLmltYWdlRGF0YS53IC8gMik7IC8vY2VudGVyZWQgaG9yaXpcblx0XHR0aGlzLmltYWdlRGF0YS55ID0gdGhpcy5jZW50ZXJZIC0gKHRoaXMuaW1hZ2VEYXRhLmggLyAyKTsgLy9jZW50ZXJlZCB2ZXJ0XG5cblx0XHR0aGlzLm1vdmVEYXRhLnN0YXJ0WCA9IDA7XG5cdFx0dGhpcy5tb3ZlRGF0YS5zdGFydFkgPSAwO1xuXHRcdHRoaXMubW92ZURhdGEubW92ZVggPSAwO1xuXHRcdHRoaXMubW92ZURhdGEubW92ZVkgPSAwO1xuXG5cdFx0dGhpcy50YWJEYXRhLncgPSB0aGlzLm9wdGlvbnMudGFiV2lkdGg7XG5cdFx0dGhpcy50YWJEYXRhLmggPSB0aGlzLm9wdGlvbnMudGFiSGVpZ2h0O1xuXHRcdHRoaXMuc3luY1RhYkRhdGEoKTtcblxuXHRcdHRoaXMucmVuZGVyKCk7XG5cdH0sXG5cblx0b25ab29tQ2hhbmdlOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLnpvb21MZXZlbCA9IHRoaXMuJHpvb21JbnB1dC52YWwoKTtcblx0XHR0aGlzLiR6b29tT3V0cHV0LnRleHQodGhpcy56b29tTGV2ZWwpO1xuXHRcdHRoaXMudXBkYXRlWm9vbURhdGEoKTtcblx0XHR0aGlzLmNoZWNrQ3JvcERhdGEoKTtcblx0XHR0aGlzLnN5bmNUYWJEYXRhKCk7XG5cdFx0dGhpcy5yZW5kZXIoKTtcblx0fSxcblx0b25ab29tTW92ZTogZnVuY3Rpb24oKSB7XG5cdFx0aWYgKHRoaXMuYlpvb20pIHtcblx0XHRcdHRoaXMuJHpvb21JbnB1dC50cmlnZ2VyKCdjaGFuZ2UnKTtcblx0XHR9XG5cdH0sXG5cdGFjdGl2YXRlWm9vbTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5iWm9vbSA9IHRydWU7XG5cdFx0dGhpcy4kem9vbUlucHV0LmZvY3VzKCk7XG5cdH0sXG5cdGRlYWN0aXZhdGVab29tOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmJab29tID0gZmFsc2U7XG5cdH0sXG5cdHVwZGF0ZVpvb21EYXRhOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgem9vbSA9IHRoaXMuem9vbUxldmVsIC8gMTAwLjA7XG5cblx0XHR0aGlzLmltYWdlRGF0YS53ID0gTWF0aC5mbG9vcih0aGlzLnNvdXJjZUltZy53aWR0aCAqIHpvb20pO1xuXHRcdHRoaXMuaW1hZ2VEYXRhLmggPSBNYXRoLmZsb29yKHRoaXMuc291cmNlSW1nLmhlaWdodCAqIHpvb20pO1xuXHRcdHRoaXMuaW1hZ2VEYXRhLnggPSB0aGlzLmN1cnJDZW50ZXJYIC0gKHRoaXMuaW1hZ2VEYXRhLncgLyAyKTtcblx0XHR0aGlzLmltYWdlRGF0YS55ID0gdGhpcy5jdXJyQ2VudGVyWSAtICh0aGlzLmltYWdlRGF0YS5oIC8gMik7XG5cblx0fSxcblxuXHRjaGVja0Nyb3BEYXRhOiBmdW5jdGlvbigpIHtcblxuXHRcdC8vIG1ha2Ugc3VyZSBjcm9wRGF0YSBjb29yZHMgYXJlbid0IG91dHNpZGUgc291cmNlSW1nIGJvdW5kYXJ5XG5cdFx0aWYgKHRoaXMuY3JvcERhdGEueCA8IHRoaXMuaW1hZ2VEYXRhLngpIHtcblx0XHRcdHRoaXMuY3JvcERhdGEueCA9IHRoaXMuaW1hZ2VEYXRhLng7XG5cdFx0XHR0aGlzLmNyb3BEYXRhLnh4ID0gdGhpcy5jcm9wRGF0YS54O1xuXHRcdH1cblx0XHRpZiAodGhpcy5jcm9wRGF0YS55IDwgdGhpcy5pbWFnZURhdGEueSkge1xuXHRcdFx0dGhpcy5jcm9wRGF0YS55ID0gdGhpcy5pbWFnZURhdGEueTtcblx0XHRcdHRoaXMuY3JvcERhdGEueXkgPSB0aGlzLmNyb3BEYXRhLnk7XG5cdFx0fVxuXHRcdGlmICh0aGlzLmNyb3BEYXRhLnggKyB0aGlzLmNyb3BEYXRhLncgPiB0aGlzLmltYWdlRGF0YS54ICsgdGhpcy5pbWFnZURhdGEudykge1xuXHRcdFx0dGhpcy5jcm9wRGF0YS54ID0gKHRoaXMuaW1hZ2VEYXRhLnggKyB0aGlzLmltYWdlRGF0YS53KSAtIHRoaXMuY3JvcERhdGEudztcblx0XHRcdHRoaXMuY3JvcERhdGEueHggPSB0aGlzLmNyb3BEYXRhLng7XG5cdFx0fVxuXHRcdGlmICh0aGlzLmNyb3BEYXRhLnkgKyB0aGlzLmNyb3BEYXRhLmggPiB0aGlzLmltYWdlRGF0YS55ICsgdGhpcy5pbWFnZURhdGEuaCkge1xuXHRcdFx0dGhpcy5jcm9wRGF0YS55ID0gKHRoaXMuaW1hZ2VEYXRhLnkgKyB0aGlzLmltYWdlRGF0YS5oKSAtIHRoaXMuY3JvcERhdGEuaDtcblx0XHRcdHRoaXMuY3JvcERhdGEueXkgPSB0aGlzLmNyb3BEYXRhLnk7XG5cdFx0fVxuXG5cdH0sXG5cblx0c3luY1RhYkRhdGE6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMudGFiRGF0YS54ID0gdGhpcy5jcm9wRGF0YS54ICsgKHRoaXMuY3JvcERhdGEudyAvIDIpIC0gKHRoaXMudGFiRGF0YS53IC8gMik7XG5cdFx0dGhpcy50YWJEYXRhLnkgPSB0aGlzLmNyb3BEYXRhLnkgKyB0aGlzLmNyb3BEYXRhLmggLSAodGhpcy50YWJEYXRhLmggLyAyKTtcblx0XHR0aGlzLnRhYkRhdGEueXkgPSB0aGlzLnRhYkRhdGEueTsgLy9yZWZlcmVuY2UgdG8gb3JpZ2luYWwgeVxuXG5cdFx0dGhpcy50ZW1wQ2FudmFzLndpZHRoID0gdGhpcy5jcm9wRGF0YS53O1xuXHRcdHRoaXMudGVtcENhbnZhcy5oZWlnaHQgPSB0aGlzLmNyb3BEYXRhLmg7XG5cblx0fSxcblxuXHRvbkNhbnZhc01vdXNlbW92ZTogZnVuY3Rpb24oZSkge1xuXHRcdC8vY29uc29sZS5sb2coJ29uTW91c2Vtb3ZlJyk7XG5cdFx0dmFyIGNhbnZhc09mZnNldCA9IHRoaXMuJGNhbnZhcy5vZmZzZXQoKTtcblx0XHR2YXIgbW91c2VYID0gTWF0aC5mbG9vcihlLnBhZ2VYIC0gY2FudmFzT2Zmc2V0LmxlZnQpO1xuXHRcdHZhciBtb3VzZVkgPSBNYXRoLmZsb29yKGUucGFnZVkgLSBjYW52YXNPZmZzZXQudG9wKTtcblxuXHRcdGlmICh0aGlzLmJDYW52YXNBY3RpdmUpIHtcblxuXHRcdFx0dGhpcy5tb3ZlRGF0YS5tb3ZlWCA9ICh0aGlzLm1vdmVEYXRhLnN0YXJ0WCAtIG1vdXNlWCkgKiAtMTtcblx0XHRcdHRoaXMubW92ZURhdGEubW92ZVkgPSAodGhpcy5tb3ZlRGF0YS5zdGFydFkgLSBtb3VzZVkpICogLTE7XG5cblx0XHRcdGlmICh0aGlzLmJEcmFnVGFiKSB7XG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ2JEcmFnVGFiJyk7XG5cblx0XHRcdFx0dGhpcy5jcm9wRGF0YS5oID0gdGhpcy5jcm9wRGF0YS5oaCArIHRoaXMubW92ZURhdGEubW92ZVk7XG5cblx0XHRcdH0gZWxzZSBpZiAodGhpcy5iRHJhZ0Nyb3BwZXIpIHtcblx0XHRcdFx0Ly9jb25zb2xlLmxvZygnYkRyYWdDcm9wcGVyJyk7XG5cblx0XHRcdFx0dGhpcy5jcm9wRGF0YS54ID0gdGhpcy5jcm9wRGF0YS54eCArIHRoaXMubW92ZURhdGEubW92ZVg7XG5cdFx0XHRcdHRoaXMuY3JvcERhdGEueSA9IHRoaXMuY3JvcERhdGEueXkgKyB0aGlzLm1vdmVEYXRhLm1vdmVZO1xuXG5cdFx0XHRcdC8vIG1ha2Ugc3VyZSBjcm9wRGF0YSBjb29yZHMgYXJlbid0IG91dHNpZGUgY2FudmFzIGJvdW5kYXJ5XG5cdFx0XHRcdGlmICh0aGlzLmNyb3BEYXRhLnggPCAwKSB7XG5cdFx0XHRcdFx0dGhpcy5jcm9wRGF0YS54ID0gMDtcblx0XHRcdFx0XHR0aGlzLmNyb3BEYXRhLnh4ID0gMDtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAodGhpcy5jcm9wRGF0YS55IDwgMCkge1xuXHRcdFx0XHRcdHRoaXMuY3JvcERhdGEueSA9IDA7XG5cdFx0XHRcdFx0dGhpcy5jcm9wRGF0YS55eSA9IDA7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKHRoaXMuY3JvcERhdGEueCArIHRoaXMuY3JvcERhdGEudyA+IHRoaXMuY2FudmFzVykge1xuXHRcdFx0XHRcdHRoaXMuY3JvcERhdGEueCA9IHRoaXMuY2FudmFzVyAtIHRoaXMuY3JvcERhdGEudztcblx0XHRcdFx0XHR0aGlzLmNyb3BEYXRhLnh4ID0gdGhpcy5jcm9wRGF0YS54O1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmICh0aGlzLmNyb3BEYXRhLnkgKyB0aGlzLmNyb3BEYXRhLmggPiB0aGlzLmNhbnZhc0gpIHtcblx0XHRcdFx0XHR0aGlzLmNyb3BEYXRhLnkgPSB0aGlzLmNhbnZhc0ggLSB0aGlzLmNyb3BEYXRhLmg7XG5cdFx0XHRcdFx0dGhpcy5jcm9wRGF0YS55eSA9IHRoaXMuY3JvcERhdGEueTtcblx0XHRcdFx0fVxuXG5cdFx0XHR9IGVsc2UgaWYgKHRoaXMuYkRyYWdDYW52YXMpIHtcblx0XHRcdFx0Ly9jb25zb2xlLmxvZygnYkRyYWdDYW52YXMnKTtcblxuXHRcdFx0XHR0aGlzLmN1cnJDZW50ZXJYID0gdGhpcy5jZW50ZXJYICsgdGhpcy5tb3ZlRGF0YS5tb3ZlWDtcblx0XHRcdFx0dGhpcy5jdXJyQ2VudGVyWSA9IHRoaXMuY2VudGVyWSArIHRoaXMubW92ZURhdGEubW92ZVk7XG5cdFx0XHRcdHRoaXMuaW1hZ2VEYXRhLnggPSB0aGlzLmN1cnJDZW50ZXJYIC0gKHRoaXMuaW1hZ2VEYXRhLncgLyAyKTtcblx0XHRcdFx0dGhpcy5pbWFnZURhdGEueSA9IHRoaXMuY3VyckNlbnRlclkgLSAodGhpcy5pbWFnZURhdGEuaCAvIDIpO1xuXG5cdFx0XHR9XG5cblx0XHRcdHRoaXMuY2hlY2tDcm9wRGF0YSgpO1xuXHRcdFx0dGhpcy5zeW5jVGFiRGF0YSgpO1xuXHRcdFx0dGhpcy5yZW5kZXIoKTtcblxuXHRcdH1cblxuXHR9LFxuXG5cdGFjdGl2YXRlQ2FudmFzOiBmdW5jdGlvbihlKSB7XG5cdFx0Ly9jb25zb2xlLmxvZygnYWN0aXZhdGVDYW52YXMnKTtcblx0XHR2YXIgY2FudmFzT2Zmc2V0ID0gdGhpcy4kY2FudmFzLm9mZnNldCgpO1xuXHRcdHZhciBtb3VzZVggPSBNYXRoLmZsb29yKGUucGFnZVggLSBjYW52YXNPZmZzZXQubGVmdCk7XG5cdFx0dmFyIG1vdXNlWSA9IE1hdGguZmxvb3IoZS5wYWdlWSAtIGNhbnZhc09mZnNldC50b3ApO1xuXG5cdFx0dGhpcy5tb3ZlRGF0YS5zdGFydFggPSBtb3VzZVg7XG5cdFx0dGhpcy5tb3ZlRGF0YS5zdGFydFkgPSBtb3VzZVk7XG5cdFx0dGhpcy5tb3ZlRGF0YS5tb3ZlWCA9IG1vdXNlWDtcblx0XHR0aGlzLm1vdmVEYXRhLm1vdmVZID0gbW91c2VZO1xuXG5cdFx0dGhpcy5iQ2FudmFzQWN0aXZlID0gdHJ1ZTtcblxuXHRcdGlmIChtb3VzZVggPiB0aGlzLnRhYkRhdGEueCAmJiBtb3VzZVggPCB0aGlzLnRhYkRhdGEueCArIHRoaXMudGFiRGF0YS53ICYmIFxuXHRcdFx0bW91c2VZID4gdGhpcy50YWJEYXRhLnkgJiYgbW91c2VZIDwgdGhpcy50YWJEYXRhLnkgKyB0aGlzLnRhYkRhdGEuaCkge1xuXHRcdFx0Ly9hY3RpdmF0ZSB0YWIgZHJhZ1xuXHRcdFx0dGhpcy5iRHJhZ1RhYiA9IHRydWU7XG5cblx0XHR9IGVsc2UgaWYgKG1vdXNlWCA+IHRoaXMuY3JvcERhdGEueCAmJiBtb3VzZVggPCB0aGlzLmNyb3BEYXRhLnggKyB0aGlzLmNyb3BEYXRhLncgJiYgXG5cdFx0XHRtb3VzZVkgPiB0aGlzLmNyb3BEYXRhLnkgJiYgbW91c2VZIDwgdGhpcy5jcm9wRGF0YS55ICsgdGhpcy5jcm9wRGF0YS5oKSB7XG5cdFx0XHQvL2FjdGl2YXRlIGNyb3BwZXIgZHJhZ1xuXHRcdFx0dGhpcy5iRHJhZ0Nyb3BwZXIgPSB0cnVlO1xuXG5cdFx0fSBlbHNlIHtcblx0XHRcdC8vYWN0aXZhdGUgY2FudmFzIGRyYWdcblx0XHRcdHRoaXMuYkRyYWdDYW52YXMgPSB0cnVlO1xuXHRcdH1cblxuXHR9LFxuXG5cdGRlYWN0aXZhdGVDYW52YXM6IGZ1bmN0aW9uKGUpIHtcblx0XHRcblx0XHRpZiAodGhpcy5iQ2FudmFzQWN0aXZlKSB7XG5cblx0XHRcdGlmICh0aGlzLmJEcmFnVGFiKSB7XG5cdFx0XHRcdHRoaXMuY3JvcERhdGEuaGggPSB0aGlzLmNyb3BEYXRhLmg7XG5cdFx0XHR9XG5cblx0XHRcdGlmICh0aGlzLmJEcmFnQ3JvcHBlcikge1xuXHRcdFx0XHR0aGlzLmNyb3BEYXRhLnh4ID0gdGhpcy5jcm9wRGF0YS54O1xuXHRcdFx0XHR0aGlzLmNyb3BEYXRhLnl5ID0gdGhpcy5jcm9wRGF0YS55O1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAodGhpcy5iRHJhZ0NhbnZhcykge1xuXHRcdFx0XHR0aGlzLmNlbnRlclggPSB0aGlzLmN1cnJDZW50ZXJYO1xuXHRcdFx0XHR0aGlzLmNlbnRlclkgPSB0aGlzLmN1cnJDZW50ZXJZO1xuXHRcdFx0fVxuXG5cdFx0XHR0aGlzLm1vdmVEYXRhLnN0YXJ0WCA9IDA7XG5cdFx0XHR0aGlzLm1vdmVEYXRhLnN0YXJ0WSA9IDA7XG5cdFx0XHR0aGlzLm1vdmVEYXRhLm1vdmVYID0gMDtcblx0XHRcdHRoaXMubW92ZURhdGEubW92ZVkgPSAwO1xuXG5cdFx0XHR0aGlzLmJEcmFnVGFiID0gZmFsc2U7XG5cdFx0XHR0aGlzLmJEcmFnQ3JvcHBlciA9IGZhbHNlO1xuXHRcdFx0dGhpcy5iRHJhZ0NhbnZhcyA9IGZhbHNlO1xuXHRcdFx0dGhpcy5iQ2FudmFzQWN0aXZlID0gZmFsc2U7XG5cblx0XHR9XG5cblx0fSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXG5cdFx0Ly9jbGVhciBjYW52YXMgYW5kIGRyYXcgaW1hZ2Vcblx0XHR0aGlzLmNvbnRleHQuY2xlYXJSZWN0KDAsIDAsIHRoaXMuY2FudmFzVywgdGhpcy5jYW52YXNIKTtcblx0XHR0aGlzLmNvbnRleHQuZHJhd0ltYWdlKHRoaXMuc291cmNlSW1nLCB0aGlzLmltYWdlRGF0YS54LCB0aGlzLmltYWdlRGF0YS55LCB0aGlzLmltYWdlRGF0YS53LCB0aGlzLmltYWdlRGF0YS5oKTtcblxuXHRcdC8vY2xlYXIgdGVtcCBjYW52YXMgYW5kIGRyYXcgdGVtcCBpbWFnZVxuXHRcdHRoaXMudGVtcENvbnRleHQuY2xlYXJSZWN0KDAsIDAsIHRoaXMuY3JvcERhdGEudywgdGhpcy5jcm9wRGF0YS5oKTtcblx0XHR0aGlzLnRlbXBDb250ZXh0LmRyYXdJbWFnZSh0aGlzLmNhbnZhcywgdGhpcy5jcm9wRGF0YS54LCB0aGlzLmNyb3BEYXRhLnksIHRoaXMuY3JvcERhdGEudywgdGhpcy5jcm9wRGF0YS5oLCAwLCAwLCB0aGlzLmNyb3BEYXRhLncsIHRoaXMuY3JvcERhdGEuaCk7XG5cdFx0dGhpcy5kYXRhVXJsID0gdGhpcy5pc0pwZ1NvdXJjZSA/IHRoaXMudGVtcENhbnZhcy50b0RhdGFVUkwoJ2ltYWdlL2pwZWcnLCAwLjgpIDogdGhpcy50ZW1wQ2FudmFzLnRvRGF0YVVSTCgpO1xuXG5cdFx0Ly9kaW0gY2FudmFzIGFuZCBpbmplY3QgdGVtcCBpbWFnZSBcblx0XHR0aGlzLmNvbnRleHQuZmlsbFJlY3QoMCwgMCwgdGhpcy5jYW52YXNXLCB0aGlzLmNhbnZhc0gpO1xuXHRcdHRoaXMuY29udGV4dC5zdHJva2VSZWN0KHRoaXMuY3JvcERhdGEueCAtIDEsIHRoaXMuY3JvcERhdGEueSAtIDEsIHRoaXMuY3JvcERhdGEudyArIDIsIHRoaXMuY3JvcERhdGEuaCArIDIpO1xuXHRcdHRoaXMuY29udGV4dC5kcmF3SW1hZ2UodGhpcy50ZW1wQ2FudmFzLCAwLCAwLCB0aGlzLmNyb3BEYXRhLncsIHRoaXMuY3JvcERhdGEuaCwgdGhpcy5jcm9wRGF0YS54LCB0aGlzLmNyb3BEYXRhLnksIHRoaXMuY3JvcERhdGEudywgdGhpcy5jcm9wRGF0YS5oKTtcblxuXHRcdC8vYWRkIGRyYWcgdGFiXG5cdFx0dGhpcy5jb250ZXh0LmZpbGxTdHlsZSA9IHRoaXMub3B0aW9ucy5zdHJva2VTdHlsZTtcblx0XHR0aGlzLmNvbnRleHQuZmlsbFJlY3QodGhpcy50YWJEYXRhLngsIHRoaXMudGFiRGF0YS55LCB0aGlzLnRhYkRhdGEudywgdGhpcy50YWJEYXRhLmgpO1xuXHRcdHRoaXMuY29udGV4dC5maWxsU3R5bGUgPSB0aGlzLm9wdGlvbnMuZmlsbFN0eWxlO1xuXG5cdH0sXG5cblx0ZXhwb3J0OiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLiRleHBvcnRJbWcuYXR0cih7J3NyYyc6IHRoaXMuZGF0YVVybH0pO1xuXHR9XG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IENhbnZhc0Nyb3BwZXI7XG4iXX0=
;