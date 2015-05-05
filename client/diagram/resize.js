var util = require('../util/util');
var event = require('../core/event');
var Command = require('../core/command');
var Transform = require('../svg/transform');
var SVG = require('../svg/svg');
var DragConfig = require('../svg/dragConfig');

var object = util.object;
var dom = util.dom;

// Used to identify the different knobs from north west clockwise
var KNOB_NW = 0;
var KNOB_N = 1;
var KNOB_NE = 2;
var KNOB_E = 3;
var KNOB_SE = 4;
var KNOB_S = 5;
var KNOB_SW = 6;
var KNOB_W = 7;


// specifies the space between node and resize knob
var DIF = 3;

// specifies the size of a knob
var SIZE = 5;

// used for calculating the position of the knobs
var DIF_REL = DIF + SIZE;

var Resize = function(node, diagram) {
    this.diagram = diagram;
    this.knobs = [];
    this.node = node;
    this.config = this.node.template.config.resize;
};

/**
 * Renders the knobs around the node.
 */
Resize.prototype.activateKnobs = function() {

    var positions = this.calculateKnobPosition();
    //Initialize the different knobs with different drag restricitons
    this.createKnob(KNOB_NW,positions[KNOB_NW],new DragConfig());
    this.createKnob(KNOB_N, positions[KNOB_N],new DragConfig().yOnly());
    this.createKnob(KNOB_NE,positions[KNOB_NE],new DragConfig());
    this.createKnob(KNOB_E, positions[KNOB_E],new DragConfig().xOnly());
    this.createKnob(KNOB_SE,positions[KNOB_SE],new DragConfig());
    this.createKnob(KNOB_S, positions[KNOB_S], new DragConfig().yOnly());
    this.createKnob(KNOB_SW,positions[KNOB_SW],new DragConfig());
    this.createKnob(KNOB_W, positions[KNOB_W],new DragConfig().xOnly());

    var translX = this.node.root.x() - DIF_REL;
    var translY = this.node.root.y() - DIF_REL;

    //Add all knobs to a group element
    this.group = this.diagram.svg.g({
            transform : new Transform().translate(translX, translY)
        }, this.knobs[KNOB_NW], this.knobs[KNOB_N], this.knobs[KNOB_NE], this.knobs[KNOB_E],
        this.knobs[KNOB_SE], this.knobs[KNOB_S], this.knobs[KNOB_SW], this.knobs[KNOB_W]);
};

/**
 * Renders a knob to the given position and configures the drag and hover
 * logic. The total drag amount of one drag is can be acessed through
 * this.dx and this.dy.
 */
Resize.prototype.createKnob = function(knob, p, dragCfg) {
    var that = this;
    // Initialize draglogic
    var dragHook = dragCfg
        .dragStart(function(evt) {
            that.dx = 0;
            that.dy = 0;
            that.dragKnob = knob;
            that.resizeElements = that.getResizeElements();
        })
        .dragMove(function(evt, dx, dy) {
            //We keep track of the total drag movement
            this.dx += dx;
            this.dy += dy;
            that.resize(dx,dy, that.knob);
        })
        .dragEnd(function(evt) {
            if(!this.hovered) {
                this.fill('black');
            }

            event.trigger('node_resized', that.node);

            delete that.resizeElements;

        }).get();

    // Render the knob on stage
    this.knobs[knob] = this.diagram.svg.rect({
        x: 0,
        y: 0,
        class: 'knob',
        transform : new Transform().translate(p.x,p.y),
        width: SIZE,
        height: SIZE
    }).draggable(dragHook).hoverable({
        in: function(evt) {
            this.fill('green');
        },
        out: function(evt) {
            if(!this.drag) {
                this.fill('black');
            }
        }
    });
};

/**
 * Determines all svg elements participating in the resize process, which
 * are configured in the resize config bind attribute
 */
Resize.prototype.getResizeElements = function() {
    var result = [];
    var that = this;
    object.each(this.config, function(index, value) {
        result[index] = SVG.get(that.node.getNodeSelector(value.bind));
    });
    return result;
};

