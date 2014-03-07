/**
 *	returns an Ajax POST response using deferred, url & data are required, dataType is optional
 */

var PerformAjaxPost = function(url, data, dataType) {
	return $.ajax({
		type: 'POST',
		url: url,
		data: data,
		dataType: dataType || 'json'
	});
};

module.exports = PerformAjaxPost;
