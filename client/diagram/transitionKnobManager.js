/**
 * This module manages the transition data like knobs and pathdata.
 *
 */
var util = require('../util/util');
var Knob = require('./knob');
var DragAlignment = require('./dragAlignment');
var event = require('../core/event');

var dom = util.dom;
var object = util.object;

var TransitionKnobManager = function(transition) {
    this.transition = transition;
    this.dockingManager = transition.dockingManager;
    this.event = transition.event;
    this.init();

    var that = this;
    this.transition.additions['knobManager'] = {
        setEndNode : function(node) {
            var knob = (that.isInitState()) ? that.addKnob(node.getCenter()) : that.getEndKnob();

            if(node.knob) {
                knob.hoverable(false);
            } else {
                knob.hoverable(true);
            }
        },
        setStartNode : function(node) {
            var knob = (that.isInitState()) ? that.addKnob(node.getCenter(), 0) : that.getStartKnob();

            if(node.knob) {
                knob.hoverable(false);
            } else {
                knob.hoverable(true);
            }
        },
        select : function() {
            that.inactiveStyle();
        },
        deselect : function() {
            that.hide();
        },
        hover : function() {
            that.inactiveStyle();
        },
        hoverOut : function() {
            if(!that.transition.selected) {
                that.hide();
            }
        }

    };
};

TransitionKnobManager.prototype.init = function() {
    this.knobs = [];
};

TransitionKnobManager.prototype.activate = function() {
    var that = this;

    var oldStartKnob = this.transition.firstChild('.startKnob');
    this._activateKnob(oldStartKnob, 0, true);

    var oldInnerKnobs = this.transition.children('.innerKnob');
    $.each(oldInnerKnobs, function(i, oldInnerKnob) {
        that._activateKnob(oldInnerKnob, (i + 1));
    });

    var oldEndKnob = this.transition.firstChild('.endKnob');
    this._activateKnob(oldEndKnob, this.knobs.length, true);

    return this;
};

TransitionKnobManager.prototype._activateKnob = function(knobSvg, index, isBoundaryKnob) {
    this.addKnob(knobSvg.getCenter(), index, true, isBoundaryKnob, knobSvg);
};

TransitionKnobManager.prototype.freeze = function() {
    $.each(this.knobs, function(index, knob) {
        knob.freeze();
        knob.config['fill-opacity'] = 0;
        knob.show();
    });
};

TransitionKnobManager.prototype.unfreeze = function() {
    $.each(this.knobs, function(index, knob) {
        knob.unfreeze();
        //TODO: we should use the old config value instead.
        knob.config['fill-opacity'] = 0.5;
        knob.show();
    });
};

TransitionKnobManager.prototype.addKnob = function(position, index, activate, isBoundaryKnob, svgInstance) {
    var index = index || this.size();
    var isBoundaryKnob = (!activate)? this.isInitState() : isBoundaryKnob;
    var knob = this.initKnob(index, position, isBoundaryKnob, svgInstance);
    this.knobs.splice(index, 0, knob);

    if(index === 0) {
        this.startKnob = knob;
    } else if(arguments.length === 1 || isBoundaryKnob) {
        this.endKnob = knob;
    }

    if(!activate && arguments.length !== 1) {
        //We do not need ato add an additional pathpart for the endnode;
        this.getPathManager().addPathPart(index, position);
    }

    if(!activate) {
        this.transition.redraw();
    }
    return knob;
};

