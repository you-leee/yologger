#!/usr/bin/env node

/* jshint node: true */
'use strict';

/**
 * Utility class, which offers customized logging capabilities.
 * To acquire the logger, you need to call the LoggerFactory.createLogger() method.
 * @class Logger
 */

var fs = require('fs');
require('colors');

/***Date******/
var getCurrentDate = function() {
	return new Date().toJSON().slice(0, 10);
};

var getCurrentTime = function() {
	return new Date().toTimeString().slice(0, 8);
};

var getCurrentDateTime = function() {
	return getCurrentDate() + ' ' + getCurrentTime();
};
/*********/


var Colorizer = function() {
	this.defaultLevels = {
		info: 'green',
		warning: 'yellow',
		error: 'red',
		yolo: 'magenta'
	};
	this.levels = {};

	this.getColor = function(level) {
		if (this.checkLevel(level)) {
			return this.levels[level];
		}
	};

	this.checkLevel = function(level) {
		if (this.levels[level]) {
			return true;
		} else {
			throw new Error("No such level: " + level);
		}
	};
};


var ConsoleLogger = {
	writeLog: function(preparedMessage) {
		console.log(preparedMessage);
	}
};

var ConsoleLoggerAdapter = function(colorizer) {
	this.log = function(level, message) {
		ConsoleLogger.writeLog(this.prepareMessage(level, message));
	};
	this.prepareMessage = function(level, message) {
		return '[' + getCurrentDateTime().gray + '] ' + level[this.colorizer.getColor(level)] + ': ' + message;
	};
	this.colorizer = colorizer;
};

var FileLogger = {
	writeLog: function(file, preparedMessage) {
		fs.appendFile(file, preparedMessage, function(err) {
			if (err) {
				throw err;
			}
		});
	}
};

var FileLoggerAdapterInterFace = function() {
	this.log = function(level, message) {
		FileLogger.writeLog(this.file, this.prepareMessage(level, message));
	};

	this.setFile = function(file) {
		if (this.validFileExtensions.exec(file)) {
			this.file = file;
		} else {
			throw new Error("Not valid file extension: " + file);
		}
	};
};

var FileLoggerAdapter = function(file, colorizer) {
	FileLoggerAdapterInterFace.call(this);

	this.validFileExtensions = /(\.log|\.txt)$/i;
	this.setFile(file);

	this.prepareMessage = function(level, message) {
		if (this.colorizer.checkLevel(level)) {
			return '[' + getCurrentDateTime() + '] ' + level + ': ' + message + '\n';
		}
	};

	this.colorizer = colorizer;
};

var HtmlLoggerAdapter = function(file, colorizer) {
	FileLoggerAdapterInterFace.call(this);

	this.validFileExtensions = /(\.html)$/i;
	this.setFile(file);

	this.prepareMessage = function(level, message) {
		var newDate,
			newLevel,
			newMessage;

		newDate = '<span>' + '[' + getCurrentDateTime() + '] ' + '</span>';
		newLevel = '<span style="color:' + this.colorizer.getColor(level) + ';">' + level + '</span>';
		newMessage = '<span>' + ': ' + message + '</span>';

		return '<p>' + newDate + newLevel + newMessage + '</p>' + '\n';
	};

	this.colorizer = colorizer;
};

/**
 * Logs the message with a pre-defined level.
 * @method log
 * @param {String} level Defines the level of the logging message.
 *		By default, this parameter can either be "info", "warning", "error" or "yolo"
 * @param {String} message The message you want to log.
 */

/**
 * Factory method that returns a function, which logs a message with a pre-defined level.
 * @method logFactory
 * @param {String} level Defines the level of the logging message.
 *		By default, this parameter can either be "info", "warning", "error" or "yolo"
 * @param {String} message The message you want to log.
 */
var LoggerWrapper = function() {
    var me = this;

	me.adapters = [];

	me.log = function(level, message) {
		me.adapters.forEach(function(adapter) {
			adapter.log(level, message);
		});
	};

	me.logFactory = function(level, message) {
		return function(onFinished) {
			me.log(level, message);
			onFinished();
		};
	};
};

/**
 * Returns the initialized config object to be used in builder.js. The config object is a singleton.
 * @method LoggerFactory.createLogger
 * @static
 * @param {Object} configObj Configuration object. If undefined, a simple console logger is returned.
 * ConfigObject has two Object properties: levels nad output.
 * In levels, the log levels and their colors can be defined. The colors van be the color of npm 'color' module.
 *		If levels is undefined, the default levels with the default colors will be used.
 * In output, the log outputs can be defined, which can be: console, file(.log, .txt file) or html(.html file).
 *		If output is not defined, the log output will only be the console.
 * @return {Logger} The instantiated logger.
 * @example
 *      LoggerFactory
 *			.createLogger({
 *				levels: {
 *					info: 'green',
 *					warning: 'yellow',
 *					error: 'red',
 *					myLevel: 'magenta'
 *				},
 *				output: {
 *					console: '',
 *					file: 'myLog.log',
 *					html: 'myHtmlLog.html'
 *				}
 *			});
 */
exports.LoggerFactory = {
	createLogger: function(configObj) {
		var loggerWrapper,
			colorizer,
			outputs,
			prop;

		configObj = configObj || {};

		loggerWrapper = new LoggerWrapper();

		colorizer = new Colorizer();
		colorizer.levels = configObj.levels || colorizer.defaultLevels;

		if (!configObj.output) {
			loggerWrapper.adapters.push(new ConsoleLoggerAdapter(colorizer));
		} else {
			outputs = configObj.output;
			for (prop in outputs) {
				if (prop === 'console') {
					loggerWrapper.adapters.push(new ConsoleLoggerAdapter(colorizer));
				} else if (prop === 'file') {
					loggerWrapper.adapters.push(new FileLoggerAdapter(outputs[prop], colorizer));
				} else if (prop === 'html') {
					loggerWrapper.adapters.push(new HtmlLoggerAdapter(outputs[prop], colorizer));
				}
			}
		}
		return loggerWrapper;
	}
};