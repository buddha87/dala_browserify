var event = require('../core/event');
var config = require('../core/config');
var transitionMenu = require('./transitionMenu');

exports.init = function() {
    $('#diagram-zoomIn').on('click', function() {
        event.trigger('view_zoomIn');
    });

    $('#diagram-zoomOut').on('click', function() {
        event.trigger('view_zoomOut');
    });

    $('#diagram-move').on('click', function() {
        event.trigger('view_toggle_mode_move');
        $(this).toggleClass('active');
    });

    if(config.is('diagram_mode_move', false)) {
        $('#diagram-align').toggleClass('active');
    }

    $('#diagram-align').on('click', function() {
        event.trigger('view_toggle_setting_align');
        $(this).toggleClass('active');
    });

    if(config.is('dragAlign', true)) {
        $('#diagram-align').toggleClass('active');
    }

    $('.nav-toggle').on('click', function() {
        var navId = $(this).data('nav-id');
        $(this).siblings('.'+navId).animate({width: 'toggle'});
    });

    transitionMenu.init();
};