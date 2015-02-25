'use strict';

(function (window, $) {
    var $body = $(document.body);
    $('.js-to-top').on('click', function toTop(event) {
        $body.animate({
            scrollTop: 0
        }, 1000);
        event.preventDefault();
    });
})(window, jQuery);