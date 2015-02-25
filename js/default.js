'use strict';

(function (window, $) {
    var $win = $(window);
    $('.js-to-top').on('click', function toTop(event) {
        $win.animate({
            scrollTop: 0
        }, 1000);
        event.preventDefault();
    });
})(window, jQuery);