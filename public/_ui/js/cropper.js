;(function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){
/**
 * Application Initializer
 * 
 * @author Chris Nelson
 * @since  8.5.13
 */

var Application = require('./Application');

$(function() {

	// Initialize Application
	Application.initialize();

});
},{"./Application":2}],2:[function(require,module,exports){
/**
 * Application Bootstrapper
 * 
 * @author Chris Nelson
 * @since  8.5.13
 */

var CanvasCropper = require('./widgets/CanvasCropper');

var Application = {

	/**
	 * Initialize the app
	 **/
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

		this.canvasCropper = new CanvasCropper($el, {imgSrc:imgSrc});

		$catlinks.on('click', function(e){
			e.preventDefault();
			var imgSrc = $(this).data('href');
			self.canvasCropper.setImgSrc(imgSrc);
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

	this.cropData = {
		w: 0,
		h: 0,
		x: 0,
		y: 0
	};

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

},{}]},{},[1])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvY2hyaXMvU2l0ZXMvR2l0SHViL2NuZWxzb244Ny9jYW52YXMtY3JvcHBlci9zcmMvc2NyaXB0cy9pbml0aWFsaXplLmpzIiwiL1VzZXJzL2NocmlzL1NpdGVzL0dpdEh1Yi9jbmVsc29uODcvY2FudmFzLWNyb3BwZXIvc3JjL3NjcmlwdHMvQXBwbGljYXRpb24uanMiLCIvVXNlcnMvY2hyaXMvU2l0ZXMvR2l0SHViL2NuZWxzb244Ny9jYW52YXMtY3JvcHBlci9zcmMvc2NyaXB0cy93aWRnZXRzL0NhbnZhc0Nyb3BwZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBBcHBsaWNhdGlvbiBJbml0aWFsaXplclxuICogXG4gKiBAYXV0aG9yIENocmlzIE5lbHNvblxuICogQHNpbmNlICA4LjUuMTNcbiAqL1xuXG52YXIgQXBwbGljYXRpb24gPSByZXF1aXJlKCcuL0FwcGxpY2F0aW9uJyk7XG5cbiQoZnVuY3Rpb24oKSB7XG5cblx0Ly8gSW5pdGlhbGl6ZSBBcHBsaWNhdGlvblxuXHRBcHBsaWNhdGlvbi5pbml0aWFsaXplKCk7XG5cbn0pOyIsIi8qKlxuICogQXBwbGljYXRpb24gQm9vdHN0cmFwcGVyXG4gKiBcbiAqIEBhdXRob3IgQ2hyaXMgTmVsc29uXG4gKiBAc2luY2UgIDguNS4xM1xuICovXG5cbnZhciBDYW52YXNDcm9wcGVyID0gcmVxdWlyZSgnLi93aWRnZXRzL0NhbnZhc0Nyb3BwZXInKTtcblxudmFyIEFwcGxpY2F0aW9uID0ge1xuXG5cdC8qKlxuXHQgKiBJbml0aWFsaXplIHRoZSBhcHBcblx0ICoqL1xuXHRpbml0aWFsaXplOiBmdW5jdGlvbigpIHtcblx0XHQvL2NvbnNvbGUubG9nKCdBcHBsaWNhdGlvbjppbml0aWFsaXplJyk7XG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xuXG5cdFx0dGhpcy4kd2luZG93ID0gJCh3aW5kb3cpO1xuXHRcdHRoaXMuJGRvY3VtZW50ID0gJChkb2N1bWVudCk7XG5cdFx0dGhpcy4kaHRtbCA9ICQoJ2h0bWwnKTtcblx0XHR0aGlzLiRib2R5ID0gJCgnYm9keScpO1xuXG5cdFx0dmFyICRlbCA9ICQoJyNjYW52YXMtY3JvcHBlcicpO1xuXHRcdHZhciAkY2F0bGlua3MgPSAkKCcjY2F0bmF2JykuZmluZCgnYScpO1xuXHRcdHZhciBpbWdTcmMgPSAkKCRjYXRsaW5rc1swXSkuZGF0YSgnaHJlZicpO1xuXG5cdFx0dGhpcy5jYW52YXNDcm9wcGVyID0gbmV3IENhbnZhc0Nyb3BwZXIoJGVsLCB7aW1nU3JjOmltZ1NyY30pO1xuXG5cdFx0JGNhdGxpbmtzLm9uKCdjbGljaycsIGZ1bmN0aW9uKGUpe1xuXHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0dmFyIGltZ1NyYyA9ICQodGhpcykuZGF0YSgnaHJlZicpO1xuXHRcdFx0c2VsZi5jYW52YXNDcm9wcGVyLnNldEltZ1NyYyhpbWdTcmMpO1xuXHRcdH0pO1xuXG5cblx0fVxuXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEFwcGxpY2F0aW9uO1xuIiwiXG52YXIgQ2FudmFzQ3JvcHBlciA9IGZ1bmN0aW9uKCRlbCwgb2JqT3B0aW9ucyl7XG5cblx0dGhpcy4kZWwgPSAkZWw7XG5cblx0dGhpcy5vcHRpb25zID0gJC5leHRlbmQoe1xuXHRcdHNlbGVjdG9yRXhwb3J0QnRuOiAnLmNhbnZhcy1maWx0ZXJzIC5idG4tZXhwb3J0Jyxcblx0XHRzZWxlY3RvckV4cG9ydEltZzogJy5jYW52YXMtZXhwb3J0IGltZycsXG5cdFx0c2VsZWN0b3JGaWx0ZXJzOiAnLmNhbnZhcy1maWx0ZXJzIGlucHV0W3R5cGU9cmFkaW9dJyxcblx0XHRzZWxlY3RvckNhbnZhczogJy5jYW52YXMtaG9sZGVyIGNhbnZhcycsXG5cdFx0ZmlsbFN0eWxlOiAncmdiYSgwLDAsMCwwLjUpJyxcblx0XHRzdHJva2VTdHlsZTogJyMwMDAnLFxuXHRcdGxpbmVXaWR0aDogMixcblx0XHRpbWdTcmM6ICcnIC8vc3RyOiBwYXRoIHRvIGltYWdlIHNyY1xuXHR9LCBvYmpPcHRpb25zIHx8IHt9KTtcblxuXHR0aGlzLiR4QnRuID0gdGhpcy4kZWwuZmluZCh0aGlzLm9wdGlvbnMuc2VsZWN0b3JFeHBvcnRCdG4pO1xuXHR0aGlzLiR4SW1nID0gdGhpcy4kZWwuZmluZCh0aGlzLm9wdGlvbnMuc2VsZWN0b3JFeHBvcnRJbWcpO1xuXG5cdHRoaXMuJGZpbHRlcnMgPSB0aGlzLiRlbC5maW5kKHRoaXMub3B0aW9ucy5zZWxlY3RvckZpbHRlcnMpO1xuXHR0aGlzLiRjdXJyRmx0ciA9IHRoaXMuJGZpbHRlcnMuZmlsdGVyKCc6Y2hlY2tlZCcpO1xuXHRpZiAoIXRoaXMuJGN1cnJGbHRyLmxlbmd0aCkge1xuXHRcdHRoaXMuJGN1cnJGbHRyID0gJCh0aGlzLiRmaWx0ZXJzWzBdKTtcblx0XHR0aGlzLiRjdXJyRmx0ci5wcm9wKHsnY2hlY2tlZCc6dHJ1ZX0pO1xuXHR9XG5cblx0dGhpcy4kY2FudmFzID0gdGhpcy4kZWwuZmluZCh0aGlzLm9wdGlvbnMuc2VsZWN0b3JDYW52YXMpO1xuXHR0aGlzLmNhbnZhcyA9IHRoaXMuJGNhbnZhc1swXTtcblxuXHR0aGlzLmNvbnRleHQgPSB0aGlzLmNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuXHR0aGlzLmNvbnRleHQuc3Ryb2tlU3R5bGUgPSB0aGlzLm9wdGlvbnMuc3Ryb2tlU3R5bGU7XG5cdHRoaXMuY29udGV4dC5saW5lV2lkdGggPSB0aGlzLm9wdGlvbnMubGluZVdpZHRoO1xuXHQvL3doeSBpcyB0aGlzIG5lZWRlZD9cblx0Ly90aGlzLmltZ0RhdGEgPSB0aGlzLmNvbnRleHQuZ2V0SW1hZ2VEYXRhKDAsIDAsIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0KTtcblxuXHR0aGlzLncgPSB0aGlzLmNhbnZhcy53aWR0aDtcblx0dGhpcy5oID0gdGhpcy5jYW52YXMuaGVpZ2h0O1xuXG5cdHRoaXMuY2VudGVyWCA9IHRoaXMudyAvIDI7XG5cdHRoaXMuY2VudGVyWSA9IHRoaXMuaCAvIDI7XG5cblx0dGhpcy5jcm9wRGF0YSA9IHtcblx0XHR3OiAwLFxuXHRcdGg6IDAsXG5cdFx0eDogMCxcblx0XHR5OiAwXG5cdH07XG5cblx0dGhpcy5pbml0KCk7XG5cbn07XG5cbkNhbnZhc0Nyb3BwZXIucHJvdG90eXBlID0ge1xuXG5cdGluaXQ6IGZ1bmN0aW9uKCl7XG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xuXG5cdFx0dGhpcy5iaW5kRXZlbnRzKCk7XG5cblx0XHR0aGlzLnNldENyb3BEYXRhKCk7XG5cblx0XHRpZiAodGhpcy5vcHRpb25zLmltZ1NyYykge1xuXHRcdFx0dGhpcy5zZXRJbWdTcmModGhpcy5vcHRpb25zLmltZ1NyYyk7XG5cdFx0fVxuXHRcdFxuXG5cdH0sXG5cblx0YmluZEV2ZW50czogZnVuY3Rpb24oKXtcblx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cblx0XHR0aGlzLiR4QnRuLm9uKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcblx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHRcdHNlbGYuZXhwb3J0SW1nKCk7XG5cdFx0fSk7XG5cblx0XHR0aGlzLiRmaWx0ZXJzLm9uKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcblx0XHRcdHNlbGYuJGN1cnJGbHRyID0gJCh0aGlzKTtcblx0XHRcdHNlbGYuc2V0Q3JvcERhdGEoKTtcblx0XHRcdHNlbGYuZHJhd0NhbnZhcygpO1xuXHRcdFx0c2VsZi5kcmF3Q3JvcFRvb2woKTtcblx0XHR9KTtcblxuXG5cdH0sXG5cblx0c2V0Q3JvcERhdGE6IGZ1bmN0aW9uKCl7XG5cdFx0dGhpcy5jcm9wRGF0YS53ID0gdGhpcy4kY3VyckZsdHIuZGF0YSgndycpO1xuXHRcdHRoaXMuY3JvcERhdGEuaCA9IHRoaXMuJGN1cnJGbHRyLmRhdGEoJ2gnKTtcblx0XHR0aGlzLmNyb3BEYXRhLnggPSB0aGlzLmNlbnRlclggLSAodGhpcy5jcm9wRGF0YS53IC8gMik7XG5cdFx0dGhpcy5jcm9wRGF0YS55ID0gdGhpcy5jZW50ZXJZIC0gKHRoaXMuY3JvcERhdGEuaCAvIDIpO1xuXHR9LFxuXG5cdHNldEltZ1NyYzogZnVuY3Rpb24oaW1nU3JjKXtcblx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cdFx0dmFyIG5ld0ltZyA9IG5ldyBJbWFnZSgpO1xuXHRcdC8vdGhpcy5zcmNJbWcgPSBuZXcgSW1hZ2UoKTtcblx0XHRuZXdJbWcub25sb2FkID0gZnVuY3Rpb24oKXtcblx0XHRcdHNlbGYuc3JjSW1nID0gbmV3SW1nO1xuXHRcdFx0c2VsZi5kcmF3Q2FudmFzKCk7XG5cdFx0XHRzZWxmLmRyYXdDcm9wVG9vbCgpO1xuXHRcdH07XG5cdFx0bmV3SW1nLnNyYyA9IGltZ1NyYztcblxuXHR9LFxuXG5cdGRyYXdDYW52YXM6IGZ1bmN0aW9uKCl7XG5cdFx0dGhpcy5jb250ZXh0LmNsZWFyUmVjdCgwLCAwLCB0aGlzLncsIHRoaXMuaCk7IC8vIGNsZWFyIGNhbnZhc1xuXHRcdHRoaXMuY29udGV4dC5kcmF3SW1hZ2UodGhpcy5zcmNJbWcsIDAsIDApO1xuXHRcdHRoaXMuY29udGV4dC5maWxsU3R5bGUgPSB0aGlzLm9wdGlvbnMuZmlsbFN0eWxlO1xuXHRcdHRoaXMuY29udGV4dC5maWxsUmVjdCgwLCAwLCB0aGlzLncsIHRoaXMuaCk7XG5cdH0sXG5cblx0ZHJhd0Nyb3BUb29sOiBmdW5jdGlvbigpe1xuXHRcdHRoaXMuY29udGV4dC5zdHJva2VSZWN0KHRoaXMuY3JvcERhdGEueCwgdGhpcy5jcm9wRGF0YS55LCB0aGlzLmNyb3BEYXRhLncsIHRoaXMuY3JvcERhdGEuaCk7XG5cdFx0dGhpcy5jb250ZXh0LmRyYXdJbWFnZSh0aGlzLnNyY0ltZywgdGhpcy5jcm9wRGF0YS54LCB0aGlzLmNyb3BEYXRhLnksIHRoaXMuY3JvcERhdGEudywgdGhpcy5jcm9wRGF0YS5oLCB0aGlzLmNyb3BEYXRhLngsIHRoaXMuY3JvcERhdGEueSwgdGhpcy5jcm9wRGF0YS53LCB0aGlzLmNyb3BEYXRhLmgpO1xuXHR9LFxuXG5cdGV4cG9ydEltZzogZnVuY3Rpb24oKXtcblx0XHR2YXIgdGVtcENhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuXHRcdHZhciB0ZW1wQ29udGV4dCA9IHRlbXBDYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblx0XHR2YXIgZGF0YVVybDtcblxuXHRcdHRlbXBDYW52YXMud2lkdGggPSB0aGlzLmNyb3BEYXRhLnc7XG5cdFx0dGVtcENhbnZhcy5oZWlnaHQgPSB0aGlzLmNyb3BEYXRhLmg7XG5cdFx0dGVtcENvbnRleHQuZHJhd0ltYWdlKHRoaXMuc3JjSW1nLCB0aGlzLmNyb3BEYXRhLngsIHRoaXMuY3JvcERhdGEueSwgdGhpcy5jcm9wRGF0YS53LCB0aGlzLmNyb3BEYXRhLmgsIDAsIDAsIHRoaXMuY3JvcERhdGEudywgdGhpcy5jcm9wRGF0YS5oKTtcblx0XHRkYXRhVXJsID0gdGVtcENhbnZhcy50b0RhdGFVUkwoJ2ltYWdlL3BuZycpO1xuXG5cdFx0dGhpcy4keEltZy5hdHRyKHsnc3JjJzogZGF0YVVybH0pO1xuXG5cdH1cblxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBDYW52YXNDcm9wcGVyO1xuIl19
;