TransitionKnobManager.prototype.initKnob = function(knobIndex, position, isBoundaryKnob, svgInstance) {
    var that = this;

    var knobConfig = {
        radius:5,
        activate: svgInstance,
        selectable: !isBoundaryKnob,
        fill: isBoundaryKnob ? 'green' : 'silver',
        cssClass: (knobIndex === 0) ? 'startKnob' : (isBoundaryKnob) ? 'endKnob' : 'innerKnob'
    };

    var knob = new Knob(this.transition.diagram, position, knobConfig, this.transition.group);
    knob.transition = this.transition;
    var initialDrag = true;

    if(!isBoundaryKnob) {
        knob.draggable({
            dragAlignment : new DragAlignment(that.transition.diagram,
                function() { return [{source: [knob.position()], target: that.getJoiningOrientation(knob)}];}),
            dragMove : function() {
                //We just update boundary knobs if they are not in within multiselection
                if(!(that.transition.diagram.isMultiSelection() && that.isBoundaryIndex(knobIndex))) {
                    that.updateKnob(that.getIndexForKnob(knob), knob.position());
                    that.transition.update();
                }
            },
            dragEnd : function() {
                if(initialDrag) {
                    that.transition.exec('knob_add', [knobIndex, knob.position()]);
                    initialDrag = false;
                } else {
                    that.transition.exec('knob_drop', [knobIndex, knob.position()]);
                }
            }
        });
    } else {
        knob.draggable({
            preventAlignment : true,
            dragMove : function() {
                //We just update boundary knobs if they are not in within multiselection
                if(!that.transition.diagram.isMultiSelection()) {
                    that.getPathManager().updatePart(that.getIndexForKnob(knob), knob.position());
                    that.transition.redraw();
                }
            },
            dragEnd : function() {
                //TODO: currently the getNodeByPosition function does return the first node found not the one with the highest index...
                var hoverNode = that.transition.diagram.getNodeByPosition(knob.position());
                if(knobIndex > 0) {
                    that.transition.setEndNode(hoverNode);
                } else {
                    that.transition.setStartNode(hoverNode);
                }
            }
        });
    }

    knob.on('deselect', function(evt) {
        if(that.transition.selected) {
            knob.inactiveStyle();
        } else {
            knob.hide();
        }
    });

    knob.on('remove', function() {
        that.removeKnob(knob);
    });

    //To prevent hiding the hoverknobs we adobt the transition hovering
    knob.hoverable({
        in : function() {
            that.transition.hover();
            if(!knob.isSelected()) {
                knob.fill('#9E9E9E');
            }
        },
        out : function() {
            that.transition.hoverOut();
        }
    });

    return knob;
};

/**
 * Api call for moving transition knobs
 */
TransitionKnobManager.prototype.moveKnob = function(knob, dx, dy) {
    //TODO: prevent redundancy with evt driven appraoch
    var knob = (knob.node) ? knob : this.getKnob(knob);
    var index = this.getIndexForKnob(knob);
    knob.move(dx,dy);
    //TODO: not very clean... is used for tracing api move calls... transitionManager CMD_KNOB_DROP command
    knob.node.root.dxSum = dx;
    knob.node.root.dySum = dy;
    var newPostion = knob.position();
    this.getPathManager().updatePart(index, newPostion);
    this.transition.update();
    this.transition.exec('knob_drop', [index, newPostion]);
};

TransitionKnobManager.prototype.moveInnerKnobs = function(distance) {
    $.each(this.getInnerKnobs(), function(i, knob) {
        knob.triggerDrag(distance.x, distance.y);
    });
};

TransitionKnobManager.prototype.selectInnerKnobs = function() {
    $.each(this.getInnerKnobs(), function(i, knob) {
        knob.select(true);
    });
};

TransitionKnobManager.prototype.getSelectedKnobs = function() {
    var result = [];
    $.each(this.getInnerKnobs(), function(index, knob) {
        if(knob.isSelected()) {
            result.push(knob);
        }
    });
    return result;get
};

TransitionKnobManager.prototype.getInnerKnobs = function() {
    var result = [];
    for(var i = 1; i < this.knobs.length - 1; i++) {
        result.push(this.knobs[i]);
    }
    return result;
};

TransitionKnobManager.prototype.isInitState = function() {
    return this.size() < 2;
}

TransitionKnobManager.prototype.updateStartKnob = function(position) {
    this.updateKnob(0, position);
};

TransitionKnobManager.prototype.updateEndKnob = function(position) {
    this.updateKnob(-1, position);
};

TransitionKnobManager.prototype.updateKnob = function(knobIndex, position) {
    knobIndex = object.getIndex(this.knobs, knobIndex);

    // Note the following is only neccessary for boundary knobs but won't affect other knobs since the given position
    // is the same as the current knob position after drag.
    this.knobs[knobIndex].moveTo(position.x, position.y);

    // update path
    this.getPathManager().updatePart(knobIndex, position);
};

TransitionKnobManager.prototype.removeKnob = function(knob) {
    if(!this.transition.removed) {
        var index = this.getIndexForKnob(knob);
        if(index < 0) {
            return;
        }
        this.knobs.splice(index, 1);
        this.getPathManager().removePathPart(index);
        this.transition.update();
    }
};

TransitionKnobManager.prototype.size = function() {
    return this.knobs.length;
};

TransitionKnobManager.prototype.lastIndex = function() {
    return this.size() - 1;
};

TransitionKnobManager.prototype.hasInnerKnobs = function() {
    return this.knobs.length > 2;
};

TransitionKnobManager.prototype.remove = function() {
    object.each(this.knobs, function(index, value) {
        if(object.isDefined(value)) {
            value.remove();
        }
    });
};

TransitionKnobManager.prototype.removeDockingMarker = function() {
    this.transition.group.$().children('.docking').remove();
};

