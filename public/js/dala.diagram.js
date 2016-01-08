(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
require('./ui/jqueryPlugins');
require('./svg/draggable');

if(!window.dala) {
    dala = {};
}

dala_env = window.dala_env || {};
dala_env.initial_templates = {};

//TODO: better namespace handling... export to module
var globalModules =  {
    'templateManager': require('./diagram/templateManager')
};

dala.require = function(id) {
    return globalModules[id];
};



if(!window.dala.SVG) {
    window.dala.SVG = require('./svg/svg');
}

if(!window.dala.Diagram) {
    window.dala.Diagram = require('./diagram/diagram');
}


},{"./diagram/diagram":16,"./diagram/templateManager":37,"./svg/draggable":51,"./svg/svg":60,"./ui/jqueryPlugins":68}],2:[function(require,module,exports){
var object = require('../util/object');
var dom = require('../dom/dom');
var string = require('../util/string');

var Cache = function() {
    this.queryCache = {};
    this.svgCache = {};
};

Cache.prototype.clearBySuffix = function(suffix) {
    for(key in this.queryCache) {
        if(this.queryCache.hasOwnProperty(key) && string.endsWith(key, suffix)) {
            delete this.queryCache[key];
        };
    }

    for(key in this.svgCache) {
        if(this.svgCache.hasOwnProperty(key) && string.endsWith(key, suffix)) {
            delete this.svgCache[key];
        };
    }
};

Cache.prototype.$ = function(obj, preventCache) {
    if(!obj) {
        return;
    }

    if(this.queryCache[obj]) {
        return this.queryCache[obj];
    }

    var settings = this.getCacheSettings(obj, this.queryCache);
    return this.cacheCheck(settings.key, settings.$node, this.queryCache, preventCache);
};

Cache.prototype.svg = function(obj, preventCache) {
    if(!obj) {
        return;
    }

    if(this.svgCache[obj]) {
        return this.svgCache[obj];
    }

    var settings = this.getCacheSettings(obj, this.svgCache);
    return this.cacheCheck(settings.key, $.svg(settings.$node), this.svgCache, preventCache);
};

Cache.prototype.getCacheSettings = function(obj, cache) {
    var settings = {};

    if(object.isString(obj)){
        settings.$node = this.queryCache[obj] || $(obj);
        settings.key = obj;
    } else if(obj.jQuery) {
        settings.$node = obj;
        settings.key = dom.getIdSelector(obj.attr('id'));
    } else {
            settings.$node = $(obj);
            settings.key = dom.getIdSelector(settings.$node.attr('id'));
    }

    return settings;
}

Cache.prototype.cacheCheck = function(key, obj, cache, preventCache) {
    preventCache = preventCache || false;
    if(key && obj) {
        return (!preventCache) ? cache[key] = obj : obj;
    } else {
        return obj;
    }
}

Cache.prototype.remove = function(obj) {
    if(object.isString(obj)) {
        delete this.queryCache[obj];
    }
};

Cache.prototype.exists = function(selector) {
    return object.isDefined(queryCach[selector]);
};

Cache.prototype.sub = function() {
    return new Cache();
};

module.exports = new Cache();
},{"../dom/dom":45,"../util/object":73,"../util/string":74}],3:[function(require,module,exports){
var event = require('./event');
var object = require('../util/object');
var string = require('../util/string');

var Response = function(data) {
    this.data = data;
};

Response.prototype.isConfirmation = function() {
    return this.data && (this.data.status === 0);
};

Response.prototype.isError = function() {
    return this.data && this.data.status && (this.data.status > 0);
};

Response.prototype.getError = function() {
    return this.data.error;
};

Response.prototype.getErrorCode = function() {
    return this.data.errorCode;
};

Response.prototype.toString = function() {
    return "{ status: "+this.data.status+" error: "+this.data.error+" data: "+this.data.data+" }";
};

var config = {
    host : 'localhost',
    port : 3000
};

var errorHandler = function(cfg, xhr,type,errorThrown, errorCode) {
    errorCode = (xhr) ? xhr.status : parseInt(errorCode);
    console.warn("ajaxError: "+type+" "+errorThrown+" - "+errorCode);

    if(cfg.errorMessage) {
        if(object.isString(cfg.errorMessage)) {
            event.trigger('error', cfg.errorMessage);
        } else if(object.isObject(cfg.errorMessage, errorCode)) {
            var msg = cfg.errorMessage[errorCode] || cfg.errorMessage['default'];
            if(object.isDefined(msg)) {
                event.trigger('error', msg);
            }
        }
    }

    if(cfg.error && object.isFunction(cfg.error)) {
        // "timeout", "error", "abort", "parsererror" or "application"
        cfg.error(errorThrown, errorCode, type);
    } else if(cfg.error) {
        var msg = cfg.error[errorCode] || cfg.error['default'];
        if(object.isDefined(msg)) {
            event.trigger('error', msg);
        }
    }

    if(!cfg.error && !cfg.errorMessage) {
        console.warn('Unhandled ajax error: '+path+" type"+type+" error: "+errorThrown);
    }
};

module.exports = {
    test: function(settings) {
        this.ping(settings);
    },
    ping: function(settings) {
        settings = settings || config;
        var result = false;
        $.ajax({
            url: "http://"+settings.host+":"+settings.port+"/service/ping",
            //crossDomain: true,
            type : "GET",
            data: {'ping':true},
            async : false,
            dataType: "json",
            success: function (response) {
                result = true;
            },
            error: function (xhr, status, msg) {
                result = false;
            }
        });

        return result;
    },
    ajax: function(path, data, cfg) {
        var cfg = cfg || {};
        var async = cfg.async || true;
        var dataType = cfg.dataType || "json";

        var error = function(xhr,type,errorThrown, errorCode) {
            errorHandler(cfg, xhr,type,errorThrown, errorCode);
        };

        var success = function(response) {
            var responseWrapper = new Response(response);

            if(responseWrapper.isError()) { //Application errors
                return error(undefined,"application",responseWrapper.getError(), responseWrapper.getErrorCode());
            } else if(cfg.success) {
                if(object.isString(cfg.success)) {
                    event.trigger('info', cfg.success);
                } else {
                    cfg.success(responseWrapper);
                }
            }

            if (cfg.successMessage) {
                event.trigger('info', cfg.successMessage);
            }
        };

        var that = this;
        $.ajax({
            url: that.getUrl(path),
            //crossDomain: true, //TODO: read from config
            type : cfg.type,
            processData : cfg.processData,
            contentType: cfg.contentType,
            data: data,
            async : async,
            dataType: dataType,
            success: success,
            error: error
        });
    },
    post: function(path, data, cfg) {
        cfg = cfg || {};
        cfg.type = 'POST';
        this.ajax(path, data, cfg);
    },
    get: function(path, cfg) {
        cfg = cfg || {};
        cfg.type = 'GET';
        this.ajax(path, cfg.data, cfg);
    },
    xml: function(path, cfg) {
        cfg = cfg || {};
        cfg.dataType = 'xml';
        return this.get(path,cfg);
    },
    text : function(path, cfg) {
        cfg = cfg || {};
        cfg.dataType = 'text';
        return this.get(path,cfg);
    },
    getScript: function(path, cfg) {
        cfg = cfg || {};

        return $.getScript(path)
            .done(function(s, Status) {
                if(cfg.success) {
                    cfg.success(s, Status);
                }
            }).fail(function(xhr, settings, exception) {
                errorHandler(cfg, xhr,'error',exception);
            });
    },
    restGet: function(path, id, cfg) {
        var path = string.endsWith(path, '/')? path+id : path+'/'+id;
        this.get(path, cfg);
    },
    getUrl: function(addition) {
        var url = "http://"+config.host+":"+config.port;
        if(addition) {
            url += addition;
        }
        return url;
    },
    set: function(settings) {
        config = settings;
    },
    getSettings: function() {
        return config;
    }
}
},{"../util/object":73,"../util/string":74,"./event":7}],4:[function(require,module,exports){
var object = require('../util/object');

var CommandAction = function(client, action) {
    this.client = client;
    this.action = action;
};

CommandAction.prototype.exec = function(args) {
    return this.action.apply(this.client, args);
};

var Command = function(client, doAction, undoAction) {
    if(arguments.length > 0) {
        //Call the exec setter
        this.exec(client,doAction);
        this.undo(client,undoAction);
    }
    this.timestamp = Date.now();
};

Command.prototype.exec = function(client, action, args) {
    return this.action('do', client, action, args);
};

Command.prototype.undo = function(client, action, args) {
    return this.action('undo', client, action, args);
};

Command.prototype.instance = function(doArgs, undoArgs) {
    var instance = $.extend(true, {}, this);

    //If given, we overwrite the argument settings for the actions
    if(doArgs) {
        instance.doArgs = doArgs;
    }

    if(undoArgs) {
        instance.undoArgs = undoArgs;
    }

    instance.id = this.id+'_'+Date.now();

    return instance;
};

/**
 * Just a helper to unify the logic for doAction and undoAction.
 *
 * - if just the type is given we assume all necessary action data is given for this type (do/undo) and call the action
 * - if a there is another argument beside the type we assume an args array and call the action with the given array
 * - if there are more args given, we assume a setter call to set the action data (do/undo)
 *
 * @param type do or undo
 * @param client client object used as this
 * @param action the function to call
 * @param args arguments
 * @returns {Command}
 */
Command.prototype.action = function(type, client, action, args) {
    if(args) {
        this[type + 'Args'] = args;
    }

    if(client && action) {
        this[type + 'Action'] = new CommandAction(client, action);
    } else {
        //Execute either with args settings from this or from argument list
        this[type + 'Args'] = arguments[1] || this[type + 'Args'];
        var action = this[type + 'Action'];
        if(action) {
            return action.exec(this[type + 'Args']);
        }
    }

    return this;
};

module.exports = Command;


},{"../util/object":73}],5:[function(require,module,exports){
var util = require('../util/util');
var object = util.object;
var dom = util.dom;
var event = require('./event');
var Command = require('./command');

//Command instances for diagrams
var instances = {};

var sub = function(subId, updateHandler) {
    return instances[subId] = new CommandManager(subId, updateHandler);
};

var CommandManager = function(subId, updateHandler) {
    this.subId = subId;
    this.commands = {};
    this.undoCommands = [];
    this.redoCommands = [];
    this.updateHandler = updateHandler;
    this.register('cmd_group', new Command(this, function(commands) {
        var that = this;
        $.each(commands, function(index, cmd) {
            that.commands[cmd[0]].instance(cmd[1], cmd[2]).exec();
        });
    }, function(commands) {
        var that = this;
        $.each(commands, function(index, cmd) {
            that.commands[cmd[0]].instance(cmd[1], cmd[2]).undo();
        });
    }));
};

/**
 * We can register a new command for this given command instance (mostly a command for a specific diagram instance)
 * which is identified by its string id.
 *
 * The client and action attribute for the do and undo action should be set for the given actions.
 *
 * @param cmdId string id
 * @param cmd command instance
 */
CommandManager.prototype.register = function(cmdId, cmd) {
    this.commands[cmdId] = cmd;
    cmd.id = cmdId;
};

CommandManager.prototype.addGroup = function(commands) {
    this.add('cmd_group', commands, commands);
};

CommandManager.prototype.execGroup = function(commands) {
    this.exec('cmd_group', commands, commands);
};

CommandManager.prototype.exec = function(cmdId, doArgs, undoArgs) {
    var cmdInstance = this.add(cmdId, doArgs, undoArgs);
    if(cmdInstance) {
        console.log('Execute command '+cmdInstance.id);
        return cmdInstance.exec();
    }
};

CommandManager.prototype.add = function(cmdId, doArgs, undoArgs) {
    var command = this.commands[cmdId];
    if(command) {
        this.updated(command);
        var cmdInstance = command.instance(doArgs,undoArgs);
        if(cmdInstance) {
            console.log('Add command '+cmdInstance.id);
            this.undoCommands.push(cmdInstance);
            if(!this.lockRedo) {
                this.redoCommands = [];
            }
        }
        return cmdInstance
    } else {
        console.warn('Unregistered command '+cmdId+' was called.');
    }
};

CommandManager.prototype.undo = function() {
    var command = this.undoCommands.pop();
    if(object.isDefined(command) && object.isDefined(command.undo)) {
        console.log('Undo command '+command.id);
        command.undo.apply(command);
        this.redoCommands.push(command);
        this.updated(command);
    }
};

CommandManager.prototype.redo = function() {
    var command = this.redoCommands.pop();
    if(object.isDefined(command) && object.isDefined(command.exec)) {
        console.log('Redo command '+command.id);
        this.lockRedo = true;
        command.exec.apply(command);
        this.lockRedo = false;
        this.undoCommands.push(command);
        this.updated(command);
    }
};

CommandManager.prototype.updated = function(command) {
    this.lastChange = Date.now();
    if(this.updateHandler) {
        this.updateHandler(command);
    }
}

module.exports = {
    sub : sub
};


},{"../util/util":75,"./command":4,"./event":7}],6:[function(require,module,exports){
var object = require('../util/object');

var values = {};

module.exports = {
    val : function(key, defaultVal) {
        if(object.isDefined(key)) {
            var result = values[key];
            return (object.isDefined(result)) ? result : defaultVal;
        }
    },

    is : function(key, defaultVal) {
        return this.val(key,defaultVal) === true;
    },

    debug : function(val) {
        if(object.isBoolean(val)) {
            this.setVal('debug', val);
        }
        return this.val('debug', false);
    },

    setVal : function(key, value) {
        if(object.isDefined(key) && object.isDefined(value)) {
            values[key] = value;
            var val = this.val(key);
        }
    },

    replaceConfigValues : function(text, config) {
        var result = text;
        object.each(config, function(key, value) {
            var regExp = new RegExp("{" + key + "}", "g");
            result = result.replace(regExp, value);
        });
        return result;
    }
};
},{"../util/object":73}],7:[function(require,module,exports){
var events = {};

var object = require('../util/object');
var config = require('../core/config');
var SubEvent = require('./subEvent');

var Promise = require('bluebird');

var hasHandler = function(type) {
    return events[type];
};

mouse = {};

$(document).on( 'mousemove', function(e) {
    mouse = e;
});


module.exports = {
    mouse : function() {
        return mouse;
    },
    listen:  function(type, handler, module) {
        if(!object.isFunction(handler)) {
            return;
        }

        var eventConfig = {
            handler : handler,
            module : module
        };

        if(!events[type]) {
            events[type] = [eventConfig];
        } else {
            events[type].push(eventConfig);
        }
    },

    unlisten: function(type, func) {
        if(events[type]) {
            var index = events[type].indexOf(func);
            if(index > -1) {
                events[type].splice(index, 1);
            }
        }
    },

    sub: function(context) {
        return new SubEvent(context, this);
    },

    command: function(command, execute) {
        if(execute) {
            this.trigger('command_execute', command);
        } else {
            this.trigger('command_add', command);
        }
    },

    trigger: function(type, data, rootEvt) {
        var that = this;
        return new Promise(function(resolve, reject) {
            var event = rootEvt || {};

            event.data = data;
            event.type = type;

            if(hasHandler(event.type)) {
                var handlerArr = events[event.type];
                object.each(handlerArr, function(index, eventConfig) {
                    var handler = eventConfig.handler;
                    var module;
                    try {
                        module = eventConfig.module;
                        if(eventConfig.module) {
                            handler.call(eventConfig.module, event);
                        } else {
                            handler(event);
                        }
                    } catch(err) {
                        var modText = (module && module.constructor && module.constructor.name)?module.constructor.name:'unknown';
                        if(modText === 'unknown' && config.debug()) {
                            console.error('Event handler error - module: '+modText+' event: '+event.type, handler, err);
                        } else {
                            console.error('Event handler error - module: '+modText+' event: '+event.type, err);
                        }
                        that.trigger('error', 'An error occured while executing the last action !');
                    }
                });
            }

            //We just resolve in all cases since the caller of trigger should remain independent of handler modules
            resolve();
        });
    },

    on: function(node, event, selector, data, handler) {
        $(node).on(event,selector,data, handler);
    },

    off: function(node, event, selector, handler) {
        $(node).off(event, selector, handler);
    },

    once: function(node, event, selector, data, handler) {
        $(node).one(event,selector,data, handler);
    },

    triggerDom: function(node, event) {
       $(node).trigger(event);
    }
};
},{"../core/config":6,"../util/object":73,"./subEvent":8,"bluebird":77}],8:[function(require,module,exports){
var object = require('../util/object');

var SubEvent = function(context, event) {
    this.context = context;
    this.event = event;
}

SubEvent.prototype.getSubType = function(type) {
    return this.context+':'+type;
}

SubEvent.prototype.listen = function(type, handler, module) {
    //TODO: implement bubble
    this.event.listen(this.getSubType(type), handler, module);
};

SubEvent.prototype.unlisten = function(type, func) {
    this.event.unlisten(this.getSubType(type), func);
};

SubEvent.prototype.trigger = function(type, data, rootEvt, preventBubble) {
    this.event.trigger(this.getSubType(type), data, rootEvt);
    if(!preventBubble) {
        this.event.trigger(type, data, rootEvt);
    }
};

SubEvent.prototype.command = function(command, execute) {
    this.event.command(command, execute);
};

SubEvent.prototype.on = function(node, event, selector, data, handler) {
    this.event.on(node, event, selector, data, handler);
};

SubEvent.prototype.off = function(node, event, selector, handler) {
    this.event.off(node, event, selector, handler);
};

SubEvent.prototype.once = function(node, event, selector, data, handler) {
    this.event.once(node, event, selector, data, handler);
};

SubEvent.prototype.triggerDom = function(node, event) {
    this.event.triggerDom(node,event);
}

SubEvent.prototype.sub = function(context) {
    return new SubEvent(context, this);
}

module.exports = SubEvent;
},{"../util/object":73}],9:[function(require,module,exports){
var object = require('../util/object');
var util = require('../util/util');
var app = require('../util/app');
var dom = require('../dom/dom');
var Transform = require('../svg/transform');

var Eventable = require('./eventable');

var DEFAULT_OPACITY = 0.5;
var DEFAULT_KNOB_RADIUS = 5;

var Knob = function(diagram, p, cfg, group) {
    this.diagram = diagram;
    this.event = diagram.event;
    this.group = group;
    this.init(p, cfg);
};

util.inherits(Knob, Eventable);

Knob.prototype.clearRelativeOrientation = function() {
    delete this.relativePosition;
};

Knob.prototype.isSelected = function() {
    return this.node.selected;
};

Knob.prototype.relativeOrientation = function(position) {
    if(position) {
        this.relativePosition = {
            x : position.x,
            y : position.y
        };
    }
    return this.relativePosition;
};

Knob.prototype.init = function(position, cfg) {
    this.config = object.extend({radius : DEFAULT_KNOB_RADIUS}, cfg);
    this.node = this.diagram.createKnobNode(position, this.group, this.config);
    this.eventBase = this.node.eventBase;
    this.config = this.node.config;
    this.root = this.node.root;
    this.node.knob = this;

    var that = this;
    var select = cfg.select || function() {
            that.activeStyle();
        };

    var deselect = cfg.deselect || function() {
            that.inactiveStyle();
        };


    this.on('select', select).on('deselect', deselect);
    this.event.trigger('knob_added', this);
};

Knob.prototype.x = function() {
    return this.node.x();
};

Knob.prototype.y = function() {
    return this.node.y();
};

Knob.prototype.position = function() {
    return this.node.getCenter();
};

Knob.prototype.draggable = function(handler) {
    this.node.draggable(handler);
    this.triggerDrag = function(dx,dy) {
        this.node.triggerDrag(dx,dy);
    };
    return this;
};

Knob.prototype.initDrag = function() {
    this.node.initDrag();
};

Knob.prototype.hide = function() {
    this.node.root.hide();
    this.node.root.attr('r', 0); //TODO: perhaps not wanted for all knob types.
};

Knob.prototype.show = function(opacity) {
    opacity = opacity || this.config['fill-opcaity'] || 1;
    this.node.root.show(DEFAULT_OPACITY);
    this.node.root.attr('r', this.config['radius']);
};

Knob.prototype.select = function() {
    this.selected = true;
    this.node.trigger('select');
    return this;
};

Knob.prototype.deselect = function() {
    this.selected = false;
    this.node.trigger('deselect');
    return this;
};

Knob.prototype.fill = function(color) {
    this.node.root.fill(color);
};

Knob.prototype.stroke = function(color) {
    this.node.root.stroke(color);
    this.node.root.strokeWidth(1);
};

Knob.prototype.activeStyle = function() {
    this.fill(this.config['fill-active']);
    this.show();
};

Knob.prototype.deselect = function() {
    this.inactiveStyle();
    return this;
};

Knob.prototype.inactiveStyle = function() {
    this.fill(this.config['fill']);
    this.show();
};

Knob.prototype.hoverable = function(handler) {
    var that = this;
    this.node.root.hoverable(handler);
    return this;
};

Knob.prototype.remove = function() {
    this.node.trigger('remove');
};

Knob.prototype.move = function(dx,dy) {
    this.node.root.move(dx,dy);
    this.node.trigger('move', [dx,dy]);
};

Knob.prototype.moveTo = function(x,y) {
    this.node.root.moveTo(x,y);
    this.node.trigger('moveTo', [x,y]);
};

Knob.prototype.toString = function() {
    return '('+this.x()+'/'+this.y()+')';
};

module.exports = Knob;
},{"../dom/dom":45,"../svg/transform":65,"../util/app":70,"../util/object":73,"../util/util":75,"./eventable":22}],10:[function(require,module,exports){
var dom = require('../dom/dom');
var object = require('../util/object');
var EditPanel = require('../ui/editPanel');

var editPanel = new EditPanel();

var AbstractEditAddition = function(editable, editFunctions, config) {
    this.editable = editable;
    this.editFunctions = editFunctions;
    this.config = config;
    this.initEditTrigger();
};

AbstractEditAddition.prototype.initEditTrigger = function() {
    var that = this;
    object.each(this.config, function(key, editItem) {
        if(object.isDefined(editItem.trigger)) {
            that.addEditTextTrigger(key);
        }
    });
};

AbstractEditAddition.prototype.addEditTrigger = function(key) {
    switch(type) {
        case 'text':
        case 'textarea':
            this.addEditTextTrigger(key);
            break;
    }
};

AbstractEditAddition.prototype.addEditTextTrigger = function(key) {
    var editItem = this.getEditItem(key);
    var that = this;

    var selector = this.editable.selector(editItem.trigger);
    $(selector).css('cursor', 'pointer');

    //TODO: evtl move this to text.editable();
    this.editable.root.$().on('click', selector,  function(evt) {
        if(that.isTriggerAllowed()) {
            switch(editItem.type) {
                case 'textarea':
                    editPanel.createTextAreaEdit(evt.pageX, evt.pageY,
                        function() {
                            return that.getValue(key).trim();
                        },
                        function(value) {
                            that.setValue(key, value);
                        });
                    break;
                case 'text':
                    editPanel.createTextEdit(evt.pageX, evt.pageY, function() {
                            return that.getValue(key).trim();
                        },
                        function(value) {
                            that.setValue(key, value);
                        });
                    break;
            }
        }
    });
};

AbstractEditAddition.prototype.getValue = function(key) {
    var editItem = this.getEditItem(key);
    var editFunction = this.editFunctions[editItem.type];
    if(editFunction && !object.isString(editFunction)) {
        return this.editFunctions[editItem.type].get.call(this, editItem, key);
    } else if(editFunction && object.isString(editFunction)) {
        return this.editable.getInnerSVG(editItem.bind)[editFunction]();
    }
};

AbstractEditAddition.prototype.setValue = function(key, value) {
    var editItem = this.getEditItem(key);
    var oldValue = this.getValue(key);
    var editFunction = this.editFunctions[editItem.type];
    if(editFunction && !object.isString(editFunction)) {
        this.editFunctions[editItem.type].set.call(this, editItem, value);
        this.onSetValue(editItem, value);
    } else if(editFunction && object.isString(editFunction)) {
        this.editable.getInnerSVG(editItem.bind)[editFunction](value);
        this.onSetValue(editItem, value);
    }

    if(this.editable.exec) {
        this.editable.exec('edit', [key, value, oldValue]);
    }
};

/**
 * This method either returns a clone of the editItem for normal keys like 'title', or
 * creates a new editItem out of a combined key like 'title_text-size' with key title and type text-size
 */
AbstractEditAddition.prototype.getEditItem = function(key) {
    var type;
    var editItem;
    if(key.indexOf('_') > -1) {
        var splitted = key.split('_');
        editItem = object.cloneObject(this.config[splitted[0]]);
        editItem.type = splitted[1];
    } else {
        editItem = this.config[key];
    }
    return editItem;
};

AbstractEditAddition.prototype.isTriggerAllowed = function() {
    return !this.lastSelect || (Date.now() - this.lastSelect > 200);
};

AbstractEditAddition.prototype.setTextAreaContent = function($textAreaNode, txtAreaContent) {
    this.editable.diagram.svg.get($textAreaNode).content(txtAreaContent);
};

AbstractEditAddition.prototype.getTextAreaContent = function($textAreaNode) {
    return this.editable.diagram.svg.get($textAreaNode).content();
};

AbstractEditAddition.prototype.deselect = function() {
    this.remove();
};

AbstractEditAddition.prototype.select = function() {
    this.lastSelect = Date.now();
};

AbstractEditAddition.prototype.remove = function() {
    editPanel.close();
};

AbstractEditAddition.prototype.update = function() {
    this.remove();
};

AbstractEditAddition.prototype.activate = function() {
    this.remove();
};

AbstractEditAddition.prototype.onSetValue = function(editItem, value) { };

module.exports = AbstractEditAddition;
},{"../dom/dom":45,"../ui/editPanel":67,"../util/object":73}],11:[function(require,module,exports){
var util = require('../util/util');
var event = require('../core/event');
var Command = require('../core/command');

var Manager = function(diagram) {
    this.diagram = diagram;
    this.event = diagram.event;
};

Manager.prototype.command = function(cmdId, doAction, undoAction) {
    this.diagram.registerCommand(cmdId, new Command(this, doAction, undoAction));
};

Manager.prototype.exec = function(cmdId, doArgs, undoArgs) {
    return this.diagram.executeCommand(cmdId, doArgs, undoArgs);
};

Manager.prototype.addCmd = function(cmdId, doArgs, undoArgs) {
    this.diagram.addCommand(cmdId, doArgs, undoArgs);
};

Manager.prototype.listen = function(eventId, handler) {
    this.event.listen(eventId, handler, this);
};

Manager.prototype.getNodeById = function(id) {
    return this.diagram.getNodeById(id);
};

Manager.prototype.getTransitionById = function(id) {
    return this.diagram.getTransitionById(id);
};

Manager.prototype.getSVG = function(id) {
    return $.svg(id);
};

Manager.prototype.getNodeMgr = function(command) {
    return this.diagram.nodeMgr;
};

Manager.prototype.getTransitionMgr = function(command) {
    return this.diagram.transitionMgr;
};

Manager.prototype.getSelectionMgr = function(command) {
    return this.diagram.selectionMgr;
};

module.exports = Manager;
},{"../core/command":4,"../core/event":7,"../util/util":75}],12:[function(require,module,exports){
var PathData = require('../svg/pathData');
var object = require('../util/object');

var AbstractPathManager = function(transition) {
    this.transition = transition;
};

AbstractPathManager.prototype.activate = function() {
    this.path =  this.transition.getLine().d();
    return this;
};

AbstractPathManager.prototype.fromString = function(pathDataStr) {
    this.path = new PathData().loadFromString(pathDataStr);
};

AbstractPathManager.prototype.dragLine = function(position) {
    // Init path if no path was created yet
    if(!this.path) {
        this.init(position)
    }

    // Create full path if the path only consist of the start path part yet or update the end position of the path
    if(this.path.length() === 1) {
        this.create(position);
    } else {
        this.path.end(position);
    }

    this.update();
};

AbstractPathManager.prototype.init = function(position) {
    this.path = new PathData().start(position);
};

AbstractPathManager.prototype.updatePart = function(index, position) {
    this.path.setTo(index, position);
    this.update();
};

AbstractPathManager.prototype.addPathPart = function(index, position) {
    if(!this.path) {
        this.init(position);
    } else {
        this.add(index,position);
        this.update();
    }
};

AbstractPathManager.prototype.removePathPart = function(index) {
    if(this.path) {
        this.path.removePath(index);
    }
};

AbstractPathManager.prototype.replace = function(old, positions) {
    this.buildPath(positions);

    //We set our created path data to the existing path, since the transition line and linearea are dependent on this path instance
    old.path.data = this.path.data;
    this.path = old.path;

    this.transition.pathManager = this;
    return this;
};

AbstractPathManager.prototype.buildPath = function(positions) {
    this.init(positions[0]);

    for(var i  = 1; i < positions.length; i++) {
        this.add(i, positions[i]);
    }

    this.update();
};

AbstractPathManager.prototype.getNearestPoint = function(position) {
    return this.path.getNearestPoint(position);
};

AbstractPathManager.prototype.getIndexForPosition = function(position) {
    return this.path.getPathIndexForPosition(position);
};

AbstractPathManager.prototype.create = function(position) {/*Abstract*/};
AbstractPathManager.prototype.update = function(position) {/*Abstract*/};
AbstractPathManager.prototype.add = function(index, position) {/*Abstract*/};

module.exports = AbstractPathManager;
},{"../svg/pathData":57,"../util/object":73}],13:[function(require,module,exports){
var additions = {};
var event = require('../core/event');

var AdditionFactory = function() {
    this.additions = {};
};

AdditionFactory.prototype.register = function(key, addition) {
    this.additions[key] = addition;
};

AdditionFactory.prototype.initAddition = function(key, host) {
    if (!host.additions) {
        host.additions = {};
    }

    var addition = this.additions[key];

    if(addition && host && _checkConfigRequirement(addition, host, key)) {
        host.additions[key] = new addition(host);
    } else if(!addition){
        event.trigger('warn', 'Tried to initiate an unknown addition '+key+' some functionality may not available.');
    }
};

var nodeAdditions = new AdditionFactory();
var transitionAdditions = new AdditionFactory();

var _checkConfigRequirement = function(addition, host, key) {
    return !addition.requireConfig || (addition.requireConfig && (host.config && host.config[key]));
};

module.exports = {
    registerNodeAddition : function(key, addition) {nodeAdditions.register(key,addition)},
    initNodeAddition : function(key, host) {nodeAdditions.initAddition(key, host)},
    registerTransitionAddition : function(key, addition) {transitionAdditions.register(key,addition)},
    initTransitionAddition : function(key, host) {transitionAdditions.initAddition(key, host)}
};
},{"../core/event":7}],14:[function(require,module,exports){
var Promise = require('bluebird');

var DiagramAPI = function(diagram) {
    this.diagram = diagram;
};

DiagramAPI.prototype.createNode = function(tmplId, position) {
    var that = this;
    return new Promise(function(resolve, reject) {
        that.loadTemplate(tmplId)
            .then(function(template) {
                resolve(that.diagram.nodeMgr.createNodeCommand(template, position));
            }, function(err) {
                reject(err);
            });
    });

};

DiagramAPI.prototype.getSelectedTransition = function(tmpl, position) {
    return this.diagram.selectionMgr.selectedTransition;
};

DiagramAPI.prototype.loadTemplate = function(tmpl) {
    var that = this;
    return new Promise(function(resolve, reject) {
        that.diagram.templateMgr.getTemplate(tmpl)
            .then(function(template) {
                resolve(template);
            }, function(err) {
                reject(err);
            });
    });
};

DiagramAPI.prototype.getSelectedNodes = function(tmpl, position) {
    return this.diagram.selectionMgr.getSelectedNodes();
};

DiagramAPI.prototype.getNodeById = function(id) {
    return this.diagram.nodeMgr.getNode(id);
};

DiagramAPI.prototype.createTransition = function(node1, node2) {
    return node1.additions.transition.startNewTransition(node2);
};

DiagramAPI.prototype.getTransitionById = function(id) {
    return this.diagram.transitionMgr.getTransition(id);
};

module.exports = DiagramAPI;
},{"bluebird":77}],15:[function(require,module,exports){
var AbstractPathManager = require('./abstractPathManager');
var util = require('../util/util');

var CurvedPathManager = function(transition) {
    AbstractPathManager.call(this, transition);
    this.type = CurvedPathManager.type;
};

util.inherits(CurvedPathManager, AbstractPathManager);

CurvedPathManager.type = 'curved';

CurvedPathManager.prototype.create = function(position) {
    //Control points are calculated by calling update
    this.path.cBezier(undefined, undefined, position);
};

CurvedPathManager.prototype.add = function(index, position) {
    this.path.insertCBezier(index,undefined, undefined, position);
};

CurvedPathManager.prototype.update = function() {
    this.path.smoothen();
};

module.exports = CurvedPathManager;

},{"../util/util":75,"./abstractPathManager":12}],16:[function(require,module,exports){
/**
 * This class represents an instance of a diagram and is responsible for initializing and
 * building the stage. Furthermore it contains diagram related utility functionality.
 *
 * An instance of this class offers the access to all nodes/transitions and templates of the
 * diagram.
 *
 * This class is designed to be able to manage multiple diagrams within one
 * application instance.
 */
var util = require('../util/util');
var event = require('../core/event');
var SVG = require('../svg/svg');
var PathData = require('../svg/pathData'); //Rather implement svg.createpath().start().line()...
var templateManager = require('./templateManager').init();
var commandManager = require('../core/commandManager');
var SelectionManager = require('./selectionManager');
var NodeManager = require('./nodeManager');
var TransitionManager = require('./transitionManager');
var DiagramAPI = require('./api');

var Eventable = require('./eventable');

var KnobManager = require('./knobManager');
require('./knobTemplate');
var xml = require('../util/xml');

var Promise = require('bluebird');

var Helper = require('./../svg/helper');

var config = require('../core/config');

var object = util.object;
var dom = util.dom;

var CONTAINER_SELECTOR = '#svgStage';
// Contains the parent dom node (div) of the SVG element
var $CONTAINER_NODE = $(CONTAINER_SELECTOR);

/**
 * Constructor for initiating a new diagram instance within the containerID.
 *
 * @param {type} containerID The parent of the new SVG diagram
 * @param {type} cfg
 */
 var Diagram = function(cfg) {
    cfg = cfg || {};

    if(!cfg.id) {
        console.warn('Created diagram without id');
    }

    this.uniqueIds = [];

    this.id = cfg.id || 'not specified';
    this.projectId = cfg.projectId || 'default';
    this.title = cfg.title || 'new';

    //Diagram intern event context
    this.event = event.sub(this.id);

    if(cfg.container) {
        this.$container = $(cfg.container);
    } else {
        this.$container = $CONTAINER_NODE;
    }

    // Build the SVG stage within the container
    this.svg = new SVG(this.$container.attr('id'), this.ns());
    this.eventBase = this.svg.root;

    var that = this;
    this.commandMgr = commandManager.sub(this.id, function(cmd) {
        that.triggerUpdate();
    });

    // Handles the loading and creation of templates
    this.templateMgr = templateManager;
    // This helper class manages the selection of nodes/transitions
    this.selectionMgr = new SelectionManager(this);
    // Responsible for creating and maintaining nodes
    this.nodeMgr = new NodeManager(this);
    // Responsible for creating and maintaining transitions
    this.transitionMgr = new TransitionManager(this);
    // Responsible for tracking and accessing all dockings on the diagram
    this.knobMgr = new KnobManager(this);

    // Init stage related and key events
    this.initEvents();

    this.scale = 1;

    var that = this;
    this.initDefs()
        .then(function() {
            that.initialized = true;
            that.mainPart = that.svg.createPart('main', true);
            that.helper = that.svg.helper();
            that.trigger('initialized');
        }, function(err) {
            console.error('Could not load defs initialisation failed!');
        });
};

Diagram.prototype = {
    get api () {
        if(!this._api) {
            this._api = new DiagramAPI(this);
        }
        return this._api;
    }
};

util.inherits(Diagram, Eventable);

Diagram.prototype.ns = function() {
    return {"xmlns:dala" : "http://www.dala.com"};
};

Diagram.prototype.getRootSVG = function() {
    return this.svg.root;
};

Diagram.prototype.triggerUpdate = function() {
    this.trigger('diagram_updated', this.id);
};

Diagram.prototype.getNodes = function(filter) {
    return this.nodeMgr.getNodes(filter);
};

Diagram.prototype.trigger = function(evt, args) {
    //perhaps also listen to diagram intern events not only dom events.
    this.svg.root.trigger(evt, args);
    this.event.trigger(event, args);
};

/*
 * Initializes Stage Mouse and Key events.
 */
Diagram.prototype.initEvents = function() {
    var that = this;
    // Double clicks on the stage area will create new nodes of the selected
    // template type. Only if we do not dbclick another node in this case
    // we start a transition drag.
    this.on('dblclick', function(evt) {
        if (!that.selectionMgr.isElementHover()) {
            that.event.trigger('node_create', that.templateMgr.getSelectedTemplate(), evt);
        }
    });

    this.on('mousedown', function(evt) {
        var startPosition = that.getStagePosition(evt);

        if(evt.ctrlKey || config.is('diagram_mode_move', false)) {
            //Move main part
            that.mainPart.draggable({
                once: true,
                cursor: 'all-scroll',
                dragMove: function(event, dx, dy) {
                    that.event.trigger('viewport_update', this.position());
                },
                dragEnd: function(event) {
                    that.event.trigger('viewport_updated', this.position());
                },
                restrictionX: function(event, dx, dy) {
                  return (this.x() + dx <= 0)? dx : 0;
                },
                restrictionY: function(event, dx, dy) {
                    return (this.y() + dy <= 0)? dy : 0;
                },
                getScale: function() {
                    return that.scale;
                }
            });
            that.mainPart.trigger('mousedown');;
        } else {
            that.selectionMgr.dragSelectionStart(evt, startPosition);
        }

    });

    this.on('mouseup', function() {
        that.selectionMgr.dragSelectionEnd();
    });

    event.on(document, "dragstart", function(e) {
        if (e.target.nodeName.toUpperCase() === "POLYLINE" || e.target.nodeName.toUpperCase() === 'PATH' || e.target.nodeName.toUpperCase() === 'CIRCLE') {
            e.preventDefault();
            return false;
        }
    });
};

Diagram.prototype.part = function(id) {
    return this.svg.part(id);
};

Diagram.prototype.import = function(svg, part, prepend) {
    return this.svg.import(svg, part, prepend);
};

Diagram.prototype.part = function(id) {
    return this.svg.part(id);
};

Diagram.prototype.initDefs = function() {
    var that = this;
    return new Promise(function(resolve, reject) {
        that.templateMgr.getTemplate('defs_marker')
            .then(function (tmpl) {
                if (tmpl) {
                    tmpl.createNode({diagramId: that.id}, that).init('root', true);
                    resolve();
                } else {
                    reject('Could initialize defs template result undefined');
                }
            }, function (err) {
                reject(err);
            });
    });
};

Diagram.prototype.createKnobNode = function(p, group, cfg) {
    return this.knobMgr.createKnobNode(p, group, cfg);
};

Diagram.prototype.uniqueId = function() {
    var newId = this.checkId(Date.now() + '');
    this.uniqueIds.push(newId);
    return newId;
};

/**
 * Prevent duplicates
 */
Diagram.prototype.checkId = function(id) {
    return ($.inArray(id, this.uniqueIds) > -1) ? this.checkId('u'+id) : id;
};

Diagram.prototype.getHoverNode = function() {
    return this.nodeMgr.hoverNode;
};

Diagram.prototype.isMultiSelection = function() {
    return this.selectionMgr.isMultiSelection();
};

Diagram.prototype.isPoint = function(value) {
    return object.isDefined(value.x);
};

Diagram.prototype.newDiagram = function() {
    //TODO: we should unify this with the constructor svg creation technique
    this.loadDiagram('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="svgStage_svg" xmlns:dala="http://www.dala.com" height="100%" width="100%"></svg>');
    this.initDefs();
};

Diagram.prototype.loadDiagram = function(svgString) {
    //TODO: rather handle this per event
    this.selectionMgr.clear();
    this.nodeMgr.clear();
    this.$container.empty();
    this.svg.setRoot(dom.importSVG(this.svg.$container, svgString));
    this.activateNodes();
    this.activateTransitions();
    this.initEvents();
};

Diagram.prototype.triggerDockingVisibility = function() {
    if(this.knobMgr.hideDocking) {
        this.knobMgr.showKnobs();
    } else {
        this.knobMgr.hideKnobs();
    }
};

Diagram.prototype.activateNodes = function() {
    var that = this;
    $('.element_root').each(function() {
        this.nodeMgr.activateNode(this);
    });
};

//TODO: move to transitionmgr
Diagram.prototype.activateTransitions = function() {
    this.transitionMgr.activateTransition($('.transition'));
};

Diagram.prototype.getNodeById = function(nodeId) {
    return this.nodeMgr.getNode(nodeId);
};

Diagram.prototype.getTransitionById = function(id) {
    return this.transitionMgr.getNode(id);
};

Diagram.prototype.zoomIn = function() {
    this.scale += 0.1;
    this.part('main').scale(this.scale);
};

Diagram.prototype.zoomOut = function() {
    if(this.scale > 0) {
        this.scale -= 0.1;
        this.part('main').scale(this.scale);
    }
};

/**
 * This method determines the relative stage coordinates for a given
 * window position either by providing the x and y position or an event
 * object with given pageX and pageY attributes or an point with x,y attributes.
 *
 * @param {type} x either an event object with pageX, pageY or an point with x,y
 *                 or just the plain x coordinate.
 * @param {type} y the y coordinate is just mandatory if the fisrst arg is the plain x
 * @returns {Diagram_L13.Diagram.prototype.getStagePosition.DiagramAnonym$2}
 */
Diagram.prototype.getStagePosition = function(x, y) {
    if(object.isDefined(x.pageX)) {
        y = x.pageY;
        x = x.pageX;
    } else if(object.isDefined(x.x)) {
        y = x.y;
        x = x.x;
    }

    var stagePosition = this.$container.offset();
    var viewPointAlignment = this.mainPart.position();

    //TODO: viewbox alignement ?
    return {
        x : parseInt((x  - stagePosition.left - viewPointAlignment.x) / this.scale),
        y : parseInt((y  - stagePosition.top - viewPointAlignment.y) / this.scale)
    };
};

/**
 * Checks if a given position is within the boundaries of a diagram node.
 * TODO: either return all overlay nodes or just the one with the biggest index...
 * @param {type} position
 * @returns {Boolean}
 */
Diagram.prototype.getNodeByPosition = function(position) {
    var result;
    object.each(this.nodeMgr.nodes, function() {
        if (this.overlays(position)) {
            result = this;
            return false;
        }
    });

    return result;
};

Diagram.prototype.asString = function() {
    return this.svg.asString();
};

Diagram.prototype.undoCommand = function() {
    this.commandMgr.undo();
};

Diagram.prototype.redoCommand = function() {
    this.commandMgr.redo();
};

Diagram.prototype.registerCommand = function(cmdId, cmd) {
    this.commandMgr.register(cmdId, cmd);
};

Diagram.prototype.executeCommand = function(cmdId, doArgs, undoArgs) {
    return this.commandMgr.exec(cmdId, doArgs, undoArgs);
};

Diagram.prototype.addCommand = function(cmdId, doArgs, undoArgs) {
    this.commandMgr.add(cmdId, doArgs, undoArgs);
};

module.exports = Diagram;


},{"../core/commandManager":5,"../core/config":6,"../core/event":7,"../svg/pathData":57,"../svg/svg":60,"../util/util":75,"../util/xml":76,"./../svg/helper":55,"./api":14,"./eventable":22,"./knobManager":25,"./knobTemplate":26,"./nodeManager":29,"./selectionManager":34,"./templateManager":37,"./transitionManager":43,"bluebird":77}],17:[function(require,module,exports){
/**
 * This utility module provies build-in docking techniques for transitions and other
 * dockable elements. The docking type can be configured within the template
 * with the config key "dockingType".
 *
 * Example:
 *  <config>
 *      {
 *          "nodeID" : "eer_entityDefault",
 *          "docking" : {type: 'RECT', orientation:'center', ...}
 *          ...
 *      }
 * </config>
 */

var util = require('../util/util');
var dom = util.dom;
var math = util.math;

var checkOrientationBoundary = function(node, p) {
    var dockingType = (node.config.docking && node.config.docking.type) ? node.config.docking.type : 'RECT';
    switch(dockingType.toUpperCase()) {
        case 'CENTER':
            return false;
        case 'CIRCLE':
            return CIRCLE_BOUNDARY.call(node, p);
        case 'ELLIPSE':
            return ELLIPSE_BOUNDARY.call(node, p);
        case 'SQUARE':
        case 'RECT':
            return RECT_BOUNDARY.call(node, p);
    };
};

var calculateDockingPosition = function(node, orientationOut, orientationIn) {
    var dockingType = (node.config.docking && node.config.docking.type) ? node.config.docking.type : 'RECT';
    var result;
    switch(dockingType.toUpperCase()) {
        case 'SIMPLE':
            result = SIMPLE.call(node, orientationOut, orientationIn);
            break;
        case 'CENTER':
            result = CENTER.call(node, orientationOut, orientationIn);
            break;
        case 'CIRCLE':
            result = CIRCLE.call(node, orientationOut, orientationIn);
            break;
        case 'ELLIPSE':
            result = ELLIPSE.call(node, orientationOut, orientationIn);
            break;
        case 'SQUARE':
        case 'RECT':
            result = RECT.call(node,orientationOut, orientationIn);
            break;
        case 'FREE':
            result = FREE.call(node,orientationOut, orientationIn);
            break;
        default:
            result = CENTER.call(node, orientationOut, orientationIn);
            break;

    };

    var rotation = node.root.rotate();
    if(rotation) {
        result = math.rotate(result, node.position(), rotation);
    }

    return result;
};

var FREE = function(position , orientationIn) {
    return orientationIn;
};

var ELLIPSE = function(position , orientationIn) {
    var rx = this.width() / 2;
    var ry = this.height() / 2;
    var ellipse = new math.Ellipse(this.getCenter(), rx, ry);
    var result = ellipse.calcLineIntercept(position, orientationIn);
    return (result.length > 0)?result[0]:orientationIn;

};

var ELLIPSE_BOUNDARY = function(position) {
    var rx = this.width() / 2;
    var ry = this.height() / 2;
    return new math.Ellipse(this.getCenter(), rx, ry).overlays(position);
};

var CIRCLE = function(position, orientationIn) {
    //Note the stroke is not included in some browsers...
    var radius = this.width() / 2;
    var circle = new math.Circle(this.getCenter(), radius);
    var result = circle.calcLineIntercept(position, orientationIn);

    return (result.length > 0)?result[0]:orientationIn;
};

var CIRCLE_BOUNDARY = function(position) {
    var center = this.getCenter();
    var radius = this.width() / 2;
    return new math.Circle(this.getCenter(), radius).overlays(position);
};

/**
 * This technique uses the center of the node as orientation point and
 * returns the intersection of the node boundary and the line from the outer
 * orientation point to the center of the node as result.
 *
 * __________
 * |        |
 * |        |
 * |    x   |<----------------x
 * |        |
 * |        |
 * ----------
 *
 * @param {type} position the outer orientation point
 * @returns {DockingType_L20@call;getCenter}
 */
var RECT = function(position, orientation) {
    if(this.overlays(position)) {
        return orientation;
    }

    var transition = new math.Line(position, orientation);

    if(this.isRightOf(position)) {
        var result = transition.calcFX(this.x());
        if(this.overlays(result)) {
            return result;
        }
    }

    if(this.isLeftOf(position)) {
        var result = transition.calcFX(this.getRightX());
        if(this.overlays(result)) {
            return result;
        }
    }

    if(this.isOver(position)) {
        var bottomY = this.getBottomY();

        if(transition.isVertical()) {
            return {x: orientation.x, y: bottomY};
        }

        if(orientation.x === position.x) {
            return {x:orientation.x, y:bottomY};
        }
        var bottomLine = new math.Line({x:1,y:bottomY}, {x:2,y:bottomY});
        var result = transition.calcLineIntercept(bottomLine);
        //We explicitly set this because of possible calculation deviations
        result.y = bottomY;
        return result;
    } else {
        if(transition.isHorizontal()) {
            return {x:orientation.x, y: this.y()};
        }

        if(orientation.x === position.x) {
            return {x:orientation.x, y:this.y()};
        }
        var topLine = new math.Line({x:1,y:this.y()}, {x:2,y:this.y()});
        var result = transition.calcLineIntercept(topLine);
        //We explicitly set this because of possible calculation deviations
        result.y = this.y();

        return result;
    }
};

var RECT_BOUNDARY = function(p) {
    return this.overl
};

/**
 * This technique just returns the center of the node as result.
 * Note that line will start or end within the node.
 *
 * @param {type} position
 * @returns {DockingType_L20.CENTER@call;getCenter}
 */
var CENTER = function(position) {
    return this.getCenter();
};

/**
 * This technique provides 4 different docking points (top/right/bottom/left)
 * and returns the most suitable docking point for the given outer position.
 *
 * @param {type} position
 */
var SIMPLE = function(position, orientationIn) {
    //The position is within the node
    if(this.overlays(position)) {
        return orientationIn;
    }

    if(this.isLeftOf(position)) {
        return {
            x: this.getRightX(),
            y: orientationIn.y
        };
    } else if(this.isRightOf(position)) {
        return {
            x: this.root.x(),
            y: orientationIn.y
        };
    } else if(this.isOver(position)) {
        return {
            x: orientationIn.x,
            y: this.getBottomY()
        };
    } else if(this.isUnder(position)) {
        return {
            x: orientationIn.x,
            y: this.root.y()
        };
    } else {
        //The position is not outside of the element itself
    }
};

module.exports = {
    CENTER : CENTER ,
    SIMPLE : SIMPLE ,
    DEFAULT : CENTER,
    calculateDockingPosition : calculateDockingPosition,
    checkOrientationBoundary : checkOrientationBoundary
};
},{"../util/util":75}],18:[function(require,module,exports){
var util = require('../util/util');
var config = require('../core/config');

var object = util.object;
var DEF_TOLERANCE = 10;

var Alignment = function(tolerance, dimension) {
    this.dimension = dimension;
    this.tolerance = tolerance;
    this.actualD = 0;
};

Alignment.prototype.check = function(source, sourceIndexArr,target, d) {
    if(this.checkRange(source, target, d)) {
        // We keep the source position for the realignment
        if(!this.wasAligned) {
            this.source = source;
            this.sourceIndex = sourceIndexArr;
        }
        // Calculate d between target and source before drag
        this.d = (target[this.dimension] - (source[this.dimension]));
        this.target = target;
        // Keep track of the actual drag while beeing aligned for the realign
        this.actualD += d;
    }
};

Alignment.prototype.checkRange = function(source, target, d) {
    //Check if the difference between source (after drag) and target is within the tolerane
    return util.math.checkRangeDiff(target[this.dimension], (source[this.dimension] + this.actualD + d), this.tolerance);
};

Alignment.prototype.realign = function(alignConfig, d) {
    // We just have to calculate the realignment if an alignment was set
    var result;
    if(this.wasAligned) {
        //Now we retrieve the current position of the aligned source by our sourceIndex
        var currentSourcePosition = alignConfig[this.sourceIndex[0]].source[this.sourceIndex[1]];
        result = (this.source[this.dimension] + this.actualD + d) - currentSourcePosition[this.dimension];
    } else {
        result = d;

    }
    this.actualD = 0;
    return result;
};

Alignment.prototype.reset = function(initialize) {
    if(!initialize) {
        this.wasAligned = this.isAligned();
    } else {
        this.wasAligned = false;
    }

    delete this.target;
    delete this.d;
};

Alignment.prototype.isAligned = function() {
    return object.isDefined(this.target);
};

var DragAlignment = function(diagram, getConfig, tolerance) {
    this.diagram = diagram;
    this.tolerance = tolerance || DEF_TOLERANCE;
    this.getConfig = getConfig;
    this.alignX = new Alignment(this.tolerance, 'x');
    this.alignY = new Alignment(this.tolerance, 'y');
    this.actualDrag = {x:0, y:0};
};

DragAlignment.prototype.check = function(dx, dy) {
    var result;
    if(config.is('dragAlign', true) && !this.diagram.isMultiSelection()) {
        var that = this;

        // Reset the alignments to notify a new search loop
        this.alignX.reset();
        this.alignY.reset();

        var alignmentConfig = this.getConfig(dx, dy);
        object.each(alignmentConfig, function(configIndex, value) {
            var sourceArr = value.source;
            var targetArr = value.target;
            object.each(sourceArr, function(sourceIndex, value) {
                that.checkAlignment(value, targetArr, [configIndex, sourceIndex], dx, dy);

                if(that.alignX.isAligned() && that.alignY.isAligned()) {
                    return false; //Escape the each loop since we found both alingments
                }
            })
        });

        result = {
            dx : (this.alignX.isAligned()) ? this.alignX.d : this.alignX.realign(alignmentConfig, dx),
            dy : (this.alignY.isAligned()) ? this.alignY.d : this.alignY.realign(alignmentConfig, dy)
        };
    } else {
        this.alignX.reset(true);
        this.alignY.reset(true);
        result = {dx : dx, dy : dy};
    }

    return result;
};

DragAlignment.prototype.checkAlignment = function(source, targets, sourceIndexArr, dx, dy) {
    var that = this;
    object.each(targets, function(index, target) {
        if(!that.alignX.isAligned()) {
            that.alignX.check(source,sourceIndexArr, target, dx);
        }

        if(!that.alignY.isAligned()) {
            that.alignY.check(source,sourceIndexArr, target, dy);
        }

        if(that.alignX.isAligned() && that.alignY.isAligned()) {
            return false; //Escape the each loop since we found both alingments
        }
    });
}

DragAlignment.prototype.reset = function() {
    this.alignX.reset(true);
    this.alignY.reset(true);
};

DragAlignment.prototype.isAligned = function() {
    return this.alignX.isAligned || this.alignY.isAligned();
};

module.exports = DragAlignment;


},{"../core/config":6,"../util/util":75}],19:[function(require,module,exports){
require('../svg/draggable');
var util = require('../util/util');
var DragAlignment = require('./dragAlignment');
var Node = require('./node');

var dom = util.dom;
var object = util.object;

var lastDrag;

var DragContext = function(node, cfg) {
    this.cfg = cfg || {};
    this.node = node;
    this.dxSum = 0;
    this.dySum = 0;
};

DragContext.prototype.dragStart = function(evt) {
    this.dxSum = 0;
    this.dySum = 0;
    this.from = this.node.position();
    delete this.to;
    if(this.cfg.dragStart) {
        this.cfg.dragStart(evt);
    }
};

DragContext.prototype.wasMoved = function(evt) {
    return this.dxSum !== 0 || this.dySum !== 0;
};

DragContext.prototype.dragMove = function(evt, dx, dy) {
    this.dxSum += dx;
    this.dySum += dy;
    if(this.cfg.dragMove) {
        this.cfg.dragMove(evt, dx,dy);
    }
};

DragContext.prototype.dragEnd = function(evt) {
    if(this.dxSum != 0 || this.dySum != 0) {
        this.to = this.node.position();
        if (this.cfg.dragEnd) {
            this.cfg.dragEnd(evt);
        }
    }
};

DragContext.prototype.clone = function() {
    return {
        dxSum : this.dxSum,
        dySum : this.dySum,
        from : this.from,
        to : this.to
    }
};

Node.prototype.draggable = function(cfg) {
    cfg = cfg || {};
    var that = this;
    this.dragContext = new DragContext(this, cfg);

    var dragConfig = {
        cursor: 'all-scroll',
        dragStart: function(evt) {
            that.dragContext.dragStart(evt);
            lastDrag = that.dragContext;
            that.exec('dragStart', [evt]);
        },
        dragMove : function(evt, dx , dy) {
            that.dragContext.dragMove(evt, dx, dy);
            //that.exec('dragMove', [dx,dy, evt]);
            //We skip the the domEvent dragMove here cause of performance...
            that.exec('dragMove', [dx,dy, evt], true);

        },
        dragEnd : function(evt) {
            if(that.dragContext.wasMoved()) {
                that.dragContext.dragEnd(evt);
                that.exec('dragEnd', [evt]);
            }
        },
        getScale: function() {
            return that.diagram.scale;
        },
        restrictionX : cfg.restrictionX,
        restrictionY : cfg.restrictionY,
        cursor : cfg.cursor
    };

    if(!cfg.preventAlignment) {
        var dragAlignment;
        if(cfg.dragAlignment) {
            dragAlignment = (cfg.dragAlignment instanceof DragAlignment)
                ? cfg.dragAlignment : new DragAlignment(this.diagram, cfg.dragAlignment);
        } else {
            dragAlignment = new DragAlignment(that.diagram,
                function() {
                    var alignments = that.getTransitionAlignmentTargets();
                    alignments.push({source:[that.getCenter()], target:that.getNodeAlignmentTargets()});
                    return alignments;
                });
        }
        dragConfig.dragAlignment = dragAlignment;
    }


    this.root.draggable(dragConfig, this.getDragElement());

    //Simulates an drag start event
    this.initDrag = this.root.initDrag;

    //For manual dragging a svg element the triggerEvent is used to identify this event was triggered manually
    this.triggerDrag = this.root.triggerDrag;

    return this;
};

Node.prototype.getTransitionAlignmentTargets = function() {
    return this.additions.transition.getTransitionAlignmentTargets();
};

Node.prototype.getNodeAlignmentTargets = function() {
    var result = [];
    var that = this;

    object.each(this.diagram.getNodes(), function(key, node) {
        if(node.id !== that.id && !node.knob) {
            result.push(node.getCenter());
        }
    });

    return result;
};

Node.prototype.getDragElement = function() {
    //TODO: we have to use the [class~=bla] selector since ie, edge (who else) throwing errors for .class selectors in jquery
    //this may change in following jqery versions.
    return dom.findIncludeSelf(this.getRootSVG().instance(), '[class~='+this.getNodeSelector('dragRoute_')+']');
};

module.exports = {
    getLastDrag : function() {
        return lastDrag;
    }
}


},{"../svg/draggable":51,"../util/util":75,"./dragAlignment":18,"./node":27}],20:[function(require,module,exports){
var util = require('../util/util');
var AbstractEditAddition = require('./abstractEditAddition');

var editFunctions = {
    stroke : 'stroke',
    'stroke-width' : 'strokeWidth',
    'stroke-dash' : 'strokeDashType',
    color : 'fill',
    text : {
        get : function(editItem) {
            return $(this.node.getNodeSelector(editItem.bind)).text();
        },
        set : function(editItem, value) {
            $(this.node.getNodeSelector(editItem.bind)).text(value);
        }
    },
    textarea : {
        get : function(editItem) {
            return this.getTextAreaContent(this.node.getNodeSelector(editItem.bind));
        },
        set : function(editItem, value) {
            var $editSVGNode = $(this.node.getNodeSelector(editItem.bind));
            this.setTextAreaContent($editSVGNode,value);
        }
    },
    'text-size' : {
        get : function(editItem) {
            var definition = this.node.getInnerSVG(editItem.bind).style('font-size');
            if(definition) {
                return definition.substring(0, definition.length - 2);
            }
        },
        set : function(editItem, value) {
            this.node.getInnerSVG(editItem.bind).style('font-size', value+'px');
        }
    }
};

var EditNodeAddition = function(node) {
    AbstractEditAddition.call(this, node, editFunctions, node.config.edit);
    this.node = node;
};

util.inherits(EditNodeAddition, AbstractEditAddition);

EditNodeAddition.prototype.onSetValue = function() {
    this.node.event.trigger('node_edit', this.node);
};

EditNodeAddition.requireConfig = true;

module.exports = EditNodeAddition;
},{"../util/util":75,"./abstractEditAddition":10}],21:[function(require,module,exports){
var util = require('../util/util');
var AbstractEditAddition = require('./abstractEditAddition');

var EditTransitionAddition = function(transition) {
    AbstractEditAddition.call(this, transition, editFunctions, config);
    this.transition = transition;
};

util.inherits(EditTransitionAddition, AbstractEditAddition );

var editFunctions = {
    stroke : {
        get : function(editItem) {
            return this.transition.line.stroke();
        },
        set : function(binding, value) {
            this.transition.line.stroke(value);
        }
    },
    'stroke-width' : {
        get : function(editItem) {
            return this.transition.strokeWidth();
        },
        set : function(binding, value) {
            this.transition.strokeWidth(value);
        }
    },
    'stroke-dash' : {
        get : function(editItem) {
            return this.transition.line.strokeDashType();
        },
        set : function(editItem, value) {
            this.transition.line.strokeDashType(value);
        }
    },
    text : {
        get : function(editItem) {
            return $(this.transition.getTransitionSelector(editItem.bind)).text();
        },
        set : function(editItem, value) {
            $(this.transition.getTransitionSelector(editItem.bind)).text(value);
        }
    },
    textarea : {
        get : function(editItem) {
            return this.getTextAreaContent(this.transition.getTransitionSelector(editItem.bind));
        },
        set : function(editItem, value) {
            var $editSVGNode = $(this.transition.getTransitionSelector(editItem.bind));
            this.setTextAreaContent($editSVGNode,value);
        }
    },
    'text-size' : {
        get : function(editItem) {
            var definition = this.transition.getInnerSVG(editItem.bind).style('font-size');
            if(definition) {
                return definition.substring(0, definition.length - 2);
            }
        },
        set : function(editItem, value) {
            this.transition.getInnerSVG(editItem.bind).style('font-size', value+'px');
        }
    },
    'type' : {
        get : function(editItem) {
            return this.transition.type();
        },
        set : function(editItem, value) {
            this.transition.type(value);
            this.transition.group.dala('transitionType', value);
        }
    },
    'startMarker' : {
        get : function(editItem) {
            return this.transition.startMarkerValue();
        },
        set : function(editItem, value) {
            value = value || '';
            this.transition.startMarker(value);
        }
    },
    'endMarker' : {
        get : function(editItem) {
            return this.transition.endMarkerValue();
        },
        set : function(editItem, value) {
            value = value || '';
            this.transition.endMarker(value);
        }
    }
};

var config = {
    'text0' : {type : 'text', bind : 'text0', trigger : 'text0'},
    'text1' : {type : 'text', bind : 'text1', trigger : 'text1'},
    'text2' : {type : 'text', bind : 'text2', trigger : 'text2'},
    'text3' : {type : 'text', bind : 'text3', trigger : 'text3'},
    'text4' : {type : 'text', bind : 'text4', trigger : 'text4'},
    'text5' : {type : 'text', bind : 'text5', trigger : 'text5'},
    'type'  : {type : 'type', bind : 'line'},
    'transition' : { type : 'stroke', bind : 'line'},
    'startMarker' : { type : 'startMarker', bind : 'line'},
    'endMarker' : { type : 'endMarker', bind : 'line'}
};

module.exports = EditTransitionAddition;
},{"../util/util":75,"./abstractEditAddition":10}],22:[function(require,module,exports){
var object = require('../util/object');

var Eventable = function(eventBase) {
    this.eventBase = eventBase;
};

Eventable.prototype.exec = function(func, args, prevDomEvent) {
    args = args || this;
    this.executeAddition(func, args);
    if(this.executeTemplateHook) {
        this.executeTemplateHook(func, args);
    }
    if(this.eventBase && !prevDomEvent) {
        this.trigger(func, args);
    }
};

Eventable.prototype.executeAddition = function(func, args) {
    object.each(this.additions, function(key, addition) {
        if(object.isDefined(addition) && object.isFunction(addition[func])) {
            addition[func].apply(addition, args);
        }
    });
};

Eventable.prototype.one = function(evt, handler) {
    if(!this.eventBase) {
        return;
    }
    this.eventBase.$().one(evt, handler);
    return this;
};

Eventable.prototype.on = function(evt, handler) {
    if(!this.eventBase) {
        return;
    }
    this.eventBase.$().on(evt, handler);
    return this;
};

Eventable.prototype.trigger = function(evt, args) {
    if(!this.eventBase) {
        return;
    }
    this.eventBase.$().trigger(evt, args);
    return this;
};

Eventable.prototype.off = function(evt, handler) {
    if(!this.eventBase) {
        return;
    }
    this.eventBase.$().off(evt, handler);
};

module.exports = Eventable;
},{"../util/object":73}],23:[function(require,module,exports){
var object = require('../util/object');
var SVGShape = require('../svg/svgShape');
var event = require('../core/event');

SVGShape.prototype.hoverable = function(handler) {
    if(object.isBoolean(handler)) {
        this.hoverFlag = handler;
        return;
    } else {
        handler = handler || {};
        this.hoverFlag = true;
    }

    handler = handler || {};
    var that = this;

    this.on('mouseenter', function(evt) {
        if(that.hoverFlag) {
            that.hovered = true;
            event.trigger('element_hoverIn', that);
            if (handler.in) {
                handler.in.apply(that, [evt]);
            }
        }
    });

    this.on('mouseleave', function(evt) {
        if(that.hoverFlag) {
            that.hovered = false;
            event.trigger('element_hoverOut', that);
            if (handler.out) {
                handler.out.apply(that, [evt]);
            }
        }
    });

    return this;
};
},{"../core/event":7,"../svg/svgShape":63,"../util/object":73}],24:[function(require,module,exports){
arguments[4][9][0].apply(exports,arguments)
},{"../dom/dom":45,"../svg/transform":65,"../util/app":70,"../util/object":73,"../util/util":75,"./eventable":22,"dup":9}],25:[function(require,module,exports){
var object = require('../util/object');

var KnobManager = function(diagram) {
    this.knobs = [];
    this.hideDocking = false;
    this.diagram = diagram;
    this.templateMgr = diagram.templateMgr;
    diagram.event.listen('knob_added', this.addKnobListener, this);
    diagram.event.listen('knob_delete', this.deleteKnobListener, this);
};

KnobManager.prototype.addKnobListener = function(evt) {
    if(evt.data) {
        this.knobs.push(evt.data);
    }
};

KnobManager.prototype.createKnobNode = function(p, group, cfg) {
    var knobId = this.diagram.uniqueId();
    var config = object.extend({node_id:'docking_'+knobId, x: p.x, y: p.y, type:'circle'}, cfg);
    var tmpl_id = 'knob_'+config.type.toLowerCase();
    var node = this.templateMgr.getTemplateSync(tmpl_id).createNode(config, this.diagram).init();
    if(group) {
        this.diagram.svg.addToGroup(group, node.root);
    }
    return node;
};

KnobManager.prototype.deleteKnobListener = function(evt) {
    if(object.isDefined(evt.data)) {
        var index = this.knobs.indexOf(evt.data);
        if(index > -1) {
            this.knobs.splice(index, 1);
        }
        evt.data.remove();
    }
};

KnobManager.prototype.hideKnobs = function() {
    this.hideDocking = true;
    this.executeOnAllKnobs(function(knob) {
        knob.hide();
    });
};

KnobManager.prototype.showKnobs = function() {
    this.hideDocking = false;
    this.executeOnAllKnobs(function(knob) {
        knob.show();
    });
};

KnobManager.prototype.executeOnAllKnobs = function(func) {
    object.each(this.knobs, function(index, knob) {
        func(knob);
    });
};

module.exports = KnobManager;

},{"../util/object":73}],26:[function(require,module,exports){
require('./template');
require('./node');
var object = require('../util/object');

var templateMgr = require('./templateManager');

var defaultConfig = {
    dockingType: "CENTER",
    fill: "silver",
    'fill-active': 'green',
    'fill-opacity': '0.5',
    radius: 5,
    stroke: '#7C7C7C',
    'stroke-width': '1',
    'cssClass': 'knob',
    preventSelection: true
};

var circleConfig = object.extend({}, defaultConfig,
    {
        svg :'<circle cx="0" cy="0" r="{radius}" id="{node_id}" class="{cssClass}" style="stroke-width:{stroke-width};stroke:{stroke};fill:{fill};fill-opacity:{fill-opacity};" transform="translate({x} {y})"></circle>'
    });

templateMgr.registerTemplate('knob_circle', circleConfig);

var rectConfig = object.extend({}, defaultConfig,
    {
        svg :'<rect x="0" y="0" id="{node_id}" height="{size}" width="{size}" class="{cssClass}" style="stroke-width:{stroke-width};stroke:{stroke};fill:{fill};fill-opacity:{fill-opacity};" transform="translate({x} {y})"></rect>'
    });

templateMgr.registerTemplate('knob_rect', rectConfig);
},{"../util/object":73,"./node":27,"./template":36,"./templateManager":37}],27:[function(require,module,exports){
/**
 * This class represents the nodes of a diagram. Every note has a unique ID and
 * a template defining the type of the node.
 */
var Eventable = require('./eventable');
var util = require('../util/util');
var dockingType = require('./docking');
var SVG = require('../svg/svg');
var nodeAdditions = require('./nodeAdditions');

var object = util.object;
var dom = util.dom;

/**
 * The constructor does not render a node to the stage. To render a node
 * the init method has to be called.
 */
var Node = function(tmpl, config, diagram) {
    this.config = config || {};
    this.data = {};
    this.diagram = diagram;
    this.isNode = true;
    this.event = diagram.event;
    this.id = config.node_id;
    this.template = tmpl;
    this.selectable = object.isDefined(this.config.selectable) ? this.config.selectable : true;
    this.visible = true;
};

util.inherits(Node, Eventable);

/**
 * This method renders the node to the stage and initializes all event handlers
 * With the part argument we can import the node to another svg part than the default which is the main stage.
 * This is used for example for the defs (which is technically not a real node)
 *
 * @returns {Node_L7.Node.prototype}
 */
Node.prototype.init = function(part, prepend) {
    //ADD Element to stage
    this._setRoot(this.diagram.import(this.template.getSVGString(this.config), part, prepend));
    this.activate();
    this.exec('init');
    return this;
};

Node.prototype.getCorners = function() {
    var x = this.x();
    var y = this.y();
    var bottomy = this.getBottomY();
    var rightx = this.getRightX();
    return [
        {x:x,y:y},
        {x:rightx, y:y},
        {x:rightx, y:bottomy},
        {x:x,y:bottomy}
    ];
};

/**
 * Activates the the node and handler functions by means of the given config
 *
 * @returns itself
 */
Node.prototype.activate = function(nodeID) {

    if(nodeID) {
        this.id = this.config.node_id = nodeID;
    }

    if(!this.root) {
        //Activation
        this._setRoot(this.diagram.svg.get(this.id));
    }

    nodeAdditions.init(this);

    if(this.root && this.id) {
        this.initEventFunctions(this.config);
        this.root.dala('tmpl' , this.template.id);
        //We set the dala namespace because in case the nodes are imported/exported/parsed...
        this.root.attr('id', this.id);
        this.root.attr(this.diagram.ns());
        this.root.attr('class', 'element_root');
        if(this.config.x && this.config.y) {
            this.moveTo(this.config);
        }
    }

    if(nodeID) {
        this.exec('activate');
    }
    return this;
};

Node.prototype._setRoot = function(root) {
    this.root = this.eventBase = root;
};

Node.prototype.initEventFunctions = function() {
    var that = this;

    if(this.root.hoverable) {
        this.root.hoverable();
    }

    this.on('dblclick', function(evt) {
        that.exec('dbclick', [evt], true);
    }).on('mousedown', function(evt) {
        if(!evt.ctrlKey && that.isVisible()) {
            evt.stopPropagation();
            that.exec('mousedown', [evt], true);
            if(!that.selected) {
                that.select();
            }
        }
    });
};

Node.prototype.isVisible = function() {
    return this.root.isVisible();
};

Node.prototype.hide = function() {
    this.root.hide();
};

Node.prototype.show = function(opacity) {
    this.root.show(opacity);
};

Node.prototype.index = function() {
    return this.root.$().index();
};

Node.prototype.firstChild = function() {
    //TODO: this should be cached to reduce dom calls !
    return this.root.firstChild();
};

Node.prototype.moveUp = function() {
    //We switch UP/Down here because the first node in the dom tree is the
    //last node (back) in the svg view.

    //TODO: as command event !
    this.root.up();
    this.exec('moveUp');
};

Node.prototype.moveDown = function() {
    //We switch UP/Down here because the first node in the dom tree is the
    //last node (back) in the svg view.

    //TODO: as command event !
    this.root.down();
    this.exec('moveDown');
};

Node.prototype.remove = function() {
    //Note: jquery triggers a remove dom event itself...
    this.exec('remove', undefined, true);
    this.root.remove();
};

Node.prototype.rotate = function(a) {
    return this.root.rotate(a);
};

Node.prototype.moveTo = function(x, y) {
    this.root.moveTo(x, y);
    this.exec('moveTo');
};

Node.prototype.position = function() {
    return {
        x : this.x(),
        y : this.y()
    };
};

Node.prototype.getInnerSVG = function(prefix) {
    return $.qCache().svg(this.getNodeSelector(prefix));
};

Node.prototype.updateAdditions = function(type) {
    this.exec('update');
};

Node.prototype.addOutgoingTransition = function(value) {
    return this.additions.transition.addOutgoingTransition(value);
};

Node.prototype.removeOutgoingTransition = function(transition) {
    this.additions.transition.removeOutgoingTransition(transition);
};

Node.prototype.addIncomingTransition = function(transition) {
    this.additions.transition.addIncomingTransition(transition);
};

Node.prototype.removeIncomingTransition = function(transition) {
    this.additions.transition.removeIncomingTransition(transition);
};

Node.prototype.getRootSVG = function() {
    return this.root;
};

Node.prototype.instance = function() {
    if(object.isDefined(this.root)) {
        return this.root.instance();
    }
};

Node.prototype.selector = function(prefix) {
    if(object.isArray(prefix)) {
        var stringSelector = [];
        var that = this;
        object.each(prefix, function(index, val) {
            stringSelector.push(that.selector(val));
        });
        return stringSelector.join(', ');
    } else {
        return this.getNodeSelector(prefix);
    }
};

Node.prototype.getNodeSelector = function(prefix) {
    var result = '';

    if(!prefix || prefix.length === 0) {
        return '#'+this.id;
    }


    if(!util.string.startsWith(prefix, '#') && !util.string.startsWith(prefix, '.')) {
        result = '#'+prefix;
    } else {
        result = prefix;
    }

    return util.string.endsWith(prefix, '_')
        ? result + this.id
        : result + '_' + this.id;
};

Node.prototype.getRootNode = function() {
    return this.root.getRootNode();
};

Node.prototype.executeTemplateHook = function(hook, args) {
    if(this.template.config && this.template.config.on) {
        var hook = this.template.config.on[hook];
        if(hook) {
            hook.apply(this, args);
        }
    }
};

Node.prototype.select = function(shifted) {
    this.selected = true;
    this.exec('select', [shifted]);
};

Node.prototype.deselect = function() {
    this.selected = false;
    this.exec('deselect');
};

Node.prototype.extractNodeId = function(rawId) {
    var splitted = rawId.split('_');
    return splitted[splitted.length - 1];
};

Node.prototype.x = function() {
    return this.root.x();
};

Node.prototype.y = function() {
    return this.root.y();
};

Node.prototype.height = function() {
    return this.root.height();
};

Node.prototype.width = function() {
    return this.root.width();
};

Node.prototype.getRightX = function() {
    return this.root.getRightX();
};

Node.prototype.getBottomY = function() {
    return this.root.getBottomY();
};

Node.prototype.isLeftOf = function(mousePosition) {
    return mousePosition.x > (this.getRightX());
};

Node.prototype.isRightOf = function(mousePosition) {
    return mousePosition.x < (this.x());
};

Node.prototype.isOver = function(mousePosition) {
    return mousePosition.y > (this.getBottomY());
};

Node.prototype.overlays = function() {
    return this.root.overlays.apply(this.root, arguments);
    //return this.root.overlayCheck(mousePosition);
};

Node.prototype.isUnder = function(mousePosition) {
    return mousePosition.y < (this.getBottomY());
};

Node.prototype.getCenter = function() {
    return this.root.getCenter();
};

Node.prototype.getRelativeCenter = function() {
    return {
        x: this.width() / 2,
        y: this.height() / 2
    }
};

Node.prototype.getRelativePosition = function(pageX,pageY) {
    var p = util.math.getPoint(pageX,pageY);
    return {
        x: p.x - this.x(),
        y: p.y - this.y()
    };
};

/**
 * Determines the location of a given position relative to the node node.
 *
 * @param node
 * @param position
 * @returns {*}
 */
Node.prototype.getRelativeLocation = function(position) {
    return this.root.getRelativeLocation(position);
};

Node.prototype.toString = function(position) {
    return this.root.toString();
};

Node.prototype.getOrientation = function(relative) {
    if(!object.isDefined(relative)) {
        return this.getCenter();
    } else {
        return {
            x : this.x() + relative.x,
            y : this.y() + relative.y
        };
    }
};

module.exports = Node;
},{"../svg/svg":60,"../util/util":75,"./docking":17,"./eventable":22,"./nodeAdditions":28}],28:[function(require,module,exports){
var additions = require('./additions');

//Init default additions
additions.registerNodeAddition('resize', require('./resizeAddition'));
additions.registerNodeAddition('edit', require('./editNodeAddition'));
additions.registerNodeAddition('transition', require('./transitionAddition'));

module.exports = {
    init : function(node) {
        additions.initNodeAddition('transition', node);
        additions.initNodeAddition('edit', node);
        additions.initNodeAddition('resize', node);
    }
}
},{"./additions":13,"./editNodeAddition":20,"./resizeAddition":32,"./transitionAddition":39}],29:[function(require,module,exports){
require('./draggable');
require('./hoverable');

var util = require('../util/util');
var event = require('../core/event');
var Node = require('./node');
var AbstractManager = require('./abstractManager');

var cache = require('../core/cache');
var object = util.object;
var dom = util.dom;

var EVT_CREATE = 'node_create';
var EVT_DELETE = 'node_delete';
var EVT_COPY = 'node_copy';
var EVT_PAST = 'key_paste_press';

var EVT_RESIZED = 'node_resized';
var EVT_ADDED = 'node_added';
var EVT_SELECTED = 'node_selected';
var EVT_DESELECTED = 'node_deselected';
var EVT_REMOVED = 'node_removed';

var CMD_ADD = 'node_add';
var CMD_DELETE = 'node_delete';
var CMD_COPY = 'node_copy';
var CMD_DROP = 'node_drop';
var CMD_RESIZE = 'node_resize';
var CMD_EDIT = 'node_edit';

var NodeManager = function(diagram) {
    // Contains all nodes added to the diagram
    AbstractManager.call(this, diagram);
    this.nodes = {};

    this.selectionMgr = diagram.selectionMgr;
    this.templateMgr = diagram.templateMgr;

    this.listen(EVT_CREATE, this.createNodeListener);
    this.listen(EVT_DELETE, this.deleteNodeListener);
    this.listen(EVT_COPY, this.copyNodeListener);
    this.listen(EVT_RESIZED, this.resizeNodeListener);

    this.command(CMD_ADD, this.createNode, this.deleteNode);
    this.command(CMD_DELETE, this.deleteNode, this.importNode);
    this.command(CMD_COPY, this.importNode, this.deleteNode);
    this.command(CMD_DROP, this.moveNode, this.moveNode);
    this.command(CMD_RESIZE, this.resizeNode, this.resizeNode);
    this.command(CMD_EDIT, this.editNode, this.undoEdit);

    var that = this;
    this.diagram.on('paste', function(evt) {
        that.importCopyNodes()
            .then(function(result) {
                var ids = [];
                var svgStrings = [];
                var nodeMapping = {};
                that.selectionMgr.clear();
                $.each(result, function(index, node) {
                    node.select(true);
                    nodeMapping[node.config.oldId] = node.config.newId;
                    ids.push(node.id);
                    svgStrings.push(node.toString());
                });

                that.importCopyTransitions(nodeMapping).then(function(transitions) {
                    //that.addCmd('cmd_group', [[CMD_COPY, [svgStrings], [ids]], []])

                    that.addCmd(CMD_COPY, [svgStrings], [ids]);
                });

            }, function(err) {});
    });
};

NodeManager.prototype.importCopy = function(copyResults, cfg) {

};

util.inherits(NodeManager, AbstractManager);

NodeManager.prototype.importCopyNodes = function() {
    var promises = [];
    var that = this;
    $.each(that.selectionMgr.lastCopy.nodes, function(key, value) {
        promises.push(that.importNode(value.svg, {
            oldId : key,
            x : value.position.x + 20,
            y : value.position.y + 20,
            newId : that.diagram.uniqueId()
        }));
    });
    return Promise.all(promises);
};

NodeManager.prototype.importCopyTransitions = function(nodeIdMapping) {
    var that = this;
    return new Promise(function(resolve, reject) {
        var result = [];
        $.each(that.selectionMgr.lastCopy.transitions, function(key, value) {
            var svg = value.svg;
            svg = svg.replace(new RegExp(value.start, 'g'), nodeIdMapping[value.start]);
            svg = svg.replace(new RegExp(value.end, 'g'), nodeIdMapping[value.end]);
            var transition = that.diagram.transitionMgr.importTransition(svg, {oldId:key, newId:that.diagram.uniqueId()});
            transition.update();
            result.push(transition);
        });
        resolve(result);
    });
};

NodeManager.prototype.createNodeListener = function(evt) {
    try {
        var stagePosition = this.diagram.getStagePosition(evt);
        this.createNodeCommand(evt.data, stagePosition);
    } catch(err) {
        console.error(err);
        event.trigger('error', 'Error occured while creating node !');
    }
};

NodeManager.prototype.createNodeCommand = function(tmpl, config) {
    config = config || {};

    if(!tmpl) {
        event.trigger('warn', 'Could not create Node: No template selected!');
        return;
    }

    config.node_id = this.diagram.uniqueId();
    config.diagramId = this.diagram.id;
    return this.exec(CMD_ADD, [tmpl, config], [config.node_id]);
};

NodeManager.prototype.createNode = function(tmpl, config) {
    var that = this;
    var node = tmpl.createNode(config, this.diagram).init();
    if(!config.preventDrag) {
        node.draggable();
        node.on('select', function() {
            that.event.trigger(EVT_SELECTED, node);
        }).on('deselect', function() {
            that.event.trigger(EVT_DESELECTED, node);
        }).on('remove', function() {
            that.event.trigger(EVT_REMOVED, node);
        }).on('edit', function(evt, key, value, oldValue) {
            that.addCmd(CMD_EDIT, [node.id, key, value], [node.id, key, oldValue]);
        }).on('dragEnd', function() {
            var selection = that.selectionMgr.getSelectedNodes();
            //We just add the command since we don't want to execute the drag twice
            that.addCmd(CMD_DROP,
                [selection, node.dragContext.dxSum, node.dragContext.dySum],
                [selection, (-1 * node.dragContext.dxSum), (-1 * node.dragContext.dySum)]);
        });
    }
    this.addNode(node);
    return node;
};

NodeManager.prototype.addNode = function(node) {
    this.nodes[node.id] = node;
    this.event.trigger(EVT_ADDED, node);
};


NodeManager.prototype.activateNode = function(node, cfg) {
    var domNode;
    if(node.SVGElement) {
        domNode = node.instance();
    } else if(object.isString(node)) {
        domNode = this.diagram.svg.get(node);
    } else {
        domNode = node;
    }

    var attributes = dom.getAttributes(domNode);
    var that = this;
    return new Promise(function(resolve, reject) {
        that.templateMgr.getTemplate(attributes['dala:tmpl'])
            .then(function (tmpl) {
                resolve(that.activate(attributes['id'], tmpl, cfg));
            }, reject);
    });
};

NodeManager.prototype.activate = function(nodeId, tmpl, cfg) {
    //Create Node instance and set nodeId
    cfg = cfg || {};
    var node = tmpl.createNode(cfg, this.diagram)
        .activate(nodeId)
        .draggable();

    this.addNode(node);
    return node;
};

NodeManager.prototype.deleteNodeListener = function(evt) {
    try {
        var node = this.getNode(evt.data);
        if(node.knob) {
            //CMD is handled by transitionMgr
            node.remove();
        } else if(node) {
            return this.exec(CMD_DELETE, [node.id], [node.toString()]);
        }
    } catch(err) {
        console.error(err);
        event.trigger('error', 'Could not delete node('+node.id+')');
    }
};

NodeManager.prototype.deleteNode = function(node) {
    if(object.isArray(node)) {
        var that = this;
        $.each(node, function(index, value) {
            that.deleteNode(value);
        });
        return;
    }

    node = this.getNode(node);
    if(node) {
        node.remove();
        delete this.nodes[node.id];
        cache.clearBySuffix(node.id);
    } else {
        console.warn('delete node was called for unknown node');
    }
};

NodeManager.prototype.importNode = function(nodeStr, cfg) {
    if(object.isArray(nodeStr)) {
        var promises = [];
        var that = this;
        $.each(nodeStr, function(index, value) {
            promises.push(that.importNode(value, cfg));
        });

        return new Promise(function(resolve, reject) {
            Promise.all(promises).then(function(nodes) {
                $.each(nodes, function(index, node) {
                    node.select(true);
                });
                resolve(nodes);
            });
        });

    }

    cfg = cfg || {};

    //If set we replace the old node id with a new one e.g. when we copy a node
    if(cfg.newId && cfg.oldId) {
        nodeStr = nodeStr.replace(new RegExp(cfg.oldId, 'g'), cfg.newId);
    }

    //Insert to dom and activate the new node
    var targetInstance = this.diagram.import(nodeStr);
    return this.activateNode(targetInstance, cfg);
};

NodeManager.prototype.getNodeAsString = function(node) {
    node = this.getNode(node);
    return node.toString();
};

NodeManager.prototype.copyNodeListener = function(evt) {
    try {
        var node = this.getNode(evt.data);
        if(object.isDefined(node)) {
            var nodeStr = node.toString();
            var newNodeId = Date.now();
            return this.exec(CMD_COPY, [nodeStr,
                {
                    mouse : evt.mouse,
                    oldId : node.id,
                    newId : newNodeId
                }], [newNodeId]);
        }
    } catch(err) {
        console.log(err);
        event.trigger('error', 'Could not copy node !');
    }
};

NodeManager.prototype.moveNode = function(node, dxSum, dySum) {
    if(object.isArray(node)) {
        var that = this;
        $.each(node, function(index, value) {
            that.moveNode(value, dxSum, dySum);
        });
    } else {
        node = this.getNode(node);
        if(node) {
            node.triggerDrag(dxSum, dySum);
        }
    }
};

/**
 * TODO: listen through node event !
 * @param evt
 */
NodeManager.prototype.resizeNodeListener = function(evt) {
    try {
        var node = evt.data;
        if(node) {
            var resizeInstance = node.additions.resize.get();
            this.addCmd(CMD_RESIZE,
                [node.id, resizeInstance.dx, resizeInstance.dy, resizeInstance.knob],
                [node.id, (-1*resizeInstance.dx), (-1*resizeInstance.dy), resizeInstance.knob]);
        }
    } catch(err) {
        console.log(err);
    }
};

NodeManager.prototype.resizeNode = function(node, dx, dy, knob) {
    node = this.getNode(node);
    if(node) {
        node.additions.resize.get().resize(dx,dy,knob);
    } else {
        console.warn('resizeNode was for unknown node :'+node.toString());
    }
};

NodeManager.prototype.getNode = function(id) {
    if(object.isString(id) && !isNaN(id)) {
        return this.nodes[parseInt(id)];
    } else if(!isNaN(id)) {
        return this.nodes[id];
    } else if(id instanceof Node) {
        //We assume a node instance
        return id;
    } else {
        console.warn('getNode call with no result for :'+id);
    }
};

NodeManager.prototype.getNodes = function(filter) {
    if(!filter) {
        return object.toArray(this.nodes);
    } else {
        var result = [];
        object.each(this.nodes, function(key, value) {
            if(filter(value)) {
                result.push[value];
            }
        });
        return result;
    }
};

NodeManager.prototype.editNode = function(node, editKey, newValue) {
    node = this.getNode(node);
    node.additions.edit.setValue(editKey, newValue);
};

NodeManager.prototype.undoEdit = function(node, editKey, newValue) {
    node = this.getNode(node);
    node.additions.edit.setValue(editKey, newValue);
};

NodeManager.prototype.clear = function() {
    this.nodes = {};
};

module.exports = NodeManager;
},{"../core/cache":2,"../core/event":7,"../util/util":75,"./abstractManager":11,"./draggable":19,"./hoverable":23,"./node":27}],30:[function(require,module,exports){
var config = require('../core/config');
var CurvePathManager = require('./curvedPathManager');
var StraightPathManager = require('./straightPathManager');
var RoundPathManager = require('./roundPathManager');
var pathManager = {};

var register =   function(constructor) {
    pathManager[constructor.type] = constructor;
};

register(CurvePathManager);
register(StraightPathManager);
register(RoundPathManager);

module.exports =  {
    register : register,
    get : function(transition, id) {
        id = id || config.val('transition_type', StraightPathManager.type);
        if(pathManager[id]) {
            return new pathManager[id](transition);
        }
    }
};
},{"../core/config":6,"./curvedPathManager":15,"./roundPathManager":33,"./straightPathManager":35}],31:[function(require,module,exports){
var util = require('../util/util');
var event = require('../core/event');
var Command = require('../core/command');
var Transform = require('../svg/transform');
var SVG = require('../svg/svg');
var DragConfig = require('../svg/dragConfig');
var Knob = require('./knob');

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
    this.event = diagram.event;
    this.knobs = [];
    this.node = node;
    this.config = this.node.template.config.resize;
};

/**
 * Renders the knobs around the node.
 */
Resize.prototype.activateKnobs = function() {
    var positions = this.calculateKnobPosition();

    this.group = this.diagram.svg.g({}).translate(this.node.position()).rotate(this.node.rotate());

    //Initialize the different knobs with different drag restricitons
    this.createKnob(KNOB_NW,positions[KNOB_NW],new DragConfig());
    this.createKnob(KNOB_N, positions[KNOB_N],new DragConfig().yOnly());
    this.createKnob(KNOB_NE,positions[KNOB_NE],new DragConfig());
    this.createKnob(KNOB_E, positions[KNOB_E],new DragConfig().xOnly());
    this.createKnob(KNOB_SE,positions[KNOB_SE],new DragConfig());
    this.createKnob(KNOB_S, positions[KNOB_S], new DragConfig().yOnly());
    this.createKnob(KNOB_SW,positions[KNOB_SW],new DragConfig());
    this.createKnob(KNOB_W, positions[KNOB_W],new DragConfig().xOnly());


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
        })
        .dragMove(function(evt, dx, dy) {
            //We keep track of the total drag movement
            dx = object.isOneOf(knob, KNOB_NW, KNOB_W, KNOB_SW) ? -1 * dx : dx;
            dy = object.isOneOf(knob, KNOB_NW, KNOB_N, KNOB_NE) ? -1 * dy : dy;

            that.dx += dx;
            that.dy += dy;

            that.resize(dx,dy);
        })
        .dragEnd(function(evt) {
            that.event.trigger('node_resized', that.node);
        })
        .getScale(function() {
            return that.diagram.scale;
        }).get();

    dragHook.preventAlignment = true;

    // Render the knob on stage
    this.knobs[knob] = new Knob(this.diagram, p, {type:'rect', fill:'black', stroke:'none', selectable:false, 'stroke-width':0, size:SIZE, 'fill-opacity':1}, this.group)
        .draggable(dragHook).hoverable();
};

/**
 * Determines all svg elements participating in the resize process, which
 * are configured in the resize config bind attribute
 */
Resize.prototype.getResizeElements = function() {
    var result = [];
    var that = this;
    object.each(this.config, function(index, value) {
        if(value.bind === 'root') {
            result[index] = that.node.root;
        } else {
            var svgSelector = that.node.getNodeSelector(value.bind);
            result[index] = $.qCache().svg(svgSelector);
        }
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
            this.node.exec('resize');
        } else {
            //If the flag is not set we just do an update probably from simple node drag/drop
            this.group.translate(this.node.position());
        }
    }
};

Resize.prototype.calculateKnobPosition = function() {
    var sizeDifsum = (SIZE + DIF)
    var left = -1 * sizeDifsum;
    var top = left;
    var right = this.node.width() + DIF;
    var centerX = right / 2 - (sizeDifsum / 2);
    var bottom = this.node.height() + DIF;
    var centerY = bottom / 2 - (sizeDifsum / 2);

    var result = [];
    result[KNOB_NW] = {x:left, y:top};
    result[KNOB_N] = {x:centerX, y:top};
    result[KNOB_NE] = {x:right, y:top};
    result[KNOB_E] = {x:right, y:centerY};
    result[KNOB_SE] = {x:right, y:bottom};
    result[KNOB_S] = {x:centerX, y:bottom};
    result[KNOB_SW] = {x:left, y:bottom};
    result[KNOB_W] = {x:left, y:centerY};
    return result;

};

Resize.prototype.removeKnobs = function() {
    if(object.isDefined(this.group)) {
        this.group.remove();
    }
    delete this.group;
};

Resize.prototype.updateNodes = function(dx,dy) {

    if(!object.isDefined(this.resizeElements)) {
        this.resizeElements = this.getResizeElements();
    }

    var that = this;
    object.each(this.resizeElements, function(index, element) {
        that.updateNode(index,element,dx,dy);
    });

    if(!object.isDefined(dx)) {
        return;
    }

    var alignX = object.isOneOf(this.dragKnob, KNOB_NW, KNOB_W, KNOB_SW) ? dx * -1 : 0;
    var alignY = object.isOneOf(this.dragKnob, KNOB_NW, KNOB_N, KNOB_NE) ? dy * -1 : 0;
    this.node.root.move(alignX, alignY);
    this.group.move(alignX, alignY);
};

Resize.prototype.updateNode = function(index, element, dx, dy) {
    dx = (!object.isDefined(dx))? 0 : dx;
    dy = (!object.isDefined(dy))? 0 : dy;

    var elementConfig = this.config[index];
    if(object.isDefined(elementConfig.value)) {
        //TODO: cleaner implementation
        //Scale with even alignment (default for type scale)
        if(elementConfig.value[0].type === 'scale' && elementConfig.even) {
            var d = util.math.minMax(dx,dy).max;
            this.setResize(element, elementConfig, elementConfig.value[0], d, 'width');
        } else {
            if(elementConfig.value[0].type !== 'vertical') {
                this.setResize(element, elementConfig, elementConfig.value[0], dx, 'width');
            }
            //We just set one dimension for a circle
            if(elementConfig.value[0].type !== 'circle' || this.dragKnob === KNOB_S || this.dragKnob === KNOB_N) {
                this.setResize(element,elementConfig, elementConfig.value[1], dy, 'height');
            }
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
        case 'static':
        case 'none':
            break;
        case 'vertical':
            var newY = parseInt(svgElement.attr('y2')) + d;
            svgElement.attr('y2', newY);
        case 'parent':
            //We could check the resize settings of the parent if this is static
            //we do not have to change anything when resizing.
            svgElement[dimension](1);

            //Get the dimension from parent node
            var parentVal = svgElement.$().parent().get(0).getBBox()[dimension];
            svgElement[dimension](parentVal + setting.value);
            break;
        case 'scale':
            if(elementConfig.even) {
                var scale = svgElement.scale()[0];
                var ratio = d / svgElement.getBBox().width;
                svgElement.scale(scale + ratio);
                $.each(svgElement.find('.alignScale'), function(index, svgToAlign) {
                    svgToAlign.scale(1 / svgElement.scale()[0]);
                });
                $.each(svgElement.find('.alignScaleStroke'), function(index, svgToAlign) {
                    var current = svgToAlign.strokeWidth();
                    var init = current * scale;
                    svgToAlign.strokeWidth(init / svgElement.scale()[0]);
                });
                break;
            } else {
                var scaleOld  = svgElement.scale();
                var scaleIndex = (dimension === 'height') ? 1 : 0;
                var scaleNew = scaleOld.slice();
                //Add the ratio from original size (without scale)
                scaleNew[scaleIndex] += (d / svgElement.getBBox()[dimension]);
                svgElement.scale(scaleNew[0], scaleNew[1]);
            }


            /**
             * TODO: search for inner elements with class .alignScaling and aling e.g. stroke-width, font-size..
             */
            break;
        default:
            var currentVal = svgElement[dimension](false);
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
        limit = svgElement.$().parent()[0].getBBox()[dimension];
    } else if(!isNaN(value)) {
        limit = parseInt(value);
    } else if(util.string.startsWith(value, '#')) {
        limit = $.qCache(this.node.getNodeSelector(value))[0].getBBox()[dimension];
    } else {
        return;
    }

    if(object.isDefined(setting.value)) {
        limit += setting.value;
    }

    var currentVal = svgElement[dimension](false)
    if((type === 'min' && currentVal < limit) || (type === 'max' && currentVal > limit)) {
        svgElement[dimension](limit);
    }
};

Resize.prototype.alignPosition = function(svgElement, elementConfig) {
    //var setting = elementConfig.
    //TODO: set alignElement id in config !
    var x = this.getAlignedPosition(svgElement,elementConfig.position[0], elementConfig.alignto, 'width' , 'x');
    var y = this.getAlignedPosition(svgElement,elementConfig.position[1], elementConfig.alignto, 'height', 'y');

    if(object.isDefined(x)) {
        svgElement.moveX(x);
    }

    if(object.isDefined(y)) {
        svgElement.moveY(y);
    }
};

Resize.prototype.getAlignedPosition = function(svgElement, settings, alignto, dimension, dimensionCoord) {
    switch(settings.type) {
        case 'none':
            break;
        case 'center':
            var alignSVG = this.getAlignElement(alignto, svgElement);
            if(object.isDefined(alignSVG)) {
                var alignVal = alignSVG.getCenter()[dimensionCoord];
                return alignVal - (svgElement[dimension]() / 2) - settings.value;
            };
            break;
        case 'relative':
            var $prevNode = svgElement.$().prev();
            if($prevNode.length) {
                var prevSVG = $.qCache().svg($prevNode);
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
            var alignSVG = this.getAlignElement(alignto, svgElement);
            if(object.isDefined(alignSVG)) {
                var alignVal = (settings.type === 'right')? alignSVG.getRightX():alignSVG.getBottomY();
                return (alignVal - svgElement[dimension]()) - settings.value;
            };
            break;
        default:
            return;
    }
};

Resize.prototype.getAlignElement = function(alignto, svgElement) {
    var elementToAlign;
    //The alignto setting can be the parent-, root- or an explicit element default is the previous sibling element
    if(!alignto || alignto === 'prev') {
        elementToAlign = $.qCache().svg(svgElement.$().prev());
    }else if(alignto === 'parent') {
        elementToAlign = $.qCache().svg(svgElement.$().parent());;
    } else if(alignto === 'root') {
        elementToAlign = this.node.root;
    } else {
        elementToAlign = $.qCache().svg(this.node.getNodeSelector(alignto));
    }

    if(!elementToAlign) {
        console.warn('Could not determine alignto element "'+alignto+'" for node '+this.node.id);
    }

    return elementToAlign;
};

module.exports = Resize;

},{"../core/command":4,"../core/event":7,"../svg/dragConfig":50,"../svg/svg":60,"../svg/transform":65,"../util/util":75,"./knob":24}],32:[function(require,module,exports){
var object = require('../util/object');
var Resize = require('./resize');

var ResizeAddition = function(node) {
    this.node = node;
    this.resize = new Resize(this.node, this.node.diagram);
};

ResizeAddition.prototype.resizeNode = function(dx, dy) {
    //This is the api way to resize a node we imitate the dragevent.
    this.resize.updateNodes(dx,dy);
    this.resize.dragKnob = 4; //We set the KNOB_SE knob as dragKnob for the redo command
    this.resize.dx = dx;
    this.resize.dy = dy;
    this.node.event.trigger('node_resized', this.node);
};

ResizeAddition.prototype.select = function() {
    this.resize.activateKnobs();
};

ResizeAddition.prototype.deselect = function() {
    this.resize.removeKnobs();
};

ResizeAddition.prototype.remove = function() {
    this.deselect();
};

ResizeAddition.prototype.dragMove = function() {
    this.resize.updateKnobs();
};

ResizeAddition.prototype.edit = function() {
    this.resize.update();
};

ResizeAddition.prototype.update = function() {
    //TODO: Through EVENTS !
    this.resize.updateKnobs();
};

ResizeAddition.prototype.init = function() {
    this.resize.updateNodes();
};

ResizeAddition.prototype.activate = function() {
    this.resize.updateNodes();
};

ResizeAddition.prototype.get = function() {
    return this.resize;
};

ResizeAddition.requireConfig = true;

module.exports = ResizeAddition;
},{"../util/object":73,"./resize":31}],33:[function(require,module,exports){
var StraightPathManager = require('./straightPathManager');
var util = require('../util/util');

var RoundPathManager = function(transition) {
    StraightPathManager.call(this, transition);
    this.type = RoundPathManager.type;
};

util.inherits(RoundPathManager, StraightPathManager);

RoundPathManager.type = 'round';

RoundPathManager.prototype.buildPath = function(positions) {
    this.init(positions[0]);
    this.create(positions[positions.length -1]);

    for(var i  = 1; i < positions.length - 1; i++) {
        this.add(i, positions[i]);
    }
};

RoundPathManager.prototype.add = function(index, position) {
    var corners = this.path.valuesByType('Q');
    if(this.path.length() == 1) { // Initial Add
        this.path.insertLine(index, position);
    } else if(index - 1 <= corners.length) { //Add innser Knob
        //Get the endIndex/position of the line before the new corner
        var prevEndIndex = (index == 1) ? 1 : corners[index - 2].index + 1;
        this.path.insertQBezier(prevEndIndex + 1,position);
        this.path.insertLine(prevEndIndex + 2, this.path.value(prevEndIndex).to());
        this.updatePart(index);
    } else { // Append knob
        var end = this.path.end();
        this.path.qBezier(position, undefined);
        this.path.line(end);
        this.updateCorner(index);
    }
};

RoundPathManager.prototype.updatePart = function(index, position, prevUpdateNeighbors) {
    var corners = this.path.valuesByType('Q');
    if(index == 0) { // First Knob
        this.path.start(position);
        if(corners.length > 0) {
            this.updatePart(1, undefined, true);
        }
    } else if(index > corners.length) { // Last Knob

        this.path.end(position);
        if(corners.length > 0) {
            this.updatePart(corners.length, undefined, true);
        }
    } else { // Inner Knobs
        this.updateCorner(index, position, prevUpdateNeighbors);
    }
};

RoundPathManager.prototype.updateCorner = function(index, position, prevUpdateNeighbors) {
    var corners = this.path.valuesByType('Q');
    var cornerIndex = index - 1;
    this.updateCornerStart(cornerIndex, corners, position);
    this.updateCornerEnd(cornerIndex, corners, position);

    if(!prevUpdateNeighbors) {
        this.updatePart(index + 1, undefined, true);
        this.updatePart(index - 1, undefined, true);
    }
};

RoundPathManager.prototype.updateCornerStart = function(cornerIndex, corners, position) {
    var updateCorner = corners[cornerIndex];

    if(!updateCorner) {
        return;
    }

    position = position || updateCorner.value.control();
    var startOrientation = (cornerIndex > 0) ? corners[cornerIndex - 1].value.to() : this.path.start();
    var curveStart = util.math.Line.moveAlong(startOrientation, position, -20);
    this.path.setTo(updateCorner.index - 1, curveStart);
};

RoundPathManager.prototype.updateCornerEnd = function(cornerIndex, corners, position) {
    var updateCorner = corners[cornerIndex];

    if(!updateCorner) {
        return;
    }

    position = position || updateCorner.value.control();
    var endOrientation = (cornerIndex == corners.length - 1) ? this.path.end() : corners[cornerIndex + 1].value.to();
    var curveEnd = util.math.Line.moveAlong(position, endOrientation, 20);
    updateCorner.value.control(position).to(curveEnd);
};

RoundPathManager.prototype.getIndexForPosition = function(position) {
    //The round path is divided like the this: M L - Q L - Q L - Q L where the first M L can be seen as index 1...
    var pathIndex = this.path.getPathIndexForPosition(position);
    var evenPathIndex = (pathIndex % 2 == 0) ? pathIndex : pathIndex - 1;
    return (evenPathIndex / 2) + 1;
};

RoundPathManager.prototype.removePathPart = function(index) {
    if(this.path && index > 0) {
        var corner = this.path.valuesByType('Q')[index - 1];
        if(corner) {
            var curveEnd = this.path.value(corner.index + 1).to();
            this.path.value(corner.index - 1).to(curveEnd);
            this.path.removePath(corner.index + 1);
            this.path.removePath(corner.index);
        }
    }
};

RoundPathManager.prototype.update = function() {/** nothing **/};

module.exports = RoundPathManager;

},{"../util/util":75,"./straightPathManager":35}],34:[function(require,module,exports){
var util = require('../util/Util');
var event = require('../core/event');
var PathData = require('../svg/PathData');

var object = util.object;
var dom = util.dom;

var SelectionManager = function(diagram) {
    this.diagram = diagram;
    this.event = diagram.event;
    this.selectedNodes = [];
    this.selectedTransitions = [];
    this.copyNodes = [];
    this.selectedTransition;
    this.hoverElement;

    event.listen('key_up_press', this.upListener, this);
    event.listen('key_down_press', this.downListener, this);
    event.listen('key_del_press', this.deleteListener, this);
    event.listen('tab_activated', this.clear, this);

    this.event.listen('transition_added', this.transitionAddedListener, this);
    this.event.listen('node_added', this.nodeAddedListener, this);
    this.event.listen('knob_added', this.knobAddedListener, this);

    //These are currently global events not diagram context events
    event.listen('element_hoverIn', this.hoverInElementListener, this);
    event.listen('element_hoverOut', this.hoverOutElementListener, this);

    var that = this;
    this.diagram.on('copy', function(evt) {
        var copyNodes = {};
        var copyTransitions = {};
        $.each(that.selectedNodes, function(index, node) {
            if(!node.knob) {
                copyNodes[node.id] =  {svg : node.toString(), position: node.position()};
                $.each(node.additions.transition.outgoingTransitions, function(index, transition) {
                    if(transition.getEndNode().selected) {
                        copyTransitions[transition.id] ={svg : transition.toString(), start: transition.getStartNode().id, end: transition.getEndNode().id};
                    }
                });

                $.each(node.additions.transition.incomingTransitions, function(index, transition) {
                    if(!copyTransitions[transition.id] && transition.getStartNode().selected) {
                        copyTransitions[transition.id] = {svg : transition.toString(), start: transition.getStartNode().id, end: transition.getEndNode().id};
                    }
                })
            }
        });

        that.lastCopy = {
            mouse : evt.mouse,
            nodes : copyNodes,
            transitions : copyTransitions
        };
    });
};

SelectionManager.prototype.getSelectedNodes = function() {
    return this.selectedNodes.slice();
};

SelectionManager.prototype.getSelectedNodeIds = function() {
    var result = [];
    $.each(this.selectedNodes, function(index, value) {
        result.push(value.id);
    });
    return result;
};

SelectionManager.prototype.knobAddedListener = function(evt) {
    var knob = evt.data;
    var that = this;
    this.addNodeEvents(knob.node);
    if(knob.node.selectable) {
        knob.node.on('select', function () {
            if (that.dragSelection || evt.shiftKey && knob.transition) {
                if (knob.transition.selected) {
                    knob.transition.deselect();
                }
            } else {
                if (!knob.transition.selected) {
                    knob.transition.select();
                }
            }
        });
    }
};

SelectionManager.prototype.nodeAddedListener = function(evt) {
    this.addNodeEvents(evt.data);
};

SelectionManager.prototype.addNodeEvents = function(node, shifted) {
    if(node.selectable) {
        var that = this;
        node.on('select', function (evt, shifted) {
            that.setNodeSelection(node, shifted);
        }).on('deselect', function () {
            that.removeSelectedNode(node);
        }).on('remove', function () {
            that.removeSelectedNode(node);
        }).select();
    }
    return node;
};

SelectionManager.prototype.transitionAddedListener = function(evt) {
    var that = this;
    var transition = evt.data;
    transition.on('select', function(evt, shifted) {
        that.setTransitionSelection(transition);
    }).on('deselect', function() {
        that.removeSelectedTransition(transition);
    }).on('remove', function() {
        that.removeSelectedTransition(transition);
    }).select(evt.shiftKey);
};

SelectionManager.prototype.copyListener = function(mouse) {

};

SelectionManager.prototype.upListener = function(evt) {
    if(evt.ctrlKey) {
        evt.preventDefault();
        object.each(this.selectedNodes, function(index, node) {
            if(object.isDefined(node)) {
                node.moveUp();
            }
        });
    }
};

SelectionManager.prototype.downListener = function(evt) {
    if(evt.ctrlKey) {
        evt.preventDefault();
        object.each(this.selectedNodes, function(index, node) {
            if(object.isDefined(node)) {
                node.moveDown();
            }
        });
    }
};

SelectionManager.prototype.hoverInElementListener = function(evt) {
    this.hoverElement = evt.data;
};

SelectionManager.prototype.hoverOutElementListener = function(evt) {
    delete this.hoverElement;
};

SelectionManager.prototype.removedTransitionListener = function(evt) {
    if(object.isDefined(evt.data)) {
        if(evt.data === this.selectedTransition) {
            delete this.selectedTransition;
        }
    }
};

SelectionManager.prototype.removedNodeListener = function(evt) {
    if(object.isDefined(evt.data)) {
        //Remove the node from the selection
        object.removeFromArray(this.selectedNodes, evt.data);

        //Check if we have to remove the hoverElement too
        if(evt.data.root === this.hoverElement) {
            this.hoverOutElementListener();
        }
    }
};

SelectionManager.prototype.deleteListener = function(evt) {
    //Remove selected transition
    if(object.isDefined(this.selectedTransition) && !this.selectedTransition.getSelectedKnobs().length) {
        this.event.trigger('transition_delete', this.selectedTransition);
        return;
    };

    this.deleteSelectionNodes();
    this.clear();
};

SelectionManager.prototype.deleteSelectionNodes = function() {
    var arrClone = this.selectedNodes.slice(0);
    var that = this;
    object.each(arrClone, function(index, node) {
        if(object.isDefined(node)) {
            that.event.trigger('node_delete', node);
        } else {
            //If there is a undefined value we remove it from the selection
            that.selectedNodes.splice(0, 1);
        }
    });
};

SelectionManager.prototype.transitionCreatedListener = function(evt) {
    this.selectedTransition = evt.data;
};

SelectionManager.prototype.isElementHover = function() {
    return object.isDefined(this.hoverElement);
};

SelectionManager.prototype.setTransitionSelection = function(transition) {
    //We do not call this.clear because we would hide the edit fields trough the triggered event
    this.clearNodes(function(node) {return !transition.ownsKnobNode(node)});
    if(transition !== this.selectedTransition) {
        this.clearTransition();
        this.selectedTransition = transition;
    }
};

SelectionManager.prototype.setNodeSelection = function(selectedNode, shifted) {
    //some templates or nodes are should not affect the selection (e.g. resize knobs)
    if(!selectedNode.selectable) {
        return;
    };

    if(!this.containsNode(selectedNode)) {
        var that = this;

        //Clear the current selection if not shifted or dragSelection
        if(!shifted && !this.dragSelection) {
            this.clearNodes(function(node) {return selectedNode.id !== node.id});
        }

        this.selectedTemplate = selectedNode.template;
        this.addSelectedNode(selectedNode);
        this.clearTransition(selectedNode, object.isDefined(this.dragSelection));

        //Trigger drag for all selected nodes if one selection is dragged
        //We use additon style instead of on event for a performance gain (on.dragMove is deactivated see draggable.js)
        //We don't have to remove this addition after reselect because only selected nodes can be dragged anyways.
        var that = this;
        if(!selectedNode.additions['multiSelectionDrag']) {
            selectedNode.additions['multiSelectionDrag'] = {
                dragMove: function (dx, dy, evt) {
                    if (!evt.triggerEvent) {
                        object.each(that.selectedNodes, function (index, node) {
                            if (selectedNode.id !== node.id) {
                                node.triggerDrag(dx, dy);
                            }
                        });
                    }
                }
            }
        }
    } else if(shifted && !this.dragSelection) {
        this.removeSelectedNode(selectedNode);
    }
};

SelectionManager.prototype.dragSelectionStart = function(evt, startPosition) {
    var that = this;
    // INIT drag selection
    if (!this.isElementHover()) {
        this.clear();
        evt.preventDefault();
        this.diagram.on('mousemove', function (evt) {
            var stagePosition = that.diagram.getStagePosition(evt);
            if (!that.dragSelection) {
                that.dragSelection = that.diagram.svg.path({style: 'stroke:gray;stroke-width:1px;stroke-dasharray:5,5;fill:none;'});
                that.dragSelection.d().start(startPosition)
                    .line(startPosition)
                    .line(stagePosition)
                    .line(stagePosition)
                    .complete();
            } else {
                //Move selection away from mouse pointer
                var alignedMouseX = stagePosition.x - 1;
                var alignedMouseY = stagePosition.y - 1;

                //Update pathdata
                that.dragSelection.d().clear().start(startPosition)
                    .line({x: startPosition.x, y: alignedMouseY})
                    .line({x: alignedMouseX, y: alignedMouseY})
                    .line({x: alignedMouseX, y: startPosition.y})
                    .complete();

                //Check for hovered elements to select
                object.each(that.diagram.nodeMgr.nodes, function (id, node) {
                    that.dragSelect(node);
                });

                object.each(that.diagram.knobMgr.knobs, function(id, knob) {
                    that.dragSelect(knob.node);
                });
            }

            //Trigger attribute update
            that.dragSelection.update();
        });
    };
};

SelectionManager.prototype.dragSelect = function(node) {
    if(!node.selectable) {
        return;
    }
    if(this.dragSelection.overlays(node.getCenter())) {
        if(!node.selected) {
            node.select();
        }
    } else if(node.selected) {
        node.deselect();
    }
};

SelectionManager.prototype.dragSelectionEnd = function() {
    this.diagram.off('mousemove');
    if(this.dragSelection) {
        this.dragSelection.remove();
        delete this.dragSelection;
    }
};

/**
 * This method just adds new nodes to the selection if it have not been
 * added yet without any additional restrictions.
 *
 * All selected transitions are deselected since the mixed selection
 * is not implemented yet.
 *
 * @param {type} selectedNode
 * @returns {undefined}
 */
SelectionManager.prototype.addSelectedNode = function(selectedNode) {
    this.selectedNodes.push(selectedNode);
};

SelectionManager.prototype.removeSelectedTransition = function(transition) {
    if(this.selectedTransition === transition) {
        delete this.selectedTransition;
    }
};

SelectionManager.prototype.removeSelectedNode = function(node) {
    var index = this.selectedNodes.indexOf(node);
    if(index >= 0) {
        this.selectedNodes.splice(index, 1);
    }
};

SelectionManager.prototype.containsNode = function(node) {
    return this.selectedNodes.indexOf(node) > -1;
};

SelectionManager.prototype.clear = function() {
    this.clearNodes();
    this.clearTransition();
    this.event.trigger('selection_clear');
};

SelectionManager.prototype.clearNodes = function(filter) {
    var that = this;
    filter = filter || function() {return true;};
    //We clone the array since the original array can be manipulated while deselection.
    var selectedNodesArr = object.cloneArray(this.selectedNodes);
    object.each(selectedNodesArr, function(index, node) {
        if(node.selectable && filter(node)) {
            node.deselect();
        }
    });
};

SelectionManager.prototype.clearTransition = function(node, force) {
    if(!this.selectedTransition) {
        return;
    }
    if(force || !node  || !node.knob || !this.selectedTransitionOwnsKnobNode(node)) {
        this.selectedTransition.deselect();
    }
};

SelectionManager.prototype.selectedTransitionOwnsKnobNode = function(node) {
    return this.selectedTransition && this.selectedTransition.ownsKnobNode(node);
};

SelectionManager.prototype.isMultiSelection = function() {
    var count = 0;
    count += this.selectedNodes.length;
    return count > 1;
};

module.exports = SelectionManager;

},{"../core/event":7,"../svg/PathData":47,"../util/Util":69}],35:[function(require,module,exports){
/**
 * Simple implementation of path manager
 * @type {PathData|exports|module.exports}
 */
var AbstractPathManager = require('./abstractPathManager');
var util = require('../util/util');

var LinePathManager = function(transition) {
    AbstractPathManager.call(this, transition);
    this.type = LinePathManager.type;
};

util.inherits(LinePathManager, AbstractPathManager);

LinePathManager.type = 'straight';

LinePathManager.prototype.create = function(position) {
    this.path.line(position);
};

LinePathManager.prototype.add = function(index, position) {
    this.path.insertLine(index, position);
};

LinePathManager.prototype.update = function(position) {/* Nothing to do here */};

module.exports = LinePathManager;

},{"../util/util":75,"./abstractPathManager":12}],36:[function(require,module,exports){
var util = require('../util/util');
var xml = require('../util/xml');
var Node = require('./node');
var config = require('../core/config');

var object = util.object;
var dom = util.dom;

var Template = function(id, cfg) {
    this.config = cfg || {};
    this.id = id;

    //Templates can define the svgString within the config, so the svg doesn't have to be loaded in addition
    if(this.config.svg) {
        this.init(this.config.svg);
    }

    //TODO: implement a more generic way...
    if(object.isDefined(this.config.resize)) {
        this.initResizeConfig();
    }
};

Template.prototype.init = function(tmplStr) {
    this.svg = tmplStr;
};

Template.prototype.isInitialized = function() {
    return !!this.svg;
};


/**
 * The resize addition allows to configure a resize behaviour for svg elements
 * by means of defining the logic for changes of x (width) and y (height)
 * in the following form:
 * e.g.:
 *
 * parent(5) default
 *
 * where the x value is
 * @param {type} resizeConfig
 * @returns {undefined}
 */
Template.prototype.initResizeConfig = function() {
    var that = this;
    object.each(this.config.resize, function(index, resizeItem) {
        // Here we just parse the raw string to an array of feature settings
        that.setupSettings(index, resizeItem, 'value');
        that.setupSettings(index, resizeItem, 'position');
        that.setupSettings(index, resizeItem, 'max');
        that.setupSettings(index, resizeItem, 'min');
    });
};

Template.prototype.setupSettings = function(index, item, setting) {
    if(object.isDefined(item[setting])) {
        var values = util.app.parseFeatureStrings(item[setting], 0);

        //If ther is just one value given we use it for both x and y
        if(values.length === 1) {
            values[1] = values[0];
        }

        this.config.resize[index][setting] = values;
    }
};

Template.prototype.createNode = function(config, diagram) {
    var resultConfig = this.getConfig(config);
    return new Node(this, resultConfig, diagram);
};

Template.prototype.getSVGString = function(cfg) {
    return config.replaceConfigValues(this.svg, cfg);
};

Template.prototype.getConfig = function(cfg) {
    return object.extend({}, this.config, cfg);
};

module.exports = Template;
},{"../core/config":6,"../util/util":75,"../util/xml":76,"./node":27}],37:[function(require,module,exports){
var object = require('../util/object');
var Template = require('./template');
var event = require('../core/event');
var client = require('../core/client');

var Promise = require('bluebird');

var PATH_PANELS = '/template/panel';
var PATH_TEMPLATES = '/templates';

var EVENT_PANEL_LOADED = 'template_panel_loaded';

var panels = {};
var templates = {};
var selectedTemplate;

/**
 * Initializes listeners and loads the initial template panels set in dala_env.initial_templates array.
 */
var init = function() {
    event.listen('node_selected', nodeSelectionListener);
    event.listen('template_select', templateSelectListener);

    if(dala_env.initial_templates && dala_env.initial_templates.panels) {
        $.each(dala_env.initial_templates.panels, function(index, panelId) {
            _loadPanel(panelId);
        });
    }
};

var nodeSelectionListener = function(evt) {
    _setSelectedTemplate(evt.data.template);
};

var templateSelectListener = function(evt) {
    if(evt.data) {
        _setSelectedTemplate(evt.data);
    }
};

var _setSelectedTemplate = function(tmplId) {
    if(!object.isDefined(tmplId)) {
        return;
    };

    var instance;

    if(!object.isString(tmplId)) {
        if(!tmplId.config.preventSelection) {
            selectedTemplate = tmplId;
        }
    } else {
        getTemplate(tmplId)
            .then(function(template) {
                if(template && !template.config.preventSelection) {
                    selectedTemplate = template;
                } else {
                    console.warn('Coult not determine template: '+tmplId);
                }
            }, function(err) {
                console.warn('Error while determining template: '+tmplId+' - '+err);
            });
    }
};

/**
 * Returns a templateinstance, the template will be loaded and initialized if not loaded yet.
 *
 * @param tmplId
 * @param tmplRootEl
 * @returns {bluebird|exports|module.exports}
 */
var getTemplate = function(tmplId) {
    var panelId = tmplId.substring(0, tmplId.indexOf('_'));
    return new Promise(function(resolve, reject) {
        if(templates[tmplId]) { //Template is loaded
            var tmpl = templates[tmplId];
            if(!tmpl.isInitialized()) { //Template is not initialized yet so load svg
                _loadRemoteTemplateSVG(tmplId, panelId).
                    then(function() {
                        resolve(tmpl);
                    }, function(err) {
                        reject(err);
                    });
            } else {
                resolve(templates[tmplId]);
            }
        } else { //Template not loaded yet
            if(panelId) { //Load and initialize template
                //TODO: here we have to consider other loading mechanism as dom loading / browser cache first
                _loadRemoteTemplate(panelId, tmplId)
                    .then(function(tmpl) {
                        resolve(tmpl);
                    }, function(err) {
                        reject(err);
                    });
            } else {
                resolve(_createTemplate(tmplId));
            }
        }
    });
};

/**
 * This simply returns a template if its already loaded. This should only be used for templates which are registered
 * on startup and already loaded.
 *
 * @param tmplId
 * @returns {*}
 */
var getTemplateSync = function(tmplId) {
    return templates[tmplId];
};

/**
 * Loads a panel definition from the server. When loaded the panel will register itself to the templateManager.
 * The function returns a Promise.
 *
 * @param panelId
 * @returns {bluebird|exports|module.exports}
 * @private
 */
var _loadPanel = function(panelId) {
    return new Promise(function(resolve, reject) {
        client.getScript(PATH_TEMPLATES+'/'+panelId+'/'+panelId+'.js', {
            success : function() {
                resolve();
            },
            error : function() {
                reject();
            },
            errorMessage : {
                404: 'Could not load panel '+panelId+' file was not found on the server !',
                'default': 'Could not load panel '+panelId+' something went wrong !'
            }
        });
    });
};

/**
 * Loads a remote tamplate from the server. When loaded the template will register itself to the templateManager
 * This function returns a Promise without result.
 *
 * @param panelId
 * @param tmplId
 * @returns {bluebird|exports|module.exports}
 * @private
 */
var _loadRemoteTemplate = function(panelId, tmplId) {
    return new Promise(function(resolve, reject) {
        var that = this;
        client.getScript(PATH_TEMPLATES+'/'+panelId+'/'+tmplId+'.js', {
            success : function(response) {
                //Now that we have loaded and initialized the template script we can get the template
                getTemplate(tmplId).then(resolve, reject);
            },
            error: function(errorMsg) {
                reject(errorMsg);
            },
            errorMessage : {
                404: 'Could not load template "'+tmplId+'" file was not found on the server !',
                'default': 'Could not load template "'+tmplId+'" something went wrong !'
            }
        });
    });
};

/**
 * Registers a template by creating a new Template instance out of the given arguments.
 * @param templateId
 * @param panelId
 * @param config
 */
var registerTemplate = function(templateId, config) {
    _addTemplate(new Template(templateId, config));
};

/**
 * Loads the template svg as xml document for the given tmplId.
 * @param tmplId
 * @param panelId
 * @returns {bluebird|exports|module.exports}
 * @private
 */
var _loadRemoteTemplateSVG = function(tmplId, panelId) {
    return new Promise(function(resolve, reject) {
        client.text('/templates/'+panelId+'/'+tmplId+'.tmpl', {
            success : function(response) {
                _initTemplate(tmplId, response.data);
                resolve(response.data);
            },
            error : function(err) {
                reject(err);
            },
            errorMessage :  {
                404: 'Could not load template "'+tmplId+'" file was not found on the server !',
                'default': 'Could not load template "'+tmplId+'" something went wrong !'
            }
        });
    });

};

var _initTemplate = function(tmplId, tmplStr) {
    templates[tmplId].init(tmplStr);
};

/**
 * Registers a new panel.
 * @param cfg
 */
var registerPanel = function(cfg) {
  if(cfg.id) {
      panels[cfg.id] = cfg;
      event.trigger(EVENT_PANEL_LOADED, cfg);
  }
};

var _createTemplate = function(tmplId, tmplRootEl) {
    return _addTemplate(new Template(tmplId, true, tmplRootEl));
};

var _addTemplate = function(tmpl) {
    templates[tmpl.id] = tmpl;
    return tmpl;
};

var getSelectedTemplate = function() {
    return selectedTemplate;
};

var getPanel = function(panelId) {
    return panels[panelId];
}

module.exports = {
    registerPanel : registerPanel,
    registerTemplate : registerTemplate,
    getPanel: getPanel,
    getTemplate: getTemplate,
    getTemplateSync : getTemplateSync,
    getSelectedTemplate: getSelectedTemplate,
    init : function() {
        init();
        return this;
    }
};

},{"../core/client":3,"../core/event":7,"../util/object":73,"./template":36,"bluebird":77}],38:[function(require,module,exports){
var util = require('../util/util');
var event = require('../core/event');
var config = require('../core/config');

var Eventable = require('./eventable');

var TransitionKnobManager = require('./transitionKnobManager');
var TransitionDockingManager = require('./transitionDockingManager');
var TransitionPathManager = require('./curvedPathManager');
var transitionAdditions = require('./transitionAdditions');

var pathManagerFactory = require('./pathManagerFactory');

var STYLE_TRANSITION_ACTIVE = "stroke:blue;stroke-width:1;fill:none;";
var STYLE_TRANSITION_INACTIVE = "stroke:black;stroke-width:1;fill:none;";
var STYLE_AREA = "stroke:grey;stroke-opacity:0.0;stroke-width:11;fill:none;";

var object = util.object;
var dom = util.dom;

var Transition = function(node, startPosition) {
    if(node.isNode) {
        this.diagram = node.diagram;
        this.event = this.diagram.event;
        this.svg = this.diagram.svg;
        this.init(node, startPosition);
    } else { //node = diagram, startPosition = domGroup of transition
        this.diagram = node;
        this.event = this.diagram.event;
        this.svg = this.diagram.svg;
        this.activate(startPosition);
    }
};

util.inherits(Transition, Eventable);

Transition.prototype.getPath = function() {
    return this.pathManager.path;
};

Transition.prototype.type = function(value) {
    if(value && value !== this.pathManager.type) {
        var newPathManager = pathManagerFactory.get(this, value);
        if(newPathManager) {
            newPathManager.replace(this.pathManager, this.knobManager.getKnobPositions());
            this.update();
        }
    } else {
        return this.pathManager.type;
    }
};

Transition.prototype.activate = function(domGroup) {
    this.root = this.group = $.svg(domGroup);
    this.id = this.group.attr('id');

    transitionAdditions.init(this);

    //Remove all existing knobs (except orientation knobs)
    this.group.$().children('.knob').remove();

    //Get line and linearea from dom
    this.getLine();
    this.getLineArea();
    this.lineArea.d(this.line.d());

    //Init Manager
    this.dockingManager = new TransitionDockingManager(this).activate();
    this.pathManager = pathManagerFactory.get(this, this.group.dala('transitionType')).activate();
    this.knobManager = new TransitionKnobManager(this).activate();
    this.initEvents();
    return this;
};

Transition.prototype.getLine = function() {
    if(!this.line && this.group) {
        this._setLine(this.getInnerSVG('line'));
    }
    return this.line;
};

Transition.prototype.getLineArea = function() {
    if(!this.lineArea && this.group) {
         this._setLineArea(this.getInnerSVG('lineArea'));
    }
    return this.lineArea;
};

Transition.prototype._setLineArea = function(svgLineArea) {
    this.lineArea = this.eventBase = svgLineArea;
};

Transition.prototype._setLine = function(svgLine) {
    this.line = svgLine;
};

/**
 * Initializes a new transition by creating the svg nodes and startdocking
 *
 * @param {type} mouse
 */
Transition.prototype.init = function(node, mouse) {
    //TODO: user UUID.new or something
    this.id = this.diagram.uniqueId();
    //Initializes the transition group container
    this.initSVGGroup();

    transitionAdditions.init(this);

    //Initialize the transition docking mechanism (start/end) docking to nodes.
    this.dockingManager = new TransitionDockingManager(this, node, mouse);
    //Initialize the path creator which creates the path with the help of the knobs and a given transitiontype.
    this.pathManager = pathManagerFactory.get(this);
    this.group.dala('transitionType', this.pathManager.type);

    //Initialize the transition knob mechanism for (start/end) and inner knobs for manipulating transitions
    this.knobManager = new TransitionKnobManager(this);

    //Calculate start position for outer orientation (mouse position)
    var startDockingPosition = this.dockingManager.calculateStart(mouse);

    //Init knob for startPosition
    this.exec('setStartNode', [node]);

    //Create SVG Elements in dom and transition events
    this.initTransitionSVG();
    this.initEvents();
    this.update(mouse);
    return this;
};

Transition.prototype.initSVGGroup = function() {
    this.root = this.group = this.svg.g({"class":'transition', 'xmlns:dala':"http://www.dala.com", id : this.id});
};

Transition.prototype.getStartAlignment = function() {
    var result = {source:[this.dockingManager.startDocking.position()]};
    if(!this.knobManager.hasInnerKnobs()) {
        result.target = [this.dockingManager.endDocking.position()];
    } else {
        result.target = [this.knobManager.getKnob(1).position()];
    }
    return result;
};

Transition.prototype.getEndAlignment = function() {
    var result = {source:[this.dockingManager.endDocking.position()]};
    if(!this.knobManager.hasInnerKnobs()) {
        result.target = [this.dockingManager.startDocking.position()];
    } else {
        result.target = [this.knobManager.getKnob(-2).position()];
    }
    return result;
};

Transition.prototype.getStartNode = function() {
    return this.dockingManager.startNode;
};

Transition.prototype.getEndNode = function() {
    return this.dockingManager.endNode;
};

Transition.prototype.start = function() {
    return this.knobManager.start();
};

Transition.prototype.end = function() {
    return this.knobManager.end();
};


Transition.prototype.getStartLocation = function() {
    return this.dockingManager.startNode.getRelativeLocation(this.start());
};

Transition.prototype.getEndLocation = function() {
    return this.dockingManager.endNode.getRelativeLocation(this.end());
};

Transition.prototype.dragStartOrientation = function(dx, dy) {
    this.dockingManager.dragStartOrientation(dx, dy);
};

Transition.prototype.dragEndOrientation = function(dx, dy) {
    this.dockingManager.dragEndOrientation(dx, dy);
};

Transition.prototype.strokeWidth = function(value) {
    var result = this.line.strokeWidth(value);
    if(value) {
        this.lineArea.strokeWidth(value + 11);
    }
    return result;
};

Transition.prototype.getInnerSVG = function(prefix) {
    return $.svg(this.getTransitionSelector(prefix));
};

Transition.prototype.initTransitionSVG = function() {
    var path = this.pathManager.path;

    //Note we share the path between line and lineArea an update
    this._setLine(this.svg.path({
        d : path,
        id : 'line_'+this.id,
        style  : STYLE_TRANSITION_ACTIVE
    }));

    this._setLineArea(this.svg.path({
        d : path,
        id: 'lineArea_'+this.id,
        style  : STYLE_AREA
    }));

    //TODO: make this configurable in node template or something !!!
    this.endMarker('trianglefill');

    this.group.prepend(this.lineArea, this.line);
};

Transition.prototype.initEvents = function() {
    var that = this;
    this.lineArea.hoverable({
        in: function() {
            that.hover();
        },
        out: function() {
            that.hoverOut();
        }
    });

    this.on('mousedown', function(evt) {
        evt.preventDefault();
        evt.stopPropagation();

        if(!that.selected) {
            that.select();
        }

        var dragInitiated = false;
        var startPosition = that.diagram.getStagePosition(evt);
        var knobIndex = that.pathManager.getIndexForPosition(startPosition);

        if (knobIndex) {
            event.once(document, "mouseup", function(evt) {
                that.diagram.off('mousemove');
            });
            that.diagram.on("mousemove", function(event) {
                var movePosition = that.diagram.getStagePosition(event.pageX, event.pageY);

                //We just start the drag event in case we move more thant 5px away
                if(!dragInitiated && util.app.isMinDist(startPosition, movePosition, 5)) {
                    var knob = that.knobManager.addKnob(startPosition, knobIndex);
                    knob.initDrag();
                    dragInitiated = true;
                }
            });
        }
    }).on('dblclick', function(evt) {
        var startPosition = that.diagram.getStagePosition(evt);
        var pointOnLine = that.pathManager.getNearestPoint(startPosition);
        var knobIndex = that.pathManager.getIndexForPosition(startPosition);
        var knob = that.knobManager.addKnob(pointOnLine, knobIndex);
    });
};

Transition.prototype.addKnob = function(position, index) {
    if(!this.isInitState()) {
        index = index || 1;
        var knob = this.knobManager.addKnob(position, index);
        this.exec('knob_add', [index, position]);
        this.update();
        return knob;
    }
};

Transition.prototype.ownsKnobNode = function(knobNode) {
    return this.knobManager.ownsKnobNode(knobNode);
};

Transition.prototype.update = function(mouse) {
    this.updateEnd(mouse);
    this.updateStart(mouse);
    this.redraw();
    this.exec('update',[], true);
};

Transition.prototype.redraw = function() {
    if(this.line && this.lineArea) {
        this.line.update();
        this.lineArea.update();
    }
};

Transition.prototype.getSelectedKnobs = function() {
    return this.knobManager.getSelectedKnobs();
}

Transition.prototype.updateStart = function(mouse) {
    var outerOrientation = mouse || this.knobManager.getPosition(1);
    this.knobManager.updateStartKnob(this.dockingManager.calculateStart(outerOrientation));
};

Transition.prototype.updateEnd = function(mouse) {
    if(this.isInitState()) {
        mouse = this.alignEndPositionForMouse(mouse);
        this.pathManager.dragLine(mouse);
    } else {
        var outerOrientation = this.knobManager.getPosition(-2);
        this.knobManager.updateEndKnob(this.dockingManager.calculateEnd(outerOrientation));
    }
};

Transition.prototype.isInitState = function() {
    return !this.dockingManager.endNode;
};

Transition.prototype.alignEndPositionForMouse = function(mouse) {
    //This prevents the line rendering to overlap the exact mouse position
    return {
        x : (this.knobManager.startKnob.x() < mouse.x) ? mouse.x - 1 : mouse.x + 1,
        y : (this.knobManager.startKnob.y() < mouse.y) ? mouse.y - 1 : mouse.y + 1
    };
};

Transition.prototype.setStartNode = function(node) {
    this.exec('setStartNode', [node]);
    if(!this.isInitState()) {
        this.checkDomPosition();
    }
    this.update();
};

Transition.prototype.setEndNode = function(node, mousePosition) {
    this.exec('setEndNode', [node, mousePosition]);
    this.checkDomPosition();
    this.update();
};

Transition.prototype.checkDomPosition = function() {
    var maxNodeIndex = Math.max(this.dockingManager.startNode.index(), this.dockingManager.endNode.index());
    var transitionIndex = this.index();

    if(transitionIndex < maxNodeIndex) {
        dom.insertAfterIndex(this.group.instance(), maxNodeIndex);
    }
};

Transition.prototype.remove = function() {
    this.removed = true;
    this.group.remove();
    this.dockingManager.remove();
};

Transition.prototype.index = function() {
    return this.group.$().index();
};

Transition.prototype.instance = function() {
    if(this.group) {
        return this.group.instance();
    }
};

Transition.prototype.endMarker = function(marker) {
    return this.marker('end', marker);
};

Transition.prototype.endMarkerValue = function() {
    return this.markerValue('end');
};

Transition.prototype.startMarker = function(marker) {
    return this.marker('start', marker);
};

Transition.prototype.startMarkerValue = function() {
    return this.markerValue('start');
};

Transition.prototype.marker = function(type, marker) {
    var key = 'marker-'+type;
    if(util.object.isDefined(marker)) {
        this.line.attr(key, this.getMarkerValueString(marker));
    } else {
        var markerStr = this.line.attr(key);
        if(markerStr) {
            return markerStr.substring(5, markerStr.length - 1);
        }
    }
};

Transition.prototype.selector = function(prefix) {
    var stringSelector;
    if(object.isArray(prefix)) {
        stringSelector = [];
        var that = this;
        object.each(prefix, function(index, val) {
            stringSelector.push(that.selector(val));
        });
        stringSelector = stringSelector.join(', ');
    } else {
        stringSelector = prefix;
    }
    return this.getTransitionSelector(stringSelector);
};

Transition.prototype.getTransitionSelector = function(prefix) {
    var result = '';

    if(!util.string.startsWith(prefix, '#') && !util.string.startsWith(prefix, '.')) {
        result = '#'+prefix;
    } else {
        result = prefix;
    }

    return util.string.endsWith(prefix, '_')
        ? result + this.id
        : result + '_' + this.id;
};

Transition.prototype.markerValue = function(type, marker) {
    var markerString = this.marker(type, marker);
    if(markerString) { // triangle_s_12312423 --> triangle_s
        return markerString.substring(0, markerString.length - this.diagram.id.length - 1);
    }
};

Transition.prototype.getMarkerValueString = function(markerId) {
    markerId = (util.string.endsWith(markerId, this.diagram.id)) ? markerId : markerId + '_' + this.diagram.id;
    return 'url(#' + markerId + ')';
};

Transition.prototype.select = function() {
    this.selected = true;
    this.activeStyle();
    this.exec('select');
};

Transition.prototype.hover = function() {
    this.exec('hover');
};

Transition.prototype.hoverOut = function() {
    this.exec('hoverOut');
};

Transition.prototype.activeStyle = function() {
    this.line.attr({style:STYLE_TRANSITION_ACTIVE});
};

Transition.prototype.deselect = function() {
    this.inactiveStyle();
    this.selected = false;
    this.exec('deselect');
};

Transition.prototype.inactiveStyle = function() {
    this.line.attr({style:STYLE_TRANSITION_INACTIVE});
};

Transition.prototype.toString = function() {
    return this.group.toString();
};

module.exports = Transition;
},{"../core/config":6,"../core/event":7,"../util/util":75,"./curvedPathManager":15,"./eventable":22,"./pathManagerFactory":30,"./transitionAdditions":40,"./transitionDockingManager":41,"./transitionKnobManager":42}],39:[function(require,module,exports){
var object = require('../util/object');
var event = require('../core/event');
var Transition = require('./transition');

/**
 * The transitionaddition for nodes is responsible for creating and updating/rendering the incoming and outgoing
 * transitions of a node.
 *
 * @param node
 * @constructor
 */
var TransitionAddition = function(node) {
    this.node = node;
    this.event = node.event;
    this.diagram = this.node.diagram;
    this.transitionMgr = this.diagram.transitionMgr;
    this.outgoingTransitions = [];
    this.incomingTransitions = [];
};

TransitionAddition.prototype.dragMove = function(dx, dy) {
    this.updateOrientations(dx ,dy);
    this.update();
};

TransitionAddition.prototype.updateOrientations = function(dx ,dy) {
    this.executeOnOutgoingTransitions(function(transition) {
        transition.dragStartOrientation(dx,dy);
    });

    this.executeOnIncomingTransitions(function(transition) {
        transition.dragEndOrientation(dx,dy);
    });
};

TransitionAddition.prototype.resize = function() {
    this.update();
};

TransitionAddition.prototype.update = function() {
    this.executeOnAllTransitions(function(transition) {
        transition.update();
    });
};

TransitionAddition.prototype.remove = function() {
    this.executeOnAllTransitions(function( transition) {
        transition.remove();
    });
};

TransitionAddition.prototype.moveUp = function() {
    this.executeOnAllTransitions(function(transition) {
        transition.checkDomPosition();
    });
};

/**
 * Node dbclick triggers the creation of a transition.
 */
TransitionAddition.prototype.dbclick = function(evt) {
    this.startNewTransition(undefined, this.diagram.getStagePosition(evt));
};

/**
 * This function starts a new transition either by providing a endNode or by using the transitiondrag
 * @param endNode
 */
TransitionAddition.prototype.startNewTransition = function(endNode, mouse) {
    if(this.transitionMgr.isDragTransition()) {
        return this.diagram.transitionMgr.getDragTransition();
    }

    var transition = this.transitionMgr.startDragTransition(this.node, mouse);

    if(!endNode) {
        //If no endNode was provided we start the mouse listener for the transitiondrag
        var that = this;
        event.on(this.diagram.svg.getRootNode(), "mousemove", function(event) {
            that.transitionDrag(event, true);
        });
    } else {
        //If an endNode was provided we imitate the transitiondrag and set the endNode
        this.transitionDrag(endNode.getCenter());
        endNode.additions.transition.endTransitionDrag();
    }

    return transition;
};

TransitionAddition.prototype.transitionDrag = function(mouse, isEvt) {
    mouse = (isEvt)? this.diagram.getStagePosition(mouse) : mouse;
    //Update the current dragTransition
    this.transitionMgr.getDragTransition().update(mouse);
};

/**
 * Node mousedown ends a transitionDrag even (if there is one) and sets this node as endnode
 */
TransitionAddition.prototype.mousedown = function(evt) {
    // Stop transition drag event and set end node
    if(this.transitionMgr.isDragTransition()) {
        this.endTransitionDrag(evt);
    }
};

TransitionAddition.prototype.endTransitionDrag = function(mouseEvt) {
    mouseEvt = mouseEvt || this.node.getCenter();
    var transition = this.transitionMgr.getDragTransition();
    transition.setEndNode(this.node, this.diagram.getStagePosition(mouseEvt));
    this.transitionMgr.endDragTransition();
    event.off(this.diagram.svg.getRootNode(), 'mousemove');
};

TransitionAddition.prototype.ownsTransition = function(transition) {
    var result = false;
    $.each(this.outgoingTransitions, function(index, value) {
        if(object.isString(transition) && value.id === transition) {
            result = true;
            return false; //exit each loop
        } else if(value.id === transition.id) {
            result = true;
            return false; //exit each loop
        }
    });

    if(!result) {
        $.each(this.incomingTransitions, function(index, value) {
            if(object.isString(transition) && value.id === transition) {
                result = true;
                return false; //exit each loop
            } else if(value.id === transition.id) {
                result = true;
                return false; //exit each loop
            }
        });
    }

    return result;
};

TransitionAddition.prototype.addOutgoingTransition = function(transition) {
    this.outgoingTransitions.push(transition);
    return transition;
};

TransitionAddition.prototype.undockStart = function(transition) {
    this.edgeDockingDragListener(transition, 'Start');
};

TransitionAddition.prototype.undockEnd = function(transition) {
    this.edgeDockingDragListener(transition, 'End');
};

TransitionAddition.prototype.undockEdgeDocking = function(transition, dockingType) {
    var that = this;
    //We wait till the drag event stops (mouseup)
    event.once(this.diagram.svg.getRootNode(), "mouseup", function(mouseUpEvent) {
        var mouse = that.diagram.getStagePosition(mouseUpEvent);
        var hoverNode = that.diagram.overlaysNode(mouse);
        if(hoverNode !== transition['get'+dockingType+'Node']()) {
            //If we are hovering another node we swap start/end node
            transition['set'+dockingType+'Node'](hoverNode);
        } else if(hoverNode === transition['get'+dockingType+'Node']()){
            //If we are hovering the same node we set a relative docking
            transition['setRelative'+dockingType+'Knob'](mouse.x, mouse.y);
            transition.update();
        } else {
            //Mouse is hovering empty space
            transition.update();
        }
    });
};

TransitionAddition.prototype.executeOnAllTransitions = function(handler) {
    this.executeOnOutgoingTransitions(handler);
    this.executeOnIncomingTransitions(handler);
};

TransitionAddition.prototype.executeOnOutgoingTransitions = function(handler) {
    object.each(this.outgoingTransitions, function(index, transition) {
        if(transition) {
            handler(transition);
        }
    });
};

TransitionAddition.prototype.executeOnIncomingTransitions = function(handler) {
    object.each(this.incomingTransitions, function(index, transition) {
        if(transition) {
            handler(transition);
        }
    });
};

TransitionAddition.prototype.getTransitionAlignmentTargets = function() {
    var result = [];
    object.each(this.outgoingTransitions, function(index, transition) {
        if(object.isDefined(transition)) {
            result.push(transition.getStartAlignment());
        }
    });

    object.each(this.incomingTransitions, function(index, transition) {
        if (object.isDefined(transition)) {
            result.push(transition.getEndAlignment());
        }
    });
    return result;
};

TransitionAddition.prototype.removeOutgoingTransition = function(transition) {
    var index = this.outgoingTransitions.indexOf(transition);
    if (index !== -1) {
        this.outgoingTransitions.splice(index, 1);
    }
};

TransitionAddition.prototype.addIncomingTransition = function(transition) {
    this.incomingTransitions.push(transition);
};

TransitionAddition.prototype.removeIncomingTransition = function(transition) {
    var index = this.incomingTransitions.indexOf(transition);
    if (index !== -1) {
        this.incomingTransitions.splice(index, 1);
    }
};

TransitionAddition.requireConfig = false;

module.exports = TransitionAddition;


},{"../core/event":7,"../util/object":73,"./transition":38}],40:[function(require,module,exports){
var additions = require('./additions');

//Init default additions
additions.registerTransitionAddition('text', require('./transitionTextAddition'));
additions.registerTransitionAddition('edit', require('./editTransitionAddition'));

module.exports = {
    init : function(transition) {
        additions.initTransitionAddition('text', transition);
        additions.initTransitionAddition('edit', transition);
    }
};
},{"./additions":13,"./editTransitionAddition":21,"./transitionTextAddition":44}],41:[function(require,module,exports){
var util = require('../util/util');
var Knob = require('./Knob');
var dockingType = require('./docking');

var TransitionDocking = function(dockingManager, node, mouse, type) {
        this.node = node;
        this.type = type;
        this.transition = dockingManager.transition;
        this.dockingManager = dockingManager;
        if(!node.knob) {
            this.initOrientation(mouse);
        }
};

TransitionDocking.prototype.initOrientation = function(startPosition) {
    var orientationPosition = _getStartOrientationPosition(this.node, startPosition);
    this.knob = new Knob(this.transition.diagram, orientationPosition, {'cssClass':'orientationKnob', 'fill-active':'orange', fill:'orange', selectable:false}, this.transition.group);
    this.initKnobEvents();
};

var _getStartOrientationPosition = function(node, mouse) {
    var orientationType = (node.config.docking && node.config.docking.orientation)
                          ? node.config.docking.orientation : 'center';
    switch(orientationType.toUpperCase()) {
        case 'FREE':
            return mouse;
        case  'CENTER':
        default:
            return node.getCenter();
    }

};

TransitionDocking.prototype.initKnobEvents = function() {
    var that = this;
    this.knob.draggable({
        restrictionX : function(evt, dx, dy) {
            var dragCenter = that.knob.position();
            dragCenter.x += dx;
            return that.node.overlays(dragCenter) ? dx : 0;
        },
        restrictionY : function(evt, dx, dy) {
            var dragCenter = that.knob.position();
            dragCenter.y += dy;
            return that.node.overlays(dragCenter) ? dy : 0;
        },
        dragAlignment : function() {
            //We align our knob center to the node center and also to our transition alignment point
            var alignment = (that.type === 'start')
                ? that.transition.getStartAlignment() : that.transition.getEndAlignment();
            alignment.target.push(that.node.getCenter());
            return [alignment];
        },
        dragMove : function(evt, dx ,dy) {
            that.transition.update();
        }
    });
};

TransitionDocking.prototype.position = function(withStroke) {
    if(this.knob) {
        return this.knob.position();
    } else {
        return this.node.getCenter();
    }
};

TransitionDocking.prototype.triggerDrag = function(dx, dy) {
    if(this.knob) {
        this.knob.triggerDrag(dx, dy);
    }
};

TransitionDocking.prototype.calculateDockingPosition = function(outerOrientation) {
    if(this.node.knob) {
        return this.node.getCenter();
    }
    return dockingType.calculateDockingPosition(this.node, outerOrientation, this.position());
};

TransitionDocking.prototype.inactiveStyle = function() {
    if(this.knob) {
        this.knob.inactiveStyle();
    }
};

TransitionDocking.prototype.hide = function() {
    if(this.knob) {
        this.knob.hide();
    }
};

TransitionDocking.prototype.remove = function() {
    if(this.knob) {
        this.knob.remove();
    }
};

var TransitionDockingManager = function(transition, startNode, mouse) {
    this.diagram = transition.diagram;
    this.transition = transition;

    if(startNode) {
        this.setStartNode(startNode, mouse);
    }

    var that = this;
    this.transition.additions['dockingManager'] = {
        setEndNode : function(node, mousePosition) {
            that.setEndNode(node, mousePosition);
        },
        setStartNode : function(node) {
            that.setStartNode(node);
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

TransitionDockingManager.prototype.activate = function() {
    var currentOrientationNodes = this.transition.group.$().children('.orientationKnob');
    this.setStartNode(this.diagram.getNodeById(this.getStartNodeFeature()));
    this.setEndNode(this.diagram.getNodeById(this.getEndNodeFeature()));
    var that = this;
    $.each(currentOrientationNodes, function(index, orientationNode) {
        var svgNode = $.svg(orientationNode);
        if(that.startNode.overlays(svgNode.position())) {
            that.startDocking.knob.moveTo(svgNode.position());
        } else if(that.endNode.overlays(svgNode.position())) {
            that.endDocking.knob.moveTo(svgNode.position());
        } else {
            console.warn('Detected orientation knob not hovering a start/end node.');
        }
        svgNode.remove();
    });
    return this;
};

TransitionDockingManager.prototype.setStartNode = function(node, mousePosition) {
    if(this.startNode && this.startNode.id === node.id) {
        return;
    } else if(this.startNode) {
        this.startNode.removeOutgoingTransition(this.transition);
    }

    if(this.startDocking) {
        this.startDocking.remove();
    }

    this.startNode = node;
    this.startNode.addOutgoingTransition(this.transition);
    this.startDocking = new TransitionDocking(this, node, mousePosition, 'start');
    this.setStartNodeFeature();
};

TransitionDockingManager.prototype.getStartNodeFeature = function() {
    return this.transition.group.dala('start');
};

TransitionDockingManager.prototype.setStartNodeFeature = function() {
    this.transition.group.dala('start', this.startNode.id);
};

TransitionDockingManager.prototype.calculateStart = function(outerOrientation) {
    return this.startDocking.calculateDockingPosition(outerOrientation);
};

TransitionDockingManager.prototype.dragStartOrientation = function(dx,dy) {
    this.startDocking.triggerDrag(dx,dy);
};

TransitionDockingManager.prototype.setEndNode = function(node, mousePosition) {
    if(this.endNode) {
        this.endNode.removeIncomingTransition(this.transition);
    }

    if(this.endDocking) {
        this.endDocking.remove();
    }

    this.endNode = node;
    this.endNode.addIncomingTransition(this.transition);
    this.endDocking = new TransitionDocking(this, node, mousePosition, 'end');
    this.setEndNodeFeature();
};

TransitionDockingManager.prototype.dragEndOrientation = function(dx,dy) {
    this.endDocking.triggerDrag(dx,dy);
};

TransitionDockingManager.prototype.calculateEnd = function(outerOrientation) {
    return this.endDocking.calculateDockingPosition(outerOrientation);
};

TransitionDockingManager.prototype.getEndNodeFeature = function() {
    return this.transition.group.dala('end');
};


TransitionDockingManager.prototype.setEndNodeFeature = function() {
    if(this.endNode) {
        this.transition.group.dala('end', this.endNode.id);
    }
};

TransitionDockingManager.prototype.inactiveStyle = function() {
    this.startDocking.inactiveStyle();
    if(this.endDocking) {
        this.endDocking.inactiveStyle();
    }
};

TransitionDockingManager.prototype.hide = function() {
    this.startDocking.hide();
    if(this.endDocking) {
        this.endDocking.hide();
    }
};

TransitionDockingManager.prototype.remove = function() {
    if(this.startNode) {
        this.startNode.removeOutgoingTransition(this.transition);
        this.startDocking.remove();
    }

    if(this.endNode) {
        this.endNode.removeIncomingTransition(this.transition);
        this.endDocking.remove();
    }
};

module.exports = TransitionDockingManager;
},{"../util/util":75,"./Knob":9,"./docking":17}],42:[function(require,module,exports){
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
    var polynoms = this.transition.getLine().d().polynoms();
    for(var i = 0; i < polynoms.length; i++) {
        var to = polynoms[i];
        this.addKnob(to, i, true, (i === 0 || i === polynoms.length - 1));
    }
    return this;
};

TransitionKnobManager.prototype.addKnob = function(position, index, activate, isBoundaryKnob) {
    var index = index || this.size();
    var isBoundaryKnob = (!activate)? this.isInitState() : isBoundaryKnob;
    var knob = this.initKnob(index, position, isBoundaryKnob);
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

TransitionKnobManager.prototype.initKnob = function(knobIndex, position, isBoundaryKnob) {
    var that = this;
    var knobConfig = {
        radius:5,
        selectable: !isBoundaryKnob,
        fill:       isBoundaryKnob ? 'green' : 'silver'
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

TransitionKnobManager.prototype.getJoiningDockings = function(docking) {
    var index = this.getIndexForKnob(docking);
    return [this.knobs[index - 1], this.knobs[index + 1]];
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
}

TransitionKnobManager.prototype.isInitState = function() {
    return !this.endKnob;
}

module.exports = TransitionKnobManager;
},{"../core/event":7,"../util/util":75,"./dragAlignment":18,"./knob":24}],43:[function(require,module,exports){
var util = require('../util/util');
var object = require('../util/object');
var xml = require('../util/xml');
var event = require('../core/event');
var Transition = require('./transition');

var AbstractManager = require('./abstractManager');

var EVT_TRANSITION_ADDED = "transition_added";
var EVT_TRANSITION_SELECTED = 'transition_selected';
var EVT_TRANSITION_DESELECTED = 'transition_deselected';
var EVT_TRANSITION_REMOVED = 'transition_removed';

var CMD_ADD = "transition_add";
var CMD_DEL = "transition_delete";
var CMD_KNOB_ADD = "transition_knob_added";
var CMD_KNOB_DROP = "transition_knob_dropped";
var CMD_EDIT = "transition_edit";

var TransitionManager = function(diagram) {
    // Contains all nodes added to the diagram
    AbstractManager.call(this, diagram);

    this.transitions = {};
    this.diagram = diagram;
    event.listen('transition_delete', this.deleteTransitionListener, this);
    event.listen('transition_edit', this.editTransitionListener, this);

    this.command(CMD_ADD, this.importTransition, this.deleteTransition);
    this.command(CMD_DEL, this.deleteTransition, this.importTransition);
    this.command(CMD_KNOB_ADD, this.addKnob, this.deleteKnob);
    this.command(CMD_KNOB_DROP, this.dropDocking, this.dropDocking);
    this.command(CMD_EDIT, this.editTransition, this.undoEdit);
};

util.inherits(TransitionManager, AbstractManager);

TransitionManager.prototype.editTransitionListener = function(evt) {
    var transition = this.getTransition(evt.data.transition);
    var key = evt.data.key;
    var oldValue = transition.additions.edit.getValue(key);
    this.exec(CMD_EDIT, [transition.id, key, evt.data.value], [transition.id, key, oldValue]);
};

TransitionManager.prototype.editTransition = function(transition, key, value) {
    transition = this.getTransition(transition);
    transition.additions.edit.setValue(key, value);
    event.trigger('transition_edited', transition);
};

TransitionManager.prototype.undoEdit = function(transition, key, value) {
    transition = this.getTransition(transition);
    transition.additions.edit.setValue(key, value);
    event.trigger('transition_edit_undo', transition);
};

TransitionManager.prototype.importTransition = function(transitionStr, cfg) {
    var cfg = cfg || {};

    //If set we replace the old node id with a new one e.g. when we copy a node
    if(cfg.newId && cfg.oldId) {
        transitionStr = transitionStr.replace(new RegExp(cfg.oldId, 'g'), cfg.newId);
    }

    var transitionElement = this.diagram.import(transitionStr);
    return this.activateTransition(transitionElement);
};

TransitionManager.prototype.activateTransition = function(toActivate) {
    if(object.isArray(toActivate)) {
        var result = [];
        var that = this;
        object.each(toActivate, function() {
            result.push(that.activateTransition($(this).get(0)));
        });
        return result;
    } else  { //toActivate is domElement
        return this.addTransition(new Transition(this.diagram, toActivate));
    }
};

TransitionManager.prototype.isDragTransition = function(transition) {
    return object.isDefined(this.dragTransition);
};

TransitionManager.prototype.startDragTransition = function(node, mouse) {
    mouse = mouse || node.getCenter();
    return this.dragTransition = new Transition(node, mouse);
};

TransitionManager.prototype.getDragTransition = function() {
    return this.dragTransition;
};

TransitionManager.prototype.endDragTransition = function() {
    var that = this;
    this.addTransition(this.dragTransition);
    delete this.dragTransition;
};

TransitionManager.prototype.addTransition = function(transition) {
    var that = this;
    this.event.trigger(EVT_TRANSITION_ADDED, transition);

    transition.on('select', function() {
        that.event.trigger(EVT_TRANSITION_SELECTED, transition);
    }).on('deselect', function() {
        that.event.trigger(EVT_TRANSITION_DESELECTED, transition);
    }).on('remove', function() {
        that.event.trigger(EVT_TRANSITION_REMOVED, transition);
    }).on('knob_add', function(evt , knobIndex, position) {
        that.addCmd(CMD_KNOB_ADD, [transition.id, knobIndex, position], [transition, knobIndex]);
    }).on('knob_drop', function(evt , knobIndex) {
        var knob = transition.knobManager.getKnob(knobIndex);
        //TODO: perhaps rather use dragContext note: api call in transitionknobmanager
        that.addCmd(CMD_KNOB_DROP,
            [transition.id, knobIndex, knob.node.root.dxSum, knob.node.root.dySum],
            [transition.id, knobIndex, (-1 * knob.node.root.dxSum), (-1 * knob.node.root.dySum)]);
    });

    this.addCmd(CMD_ADD, [this.getTransitionString(transition)], [transition.id]);
    return this.transitions[transition.id] = transition;
};

TransitionManager.prototype.addKnob = function(transition, knobIndex, position) {
    this.getTransition(transition).addKnob(position,knobIndex);
};

TransitionManager.prototype.deleteKnob = function(transition, dockingIndex) {
    this.getTransition(transition).knobManager.getKnob(dockingIndex).remove();
};

TransitionManager.prototype.dropDocking = function(transition, dockingIndex, dxSum, dySum) {
    transition = this.getTransition(transition);
    if(transition) {
        var docking = transition.knobManager.getKnob(dockingIndex);
        docking.triggerDrag(dxSum, dySum);
    }
};

TransitionManager.prototype.transitionDockingCreated = function(transition, dockingIndex) {
    var transition = evt.data.transition;
    var dockingIndex = evt.data.dockingIndex;

};

TransitionManager.prototype.getTransitionString = function(transition) {
    transition = this.getTransition(transition);
    return xml.serializeToString(transition.instance());
};

TransitionManager.prototype.deleteTransitionListener = function(evt) {
    if(evt.data) {
        var transition = evt.data;
        this.exec(CMD_DEL, [transition.id], [this.getTransitionString(transition)]);
    }
};

TransitionManager.prototype.deleteTransition = function(id) {
    var transition = this.getTransition(id);
    if(transition) {
        delete this.transitions[id];
        transition.remove();
    }
};

TransitionManager.prototype.getTransition = function(id) {
    if(object.isString(id) && !isNaN(id)) {
        return this.transitions[parseInt(id)];
    } else if(!isNaN(id)) {
        return this.transitions[id];
    } else if(id instanceof Transition) {
        //We assume a node instance
        return id;
    } else {
        console.warn('getTransition call with no result for :'+id);
    }
};

module.exports = TransitionManager;
},{"../core/event":7,"../util/object":73,"../util/util":75,"../util/xml":76,"./abstractManager":11,"./transition":38}],44:[function(require,module,exports){
var util = require('../util/util');
var object = util.object;

var NODE_DISTANCE = 11;
var TRANSITION_DISTANCE = 10;
var DEF_TEXT_HEIGHT = 13;

var TransitionTextAddition = function(transition) {
    this.textNodes = [];
    this.transition = transition;
    this.diagram = this.transition.diagram;
};

/**
 * The update addition function rerenders all containing textnodes by means
 * of the current transition settings. This function is delegated by
 * the transition as addition call.
 */
TransitionTextAddition.prototype.update = function() {
    var that = this;
    object.each(this.textNodes, function(index, textSVG) {
        if(textSVG) {
            that.updateTextPosition(index);
        }
    });
};

TransitionTextAddition.prototype.getText = function(pos) {
    if(this.textNodes[pos]) {
        return this.textNodes[pos].$().text();
    }
};

/**
 * Sets the text for a given position. If the given text position is not
 * occupied yet we create a new textnode.
 */
TransitionTextAddition.prototype.setText = function(pos, text) {
    if(!this.textNodes[pos]) {
        var id = 'text'+pos+'_'+this.transition.id;
        var textNode = this.textNodes[pos] = this.diagram.svg.text(text, {id : id}).hanging(false);
        this.diagram.svg.addToGroup(this.transition.group, textNode);
    } else {
        this.textNodes[pos].content(text);
    }
    this.updateTextPosition(pos);
};

/**
 * Updates the textnode position and anchor for the given position by means of the current
 * transition settings.
 */
TransitionTextAddition.prototype.updateTextPosition = function(pos) {
    var position = this.getTextPosition(pos);

    //For some points the position cannot be determined mainly on the node corner
    if(position) {
        this.textNodes[pos].moveTo(position);
        this.setAnchor(pos);
    }
};

TransitionTextAddition.prototype.getTextPosition = function(pos) {
    var textPosition;

    var textHeight = this.getTextHeight(pos);

    if(isStartPos(pos) || isEndPos(pos)) {
        //Move along the transition in the right direction the index -1 searches the last transitionPart
        var index = isEndPos(pos) ? -1 : 1;
        var distance = isEndPos(pos) ? NODE_DISTANCE * -1 : NODE_DISTANCE;
        textPosition = this.transition.getPath().moveAlong(index, distance);

        switch(this.getLocation(pos)) {
            case 'left':
            case 'right':
                textPosition.y += (isTop(pos)) ? -TRANSITION_DISTANCE : TRANSITION_DISTANCE + (textHeight);
                break;
            case 'top':
            case 'bottom':
                textPosition.x += (isTop(pos)) ? TRANSITION_DISTANCE : -TRANSITION_DISTANCE;
                break;
        }
    } else {
        //Mid Position
        textPosition = this.transition.getPath().getCenter();
        textPosition.y += isTop(pos) ? TRANSITION_DISTANCE * -1 : TRANSITION_DISTANCE + textHeight;
    }

    return textPosition;
};

TransitionTextAddition.prototype.getTextHeight = function(pos) {
    return (this.textNodes[pos]) ? this.textNodes[pos].height() : DEF_TEXT_HEIGHT;
};

TransitionTextAddition.prototype.getAlignPosition = function(pos) {
    if(isStartPos(pos)) {
        return this.transition.start();
    } else if(isEndPos(pos)) {
        return this.transition.end();
    }
};

TransitionTextAddition.prototype.getLocation = function(pos) {
    if(isStartPos(pos)) {
        return this.transition.getStartLocation();
    } else if(isEndPos(pos)) {
        return this.transition.getEndLocation();
    }
};

/**
 * This function determines the text-anchor by means of the current
 * node location to assure the text is not overlapping other texts or the
 * node itself.
 */
TransitionTextAddition.prototype.setAnchor = function(pos) {
    var textSVG = this.textNodes[pos];
    if(!isMidPos(pos)) {
        switch(this.getLocation(pos)) {
            case 'left':
                textSVG.end();
                break;
            case 'right':
                textSVG.start();
                break;
            case 'top':
            case 'bottom':
                if(isBottom(pos)) {
                    textSVG.end();
                } else {
                    textSVG.start();
                }
                break;
        }
    } else {
        textSVG.middle();
    }
};

var isBottom = function(pos) {
    return !isTop(pos);
};

var isTop = function(pos) {
    return pos % 2 === 0;
};

var isStartPos = function(pos) {
    return pos < 2;
};

var isMidPos = function(pos) {
    return !isStartPos(pos) && !isEndPos(pos);
};

var isEndPos = function(pos) {
    return pos > 3;
};

module.exports = TransitionTextAddition;

},{"../util/util":75}],45:[function(require,module,exports){
var xml = require('../util/xml');
var object = require('../util/object');

var elementCache = {};

var create = function(element, attributes, text) {
    var $element = $(document.createElement(element));

    if(attributes) {
        $.each(attributes, function (key, value) {
            $element.attr(key, value);
        });
    }

    if(text) {
        $element.text(text);
    }
    return $element;
};

var query = function(selector, cache) {
    var result;
    if(cache) {
        result = $.qCache(selector);
    } else {
        result = $(selector);
    }
    return result;
};

var getJQueryNode = function(node) {
    if(!node) {
        return;
    }
    // The node is either a dom node or a selector
    if(object.isString(node)) {
        return query(node);
    } else if(node.getAttribute){
        var id = node.getAttribute('id');
        if(id) {
            return $.qCache('#'+node.getAttribute('id'), true);
        } else {
            return $(node);
        }
    } else if(node.jQuery) {
        return node;
    } else {
        // e.g. document, window...
        return $(node);
    }
};

var moveDown = function(node) {
    var $node = getJQueryNode(node);
    $node.before($node.next());
};

var moveUp = function(node) {
    var $node = getJQueryNode(node);
    $node.after($node.prev());
};

var insertAfterIndex = function(node, index) {
    var $node = getJQueryNode(node);
    $node.parent().children().eq(index).after($node);
};

var insertSVGAfter = function(container, element, text, insertAfter) {
    text = text || element.text;
    delete element.text;
    return addSVGElement(container,element,text,insertAfter);
};

var prependSVGElement = function(container, element, text) {
    text = text || element.text;
    delete element.text;
    return addSVGElement(container,element,true,text);
};

var appendSVGElement = function(container, element, text) {
    text = text || element.text;
    delete element.text;
    return addSVGElement(container,element,false,text);
};

var prependToRoot = function(element) {
    if(!element.root.hasChildNodes()) {
        element.instance(element.root.appendChild(element.instance()));
    } else {
        element.instance(element.root.insertBefore(element.instance(), element.root.childNodes[0]));
    }
};

var addSVGElement = function(container, element, prepend, text, insertAfter) {
    prepend = (object.isDefined(prepend))? prepend : false;
    // If only the container is given we assume its an SVGElement object with contained root node
    if(object.isDefined(container) && !object.isDefined(element)) {
        element = container;
        container = container.getRootNode();
    } else if(object.isString(container)) {
        container = query(container)[0];
    } else if(container.instance) {
        container = container.instance();
    }

    var instance;

    if(!element.instance || !object.isDefined(element.instance())) {
        instance = document.createElementNS("http://www.w3.org/2000/svg", element.tagName);
        $.each(element.attributes, function(key, value) {
            instance.setAttribute(key, value.toString());
        });
    } else {
        instance = element.instance();
    }

    if(object.isDefined(text)) {
        var txtNode = document.createTextNode(text);
        instance.appendChild(txtNode);
    }
    if(object.isDefined(insertAfter)) {
        //if the parents lastchild is the targetElement...
        if(container.lastchild == insertAfter) {
            //add the newElement after the target element.
            container.appendChild(instance);
        } else {
            // else the target has siblings, insert the new element between the target and it's next sibling.
            container.insertBefore(instance, insertAfter.nextSibling);
        }
    } else if(!prepend || !container.hasChildNodes() ) {
        instance = container.appendChild(instance);
    } else {
        instance = container.insertBefore(instance,container.childNodes[0]);
    }

    if(object.isFunction(element.instance)) {
        element.instance(instance);
    } else {
        element.instance = instance;
    }

    return element;
};

var importSVG = function(container, svgXML, prepend) {
    var $svgXML, name, attributes;

    if(svgXML.jquery) {
        $svgXML = svgXML;
    } else if(object.isString(svgXML)) {
        $svgXML = $(parseXML(svgXML.trim()));
        $svgXML = $($svgXML.get(0).documentElement);
    } else {
        $svgXML = $(svgXML);
    }

    if($svgXML.nodeName) {
        name = $svgXML.nodeName;
        attributes = getAttributes($svgXML);
    } else {
        name = $svgXML.get(0).tagName;
        attributes = getAttributes($svgXML.get(0));
    }

    //We create a dummy element object
    var element = {
        tagName : name,
        attributes : attributes,
        instance : function(inst) {
            if(object.isDefined(inst)) {
                this.instanceElement = inst;
            } else {
                return this.instanceElement;
            }
        }
    };

    if(!prepend) {
        appendSVGElement(container, element, _getChildText($svgXML));
    } else {
        prependSVGElement(container, element, _getChildText($svgXML));
    }

    $svgXML.children().each(function(index, child) {
        importSVG(element.instance(), child);
    });

    return element.instance();
};

var _getChildText = function(node) {
    if(!node.jquery) {
        node = $(node);
    }

    var childText = node.contents().filter(function(){
        return this.nodeType === 3;
    });

    if(object.isDefined(childText) && childText.length > 0) {
        return childText[0].nodeValue;
    }
};

var getAttributes = function(node) {
    var result = {};
    $(node.attributes).each(function() {
        result[this.nodeName] = this.value;
    });
    return result;
};

var findIncludeSelf = function(node, selector) {
    return $(node).find(selector).andSelf().filter(selector).get(0);
};

var parseNodeXML = function(node) {
    if(!node) {
        return;
    }
    return $.parseXML($(node).text());
};

var parseXML = function(str) {
    return xml.parseXML(str);
};

var parseNodeJSON = function(node) {
    return $.parseJSON($(node).text());
};

var getRawId = function(idSelector) {
    if(!object.isString(idSelector)) {
        return;
    }

    if(idSelector.charAt(0) === '#') {
        return idSelector.substring(1, idSelector.length);
    } else {
        return idSelector;
    }
};

var getIdSelector = function(rawId) {
    if(!object.isString(rawId)) {
        return;
    }

    if (rawId.charAt(0) !== '#') {
        return '#' + rawId;
    } else {
        return rawId;
    }
};

module.exports = {
    appendSVGElement : appendSVGElement,
    prependSVGElement : prependSVGElement,
    insertSVGAfter : insertSVGAfter,
    insertAfterIndex : insertAfterIndex,
    create : create,
    prependToRoot : prependToRoot,
    importSVG : importSVG,
    moveDown : moveDown,
    moveUp : moveUp,
    findIncludeSelf : findIncludeSelf,
    parseNodeXML : parseNodeXML,
    parseNodeJSON : parseNodeJSON,
    getAttributes : getAttributes,
    getRawId : getRawId,
    getIdSelector: getIdSelector
};
},{"../util/object":73,"../util/xml":76}],46:[function(require,module,exports){
var util = require('../util/util');
var object = util.object;
var dom = util.dom;

var Element = function(tagName, cfg, attributeSetter) {
    this.attributeSetter = attributeSetter || {};
    this.attributes = {};

    if(object.isObject(tagName)) {
        cfg = tagName;
        tagName = cfg.tagName;
        delete cfg.tagName;
    }

    this.tagName = tagName;

    if(object.isObject(cfg)) {
        if(cfg.children) {
            this.children = cfg.children;
            delete cfg.children;
        }

        this.single = cfg.single || false;
        delete cfg.single;

        //We assume all remaining cfg entries are attributes
        for(var attributeKey in cfg) {
            if(cfg.hasOwnProperty(attributeKey)) {
                this._setAttribute(attributeKey, cfg[attributeKey]);
            }
        }
    }
};

Element.prototype.instance = function(instance) {
    if(object.isDefined(instance)) {
        this.domInstance = instance;
        this.tagName = instance.tagName;
        this.loadAttributes(instance);
        return this;
    } else {
        return this.domInstance;
    }
};

/**
 * Loads all attributes from the dom instance into our attribute array except already existing attributes.
 * @param instance
 */
Element.prototype.loadAttributes = function(instance) {
    this.attributes = this.attributes || {};
    var attributes = dom.getAttributes(instance);
    for(var key in attributes) {
        if(attributes.hasOwnProperty(key) && !this.attributes[key]) {
            this._setAttribute(key, attributes[key], true);
        }
    }
};

Element.prototype.id = function(newId) {
    if(object.isString(newId)) {
        this._setAttribute('id',newId);
        return this;
    } else {
        return this.attr('id');
    }
};

Element.prototype.update = function() {
    for(attributeKey in this.attributeSetter) {
        if(this.attributeSetter.hasOwnProperty(attributeKey)) {
            this.updateAttribute(attributeKey);
        }
    }
};

Element.prototype.updateAttribute = function(key) {
    this._setAttribute(key, this.attributes[key]);
};

Element.prototype._setAttribute = function(key, value, prevDomSet) {
    // If first arg is object handle its properties as attributes
    if(object.isObject(key)) {
        for(var attribute in key) {
            if(object.isDefined(attribute) && key.hasOwnProperty(attribute)) {
                this._setAttribute(attribute, key[attribute]);
            }
        }
    } else {

        // Some elementtypes can transform specific types of attributes to special objects
        // which are able to render and set the values in a special way.
        if(!this.hasClass('noParse') && object.isString(value) && object.isDefined(this.attributeSetter[key])) {
            value = this.attributeSetter[key](value);
        }

        if(!object.isDefined(value) || value.length === 0) {
            return;
        }

        // Just transform stringlits values to arrays in case its a string list
        this.attributes[key] = value;

        // Directly set it to the SVG instance if already rendered
        if(this.domInstance && !prevDomSet) {
            var val = Element.getAttributeString(value);
            this.domInstance.setAttribute(key,val);
        }
    }
};

Element.prototype.hasClass = function(searchClass) {
    if(this.domInstance) {
        //Jquery hasclass does not work with svg elements
        var elementClass = ' '+ this.attr('class')+' ';
        return elementClass.indexOf(' '+searchClass+' ') > -1;
    }
};

Element.prototype.$ = function(selector) {
    if(!this.$domInstance && this.domInstance) {
        this.$domInstance = $(this.domInstance);
    }

    return (selector) ? this.$domInstance.find(selector) : this.$domInstance;
};

Element.getAttributeString = function(value) {
    var result = '';

    if(!object.isDefined(value)) {
        return '';
    }

    if(object.isArray(value)) {
        object.each(value, function(index, part) {
            result += (++index === value.length) ? part : part+' ';
        });
    } else {
        result = value.toString();
    }
    return result;
};

Element.getAttributeValueFromStringList = function(value) {
    if(object.isString(value) && value.indexOf(' ') > -1) {
        return value.split(/[\s]+/);
    } else {
        return value;
    }
};

Element.prototype.attrNumber = function(key, value) {
    var val = util.app.parseNumberString(this.attr(key, value));
    return (object.isDefined(value)) ? this : val;
};

Element.prototype.attr = function(attribute) {
    if(arguments.length > 1 && object.isDefined(arguments[1])) {
        //TODO: implement for mor thant 2
        var obj = {};
        obj[arguments[0]] = arguments[1];
        return this.attr(obj);
    } else if(object.isString(attribute)) {
        var result = this.attributes[attribute];
        if(!result && this.instance()) {
            result = this.attributes[attribute] =  this.$().attr(attribute);
        }
        return result;
    } else {
        this._setAttribute(attribute);
    }
    return this;
};

module.exports =  Element;

},{"../util/util":75}],47:[function(require,module,exports){
var object = require('../util/object');
var Vector = require('../util/math').Vector;
var math = require('../util/math');
var util = require("../util/util");

var AbstractPathDataType = function(type, absolute) {
    this.vector = new Vector();
    this.vector.add(type);
    this.absolute = absolute || true;
};

AbstractPathDataType.prototype.setAbsolute = function(absolute) {
    this.absolute = absolute || true;
    return this;
};

AbstractPathDataType.prototype.getType = function() {
    var type = this.value(0,0);
    return this.absolute ? type.toUpperCase() : type.toLowerCase();
};

AbstractPathDataType.prototype.value = function() {
    return this.vector.value(Array.prototype.slice.call(arguments));
};

AbstractPathDataType.prototype.setValue = function(pathArr, value) {
    return this.vector.setValue(pathArr, value);
};

AbstractPathDataType.prototype.insert = function(pathArr, values) {
    return this.vector.setValue(pathArr, values);
};

AbstractPathDataType.prototype.is = function(type) {
    return this.getType().toUpperCase() === type.toUpperCase();
};

AbstractPathDataType.prototype.to = function(pathArr, values) {
    //ABSTRACT
};

AbstractPathDataType.prototype.pointToString = function(p) {
    return p.x + ',' + p.y+' ';
};

AbstractPathDataType.prototype.getOrSet = function(index, value) {
    if(value) {
        this.setValue(index, value);
        return this;
    } else {
        return this.value(index);
    }
}

/**
 * Vector = [['l'], {x:x, y:y}]
 */
var LineTo = function(p, absolute) {
    AbstractPathDataType.call(this, 'l', absolute);
    this.to(p);
};

util.inherits(LineTo, AbstractPathDataType);

LineTo.prototype.to = function(x,y) {
    var p = math.getPoint(x,y);
    return this.getOrSet(1,p);
};

LineTo.prototype.toString = function() {
    return this.getType()+this.pointToString(this.to());
};

LineTo.prototype.x = function(value) {
    if(value) {
        this.value(1).x = value
    }
    return this.value(1).x;
};

LineTo.prototype.y = function(value) {
    if(value) {
        this.value(1).y = value
    }
    return this.value(1).y;
};

LineTo.prototype.moveAlong = function(from, distance) {
    return math.Line.moveAlong(from, this.to(), distance);
};

LineTo.prototype.getNearestPoint = function(from, position) {
    return math.Line.getNearestPoint(from, this.to(), position);
};

var QBezier = function(controlP, toP, absolute) {
    AbstractPathDataType.call(this, 'q', absolute);
    this.control(controlP);
    this.to(toP);
};

util.inherits(QBezier, AbstractPathDataType);

QBezier.prototype.to = function(x,y) {
    var p = math.getPoint(x,y);
    return this.getOrSet(2,p);
};

QBezier.prototype.control = function(x,y) {
    var p = math.getPoint(x,y);
    return this.getOrSet(1,p);
};

QBezier.prototype.toString = function() {
    return this.getType()+this.pointToString(this.control())+this.pointToString(this.to());
};

var CBezier = function(controlP1, controlP2, toP, absolute) {
    AbstractPathDataType.call(this, 'c', absolute);
    this.control1(controlP1);
    this.control2(controlP2);
    this.to(toP);
};

util.inherits(CBezier, AbstractPathDataType);

CBezier.prototype.control = function(x,y) {
    return this.control1(x,y);
};

CBezier.prototype.control1 = function(x,y) {
    var p = math.getPoint(x,y);
    return this.getOrSet(1,p);
};

CBezier.prototype.control2 = function(x,y) {
    var p = math.getPoint(x,y);
    return this.getOrSet(2,p);
};

CBezier.prototype.to = function(x,y) {
    var p = math.getPoint(x,y);
    return this.getOrSet(3,p);
};

CBezier.prototype.toString = function() {
    return this.getType()+this.pointToString(this.control1())+this.pointToString(this.control2())+this.pointToString(this.to());
};

/**
 * calculates the nearest point of the bezier curve to the given position. since the CBezier does not know its start
 * point, we have to provide the from position as well as the search base position.
 * @param from
 * @param position
 * @returns {{point, location}|*}
 */
CBezier.prototype.getNearestPoint = function(from, position) {
    return math.bezier.nearestPointOnCurve(position, this.getCurve(from)).point;
};

CBezier.prototype.moveAlong = function(from, distance) {
    return math.bezier.moveAlong(this.getCurve(from), distance);
};

CBezier.prototype.getCurve = function(from) {
    return [from, this.control1(), this.control2(), this.to()];
};

var MoveTo = function(toP, absolute) {
    AbstractPathDataType.call(this, 'm', absolute);
    this.to(toP);
};

util.inherits(MoveTo, LineTo);

var Complete = function() {
    AbstractPathDataType.call(this, 'z');
};

util.inherits(Complete, AbstractPathDataType);

Complete.prototype.toString = function() {
    return this.getType();
};

var pathType = {
    z : function() { return new Complete() },
    m : function() { return new MoveTo(arguments[0]); },
    l : function() { return new LineTo(arguments[0]); },
    q : function() { return new QBezier(arguments[0], arguments[1]); },
    c : function() { return new CBezier(arguments[0], arguments[1],  arguments[2]); }
};

var PathData = function(def) {
    this.data = new Vector();
    if(object.isString(def)) {
        this.loadFromString(def);
    }
};

PathData.prototype.loadFromString = function(strVal) {
    var that = this;
    //'M100,100 Q200,200 300,300' --> ['M100,100 ', 'Q200,200 300,300']
    var definitions = strVal.split(/(?=[MmLlHhVvCcSsQqTtAaZz]+)/);
    //Each dType
    $.each(definitions, function(index, value) {
        var type = value.charAt(0);
        //'Q200,200 300,300 -> ['200,200', '300,300']
        var values = value.substring(1,value.length).trim().split(' ');
        //['200,200', '300,300'] -> [{x:200, y:200}, {x:300, y:300}]
        var points = [];
        $.each(values, function(i, coord) {
            var coordVals = coord.split(',');
            points.push(math.getPoint(parseFloat(coordVals[0]), parseFloat(coordVals[1])));
        });
        that.data.add(pathType[type.toLowerCase()].apply(undefined, points).setAbsolute((type == type.toUpperCase())));
    });
    return this;
};

PathData.prototype.getCorners = function() {
    var xMin, xMax, yMin, yMax;
    xMin = yMin = Number.POSITIVE_INFINITY;
    xMax = yMax = Number.NEGATIVE_INFINITY;

    this.data.each(function(index, pathPart) {
        if(pathPart.x && pathPart.y) {
            xMin = (xMin > pathPart.x()) ? pathPart.x() : xMin;
            yMin = (yMin > pathPart.y()) ? pathPart.y() : yMin;

            xMax = (xMax < pathPart.x()) ? pathPart.x() : xMax;
            yMax = (yMax < pathPart.y()) ? pathPart.y() : yMax;
        }
    });

    return [
        {x:xMin, y:yMin},
        {x:xMax, y:yMin},
        {x:xMax, y:yMax},
        {x:xMin, y:yMax}
    ];
};

PathData.prototype.getX = function() {
    return this.getCorners()[0].x;
};

PathData.prototype.getY = function() {
    return this.getCorners()[0].y;
};

PathData.prototype.polynoms = function() {
    var result = [];
    object.each(this.data.vectors, function(index, value) {
        if(value.to) {
            result.push(value.to());
        }
    });
    return result;
};

/**
 * Returns
 * @returns {Array}
 */
PathData.prototype.getPathParts = function() {
    var result = [];

    //We start at index 1 because the 0 index of the vector contains the pathpart type
    for(var i = 1; i <= this.length() - 1; i++) {
        result.push(this.getPathPart(i));
    }

    return result;
};

PathData.prototype.getPathPart = function(index) {
    var pathPart = this.value(index);
    return {
        start: this.value(index - 1).to(),
        end: pathPart.to(),
        value: pathPart
    };
};

PathData.prototype.moveAlong = function(index, distance, direction) {
    var pathPart = this.getPathPart(index);
    if(pathPart.value.moveAlong) {
        return pathPart.value.moveAlong(pathPart.start, distance, direction);
    } else {
        return math.Line.moveAlong(pathPart.start, pathPart.end, distance, direction);
    }
};

/**
 * Calculates the rough center of the path by calculating the total length of the pathparts (as direct lines) and moving
 * along those lines to the center (total length / 2). Note with this method we just get a exact result for simple
 * line paths. If the calculated center position is within a cubic bezier path part, we return the nearest point on the curve
 * to the calculated center.
 * @returns {*}
 */
PathData.prototype.getCenter = function() {
    var resultD = this.getDistance() / 2;
    var currentD = 0;
    var center;
    object.each(this.getPathParts(), function(index, part) {
        var lineD = math.Line.calcDistance(part.start, part.end);
        var nextD = currentD + lineD;
        if(nextD > resultD) {
            var diffD =  resultD - currentD;
            center = math.Line.moveAlong(part.start, part.end, diffD);

            //If we have a cubic bezier path part we calculate the nearest point on the curve
            if(part.value.is('c')) {
                center = part.value.getNearestPoint(part.start, center);
            }
            return false;
        }
        currentD = nextD;
    });
    return center;
};

PathData.prototype.getDistance = function() {
    var distance = 0;
    object.each(this.getPathParts(), function(index, part) {
        distance += math.Line.calcDistance(part.start, part.end);
    });
    return distance;
};

/**
 * Assuming there are only! cubic bezier curved path parts this function recalculates all control points of the curves
 * to smoothen the entire path.
 *
 * @param polynoms
 */
PathData.prototype.smoothen = function(polynoms) {
    if(!polynoms) {
        polynoms = this.polynoms();
    }

    var x = [];
    var y = [];

    object.each(polynoms, function(index, value) {
        x[index] = value.x;
        y[index] = value.y;
    });

    var px = math.bezier.calculateSmoothControlPoints(x);
    var py = math.bezier.calculateSmoothControlPoints(y);

    var that = this;
    object.each(px.p1, function(index, value) {
        that.value(index + 1).control1(px.p1[index], py.p1[index]);
        that.value(index + 1).control2(px.p2[index], py.p2[index]);
    });
    return this;
};

PathData.prototype.getLineByPathIndex = function(index) {
    var p1 = this.value(index - 1).to();
    var p2 = this.value(index).to();
    return new math.Line(p1, p2);
};

PathData.prototype.getNearestPoint = function(point) {
    var index = this.getPathIndexForPosition(point);
    var part = this.getPathPart(index);
    if(part.value.getNearestPoint) {
        return part.value.getNearestPoint(part.start, point);
    };
};

PathData.prototype.getPathIndexForPosition = function(point) {

    if(this.length() === 2) {
        //If there is just the start and end docking we know the new index
        return 1;
    }

    var dockingIndex = 1;
    var candidate = [1,Number.POSITIVE_INFINITY ];

    object.each(this.getPathParts(), function(index, part) {
        //Sort out pathparts which are not within the boundary of start/end points with a little tolerance of 10px
        var p = new util.math.Point(point);
        if(p.isWithinXInterval(part.start, part.end, 10)) {
            var d;
            var line = new math.Line(part.start, part.end);

            if(!line.isVertical()) {
                d = Math.abs(line.calcFX(point.x).y - point.y)
            } else if(p.isWithinYInterval(part.start, part.end)) {
                //Since the point is within x (with tolerance) and y interval we calculate the x distance
                d = Math.abs(part.start.x - p.x);
            }

            if (candidate === undefined || candidate[1] > d) {
                //The pathPartindex is the arrayindex + 1 since we use the end index of the path as identity
                candidate[0] = index + 1;
                candidate[1] = d;
            }
        }
    });

    if (candidate) {
        return candidate[0];
    }
};

/*
 LinePathManager.prototype.getGradien = function(x,y) {
 var position = util.math.getPoint(x,y);
 var index = this.transition.getKnobIndexForPoint(position);
 var p1 = this.data.getDockingByIndex(index).position();
 var p2 = this.data.getDockingByIndex(index + 1).position();
 return util.math.Line.calcGradient(p1, p2);
 };

 LinePathManager.prototype.getGradientByIndex = function(index) {
 var p1 = this.data.getDockingByIndex(index).position();
 var p2 = this.data.getDockingByIndex(index + 1).position();
 return util.math.Line.calcGradient(p1, p2);
 };


 LinePathManager.prototype.getVectorByIndex = function(index, fromEnd) {
 var p1, p2;
 if(fromEnd) {
 p1 = this.data.getDockingByEndIndex(index + 1).position();
 p2 = this.data.getDockingByEndIndex(index).position();
 } else {
 p1 = this.data.getDockingByIndex(index).position();
 p2 = this.data.getDockingByIndex(index + 1).position();
 }
 return util.math.Line.calcNormalizedLineVector(p1, p2);
 };
 */

PathData.prototype.getY = function(value) {
    return this.getCorners()[0].y;
};

PathData.prototype.getRightX = function(value) {
    return this.getCorners()[1].x;
};

PathData.prototype.getBottomY = function(value) {
    return this.getCorners()[2].y;
};

PathData.prototype.setData = function(value) {
    if(object.isArray(value)) {
        this.data = value;
    }
};

PathData.prototype.clear = function() {
    this.data.clear();
    return this;
};

PathData.prototype.length = function() {
    return this.data.length();
};

PathData.prototype.value = function(index) {
    return this.data.value(index);
};

PathData.prototype.lastIndexOfType = function(type) {
    var i;
    for(i = this.length() - 1; i >= 0; i--) {
        var value = this.value(i);
        if(value.is(type)) {
            return i;
        }
    }
    return -1;
};

PathData.prototype.valuesByType = function(type) {
    var result = [];

    object.each(this.data.vectors, function(i, value) {
       if(value.is(type)) {
           result.push({index:i, value:value});
       }
    });

    return result;
};

PathData.prototype.start = function(p, absolute) {
    if(arguments.length === 0) {
        return this.value(0).to();
    } else if(this.length() > 0) {
        this.value(0).to(p);
    } else {
        this.data.setValue(0, new MoveTo(p, absolute));
    }
    return this;
};

PathData.prototype.end = function(value) {
    if(value) {
        return this.data.last().to(value);
    } else {
        return this.data.last().to();
    }
};

/**
 * TODO: refactor to setTo
 * @param index
 * @param value
 * @returns {PathData}
 */
PathData.prototype.setTo = function(index, value) {
    this.data.value(index).to(value);
    return this;
};

PathData.prototype.removePath = function(index) {
    this.data.remove(index);
    return this;
};

PathData.prototype.complete = function() {
    this.data.add(new Complete());
    return this;
};

PathData.prototype.line = function(x,y) {
    var p = math.getPoint(x,y);
    this.data.add(new LineTo(p, true));
    return this;
};

PathData.prototype.cBezier = function(c1, c2, to) {
    this.data.add(new CBezier(c1,c2, to, true));
    return this;
};

/**
 * TODO: Line to
 * @param index
 * @param value
 * @param absolute
 * @returns {PathData}
 */
PathData.prototype.insertLine = function(index, to, absolute) {
    this.data.insert(index, new LineTo(to,absolute));
    return this;
};

PathData.prototype.qBezier = function(controlP,toP) {
    this.data.add(new QBezier(controlP,toP, true));
    return this;
};

PathData.prototype.insertQBezier = function(index,c, to, absolute) {
    this.data.insert(index, new QBezier(c, to, absolute));
    return this;
};

PathData.prototype.insertCBezier = function(index, c1, c2, to, absolute) {
    this.data.insert(index, new CBezier(c1,c2, to,absolute));
    return this;
};

PathData.prototype.toString = function() {
    var result = '';
    var that = this;
    this.data.each(function(index, pathPart) {
       result += pathPart.toString();
    });
    return result.trim();
};

module.exports = PathData;
},{"../util/math":72,"../util/object":73,"../util/util":75}],48:[function(require,module,exports){
var DomElement = require('../dom/domElement');
var Style = require('./style');
var util = require('../util/util');
var dom = util.dom;
var object = util.object;

/*
 * Constructor for SVG Elements
 *
 * @param {type} name the element Name e.g. rect, circle, path...
 * @param {type} cfg attributes and additional configurations
 * @param {type} attributeSetter you can add additional attribute setter
 * for special attributes default attribute setter given by this impelementation
 * are transform and style setter
 */
var SVGElement = function(name, svg, cfg, attributeSetter) {
    this.attributeSetter = attributeSetter || {};
    this.attributeSetter.style = this.styleAttributeSetter;
    this.SVGElement = true;

    // If first attribute is not a string we assume a svg node constructor call.
    if(!object.isString(name)) {
        this.instance(name);
        cfg = dom.getAttributes(name);
        name = name.tagName;
    }

    this.svg = svg;
    this.root = svg.root || this;
    DomElement.call(this, name, cfg, this.attributeSetter);
};

util.inherits(SVGElement, DomElement);

SVGElement.prototype.styleAttributeSetter = function(trnasformationString) {
    return new Style(trnasformationString);
};

SVGElement.prototype.getRootNode = function() {
    return this.root.instance();
};

SVGElement.prototype.append = function(element) {
    var result;
    if(arguments.length > 1) {
        result = [];
        var that = this;
        object.each(arguments, function(index, val) {
            result.push(that.append(val));
        })
    } else if(arguments.length === 1) {
        result =  util.dom.appendSVGElement(this.instance(), element);
    }
    return result;
};

SVGElement.prototype.prepend = function(element) {
    var result;
    if(arguments.length > 1) {
        result = [];
        var that = this;
        object.each(arguments, function(index, val) {
            result.push(that.prepend(val));
        })
    } else if(arguments.length === 1) {
        result =  util.dom.prependSVGElement(this.instance(), arguments[0]);
    }
    return result;
};

SVGElement.prototype.remove = function() {
    this.$().remove();
};

SVGElement.prototype.find = function(selector) {
    var result = this.svg.get(this.$().find(selector));
    return util.object.isArray(result) ? result : [result];
};

SVGElement.prototype.firstChild = function() {
    return $.qCache().svg(this.$().children().first());
};

SVGElement.prototype.down = function() {
    dom.moveDown(this.instance());
};

SVGElement.prototype.up = function() {
    dom.moveUp(this.instance());
};

SVGElement.prototype.back = function() {
    dom.prependToRoot(this);
    return this;
};

/**
 * SVG Styles
 */

SVGElement.prototype.style = function(key, value) {
    if(!object.isDefined(value) && object.isString(key) && key.indexOf(':') <= 0
        && object.isDefined(this.attributes.style)) {
        //GETTER CALL
        return this.attributes.style.get(key);
    } else if(!object.isDefined(this.attributes.style) && object.isDefined(value)) {
        this.attributes.style = new Style(key, value);
    } else if(object.isDefined(value)) {
        this.attributes.style.set(key, value);
    } else {
        return;
    }
    this.updateAttribute('style');
    return this;
};

SVGElement.prototype.dala = function(key, value) {
    return this.attr('dala:'+key, value);
};

SVGElement.prototype.getBBox = function() {
    return this.instance().getBBox();
};

SVGElement.prototype.getBoundingClientRect = function() {
    return this.instance().getBoundingClientRect();
}

/**
 * SVG Eventhandling
 */

SVGElement.prototype.trigger = function(evt, args) {
    this.$().trigger(evt, args);
    return this;
};

SVGElement.prototype.on = function(evt, handler) {
    this.$().on(evt, handler);
    return this;
};

SVGElement.prototype.one = function(evt, handler) {
    this.$().one(evt, handler);
    return this;
};

SVGElement.prototype.off = function(evt) {
    this.$().off(evt);
    return this;
};

SVGElement.prototype.toString = function() {
    return util.xml.serializeToString(this.instance());
};

module.exports = SVGElement;

},{"../dom/domElement":46,"../util/util":75,"./style":59}],49:[function(require,module,exports){
var util = require('../util/util');
var object = require('../util/object');
var SVGEllipse = require('./ellipse');
var SVGShape = require('./svgShape');

var SVGCircle = function(svgRoot, cfg) {
    cfg = cfg || {};
    SVGShape.call(this, 'circle', svgRoot, cfg);
};

util.inherits(SVGCircle, SVGEllipse);

SVGCircle.prototype.r = function(value, noScale) {
    var scale = (noScale) ? 1 : this.scale()[1];
    if((!object.isDefined(value) || object.isBoolean(value) && !value)) {
        return this.attrNumber('r') * scale;
    } else if(object.isBoolean(value)) {
        return (this.attrNumber('r') + (this.strokeWidth() / 2)) * scale;
    } else {
        this.attrNumber('r', value);
        return this;
    }
};

SVGCircle.prototype._setHeight = function(value) {
    var v = value / 2;
    this.cy(v).cx(v).r(v);
};

SVGCircle.prototype._setWidth = function(value) {
    return this.height(value);
};

SVGCircle.prototype.rx = function(value, noScale) {
    return this.r(value, noScale);
};

SVGCircle.prototype.ry = function(value, noScale) {
    return this.r(value, noScale);
};

SVGCircle.prototype.overlayCheck = function(position) {
    return new util.math.Circle(this.getCenter(), this.r()).overlays(position);
};

module.exports = SVGCircle;
},{"../util/object":73,"../util/util":75,"./ellipse":53,"./svgShape":63}],50:[function(require,module,exports){
var DragConfig = function() {
    this.hooks = {};
};

DragConfig.prototype.xOnly = function() {
    this.hooks.restrictionY = function(event, dx, dy) {
        return 0;
    };
    return this;
};

DragConfig.prototype.yOnly = function() {
    this.hooks.restrictionX = function(event, dx, dy) {
        return 0;
    };
    return this;
};

DragConfig.prototype.getScale = function(gsHook) {
    this.hooks.getScale = gsHook;
    return this;
};

DragConfig.prototype.dragMove = function(drmHook) {
    this.hooks.dragMove = drmHook;
    return this;
};

DragConfig.prototype.dragStart = function(drsHook) {
    this.hooks.dragStart = drsHook;
    return this;
};

DragConfig.prototype.dragEnd = function(dreHook) {
    this.hooks.dragEnd = dreHook;
    return this;
};

DragConfig.prototype.restrictionX = function() {
    return this.hooks.restrictionX;
};

DragConfig.prototype.restrictionY = function() {
    return this.hooks.restrictionY;
};

DragConfig.prototype.get = function() {
    return this.hooks;
};

module.exports = DragConfig;
},{}],51:[function(require,module,exports){
var SVGShape = require('./svgShape');
var util = require('../util/util');
var event = require('../core/event');

var object = util.object;
var dom = util.dom;

var ShiftDrag = function(cfg) {
    this.cfg = cfg;
    if(!cfg.restrictionX && !cfg.restrictionY) {
        this.init();
    } else {
        this.disable();
    }
};

ShiftDrag.prototype.init = function() {
    this.state = 'init';
    this.xShift = {
        shiftAlign : 0,
        unshiftAlign : 0
    };

    this.yShift = {
        shiftAlign : 0,
        unshiftAlign : 0
    };
};

ShiftDrag.prototype.disable = function() {
    this.state = 'disabled';
};

ShiftDrag.prototype.update = function(evt, dx ,dy) {
    var that = this;
    switch(this.state) {
        case 'init' :
            this.xShift.shiftAlign += dx;
            this.yShift.shiftAlign += dy;

            if(this.checkShiftHook(evt)) {
                if(Math.abs(this.xShift.shiftAlign) > Math.abs(this.yShift.shiftAlign)) {
                    this.restrictionX = undefined;
                    this.restrictionY = function(evt, dx ,dy) {
                        return that.shiftRestriction(that.yShift, dy);
                    };
                    this.state = 'shiftedX';
                } else {
                    this.restrictionY = undefined;
                    this.restrictionX = function(evt, dx , dy) {
                        return that.shiftRestriction(that.xShift, dx);
                    };
                    this.state = 'shiftedY';
                }
            }
            break;
        case 'shiftedX':
            if(!evt.shiftKey) {
                this.restrictionY = function(evt, dx, dy) {
                    return that.unShiftRestriction(that.yShift, dy);
                };
                this.state = 'init';
            }
            break;
        case 'shiftedY':
            if(!evt.shiftKey) {
                this.restrictionX = function(evt, dx ,dy) {
                    return that.unShiftRestriction(that.xShift, dx);
                };
                this.state = 'init';
            }
            break;
    }
};


ShiftDrag.prototype.shiftRestriction = function(shiftData, d) {
    //Update shifted d
    shiftData.unshiftAlign += d;
    //Align shift drag back to the start position
    var result = (Math.abs(shiftData.shiftAlign) > 0) ? shiftData.shiftAlign * -1 : 0;
    shiftData.shiftAlign = 0;
    return result;
};

ShiftDrag.prototype.unShiftRestriction = function(shiftData, d) {
    //Align shift drag back to the start position
    var result = shiftData.unshiftAlign + d;
    shiftData.unshiftAlign = 0;
    return result;
};

ShiftDrag.prototype.checkShiftHook = function(evt) {
    return evt.shiftKey && (Math.abs(this.xShift.shiftAlign) > 4 || Math.abs(this.yShift.shiftAlign) > 4);
};

//TODO: this would be more elegant to use the alignment align center to center.x if checkShiftHook

ShiftDrag.prototype.getRestrictionX = function() {
    return this.cfg.restrictionX || this.restrictionX;
};

ShiftDrag.prototype.getRestrictionY = function() {
    return this.cfg.restrictionY || this.restrictionY;
};

SVGShape.prototype.draggable = function(cfg, dragElement) {
    var cfg = cfg || {};

    if(!object.isDefined(dragElement)) {
        dragElement = this.instance();
    }

    var that = this;

    var dragMove = function(evt) {
        if(evt.preventDefault) {
            evt.preventDefault();
        }

        if(!evt.triggerEvent) {
            that.attr('pointer-events', 'none');
        }

        var actualdx = (object.isDefined(evt.dx)) ? evt.dx : evt.clientX - that.dragCurrentX;
        var actualdy = (object.isDefined(evt.dy)) ? evt.dy : evt.clientY - that.dragCurrentY;

        // DRAG BEFORE HOOK
        if(cfg.dragBeforeMove) {
            cfg.dragBeforeMove.apply(that, [evt, actualdx, actualdy, dragElement]);
        }

        // DRAG ALIGNMENT
        if(cfg.dragAlignment && !evt.triggerEvent) {
            var alignment = cfg.dragAlignment.check(actualdx, actualdy);
            actualdx = alignment.dx;
            actualdy = alignment.dy;
        }

        //Check for shiftDrag restriction, shiftDrag will only hook up if no other restriction is set.
        //Shiftdrag is not given for triggerdrags
        if(that.shiftDrag && !evt.triggerEvent) {
            that.shiftDrag.update(evt, actualdx, actualdy);
            var restrictionX = that.shiftDrag.getRestrictionX();
            var restrictionY = that.shiftDrag.getRestrictionY();
        }

        // DRAG RESTRICTION
        var dx = (restrictionX && !evt.triggerEvent) ? restrictionX.apply(that, [evt, actualdx, actualdy]) : actualdx;
        var dy = (restrictionY && !evt.triggerEvent) ? restrictionY.apply(that, [evt, actualdx, actualdy]) : actualdy;

        //TODO: somehow the scale should be determined in a more elegant way perhaps store it in svg instance...
        if(cfg.getScale && !evt.triggerEvent) {
            var scale = cfg.getScale();
            dx /= scale;
            dy /= scale;
        }

        // EXECUTE DRAG
        if(dx !== 0 || dy !== 0) {
            that.move(dx, dy);
        }

        var evtData = getMouseEventData(evt);
        // Keep track of current mouse position
        that.dragCurrentX = evtData.clientX;
        that.dragCurrentY = evtData.clientY;

        that.dxSum += dx;
        that.dySum += dy;

        // DRAG MOVE HOOK
        if(cfg.dragMove) {
            cfg.dragMove.apply(that, [evt, dx, dy, dragElement]);
        }
    };

    var dragEnd = function(evt) {
        evt.preventDefault();
        //Turn off drag events
        event.off(that.getRootNode(), 'mousemove');
        event.off(document, 'mouseup', dragEnd);

        if(cfg.dragAlignment) {
            cfg.dragAlignment.reset();
        }

        this.drag = false;

        if(cfg.cursor) {
            $('body').css('cursor','default');
        }

        // DRAG END HOOK
        if(cfg.dragEnd) {
            cfg.dragEnd.apply(that, [evt]);
        }

        that.attr('pointer-events', 'all');
    };

    if(dragElement) {
        var evtType = (cfg.once)? event.once : event.on;
        evtType(dragElement,'mousedown', function(e) {
            if(e.ctrlKey || !that.isVisible()) {
                return;
            }
            e.preventDefault();
            // We stop the event propagation to prevent the document mousedown handler to fire
            e.stopPropagation();

            initDragValues(that, e, cfg);

            // DRAG START HOOK
            if(cfg.dragStart) {
                cfg.dragStart.apply(that, [e]);
            }

            if(cfg.cursor) {
                $('body').css('cursor', cfg.cursor);
            }

            that.drag = true;
            event.on(that.getRootNode(), 'mousemove', dragMove);
            event.on(document, 'mouseup', dragEnd);
        });
    }

    //Simulates an drag start event
    this.initDrag = function() {
        $(dragElement).trigger('mousedown');
    };

    //For manual dragging a svg element the triggerEvent is used to identify this event was triggered manually
    //See Selectionmanager setNodeSelection dragMove handler
    this.triggerDrag = function(dx, dy) {
        dragMove.apply(this,[{dx:dx, dy:dy, triggerEvent:true}]);
    };

    return this;
};

var initDragValues = function(that, evt, cfg) {
    that.dxSum = 0;
    that.dySum = 0;
    that.shiftDrag = new ShiftDrag(cfg);
    var evtData = getMouseEventData(evt);
    that.dragCurrentX = evtData.clientX;
    that.dragCurrentY = evtData.clientY;

    that.drag = true;
};

var getMouseEventData = function(evt) {
    if(!evt.clientX) {
        return event.mouse();
    }
    return evt;
};
},{"../core/event":7,"../util/util":75,"./svgShape":63}],52:[function(require,module,exports){
var shapes = {}
shapes.svg = shapes.Svg = require('./svgRoot');
shapes.circle = shapes.Circle = require('./circle');
shapes.ellipse = shapes.Ellipse = require('./ellipse');
shapes.text = shapes.Text = require('./text');
shapes.tspan = shapes.TSpan = require('./tspan');
shapes.path = shapes.Path = require('./path');
shapes.rect = shapes.Rect = require('./rect');
shapes.g = shapes.Group = require('./group');
module.exports = shapes;
},{"./circle":49,"./ellipse":53,"./group":54,"./path":56,"./rect":58,"./svgRoot":62,"./text":64,"./tspan":66}],53:[function(require,module,exports){
var util = require('../util/util');
var object = require('../util/object');
var SVGShape = require('./svgShape');

var SVGEllipse = function(svgRoot, cfg) {
    cfg = cfg || {};
    SVGShape.call(this, 'ellipse', svgRoot, cfg);
};

util.inherits(SVGEllipse, SVGShape);

SVGEllipse.prototype.x = function() {
    return this.cx() - this.rx();
};

SVGEllipse.prototype._getHeight = function() {
    return this.ry(false, true) * 2;
};

SVGEllipse.prototype._setHeight = function(value) {
    //When setting the height of an ellipse we move the center to not change the x/y
    var v = value / 2;
    this.cy(v).ry(v);
};

SVGEllipse.prototype._getWidth = function(value) {
    return this.rx(false, true) * 2;
};

SVGEllipse.prototype._setWidth = function(value) {
    //When setting the height of an ellipse we move the center to not change the x/y
    var v = value / 2;
    this.cx(v).rx(v);
};

SVGEllipse.prototype._getX = function() {
    return this.cx() - this.rx();
};

SVGEllipse.prototype._getY = function() {
    return this.cy() - this.ry();
};

SVGEllipse.prototype.getCenter = function() {
    return {
        x : this.cx(),
        y : this.cy()
    };
};

SVGEllipse.prototype.bottomY = function() {
    return this.cy() + this.ry();
};

SVGEllipse.prototype.cx = function(value) {
    if(!value) {
        return this.translatedX(this.attrNumber('cx'));
    } else {
        this.attr('cx', value);
        return this;
    }
};

SVGEllipse.prototype.cy = function(value) {
    if(!value) {
        return this.translatedY(this.attrNumber('cy'));
    } else {
        this.attr('cy', value);
        return this;
    }
};

SVGEllipse.prototype.rx = function(value, noScale) {
    var scale = (noScale) ? 1 : this.scale()[0];
    if((!object.isDefined(value) || object.isBoolean(value) && !value)) {
        return this.attrNumber('rx') * scale;
    } else if(object.isBoolean(value)) {
        return (this.attrNumber('rx') + (this.strokeWidth() / 2)) * scale;
    } else {
        this.attrNumber('rx', value);
        return this;
    }
};

SVGEllipse.prototype.ry = function(value, noScale) {
    var scale = (noScale) ? 1 : this.scale()[1];
    if((!object.isDefined(value) || object.isBoolean(value) && !value)) {
        return this.attrNumber('ry') * scale;
    } else if(object.isBoolean(value)) {
        return (this.attrNumber('ry') + (this.strokeWidth() / 2)) * scale;
    } else {
        this.attrNumber('ry', value);
        return this;
    }
};

SVGEllipse.prototype.overlayCheck = function(position) {
    return new util.math.Ellipse(this.getCenter(), this.rx(), this.ry()).overlays(position);
};

module.exports = SVGEllipse;
},{"../util/object":73,"../util/util":75,"./svgShape":63}],54:[function(require,module,exports){
var util = require('../util/util');
var object = require('../util/object');
var SVGShape = require('./svgShape');

var SVGGroup = function(svgRoot, cfg) {
    cfg = cfg || {};
    SVGShape.call(this, 'g', svgRoot, cfg);
};

util.inherits(SVGGroup, SVGShape);

module.exports = SVGGroup;
},{"../util/object":73,"../util/util":75,"./svgShape":63}],55:[function(require,module,exports){
var Helper = function(svg) {
    this.svg = svg;
    this.points = {};
};

Helper.prototype.point = function(id, p, color, prevText) {
    color = color || 'red';
    var text = id+'(x:'+p.x + ' y:'+p.y+')';
    if(!this.points[id]) {
        var point = this.svg.circle({
            r:2,
            style:'fill:'+color
        });
        var t = this.svg.text(text).fill(color);
        var group = this.svg.g({id:'helper_'+id}, t, point);
        this.points[id] = {
            group : group,
            text : t,
            point : point
        }

        if(prevText) {
            t.hide();
        }
    }

    this.points[id].point.moveTo(p);
    this.points[id].text.$().text(text);
    this.points[id].text.moveTo(p);
};

module.exports = Helper;

},{}],56:[function(require,module,exports){
var util = require('../util/util');
var object = require('../util/object');
var SVGShape = require('./svgShape');
var PathData = require('./pathData');

var SVGPath = function(svgRoot, cfg) {
    cfg = cfg || {};
    this.attributeSetter = { d : SVGPath.pathDataAttributeSetter};
    SVGShape.call(this, 'path', svgRoot, cfg, this.attributeSetter);
};

util.inherits(SVGPath, SVGShape);

SVGPath.pathDataAttributeSetter = function(pathDataString) {
    return new PathData(pathDataString);
};

SVGPath.prototype.x = function() {
    return this.d().getX();
};

SVGPath.prototype.y = function() {
    return this.d().getY();
};

SVGPath.prototype.d = function(pathData) {
    if(object.isString(pathData)) {
        this.attributes.d = new PathData(pathData);
        this.updateAttribute('d');
        return this;
    } else if(object.isDefined(pathData)) {
        this.attributes.d = pathData
        this.updateAttribute('d');
        return this;
    } else if(!object.isDefined(this.attributes.d)) {
        this.attributes.d = new PathData();
    }
    return this.attributes.d;
};

module.exports = SVGPath;
},{"../util/object":73,"../util/util":75,"./pathData":57,"./svgShape":63}],57:[function(require,module,exports){
arguments[4][47][0].apply(exports,arguments)
},{"../util/math":72,"../util/object":73,"../util/util":75,"dup":47}],58:[function(require,module,exports){
var util = require('../util/util');
var object = require('../util/object');
var SVGShape = require('./svgShape');

var SVGRect = function(svgRoot, cfg) {
    cfg = cfg || {};
    SVGShape.call(this, 'rect', svgRoot, cfg);
};

util.inherits(SVGRect, SVGShape);

SVGRect.prototype._getY = function() {
    return this.attrNumber('y') || 0;
};

SVGRect.prototype._getX = function() {
    return this.attrNumber('x') || 0;
};

SVGRect.prototype._getHeight = function(value) {
    return this.attrNumber('height');
};

SVGRect.prototype._setHeight = function(value) {
    this.attr('height',value);
};

SVGRect.prototype._getWidth = function(value) {
    return this.attrNumber('width');
};

SVGRect.prototype._setWidth = function(value) {
    this.attr('width',value);
};

SVGRect.prototype.overlayCheck = function(position) {
    return position.x >= this.x() && position.x <= this.getRightX()
        && position.y >= this.y() && position.y <= this.getBottomY();
};

module.exports = SVGRect;
},{"../util/object":73,"../util/util":75,"./svgShape":63}],59:[function(require,module,exports){
var object = require('../util/object');
var string = require('../util/string');

var REGEXP_PROPERTY_SUFFIX = ':[a-zA-Z0-9#,\.]*(;|$)';

var Style = function(key, value) {
    if(object.isString(key) && !object.isDefined(value)) {
        this.value = key;
    } else {
        this.set(key,value);
    }
};

Style.prototype.set = function(key, value) {
    if(object.isObject(key)) {
        object.each(key, function(objKey, val) {
            if(key.hasOwnProperty(objKey)) {
                this.set(objKey,val);
            }
        });
    } else if(object.isString(key) && object.isDefined(value)) {
        if(!object.isDefined(this.value)) {
            this.value = "";
        }

        if(this.value.indexOf(key+':') >= 0) {
            var regExp = new RegExp(key+REGEXP_PROPERTY_SUFFIX, 'gi');
            this.value = this.value.replace(regExp, this.createValueString(key,value));
        } else {
            this.value += (!string.endsWith(this.value,';') && this.value.length > 0) ? ';' + this.createValueString(key,value) : this.createValueString(key,value);
        }
    } else if(object.isString(key)) {
        this.value = key;
    }
};

Style.prototype.get = function(key) {
    var regExp = new RegExp(key+REGEXP_PROPERTY_SUFFIX, 'gi');
    var result = this.value.match(regExp);
    if(object.isArray(result)) {
        var value = result[0];
        var splitted = value.split(':');
        if(splitted.length > 1) {
            var result = splitted[1];
            return (string.endsWith(result, ';'))? result.substring(0,result.length -1) : result;
        }
    }
};

Style.prototype.createValueString = function(key, value) {
    return key+':'+value+';';
};

Style.prototype.toString = function() {
    return this.value;
};

module.exports = Style;

},{"../util/object":73,"../util/string":74}],60:[function(require,module,exports){
/**
 * This module contains functionality for creating and accessing SVG elements.
 * All SVG elements created with this module can be accessed by ID through the instance object.
 *
 * An SVG element created with this module can be seperated into multiple parts which can be managed speratly.
 * The 'root' part will be created by default. When creating a new svg part you can set it as default part, so all actions
 * like insertions will be executed on the default part if there is no other part as argument.
 */
var SVGGenericShape = require('./svgShape');
require('./draggable');
var shapes = require('./elements');
var util = require('../util/Util');

var dom = util.dom;
var object = util.object;
var Helper = require('./helper');

var NAMESPACE_SVG = 'http://www.w3.org/2000/svg';
var NAMESPACE_XLINK = 'http://www.w3.org/1999/xlink';

var instances = {};

/**
 * The constructor initializes a new SVG element within the given containerId.
 * The constructor accepts the containerId either as selector '#containerId' or as id string 'containerId'.
 *
 * The id of the nw SVG element will be the containerId with the suffix '_svg' -> 'containerId_svg'.
 *
 * Attributes of the new SVG elemnt can be set through the constructor argument 'cfg'.
 *
 * The SVG can be seperated in multiple parts so you can easily append elements to the different part.
 * The constructor creates a 'root' part as default.
 *
 * @param containerId
 * @param cfg
 * @constructor
 */
var SVG = function(containerId, cfg) {
    if(!(this instanceof SVG)) {
        return SVG.get(containerId);
    }

    cfg = cfg || {};

    //Get id from selector if its an selector
    this.containerId = dom.getRawId(containerId);
    this.$container = $.qCache('#'+this.containerId).get(0);

    if(!this.$container) {
        console.error('Attempt to initiate svg stage for invalid containerId: '+this.containerId);
        return;
    }

    this.svgId = this.containerId+'_svg';

    // Create SVG root element with given settings.
    this.root = new shapes.Svg(this, {id : this.svgId});

    cfg.height = cfg.height || '100%';
    cfg.width = cfg.width  || '100%';

    // Set cfg values as svg root attributes
    this.root.attr(cfg);

    // Append the svg root element to the containernode
    dom.appendSVGElement(this.$container, this.root);

    // The root part is the svg element itself
    this.svgParts = {'root':this.root};
    this.defaultPart = this.root;

    instances[this.svgId] = this;
};

/**
 * Returns the svg root domNode.
 * @returns {*} svg root domNode
 */
SVG.prototype.getRootNode = function() {
    return (this.root) ? this.root.instance() : undefined;
};

/**
 * Returns a cached jQuery object of the root node.
 * @returns {*}
 */
SVG.prototype.$ = function() {
    return $.qCache('#'+this.svgId);
};

/**
 * This is used for importing diagrams into the svg instance.
 * @param element
 */
SVG.prototype.setRoot = function(element) {
    var newId = dom.getAttributes(element)['id'];
    this.root.instance(element);
    this.root.attr({id : newId});
    instances[newId] = this;
};

/**
 * Returns the root element as SVGElement
 * @returns {SVGElement|exports|module.exports|*}
 */
SVG.prototype.getRoot = function() {
    return this.root;
};

/**
 * Returns the current defaultPart
 * @returns {SVGElement|exports|module.exports|*} current defaultPart
 */
SVG.prototype.getDefaultPart = function() {
    return this.defaultPart;
};

/**
 * Creates and returns a new svg part which is represented by a new group within the root.
 * The part id is composite of the svg root id and the partId.
 * By setting the isDefault argument as true the new part will be set as default part.
 * @param partId
 * @param isDefault
 * @returns {*}
 */
SVG.prototype.createPart = function(partId, isDefault) {
    //New parts are always added to the root part
    this.svgParts[partId] = this.g({id: this.svgId+'_'+partId, parentPart: 'root'});
    if(isDefault) {
        this.defaultPart = this.svgParts[partId];
    }
    return this.svgParts[partId];
};

SVG.prototype.part = function(id) {
    return this.svgParts[id];
};

/**
 * Adds an svg element to the given part.
 *
 * @param part
 * @param element
 */
SVG.prototype.addToPart = function(part, element) {
    this.addToGroup(this.svgParts[part], element);
};

/**
 * This function can be used to append or prepend elements with text to the svg root.
 *
 * @param element
 * @param prepend
 * @param text
 * @returns {*}
 */
SVG.prototype.addToRoot = function(element, prepend, text) {
    if(prepend) {
        return dom.prependSVGElement(this.getRoot(), element, text);
    } else {
        return dom.appendSVGElement(this.getRoot(), element, text);
    }
};

/**
 * This function can be used to append/prepend elements with text to a given (or default) svg part.
 *
 * @param element
 * @param part
 * @param prepend
 * @param text
 * @returns {*}
 */
SVG.prototype.add = function(element, part, prepend, text) {
    part = part || this.getDefaultPart();
    element.parent = part;
    if(prepend) {
        return dom.prependSVGElement(part, element, text);
    } else {
        return dom.appendSVGElement(part, element, text);
    }
};

/**
 * Imports an xml document to the given svg part.
 * @param elementXML
 * @param part
 * @returns {*}
 */
SVG.prototype.import = function(svgStr, part, prepend) {
    part = this.svgParts[part] || this.getDefaultPart();
    return SVG.get(dom.importSVG(part, svgStr, prepend));
};

/**
 * Adds and returns a newly created svg Rect with the given settings to the given (or default) part.
 * @param cfg
 * @param part
 * @returns {*}
 */
SVG.prototype.rect = function(cfg, part) {
    part = this.svgParts[part] || this.getDefaultPart();
    return this.add(new shapes.Rect(this, cfg), part);
};

SVG.prototype.helper = function(cfg, part) {
    if(!this._helper) {
        this._helper = new Helper(this);
    }
    return this._helper;
};

/**
 * Adds and returns a newly created svg Text with the given settings to the given (or default) part.
 * @param cfg
 * @param part
 * @returns {*}
 */
SVG.prototype.text = function(text, cfg, part) {
    part = this.svgParts[part] || this.getDefaultPart();
    return this.add(new shapes.Text(this, cfg), part, false).content(text);
};

SVG.prototype.tspan = function(text, cfg, part) {
    part = this.svgParts[part] || this.getDefaultPart();
    return this.add(new shapes.TSpan(this, cfg), part, false).content(text);
};

/**
 * Adds and returns a newly created svg Circle with the given settings to the given (or default) part.
 * @param cfg
 * @param part
 * @returns {*}
 */
SVG.prototype.circle = function(cfg, part) {
    part = this.svgParts[part] || this.getDefaultPart();
    return this.add(new shapes.Circle(this, cfg), part);
};

/**
 * Adds and returns a newly created svg Circle with the given settings to the given (or default) part.
 * @param cfg
 * @param part
 * @returns {*}
 */
SVG.prototype.ellipse = function(cfg, part) {
    part = this.svgParts[part] || this.getDefaultPart();
    return this.add(new shapes.Ellipse(this, cfg), part);
};

/**
 * Adds and returns a newly created svg Group with the given settings to the given (or default) part.
 * @param cfg
 * @param part
 * @returns {*}
 */
SVG.prototype.g = function(cfg) {
    var cfg = cfg ||{};

    var parentPart = this.svgParts[cfg.parentPart] || this.getDefaultPart();

    delete cfg.part;

    var group = this.add(new shapes.Group(this, cfg), parentPart);

    if(arguments.length > 1) {
        for(var i = 1;i < arguments.length; i++) {
            console.log('addToGroup: '+group.attr('id')+' - '+ arguments[i].attr('id'));
            dom.appendSVGElement(group.instance(), arguments[i]);
        }
    }
    return group;
};

/**
 * Adds ands an svg element ot the given group.
 * @param cfg
 * @param part
 * @returns {*}
 */
SVG.prototype.addToGroup = function(group, element) {
    var result;
    if(object.isArray(element)) {
        result = [];
        object.each(element, function(index, val) {
            result.push(dom.appendSVGElement(group.instance(), element));
        })
    } else {
        return dom.appendSVGElement(group.instance(), element);
    }
};

/**
 * Adds and returns a newly created svg Path with the given settings to the given (or default) part.
 * @param cfg
 * @param part
 * @returns {*}
 */
SVG.prototype.path = function(cfg, part) {
    var part = this.svgParts[part] || this.getDefaultPart();
    return this.add(new shapes.Path(this, cfg), part);
};

SVG.prototype.empty = function() {
    $(this.root.instance()).empty();
};

SVG.prototype.asString = function() {
    return this.root.toString();
};

/**
 * This function creates an SVGElement out of the given id selector element.
 * @param selector
 * @returns {SVGElement|exports|module.exports}
 */
SVG.get = function(selector) {
    if(selector.SVGElement) {
        return selector;
    }

    if(object.isString(selector)) {
        $node = $(dom.getIdSelector(selector));
    } else {
        $node = $(selector);
    }

    if(!$node.length) {
        console.warn('call SVG.get on a non existing node: '+selector);
        return [];
    } else if($node.length > 1) {
        //Return list of SVGElements
        var result = [];
        $node.each(function(index, value) {
            result.push(SVG.get(this));
        });
        return result;
    } else {
        //Return single SVgElement
        var $svgRootNode = $($node.get(0).ownerSVGElement);
        if($svgRootNode.length) {
            var svgInstance = instances[$svgRootNode.attr('id')];
            return SVG._svgInstance($node, svgInstance);
        } else {
            console.warn('Call SVG.get on node with no svg root');
        }
    }
};

SVG._svgInstance = function($node, svg) {
    var SVGShape = SVG.getShapeByName($node.get(0).nodeName);
    return (SVGShape) ? new SVGShape(svg).instance($node.get(0)) : new SVGGenericShape($node.get(0), svg);
};

SVG.getShapeByName = function(type) {
    var result = shapes[type.toLowerCase()];
    return result;
};

SVG.prototype.get = SVG.get;

module.exports = SVG;

},{"../util/Util":69,"./draggable":51,"./elements":52,"./helper":55,"./svgShape":63}],61:[function(require,module,exports){
arguments[4][48][0].apply(exports,arguments)
},{"../dom/domElement":46,"../util/util":75,"./style":59,"dup":48}],62:[function(require,module,exports){
var util = require('../util/util');
var object = require('../util/object');
var SVGElement = require('./svgElement');

var NAMESPACE_SVG = 'http://www.w3.org/2000/svg';
var NAMESPACE_XLINK = 'http://www.w3.org/1999/xlink';
var SVG_VERSION = '1.1';

var SVGRoot = function(svg, cfg) {
    cfg = cfg || {};
    cfg['xmlns'] = NAMESPACE_SVG;
    cfg['xmlns:xlink'] = NAMESPACE_XLINK;
    cfg['version'] = SVG_VERSION;
    SVGElement.call(this, 'svg', svg, cfg);
};

util.inherits(SVGRoot, SVGElement);

SVGRoot.prototype.x = function(value) {
    return (value) ? this.attrNumber('x', value) : this.attrNumber('x') || 0 ;
};

SVGRoot.prototype.y = function(value) {
    return (value) ? this.attrNumber('y', value) : this.attrNumber('y') || 0 ;
};

SVGRoot.prototype.getCenter = function() {
    return {
        x: this.x() + Math.floor(this.width() / 2),
        y: this.y() + Math.floor(this.height() / 2)
    };
};

SVGRoot.prototype.height = function(value) {
    if(!value) {
        return this.$().height();
    } else {
        this.attr('height', value);
    }
};

SVGRoot.prototype.width = function(value) {
    if(!value) {
        return this.$().width();
    } else {
        this.attr('width', value);
    }
};

module.exports = SVGRoot;
},{"../util/object":73,"../util/util":75,"./svgElement":61}],63:[function(require,module,exports){
var util = require('../util/util');
var object = require('../util/object');
var Transform = require('./transform');

var SVGElement = require('./SVGElement');

var SVGShape = function(name, svgRoot, cfg, attributeSetter) {
    cfg = cfg || {};
    this.attributeSetter = attributeSetter || {};
    this.attributeSetter.transform = this.transformationAttributeSetter;
    SVGElement.call(this, name, svgRoot, cfg, attributeSetter);
};

util.inherits(SVGShape, SVGElement);

SVGShape.prototype.transformationAttributeSetter = function(trnasformationString) {
    return new Transform(trnasformationString);
};

SVGShape.prototype.getTransformation = function() {
    if(!this.attributes.transform) {
        this.attributes.transform = new Transform();
    } else if(object.isString(this.attributes.transform)) {
        this.attributes.transform = new Transform(this.attributes.transform);
    }
    return this.attributes.transform;
};

SVGShape.prototype.transformedX = function(px) {
    return this.scaledX(this.translatedX(px));
};

SVGShape.prototype.transformedY = function(px) {
    return this.scaledY(this.translatedY(px));
};

SVGShape.prototype.scaledX = function(px) {
    return px * this.scale()[0]
};

SVGShape.prototype.scaledY = function(py) {
    return py * this.scale()[1]
};

SVGShape.prototype.rotate = function(val) {
    var result = this.getTransformation().rotate(val);

    if(result instanceof Transform) {
        // The scale setter returns the Transform itself object so we reset the scale
        // transform attribute in dom (setter was called)
        this.updateAttribute('transform');
        return this;
    } else {
        // The getter just returns the x,y values of the translate transformation
        return result;
    }
};

SVGShape.prototype.scale = function(sx, sy) {
    var result = this.getTransformation().scale(sx, sy);

    if(result instanceof Transform) {
        // The scale setter returns the Transform itself object so we reset the scale
        // transform attribute in dom (setter was called)
        this.updateAttribute('transform');
        return this;
    } else {
        // The getter just returns the x,y values of the translate transformation
        return result;
    }
};

SVGShape.prototype.translate = function(x, y) {
    var result = this.getTransformation().translate(x,y);

    if(result instanceof Transform) {
        // The trnaslate setter returns the Transform object so we reset the
        // transform attribute in dom (setter was called)
        this.updateAttribute('transform');
        return this;
    } else {
        // The getter just returns the x,y values of the translate transformation
        return result;
    }
};

SVGShape.prototype.translated = function(position) {
    var translate = this.getTransformation().translate();
    return {
        x : translate.x + position.x,
        y : translate.y + position.y
    }
};

SVGShape.prototype.translatedX = function(px) {
    var translate = this.getTransformation().translate();
    px = (object.isDefined(px)) ? px : 0;
    return translate.x + px;
};

SVGShape.prototype.translatedY = function(py) {
    var translate = this.getTransformation().translate();
    py = (object.isDefined(py)) ? py : 0;
    return translate.y + py;
};

SVGShape.prototype.hasTransformation = function(transformation) {
    if(object.isDefined(this.attributes.transform)) {
        return (object.isDefined(this.attributes.transform[transformation]));
    }
};

SVGShape.prototype.fill = function(color) {
    return this.style('fill', color);
};

SVGShape.prototype.fillOpacity = function(opacity) {
    return this.style('fill-opacity', opacity);
};

SVGShape.prototype.strokeOpacity = function(opacity) {
    return this.style('stroke-opacity', opacity);
};

SVGShape.prototype.stroke = function(color, width) {
    if(width) {
        this.strokeWidth(width);
    }
    return this.style('stroke', color);

};

SVGShape.prototype.strokeDasharray = function(type) {
    if(!type) {
        return this.style('stroke-dasharray');
    }
    if(object.isString(type)) {
        this.style('stroke-dasharray', type);
    } else {

    }
};

SVGShape.prototype.strokeDashType = function(type) {
    if(!type) {
        switch(this.strokeDasharray()) {
            case "5,5":
                return 1;
            case "10,10":
                return 2;
            case "20,10,5,5,5,10":
                return 3;
            default:
                return 0;
        }
    } else {
        switch(type) {
            case '1':
            case 1:
                this.strokeDasharray("5,5");
                break;
            case '2':
            case 2:
                this.strokeDasharray("10,10");
                break;
            case '3':
            case 3:
                this.strokeDasharray("20,10,5,5,5,10");
                break;
            default:
                this.strokeDasharray("none");
                break;
        }
    }
};

SVGShape.prototype.strokeWidth = function(width) {
    return util.app.parseNumberString(this.style('stroke-width', width)) || 0;
};

SVGShape.prototype.isVisible = function() {
    return (!this.fillOpacity() || this.fillOpacity() > 0)
        && (!this.strokeOpacity() || this.strokeOpacity() > 0);
};

SVGShape.prototype.hide = function() {
    this.fillOpacity(0);
    this.strokeOpacity(0);
};

SVGShape.prototype.show = function(opacity) {
    opacity = opacity || 1;
    this.fillOpacity(opacity);
    this.strokeOpacity(opacity);
};

/**
 * Determines the location of a given position relative to the svg element.
 *      _t_
 *    |\   /|
 *  l |  c  | r
 *    |/___\|
 *       b
 * @param node
 * @param position
 * @returns {*}
 */
SVGShape.prototype.getRelativeLocation = function(position) {
    //First we check if the point lies direct on the boundary
    if(position.x === this.x()) {
        return 'left';
    } else if(position.y === this.y()) {
        return 'top';
    } else if(position.x === this.getRightX()) {heigh
        return 'right';
    } else if(position.y === this.getBottomY()) {
        return 'bottom';
    }

    //If its not on the boundary we check the location by means of the line gradient
    var center = this.getCenter();
    var g = util.math.Line.calcGradient(center, position);
    if(position.y < center.y) { //position over elementcenter
        if (position.x >= center.x) { //position right (or eq) of elementcenter
            return (g > -1) ? 'right' : 'top';
        } else if (g < 1) {//position left and over of elementcenter
            return (g < 1) ? 'left' : 'top';
        }
    } else if(position.x >= center.x) { //position under (or eq) and right (or eq) of elementcenter
        return (g < 1) ? 'right' : 'bottom';
    } else { //position under and left of elementcenter
        return (g < -1) ? 'bottom' : 'left';
    }
};

SVGShape.prototype.x = function(withStroke) {
    return (withStroke) ? this.translatedX(this._getX()) - this.scaledX(this.strokeWidth()) / 2 : this.translatedX(this._getX());
};

SVGShape.prototype._getX = function() {
    return 0;
};

SVGShape.prototype.y = function(withStroke) {
    return (withStroke) ? this.translatedY(this._getY()) - this.scaledY(this.strokeWidth()) / 2 : this.translatedY(this._getY());
};

SVGShape.prototype._getY = function() {
    return 0;
};

SVGShape.prototype.position = function(withStroke) {
    var that = this;
    return {
        x : that.x(withStroke),
        y : that.y(withStroke)
    };
};

SVGShape.prototype.topLeft = function(withStroke) {
    return this.position(withStroke);
};

SVGShape.prototype.topRight = function(withStroke) {
    var that = this;
    return {
        x : that.getRightX(withStroke),
        y : that.y(withStroke)
    };
};

SVGShape.prototype.bottomRight = function(withStroke) {
    var that = this;
    return {
        x : that.getRightX(withStroke),
        y : that.getBottomY(withStroke)
    };
};

SVGShape.prototype.bottomLeft = function(withStroke) {
    var that = this;
    return {
        x : that.x(withStroke),
        y : that.getBottomY(withStroke)
    };
};

SVGShape.prototype.getCenter = function() {
    var c = {
        x: this.x() + Math.floor(this.width() / 2),
        y: this.y() + Math.floor(this.height() / 2)
    };
    return util.math.rotate(c, this.position(), this.rotate());
};

SVGShape.prototype.overlays = function() {
    var result = false;
    var that = this;
    object.each(arguments, function(index, position) {
        if(that.overlayCheck(position)) {
            result = true;
            return false; //TO break the each loop
        }
    });
    //console.log('result:'+result);
    return result;
};

/**
 * This is a default implementation for checking if a given position lies within the svgElement.
 * This can be overwritten by shapes like circles and ellipse..
 */
SVGShape.prototype.overlayCheck = function(position) {
    return position.x >= this.x() && position.x <= this.getRightX()
        && position.y >= this.y() && position.y <= this.getBottomY();
};

SVGShape.prototype.move = function(dx, dy) {
    var translate = this.translate();
    this.translate(translate.x + dx, translate.y + dy);
    return this;
};

SVGShape.prototype.moveTo = function(x, y) {
    var p = util.math.getPoint(x,y);

    var translate = this.translate();
    if(this.x() !== p.x || this.y() !== p.y) {
        //TODO: this does not consider x/y attribute settings
        this.translate(p);
    }
    return this;
};

SVGShape.prototype.moveX = function(x) {
    var translate = this.translate();
    if(translate.x !== x) {
        this.translate(x, translate.y);
    }
    return this;
};

SVGShape.prototype.moveY = function(y) {
    var translate = this.translate();
    if(translate.y !== y) {
        return this.translate(translate.x, y);
    }
    return this;
};

/**
 * Note: the implementation of getBBox differs between browsers some add the sroke-width and some do not add stroke-width
 */
SVGShape.prototype.height = function(value) {
    if((object.isBoolean(value) && value)) {
        return this.scaledY(this._getHeight()) + this.scaledY(this.strokeWidth());
    } else if(!object.isDefined(value) || (object.isBoolean(value) && !value)) {
        return this.scaledY(this._getHeight());
    } else {
        this._setHeight(value);
        return this;
    }
};

SVGShape.prototype._getHeight = function() {
    return this.getBBox().height;
};

SVGShape.prototype._setHeight = function() {
    //ABSTRACT
};

SVGShape.prototype.width = function(value) {
    if((object.isBoolean(value) && value)) {
        return this.scaledX(this._getWidth()) + this.scaledX(this.strokeWidth());
    } else if(!object.isDefined(value) || (object.isBoolean(value) && !value)) {
        return this.scaledX(this._getWidth());
    } else {
        this._setWidth(value);
        return this;
    }
};

SVGShape.prototype._getWidth = function() {
    return this.getBBox().width;
};

SVGShape.prototype._setWidth = function() {
   //ABSTRACT
};

SVGShape.prototype.getBottomY = function(withStroke) {
    return this.y(withStroke) + this.height(withStroke);
};

SVGShape.prototype.getRightX = function(withStroke) {
    return this.x(withStroke) + this.width(withStroke);
};

module.exports = SVGShape;
},{"../util/object":73,"../util/util":75,"./SVGElement":48,"./transform":65}],64:[function(require,module,exports){
var util = require('../util/util');
var object = require('../util/object');
var SVGShape = require('./svgShape');

var DEFAULT_FONT_SIZE = 11;
var DEFAULT_FONT_FAMILY = "Helvetica"; //Verdana, Arial, sans-serif ?
var DEFAULT_TEXT_ANCHOR = "start";
var DEFAULT_DOMINANT_BASELINE = "hanging";

var DEFAULT_SPAN_PADDING = 0;

var SVGText = function(svgRoot, cfg, attributeSetter) {
    cfg = cfg || {};
    cfg['font-family'] = cfg['font-size'] || DEFAULT_FONT_FAMILY;
    cfg['font-size'] = cfg['font-size'] || DEFAULT_FONT_SIZE;
    cfg['text-anchor'] = cfg['text-anchor'] || DEFAULT_TEXT_ANCHOR;
    cfg['dominant-baseline'] = cfg['dominant-baseline'] || DEFAULT_DOMINANT_BASELINE;

    this.spanPadding = cfg['padding'] || DEFAULT_SPAN_PADDING;

    SVGShape.call(this, 'text', svgRoot, cfg, attributeSetter);
    //TODO: Span / multi line text
};

util.inherits(SVGText, SVGShape);

SVGText.prototype.padding = function(value) {
    if(object.isDefined(value)) {
        this.spanPadding = value;
        this.setSpanAttr('x', value);
    } else {
        return this.spanPadding;
    }
};

SVGText.prototype.fontFamily = function(value) {
    return this.attr('font-family', value);
};

SVGText.prototype.fontSize = function(value) {
    var result = this.attrNumber('font-size', value);
    if(value) {
        this.setSpanAttr('dy', value);
        return this;
    } else {
        return result;
    }
};

SVGText.prototype.setSpanAttr = function(key, value) {
    this.$().children('tspan').attr(key, value);
    return this;
};

SVGText.prototype.x = function(value) {
    return (object.isDefined(value)) ? this.attrNumber('x', value) : this.translatedX(this.attrNumber('x', value)) || 0 ;
};

SVGText.prototype.y = function(value) {
    return (object.isDefined(value)) ? this.attrNumber('y', value) : this.translatedY(this.attrNumber('y', value)) || 0 ;
};

SVGText.prototype.dx = function(value) {
    return this.attrNumber('dx', value);
};

SVGText.prototype.dy = function(value) {
    return this.attrNumber('dy', value);
};

SVGText.prototype.move = function(dx, dy) {
    SVGText.super_.prototype.move.apply(this, [dx, dy]);
    this.alignBackground();
};

SVGText.prototype.moveTo = function(x, y) {
    SVGText.super_.prototype.moveTo.apply(this, [x, y]);
    this.alignBackground();
};

SVGText.prototype.content = function(text) {
    if(!text) {
        return this.getText();
    }

    var that = this;
    var height;
    this.$().empty();
    $.each(text.split('\n'), function(index, value) {
        if(object.isDefined(value) && value.trim().length > 0) {
            var tSpan = that.svg.tspan(value).x(that.spanPadding);
            that.append(tSpan);
            if(index > 0) {
                tSpan.dy(height);
            } else {
                height = tSpan.height();
            }
        }
    });
    return this;
};

SVGText.prototype.getText = function() {
    var result = '';
    var $children = this.$().children('tspan');
    $children.each(function(index, value) {
        result += $(this).text();
        if(index != $children.length -1) {
            result += '\n';
        }
    });
    return result;
};

SVGText.prototype.switchAnchor = function() {
    switch(this.anchor()) {
        case 'start':
            this.end();
        case 'end':
            this.start();
    }
};

SVGText.prototype.getExtentOfChar = function(charNum) {
    return this.instance().getExtentOfChar(charNum);
};

SVGText.prototype.getCharHeight = function(charNum) {
    return this.getExtentOfChar(charNum).height;
};

SVGText.prototype.start = function() {
    return this.anchor('start');
};

SVGText.prototype.end = function() {
    return this.anchor('end');
};

SVGText.prototype.middle = function() {
    return this.anchor('middle');
};

SVGText.prototype.anchor = function(value) {
    return this.attr('text-anchor', value);
};

SVGText.prototype.tSpan = function(index) {
    return this.svg.get(this.$().children('tspan').get(index));
};

SVGText.prototype.hanging = function(hanging) {
    var hanging = object.isDefined(hanging) ? hanging : true;
    var value = hanging ? 'hanging' : 'baseline';
    this.attr('dominant-baseline', value);
    var firstSpan = this.tSpan(0);
    var dy = (hanging) ? 0 : firstSpan.height() + this.getBBox().y;
    firstSpan.dy(dy);
    return this;
};

/**
 * Note: the background won't align when the text is dragged. Perhaps add drag hook
 * @param color
 */
SVGText.prototype.background = function(color) {
    var svgBackground = this.getBackground();
    if(color) {
        if(!svgBackground) {
            svgBackground = this.svg.rect({'class':'textBackground'});
        }
        svgBackground.fill(color);
        svgBackground.$().after(this.$());
        this.alignBackground();
    } else if(svgBackground) {
        svgBackground.fill();
    }
    return this;
};

/**
 *  TODO: probably just works for hanging texts because of the offset...
 */
SVGText.prototype.alignBackground = function() {
    var svgBackground = this.getBackground();
    if(svgBackground) {
        var bgHeight = this.height() + this.getBBox().y; //remove text offset
        svgBackground.height(bgHeight).width(this.width()).translate(this.x(), this.y());
    }
};

SVGText.prototype.getBackground = function() {
    if(this.backgroundSVG) {
        return this.backgroundSVG;
    }

    var prev = this.$().prev();
    if(prev.length > 0) {
        var svgBack = this.svg.get(prev);
        return this.backgroundSVG = (svgBack.hasClass('textBackground')) ? svgBack : undefined;
    }
};

SVGText.prototype.dominantBaseline = function(value) {
    return this.attr('dominant-baseline', value);
};

module.exports = SVGText;
},{"../util/object":73,"../util/util":75,"./svgShape":63}],65:[function(require,module,exports){
var util = require('../util/util');
var object = util.object;
var DomElement = require('../dom/domElement');

var Transform = function(def) {
    if(typeof def !== 'undefined' ) {
        if(object.isString(def)) {
            this.setDefinitionFromString(def);
        } else {
            this.definition = def;
        }
    } else {
        this.definition = {};
    }
};

Transform.prototype.setDefinitionFromString = function(value) {
    if(!this.definition) {
        this.definition = {};
    }

    // extract 'translate(200 200) rotate(45 50 50)' to "translate" "200 200" " rotate" "45 50 50" ""
    var transformations = value.split(/[\(\)]+/);
    for(var i = 0;i < transformations.length; i += 2) {
        var transformation = transformations[i].trim();
        if(transformation.length > 0) {
            var values = DomElement.getAttributeValueFromStringList(transformations[i+1]);
            for(var j = 0; j < values.length; j++) {
                // We prefer float values for calculations
                if(!isNaN(values[j])) {
                    values[j] = parseFloat(values[j]);
                }
            }
            this.definition[transformation] = values;
        }
    }
};

Transform.prototype.toString = function() {
    var values = [];
    for(var key in this.definition) {
        if(this.definition.hasOwnProperty((key))) {
            // first we assamble all transformations in an array ['translate(30)','rotate(45 50 50)']
            var singleTransformation = key+'('+DomElement.getAttributeString(this.definition[key])+')';
            values.push(singleTransformation);
        }
    }
    // merge the transformations to one attributestring
    var valueStr = DomElement.getAttributeString(values);

    if(valueStr.length > 0) {
        return valueStr;
    } else {
        // if we don't have any transormations set we just return an empty string
        return '';
    }
};

Transform.prototype.hasTransformation = function(key) {
    return (typeof this.definition[key] !== 'undefined');
};


Transform.prototype.rotate = function(val) {
    if(object.isDefined(val)) {
        this.definition.rotate = val;
        return this;
    } else {
        return this.definition.rotate || 0;
    }
};

Transform.prototype.scale = function(sx, sy) {
    sy = sy || sx;
    if(object.isDefined(sx)) {
        if(!this.definition.scale) {
            this.definition.scale = [sx, sy];
        } else {
            this.definition.scale[0] = sx;
            this.definition.scale[1] = sy;
        }
        return this;
    } else {
        var result = this.definition.scale;
        if(result && result.length === 1) {
            return [result[0], result[0]];
        } else if(result && result.length === 2) {
            return [result[0], result[1]]
        } else {
            return [1,1];
        }
    }
};

Transform.prototype.setScale = function(index, value) {
    if(index < 2 && this.definition.scale) {
        this.definition.scale[index] = value;
    }
};

Transform.prototype.translate = function(x, y) {
    var p = util.math.getPoint(x,y);

    if(object.isDefined(p)) {
        if(!this.definition.translate) {
            this.definition.translate = [p.x, p.y];
        } else {
            this.definition.translate[0] = p.x;
            this.definition.translate[1] = p.y;
        }
        return this;
    } else {
        if(this.definition.translate) {
            return {
                x : this.definition.translate[0],
                y : this.definition.translate[1]
            };
        } else {
            return {
                x : 0,
                y : 0
            }
        }
    }
}

module.exports = Transform;
},{"../dom/domElement":46,"../util/util":75}],66:[function(require,module,exports){
var util = require('../util/util');
var object = require('../util/object');
var SVGShape = require('./svgShape');
var SVGText = require('./text');

var DEFAULT_DOMINANT_BASELINE = 'inherit'

var SVGTSpan = function(svgRoot, cfg) {
    cfg = cfg || {};
    cfg['dominant-baseline'] = cfg['dominant-baseline'] || DEFAULT_DOMINANT_BASELINE;
    SVGShape.call(this, 'tspan', svgRoot, cfg);
};

util.inherits(SVGTSpan, SVGText);

SVGTSpan.prototype.content = function(value) {
    if(value) {
        this.$().text(value);
        return this;
    } else {
        return this.$().text();
    }
};

SVGTSpan.prototype.getBBox = function() {
    //some browser (e.g. firefox) does not implement the getBBox for tspan elements.
    return this.getBoundingClientRect();
};

module.exports = SVGTSpan;
},{"../util/object":73,"../util/util":75,"./svgShape":63,"./text":64}],67:[function(require,module,exports){
var dom = require('../dom/dom');
var object = require('../util/object');

EditPanel = function() {};

EditPanel.prototype.init = function(pageX, pageY, onclose) {
    var that = this;
    this.close();

    this.onclose = onclose;

    //Init Form
    this.$form = dom.create('form', {action : 'javascript:void(0);'})
        .on('submit', function() {
            that.close();
        });

    //Init Container
    this.$editDiv = dom.create('div', {id:'editPanel'})
        .offset({top: pageY, left: (pageX+5)})
        .css('position', 'absolute')
        .css('background-color', 'silver')
        .append(this.$form);

    //Append to body
    $('body').append(this.$editDiv);
    return this;
};

EditPanel.prototype.close = function() {
    if(this.onclose) {
        this.onclose.apply();
    }

    if(this.$editDiv) {
        this.$editDiv.remove();
    }
}

EditPanel.prototype.createTextEdit = function(pageX ,pageY, getter, setter) {
    var that = this;
    var $input = dom.create('input', {type:'text', value : getter()})
        .focus()
        .on('focus', function() {
            this.select();
        })
        .on('blur', function(evt) {
            that.close();
        })
        .on('change', function(evt) {
            setter($input.val());
        });

    this.init(pageX ,pageY);
    this.$form.append($input);
    $input.focus();
};

EditPanel.prototype.createTextAreaEdit = function(pageX ,pageY, getter, setter) {
    var that = this;
    var $input = dom.create('textarea')
        .val(getter())
        .on('change', function() {
            setter($input.val());
        })
        .on('blur', function(evt) {
            that.close();
        })
        .on('focus', function() {
            this.select();
        });

    this.init(pageX ,pageY);
    this.$form.append($input);
    $input.focus();
};

EditPanel.prototype.setTextAreaContent = function($textAreaNode, txtAreaContent) {
    $textAreaNode.empty();
    //TODO: we do not consider the text size for dy !
    var dy = 11;
    $.each(txtAreaContent.split('\n'), function(index, value) {
        if(object.isDefined(value) && value.trim().length > 0) {
            dom.appendSVGElement($textAreaNode.get(0), {
                name : 'tspan',
                attributes : {
                    dy : dy,
                    x : 2
                }
            }, value);
        }
    });
};

EditPanel.prototype.getTextAreaContent = function($textAreaNode) {
    var result = '';
    $textAreaNode.children().each(function() {
        result += $(this).text()+'\n';
    });
    return result;
};

module.exports = EditPanel;
},{"../dom/dom":45,"../util/object":73}],68:[function(require,module,exports){
var SVG = require('../svg/svg');
var queryCache = require('../core/cache');

$.fn.svg = function(selector) {
    if(selector && selector.SVGElement) {
        return selector;
    }else if(selector) {
        return $(selector).svg();
    }

    if(!this.length) {
        return;
    } else if(this.length === 1) {
        return SVG.get(this);
    } else if(this.length > 1) {
        var result =  [];
        this.each(function() {
            result.push(SVG.get(this));
        })
        return result;
    }

    return this;
};

$.svg = $.fn.svg;

$.qCache = function(selector, preventCache) {
    if(selector) {
        return queryCache.$(selector, preventCache);
    } else {
        return queryCache;
    }
};

$.qUncache = function(selector) {
    return queryCache.remove(selector);
};

/**
 * The problem with ui-selectmenu is that it causes a second keydown trigger event when focused.
 * So global keydown events are triggered twiche like do/undo if focused. The following event
 * prevents the propagation if the control key is pressed.
 */
$(document, '.ui-selectmenu-button').on('keydown', function(evt) {
    if(evt.ctrlKey) {
        evt.stopPropagation();
    }
});

$.fn.growl = function(params) {
    var $root = this;

    // tooltip content and styling
    var $content = $(
        '<a class="icon-close" href="#"></a>'+
        '<h1 style="color: white; font-size: 12pt; font-weight: bold; padding-bottom: 5px;">' + params.title + '</h1>' +
        '<p style="margin: 0; padding: 5px 0 5px 0; font-size: 10pt;">' + params.text + '</p>');

    // add 'Close' button functionality
    var $close = $($content[0]);
    $close.click(function(e) {
        $root.uitooltip('close');
    });

    // prevent standard tooltip from closing
    $root.bind('focusout mouseleave', function(e) { e.preventDefault(); e.stopImmediatePropagation(); return false; });

    // build tooltip
    $root.uitooltip({
        content: function() { return $content; },
        items: $root.selector,
        tooltipClass: 'growl ' + params.growlClass,
        position: {
            my: 'right top',
            at: 'right-10 top+10'
        },
        close: function( event, ui ) {
            $root.uitooltip('destroy');
        }
    }).uitooltip('open');

    if(params.closeAfter) {
        setTimeout(function(){ $root.uitooltip('close'); }, params.closeAfter);
    }
};

if($.ui) {
    $.widget( "custom.iconselectmenu", $.ui.selectmenu, {
        _renderItem: function( ul, item ) {
            var li = $( "<li>", { text: item.label } );
            if ( item.disabled ) {
                li.addClass( "ui-state-disabled" );
            }
            $( "<span>", {
                style: item.element.attr( "data-style" ),
                "class": "ui-icon " + item.element.attr( "data-class" )
            })
                .appendTo( li );
            return li.appendTo( ul );
        }
    });
}

},{"../core/cache":2,"../svg/svg":60}],69:[function(require,module,exports){
var util = require("util");

module.exports = {
    object: require('./object'),
    string: require('./string'),
    dom: require('./../dom/dom'),
    app: require('./app'),
    math: require('./math'),
    xml : require('./xml'),
    inherits: util.inherits
}
},{"./../dom/dom":45,"./app":70,"./math":72,"./object":73,"./string":74,"./xml":76,"util":81}],70:[function(require,module,exports){
/**
 * This module serves as an wrapper for dom manipulation functionality. It is
 * highly prefered to use this module instead of jquery directly within other
 * modules.
 */
var object = require('./object');

var parseFeatureStrings = function(value, defaultVal) {
    var result = [];
    value = value.split(' ');
    object.each(value, function(index, feature) {
        result[index] = parseFeatureString(feature, defaultVal);
    });
    return result;
};

/**
 * parse a featurestinrg in the form of
 *  'featurename(30,30)' or 'featurename(30.4) or featurename
 *
 * The result is would be
 *      { type : 'featurename', value : [30,30] }
 *      { type : 'featurename', value : 30.4 }
 *      { type : 'featurename', value : undefined }
 * @param {type} feature
 * @returns {App_L6.parseFeatureString.result}
 */
var parseFeatureString = function(feature, defaultVal) {
    var result = {};
    if(feature.indexOf('(') > -1) {
        var splitted = feature.split('(');
        var value = splitted[1].substring(0, splitted[1].indexOf(')'));

        if(value.indexOf(',') > -1) { // multiple args
            value = value.split(',');
            object.each(value, function(index, v) {
                value[index] = parseNumberString(v);
            });
        } else { // single arg
            value = parseNumberString(value);
        }
        result.type = splitted[0];
        result.value = value;
    } else {
        result.type = feature;
        result.value = defaultVal;
    }
    return result;
};

var parseNumberString = function(value) {
    if(!object.isString(value)) {
        return value;
    }

    //Cut units 1.2em -> 1.2
    value = value.split(/(?=[a-z,A-Z]+)/)[0];

    if(!isNaN(value)) {
        if(value.indexOf('.') > -1) { //float
            value = parseFloat(value);
        } else { //int
            value = parseInt(value);
        }
    }
    return value;
};

var createFeatureString = function(feature, value) {
    var result = feature;

    if(object.isDefined(value)) {
        result += '(';
        if(object.isArray(value)) {
            object.each(value, function(index, value) {
                result += (index !== 0) ? ','+value : value;
            });
        } else {
            result += value;
        }
        result += ')';
    }
    return result;
};

var isMinDist = function(from, to, minDist) {
    return Math.abs(to.x - from.x) > minDist || Math.abs(to.y - from.y) > minDist;
};

module.exports = {
    parseFeatureString:parseFeatureString,
    createFeatureString:createFeatureString,
    parseFeatureStrings:parseFeatureStrings,
    parseNumberString : parseNumberString,
    isMinDist : isMinDist
};

},{"./object":73}],71:[function(require,module,exports){
/**
 * most Bezier helpter functions are taken from jsBezier library https://github.com/jsplumb/jsBezier/blob/master/js/0.6/jsBezier-0.6.js
 * check /libs/jsBezier.js for more functions if required.
 *
 *
 */

if (typeof Math.sgn == "undefined") {
    Math.sgn = function (x) {
        return x == 0 ? 0 : x > 0 ? 1 : -1;
    };
}

var Vectors = {
        subtract: function (v1, v2) {
            return {x: v1.x - v2.x, y: v1.y - v2.y};
        },
        dotProduct: function (v1, v2) {
            return (v1.x * v2.x) + (v1.y * v2.y);
        },
        square: function (v) {
            return Math.sqrt((v.x * v.x) + (v.y * v.y));
        },
        scale: function (v, s) {
            return {x: v.x * s, y: v.y * s};
        }
    },

    maxRecursion = 64,
    flatnessTolerance = Math.pow(2.0, -maxRecursion - 1);

/**
 * finds the nearest point on the curve to the given point.
 */
var _nearestPointOnCurve = function (point, curve) {
    var td = _distanceFromCurve(point, curve);
    return {point: _bezier(curve, curve.length - 1, td.location, null, null), location: td.location};
};

/**
 * Calculates the distance that the point lies from the curve.
 *
 * @param point a point in the form {x:567, y:3342}
 * @param curve a Bezier curve in the form [{x:..., y:...}, {x:..., y:...}, {x:..., y:...}, {x:..., y:...}].  note that this is currently
 * hardcoded to assume cubiz beziers, but would be better off supporting any degree.
 * @return a JS object literal containing location and distance, for example: {location:0.35, distance:10}.  Location is analogous to the location
 * argument you pass to the pointOnPath function: it is a ratio of distance travelled along the curve.  Distance is the distance in pixels from
 * the point to the curve.
 */
var _distanceFromCurve = function (point, curve) {
    var candidates = [],
        w = _convertToBezier(point, curve),
        degree = curve.length - 1, higherDegree = (2 * degree) - 1,
        numSolutions = _findRoots(w, higherDegree, candidates, 0),
        v = Vectors.subtract(point, curve[0]), dist = Vectors.square(v), t = 0.0;

    for (var i = 0; i < numSolutions; i++) {
        v = Vectors.subtract(point, _bezier(curve, degree, candidates[i], null, null));
        var newDist = Vectors.square(v);
        if (newDist < dist) {
            dist = newDist;
            t = candidates[i];
        }
    }
    v = Vectors.subtract(point, curve[degree]);
    newDist = Vectors.square(v);
    if (newDist < dist) {
        dist = newDist;
        t = 1.0;
    }
    return {location: t, distance: dist};
};

var _convertToBezier = function (point, curve) {
    var degree = curve.length - 1, higherDegree = (2 * degree) - 1,
        c = [], d = [], cdTable = [], w = [],
        z = [[1.0, 0.6, 0.3, 0.1], [0.4, 0.6, 0.6, 0.4], [0.1, 0.3, 0.6, 1.0]];

    for (var i = 0; i <= degree; i++) c[i] = Vectors.subtract(curve[i], point);
    for (var i = 0; i <= degree - 1; i++) {
        d[i] = Vectors.subtract(curve[i + 1], curve[i]);
        d[i] = Vectors.scale(d[i], 3.0);
    }
    for (var row = 0; row <= degree - 1; row++) {
        for (var column = 0; column <= degree; column++) {
            if (!cdTable[row]) cdTable[row] = [];
            cdTable[row][column] = Vectors.dotProduct(d[row], c[column]);
        }
    }
    for (i = 0; i <= higherDegree; i++) {
        if (!w[i]) w[i] = [];
        w[i].y = 0.0;
        w[i].x = parseFloat(i) / higherDegree;
    }
    var n = degree, m = degree - 1;
    for (var k = 0; k <= n + m; k++) {
        var lb = Math.max(0, k - m),
            ub = Math.min(k, n);
        for (i = lb; i <= ub; i++) {
            j = k - i;
            w[i + j].y += cdTable[j][i] * z[j][i];
        }
    }
    return w;
};
/**
 * counts how many roots there are.
 */
var _findRoots = function (w, degree, t, depth) {
    var left = [], right = [],
        left_count, right_count,
        left_t = [], right_t = [];

    switch (_getCrossingCount(w, degree)) {
        case 0 :
        {
            return 0;
        }
        case 1 :
        {
            if (depth >= maxRecursion) {
                t[0] = (w[0].x + w[degree].x) / 2.0;
                return 1;
            }
            if (_isFlatEnough(w, degree)) {
                t[0] = _computeXIntercept(w, degree);
                return 1;
            }
            break;
        }
    }
    _bezier(w, degree, 0.5, left, right);
    left_count = _findRoots(left, degree, left_t, depth + 1);
    right_count = _findRoots(right, degree, right_t, depth + 1);
    for (var i = 0; i < left_count; i++) t[i] = left_t[i];
    for (var i = 0; i < right_count; i++) t[i + left_count] = right_t[i];
    return (left_count + right_count);
};
var _getCrossingCount = function (curve, degree) {
    var n_crossings = 0, sign, old_sign;
    sign = old_sign = Math.sgn(curve[0].y);
    for (var i = 1; i <= degree; i++) {
        sign = Math.sgn(curve[i].y);
        if (sign != old_sign) n_crossings++;
        old_sign = sign;
    }
    return n_crossings;
};
var _isFlatEnough = function (curve, degree) {
    var error,
        intercept_1, intercept_2, left_intercept, right_intercept,
        a, b, c, det, dInv, a1, b1, c1, a2, b2, c2;
    a = curve[0].y - curve[degree].y;
    b = curve[degree].x - curve[0].x;
    c = curve[0].x * curve[degree].y - curve[degree].x * curve[0].y;

    var max_distance_above = max_distance_below = 0.0;

    for (var i = 1; i < degree; i++) {
        var value = a * curve[i].x + b * curve[i].y + c;
        if (value > max_distance_above)
            max_distance_above = value;
        else if (value < max_distance_below)
            max_distance_below = value;
    }

    a1 = 0.0;
    b1 = 1.0;
    c1 = 0.0;
    a2 = a;
    b2 = b;
    c2 = c - max_distance_above;
    det = a1 * b2 - a2 * b1;
    dInv = 1.0 / det;
    intercept_1 = (b1 * c2 - b2 * c1) * dInv;
    a2 = a;
    b2 = b;
    c2 = c - max_distance_below;
    det = a1 * b2 - a2 * b1;
    dInv = 1.0 / det;
    intercept_2 = (b1 * c2 - b2 * c1) * dInv;
    left_intercept = Math.min(intercept_1, intercept_2);
    right_intercept = Math.max(intercept_1, intercept_2);
    error = right_intercept - left_intercept;
    return (error < flatnessTolerance) ? 1 : 0;
};
var _computeXIntercept = function (curve, degree) {
    var XLK = 1.0, YLK = 0.0,
        XNM = curve[degree].x - curve[0].x, YNM = curve[degree].y - curve[0].y,
        XMK = curve[0].x - 0.0, YMK = curve[0].y - 0.0,
        det = XNM * YLK - YNM * XLK, detInv = 1.0 / det,
        S = (XNM * YMK - YNM * XMK) * detInv;
    return 0.0 + XLK * S;
};

var _bezier = function (curve, degree, t, left, right) {
    var temp = [[]];
    for (var j = 0; j <= degree; j++) temp[0][j] = curve[j];
    for (var i = 1; i <= degree; i++) {
        for (var j = 0; j <= degree - i; j++) {
            if (!temp[i]) temp[i] = [];
            if (!temp[i][j]) temp[i][j] = {};
            temp[i][j].x = (1.0 - t) * temp[i - 1][j].x + t * temp[i - 1][j + 1].x;
            temp[i][j].y = (1.0 - t) * temp[i - 1][j].y + t * temp[i - 1][j + 1].y;
        }
    }
    if (left != null)
        for (j = 0; j <= degree; j++) left[j] = temp[j][0];
    if (right != null)
        for (j = 0; j <= degree; j++) right[j] = temp[degree - j][j];

    return (temp[degree][0]);
};

var _curveFunctionCache = {};
var _getCurveFunctions = function (order) {
    var fns = _curveFunctionCache[order];
    if (!fns) {
        fns = [];
        var f_term = function () {
                return function (t) {
                    return Math.pow(t, order);
                };
            },
            l_term = function () {
                return function (t) {
                    return Math.pow((1 - t), order);
                };
            },
            c_term = function (c) {
                return function (t) {
                    return c;
                };
            },
            t_term = function () {
                return function (t) {
                    return t;
                };
            },
            one_minus_t_term = function () {
                return function (t) {
                    return 1 - t;
                };
            },
            _termFunc = function (terms) {
                return function (t) {
                    var p = 1;
                    for (var i = 0; i < terms.length; i++) p = p * terms[i](t);
                    return p;
                };
            };

        fns.push(new f_term());  // first is t to the power of the curve order
        for (var i = 1; i < order; i++) {
            var terms = [new c_term(order)];
            for (var j = 0; j < (order - i); j++) terms.push(new t_term());
            for (var j = 0; j < i; j++) terms.push(new one_minus_t_term());
            fns.push(new _termFunc(terms));
        }
        fns.push(new l_term());  // last is (1-t) to the power of the curve order

        _curveFunctionCache[order] = fns;
    }

    return fns;
};


/**
 * calculates a point on the curve, for a Bezier of arbitrary order.
 * @param curve an array of control points, eg [{x:10,y:20}, {x:50,y:50}, {x:100,y:100}, {x:120,y:100}].  For a cubic bezier this should have four points.
 * @param location a decimal indicating the distance along the curve the point should be located at.  this is the distance along the curve as it travels, taking the way it bends into account.  should be a number from 0 to 1, inclusive.
 */
var _pointOnPath = function (curve, location) {
    var cc = _getCurveFunctions(curve.length - 1),
        _x = 0, _y = 0;
    for (var i = 0; i < curve.length; i++) {
        _x = _x + (curve[i].x * cc[i](location));
        _y = _y + (curve[i].y * cc[i](location));
    }

    return {x: _x, y: _y};
};

var _dist = function (p1, p2) {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
};

var _isPoint = function (curve) {
    return curve[0].x == curve[1].x && curve[0].y == curve[1].y;
};

/**
 * finds the point that is 'distance' along the path from 'location'.  this method returns both the x,y location of the point and also
 * its 'location' (proportion of travel along the path); the method below - _pointAlongPathFrom - calls this method and just returns the
 * point.
 */
var _pointAlongPath = function (curve, location, distance) {

    if (_isPoint(curve)) {
        return {
            point: curve[0],
            location: location
        };
    }

    var prev = _pointOnPath(curve, location),
        tally = 0,
        curLoc = location,
        direction = distance > 0 ? 1 : -1,
        cur = null;

    while (tally < Math.abs(distance)) {
        curLoc += (0.005 * direction);
        cur = _pointOnPath(curve, curLoc);
        tally += _dist(cur, prev);
        prev = cur;
    }
    return {point: cur, location: curLoc};
};

var _length = function (curve) {
    if (_isPoint(curve)) return 0;

    var prev = _pointOnPath(curve, 0),
        tally = 0,
        curLoc = 0,
        direction = 1,
        cur = null;

    while (curLoc < 1) {
        curLoc += (0.005 * direction);
        cur = _pointOnPath(curve, curLoc);
        tally += _dist(cur, prev);
        prev = cur;
    }
    return tally;
};

/**
 * finds the point that is 'distance' along the path from 'location'.
 */
var _pointAlongPathFrom = function (curve, location, distance) {
    return _pointAlongPath(curve, location, distance).point;
};

/**
 * finds the location that is 'distance' along the path from 'location'.
 */
var _locationAlongPathFrom = function (curve, location, distance) {
    return _pointAlongPath(curve, location, distance).location;
};

/**
 * returns the gradient of the curve at the given location, which is a decimal between 0 and 1 inclusive.
 *
 * thanks // http://bimixual.org/AnimationLibrary/beziertangents.html
 */
var _gradientAtPoint = function (curve, location) {
    var p1 = _pointOnPath(curve, location),
        p2 = _pointOnPath(curve.slice(0, curve.length - 1), location),
        dy = p2.y - p1.y, dx = p2.x - p1.x;
    return dy == 0 ? Infinity : Math.atan(dy / dx);
};

/**
 returns the gradient of the curve at the point which is 'distance' from the given location.
 if this point is greater than location 1, the gradient at location 1 is returned.
 if this point is less than location 0, the gradient at location 0 is returned.
 */
var _gradientAtPointAlongPathFrom = function (curve, location, distance) {
    var p = _pointAlongPath(curve, location, distance);
    if (p.location > 1) p.location = 1;
    if (p.location < 0) p.location = 0;
    return _gradientAtPoint(curve, p.location);
};

/**
 * calculates a line that is 'length' pixels long, perpendicular to, and centered on, the path at 'distance' pixels from the given location.
 * if distance is not supplied, the perpendicular for the given location is computed (ie. we set distance to zero).
 */
var _perpendicularToPathAt = function (curve, location, length, distance) {
    distance = distance == null ? 0 : distance;
    var p = _pointAlongPath(curve, location, distance),
        m = _gradientAtPoint(curve, p.location),
        _theta2 = Math.atan(-1 / m),
        y = length / 2 * Math.sin(_theta2),
        x = length / 2 * Math.cos(_theta2);
    return [{x: p.point.x + x, y: p.point.y + y}, {x: p.point.x - x, y: p.point.y - y}];
};

var _calculateSmoothControlPoints = function(K) {
    var resultP1 = [];
    var resultP2 = [];
    var n = K.length-1;

    /*rhs vector init left most segment*/
    var a = [0];
    var b = [2];
    var c = [1];
    var r = [K[0] + 2 * K[1]];

    /*internal segments*/
    for(i = 1; i < n - 1; i++) {
        a[i] = 1;
        b[i] = 4;
        c[i] = 1;
        r[i] = 4 * K[i] + 2 * K[i+1];
    }

    /*right segment*/
    a[n-1] = 2;
    b[n-1] = 7;
    c[n-1] = 0;
    r[n-1] = 8 * K[n-1] + K[n];

    /*solves Ax=b with the Thomas algorithm*/
    for(i = 1; i < n; i++) {
        m = a[i] / b[i-1];
        b[i] = b[i] - m * c[i - 1];
        r[i] = r[i] - m * r[i-1];
    }

    resultP1[n-1] = r[n-1] / b[n-1];
    for (i = n - 2; i >= 0; --i) {
        resultP1[i] = (r[i] - c[i] * resultP1[i + 1]) / b[i];
    }

    /*we have p1, now compute p2*/
    for (i = 0; i < n - 1; i++) {
        resultP2[i] = 2 * K[i + 1] - resultP1[i + 1];
    }

    resultP2[n-1] = 0.5 * (K[n] + resultP1[n-1]);

    return {p1:resultP1, p2:resultP2};
};

/**
 * Moves a point along the given curve
 * @param curve
 * @param distance
 * @returns {*|{x, y}}
 */
var moveAlong = function(curve, distance) {
    // Somehow the pointAlongPath calculates in the wrong direction so we switch the bahaviour by setting
    // the location to 1 (end) for positive distances.
    // and negotiate the distance value.
    var location = distance > 0 ? 1 : 0;
    var distance = distance * -1;
    return _pointAlongPath(curve,location, distance).point;
};

module.exports = {
    nearestPointOnCurve : _nearestPointOnCurve,
    calculateSmoothControlPoints : _calculateSmoothControlPoints,
    moveAlong : moveAlong,
    length : _length
}


},{}],72:[function(require,module,exports){
var object = require('./object');
var bezier = require('./bezier');

var calcLineIntersection = function(pa1, pa2, pb1, pb2) {
    return new Line(pa1,pa2).calcLineIntercept(new Line(pb1,pb2));
};

var Point = function(x, y) {
    var p = getPoint(x,y);
    this.x = p.x;
    this.y = p.y;
};

Point.prototype.isWithinInterval = function(start, end, tolerance) {
    return isPointInInterval(this, start, end, tolerance);
};

Point.prototype.isWithinXInterval = function(start, end, tolerance) {
    return _inInterval(this, start, end, tolerance, 'x');
};

Point.prototype.isWithinYInterval = function(start, end, tolerance) {
    return _inInterval(this, start, end, tolerance, 'y');
};;

var isPointInInterval = function(point, start, end, tolerance) {
    return _inInterval(point, start, end, tolerance, 'x') && _isPointInInterval(point, start, end, tolerance, 'y');
};

var _inInterval = function(p, start, end, tolerance, dimension) {
    tolerance = tolerance || 0;
    var boundary = minMax(start[dimension], end[dimension]);
    boundary.min -= tolerance;
    boundary.max += tolerance;
    return (p[dimension] <= boundary.max && p[dimension] >= boundary.min);
};

var minMax = function(val1, val2) {
    return {
        min :  Math.min(val1, val2),
        max : Math.max(val1, val2)
    };
};

var Line = function(p1, p2) {
    //y = mx + t
    if(p1.x) {
        this.op1 = p1;
        this.op2 = p2;
        this.p1 = (p1.x <= p2.x)? p1 : p2;
        this.p2 = (p1.x > p2.x)? p1 : p2;
        this.m = this.calcGradient();
        this.t = this.calcYIntercept();
    } else {
        this.m = p1;
        this.t = p2;
    }
};

Line.prototype.calcYIntercept = function() {
    // y = m * x + t => t = -mx + y
    return (-1 * this.m * this.p1.x) + this.p1.y;
};

Line.prototype.getOrthogonal = function(p) {
    //
    var newM = -1 / this.m;
    var t = p.y - (newM * p.x);
    return new Line(newM,t);
};

Line.prototype.calcGradient = function() {
    return Line.calcGradient(this.p1, this.p2);
};

Line.prototype.calcNormalizedLineVector = function() {
    return Line.calcNormalizedLineVector(this.p1, this.p2);
};

Line.prototype.isLtR = function() {
    return this.op1.x < this.op2.x;
};

Line.prototype.isTtB = function() {
    return this.op1.y < this.op2.y;
};


Line.calcNormalizedLineVector = function(p1, p2) {
    var vector = {
        x : p2.x - p1.x,
        y : p2.y - p1.y
    };

    var length = Math.sqrt(vector.x*vector.x + vector.y*vector.y);

    vector.x = vector.x / length;
    vector.y = vector.y / length;
    return vector;
};

/*
 *  TODO: this is working if you provide start/end and distance (negative or positive) but not tested (and presumably not working)
 *  when given start/end dist and direction e.g move from start point -30 back.
 */
Line.moveAlong = function(p1,p2, dist, direction) {
    var vector = Line.calcNormalizedLineVector(p1,p2);

    //If there is no direction given we handle negative distances as direction -1 (from end to start)
    direction = direction || (dist < 0) ? -1 : 1;

    if(direction < 1) {
        dist = Line.calcDistance(p1,p2) + dist;
    }

    return {
        x : p1.x + vector.x * dist,
        y : p1.y + vector.y * dist
    };
};

Line.prototype.moveAlong = function(dist, direction) {
    //TODO: note this is just working if we are initiating the line with two points...
    return Line.moveAlong(this.p1, this.p2, dist, direction);
};

Line.calcGradient = function(p1, p2) {
    return (p2.y - p1.y) / (p2.x - p1.x);
};

Line.prototype.calcFX = function(x) {
    var y = (this.m) * x + this.t;
    return {
        x : x,
        y : y
    };
};

Line.prototype.calcMidPoint = function() {
    return Line.calcMidPoint(this.p1, this.p2);
};

Line.calcMidPoint = function(p1, p2) {
    return {
        x : (p1.x+p2.x) / 2,
        y : (p1.y+p2.y) / 2
    };
};

Line.prototype.isVertical = function(x) {
    return !isFinite(this.m);
};

Line.prototype.isHorizontal = function(x) {
    return this.m === 0;
};

Line.prototype.calcLineIntercept = function(other) {
    //mx(1) + t(1) = mx(2) +t(2)
    var m = other.m + (-1 * this.m);
    var t = this.t + (-1 * other.t);
    var x = (m !== 0) ? t / m : t;
    return this.calcFX(x);
};

Line.prototype.getNearestPoint = function(p) {
    return Line.getNearestPoint(this.p1, this.p2, p);
};

Line.getNearestPoint = function(a, b, p) {
    var AP = [p.x - a.x, p.y - a.y]; // vector A->P
    var AB = [b.x - a.x, b.y - a.y]; // vector A->B
    var magnitude = AB[0] * AB[0] + AB[1] * AB[1] //AB.LengthSquared

    var AP_DOT_AB = AP[0] * AB[0] + AP[1] * AB[1];

    var distance = AP_DOT_AB / magnitude;

    if(distance < 0) {
        return a;
    } else if (distance > 1) {
        return b;
    } else {
        return {
            x: a.x + AB[0] * distance,
            y: a.y + AB[1] * distance
        }
    }
};

Line.calcDistance = function(p1, p2) {
    return Math.sqrt(Math.pow((p2.y - p1.y),2) + Math.pow((p2.x - p1.x),2));
}

var SimpleVector = function(x, y) {
    this.x = x;
    this.y = y;
};

SimpleVector.prototype.dot = function(that) {
    return this.x*that.x + this.y*that.y;
};

SimpleVector.fromPoints = function(p1, p2) {
    return new SimpleVector(
        p2.x - p1.x,
        p2.y - p1.y
    );
};

SimpleVector.prototype.subtract = function(that) {
    return new SimpleVector(this.x - that.x, this.y - that.y);
};

var Ellipse = function(cx, cy, rx, ry) {
    switch(arguments.length) {
        case 4:
            this.c = {x:cx,y:cy};
            this.rx = rx;
            this.ry = ry;
            break;
        case 3:
            this.c = cx;
            this.rx = cy;
            this.ry = rx;
            break;
    }
};

Ellipse.prototype.calcLineIntercept = function(p1,p2) {
    var result = [];

    if(arguments.length === 1) {
        p2 = p1.p2;
        p1 = p1.p1;
    }

    var origin = new SimpleVector(p1.x, p1.y);
    var dir = SimpleVector.fromPoints(p1, p2);
    var center = new SimpleVector(this.c.x, this.c.y);
    var diff = origin.subtract(center);
    var mDir = new SimpleVector(dir.x/(this.rx*this.rx),  dir.y/(this.ry*this.ry));
    var mDiff = new SimpleVector(diff.x/(this.rx*this.rx), diff.y/(this.ry*this.ry));

    var aDiff = dir.dot(mDir);
    var bDiff = dir.dot(mDiff);
    var cDiff = diff.dot(mDiff) - 1.0;
    var dDiff = bDiff*bDiff - aDiff*cDiff;

    if (dDiff > 0) {
        var root = Math.sqrt(dDiff);
        var tA  = (-bDiff - root) / aDiff;
        var tB  = (-bDiff + root) / aDiff;

        if (!((tA < 0 || 1 < tA) && (tB < 0 || 1 < tB))) {
            if (0 <= tA && tA <= 1) {
                result.push(lerp(p1, p2, tA));
            }
            if ( 0 <= tB && tB <= 1 ) {
                result.push(lerp(p1, p2, tB));
            }
        }
    } else {
        var t = -bDiff/aDiff;
        if (0 <= t && t <= 1) {
            result.push(lerp(p1. a2, t));
        }
    }

    return result;
};

Ellipse.prototype.overlays = function(p) {
    var bx = Math.pow((p.x - this.c.x), 2) / Math.pow(this.rx, 2);
    var by = Math.pow((p.y - this.c.y), 2) / Math.pow(this.ry, 2);
    return bx + by <= 1
};

var Circle = function(cx, cy, r) {
    if(arguments.length === 2) {
        this.c = cx;
        this.r = cy;
    } else {
        this.c = {x: cx, y : cy};
        this.r = r;
    }
};

Circle.prototype.overlays = function(p) {
    var bx = Math.pow((p.x - this.c.x), 2);
    var by = Math.pow((p.y - this.c.y), 2);
    return bx + by < Math.pow(this.r, 2);
};

Circle.prototype.calcLineIntercept = function(p1, p2) {
    var result = [];

    if(arguments.length === 1) {
        p2 = p1.p2;
        p1 = p1.p1;
    }

    var a = (p2.x - p1.x) * (p2.x - p1.x)
        + (p2.y - p1.y) * (p2.y - p1.y);
    var b  = 2 * ((p2.x - p1.x) * (p1.x - this.c.x)
        + (p2.y - p1.y) * (p1.y - this.c.y)   );
    var cc = this.c.x*this.c.x + this.c.y*this.c.y + p1.x*p1.x + p1.y*p1.y -
        2 * (this.c.x * p1.x + this.c.y * p1.y) - this.r*this.r;
    var deter = b*b - 4*a*cc;

    if(deter > 0) {
        var root  = Math.sqrt(deter);
        var tA = (-b + root) / (2*a);
        var tB = (-b - root) / (2*a);

        if (!((tA < 0 || tA > 1) && (tB < 0 || tB > 1))) {
            if (0 <= tA && tA <= 1) {
                result.push(lerp(p1, p2, tA));
            }

            if (0 <= tB && tB <= 1) {
                result.push(lerp(p1, p2, tB));
            }
        }
    }
    return result;
};

var lerp = function(a, b, t) {
    return {
        x : a.x + (b.x - a.x) * t,
        y : a.y + (b.y - a.y) * t
    };
};

var Vector = function() {
    this.vectors = [];
    var currentArr;
    for(var i = 0; i < arguments.length; i++) {
        if(object.isArray(arguments[i])) {
            if(currentArr) {
                this.add(currentArr);
                currentArr = undefined;
            }
            this.add(arguments[i]);
        } else {
            currentArr = currentArr || [];
            currentArr.push(arguments[i]);
        }
    };

    if(currentArr) {
        this.add(currentArr);
        delete currentArr;
    }
};

/**
 * Adds a vector value either by providing seperated arguments or an array of values
 */
Vector.prototype.add = function() {
    var value;
    if(arguments.length > 1) {
        value = [];
        for(var i = 0; i < arguments.length; i++) {
            value.push(arguments[i]);
        }
    } else if(arguments.length === 1) {
        value = arguments[0];
    }
    this.vectors.push(value);
};

Vector.prototype.value = function() {
    try {
        var path = object.isArray(arguments[0]) ? arguments[0] : Array.prototype.slice.call(arguments);
        return getVectorValue(this.vectors, path);
    } catch(e) {
        console.error('get value vector failed - '+this.vectors+' args: '+arguments);
    }
};

Vector.prototype.clear = function() {
    this.vectors = [];
};

Vector.prototype.setValue = function(pathArr, value) {
    try {
        pathArr = !object.isArray(pathArr) ? [pathArr] : pathArr;
        var parentPath = pathArr.splice(0, pathArr.length -1);
        this.value(parentPath)[pathArr[pathArr.length -1]] = value;
    } catch(e) {
        console.error('set value vector failed - '+this.vectors+' args: '+arguments);
    }
};

Vector.prototype.insert = function(pathArr, value) {
    try {
        pathArr = !object.isArray(pathArr) ? [pathArr] : pathArr;
        var parentPath = pathArr.splice(0, pathArr.length -1);
        this.value(parentPath).splice(pathArr[pathArr.length -1], 0, value);
    } catch(e) {
        console.error('set value vector failed - '+this.vectors+' args: '+arguments);
    }
};

Vector.prototype.length = function() {
    return this.vectors.length;
}

Vector.prototype.remove = function(pathArr) {
    pathArr = !object.isArray(pathArr) ? [pathArr] : pathArr;
    var parentPath = pathArr.splice(0, pathArr.length -1);
    this.value(parentPath).splice(pathArr[pathArr.length -1], 1);
};

Vector.prototype.last = function() {
    return this.vectors[this.vectors.length -1];
};

Vector.prototype.each = function(handler) {
    object.each(this.vectors, function(index, value) {
        handler(index,value);
    });
};

/**
 * Note the indexes can be negative to retrieve values from the end of the vector e.g. -1 is the last
 * @param vectorArr
 * @param args
 * @returns {*}
 */
var getVectorValue = function(vectorArr, args) {
    if(!args) {
        return vectorArr;
    }else if(object.isArray(args)) {
        switch(args.length) {
            case 0:
                return vectorArr;
            case 1:
                return object.valueByIndex(vectorArr, args[0]);
            default:
                var index = args[0];
                return getVectorValue(vectorArr[index], args.splice(1));
        }
    } else {
        return object.valueByIndex(vectorArr, args);
    }
};

/**
 * Checks if the difference between source and target value is lower than the given range value
 */
var checkRangeDiff = function(source, target, range) {
    return isInDiffRange(target, source, range);
};

var isInDiffRange = function(p1, p2, range) {
    return Math.abs(p1 - p2) < range;
};

var getPoint = function(x, y) {
    var result;
    if(x && object.isDefined(x.x) && object.isDefined(x.y)) {
        result = x;
    } else if(!isNaN(x) && !isNaN(y)) {
        result = {
            x : x,
            y : y
        };
    } else if(object.isDefined(x) && object.isDefined(y)) {
        result = toPoint(x,y);
    }
    return result;
};

var toPoint = function(x,y) {
    x = (object.isString(x)) ? parseFloat(x) : x;
    y = (object.isString(y)) ? parseFloat(y) : y;

    return {x:x,y:y};
};

var toRadians = function (angle) {
    return angle * (Math.PI / 180);
};

var toDegrees = function(angle) {
    return angle * (180 / Math.PI);
};

var rotate = function(p, rotCenter, angle) {
    if(angle === 0 || (p.x === rotCenter.x && p.y === rotCenter.y)) {
        return p;
    }

    var rotated = {};
    var rad = toRadians(angle);
    rotated.x = (p.x - rotCenter.x) * Math.cos(rad) - (p.y - rotCenter.y) * Math.sin(rad) + rotCenter.x;
    rotated.y = (p.y - rotCenter.y) * Math.cos(rad) + (p.x - rotCenter.x) * Math.sin(rad) + rotCenter.y;
    p.x = rotated.x;
    p.y = rotated.y;
    return p;
};


module.exports = {
    calcLineIntersection : calcLineIntersection,
    Line : Line,
    Circle : Circle,
    Ellipse : Ellipse,
    Vector : Vector,
    Point : Point,
    isPointInInterval : isPointInInterval,
    minMax : minMax,
    checkRangeDiff : checkRangeDiff,
    getPoint : getPoint,
    bezier : bezier,
    toRadians : toRadians,
    toDegrees : toDegrees,
    rotate : rotate
};
},{"./bezier":71,"./object":73}],73:[function(require,module,exports){
module.exports = {
    each: function() {
        return $.each(arguments[0], arguments[1], arguments[2]);
    },

    grep: function(arr, filter, invert) {
        return $.grep(arr, filter, invert);
    },

    isOneOf: function(search) {
        var i;
        for(i = 1;i < arguments.length;i++) {
          if(search === arguments[i]) {
              return true;
          }
        }
        return false;
    },

    isArray: function(obj) {
        return $.isArray(obj);
    },

    toArray : function(obj) {
        return $.map(obj, function(value, index) {
            return [value];
        });
    },

    removeFromArray: function(arr, item) {
        var index = arr.indexOf(item);
        if(index >= 0) {
            arr.splice(index, 1);
            return true;
        }
        return false;
    },

    sort: function(obj, sort) {
        var arr;
        if(!obj) {
            return;
        } else if(this.isArray(obj)) {
            arr = obj;
        } else if(this.isObject(obj)) {
            arr = $.map(obj, function (index, val) {
                return obj[val];
            });
        }

        return arr.sort(sort);
    },

    valueByIndex: function(arr, index) {
        var index = this.getIndex(arr,index);
        return arr[index];
    },

    getIndex: function(arr, index) {
        var result = index;
        // for negative indexes we return values counted from the other side so -1 is the last index
        // if the negative index is out of range we return the last index.
        if(index < 0) {
            result = arr.length + index;
            result = (result > arr.length -1 || result < 0) ? arr.length -1 : result;
        }
        return result;
    },

    isFunction: function(obj) {
        return Object.prototype.toString.call(obj) === '[object Function]';
    },

    isObject: function(obj) {
        return $.isPlainObject(obj);
    },

    isJQuery: function(obj) {
        return obj.jquery;
    },

    isString: function(obj) {
        return typeof obj === 'string';
    },

    isBoolean: function(obj) {
        return typeof obj === 'boolean';
    },

    isDefined: function(obj) {
        if(arguments.length > 1) {
            var result = true;
            var that = this;
            this.each(arguments, function(index, value) {
                if(!that.isDefined(value)) {
                    result = false;
                    return false;
                }
            });

            return result;
        }
        return typeof obj !== 'undefined';
    },

    merge: function(target, toMerge) {
        return $.merge(target, toMerge);
    },


    addValue: function(target, newVal) {
        if(isArray(newVal)) {
            merge(target);
        } else {
            target.push(newVal);
        }
    },

    extend: function(target, obj1, obj2) {
        return $.extend(target,obj1,obj2);
    },

    cloneArray: function(arr) {
        return arr.slice(0);
    },

    cloneObject: function(oldObject, deep) {
        deep = deep || false;
        return $.extend(deep, {}, oldObject);
    }
    
};
},{}],74:[function(require,module,exports){
var object = require('./object');

exports.endsWith = function(val, suffix) {
    if(!object.isDefined(val) || !object.isDefined(suffix)) {
        return false;
    }
    return val.indexOf(suffix, val.length - suffix.length) !== -1;
};

exports.startsWith = function(val, prefix) {
    if(!object.isDefined(val) || !object.isDefined(prefix)) {
        return false;
    }
    return val.indexOf(prefix) === 0;
};
},{"./object":73}],75:[function(require,module,exports){
arguments[4][69][0].apply(exports,arguments)
},{"./../dom/dom":45,"./app":70,"./math":72,"./object":73,"./string":74,"./xml":76,"dup":69,"util":81}],76:[function(require,module,exports){
var string = require('./string');

var serializeToString = function(node) {
    var s = new XMLSerializer();
    node = (node.jQuery) ? node[0] : node;
    return s.serializeToString(node);
};

var parseXML = function(strData) {
    return $.parseXML(strData);
};

var format = function (xml) {
    var intend = -1;
    var result = '';
    xml = xml.replace(/(\r\n|\n|\r)/gm,"");
    var lastWasClose = false;
    var lastHadText = false;
    $.each(xml.split('<'), function(index, node) {
        node = node.trim();
        if(node) {
            if(node.indexOf('/') !== 0) {
                if(!lastWasClose) {
                    intend++;
                }

                lastHadText = !string.endsWith(node, '>');
                lastWasClose = string.endsWith(node, '/>');
            } else {
                if(!lastHadText) {
                    lastWasClose = true;
                    intend--;
                }
                lastHadText = !string.endsWith(node, '>');
            }

            var padding = '';
            for (var i = 0; i < intend; i++) {
                padding += '  ';
            }

            var text;
            if(lastHadText) {
                var splitted = node.split('>');
                node = splitted[0] + '>';
                text = splitted[1];
            }
            result += padding + '<'+node+'\r\n';

            if(text) {
                result += padding + '  ' + text+'\r\n';
            }

        }
    });
    return result;
};

module.exports = {
    serializeToString : serializeToString,
    parseXML : parseXML,
    format: format
};
},{"./string":74}],77:[function(require,module,exports){
(function (process,global){
/* @preserve
 * The MIT License (MIT)
 * 
 * Copyright (c) 2014 Petka Antonov
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 * 
 */
/**
 * bluebird build version 2.9.34
 * Features enabled: core, race, call_get, generators, map, nodeify, promisify, props, reduce, settle, some, cancel, using, filter, any, each, timers
*/
!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.Promise=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof _dereq_=="function"&&_dereq_;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof _dereq_=="function"&&_dereq_;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise) {
var SomePromiseArray = Promise._SomePromiseArray;
function any(promises) {
    var ret = new SomePromiseArray(promises);
    var promise = ret.promise();
    ret.setHowMany(1);
    ret.setUnwrap();
    ret.init();
    return promise;
}

Promise.any = function (promises) {
    return any(promises);
};

Promise.prototype.any = function () {
    return any(this);
};

};

},{}],2:[function(_dereq_,module,exports){
"use strict";
var firstLineError;
try {throw new Error(); } catch (e) {firstLineError = e;}
var schedule = _dereq_("./schedule.js");
var Queue = _dereq_("./queue.js");
var util = _dereq_("./util.js");

function Async() {
    this._isTickUsed = false;
    this._lateQueue = new Queue(16);
    this._normalQueue = new Queue(16);
    this._trampolineEnabled = true;
    var self = this;
    this.drainQueues = function () {
        self._drainQueues();
    };
    this._schedule =
        schedule.isStatic ? schedule(this.drainQueues) : schedule;
}

Async.prototype.disableTrampolineIfNecessary = function() {
    if (util.hasDevTools) {
        this._trampolineEnabled = false;
    }
};

Async.prototype.enableTrampoline = function() {
    if (!this._trampolineEnabled) {
        this._trampolineEnabled = true;
        this._schedule = function(fn) {
            setTimeout(fn, 0);
        };
    }
};

Async.prototype.haveItemsQueued = function () {
    return this._normalQueue.length() > 0;
};

Async.prototype.throwLater = function(fn, arg) {
    if (arguments.length === 1) {
        arg = fn;
        fn = function () { throw arg; };
    }
    if (typeof setTimeout !== "undefined") {
        setTimeout(function() {
            fn(arg);
        }, 0);
    } else try {
        this._schedule(function() {
            fn(arg);
        });
    } catch (e) {
        throw new Error("No async scheduler available\u000a\u000a    See http://goo.gl/m3OTXk\u000a");
    }
};

function AsyncInvokeLater(fn, receiver, arg) {
    this._lateQueue.push(fn, receiver, arg);
    this._queueTick();
}

function AsyncInvoke(fn, receiver, arg) {
    this._normalQueue.push(fn, receiver, arg);
    this._queueTick();
}

function AsyncSettlePromises(promise) {
    this._normalQueue._pushOne(promise);
    this._queueTick();
}

if (!util.hasDevTools) {
    Async.prototype.invokeLater = AsyncInvokeLater;
    Async.prototype.invoke = AsyncInvoke;
    Async.prototype.settlePromises = AsyncSettlePromises;
} else {
    if (schedule.isStatic) {
        schedule = function(fn) { setTimeout(fn, 0); };
    }
    Async.prototype.invokeLater = function (fn, receiver, arg) {
        if (this._trampolineEnabled) {
            AsyncInvokeLater.call(this, fn, receiver, arg);
        } else {
            this._schedule(function() {
                setTimeout(function() {
                    fn.call(receiver, arg);
                }, 100);
            });
        }
    };

    Async.prototype.invoke = function (fn, receiver, arg) {
        if (this._trampolineEnabled) {
            AsyncInvoke.call(this, fn, receiver, arg);
        } else {
            this._schedule(function() {
                fn.call(receiver, arg);
            });
        }
    };

    Async.prototype.settlePromises = function(promise) {
        if (this._trampolineEnabled) {
            AsyncSettlePromises.call(this, promise);
        } else {
            this._schedule(function() {
                promise._settlePromises();
            });
        }
    };
}

Async.prototype.invokeFirst = function (fn, receiver, arg) {
    this._normalQueue.unshift(fn, receiver, arg);
    this._queueTick();
};

Async.prototype._drainQueue = function(queue) {
    while (queue.length() > 0) {
        var fn = queue.shift();
        if (typeof fn !== "function") {
            fn._settlePromises();
            continue;
        }
        var receiver = queue.shift();
        var arg = queue.shift();
        fn.call(receiver, arg);
    }
};

Async.prototype._drainQueues = function () {
    this._drainQueue(this._normalQueue);
    this._reset();
    this._drainQueue(this._lateQueue);
};

Async.prototype._queueTick = function () {
    if (!this._isTickUsed) {
        this._isTickUsed = true;
        this._schedule(this.drainQueues);
    }
};

Async.prototype._reset = function () {
    this._isTickUsed = false;
};

module.exports = new Async();
module.exports.firstLineError = firstLineError;

},{"./queue.js":28,"./schedule.js":31,"./util.js":38}],3:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL, tryConvertToPromise) {
var rejectThis = function(_, e) {
    this._reject(e);
};

var targetRejected = function(e, context) {
    context.promiseRejectionQueued = true;
    context.bindingPromise._then(rejectThis, rejectThis, null, this, e);
};

var bindingResolved = function(thisArg, context) {
    if (this._isPending()) {
        this._resolveCallback(context.target);
    }
};

var bindingRejected = function(e, context) {
    if (!context.promiseRejectionQueued) this._reject(e);
};

Promise.prototype.bind = function (thisArg) {
    var maybePromise = tryConvertToPromise(thisArg);
    var ret = new Promise(INTERNAL);
    ret._propagateFrom(this, 1);
    var target = this._target();

    ret._setBoundTo(maybePromise);
    if (maybePromise instanceof Promise) {
        var context = {
            promiseRejectionQueued: false,
            promise: ret,
            target: target,
            bindingPromise: maybePromise
        };
        target._then(INTERNAL, targetRejected, ret._progress, ret, context);
        maybePromise._then(
            bindingResolved, bindingRejected, ret._progress, ret, context);
    } else {
        ret._resolveCallback(target);
    }
    return ret;
};

Promise.prototype._setBoundTo = function (obj) {
    if (obj !== undefined) {
        this._bitField = this._bitField | 131072;
        this._boundTo = obj;
    } else {
        this._bitField = this._bitField & (~131072);
    }
};

Promise.prototype._isBound = function () {
    return (this._bitField & 131072) === 131072;
};

Promise.bind = function (thisArg, value) {
    var maybePromise = tryConvertToPromise(thisArg);
    var ret = new Promise(INTERNAL);

    ret._setBoundTo(maybePromise);
    if (maybePromise instanceof Promise) {
        maybePromise._then(function() {
            ret._resolveCallback(value);
        }, ret._reject, ret._progress, ret, null);
    } else {
        ret._resolveCallback(value);
    }
    return ret;
};
};

},{}],4:[function(_dereq_,module,exports){
"use strict";
var old;
if (typeof Promise !== "undefined") old = Promise;
function noConflict() {
    try { if (Promise === bluebird) Promise = old; }
    catch (e) {}
    return bluebird;
}
var bluebird = _dereq_("./promise.js")();
bluebird.noConflict = noConflict;
module.exports = bluebird;

},{"./promise.js":23}],5:[function(_dereq_,module,exports){
"use strict";
var cr = Object.create;
if (cr) {
    var callerCache = cr(null);
    var getterCache = cr(null);
    callerCache[" size"] = getterCache[" size"] = 0;
}

module.exports = function(Promise) {
var util = _dereq_("./util.js");
var canEvaluate = util.canEvaluate;
var isIdentifier = util.isIdentifier;

var getMethodCaller;
var getGetter;
if (!true) {
var makeMethodCaller = function (methodName) {
    return new Function("ensureMethod", "                                    \n\
        return function(obj) {                                               \n\
            'use strict'                                                     \n\
            var len = this.length;                                           \n\
            ensureMethod(obj, 'methodName');                                 \n\
            switch(len) {                                                    \n\
                case 1: return obj.methodName(this[0]);                      \n\
                case 2: return obj.methodName(this[0], this[1]);             \n\
                case 3: return obj.methodName(this[0], this[1], this[2]);    \n\
                case 0: return obj.methodName();                             \n\
                default:                                                     \n\
                    return obj.methodName.apply(obj, this);                  \n\
            }                                                                \n\
        };                                                                   \n\
        ".replace(/methodName/g, methodName))(ensureMethod);
};

var makeGetter = function (propertyName) {
    return new Function("obj", "                                             \n\
        'use strict';                                                        \n\
        return obj.propertyName;                                             \n\
        ".replace("propertyName", propertyName));
};

var getCompiled = function(name, compiler, cache) {
    var ret = cache[name];
    if (typeof ret !== "function") {
        if (!isIdentifier(name)) {
            return null;
        }
        ret = compiler(name);
        cache[name] = ret;
        cache[" size"]++;
        if (cache[" size"] > 512) {
            var keys = Object.keys(cache);
            for (var i = 0; i < 256; ++i) delete cache[keys[i]];
            cache[" size"] = keys.length - 256;
        }
    }
    return ret;
};

getMethodCaller = function(name) {
    return getCompiled(name, makeMethodCaller, callerCache);
};

getGetter = function(name) {
    return getCompiled(name, makeGetter, getterCache);
};
}

function ensureMethod(obj, methodName) {
    var fn;
    if (obj != null) fn = obj[methodName];
    if (typeof fn !== "function") {
        var message = "Object " + util.classString(obj) + " has no method '" +
            util.toString(methodName) + "'";
        throw new Promise.TypeError(message);
    }
    return fn;
}

function caller(obj) {
    var methodName = this.pop();
    var fn = ensureMethod(obj, methodName);
    return fn.apply(obj, this);
}
Promise.prototype.call = function (methodName) {
    var $_len = arguments.length;var args = new Array($_len - 1); for(var $_i = 1; $_i < $_len; ++$_i) {args[$_i - 1] = arguments[$_i];}
    if (!true) {
        if (canEvaluate) {
            var maybeCaller = getMethodCaller(methodName);
            if (maybeCaller !== null) {
                return this._then(
                    maybeCaller, undefined, undefined, args, undefined);
            }
        }
    }
    args.push(methodName);
    return this._then(caller, undefined, undefined, args, undefined);
};

function namedGetter(obj) {
    return obj[this];
}
function indexedGetter(obj) {
    var index = +this;
    if (index < 0) index = Math.max(0, index + obj.length);
    return obj[index];
}
Promise.prototype.get = function (propertyName) {
    var isIndex = (typeof propertyName === "number");
    var getter;
    if (!isIndex) {
        if (canEvaluate) {
            var maybeGetter = getGetter(propertyName);
            getter = maybeGetter !== null ? maybeGetter : namedGetter;
        } else {
            getter = namedGetter;
        }
    } else {
        getter = indexedGetter;
    }
    return this._then(getter, undefined, undefined, propertyName, undefined);
};
};

},{"./util.js":38}],6:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise) {
var errors = _dereq_("./errors.js");
var async = _dereq_("./async.js");
var CancellationError = errors.CancellationError;

Promise.prototype._cancel = function (reason) {
    if (!this.isCancellable()) return this;
    var parent;
    var promiseToReject = this;
    while ((parent = promiseToReject._cancellationParent) !== undefined &&
        parent.isCancellable()) {
        promiseToReject = parent;
    }
    this._unsetCancellable();
    promiseToReject._target()._rejectCallback(reason, false, true);
};

Promise.prototype.cancel = function (reason) {
    if (!this.isCancellable()) return this;
    if (reason === undefined) reason = new CancellationError();
    async.invokeLater(this._cancel, this, reason);
    return this;
};

Promise.prototype.cancellable = function () {
    if (this._cancellable()) return this;
    async.enableTrampoline();
    this._setCancellable();
    this._cancellationParent = undefined;
    return this;
};

Promise.prototype.uncancellable = function () {
    var ret = this.then();
    ret._unsetCancellable();
    return ret;
};

Promise.prototype.fork = function (didFulfill, didReject, didProgress) {
    var ret = this._then(didFulfill, didReject, didProgress,
                         undefined, undefined);

    ret._setCancellable();
    ret._cancellationParent = undefined;
    return ret;
};
};

},{"./async.js":2,"./errors.js":13}],7:[function(_dereq_,module,exports){
"use strict";
module.exports = function() {
var async = _dereq_("./async.js");
var util = _dereq_("./util.js");
var bluebirdFramePattern =
    /[\\\/]bluebird[\\\/]js[\\\/](main|debug|zalgo|instrumented)/;
var stackFramePattern = null;
var formatStack = null;
var indentStackFrames = false;
var warn;

function CapturedTrace(parent) {
    this._parent = parent;
    var length = this._length = 1 + (parent === undefined ? 0 : parent._length);
    captureStackTrace(this, CapturedTrace);
    if (length > 32) this.uncycle();
}
util.inherits(CapturedTrace, Error);

CapturedTrace.prototype.uncycle = function() {
    var length = this._length;
    if (length < 2) return;
    var nodes = [];
    var stackToIndex = {};

    for (var i = 0, node = this; node !== undefined; ++i) {
        nodes.push(node);
        node = node._parent;
    }
    length = this._length = i;
    for (var i = length - 1; i >= 0; --i) {
        var stack = nodes[i].stack;
        if (stackToIndex[stack] === undefined) {
            stackToIndex[stack] = i;
        }
    }
    for (var i = 0; i < length; ++i) {
        var currentStack = nodes[i].stack;
        var index = stackToIndex[currentStack];
        if (index !== undefined && index !== i) {
            if (index > 0) {
                nodes[index - 1]._parent = undefined;
                nodes[index - 1]._length = 1;
            }
            nodes[i]._parent = undefined;
            nodes[i]._length = 1;
            var cycleEdgeNode = i > 0 ? nodes[i - 1] : this;

            if (index < length - 1) {
                cycleEdgeNode._parent = nodes[index + 1];
                cycleEdgeNode._parent.uncycle();
                cycleEdgeNode._length =
                    cycleEdgeNode._parent._length + 1;
            } else {
                cycleEdgeNode._parent = undefined;
                cycleEdgeNode._length = 1;
            }
            var currentChildLength = cycleEdgeNode._length + 1;
            for (var j = i - 2; j >= 0; --j) {
                nodes[j]._length = currentChildLength;
                currentChildLength++;
            }
            return;
        }
    }
};

CapturedTrace.prototype.parent = function() {
    return this._parent;
};

CapturedTrace.prototype.hasParent = function() {
    return this._parent !== undefined;
};

CapturedTrace.prototype.attachExtraTrace = function(error) {
    if (error.__stackCleaned__) return;
    this.uncycle();
    var parsed = CapturedTrace.parseStackAndMessage(error);
    var message = parsed.message;
    var stacks = [parsed.stack];

    var trace = this;
    while (trace !== undefined) {
        stacks.push(cleanStack(trace.stack.split("\n")));
        trace = trace._parent;
    }
    removeCommonRoots(stacks);
    removeDuplicateOrEmptyJumps(stacks);
    util.notEnumerableProp(error, "stack", reconstructStack(message, stacks));
    util.notEnumerableProp(error, "__stackCleaned__", true);
};

function reconstructStack(message, stacks) {
    for (var i = 0; i < stacks.length - 1; ++i) {
        stacks[i].push("From previous event:");
        stacks[i] = stacks[i].join("\n");
    }
    if (i < stacks.length) {
        stacks[i] = stacks[i].join("\n");
    }
    return message + "\n" + stacks.join("\n");
}

function removeDuplicateOrEmptyJumps(stacks) {
    for (var i = 0; i < stacks.length; ++i) {
        if (stacks[i].length === 0 ||
            ((i + 1 < stacks.length) && stacks[i][0] === stacks[i+1][0])) {
            stacks.splice(i, 1);
            i--;
        }
    }
}

function removeCommonRoots(stacks) {
    var current = stacks[0];
    for (var i = 1; i < stacks.length; ++i) {
        var prev = stacks[i];
        var currentLastIndex = current.length - 1;
        var currentLastLine = current[currentLastIndex];
        var commonRootMeetPoint = -1;

        for (var j = prev.length - 1; j >= 0; --j) {
            if (prev[j] === currentLastLine) {
                commonRootMeetPoint = j;
                break;
            }
        }

        for (var j = commonRootMeetPoint; j >= 0; --j) {
            var line = prev[j];
            if (current[currentLastIndex] === line) {
                current.pop();
                currentLastIndex--;
            } else {
                break;
            }
        }
        current = prev;
    }
}

function cleanStack(stack) {
    var ret = [];
    for (var i = 0; i < stack.length; ++i) {
        var line = stack[i];
        var isTraceLine = stackFramePattern.test(line) ||
            "    (No stack trace)" === line;
        var isInternalFrame = isTraceLine && shouldIgnore(line);
        if (isTraceLine && !isInternalFrame) {
            if (indentStackFrames && line.charAt(0) !== " ") {
                line = "    " + line;
            }
            ret.push(line);
        }
    }
    return ret;
}

function stackFramesAsArray(error) {
    var stack = error.stack.replace(/\s+$/g, "").split("\n");
    for (var i = 0; i < stack.length; ++i) {
        var line = stack[i];
        if ("    (No stack trace)" === line || stackFramePattern.test(line)) {
            break;
        }
    }
    if (i > 0) {
        stack = stack.slice(i);
    }
    return stack;
}

CapturedTrace.parseStackAndMessage = function(error) {
    var stack = error.stack;
    var message = error.toString();
    stack = typeof stack === "string" && stack.length > 0
                ? stackFramesAsArray(error) : ["    (No stack trace)"];
    return {
        message: message,
        stack: cleanStack(stack)
    };
};

CapturedTrace.formatAndLogError = function(error, title) {
    if (typeof console !== "undefined") {
        var message;
        if (typeof error === "object" || typeof error === "function") {
            var stack = error.stack;
            message = title + formatStack(stack, error);
        } else {
            message = title + String(error);
        }
        if (typeof warn === "function") {
            warn(message);
        } else if (typeof console.log === "function" ||
            typeof console.log === "object") {
            console.log(message);
        }
    }
};

CapturedTrace.unhandledRejection = function (reason) {
    CapturedTrace.formatAndLogError(reason, "^--- With additional stack trace: ");
};

CapturedTrace.isSupported = function () {
    return typeof captureStackTrace === "function";
};

CapturedTrace.fireRejectionEvent =
function(name, localHandler, reason, promise) {
    var localEventFired = false;
    try {
        if (typeof localHandler === "function") {
            localEventFired = true;
            if (name === "rejectionHandled") {
                localHandler(promise);
            } else {
                localHandler(reason, promise);
            }
        }
    } catch (e) {
        async.throwLater(e);
    }

    var globalEventFired = false;
    try {
        globalEventFired = fireGlobalEvent(name, reason, promise);
    } catch (e) {
        globalEventFired = true;
        async.throwLater(e);
    }

    var domEventFired = false;
    if (fireDomEvent) {
        try {
            domEventFired = fireDomEvent(name.toLowerCase(), {
                reason: reason,
                promise: promise
            });
        } catch (e) {
            domEventFired = true;
            async.throwLater(e);
        }
    }

    if (!globalEventFired && !localEventFired && !domEventFired &&
        name === "unhandledRejection") {
        CapturedTrace.formatAndLogError(reason, "Unhandled rejection ");
    }
};

function formatNonError(obj) {
    var str;
    if (typeof obj === "function") {
        str = "[function " +
            (obj.name || "anonymous") +
            "]";
    } else {
        str = obj.toString();
        var ruselessToString = /\[object [a-zA-Z0-9$_]+\]/;
        if (ruselessToString.test(str)) {
            try {
                var newStr = JSON.stringify(obj);
                str = newStr;
            }
            catch(e) {

            }
        }
        if (str.length === 0) {
            str = "(empty array)";
        }
    }
    return ("(<" + snip(str) + ">, no stack trace)");
}

function snip(str) {
    var maxChars = 41;
    if (str.length < maxChars) {
        return str;
    }
    return str.substr(0, maxChars - 3) + "...";
}

var shouldIgnore = function() { return false; };
var parseLineInfoRegex = /[\/<\(]([^:\/]+):(\d+):(?:\d+)\)?\s*$/;
function parseLineInfo(line) {
    var matches = line.match(parseLineInfoRegex);
    if (matches) {
        return {
            fileName: matches[1],
            line: parseInt(matches[2], 10)
        };
    }
}
CapturedTrace.setBounds = function(firstLineError, lastLineError) {
    if (!CapturedTrace.isSupported()) return;
    var firstStackLines = firstLineError.stack.split("\n");
    var lastStackLines = lastLineError.stack.split("\n");
    var firstIndex = -1;
    var lastIndex = -1;
    var firstFileName;
    var lastFileName;
    for (var i = 0; i < firstStackLines.length; ++i) {
        var result = parseLineInfo(firstStackLines[i]);
        if (result) {
            firstFileName = result.fileName;
            firstIndex = result.line;
            break;
        }
    }
    for (var i = 0; i < lastStackLines.length; ++i) {
        var result = parseLineInfo(lastStackLines[i]);
        if (result) {
            lastFileName = result.fileName;
            lastIndex = result.line;
            break;
        }
    }
    if (firstIndex < 0 || lastIndex < 0 || !firstFileName || !lastFileName ||
        firstFileName !== lastFileName || firstIndex >= lastIndex) {
        return;
    }

    shouldIgnore = function(line) {
        if (bluebirdFramePattern.test(line)) return true;
        var info = parseLineInfo(line);
        if (info) {
            if (info.fileName === firstFileName &&
                (firstIndex <= info.line && info.line <= lastIndex)) {
                return true;
            }
        }
        return false;
    };
};

var captureStackTrace = (function stackDetection() {
    var v8stackFramePattern = /^\s*at\s*/;
    var v8stackFormatter = function(stack, error) {
        if (typeof stack === "string") return stack;

        if (error.name !== undefined &&
            error.message !== undefined) {
            return error.toString();
        }
        return formatNonError(error);
    };

    if (typeof Error.stackTraceLimit === "number" &&
        typeof Error.captureStackTrace === "function") {
        Error.stackTraceLimit = Error.stackTraceLimit + 6;
        stackFramePattern = v8stackFramePattern;
        formatStack = v8stackFormatter;
        var captureStackTrace = Error.captureStackTrace;

        shouldIgnore = function(line) {
            return bluebirdFramePattern.test(line);
        };
        return function(receiver, ignoreUntil) {
            Error.stackTraceLimit = Error.stackTraceLimit + 6;
            captureStackTrace(receiver, ignoreUntil);
            Error.stackTraceLimit = Error.stackTraceLimit - 6;
        };
    }
    var err = new Error();

    if (typeof err.stack === "string" &&
        err.stack.split("\n")[0].indexOf("stackDetection@") >= 0) {
        stackFramePattern = /@/;
        formatStack = v8stackFormatter;
        indentStackFrames = true;
        return function captureStackTrace(o) {
            o.stack = new Error().stack;
        };
    }

    var hasStackAfterThrow;
    try { throw new Error(); }
    catch(e) {
        hasStackAfterThrow = ("stack" in e);
    }
    if (!("stack" in err) && hasStackAfterThrow &&
        typeof Error.stackTraceLimit === "number") {
        stackFramePattern = v8stackFramePattern;
        formatStack = v8stackFormatter;
        return function captureStackTrace(o) {
            Error.stackTraceLimit = Error.stackTraceLimit + 6;
            try { throw new Error(); }
            catch(e) { o.stack = e.stack; }
            Error.stackTraceLimit = Error.stackTraceLimit - 6;
        };
    }

    formatStack = function(stack, error) {
        if (typeof stack === "string") return stack;

        if ((typeof error === "object" ||
            typeof error === "function") &&
            error.name !== undefined &&
            error.message !== undefined) {
            return error.toString();
        }
        return formatNonError(error);
    };

    return null;

})([]);

var fireDomEvent;
var fireGlobalEvent = (function() {
    if (util.isNode) {
        return function(name, reason, promise) {
            if (name === "rejectionHandled") {
                return process.emit(name, promise);
            } else {
                return process.emit(name, reason, promise);
            }
        };
    } else {
        var customEventWorks = false;
        var anyEventWorks = true;
        try {
            var ev = new self.CustomEvent("test");
            customEventWorks = ev instanceof CustomEvent;
        } catch (e) {}
        if (!customEventWorks) {
            try {
                var event = document.createEvent("CustomEvent");
                event.initCustomEvent("testingtheevent", false, true, {});
                self.dispatchEvent(event);
            } catch (e) {
                anyEventWorks = false;
            }
        }
        if (anyEventWorks) {
            fireDomEvent = function(type, detail) {
                var event;
                if (customEventWorks) {
                    event = new self.CustomEvent(type, {
                        detail: detail,
                        bubbles: false,
                        cancelable: true
                    });
                } else if (self.dispatchEvent) {
                    event = document.createEvent("CustomEvent");
                    event.initCustomEvent(type, false, true, detail);
                }

                return event ? !self.dispatchEvent(event) : false;
            };
        }

        var toWindowMethodNameMap = {};
        toWindowMethodNameMap["unhandledRejection"] = ("on" +
            "unhandledRejection").toLowerCase();
        toWindowMethodNameMap["rejectionHandled"] = ("on" +
            "rejectionHandled").toLowerCase();

        return function(name, reason, promise) {
            var methodName = toWindowMethodNameMap[name];
            var method = self[methodName];
            if (!method) return false;
            if (name === "rejectionHandled") {
                method.call(self, promise);
            } else {
                method.call(self, reason, promise);
            }
            return true;
        };
    }
})();

if (typeof console !== "undefined" && typeof console.warn !== "undefined") {
    warn = function (message) {
        console.warn(message);
    };
    if (util.isNode && process.stderr.isTTY) {
        warn = function(message) {
            process.stderr.write("\u001b[31m" + message + "\u001b[39m\n");
        };
    } else if (!util.isNode && typeof (new Error().stack) === "string") {
        warn = function(message) {
            console.warn("%c" + message, "color: red");
        };
    }
}

return CapturedTrace;
};

},{"./async.js":2,"./util.js":38}],8:[function(_dereq_,module,exports){
"use strict";
module.exports = function(NEXT_FILTER) {
var util = _dereq_("./util.js");
var errors = _dereq_("./errors.js");
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;
var keys = _dereq_("./es5.js").keys;
var TypeError = errors.TypeError;

function CatchFilter(instances, callback, promise) {
    this._instances = instances;
    this._callback = callback;
    this._promise = promise;
}

function safePredicate(predicate, e) {
    var safeObject = {};
    var retfilter = tryCatch(predicate).call(safeObject, e);

    if (retfilter === errorObj) return retfilter;

    var safeKeys = keys(safeObject);
    if (safeKeys.length) {
        errorObj.e = new TypeError("Catch filter must inherit from Error or be a simple predicate function\u000a\u000a    See http://goo.gl/o84o68\u000a");
        return errorObj;
    }
    return retfilter;
}

CatchFilter.prototype.doFilter = function (e) {
    var cb = this._callback;
    var promise = this._promise;
    var boundTo = promise._boundValue();
    for (var i = 0, len = this._instances.length; i < len; ++i) {
        var item = this._instances[i];
        var itemIsErrorType = item === Error ||
            (item != null && item.prototype instanceof Error);

        if (itemIsErrorType && e instanceof item) {
            var ret = tryCatch(cb).call(boundTo, e);
            if (ret === errorObj) {
                NEXT_FILTER.e = ret.e;
                return NEXT_FILTER;
            }
            return ret;
        } else if (typeof item === "function" && !itemIsErrorType) {
            var shouldHandle = safePredicate(item, e);
            if (shouldHandle === errorObj) {
                e = errorObj.e;
                break;
            } else if (shouldHandle) {
                var ret = tryCatch(cb).call(boundTo, e);
                if (ret === errorObj) {
                    NEXT_FILTER.e = ret.e;
                    return NEXT_FILTER;
                }
                return ret;
            }
        }
    }
    NEXT_FILTER.e = e;
    return NEXT_FILTER;
};

return CatchFilter;
};

},{"./errors.js":13,"./es5.js":14,"./util.js":38}],9:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, CapturedTrace, isDebugging) {
var contextStack = [];
function Context() {
    this._trace = new CapturedTrace(peekContext());
}
Context.prototype._pushContext = function () {
    if (!isDebugging()) return;
    if (this._trace !== undefined) {
        contextStack.push(this._trace);
    }
};

Context.prototype._popContext = function () {
    if (!isDebugging()) return;
    if (this._trace !== undefined) {
        contextStack.pop();
    }
};

function createContext() {
    if (isDebugging()) return new Context();
}

function peekContext() {
    var lastIndex = contextStack.length - 1;
    if (lastIndex >= 0) {
        return contextStack[lastIndex];
    }
    return undefined;
}

Promise.prototype._peekContext = peekContext;
Promise.prototype._pushContext = Context.prototype._pushContext;
Promise.prototype._popContext = Context.prototype._popContext;

return createContext;
};

},{}],10:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, CapturedTrace) {
var getDomain = Promise._getDomain;
var async = _dereq_("./async.js");
var Warning = _dereq_("./errors.js").Warning;
var util = _dereq_("./util.js");
var canAttachTrace = util.canAttachTrace;
var unhandledRejectionHandled;
var possiblyUnhandledRejection;
var debugging = false || (util.isNode &&
                    (!!process.env["BLUEBIRD_DEBUG"] ||
                     process.env["NODE_ENV"] === "development"));

if (debugging) {
    async.disableTrampolineIfNecessary();
}

Promise.prototype._ignoreRejections = function() {
    this._unsetRejectionIsUnhandled();
    this._bitField = this._bitField | 16777216;
};

Promise.prototype._ensurePossibleRejectionHandled = function () {
    if ((this._bitField & 16777216) !== 0) return;
    this._setRejectionIsUnhandled();
    async.invokeLater(this._notifyUnhandledRejection, this, undefined);
};

Promise.prototype._notifyUnhandledRejectionIsHandled = function () {
    CapturedTrace.fireRejectionEvent("rejectionHandled",
                                  unhandledRejectionHandled, undefined, this);
};

Promise.prototype._notifyUnhandledRejection = function () {
    if (this._isRejectionUnhandled()) {
        var reason = this._getCarriedStackTrace() || this._settledValue;
        this._setUnhandledRejectionIsNotified();
        CapturedTrace.fireRejectionEvent("unhandledRejection",
                                      possiblyUnhandledRejection, reason, this);
    }
};

Promise.prototype._setUnhandledRejectionIsNotified = function () {
    this._bitField = this._bitField | 524288;
};

Promise.prototype._unsetUnhandledRejectionIsNotified = function () {
    this._bitField = this._bitField & (~524288);
};

Promise.prototype._isUnhandledRejectionNotified = function () {
    return (this._bitField & 524288) > 0;
};

Promise.prototype._setRejectionIsUnhandled = function () {
    this._bitField = this._bitField | 2097152;
};

Promise.prototype._unsetRejectionIsUnhandled = function () {
    this._bitField = this._bitField & (~2097152);
    if (this._isUnhandledRejectionNotified()) {
        this._unsetUnhandledRejectionIsNotified();
        this._notifyUnhandledRejectionIsHandled();
    }
};

Promise.prototype._isRejectionUnhandled = function () {
    return (this._bitField & 2097152) > 0;
};

Promise.prototype._setCarriedStackTrace = function (capturedTrace) {
    this._bitField = this._bitField | 1048576;
    this._fulfillmentHandler0 = capturedTrace;
};

Promise.prototype._isCarryingStackTrace = function () {
    return (this._bitField & 1048576) > 0;
};

Promise.prototype._getCarriedStackTrace = function () {
    return this._isCarryingStackTrace()
        ? this._fulfillmentHandler0
        : undefined;
};

Promise.prototype._captureStackTrace = function () {
    if (debugging) {
        this._trace = new CapturedTrace(this._peekContext());
    }
    return this;
};

Promise.prototype._attachExtraTrace = function (error, ignoreSelf) {
    if (debugging && canAttachTrace(error)) {
        var trace = this._trace;
        if (trace !== undefined) {
            if (ignoreSelf) trace = trace._parent;
        }
        if (trace !== undefined) {
            trace.attachExtraTrace(error);
        } else if (!error.__stackCleaned__) {
            var parsed = CapturedTrace.parseStackAndMessage(error);
            util.notEnumerableProp(error, "stack",
                parsed.message + "\n" + parsed.stack.join("\n"));
            util.notEnumerableProp(error, "__stackCleaned__", true);
        }
    }
};

Promise.prototype._warn = function(message) {
    var warning = new Warning(message);
    var ctx = this._peekContext();
    if (ctx) {
        ctx.attachExtraTrace(warning);
    } else {
        var parsed = CapturedTrace.parseStackAndMessage(warning);
        warning.stack = parsed.message + "\n" + parsed.stack.join("\n");
    }
    CapturedTrace.formatAndLogError(warning, "");
};

Promise.onPossiblyUnhandledRejection = function (fn) {
    var domain = getDomain();
    possiblyUnhandledRejection =
        typeof fn === "function" ? (domain === null ? fn : domain.bind(fn))
                                 : undefined;
};

Promise.onUnhandledRejectionHandled = function (fn) {
    var domain = getDomain();
    unhandledRejectionHandled =
        typeof fn === "function" ? (domain === null ? fn : domain.bind(fn))
                                 : undefined;
};

Promise.longStackTraces = function () {
    if (async.haveItemsQueued() &&
        debugging === false
   ) {
        throw new Error("cannot enable long stack traces after promises have been created\u000a\u000a    See http://goo.gl/DT1qyG\u000a");
    }
    debugging = CapturedTrace.isSupported();
    if (debugging) {
        async.disableTrampolineIfNecessary();
    }
};

Promise.hasLongStackTraces = function () {
    return debugging && CapturedTrace.isSupported();
};

if (!CapturedTrace.isSupported()) {
    Promise.longStackTraces = function(){};
    debugging = false;
}

return function() {
    return debugging;
};
};

},{"./async.js":2,"./errors.js":13,"./util.js":38}],11:[function(_dereq_,module,exports){
"use strict";
var util = _dereq_("./util.js");
var isPrimitive = util.isPrimitive;

module.exports = function(Promise) {
var returner = function () {
    return this;
};
var thrower = function () {
    throw this;
};
var returnUndefined = function() {};
var throwUndefined = function() {
    throw undefined;
};

var wrapper = function (value, action) {
    if (action === 1) {
        return function () {
            throw value;
        };
    } else if (action === 2) {
        return function () {
            return value;
        };
    }
};


Promise.prototype["return"] =
Promise.prototype.thenReturn = function (value) {
    if (value === undefined) return this.then(returnUndefined);

    if (isPrimitive(value)) {
        return this._then(
            wrapper(value, 2),
            undefined,
            undefined,
            undefined,
            undefined
       );
    }
    return this._then(returner, undefined, undefined, value, undefined);
};

Promise.prototype["throw"] =
Promise.prototype.thenThrow = function (reason) {
    if (reason === undefined) return this.then(throwUndefined);

    if (isPrimitive(reason)) {
        return this._then(
            wrapper(reason, 1),
            undefined,
            undefined,
            undefined,
            undefined
       );
    }
    return this._then(thrower, undefined, undefined, reason, undefined);
};
};

},{"./util.js":38}],12:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL) {
var PromiseReduce = Promise.reduce;

Promise.prototype.each = function (fn) {
    return PromiseReduce(this, fn, null, INTERNAL);
};

Promise.each = function (promises, fn) {
    return PromiseReduce(promises, fn, null, INTERNAL);
};
};

},{}],13:[function(_dereq_,module,exports){
"use strict";
var es5 = _dereq_("./es5.js");
var Objectfreeze = es5.freeze;
var util = _dereq_("./util.js");
var inherits = util.inherits;
var notEnumerableProp = util.notEnumerableProp;

function subError(nameProperty, defaultMessage) {
    function SubError(message) {
        if (!(this instanceof SubError)) return new SubError(message);
        notEnumerableProp(this, "message",
            typeof message === "string" ? message : defaultMessage);
        notEnumerableProp(this, "name", nameProperty);
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        } else {
            Error.call(this);
        }
    }
    inherits(SubError, Error);
    return SubError;
}

var _TypeError, _RangeError;
var Warning = subError("Warning", "warning");
var CancellationError = subError("CancellationError", "cancellation error");
var TimeoutError = subError("TimeoutError", "timeout error");
var AggregateError = subError("AggregateError", "aggregate error");
try {
    _TypeError = TypeError;
    _RangeError = RangeError;
} catch(e) {
    _TypeError = subError("TypeError", "type error");
    _RangeError = subError("RangeError", "range error");
}

var methods = ("join pop push shift unshift slice filter forEach some " +
    "every map indexOf lastIndexOf reduce reduceRight sort reverse").split(" ");

for (var i = 0; i < methods.length; ++i) {
    if (typeof Array.prototype[methods[i]] === "function") {
        AggregateError.prototype[methods[i]] = Array.prototype[methods[i]];
    }
}

es5.defineProperty(AggregateError.prototype, "length", {
    value: 0,
    configurable: false,
    writable: true,
    enumerable: true
});
AggregateError.prototype["isOperational"] = true;
var level = 0;
AggregateError.prototype.toString = function() {
    var indent = Array(level * 4 + 1).join(" ");
    var ret = "\n" + indent + "AggregateError of:" + "\n";
    level++;
    indent = Array(level * 4 + 1).join(" ");
    for (var i = 0; i < this.length; ++i) {
        var str = this[i] === this ? "[Circular AggregateError]" : this[i] + "";
        var lines = str.split("\n");
        for (var j = 0; j < lines.length; ++j) {
            lines[j] = indent + lines[j];
        }
        str = lines.join("\n");
        ret += str + "\n";
    }
    level--;
    return ret;
};

function OperationalError(message) {
    if (!(this instanceof OperationalError))
        return new OperationalError(message);
    notEnumerableProp(this, "name", "OperationalError");
    notEnumerableProp(this, "message", message);
    this.cause = message;
    this["isOperational"] = true;

    if (message instanceof Error) {
        notEnumerableProp(this, "message", message.message);
        notEnumerableProp(this, "stack", message.stack);
    } else if (Error.captureStackTrace) {
        Error.captureStackTrace(this, this.constructor);
    }

}
inherits(OperationalError, Error);

var errorTypes = Error["__BluebirdErrorTypes__"];
if (!errorTypes) {
    errorTypes = Objectfreeze({
        CancellationError: CancellationError,
        TimeoutError: TimeoutError,
        OperationalError: OperationalError,
        RejectionError: OperationalError,
        AggregateError: AggregateError
    });
    notEnumerableProp(Error, "__BluebirdErrorTypes__", errorTypes);
}

module.exports = {
    Error: Error,
    TypeError: _TypeError,
    RangeError: _RangeError,
    CancellationError: errorTypes.CancellationError,
    OperationalError: errorTypes.OperationalError,
    TimeoutError: errorTypes.TimeoutError,
    AggregateError: errorTypes.AggregateError,
    Warning: Warning
};

},{"./es5.js":14,"./util.js":38}],14:[function(_dereq_,module,exports){
var isES5 = (function(){
    "use strict";
    return this === undefined;
})();

if (isES5) {
    module.exports = {
        freeze: Object.freeze,
        defineProperty: Object.defineProperty,
        getDescriptor: Object.getOwnPropertyDescriptor,
        keys: Object.keys,
        names: Object.getOwnPropertyNames,
        getPrototypeOf: Object.getPrototypeOf,
        isArray: Array.isArray,
        isES5: isES5,
        propertyIsWritable: function(obj, prop) {
            var descriptor = Object.getOwnPropertyDescriptor(obj, prop);
            return !!(!descriptor || descriptor.writable || descriptor.set);
        }
    };
} else {
    var has = {}.hasOwnProperty;
    var str = {}.toString;
    var proto = {}.constructor.prototype;

    var ObjectKeys = function (o) {
        var ret = [];
        for (var key in o) {
            if (has.call(o, key)) {
                ret.push(key);
            }
        }
        return ret;
    };

    var ObjectGetDescriptor = function(o, key) {
        return {value: o[key]};
    };

    var ObjectDefineProperty = function (o, key, desc) {
        o[key] = desc.value;
        return o;
    };

    var ObjectFreeze = function (obj) {
        return obj;
    };

    var ObjectGetPrototypeOf = function (obj) {
        try {
            return Object(obj).constructor.prototype;
        }
        catch (e) {
            return proto;
        }
    };

    var ArrayIsArray = function (obj) {
        try {
            return str.call(obj) === "[object Array]";
        }
        catch(e) {
            return false;
        }
    };

    module.exports = {
        isArray: ArrayIsArray,
        keys: ObjectKeys,
        names: ObjectKeys,
        defineProperty: ObjectDefineProperty,
        getDescriptor: ObjectGetDescriptor,
        freeze: ObjectFreeze,
        getPrototypeOf: ObjectGetPrototypeOf,
        isES5: isES5,
        propertyIsWritable: function() {
            return true;
        }
    };
}

},{}],15:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL) {
var PromiseMap = Promise.map;

Promise.prototype.filter = function (fn, options) {
    return PromiseMap(this, fn, options, INTERNAL);
};

Promise.filter = function (promises, fn, options) {
    return PromiseMap(promises, fn, options, INTERNAL);
};
};

},{}],16:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, NEXT_FILTER, tryConvertToPromise) {
var util = _dereq_("./util.js");
var isPrimitive = util.isPrimitive;
var thrower = util.thrower;

function returnThis() {
    return this;
}
function throwThis() {
    throw this;
}
function return$(r) {
    return function() {
        return r;
    };
}
function throw$(r) {
    return function() {
        throw r;
    };
}
function promisedFinally(ret, reasonOrValue, isFulfilled) {
    var then;
    if (isPrimitive(reasonOrValue)) {
        then = isFulfilled ? return$(reasonOrValue) : throw$(reasonOrValue);
    } else {
        then = isFulfilled ? returnThis : throwThis;
    }
    return ret._then(then, thrower, undefined, reasonOrValue, undefined);
}

function finallyHandler(reasonOrValue) {
    var promise = this.promise;
    var handler = this.handler;

    var ret = promise._isBound()
                    ? handler.call(promise._boundValue())
                    : handler();

    if (ret !== undefined) {
        var maybePromise = tryConvertToPromise(ret, promise);
        if (maybePromise instanceof Promise) {
            maybePromise = maybePromise._target();
            return promisedFinally(maybePromise, reasonOrValue,
                                    promise.isFulfilled());
        }
    }

    if (promise.isRejected()) {
        NEXT_FILTER.e = reasonOrValue;
        return NEXT_FILTER;
    } else {
        return reasonOrValue;
    }
}

function tapHandler(value) {
    var promise = this.promise;
    var handler = this.handler;

    var ret = promise._isBound()
                    ? handler.call(promise._boundValue(), value)
                    : handler(value);

    if (ret !== undefined) {
        var maybePromise = tryConvertToPromise(ret, promise);
        if (maybePromise instanceof Promise) {
            maybePromise = maybePromise._target();
            return promisedFinally(maybePromise, value, true);
        }
    }
    return value;
}

Promise.prototype._passThroughHandler = function (handler, isFinally) {
    if (typeof handler !== "function") return this.then();

    var promiseAndHandler = {
        promise: this,
        handler: handler
    };

    return this._then(
            isFinally ? finallyHandler : tapHandler,
            isFinally ? finallyHandler : undefined, undefined,
            promiseAndHandler, undefined);
};

Promise.prototype.lastly =
Promise.prototype["finally"] = function (handler) {
    return this._passThroughHandler(handler, true);
};

Promise.prototype.tap = function (handler) {
    return this._passThroughHandler(handler, false);
};
};

},{"./util.js":38}],17:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise,
                          apiRejection,
                          INTERNAL,
                          tryConvertToPromise) {
var errors = _dereq_("./errors.js");
var TypeError = errors.TypeError;
var util = _dereq_("./util.js");
var errorObj = util.errorObj;
var tryCatch = util.tryCatch;
var yieldHandlers = [];

function promiseFromYieldHandler(value, yieldHandlers, traceParent) {
    for (var i = 0; i < yieldHandlers.length; ++i) {
        traceParent._pushContext();
        var result = tryCatch(yieldHandlers[i])(value);
        traceParent._popContext();
        if (result === errorObj) {
            traceParent._pushContext();
            var ret = Promise.reject(errorObj.e);
            traceParent._popContext();
            return ret;
        }
        var maybePromise = tryConvertToPromise(result, traceParent);
        if (maybePromise instanceof Promise) return maybePromise;
    }
    return null;
}

function PromiseSpawn(generatorFunction, receiver, yieldHandler, stack) {
    var promise = this._promise = new Promise(INTERNAL);
    promise._captureStackTrace();
    this._stack = stack;
    this._generatorFunction = generatorFunction;
    this._receiver = receiver;
    this._generator = undefined;
    this._yieldHandlers = typeof yieldHandler === "function"
        ? [yieldHandler].concat(yieldHandlers)
        : yieldHandlers;
}

PromiseSpawn.prototype.promise = function () {
    return this._promise;
};

PromiseSpawn.prototype._run = function () {
    this._generator = this._generatorFunction.call(this._receiver);
    this._receiver =
        this._generatorFunction = undefined;
    this._next(undefined);
};

PromiseSpawn.prototype._continue = function (result) {
    if (result === errorObj) {
        return this._promise._rejectCallback(result.e, false, true);
    }

    var value = result.value;
    if (result.done === true) {
        this._promise._resolveCallback(value);
    } else {
        var maybePromise = tryConvertToPromise(value, this._promise);
        if (!(maybePromise instanceof Promise)) {
            maybePromise =
                promiseFromYieldHandler(maybePromise,
                                        this._yieldHandlers,
                                        this._promise);
            if (maybePromise === null) {
                this._throw(
                    new TypeError(
                        "A value %s was yielded that could not be treated as a promise\u000a\u000a    See http://goo.gl/4Y4pDk\u000a\u000a".replace("%s", value) +
                        "From coroutine:\u000a" +
                        this._stack.split("\n").slice(1, -7).join("\n")
                    )
                );
                return;
            }
        }
        maybePromise._then(
            this._next,
            this._throw,
            undefined,
            this,
            null
       );
    }
};

PromiseSpawn.prototype._throw = function (reason) {
    this._promise._attachExtraTrace(reason);
    this._promise._pushContext();
    var result = tryCatch(this._generator["throw"])
        .call(this._generator, reason);
    this._promise._popContext();
    this._continue(result);
};

PromiseSpawn.prototype._next = function (value) {
    this._promise._pushContext();
    var result = tryCatch(this._generator.next).call(this._generator, value);
    this._promise._popContext();
    this._continue(result);
};

Promise.coroutine = function (generatorFunction, options) {
    if (typeof generatorFunction !== "function") {
        throw new TypeError("generatorFunction must be a function\u000a\u000a    See http://goo.gl/6Vqhm0\u000a");
    }
    var yieldHandler = Object(options).yieldHandler;
    var PromiseSpawn$ = PromiseSpawn;
    var stack = new Error().stack;
    return function () {
        var generator = generatorFunction.apply(this, arguments);
        var spawn = new PromiseSpawn$(undefined, undefined, yieldHandler,
                                      stack);
        spawn._generator = generator;
        spawn._next(undefined);
        return spawn.promise();
    };
};

Promise.coroutine.addYieldHandler = function(fn) {
    if (typeof fn !== "function") throw new TypeError("fn must be a function\u000a\u000a    See http://goo.gl/916lJJ\u000a");
    yieldHandlers.push(fn);
};

Promise.spawn = function (generatorFunction) {
    if (typeof generatorFunction !== "function") {
        return apiRejection("generatorFunction must be a function\u000a\u000a    See http://goo.gl/6Vqhm0\u000a");
    }
    var spawn = new PromiseSpawn(generatorFunction, this);
    var ret = spawn.promise();
    spawn._run(Promise.spawn);
    return ret;
};
};

},{"./errors.js":13,"./util.js":38}],18:[function(_dereq_,module,exports){
"use strict";
module.exports =
function(Promise, PromiseArray, tryConvertToPromise, INTERNAL) {
var util = _dereq_("./util.js");
var canEvaluate = util.canEvaluate;
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;
var reject;

if (!true) {
if (canEvaluate) {
    var thenCallback = function(i) {
        return new Function("value", "holder", "                             \n\
            'use strict';                                                    \n\
            holder.pIndex = value;                                           \n\
            holder.checkFulfillment(this);                                   \n\
            ".replace(/Index/g, i));
    };

    var caller = function(count) {
        var values = [];
        for (var i = 1; i <= count; ++i) values.push("holder.p" + i);
        return new Function("holder", "                                      \n\
            'use strict';                                                    \n\
            var callback = holder.fn;                                        \n\
            return callback(values);                                         \n\
            ".replace(/values/g, values.join(", ")));
    };
    var thenCallbacks = [];
    var callers = [undefined];
    for (var i = 1; i <= 5; ++i) {
        thenCallbacks.push(thenCallback(i));
        callers.push(caller(i));
    }

    var Holder = function(total, fn) {
        this.p1 = this.p2 = this.p3 = this.p4 = this.p5 = null;
        this.fn = fn;
        this.total = total;
        this.now = 0;
    };

    Holder.prototype.callers = callers;
    Holder.prototype.checkFulfillment = function(promise) {
        var now = this.now;
        now++;
        var total = this.total;
        if (now >= total) {
            var handler = this.callers[total];
            promise._pushContext();
            var ret = tryCatch(handler)(this);
            promise._popContext();
            if (ret === errorObj) {
                promise._rejectCallback(ret.e, false, true);
            } else {
                promise._resolveCallback(ret);
            }
        } else {
            this.now = now;
        }
    };

    var reject = function (reason) {
        this._reject(reason);
    };
}
}

Promise.join = function () {
    var last = arguments.length - 1;
    var fn;
    if (last > 0 && typeof arguments[last] === "function") {
        fn = arguments[last];
        if (!true) {
            if (last < 6 && canEvaluate) {
                var ret = new Promise(INTERNAL);
                ret._captureStackTrace();
                var holder = new Holder(last, fn);
                var callbacks = thenCallbacks;
                for (var i = 0; i < last; ++i) {
                    var maybePromise = tryConvertToPromise(arguments[i], ret);
                    if (maybePromise instanceof Promise) {
                        maybePromise = maybePromise._target();
                        if (maybePromise._isPending()) {
                            maybePromise._then(callbacks[i], reject,
                                               undefined, ret, holder);
                        } else if (maybePromise._isFulfilled()) {
                            callbacks[i].call(ret,
                                              maybePromise._value(), holder);
                        } else {
                            ret._reject(maybePromise._reason());
                        }
                    } else {
                        callbacks[i].call(ret, maybePromise, holder);
                    }
                }
                return ret;
            }
        }
    }
    var $_len = arguments.length;var args = new Array($_len); for(var $_i = 0; $_i < $_len; ++$_i) {args[$_i] = arguments[$_i];}
    if (fn) args.pop();
    var ret = new PromiseArray(args).promise();
    return fn !== undefined ? ret.spread(fn) : ret;
};

};

},{"./util.js":38}],19:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise,
                          PromiseArray,
                          apiRejection,
                          tryConvertToPromise,
                          INTERNAL) {
var getDomain = Promise._getDomain;
var async = _dereq_("./async.js");
var util = _dereq_("./util.js");
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;
var PENDING = {};
var EMPTY_ARRAY = [];

function MappingPromiseArray(promises, fn, limit, _filter) {
    this.constructor$(promises);
    this._promise._captureStackTrace();
    var domain = getDomain();
    this._callback = domain === null ? fn : domain.bind(fn);
    this._preservedValues = _filter === INTERNAL
        ? new Array(this.length())
        : null;
    this._limit = limit;
    this._inFlight = 0;
    this._queue = limit >= 1 ? [] : EMPTY_ARRAY;
    async.invoke(init, this, undefined);
}
util.inherits(MappingPromiseArray, PromiseArray);
function init() {this._init$(undefined, -2);}

MappingPromiseArray.prototype._init = function () {};

MappingPromiseArray.prototype._promiseFulfilled = function (value, index) {
    var values = this._values;
    var length = this.length();
    var preservedValues = this._preservedValues;
    var limit = this._limit;
    if (values[index] === PENDING) {
        values[index] = value;
        if (limit >= 1) {
            this._inFlight--;
            this._drainQueue();
            if (this._isResolved()) return;
        }
    } else {
        if (limit >= 1 && this._inFlight >= limit) {
            values[index] = value;
            this._queue.push(index);
            return;
        }
        if (preservedValues !== null) preservedValues[index] = value;

        var callback = this._callback;
        var receiver = this._promise._boundValue();
        this._promise._pushContext();
        var ret = tryCatch(callback).call(receiver, value, index, length);
        this._promise._popContext();
        if (ret === errorObj) return this._reject(ret.e);

        var maybePromise = tryConvertToPromise(ret, this._promise);
        if (maybePromise instanceof Promise) {
            maybePromise = maybePromise._target();
            if (maybePromise._isPending()) {
                if (limit >= 1) this._inFlight++;
                values[index] = PENDING;
                return maybePromise._proxyPromiseArray(this, index);
            } else if (maybePromise._isFulfilled()) {
                ret = maybePromise._value();
            } else {
                return this._reject(maybePromise._reason());
            }
        }
        values[index] = ret;
    }
    var totalResolved = ++this._totalResolved;
    if (totalResolved >= length) {
        if (preservedValues !== null) {
            this._filter(values, preservedValues);
        } else {
            this._resolve(values);
        }

    }
};

MappingPromiseArray.prototype._drainQueue = function () {
    var queue = this._queue;
    var limit = this._limit;
    var values = this._values;
    while (queue.length > 0 && this._inFlight < limit) {
        if (this._isResolved()) return;
        var index = queue.pop();
        this._promiseFulfilled(values[index], index);
    }
};

MappingPromiseArray.prototype._filter = function (booleans, values) {
    var len = values.length;
    var ret = new Array(len);
    var j = 0;
    for (var i = 0; i < len; ++i) {
        if (booleans[i]) ret[j++] = values[i];
    }
    ret.length = j;
    this._resolve(ret);
};

MappingPromiseArray.prototype.preservedValues = function () {
    return this._preservedValues;
};

function map(promises, fn, options, _filter) {
    var limit = typeof options === "object" && options !== null
        ? options.concurrency
        : 0;
    limit = typeof limit === "number" &&
        isFinite(limit) && limit >= 1 ? limit : 0;
    return new MappingPromiseArray(promises, fn, limit, _filter);
}

Promise.prototype.map = function (fn, options) {
    if (typeof fn !== "function") return apiRejection("fn must be a function\u000a\u000a    See http://goo.gl/916lJJ\u000a");

    return map(this, fn, options, null).promise();
};

Promise.map = function (promises, fn, options, _filter) {
    if (typeof fn !== "function") return apiRejection("fn must be a function\u000a\u000a    See http://goo.gl/916lJJ\u000a");
    return map(promises, fn, options, _filter).promise();
};


};

},{"./async.js":2,"./util.js":38}],20:[function(_dereq_,module,exports){
"use strict";
module.exports =
function(Promise, INTERNAL, tryConvertToPromise, apiRejection) {
var util = _dereq_("./util.js");
var tryCatch = util.tryCatch;

Promise.method = function (fn) {
    if (typeof fn !== "function") {
        throw new Promise.TypeError("fn must be a function\u000a\u000a    See http://goo.gl/916lJJ\u000a");
    }
    return function () {
        var ret = new Promise(INTERNAL);
        ret._captureStackTrace();
        ret._pushContext();
        var value = tryCatch(fn).apply(this, arguments);
        ret._popContext();
        ret._resolveFromSyncValue(value);
        return ret;
    };
};

Promise.attempt = Promise["try"] = function (fn, args, ctx) {
    if (typeof fn !== "function") {
        return apiRejection("fn must be a function\u000a\u000a    See http://goo.gl/916lJJ\u000a");
    }
    var ret = new Promise(INTERNAL);
    ret._captureStackTrace();
    ret._pushContext();
    var value = util.isArray(args)
        ? tryCatch(fn).apply(ctx, args)
        : tryCatch(fn).call(ctx, args);
    ret._popContext();
    ret._resolveFromSyncValue(value);
    return ret;
};

Promise.prototype._resolveFromSyncValue = function (value) {
    if (value === util.errorObj) {
        this._rejectCallback(value.e, false, true);
    } else {
        this._resolveCallback(value, true);
    }
};
};

},{"./util.js":38}],21:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise) {
var util = _dereq_("./util.js");
var async = _dereq_("./async.js");
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;

function spreadAdapter(val, nodeback) {
    var promise = this;
    if (!util.isArray(val)) return successAdapter.call(promise, val, nodeback);
    var ret =
        tryCatch(nodeback).apply(promise._boundValue(), [null].concat(val));
    if (ret === errorObj) {
        async.throwLater(ret.e);
    }
}

function successAdapter(val, nodeback) {
    var promise = this;
    var receiver = promise._boundValue();
    var ret = val === undefined
        ? tryCatch(nodeback).call(receiver, null)
        : tryCatch(nodeback).call(receiver, null, val);
    if (ret === errorObj) {
        async.throwLater(ret.e);
    }
}
function errorAdapter(reason, nodeback) {
    var promise = this;
    if (!reason) {
        var target = promise._target();
        var newReason = target._getCarriedStackTrace();
        newReason.cause = reason;
        reason = newReason;
    }
    var ret = tryCatch(nodeback).call(promise._boundValue(), reason);
    if (ret === errorObj) {
        async.throwLater(ret.e);
    }
}

Promise.prototype.asCallback =
Promise.prototype.nodeify = function (nodeback, options) {
    if (typeof nodeback == "function") {
        var adapter = successAdapter;
        if (options !== undefined && Object(options).spread) {
            adapter = spreadAdapter;
        }
        this._then(
            adapter,
            errorAdapter,
            undefined,
            this,
            nodeback
        );
    }
    return this;
};
};

},{"./async.js":2,"./util.js":38}],22:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, PromiseArray) {
var util = _dereq_("./util.js");
var async = _dereq_("./async.js");
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;

Promise.prototype.progressed = function (handler) {
    return this._then(undefined, undefined, handler, undefined, undefined);
};

Promise.prototype._progress = function (progressValue) {
    if (this._isFollowingOrFulfilledOrRejected()) return;
    this._target()._progressUnchecked(progressValue);

};

Promise.prototype._progressHandlerAt = function (index) {
    return index === 0
        ? this._progressHandler0
        : this[(index << 2) + index - 5 + 2];
};

Promise.prototype._doProgressWith = function (progression) {
    var progressValue = progression.value;
    var handler = progression.handler;
    var promise = progression.promise;
    var receiver = progression.receiver;

    var ret = tryCatch(handler).call(receiver, progressValue);
    if (ret === errorObj) {
        if (ret.e != null &&
            ret.e.name !== "StopProgressPropagation") {
            var trace = util.canAttachTrace(ret.e)
                ? ret.e : new Error(util.toString(ret.e));
            promise._attachExtraTrace(trace);
            promise._progress(ret.e);
        }
    } else if (ret instanceof Promise) {
        ret._then(promise._progress, null, null, promise, undefined);
    } else {
        promise._progress(ret);
    }
};


Promise.prototype._progressUnchecked = function (progressValue) {
    var len = this._length();
    var progress = this._progress;
    for (var i = 0; i < len; i++) {
        var handler = this._progressHandlerAt(i);
        var promise = this._promiseAt(i);
        if (!(promise instanceof Promise)) {
            var receiver = this._receiverAt(i);
            if (typeof handler === "function") {
                handler.call(receiver, progressValue, promise);
            } else if (receiver instanceof PromiseArray &&
                       !receiver._isResolved()) {
                receiver._promiseProgressed(progressValue, promise);
            }
            continue;
        }

        if (typeof handler === "function") {
            async.invoke(this._doProgressWith, this, {
                handler: handler,
                promise: promise,
                receiver: this._receiverAt(i),
                value: progressValue
            });
        } else {
            async.invoke(progress, promise, progressValue);
        }
    }
};
};

},{"./async.js":2,"./util.js":38}],23:[function(_dereq_,module,exports){
"use strict";
module.exports = function() {
var makeSelfResolutionError = function () {
    return new TypeError("circular promise resolution chain\u000a\u000a    See http://goo.gl/LhFpo0\u000a");
};
var reflect = function() {
    return new Promise.PromiseInspection(this._target());
};
var apiRejection = function(msg) {
    return Promise.reject(new TypeError(msg));
};

var util = _dereq_("./util.js");

var getDomain;
if (util.isNode) {
    getDomain = function() {
        var ret = process.domain;
        if (ret === undefined) ret = null;
        return ret;
    };
} else {
    getDomain = function() {
        return null;
    };
}
util.notEnumerableProp(Promise, "_getDomain", getDomain);

var async = _dereq_("./async.js");
var errors = _dereq_("./errors.js");
var TypeError = Promise.TypeError = errors.TypeError;
Promise.RangeError = errors.RangeError;
Promise.CancellationError = errors.CancellationError;
Promise.TimeoutError = errors.TimeoutError;
Promise.OperationalError = errors.OperationalError;
Promise.RejectionError = errors.OperationalError;
Promise.AggregateError = errors.AggregateError;
var INTERNAL = function(){};
var APPLY = {};
var NEXT_FILTER = {e: null};
var tryConvertToPromise = _dereq_("./thenables.js")(Promise, INTERNAL);
var PromiseArray =
    _dereq_("./promise_array.js")(Promise, INTERNAL,
                                    tryConvertToPromise, apiRejection);
var CapturedTrace = _dereq_("./captured_trace.js")();
var isDebugging = _dereq_("./debuggability.js")(Promise, CapturedTrace);
 /*jshint unused:false*/
var createContext =
    _dereq_("./context.js")(Promise, CapturedTrace, isDebugging);
var CatchFilter = _dereq_("./catch_filter.js")(NEXT_FILTER);
var PromiseResolver = _dereq_("./promise_resolver.js");
var nodebackForPromise = PromiseResolver._nodebackForPromise;
var errorObj = util.errorObj;
var tryCatch = util.tryCatch;
function Promise(resolver) {
    if (typeof resolver !== "function") {
        throw new TypeError("the promise constructor requires a resolver function\u000a\u000a    See http://goo.gl/EC22Yn\u000a");
    }
    if (this.constructor !== Promise) {
        throw new TypeError("the promise constructor cannot be invoked directly\u000a\u000a    See http://goo.gl/KsIlge\u000a");
    }
    this._bitField = 0;
    this._fulfillmentHandler0 = undefined;
    this._rejectionHandler0 = undefined;
    this._progressHandler0 = undefined;
    this._promise0 = undefined;
    this._receiver0 = undefined;
    this._settledValue = undefined;
    if (resolver !== INTERNAL) this._resolveFromResolver(resolver);
}

Promise.prototype.toString = function () {
    return "[object Promise]";
};

Promise.prototype.caught = Promise.prototype["catch"] = function (fn) {
    var len = arguments.length;
    if (len > 1) {
        var catchInstances = new Array(len - 1),
            j = 0, i;
        for (i = 0; i < len - 1; ++i) {
            var item = arguments[i];
            if (typeof item === "function") {
                catchInstances[j++] = item;
            } else {
                return Promise.reject(
                    new TypeError("Catch filter must inherit from Error or be a simple predicate function\u000a\u000a    See http://goo.gl/o84o68\u000a"));
            }
        }
        catchInstances.length = j;
        fn = arguments[i];
        var catchFilter = new CatchFilter(catchInstances, fn, this);
        return this._then(undefined, catchFilter.doFilter, undefined,
            catchFilter, undefined);
    }
    return this._then(undefined, fn, undefined, undefined, undefined);
};

Promise.prototype.reflect = function () {
    return this._then(reflect, reflect, undefined, this, undefined);
};

Promise.prototype.then = function (didFulfill, didReject, didProgress) {
    if (isDebugging() && arguments.length > 0 &&
        typeof didFulfill !== "function" &&
        typeof didReject !== "function") {
        var msg = ".then() only accepts functions but was passed: " +
                util.classString(didFulfill);
        if (arguments.length > 1) {
            msg += ", " + util.classString(didReject);
        }
        this._warn(msg);
    }
    return this._then(didFulfill, didReject, didProgress,
        undefined, undefined);
};

Promise.prototype.done = function (didFulfill, didReject, didProgress) {
    var promise = this._then(didFulfill, didReject, didProgress,
        undefined, undefined);
    promise._setIsFinal();
};

Promise.prototype.spread = function (didFulfill, didReject) {
    return this.all()._then(didFulfill, didReject, undefined, APPLY, undefined);
};

Promise.prototype.isCancellable = function () {
    return !this.isResolved() &&
        this._cancellable();
};

Promise.prototype.toJSON = function () {
    var ret = {
        isFulfilled: false,
        isRejected: false,
        fulfillmentValue: undefined,
        rejectionReason: undefined
    };
    if (this.isFulfilled()) {
        ret.fulfillmentValue = this.value();
        ret.isFulfilled = true;
    } else if (this.isRejected()) {
        ret.rejectionReason = this.reason();
        ret.isRejected = true;
    }
    return ret;
};

Promise.prototype.all = function () {
    return new PromiseArray(this).promise();
};

Promise.prototype.error = function (fn) {
    return this.caught(util.originatesFromRejection, fn);
};

Promise.is = function (val) {
    return val instanceof Promise;
};

Promise.fromNode = function(fn) {
    var ret = new Promise(INTERNAL);
    var result = tryCatch(fn)(nodebackForPromise(ret));
    if (result === errorObj) {
        ret._rejectCallback(result.e, true, true);
    }
    return ret;
};

Promise.all = function (promises) {
    return new PromiseArray(promises).promise();
};

Promise.defer = Promise.pending = function () {
    var promise = new Promise(INTERNAL);
    return new PromiseResolver(promise);
};

Promise.cast = function (obj) {
    var ret = tryConvertToPromise(obj);
    if (!(ret instanceof Promise)) {
        var val = ret;
        ret = new Promise(INTERNAL);
        ret._fulfillUnchecked(val);
    }
    return ret;
};

Promise.resolve = Promise.fulfilled = Promise.cast;

Promise.reject = Promise.rejected = function (reason) {
    var ret = new Promise(INTERNAL);
    ret._captureStackTrace();
    ret._rejectCallback(reason, true);
    return ret;
};

Promise.setScheduler = function(fn) {
    if (typeof fn !== "function") throw new TypeError("fn must be a function\u000a\u000a    See http://goo.gl/916lJJ\u000a");
    var prev = async._schedule;
    async._schedule = fn;
    return prev;
};

Promise.prototype._then = function (
    didFulfill,
    didReject,
    didProgress,
    receiver,
    internalData
) {
    var haveInternalData = internalData !== undefined;
    var ret = haveInternalData ? internalData : new Promise(INTERNAL);

    if (!haveInternalData) {
        ret._propagateFrom(this, 4 | 1);
        ret._captureStackTrace();
    }

    var target = this._target();
    if (target !== this) {
        if (receiver === undefined) receiver = this._boundTo;
        if (!haveInternalData) ret._setIsMigrated();
    }

    var callbackIndex = target._addCallbacks(didFulfill,
                                             didReject,
                                             didProgress,
                                             ret,
                                             receiver,
                                             getDomain());

    if (target._isResolved() && !target._isSettlePromisesQueued()) {
        async.invoke(
            target._settlePromiseAtPostResolution, target, callbackIndex);
    }

    return ret;
};

Promise.prototype._settlePromiseAtPostResolution = function (index) {
    if (this._isRejectionUnhandled()) this._unsetRejectionIsUnhandled();
    this._settlePromiseAt(index);
};

Promise.prototype._length = function () {
    return this._bitField & 131071;
};

Promise.prototype._isFollowingOrFulfilledOrRejected = function () {
    return (this._bitField & 939524096) > 0;
};

Promise.prototype._isFollowing = function () {
    return (this._bitField & 536870912) === 536870912;
};

Promise.prototype._setLength = function (len) {
    this._bitField = (this._bitField & -131072) |
        (len & 131071);
};

Promise.prototype._setFulfilled = function () {
    this._bitField = this._bitField | 268435456;
};

Promise.prototype._setRejected = function () {
    this._bitField = this._bitField | 134217728;
};

Promise.prototype._setFollowing = function () {
    this._bitField = this._bitField | 536870912;
};

Promise.prototype._setIsFinal = function () {
    this._bitField = this._bitField | 33554432;
};

Promise.prototype._isFinal = function () {
    return (this._bitField & 33554432) > 0;
};

Promise.prototype._cancellable = function () {
    return (this._bitField & 67108864) > 0;
};

Promise.prototype._setCancellable = function () {
    this._bitField = this._bitField | 67108864;
};

Promise.prototype._unsetCancellable = function () {
    this._bitField = this._bitField & (~67108864);
};

Promise.prototype._setIsMigrated = function () {
    this._bitField = this._bitField | 4194304;
};

Promise.prototype._unsetIsMigrated = function () {
    this._bitField = this._bitField & (~4194304);
};

Promise.prototype._isMigrated = function () {
    return (this._bitField & 4194304) > 0;
};

Promise.prototype._receiverAt = function (index) {
    var ret = index === 0
        ? this._receiver0
        : this[
            index * 5 - 5 + 4];
    if (ret === undefined && this._isBound()) {
        return this._boundValue();
    }
    return ret;
};

Promise.prototype._promiseAt = function (index) {
    return index === 0
        ? this._promise0
        : this[index * 5 - 5 + 3];
};

Promise.prototype._fulfillmentHandlerAt = function (index) {
    return index === 0
        ? this._fulfillmentHandler0
        : this[index * 5 - 5 + 0];
};

Promise.prototype._rejectionHandlerAt = function (index) {
    return index === 0
        ? this._rejectionHandler0
        : this[index * 5 - 5 + 1];
};

Promise.prototype._boundValue = function() {
    var ret = this._boundTo;
    if (ret !== undefined) {
        if (ret instanceof Promise) {
            if (ret.isFulfilled()) {
                return ret.value();
            } else {
                return undefined;
            }
        }
    }
    return ret;
};

Promise.prototype._migrateCallbacks = function (follower, index) {
    var fulfill = follower._fulfillmentHandlerAt(index);
    var reject = follower._rejectionHandlerAt(index);
    var progress = follower._progressHandlerAt(index);
    var promise = follower._promiseAt(index);
    var receiver = follower._receiverAt(index);
    if (promise instanceof Promise) promise._setIsMigrated();
    this._addCallbacks(fulfill, reject, progress, promise, receiver, null);
};

Promise.prototype._addCallbacks = function (
    fulfill,
    reject,
    progress,
    promise,
    receiver,
    domain
) {
    var index = this._length();

    if (index >= 131071 - 5) {
        index = 0;
        this._setLength(0);
    }

    if (index === 0) {
        this._promise0 = promise;
        if (receiver !== undefined) this._receiver0 = receiver;
        if (typeof fulfill === "function" && !this._isCarryingStackTrace()) {
            this._fulfillmentHandler0 =
                domain === null ? fulfill : domain.bind(fulfill);
        }
        if (typeof reject === "function") {
            this._rejectionHandler0 =
                domain === null ? reject : domain.bind(reject);
        }
        if (typeof progress === "function") {
            this._progressHandler0 =
                domain === null ? progress : domain.bind(progress);
        }
    } else {
        var base = index * 5 - 5;
        this[base + 3] = promise;
        this[base + 4] = receiver;
        if (typeof fulfill === "function") {
            this[base + 0] =
                domain === null ? fulfill : domain.bind(fulfill);
        }
        if (typeof reject === "function") {
            this[base + 1] =
                domain === null ? reject : domain.bind(reject);
        }
        if (typeof progress === "function") {
            this[base + 2] =
                domain === null ? progress : domain.bind(progress);
        }
    }
    this._setLength(index + 1);
    return index;
};

Promise.prototype._setProxyHandlers = function (receiver, promiseSlotValue) {
    var index = this._length();

    if (index >= 131071 - 5) {
        index = 0;
        this._setLength(0);
    }
    if (index === 0) {
        this._promise0 = promiseSlotValue;
        this._receiver0 = receiver;
    } else {
        var base = index * 5 - 5;
        this[base + 3] = promiseSlotValue;
        this[base + 4] = receiver;
    }
    this._setLength(index + 1);
};

Promise.prototype._proxyPromiseArray = function (promiseArray, index) {
    this._setProxyHandlers(promiseArray, index);
};

Promise.prototype._resolveCallback = function(value, shouldBind) {
    if (this._isFollowingOrFulfilledOrRejected()) return;
    if (value === this)
        return this._rejectCallback(makeSelfResolutionError(), false, true);
    var maybePromise = tryConvertToPromise(value, this);
    if (!(maybePromise instanceof Promise)) return this._fulfill(value);

    var propagationFlags = 1 | (shouldBind ? 4 : 0);
    this._propagateFrom(maybePromise, propagationFlags);
    var promise = maybePromise._target();
    if (promise._isPending()) {
        var len = this._length();
        for (var i = 0; i < len; ++i) {
            promise._migrateCallbacks(this, i);
        }
        this._setFollowing();
        this._setLength(0);
        this._setFollowee(promise);
    } else if (promise._isFulfilled()) {
        this._fulfillUnchecked(promise._value());
    } else {
        this._rejectUnchecked(promise._reason(),
            promise._getCarriedStackTrace());
    }
};

Promise.prototype._rejectCallback =
function(reason, synchronous, shouldNotMarkOriginatingFromRejection) {
    if (!shouldNotMarkOriginatingFromRejection) {
        util.markAsOriginatingFromRejection(reason);
    }
    var trace = util.ensureErrorObject(reason);
    var hasStack = trace === reason;
    this._attachExtraTrace(trace, synchronous ? hasStack : false);
    this._reject(reason, hasStack ? undefined : trace);
};

Promise.prototype._resolveFromResolver = function (resolver) {
    var promise = this;
    this._captureStackTrace();
    this._pushContext();
    var synchronous = true;
    var r = tryCatch(resolver)(function(value) {
        if (promise === null) return;
        promise._resolveCallback(value);
        promise = null;
    }, function (reason) {
        if (promise === null) return;
        promise._rejectCallback(reason, synchronous);
        promise = null;
    });
    synchronous = false;
    this._popContext();

    if (r !== undefined && r === errorObj && promise !== null) {
        promise._rejectCallback(r.e, true, true);
        promise = null;
    }
};

Promise.prototype._settlePromiseFromHandler = function (
    handler, receiver, value, promise
) {
    if (promise._isRejected()) return;
    promise._pushContext();
    var x;
    if (receiver === APPLY && !this._isRejected()) {
        x = tryCatch(handler).apply(this._boundValue(), value);
    } else {
        x = tryCatch(handler).call(receiver, value);
    }
    promise._popContext();

    if (x === errorObj || x === promise || x === NEXT_FILTER) {
        var err = x === promise ? makeSelfResolutionError() : x.e;
        promise._rejectCallback(err, false, true);
    } else {
        promise._resolveCallback(x);
    }
};

Promise.prototype._target = function() {
    var ret = this;
    while (ret._isFollowing()) ret = ret._followee();
    return ret;
};

Promise.prototype._followee = function() {
    return this._rejectionHandler0;
};

Promise.prototype._setFollowee = function(promise) {
    this._rejectionHandler0 = promise;
};

Promise.prototype._cleanValues = function () {
    if (this._cancellable()) {
        this._cancellationParent = undefined;
    }
};

Promise.prototype._propagateFrom = function (parent, flags) {
    if ((flags & 1) > 0 && parent._cancellable()) {
        this._setCancellable();
        this._cancellationParent = parent;
    }
    if ((flags & 4) > 0 && parent._isBound()) {
        this._setBoundTo(parent._boundTo);
    }
};

Promise.prototype._fulfill = function (value) {
    if (this._isFollowingOrFulfilledOrRejected()) return;
    this._fulfillUnchecked(value);
};

Promise.prototype._reject = function (reason, carriedStackTrace) {
    if (this._isFollowingOrFulfilledOrRejected()) return;
    this._rejectUnchecked(reason, carriedStackTrace);
};

Promise.prototype._settlePromiseAt = function (index) {
    var promise = this._promiseAt(index);
    var isPromise = promise instanceof Promise;

    if (isPromise && promise._isMigrated()) {
        promise._unsetIsMigrated();
        return async.invoke(this._settlePromiseAt, this, index);
    }
    var handler = this._isFulfilled()
        ? this._fulfillmentHandlerAt(index)
        : this._rejectionHandlerAt(index);

    var carriedStackTrace =
        this._isCarryingStackTrace() ? this._getCarriedStackTrace() : undefined;
    var value = this._settledValue;
    var receiver = this._receiverAt(index);
    this._clearCallbackDataAtIndex(index);

    if (typeof handler === "function") {
        if (!isPromise) {
            handler.call(receiver, value, promise);
        } else {
            this._settlePromiseFromHandler(handler, receiver, value, promise);
        }
    } else if (receiver instanceof PromiseArray) {
        if (!receiver._isResolved()) {
            if (this._isFulfilled()) {
                receiver._promiseFulfilled(value, promise);
            }
            else {
                receiver._promiseRejected(value, promise);
            }
        }
    } else if (isPromise) {
        if (this._isFulfilled()) {
            promise._fulfill(value);
        } else {
            promise._reject(value, carriedStackTrace);
        }
    }

    if (index >= 4 && (index & 31) === 4)
        async.invokeLater(this._setLength, this, 0);
};

Promise.prototype._clearCallbackDataAtIndex = function(index) {
    if (index === 0) {
        if (!this._isCarryingStackTrace()) {
            this._fulfillmentHandler0 = undefined;
        }
        this._rejectionHandler0 =
        this._progressHandler0 =
        this._receiver0 =
        this._promise0 = undefined;
    } else {
        var base = index * 5 - 5;
        this[base + 3] =
        this[base + 4] =
        this[base + 0] =
        this[base + 1] =
        this[base + 2] = undefined;
    }
};

Promise.prototype._isSettlePromisesQueued = function () {
    return (this._bitField &
            -1073741824) === -1073741824;
};

Promise.prototype._setSettlePromisesQueued = function () {
    this._bitField = this._bitField | -1073741824;
};

Promise.prototype._unsetSettlePromisesQueued = function () {
    this._bitField = this._bitField & (~-1073741824);
};

Promise.prototype._queueSettlePromises = function() {
    async.settlePromises(this);
    this._setSettlePromisesQueued();
};

Promise.prototype._fulfillUnchecked = function (value) {
    if (value === this) {
        var err = makeSelfResolutionError();
        this._attachExtraTrace(err);
        return this._rejectUnchecked(err, undefined);
    }
    this._setFulfilled();
    this._settledValue = value;
    this._cleanValues();

    if (this._length() > 0) {
        this._queueSettlePromises();
    }
};

Promise.prototype._rejectUncheckedCheckError = function (reason) {
    var trace = util.ensureErrorObject(reason);
    this._rejectUnchecked(reason, trace === reason ? undefined : trace);
};

Promise.prototype._rejectUnchecked = function (reason, trace) {
    if (reason === this) {
        var err = makeSelfResolutionError();
        this._attachExtraTrace(err);
        return this._rejectUnchecked(err);
    }
    this._setRejected();
    this._settledValue = reason;
    this._cleanValues();

    if (this._isFinal()) {
        async.throwLater(function(e) {
            if ("stack" in e) {
                async.invokeFirst(
                    CapturedTrace.unhandledRejection, undefined, e);
            }
            throw e;
        }, trace === undefined ? reason : trace);
        return;
    }

    if (trace !== undefined && trace !== reason) {
        this._setCarriedStackTrace(trace);
    }

    if (this._length() > 0) {
        this._queueSettlePromises();
    } else {
        this._ensurePossibleRejectionHandled();
    }
};

Promise.prototype._settlePromises = function () {
    this._unsetSettlePromisesQueued();
    var len = this._length();
    for (var i = 0; i < len; i++) {
        this._settlePromiseAt(i);
    }
};

util.notEnumerableProp(Promise,
                       "_makeSelfResolutionError",
                       makeSelfResolutionError);

_dereq_("./progress.js")(Promise, PromiseArray);
_dereq_("./method.js")(Promise, INTERNAL, tryConvertToPromise, apiRejection);
_dereq_("./bind.js")(Promise, INTERNAL, tryConvertToPromise);
_dereq_("./finally.js")(Promise, NEXT_FILTER, tryConvertToPromise);
_dereq_("./direct_resolve.js")(Promise);
_dereq_("./synchronous_inspection.js")(Promise);
_dereq_("./join.js")(Promise, PromiseArray, tryConvertToPromise, INTERNAL);
Promise.Promise = Promise;
_dereq_('./map.js')(Promise, PromiseArray, apiRejection, tryConvertToPromise, INTERNAL);
_dereq_('./cancel.js')(Promise);
_dereq_('./using.js')(Promise, apiRejection, tryConvertToPromise, createContext);
_dereq_('./generators.js')(Promise, apiRejection, INTERNAL, tryConvertToPromise);
_dereq_('./nodeify.js')(Promise);
_dereq_('./call_get.js')(Promise);
_dereq_('./props.js')(Promise, PromiseArray, tryConvertToPromise, apiRejection);
_dereq_('./race.js')(Promise, INTERNAL, tryConvertToPromise, apiRejection);
_dereq_('./reduce.js')(Promise, PromiseArray, apiRejection, tryConvertToPromise, INTERNAL);
_dereq_('./settle.js')(Promise, PromiseArray);
_dereq_('./some.js')(Promise, PromiseArray, apiRejection);
_dereq_('./promisify.js')(Promise, INTERNAL);
_dereq_('./any.js')(Promise);
_dereq_('./each.js')(Promise, INTERNAL);
_dereq_('./timers.js')(Promise, INTERNAL);
_dereq_('./filter.js')(Promise, INTERNAL);
                                                         
    util.toFastProperties(Promise);                                          
    util.toFastProperties(Promise.prototype);                                
    function fillTypes(value) {                                              
        var p = new Promise(INTERNAL);                                       
        p._fulfillmentHandler0 = value;                                      
        p._rejectionHandler0 = value;                                        
        p._progressHandler0 = value;                                         
        p._promise0 = value;                                                 
        p._receiver0 = value;                                                
        p._settledValue = value;                                             
    }                                                                        
    // Complete slack tracking, opt out of field-type tracking and           
    // stabilize map                                                         
    fillTypes({a: 1});                                                       
    fillTypes({b: 2});                                                       
    fillTypes({c: 3});                                                       
    fillTypes(1);                                                            
    fillTypes(function(){});                                                 
    fillTypes(undefined);                                                    
    fillTypes(false);                                                        
    fillTypes(new Promise(INTERNAL));                                        
    CapturedTrace.setBounds(async.firstLineError, util.lastLineError);       
    return Promise;                                                          

};

},{"./any.js":1,"./async.js":2,"./bind.js":3,"./call_get.js":5,"./cancel.js":6,"./captured_trace.js":7,"./catch_filter.js":8,"./context.js":9,"./debuggability.js":10,"./direct_resolve.js":11,"./each.js":12,"./errors.js":13,"./filter.js":15,"./finally.js":16,"./generators.js":17,"./join.js":18,"./map.js":19,"./method.js":20,"./nodeify.js":21,"./progress.js":22,"./promise_array.js":24,"./promise_resolver.js":25,"./promisify.js":26,"./props.js":27,"./race.js":29,"./reduce.js":30,"./settle.js":32,"./some.js":33,"./synchronous_inspection.js":34,"./thenables.js":35,"./timers.js":36,"./using.js":37,"./util.js":38}],24:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL, tryConvertToPromise,
    apiRejection) {
var util = _dereq_("./util.js");
var isArray = util.isArray;

function toResolutionValue(val) {
    switch(val) {
    case -2: return [];
    case -3: return {};
    }
}

function PromiseArray(values) {
    var promise = this._promise = new Promise(INTERNAL);
    var parent;
    if (values instanceof Promise) {
        parent = values;
        promise._propagateFrom(parent, 1 | 4);
    }
    this._values = values;
    this._length = 0;
    this._totalResolved = 0;
    this._init(undefined, -2);
}
PromiseArray.prototype.length = function () {
    return this._length;
};

PromiseArray.prototype.promise = function () {
    return this._promise;
};

PromiseArray.prototype._init = function init(_, resolveValueIfEmpty) {
    var values = tryConvertToPromise(this._values, this._promise);
    if (values instanceof Promise) {
        values = values._target();
        this._values = values;
        if (values._isFulfilled()) {
            values = values._value();
            if (!isArray(values)) {
                var err = new Promise.TypeError("expecting an array, a promise or a thenable\u000a\u000a    See http://goo.gl/s8MMhc\u000a");
                this.__hardReject__(err);
                return;
            }
        } else if (values._isPending()) {
            values._then(
                init,
                this._reject,
                undefined,
                this,
                resolveValueIfEmpty
           );
            return;
        } else {
            this._reject(values._reason());
            return;
        }
    } else if (!isArray(values)) {
        this._promise._reject(apiRejection("expecting an array, a promise or a thenable\u000a\u000a    See http://goo.gl/s8MMhc\u000a")._reason());
        return;
    }

    if (values.length === 0) {
        if (resolveValueIfEmpty === -5) {
            this._resolveEmptyArray();
        }
        else {
            this._resolve(toResolutionValue(resolveValueIfEmpty));
        }
        return;
    }
    var len = this.getActualLength(values.length);
    this._length = len;
    this._values = this.shouldCopyValues() ? new Array(len) : this._values;
    var promise = this._promise;
    for (var i = 0; i < len; ++i) {
        var isResolved = this._isResolved();
        var maybePromise = tryConvertToPromise(values[i], promise);
        if (maybePromise instanceof Promise) {
            maybePromise = maybePromise._target();
            if (isResolved) {
                maybePromise._ignoreRejections();
            } else if (maybePromise._isPending()) {
                maybePromise._proxyPromiseArray(this, i);
            } else if (maybePromise._isFulfilled()) {
                this._promiseFulfilled(maybePromise._value(), i);
            } else {
                this._promiseRejected(maybePromise._reason(), i);
            }
        } else if (!isResolved) {
            this._promiseFulfilled(maybePromise, i);
        }
    }
};

PromiseArray.prototype._isResolved = function () {
    return this._values === null;
};

PromiseArray.prototype._resolve = function (value) {
    this._values = null;
    this._promise._fulfill(value);
};

PromiseArray.prototype.__hardReject__ =
PromiseArray.prototype._reject = function (reason) {
    this._values = null;
    this._promise._rejectCallback(reason, false, true);
};

PromiseArray.prototype._promiseProgressed = function (progressValue, index) {
    this._promise._progress({
        index: index,
        value: progressValue
    });
};


PromiseArray.prototype._promiseFulfilled = function (value, index) {
    this._values[index] = value;
    var totalResolved = ++this._totalResolved;
    if (totalResolved >= this._length) {
        this._resolve(this._values);
    }
};

PromiseArray.prototype._promiseRejected = function (reason, index) {
    this._totalResolved++;
    this._reject(reason);
};

PromiseArray.prototype.shouldCopyValues = function () {
    return true;
};

PromiseArray.prototype.getActualLength = function (len) {
    return len;
};

return PromiseArray;
};

},{"./util.js":38}],25:[function(_dereq_,module,exports){
"use strict";
var util = _dereq_("./util.js");
var maybeWrapAsError = util.maybeWrapAsError;
var errors = _dereq_("./errors.js");
var TimeoutError = errors.TimeoutError;
var OperationalError = errors.OperationalError;
var haveGetters = util.haveGetters;
var es5 = _dereq_("./es5.js");

function isUntypedError(obj) {
    return obj instanceof Error &&
        es5.getPrototypeOf(obj) === Error.prototype;
}

var rErrorKey = /^(?:name|message|stack|cause)$/;
function wrapAsOperationalError(obj) {
    var ret;
    if (isUntypedError(obj)) {
        ret = new OperationalError(obj);
        ret.name = obj.name;
        ret.message = obj.message;
        ret.stack = obj.stack;
        var keys = es5.keys(obj);
        for (var i = 0; i < keys.length; ++i) {
            var key = keys[i];
            if (!rErrorKey.test(key)) {
                ret[key] = obj[key];
            }
        }
        return ret;
    }
    util.markAsOriginatingFromRejection(obj);
    return obj;
}

function nodebackForPromise(promise) {
    return function(err, value) {
        if (promise === null) return;

        if (err) {
            var wrapped = wrapAsOperationalError(maybeWrapAsError(err));
            promise._attachExtraTrace(wrapped);
            promise._reject(wrapped);
        } else if (arguments.length > 2) {
            var $_len = arguments.length;var args = new Array($_len - 1); for(var $_i = 1; $_i < $_len; ++$_i) {args[$_i - 1] = arguments[$_i];}
            promise._fulfill(args);
        } else {
            promise._fulfill(value);
        }

        promise = null;
    };
}


var PromiseResolver;
if (!haveGetters) {
    PromiseResolver = function (promise) {
        this.promise = promise;
        this.asCallback = nodebackForPromise(promise);
        this.callback = this.asCallback;
    };
}
else {
    PromiseResolver = function (promise) {
        this.promise = promise;
    };
}
if (haveGetters) {
    var prop = {
        get: function() {
            return nodebackForPromise(this.promise);
        }
    };
    es5.defineProperty(PromiseResolver.prototype, "asCallback", prop);
    es5.defineProperty(PromiseResolver.prototype, "callback", prop);
}

PromiseResolver._nodebackForPromise = nodebackForPromise;

PromiseResolver.prototype.toString = function () {
    return "[object PromiseResolver]";
};

PromiseResolver.prototype.resolve =
PromiseResolver.prototype.fulfill = function (value) {
    if (!(this instanceof PromiseResolver)) {
        throw new TypeError("Illegal invocation, resolver resolve/reject must be called within a resolver context. Consider using the promise constructor instead.\u000a\u000a    See http://goo.gl/sdkXL9\u000a");
    }
    this.promise._resolveCallback(value);
};

PromiseResolver.prototype.reject = function (reason) {
    if (!(this instanceof PromiseResolver)) {
        throw new TypeError("Illegal invocation, resolver resolve/reject must be called within a resolver context. Consider using the promise constructor instead.\u000a\u000a    See http://goo.gl/sdkXL9\u000a");
    }
    this.promise._rejectCallback(reason);
};

PromiseResolver.prototype.progress = function (value) {
    if (!(this instanceof PromiseResolver)) {
        throw new TypeError("Illegal invocation, resolver resolve/reject must be called within a resolver context. Consider using the promise constructor instead.\u000a\u000a    See http://goo.gl/sdkXL9\u000a");
    }
    this.promise._progress(value);
};

PromiseResolver.prototype.cancel = function (err) {
    this.promise.cancel(err);
};

PromiseResolver.prototype.timeout = function () {
    this.reject(new TimeoutError("timeout"));
};

PromiseResolver.prototype.isResolved = function () {
    return this.promise.isResolved();
};

PromiseResolver.prototype.toJSON = function () {
    return this.promise.toJSON();
};

module.exports = PromiseResolver;

},{"./errors.js":13,"./es5.js":14,"./util.js":38}],26:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL) {
var THIS = {};
var util = _dereq_("./util.js");
var nodebackForPromise = _dereq_("./promise_resolver.js")
    ._nodebackForPromise;
var withAppended = util.withAppended;
var maybeWrapAsError = util.maybeWrapAsError;
var canEvaluate = util.canEvaluate;
var TypeError = _dereq_("./errors").TypeError;
var defaultSuffix = "Async";
var defaultPromisified = {__isPromisified__: true};
var noCopyProps = [
    "arity",    "length",
    "name",
    "arguments",
    "caller",
    "callee",
    "prototype",
    "__isPromisified__"
];
var noCopyPropsPattern = new RegExp("^(?:" + noCopyProps.join("|") + ")$");

var defaultFilter = function(name) {
    return util.isIdentifier(name) &&
        name.charAt(0) !== "_" &&
        name !== "constructor";
};

function propsFilter(key) {
    return !noCopyPropsPattern.test(key);
}

function isPromisified(fn) {
    try {
        return fn.__isPromisified__ === true;
    }
    catch (e) {
        return false;
    }
}

function hasPromisified(obj, key, suffix) {
    var val = util.getDataPropertyOrDefault(obj, key + suffix,
                                            defaultPromisified);
    return val ? isPromisified(val) : false;
}
function checkValid(ret, suffix, suffixRegexp) {
    for (var i = 0; i < ret.length; i += 2) {
        var key = ret[i];
        if (suffixRegexp.test(key)) {
            var keyWithoutAsyncSuffix = key.replace(suffixRegexp, "");
            for (var j = 0; j < ret.length; j += 2) {
                if (ret[j] === keyWithoutAsyncSuffix) {
                    throw new TypeError("Cannot promisify an API that has normal methods with '%s'-suffix\u000a\u000a    See http://goo.gl/iWrZbw\u000a"
                        .replace("%s", suffix));
                }
            }
        }
    }
}

function promisifiableMethods(obj, suffix, suffixRegexp, filter) {
    var keys = util.inheritedDataKeys(obj);
    var ret = [];
    for (var i = 0; i < keys.length; ++i) {
        var key = keys[i];
        var value = obj[key];
        var passesDefaultFilter = filter === defaultFilter
            ? true : defaultFilter(key, value, obj);
        if (typeof value === "function" &&
            !isPromisified(value) &&
            !hasPromisified(obj, key, suffix) &&
            filter(key, value, obj, passesDefaultFilter)) {
            ret.push(key, value);
        }
    }
    checkValid(ret, suffix, suffixRegexp);
    return ret;
}

var escapeIdentRegex = function(str) {
    return str.replace(/([$])/, "\\$");
};

var makeNodePromisifiedEval;
if (!true) {
var switchCaseArgumentOrder = function(likelyArgumentCount) {
    var ret = [likelyArgumentCount];
    var min = Math.max(0, likelyArgumentCount - 1 - 3);
    for(var i = likelyArgumentCount - 1; i >= min; --i) {
        ret.push(i);
    }
    for(var i = likelyArgumentCount + 1; i <= 3; ++i) {
        ret.push(i);
    }
    return ret;
};

var argumentSequence = function(argumentCount) {
    return util.filledRange(argumentCount, "_arg", "");
};

var parameterDeclaration = function(parameterCount) {
    return util.filledRange(
        Math.max(parameterCount, 3), "_arg", "");
};

var parameterCount = function(fn) {
    if (typeof fn.length === "number") {
        return Math.max(Math.min(fn.length, 1023 + 1), 0);
    }
    return 0;
};

makeNodePromisifiedEval =
function(callback, receiver, originalName, fn) {
    var newParameterCount = Math.max(0, parameterCount(fn) - 1);
    var argumentOrder = switchCaseArgumentOrder(newParameterCount);
    var shouldProxyThis = typeof callback === "string" || receiver === THIS;

    function generateCallForArgumentCount(count) {
        var args = argumentSequence(count).join(", ");
        var comma = count > 0 ? ", " : "";
        var ret;
        if (shouldProxyThis) {
            ret = "ret = callback.call(this, {{args}}, nodeback); break;\n";
        } else {
            ret = receiver === undefined
                ? "ret = callback({{args}}, nodeback); break;\n"
                : "ret = callback.call(receiver, {{args}}, nodeback); break;\n";
        }
        return ret.replace("{{args}}", args).replace(", ", comma);
    }

    function generateArgumentSwitchCase() {
        var ret = "";
        for (var i = 0; i < argumentOrder.length; ++i) {
            ret += "case " + argumentOrder[i] +":" +
                generateCallForArgumentCount(argumentOrder[i]);
        }

        ret += "                                                             \n\
        default:                                                             \n\
            var args = new Array(len + 1);                                   \n\
            var i = 0;                                                       \n\
            for (var i = 0; i < len; ++i) {                                  \n\
               args[i] = arguments[i];                                       \n\
            }                                                                \n\
            args[i] = nodeback;                                              \n\
            [CodeForCall]                                                    \n\
            break;                                                           \n\
        ".replace("[CodeForCall]", (shouldProxyThis
                                ? "ret = callback.apply(this, args);\n"
                                : "ret = callback.apply(receiver, args);\n"));
        return ret;
    }

    var getFunctionCode = typeof callback === "string"
                                ? ("this != null ? this['"+callback+"'] : fn")
                                : "fn";

    return new Function("Promise",
                        "fn",
                        "receiver",
                        "withAppended",
                        "maybeWrapAsError",
                        "nodebackForPromise",
                        "tryCatch",
                        "errorObj",
                        "notEnumerableProp",
                        "INTERNAL","'use strict';                            \n\
        var ret = function (Parameters) {                                    \n\
            'use strict';                                                    \n\
            var len = arguments.length;                                      \n\
            var promise = new Promise(INTERNAL);                             \n\
            promise._captureStackTrace();                                    \n\
            var nodeback = nodebackForPromise(promise);                      \n\
            var ret;                                                         \n\
            var callback = tryCatch([GetFunctionCode]);                      \n\
            switch(len) {                                                    \n\
                [CodeForSwitchCase]                                          \n\
            }                                                                \n\
            if (ret === errorObj) {                                          \n\
                promise._rejectCallback(maybeWrapAsError(ret.e), true, true);\n\
            }                                                                \n\
            return promise;                                                  \n\
        };                                                                   \n\
        notEnumerableProp(ret, '__isPromisified__', true);                   \n\
        return ret;                                                          \n\
        "
        .replace("Parameters", parameterDeclaration(newParameterCount))
        .replace("[CodeForSwitchCase]", generateArgumentSwitchCase())
        .replace("[GetFunctionCode]", getFunctionCode))(
            Promise,
            fn,
            receiver,
            withAppended,
            maybeWrapAsError,
            nodebackForPromise,
            util.tryCatch,
            util.errorObj,
            util.notEnumerableProp,
            INTERNAL
        );
};
}

function makeNodePromisifiedClosure(callback, receiver, _, fn) {
    var defaultThis = (function() {return this;})();
    var method = callback;
    if (typeof method === "string") {
        callback = fn;
    }
    function promisified() {
        var _receiver = receiver;
        if (receiver === THIS) _receiver = this;
        var promise = new Promise(INTERNAL);
        promise._captureStackTrace();
        var cb = typeof method === "string" && this !== defaultThis
            ? this[method] : callback;
        var fn = nodebackForPromise(promise);
        try {
            cb.apply(_receiver, withAppended(arguments, fn));
        } catch(e) {
            promise._rejectCallback(maybeWrapAsError(e), true, true);
        }
        return promise;
    }
    util.notEnumerableProp(promisified, "__isPromisified__", true);
    return promisified;
}

var makeNodePromisified = canEvaluate
    ? makeNodePromisifiedEval
    : makeNodePromisifiedClosure;

function promisifyAll(obj, suffix, filter, promisifier) {
    var suffixRegexp = new RegExp(escapeIdentRegex(suffix) + "$");
    var methods =
        promisifiableMethods(obj, suffix, suffixRegexp, filter);

    for (var i = 0, len = methods.length; i < len; i+= 2) {
        var key = methods[i];
        var fn = methods[i+1];
        var promisifiedKey = key + suffix;
        obj[promisifiedKey] = promisifier === makeNodePromisified
                ? makeNodePromisified(key, THIS, key, fn, suffix)
                : promisifier(fn, function() {
                    return makeNodePromisified(key, THIS, key, fn, suffix);
                });
    }
    util.toFastProperties(obj);
    return obj;
}

function promisify(callback, receiver) {
    return makeNodePromisified(callback, receiver, undefined, callback);
}

Promise.promisify = function (fn, receiver) {
    if (typeof fn !== "function") {
        throw new TypeError("fn must be a function\u000a\u000a    See http://goo.gl/916lJJ\u000a");
    }
    if (isPromisified(fn)) {
        return fn;
    }
    var ret = promisify(fn, arguments.length < 2 ? THIS : receiver);
    util.copyDescriptors(fn, ret, propsFilter);
    return ret;
};

Promise.promisifyAll = function (target, options) {
    if (typeof target !== "function" && typeof target !== "object") {
        throw new TypeError("the target of promisifyAll must be an object or a function\u000a\u000a    See http://goo.gl/9ITlV0\u000a");
    }
    options = Object(options);
    var suffix = options.suffix;
    if (typeof suffix !== "string") suffix = defaultSuffix;
    var filter = options.filter;
    if (typeof filter !== "function") filter = defaultFilter;
    var promisifier = options.promisifier;
    if (typeof promisifier !== "function") promisifier = makeNodePromisified;

    if (!util.isIdentifier(suffix)) {
        throw new RangeError("suffix must be a valid identifier\u000a\u000a    See http://goo.gl/8FZo5V\u000a");
    }

    var keys = util.inheritedDataKeys(target);
    for (var i = 0; i < keys.length; ++i) {
        var value = target[keys[i]];
        if (keys[i] !== "constructor" &&
            util.isClass(value)) {
            promisifyAll(value.prototype, suffix, filter, promisifier);
            promisifyAll(value, suffix, filter, promisifier);
        }
    }

    return promisifyAll(target, suffix, filter, promisifier);
};
};


},{"./errors":13,"./promise_resolver.js":25,"./util.js":38}],27:[function(_dereq_,module,exports){
"use strict";
module.exports = function(
    Promise, PromiseArray, tryConvertToPromise, apiRejection) {
var util = _dereq_("./util.js");
var isObject = util.isObject;
var es5 = _dereq_("./es5.js");

function PropertiesPromiseArray(obj) {
    var keys = es5.keys(obj);
    var len = keys.length;
    var values = new Array(len * 2);
    for (var i = 0; i < len; ++i) {
        var key = keys[i];
        values[i] = obj[key];
        values[i + len] = key;
    }
    this.constructor$(values);
}
util.inherits(PropertiesPromiseArray, PromiseArray);

PropertiesPromiseArray.prototype._init = function () {
    this._init$(undefined, -3) ;
};

PropertiesPromiseArray.prototype._promiseFulfilled = function (value, index) {
    this._values[index] = value;
    var totalResolved = ++this._totalResolved;
    if (totalResolved >= this._length) {
        var val = {};
        var keyOffset = this.length();
        for (var i = 0, len = this.length(); i < len; ++i) {
            val[this._values[i + keyOffset]] = this._values[i];
        }
        this._resolve(val);
    }
};

PropertiesPromiseArray.prototype._promiseProgressed = function (value, index) {
    this._promise._progress({
        key: this._values[index + this.length()],
        value: value
    });
};

PropertiesPromiseArray.prototype.shouldCopyValues = function () {
    return false;
};

PropertiesPromiseArray.prototype.getActualLength = function (len) {
    return len >> 1;
};

function props(promises) {
    var ret;
    var castValue = tryConvertToPromise(promises);

    if (!isObject(castValue)) {
        return apiRejection("cannot await properties of a non-object\u000a\u000a    See http://goo.gl/OsFKC8\u000a");
    } else if (castValue instanceof Promise) {
        ret = castValue._then(
            Promise.props, undefined, undefined, undefined, undefined);
    } else {
        ret = new PropertiesPromiseArray(castValue).promise();
    }

    if (castValue instanceof Promise) {
        ret._propagateFrom(castValue, 4);
    }
    return ret;
}

Promise.prototype.props = function () {
    return props(this);
};

Promise.props = function (promises) {
    return props(promises);
};
};

},{"./es5.js":14,"./util.js":38}],28:[function(_dereq_,module,exports){
"use strict";
function arrayMove(src, srcIndex, dst, dstIndex, len) {
    for (var j = 0; j < len; ++j) {
        dst[j + dstIndex] = src[j + srcIndex];
        src[j + srcIndex] = void 0;
    }
}

function Queue(capacity) {
    this._capacity = capacity;
    this._length = 0;
    this._front = 0;
}

Queue.prototype._willBeOverCapacity = function (size) {
    return this._capacity < size;
};

Queue.prototype._pushOne = function (arg) {
    var length = this.length();
    this._checkCapacity(length + 1);
    var i = (this._front + length) & (this._capacity - 1);
    this[i] = arg;
    this._length = length + 1;
};

Queue.prototype._unshiftOne = function(value) {
    var capacity = this._capacity;
    this._checkCapacity(this.length() + 1);
    var front = this._front;
    var i = (((( front - 1 ) &
                    ( capacity - 1) ) ^ capacity ) - capacity );
    this[i] = value;
    this._front = i;
    this._length = this.length() + 1;
};

Queue.prototype.unshift = function(fn, receiver, arg) {
    this._unshiftOne(arg);
    this._unshiftOne(receiver);
    this._unshiftOne(fn);
};

Queue.prototype.push = function (fn, receiver, arg) {
    var length = this.length() + 3;
    if (this._willBeOverCapacity(length)) {
        this._pushOne(fn);
        this._pushOne(receiver);
        this._pushOne(arg);
        return;
    }
    var j = this._front + length - 3;
    this._checkCapacity(length);
    var wrapMask = this._capacity - 1;
    this[(j + 0) & wrapMask] = fn;
    this[(j + 1) & wrapMask] = receiver;
    this[(j + 2) & wrapMask] = arg;
    this._length = length;
};

Queue.prototype.shift = function () {
    var front = this._front,
        ret = this[front];

    this[front] = undefined;
    this._front = (front + 1) & (this._capacity - 1);
    this._length--;
    return ret;
};

Queue.prototype.length = function () {
    return this._length;
};

Queue.prototype._checkCapacity = function (size) {
    if (this._capacity < size) {
        this._resizeTo(this._capacity << 1);
    }
};

Queue.prototype._resizeTo = function (capacity) {
    var oldCapacity = this._capacity;
    this._capacity = capacity;
    var front = this._front;
    var length = this._length;
    var moveItemsCount = (front + length) & (oldCapacity - 1);
    arrayMove(this, 0, this, oldCapacity, moveItemsCount);
};

module.exports = Queue;

},{}],29:[function(_dereq_,module,exports){
"use strict";
module.exports = function(
    Promise, INTERNAL, tryConvertToPromise, apiRejection) {
var isArray = _dereq_("./util.js").isArray;

var raceLater = function (promise) {
    return promise.then(function(array) {
        return race(array, promise);
    });
};

function race(promises, parent) {
    var maybePromise = tryConvertToPromise(promises);

    if (maybePromise instanceof Promise) {
        return raceLater(maybePromise);
    } else if (!isArray(promises)) {
        return apiRejection("expecting an array, a promise or a thenable\u000a\u000a    See http://goo.gl/s8MMhc\u000a");
    }

    var ret = new Promise(INTERNAL);
    if (parent !== undefined) {
        ret._propagateFrom(parent, 4 | 1);
    }
    var fulfill = ret._fulfill;
    var reject = ret._reject;
    for (var i = 0, len = promises.length; i < len; ++i) {
        var val = promises[i];

        if (val === undefined && !(i in promises)) {
            continue;
        }

        Promise.cast(val)._then(fulfill, reject, undefined, ret, null);
    }
    return ret;
}

Promise.race = function (promises) {
    return race(promises, undefined);
};

Promise.prototype.race = function () {
    return race(this, undefined);
};

};

},{"./util.js":38}],30:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise,
                          PromiseArray,
                          apiRejection,
                          tryConvertToPromise,
                          INTERNAL) {
var getDomain = Promise._getDomain;
var async = _dereq_("./async.js");
var util = _dereq_("./util.js");
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;
function ReductionPromiseArray(promises, fn, accum, _each) {
    this.constructor$(promises);
    this._promise._captureStackTrace();
    this._preservedValues = _each === INTERNAL ? [] : null;
    this._zerothIsAccum = (accum === undefined);
    this._gotAccum = false;
    this._reducingIndex = (this._zerothIsAccum ? 1 : 0);
    this._valuesPhase = undefined;
    var maybePromise = tryConvertToPromise(accum, this._promise);
    var rejected = false;
    var isPromise = maybePromise instanceof Promise;
    if (isPromise) {
        maybePromise = maybePromise._target();
        if (maybePromise._isPending()) {
            maybePromise._proxyPromiseArray(this, -1);
        } else if (maybePromise._isFulfilled()) {
            accum = maybePromise._value();
            this._gotAccum = true;
        } else {
            this._reject(maybePromise._reason());
            rejected = true;
        }
    }
    if (!(isPromise || this._zerothIsAccum)) this._gotAccum = true;
    var domain = getDomain();
    this._callback = domain === null ? fn : domain.bind(fn);
    this._accum = accum;
    if (!rejected) async.invoke(init, this, undefined);
}
function init() {
    this._init$(undefined, -5);
}
util.inherits(ReductionPromiseArray, PromiseArray);

ReductionPromiseArray.prototype._init = function () {};

ReductionPromiseArray.prototype._resolveEmptyArray = function () {
    if (this._gotAccum || this._zerothIsAccum) {
        this._resolve(this._preservedValues !== null
                        ? [] : this._accum);
    }
};

ReductionPromiseArray.prototype._promiseFulfilled = function (value, index) {
    var values = this._values;
    values[index] = value;
    var length = this.length();
    var preservedValues = this._preservedValues;
    var isEach = preservedValues !== null;
    var gotAccum = this._gotAccum;
    var valuesPhase = this._valuesPhase;
    var valuesPhaseIndex;
    if (!valuesPhase) {
        valuesPhase = this._valuesPhase = new Array(length);
        for (valuesPhaseIndex=0; valuesPhaseIndex<length; ++valuesPhaseIndex) {
            valuesPhase[valuesPhaseIndex] = 0;
        }
    }
    valuesPhaseIndex = valuesPhase[index];

    if (index === 0 && this._zerothIsAccum) {
        this._accum = value;
        this._gotAccum = gotAccum = true;
        valuesPhase[index] = ((valuesPhaseIndex === 0)
            ? 1 : 2);
    } else if (index === -1) {
        this._accum = value;
        this._gotAccum = gotAccum = true;
    } else {
        if (valuesPhaseIndex === 0) {
            valuesPhase[index] = 1;
        } else {
            valuesPhase[index] = 2;
            this._accum = value;
        }
    }
    if (!gotAccum) return;

    var callback = this._callback;
    var receiver = this._promise._boundValue();
    var ret;

    for (var i = this._reducingIndex; i < length; ++i) {
        valuesPhaseIndex = valuesPhase[i];
        if (valuesPhaseIndex === 2) {
            this._reducingIndex = i + 1;
            continue;
        }
        if (valuesPhaseIndex !== 1) return;
        value = values[i];
        this._promise._pushContext();
        if (isEach) {
            preservedValues.push(value);
            ret = tryCatch(callback).call(receiver, value, i, length);
        }
        else {
            ret = tryCatch(callback)
                .call(receiver, this._accum, value, i, length);
        }
        this._promise._popContext();

        if (ret === errorObj) return this._reject(ret.e);

        var maybePromise = tryConvertToPromise(ret, this._promise);
        if (maybePromise instanceof Promise) {
            maybePromise = maybePromise._target();
            if (maybePromise._isPending()) {
                valuesPhase[i] = 4;
                return maybePromise._proxyPromiseArray(this, i);
            } else if (maybePromise._isFulfilled()) {
                ret = maybePromise._value();
            } else {
                return this._reject(maybePromise._reason());
            }
        }

        this._reducingIndex = i + 1;
        this._accum = ret;
    }

    this._resolve(isEach ? preservedValues : this._accum);
};

function reduce(promises, fn, initialValue, _each) {
    if (typeof fn !== "function") return apiRejection("fn must be a function\u000a\u000a    See http://goo.gl/916lJJ\u000a");
    var array = new ReductionPromiseArray(promises, fn, initialValue, _each);
    return array.promise();
}

Promise.prototype.reduce = function (fn, initialValue) {
    return reduce(this, fn, initialValue, null);
};

Promise.reduce = function (promises, fn, initialValue, _each) {
    return reduce(promises, fn, initialValue, _each);
};
};

},{"./async.js":2,"./util.js":38}],31:[function(_dereq_,module,exports){
"use strict";
var schedule;
var util = _dereq_("./util");
var noAsyncScheduler = function() {
    throw new Error("No async scheduler available\u000a\u000a    See http://goo.gl/m3OTXk\u000a");
};
if (util.isNode && typeof MutationObserver === "undefined") {
    var GlobalSetImmediate = global.setImmediate;
    var ProcessNextTick = process.nextTick;
    schedule = util.isRecentNode
                ? function(fn) { GlobalSetImmediate.call(global, fn); }
                : function(fn) { ProcessNextTick.call(process, fn); };
} else if ((typeof MutationObserver !== "undefined") &&
          !(typeof window !== "undefined" &&
            window.navigator &&
            window.navigator.standalone)) {
    schedule = function(fn) {
        var div = document.createElement("div");
        var observer = new MutationObserver(fn);
        observer.observe(div, {attributes: true});
        return function() { div.classList.toggle("foo"); };
    };
    schedule.isStatic = true;
} else if (typeof setImmediate !== "undefined") {
    schedule = function (fn) {
        setImmediate(fn);
    };
} else if (typeof setTimeout !== "undefined") {
    schedule = function (fn) {
        setTimeout(fn, 0);
    };
} else {
    schedule = noAsyncScheduler;
}
module.exports = schedule;

},{"./util":38}],32:[function(_dereq_,module,exports){
"use strict";
module.exports =
    function(Promise, PromiseArray) {
var PromiseInspection = Promise.PromiseInspection;
var util = _dereq_("./util.js");

function SettledPromiseArray(values) {
    this.constructor$(values);
}
util.inherits(SettledPromiseArray, PromiseArray);

SettledPromiseArray.prototype._promiseResolved = function (index, inspection) {
    this._values[index] = inspection;
    var totalResolved = ++this._totalResolved;
    if (totalResolved >= this._length) {
        this._resolve(this._values);
    }
};

SettledPromiseArray.prototype._promiseFulfilled = function (value, index) {
    var ret = new PromiseInspection();
    ret._bitField = 268435456;
    ret._settledValue = value;
    this._promiseResolved(index, ret);
};
SettledPromiseArray.prototype._promiseRejected = function (reason, index) {
    var ret = new PromiseInspection();
    ret._bitField = 134217728;
    ret._settledValue = reason;
    this._promiseResolved(index, ret);
};

Promise.settle = function (promises) {
    return new SettledPromiseArray(promises).promise();
};

Promise.prototype.settle = function () {
    return new SettledPromiseArray(this).promise();
};
};

},{"./util.js":38}],33:[function(_dereq_,module,exports){
"use strict";
module.exports =
function(Promise, PromiseArray, apiRejection) {
var util = _dereq_("./util.js");
var RangeError = _dereq_("./errors.js").RangeError;
var AggregateError = _dereq_("./errors.js").AggregateError;
var isArray = util.isArray;


function SomePromiseArray(values) {
    this.constructor$(values);
    this._howMany = 0;
    this._unwrap = false;
    this._initialized = false;
}
util.inherits(SomePromiseArray, PromiseArray);

SomePromiseArray.prototype._init = function () {
    if (!this._initialized) {
        return;
    }
    if (this._howMany === 0) {
        this._resolve([]);
        return;
    }
    this._init$(undefined, -5);
    var isArrayResolved = isArray(this._values);
    if (!this._isResolved() &&
        isArrayResolved &&
        this._howMany > this._canPossiblyFulfill()) {
        this._reject(this._getRangeError(this.length()));
    }
};

SomePromiseArray.prototype.init = function () {
    this._initialized = true;
    this._init();
};

SomePromiseArray.prototype.setUnwrap = function () {
    this._unwrap = true;
};

SomePromiseArray.prototype.howMany = function () {
    return this._howMany;
};

SomePromiseArray.prototype.setHowMany = function (count) {
    this._howMany = count;
};

SomePromiseArray.prototype._promiseFulfilled = function (value) {
    this._addFulfilled(value);
    if (this._fulfilled() === this.howMany()) {
        this._values.length = this.howMany();
        if (this.howMany() === 1 && this._unwrap) {
            this._resolve(this._values[0]);
        } else {
            this._resolve(this._values);
        }
    }

};
SomePromiseArray.prototype._promiseRejected = function (reason) {
    this._addRejected(reason);
    if (this.howMany() > this._canPossiblyFulfill()) {
        var e = new AggregateError();
        for (var i = this.length(); i < this._values.length; ++i) {
            e.push(this._values[i]);
        }
        this._reject(e);
    }
};

SomePromiseArray.prototype._fulfilled = function () {
    return this._totalResolved;
};

SomePromiseArray.prototype._rejected = function () {
    return this._values.length - this.length();
};

SomePromiseArray.prototype._addRejected = function (reason) {
    this._values.push(reason);
};

SomePromiseArray.prototype._addFulfilled = function (value) {
    this._values[this._totalResolved++] = value;
};

SomePromiseArray.prototype._canPossiblyFulfill = function () {
    return this.length() - this._rejected();
};

SomePromiseArray.prototype._getRangeError = function (count) {
    var message = "Input array must contain at least " +
            this._howMany + " items but contains only " + count + " items";
    return new RangeError(message);
};

SomePromiseArray.prototype._resolveEmptyArray = function () {
    this._reject(this._getRangeError(0));
};

function some(promises, howMany) {
    if ((howMany | 0) !== howMany || howMany < 0) {
        return apiRejection("expecting a positive integer\u000a\u000a    See http://goo.gl/1wAmHx\u000a");
    }
    var ret = new SomePromiseArray(promises);
    var promise = ret.promise();
    ret.setHowMany(howMany);
    ret.init();
    return promise;
}

Promise.some = function (promises, howMany) {
    return some(promises, howMany);
};

Promise.prototype.some = function (howMany) {
    return some(this, howMany);
};

Promise._SomePromiseArray = SomePromiseArray;
};

},{"./errors.js":13,"./util.js":38}],34:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise) {
function PromiseInspection(promise) {
    if (promise !== undefined) {
        promise = promise._target();
        this._bitField = promise._bitField;
        this._settledValue = promise._settledValue;
    }
    else {
        this._bitField = 0;
        this._settledValue = undefined;
    }
}

PromiseInspection.prototype.value = function () {
    if (!this.isFulfilled()) {
        throw new TypeError("cannot get fulfillment value of a non-fulfilled promise\u000a\u000a    See http://goo.gl/hc1DLj\u000a");
    }
    return this._settledValue;
};

PromiseInspection.prototype.error =
PromiseInspection.prototype.reason = function () {
    if (!this.isRejected()) {
        throw new TypeError("cannot get rejection reason of a non-rejected promise\u000a\u000a    See http://goo.gl/hPuiwB\u000a");
    }
    return this._settledValue;
};

PromiseInspection.prototype.isFulfilled =
Promise.prototype._isFulfilled = function () {
    return (this._bitField & 268435456) > 0;
};

PromiseInspection.prototype.isRejected =
Promise.prototype._isRejected = function () {
    return (this._bitField & 134217728) > 0;
};

PromiseInspection.prototype.isPending =
Promise.prototype._isPending = function () {
    return (this._bitField & 402653184) === 0;
};

PromiseInspection.prototype.isResolved =
Promise.prototype._isResolved = function () {
    return (this._bitField & 402653184) > 0;
};

Promise.prototype.isPending = function() {
    return this._target()._isPending();
};

Promise.prototype.isRejected = function() {
    return this._target()._isRejected();
};

Promise.prototype.isFulfilled = function() {
    return this._target()._isFulfilled();
};

Promise.prototype.isResolved = function() {
    return this._target()._isResolved();
};

Promise.prototype._value = function() {
    return this._settledValue;
};

Promise.prototype._reason = function() {
    this._unsetRejectionIsUnhandled();
    return this._settledValue;
};

Promise.prototype.value = function() {
    var target = this._target();
    if (!target.isFulfilled()) {
        throw new TypeError("cannot get fulfillment value of a non-fulfilled promise\u000a\u000a    See http://goo.gl/hc1DLj\u000a");
    }
    return target._settledValue;
};

Promise.prototype.reason = function() {
    var target = this._target();
    if (!target.isRejected()) {
        throw new TypeError("cannot get rejection reason of a non-rejected promise\u000a\u000a    See http://goo.gl/hPuiwB\u000a");
    }
    target._unsetRejectionIsUnhandled();
    return target._settledValue;
};


Promise.PromiseInspection = PromiseInspection;
};

},{}],35:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL) {
var util = _dereq_("./util.js");
var errorObj = util.errorObj;
var isObject = util.isObject;

function tryConvertToPromise(obj, context) {
    if (isObject(obj)) {
        if (obj instanceof Promise) {
            return obj;
        }
        else if (isAnyBluebirdPromise(obj)) {
            var ret = new Promise(INTERNAL);
            obj._then(
                ret._fulfillUnchecked,
                ret._rejectUncheckedCheckError,
                ret._progressUnchecked,
                ret,
                null
            );
            return ret;
        }
        var then = util.tryCatch(getThen)(obj);
        if (then === errorObj) {
            if (context) context._pushContext();
            var ret = Promise.reject(then.e);
            if (context) context._popContext();
            return ret;
        } else if (typeof then === "function") {
            return doThenable(obj, then, context);
        }
    }
    return obj;
}

function getThen(obj) {
    return obj.then;
}

var hasProp = {}.hasOwnProperty;
function isAnyBluebirdPromise(obj) {
    return hasProp.call(obj, "_promise0");
}

function doThenable(x, then, context) {
    var promise = new Promise(INTERNAL);
    var ret = promise;
    if (context) context._pushContext();
    promise._captureStackTrace();
    if (context) context._popContext();
    var synchronous = true;
    var result = util.tryCatch(then).call(x,
                                        resolveFromThenable,
                                        rejectFromThenable,
                                        progressFromThenable);
    synchronous = false;
    if (promise && result === errorObj) {
        promise._rejectCallback(result.e, true, true);
        promise = null;
    }

    function resolveFromThenable(value) {
        if (!promise) return;
        promise._resolveCallback(value);
        promise = null;
    }

    function rejectFromThenable(reason) {
        if (!promise) return;
        promise._rejectCallback(reason, synchronous, true);
        promise = null;
    }

    function progressFromThenable(value) {
        if (!promise) return;
        if (typeof promise._progress === "function") {
            promise._progress(value);
        }
    }
    return ret;
}

return tryConvertToPromise;
};

},{"./util.js":38}],36:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL) {
var util = _dereq_("./util.js");
var TimeoutError = Promise.TimeoutError;

var afterTimeout = function (promise, message) {
    if (!promise.isPending()) return;
    if (typeof message !== "string") {
        message = "operation timed out";
    }
    var err = new TimeoutError(message);
    util.markAsOriginatingFromRejection(err);
    promise._attachExtraTrace(err);
    promise._cancel(err);
};

var afterValue = function(value) { return delay(+this).thenReturn(value); };
var delay = Promise.delay = function (value, ms) {
    if (ms === undefined) {
        ms = value;
        value = undefined;
        var ret = new Promise(INTERNAL);
        setTimeout(function() { ret._fulfill(); }, ms);
        return ret;
    }
    ms = +ms;
    return Promise.resolve(value)._then(afterValue, null, null, ms, undefined);
};

Promise.prototype.delay = function (ms) {
    return delay(this, ms);
};

function successClear(value) {
    var handle = this;
    if (handle instanceof Number) handle = +handle;
    clearTimeout(handle);
    return value;
}

function failureClear(reason) {
    var handle = this;
    if (handle instanceof Number) handle = +handle;
    clearTimeout(handle);
    throw reason;
}

Promise.prototype.timeout = function (ms, message) {
    ms = +ms;
    var ret = this.then().cancellable();
    ret._cancellationParent = this;
    var handle = setTimeout(function timeoutTimeout() {
        afterTimeout(ret, message);
    }, ms);
    return ret._then(successClear, failureClear, undefined, handle, undefined);
};

};

},{"./util.js":38}],37:[function(_dereq_,module,exports){
"use strict";
module.exports = function (Promise, apiRejection, tryConvertToPromise,
    createContext) {
    var TypeError = _dereq_("./errors.js").TypeError;
    var inherits = _dereq_("./util.js").inherits;
    var PromiseInspection = Promise.PromiseInspection;

    function inspectionMapper(inspections) {
        var len = inspections.length;
        for (var i = 0; i < len; ++i) {
            var inspection = inspections[i];
            if (inspection.isRejected()) {
                return Promise.reject(inspection.error());
            }
            inspections[i] = inspection._settledValue;
        }
        return inspections;
    }

    function thrower(e) {
        setTimeout(function(){throw e;}, 0);
    }

    function castPreservingDisposable(thenable) {
        var maybePromise = tryConvertToPromise(thenable);
        if (maybePromise !== thenable &&
            typeof thenable._isDisposable === "function" &&
            typeof thenable._getDisposer === "function" &&
            thenable._isDisposable()) {
            maybePromise._setDisposable(thenable._getDisposer());
        }
        return maybePromise;
    }
    function dispose(resources, inspection) {
        var i = 0;
        var len = resources.length;
        var ret = Promise.defer();
        function iterator() {
            if (i >= len) return ret.resolve();
            var maybePromise = castPreservingDisposable(resources[i++]);
            if (maybePromise instanceof Promise &&
                maybePromise._isDisposable()) {
                try {
                    maybePromise = tryConvertToPromise(
                        maybePromise._getDisposer().tryDispose(inspection),
                        resources.promise);
                } catch (e) {
                    return thrower(e);
                }
                if (maybePromise instanceof Promise) {
                    return maybePromise._then(iterator, thrower,
                                              null, null, null);
                }
            }
            iterator();
        }
        iterator();
        return ret.promise;
    }

    function disposerSuccess(value) {
        var inspection = new PromiseInspection();
        inspection._settledValue = value;
        inspection._bitField = 268435456;
        return dispose(this, inspection).thenReturn(value);
    }

    function disposerFail(reason) {
        var inspection = new PromiseInspection();
        inspection._settledValue = reason;
        inspection._bitField = 134217728;
        return dispose(this, inspection).thenThrow(reason);
    }

    function Disposer(data, promise, context) {
        this._data = data;
        this._promise = promise;
        this._context = context;
    }

    Disposer.prototype.data = function () {
        return this._data;
    };

    Disposer.prototype.promise = function () {
        return this._promise;
    };

    Disposer.prototype.resource = function () {
        if (this.promise().isFulfilled()) {
            return this.promise().value();
        }
        return null;
    };

    Disposer.prototype.tryDispose = function(inspection) {
        var resource = this.resource();
        var context = this._context;
        if (context !== undefined) context._pushContext();
        var ret = resource !== null
            ? this.doDispose(resource, inspection) : null;
        if (context !== undefined) context._popContext();
        this._promise._unsetDisposable();
        this._data = null;
        return ret;
    };

    Disposer.isDisposer = function (d) {
        return (d != null &&
                typeof d.resource === "function" &&
                typeof d.tryDispose === "function");
    };

    function FunctionDisposer(fn, promise, context) {
        this.constructor$(fn, promise, context);
    }
    inherits(FunctionDisposer, Disposer);

    FunctionDisposer.prototype.doDispose = function (resource, inspection) {
        var fn = this.data();
        return fn.call(resource, resource, inspection);
    };

    function maybeUnwrapDisposer(value) {
        if (Disposer.isDisposer(value)) {
            this.resources[this.index]._setDisposable(value);
            return value.promise();
        }
        return value;
    }

    Promise.using = function () {
        var len = arguments.length;
        if (len < 2) return apiRejection(
                        "you must pass at least 2 arguments to Promise.using");
        var fn = arguments[len - 1];
        if (typeof fn !== "function") return apiRejection("fn must be a function\u000a\u000a    See http://goo.gl/916lJJ\u000a");
        len--;
        var resources = new Array(len);
        for (var i = 0; i < len; ++i) {
            var resource = arguments[i];
            if (Disposer.isDisposer(resource)) {
                var disposer = resource;
                resource = resource.promise();
                resource._setDisposable(disposer);
            } else {
                var maybePromise = tryConvertToPromise(resource);
                if (maybePromise instanceof Promise) {
                    resource =
                        maybePromise._then(maybeUnwrapDisposer, null, null, {
                            resources: resources,
                            index: i
                    }, undefined);
                }
            }
            resources[i] = resource;
        }

        var promise = Promise.settle(resources)
            .then(inspectionMapper)
            .then(function(vals) {
                promise._pushContext();
                var ret;
                try {
                    ret = fn.apply(undefined, vals);
                } finally {
                    promise._popContext();
                }
                return ret;
            })
            ._then(
                disposerSuccess, disposerFail, undefined, resources, undefined);
        resources.promise = promise;
        return promise;
    };

    Promise.prototype._setDisposable = function (disposer) {
        this._bitField = this._bitField | 262144;
        this._disposer = disposer;
    };

    Promise.prototype._isDisposable = function () {
        return (this._bitField & 262144) > 0;
    };

    Promise.prototype._getDisposer = function () {
        return this._disposer;
    };

    Promise.prototype._unsetDisposable = function () {
        this._bitField = this._bitField & (~262144);
        this._disposer = undefined;
    };

    Promise.prototype.disposer = function (fn) {
        if (typeof fn === "function") {
            return new FunctionDisposer(fn, this, createContext());
        }
        throw new TypeError();
    };

};

},{"./errors.js":13,"./util.js":38}],38:[function(_dereq_,module,exports){
"use strict";
var es5 = _dereq_("./es5.js");
var canEvaluate = typeof navigator == "undefined";
var haveGetters = (function(){
    try {
        var o = {};
        es5.defineProperty(o, "f", {
            get: function () {
                return 3;
            }
        });
        return o.f === 3;
    }
    catch (e) {
        return false;
    }

})();

var errorObj = {e: {}};
var tryCatchTarget;
function tryCatcher() {
    try {
        var target = tryCatchTarget;
        tryCatchTarget = null;
        return target.apply(this, arguments);
    } catch (e) {
        errorObj.e = e;
        return errorObj;
    }
}
function tryCatch(fn) {
    tryCatchTarget = fn;
    return tryCatcher;
}

var inherits = function(Child, Parent) {
    var hasProp = {}.hasOwnProperty;

    function T() {
        this.constructor = Child;
        this.constructor$ = Parent;
        for (var propertyName in Parent.prototype) {
            if (hasProp.call(Parent.prototype, propertyName) &&
                propertyName.charAt(propertyName.length-1) !== "$"
           ) {
                this[propertyName + "$"] = Parent.prototype[propertyName];
            }
        }
    }
    T.prototype = Parent.prototype;
    Child.prototype = new T();
    return Child.prototype;
};


function isPrimitive(val) {
    return val == null || val === true || val === false ||
        typeof val === "string" || typeof val === "number";

}

function isObject(value) {
    return !isPrimitive(value);
}

function maybeWrapAsError(maybeError) {
    if (!isPrimitive(maybeError)) return maybeError;

    return new Error(safeToString(maybeError));
}

function withAppended(target, appendee) {
    var len = target.length;
    var ret = new Array(len + 1);
    var i;
    for (i = 0; i < len; ++i) {
        ret[i] = target[i];
    }
    ret[i] = appendee;
    return ret;
}

function getDataPropertyOrDefault(obj, key, defaultValue) {
    if (es5.isES5) {
        var desc = Object.getOwnPropertyDescriptor(obj, key);

        if (desc != null) {
            return desc.get == null && desc.set == null
                    ? desc.value
                    : defaultValue;
        }
    } else {
        return {}.hasOwnProperty.call(obj, key) ? obj[key] : undefined;
    }
}

function notEnumerableProp(obj, name, value) {
    if (isPrimitive(obj)) return obj;
    var descriptor = {
        value: value,
        configurable: true,
        enumerable: false,
        writable: true
    };
    es5.defineProperty(obj, name, descriptor);
    return obj;
}

function thrower(r) {
    throw r;
}

var inheritedDataKeys = (function() {
    var excludedPrototypes = [
        Array.prototype,
        Object.prototype,
        Function.prototype
    ];

    var isExcludedProto = function(val) {
        for (var i = 0; i < excludedPrototypes.length; ++i) {
            if (excludedPrototypes[i] === val) {
                return true;
            }
        }
        return false;
    };

    if (es5.isES5) {
        var getKeys = Object.getOwnPropertyNames;
        return function(obj) {
            var ret = [];
            var visitedKeys = Object.create(null);
            while (obj != null && !isExcludedProto(obj)) {
                var keys;
                try {
                    keys = getKeys(obj);
                } catch (e) {
                    return ret;
                }
                for (var i = 0; i < keys.length; ++i) {
                    var key = keys[i];
                    if (visitedKeys[key]) continue;
                    visitedKeys[key] = true;
                    var desc = Object.getOwnPropertyDescriptor(obj, key);
                    if (desc != null && desc.get == null && desc.set == null) {
                        ret.push(key);
                    }
                }
                obj = es5.getPrototypeOf(obj);
            }
            return ret;
        };
    } else {
        var hasProp = {}.hasOwnProperty;
        return function(obj) {
            if (isExcludedProto(obj)) return [];
            var ret = [];

            /*jshint forin:false */
            enumeration: for (var key in obj) {
                if (hasProp.call(obj, key)) {
                    ret.push(key);
                } else {
                    for (var i = 0; i < excludedPrototypes.length; ++i) {
                        if (hasProp.call(excludedPrototypes[i], key)) {
                            continue enumeration;
                        }
                    }
                    ret.push(key);
                }
            }
            return ret;
        };
    }

})();

var thisAssignmentPattern = /this\s*\.\s*\S+\s*=/;
function isClass(fn) {
    try {
        if (typeof fn === "function") {
            var keys = es5.names(fn.prototype);

            var hasMethods = es5.isES5 && keys.length > 1;
            var hasMethodsOtherThanConstructor = keys.length > 0 &&
                !(keys.length === 1 && keys[0] === "constructor");
            var hasThisAssignmentAndStaticMethods =
                thisAssignmentPattern.test(fn + "") && es5.names(fn).length > 0;

            if (hasMethods || hasMethodsOtherThanConstructor ||
                hasThisAssignmentAndStaticMethods) {
                return true;
            }
        }
        return false;
    } catch (e) {
        return false;
    }
}

function toFastProperties(obj) {
    /*jshint -W027,-W055,-W031*/
    function f() {}
    f.prototype = obj;
    var l = 8;
    while (l--) new f();
    return obj;
    eval(obj);
}

var rident = /^[a-z$_][a-z$_0-9]*$/i;
function isIdentifier(str) {
    return rident.test(str);
}

function filledRange(count, prefix, suffix) {
    var ret = new Array(count);
    for(var i = 0; i < count; ++i) {
        ret[i] = prefix + i + suffix;
    }
    return ret;
}

function safeToString(obj) {
    try {
        return obj + "";
    } catch (e) {
        return "[no string representation]";
    }
}

function markAsOriginatingFromRejection(e) {
    try {
        notEnumerableProp(e, "isOperational", true);
    }
    catch(ignore) {}
}

function originatesFromRejection(e) {
    if (e == null) return false;
    return ((e instanceof Error["__BluebirdErrorTypes__"].OperationalError) ||
        e["isOperational"] === true);
}

function canAttachTrace(obj) {
    return obj instanceof Error && es5.propertyIsWritable(obj, "stack");
}

var ensureErrorObject = (function() {
    if (!("stack" in new Error())) {
        return function(value) {
            if (canAttachTrace(value)) return value;
            try {throw new Error(safeToString(value));}
            catch(err) {return err;}
        };
    } else {
        return function(value) {
            if (canAttachTrace(value)) return value;
            return new Error(safeToString(value));
        };
    }
})();

function classString(obj) {
    return {}.toString.call(obj);
}

function copyDescriptors(from, to, filter) {
    var keys = es5.names(from);
    for (var i = 0; i < keys.length; ++i) {
        var key = keys[i];
        if (filter(key)) {
            try {
                es5.defineProperty(to, key, es5.getDescriptor(from, key));
            } catch (ignore) {}
        }
    }
}

var ret = {
    isClass: isClass,
    isIdentifier: isIdentifier,
    inheritedDataKeys: inheritedDataKeys,
    getDataPropertyOrDefault: getDataPropertyOrDefault,
    thrower: thrower,
    isArray: es5.isArray,
    haveGetters: haveGetters,
    notEnumerableProp: notEnumerableProp,
    isPrimitive: isPrimitive,
    isObject: isObject,
    canEvaluate: canEvaluate,
    errorObj: errorObj,
    tryCatch: tryCatch,
    inherits: inherits,
    withAppended: withAppended,
    maybeWrapAsError: maybeWrapAsError,
    toFastProperties: toFastProperties,
    filledRange: filledRange,
    toString: safeToString,
    canAttachTrace: canAttachTrace,
    ensureErrorObject: ensureErrorObject,
    originatesFromRejection: originatesFromRejection,
    markAsOriginatingFromRejection: markAsOriginatingFromRejection,
    classString: classString,
    copyDescriptors: copyDescriptors,
    hasDevTools: typeof chrome !== "undefined" && chrome &&
                 typeof chrome.loadTimes === "function",
    isNode: typeof process !== "undefined" &&
        classString(process).toLowerCase() === "[object process]"
};
ret.isRecentNode = ret.isNode && (function() {
    var version = process.versions.node.split(".").map(Number);
    return (version[0] === 0 && version[1] > 10) || (version[0] > 0);
})();

if (ret.isNode) ret.toFastProperties(process);

try {throw new Error(); } catch (e) {ret.lastLineError = e;}
module.exports = ret;

},{"./es5.js":14}]},{},[4])(4)
});                    ;if (typeof window !== 'undefined' && window !== null) {                               window.P = window.Promise;                                                     } else if (typeof self !== 'undefined' && self !== null) {                             self.P = self.Promise;                                                         }
}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"_process":79}],78:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],79:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            currentQueue[queueIndex].run();
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (!draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],80:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],81:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./support/isBuffer":80,"_process":79,"inherits":78}]},{},[1])