/**
 * Updates the resize logic
 */
Resize.prototype.update = function() {
    this.resize(0,0);
};

/**
 * Resizes the node by applying the configured resize logic to the inner
 * svg elements of the nodes. The dx and dy values specifie the resize
 * amount of the x- and y-axis. After the actual resize process the knobs
 * are aligned to the new node dimension.
 */
Resize.prototype.resize = function(dx, dy) {
    this.updateNodes(dx,dy);
    this.updateKnobs(true);
};

/**
 * Aligns a single knob to the
 * @param {type} resizeKnob
 * @returns {undefined}
 */
Resize.prototype.updateKnobs = function(resizeKnob) {
    if(object.isDefined(this.group)) {
        if(object.isDefined(resizeKnob) && resizeKnob) {
            var positions = this.calculateKnobPosition();

            this.knobs[KNOB_NW].moveTo(positions[KNOB_NW]);
            this.knobs[KNOB_N].moveTo(positions[KNOB_N]);
            this.knobs[KNOB_NE].moveTo(positions[KNOB_NE]);
            this.knobs[KNOB_E].moveTo(positions[KNOB_E]);
            this.knobs[KNOB_SE].moveTo(positions[KNOB_SE]);
            this.knobs[KNOB_S].moveTo(positions[KNOB_S]);
            this.knobs[KNOB_SW].moveTo(positions[KNOB_SW]);
            this.knobs[KNOB_W].moveTo(positions[KNOB_W]);
            this.node.executeAddition('resize');
        } else {
            //If the flag is not set we just do an update probably from simple node drag/drop
            var translX = this.node.root.getTransformation().translate().x - DIF_REL;
            var translY = this.node.root.getTransformation().translate().y - DIF_REL;
            this.group.translate(translX, translY);
        }
    }
};

Resize.prototype.calculateKnobPosition = function() {
    var rightX = SIZE + (DIF*2) + this.node.width();
    var centerX = rightX / 2;
    var bottomY = SIZE + (DIF*2) + this.node.height();
    var centerY = bottomY / 2;


    var result = [];
    result[KNOB_NW] = {x:0, y:0};
    result[KNOB_N] = {x:centerX, y:0};
    result[KNOB_NE] = {x:rightX, y:0};
    result[KNOB_E] = {x:rightX, y:centerY};
    result[KNOB_SE] = {x:rightX, y:bottomY};
    result[KNOB_S] = {x:centerX, y:bottomY};
    result[KNOB_SW] = {x:0, y:bottomY};
    result[KNOB_W] = {x:0, y:centerY};
    return result;

};

Resize.prototype.removeKnobs = function() {
    if(object.isDefined(this.group)) {
        dom.remove(this.group);
    }
    delete this.group;
};

Resize.prototype.updateNodes = function(dx,dy) {
    var that = this;
    if(!object.isDefined(this.resizeElements)) {
        this.resizeElements = this.getResizeElements();
    }

    object.each(this.resizeElements, function(index, element) {
        that.updateNode(index,element,dx,dy);
    }) ;
};

Resize.prototype.updateNode = function(index, element, dx, dy) {
    dx = (!object.isDefined(dx))? 0 : dx;
    dy = (!object.isDefined(dy))? 0 : dy;

    var elementConfig = this.config[index];
    if(object.isDefined(elementConfig.value)) {
        this.setResize(element, elementConfig, elementConfig.value[0], dx, 'width');
        //We just set one dimension for a circle
        if(elementConfig.value[0].type !== 'circle' || this.dragKnob === KNOB_S || this.dragKnob === KNOB_N) {
            this.setResize(element,elementConfig, elementConfig.value[1], dy, 'height');
        }
    }

    if(object.isDefined(elementConfig.min)) {
        this.alignValueLimit(element, elementConfig.min[0], 'width', 'min');
        this.alignValueLimit(element, elementConfig.min[1], 'height', 'min');
    }

    if(object.isDefined(elementConfig.max)) {
        this.alignValueLimit(element, elementConfig.max[0], 'width', 'max');
        this.alignValueLimit(element, elementConfig.max[1], 'height', 'max');
    }

    if(object.isDefined(elementConfig.position)) {
        this.alignPosition(element, elementConfig);
    }
};

