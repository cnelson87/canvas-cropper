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

		var $canvas = $('#canvas-cropper').find('canvas');
		var $catlinks = $('#catnav').find('a');

		this.canvasCropper = new CanvasCropper($canvas);

		$catlinks.on('click', function(e){
			e.preventDefault();
			var imgSrc = $(this).data('href');
			self.canvasCropper.setImgSrc(imgSrc);
		});


	}

};

module.exports = Application;
