var event = require('../core/event');
var diagramMgr = require('../diagram/diagramManager');

var rate = 10;
var $viewbox = $('#viewbox');
var $viewport = $('#viewport');

var initListener = function() {
    event.listen('diagram_new', update);
    event.listen('viewport_update', update);
    event.listen('view_zoomedIn', update);
    event.listen('view_zoomedOut', update);
}

var update = function() {
    var diagram = diagramMgr.getActiveDiagram();

    var scaledRate = rate * diagram.scale;

    var $stageContainer = $(diagram.svg.containerNode);
    var stHeight = $stageContainer.height();
    var stWidth = $stageContainer.width();

    $viewport.height(stHeight / scaledRate);
    $viewport.width(stWidth / scaledRate);

    var left = diagram.mainPart.x() * -1 / scaledRate;
    var top = diagram.mainPart.y() * -1 / scaledRate;

    $viewport.css('left', left);
    $viewport.css('top', top);
    //var vHeight = $viewbox.height();
    //var vWidth = $viewbox.width();

};

var init = function() {
    initListener();
};

module.exports = {
    init : init
};