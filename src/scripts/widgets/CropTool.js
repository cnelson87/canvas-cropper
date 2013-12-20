
var CropTool = function($canvas, objOptions){

	this.$canvas = $canvas;
	this.canvas = $canvas[0];

	this.options = $.extend({
		x: 0, y: 0, w: 320, h: 240,
		strokeStyle: '#000',
		lineWidth: 2
	}, objOptions || {});

	this.x = this.options.x;
	this.y = this.options.x;
	this.w = this.options.w;
	this.h = this.options.h;

	this.context = this.canvas.getContext('2d');
	this.context.strokeStyle = this.options.strokeStyle;
	this.context.lineWidth = this.options.lineWidth;

};

CropTool.prototype = {

/**
*	Private Methods
**/





/**
*	Event Handlers
**/




/**
*	Public API
**/

	draw: function(){

		this.context.strokeRect(this.x, this.y, this.w, this.h);

		// draw part of original image
		if (this.w > 0 && this.h > 0) {
			ctx.drawImage(image, this.x, this.y, this.w, this.h, this.x, this.y, this.w, this.h);
		}

	}

};

module.exports = CropTool;
