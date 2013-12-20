
/**
*	returns serialized form data, container element is required
**/
var SerializeFormFields = function($el) {
	return $el.find('input, select, textarea').serialize();
};

module.exports = SerializeFormFields;