Resize.prototype.setResize = function(svgElement, elementConfig, setting, d, dimension) {
    switch(setting.type) {
        case 'none':
            break;
        case 'parent':
            //We could check the resize settings of the parent if this is static
            //we do not have to change anything when resizing.
            svgElement[dimension](1);

            var parentVal = dom.parent(svgElement.instance()).getBBox()[dimension];
            svgElement[dimension](parentVal + setting.value);
            break;
        default:
            var currentVal = svgElement[dimension]() ;
            var newValue = (currentVal + d);
            if(newValue > 0) {
                svgElement[dimension]((currentVal + d));
            }
            break;
    }
};

Resize.prototype.alignValueLimit = function(svgElement, setting, dimension, type) {
    var value = setting.type;
    var limit;

    if(value === 'parent') {
        limit = dom.parent(svgElement.instance()).getBBox()[dimension];
    } else if(!isNaN(value)) {
        limit = parseInt(value);
    } else if(util.string.startsWith(value, '#')) {
        limit = dom.getFirst(this.node.getNodeSelector(value)).getBBox()[dimension];
    } else {
        return;
    }

    if(object.isDefined(setting.value)) {
        limit += setting.value;
    }

    var currentVal = svgElement[dimension]()
    if((type === 'min' && currentVal < limit) || (type === 'max' && currentVal > limit)) {
        svgElement[dimension](limit);
    }
};

Resize.prototype.alignPosition = function(svgElement, elementConfig) {
    //var setting = elementConfig.
    //TODO: set alignElement id in config !
    var x = this.getAlignedValue(svgElement,elementConfig.position[0], elementConfig.alignto, 'width' , 'x');
    var y = this.getAlignedValue(svgElement,elementConfig.position[1], elementConfig.alignto, 'height', 'y');

    if(object.isDefined(x)) {
        svgElement.moveX(x);
    }

    if(object.isDefined(y)) {
        svgElement.moveY(y);
    }
};

Resize.prototype.getAlignedValue = function(svgElement, settings, alignto, dimension, dimensionCoord) {
    switch(settings.type) {
        case 'none':
            break;
        case 'center':
            var alignSVG = this.getAlignElement(alignto, svgElement.instance());
            if(object.isDefined(alignSVG)) {
                var alignVal = alignSVG[dimension]();
                return (alignVal - svgElement[dimension]()) / 2 + settings.value;
            };
            break;
        case 'relative':
            var prevNode = dom.prev(svgElement.instance());
            if(object.isDefined(prevNode)) {
                var prevSVG = SVG.get(prevNode);
                var prevVal = prevSVG[dimension]();
                var prevCoord = prevSVG[dimensionCoord]();
                return (prevCoord + prevVal) + settings.value;
            } else {
                //No prev sibling
                return 0;
            };
            break;
        case 'right':
        case 'bottom':
            var alignSVG = this.getAlignElement(alignto, svgElement.instance());
            if(object.isDefined(alignSVG)) {
                var alignVal = (settings.type === 'right')? alignSVG.getRightX():alignSVG.getBottomY();
                return (alignVal - svgElement[dimension]()) - settings.value;
            };
            break;
        default:
            return;
    }
};

Resize.prototype.getAlignElement = function(alignto, node) {
    var elementToAlign;
    if(alignto) {
        //If the alignto is set in the config we just use this node element
        elementToAlign = SVG.get(this.node.getNodeSelector(alignto));
    } else {
        //Else we try to get the previous element e.g. a rect element
        elementToAlign = SVG.get(dom.prev(node));
    }
    // If we do not have a prev element we return the parent node
    return (object.isDefined(elementToAlign)) ? elementToAlign : SVG.get(dom.parent(node));
};

module.exports = Resize;
