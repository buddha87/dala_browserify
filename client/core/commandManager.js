var util = require('../util/util');
var object = util.object;
var dom = util.dom;
var event = require('./event');

//Command instances for diagrams
var instances = {};

var sub = function(subId) {
    return instances[subId] = new CommandManager();
};

var exec = function(subId, cmdId, doArgs, undoArgs, preventRedo) {
    var instance = instances[subId];
    if(instance) {
        instance.exec(cmdId, doArgs, undoArgs, preventRedo);
    }
};

var CommandManager = function(subId) {
    this.subId = subId;
    this.commands = {};
    this.undoCommands = [];
    this.redoCommands = [];
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
};

CommandManager.prototype.exec = function(cmdId, doArgs, undoArgs, preventRedo) {
    var cmdInstance = this.add(cmdId, doArgs, undoArgs);
    if(cmdInstance) {
        if(!preventRedo) {
            this.undoCommands.push(cmdInstance);
        }
        cmdInstance.exec();
    }
};

CommandManager.prototype.add = function(cmdId, doArgs, undoArgs) {
    var command = this.commands[cmdId];
    if(command) {
        var cmdInstance = command.instance(doArgs,undoArgs);
        this.undoCommands.push(cmdInstance);
        return cmdInstance;
    } else {
        console.warn('Unregistered command '+cmdId+' was called.');
    }
};

CommandManager.prototype.undo = function() {
    var command = this.undoCommands.pop();
    if(object.isDefined(command) && object.isDefined(command.undo)) {
        command.undo.apply(command);
        this.redoCommands.push(command);
    }
};

CommandManager.prototype.redo = function() {
    var command = this.redoCommands.pop();
    if(object.isDefined(command) && object.isDefined(command.exec)) {
        command.exec.apply(command);
        this.undoCommands.push(command);

    }
};

module.exports = {
    sub : sub
};