TransitionKnobManager.prototype.isBoundaryKnob = function(knob) {
    return this.isBoundaryIndex(this.getIndexForKnob(knob));
};

TransitionKnobManager.prototype.isBoundaryIndex = function(knobIndex) {
    return knobIndex === 0 || knobIndex === this.lastIndex();
};

TransitionKnobManager.prototype.getKnobsByIndex = function(index) {
    return [this.knobs[index - 1], this.knobs[index]];
};

TransitionKnobManager.prototype.getJoiningOrientation = function(knob) {
    var index = this.getIndexForKnob(knob);
    var result = [];
    if(index <= 1) { //start or second docking
        result.push(this.transition.dockingManager.startDocking.position());
    } else if(index !== 0){
        var orientation = this.knobs[index - 1].position();
        result.push({x : orientation.x, y : orientation.y});
    }

    if(index >= this.knobs.length -2) { //end or one before end docking
        result.push(this.transition.dockingManager.endDocking.position());
    } else {
        var orientation = this.knobs[index + 1].position();
        result.push({x : orientation.x, y : orientation.y});
    }

    return result;
};

TransitionKnobManager.prototype.getIndexForKnob = function(knob) {
    return this.knobs.indexOf(knob);
};

TransitionKnobManager.prototype.getKnobPositions = function() {
    var result = [];
    object.each(this.knobs, function(index, value) {
        result.push(value.position());
    });
    return result;
};

TransitionKnobManager.prototype.getStartKnob = function() {
    return this.getKnob(0);
};

TransitionKnobManager.prototype.getEndKnob = function() {
    return this.getKnob(-1);
};

TransitionKnobManager.prototype.start = function() {
    return this.getKnob(0).position();
};

TransitionKnobManager.prototype.end = function() {
    return this.getKnob(-1).position();
};

TransitionKnobManager.prototype.getKnob = function(index) {
    return object.valueByIndex(this.knobs, index);
};

TransitionKnobManager.prototype.hide = function() {
    object.each(this.knobs, function(index, knob) {
        if(!knob.isSelected()) {
            knob.hide();
        }
    });
};

TransitionKnobManager.prototype.inactiveStyle = function() {
    object.each(this.knobs, function(index, knob) {
        if(!knob.isSelected()) {
            knob.inactiveStyle();
        }
    });
};

TransitionKnobManager.prototype.ownsKnobNode = function(node) {
    var result = false;
    return node.root.$().parent().attr('id') === this.transition.group.$().attr('id');
};

TransitionKnobManager.prototype.getPosition = function(index) {
    if(index < this.size()) {
        return object.valueByIndex(this.knobs, index).position();
    }
};

TransitionKnobManager.prototype.getPathManager = function() {
    return this.transition.pathManager;
};

TransitionKnobManager.prototype.isInitState = function() {
    return !this.endKnob;
};

TransitionKnobManager.prototype.dump = function() {
    var result = 'KnobManager - '+this.knobs.length+'<br />';
    object.each(this.knobs, function(index, knob) {
        result += '['+index+']('+knob.position().x+'/'+knob.position().y+')<br />';
    });
    return result;
};

TransitionKnobManager.prototype.validate = function() {
    var $transitionGroup = this.transition.group.$();
    var $svgRoot = this.transition.diagram.getRootSVG().$();

    var result = [];
    if(this.isInitState()) {
        return result;
    }

    if(this.knobs < 2) {
        result['knobCount'] = 'Too less knobs found!';
    }

    if(!this.startKnob) {
        result['startKnob'] = 'No startKnob found!';
    } else if(!$transitionGroup.find('#'+this.startKnob.node.id).length) {
        result['startKnob'] = 'No startKnob found in transition group!';
    } else if($transitionGroup.find('.startKnob').length != 1) {
        result['startKnob'] = 'Invalid startKnob amount found in transition group!';
    }

    var innerKnobs = this.getInnerKnobs();
    var $innerKnobs = $transitionGroup.find('.innerKnob');
    if(innerKnobs.length != $innerKnobs.length) {
        result['innerKnobs'] = 'Invalid amount of innerKnobs found in transition group!';
    }

    if(!this.endKnob) {
        result['endKnob'] = 'No endKnob found!';
    } else if(!$transitionGroup.find('#'+this.endKnob.node.id).length) {
        result['endKnob'] = 'No startKnob found in transition group!';
    } else if($transitionGroup.find('.endKnob').length != 1) {
        result['endKnob'] = 'Invalid endKnob amount found in transition group!';
    }

    return result;
};

module.exports = TransitionKnobManager;