'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.Scrollbars2 = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _domCss = require('dom-css');

var _domCss2 = _interopRequireDefault(_domCss);

var _classnames = require('classnames');

var _classnames2 = _interopRequireDefault(_classnames);

var _raf = require('raf');

var _raf2 = _interopRequireDefault(_raf);

var _helpers = require('./helpers');

var _utilities = require('./utilities');

var _dataModels = require('./dataModels');

var _dataModels2 = _interopRequireDefault(_dataModels);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

/*
 *
 *  File: index_bkp.js | Package: Scrollbars2
 *
 *  Author:    Miguel Zamora Serrano <mzamoras@backlogics.com>
 *  Created:   12 Sep, 2016 | 02:35 AM
 *
 *  This file is part of a package and all the information, intellectual
 *  and technical concepts contained here are property of their owners.
 *  Any kind of use, reproduction, distribution, publication, etc. without
 *  express written permission from CapitalMental && BackLogics Technologies
 *  is strictly forbidden.
 *
 *  CapitalMental && BackLogics Technologies
 *  Copyright 2014-present. | All rights reserved.
 *
 *
 *
 */

require('classlist-polyfill');

//import React from 'react';


var RPT = _react2.default.PropTypes;

var VER = 'vertical';
var HOR = 'horizontal';
var NONE = 'none';
var BOTH = 'both';

var DOWN = 'down';
var UP = 'up';
var LEFT = 'left';
var RIGHT = 'right';

var WHEEL = 'wheel';
var SCROLL = 'scroll';
var CSS_CLASS = 'sb2-scrollbars2';
var CSS_TAG_ID = 'sb2-tag';

//Related to movements and Deltas X & Y
var ZERO = 'zero';
var OFF_LIMIT = 'off-limits';
var OFF_LIMIT_X = 'off-limits-x';
var OFF_LIMIT_Y = 'off-limits-y';
var OK = 'ok';

//Related to event add or remove listener
var ON = 'on';
var OFF = 'off';

//Window Resize Event, globally avoiding duplication among different instances
var sBarWidth = null;
var WinRes = new _utilities.utils.WindowResizer();
var defaultParsedStyle = require('to-string!css!less!./style/style.less');

var Scrollbars2 = exports.Scrollbars2 = _react2.default.createClass({

	displayName: "Scrollbars2",

	propTypes: {
		showVertical: RPT.bool,
		showHorizontal: RPT.bool,
		autoHide: RPT.bool,
		autoHideTimeout: RPT.number,
		autoHeight: RPT.bool,
		autoHeightMin: RPT.number,
		autoHeightMax: RPT.number,
		thumbMinSize: RPT.number,
		className: RPT.string,

		onScroll: RPT.func,
		onScrollStart: RPT.func,
		onScrollEnd: RPT.func,
		onScrollFrame: RPT.func,
		onUpdate: RPT.func,
		atBottom: RPT.func,
		atTop: RPT.func,
		atRight: RPT.func,
		atLeft: RPT.func,

		cssStyleClass: RPT.string,
		cssStylesheetID: RPT.string,
		flashTime: RPT.number,
		flashTimeDelay: RPT.number,

		containerStyle: RPT.object,
		viewStyle: RPT.object,
		tracksStyle: RPT.object,
		thumbsStyle: RPT.object,
		parsedStyle: RPT.string,

		preventScrolling: RPT.bool,
		updateOnUpdates: RPT.bool,
		expandTracks: RPT.bool,
		syncTracks: RPT.bool,
		hideUnnecessary: RPT.bool,
		passiveEvent: RPT.bool,
		usePerformantView: RPT.bool

	},
	getDefaultProps: function getDefaultProps() {
		return {
			showVertical: true,
			showHorizontal: false,
			autoHide: false,
			autoHideTimeout: 1000,
			autoHeight: false,
			autoHeightMin: 0,
			autoHeightMax: 200,
			thumbMinSize: 30,
			className: '',

			onScroll: _utilities.utils.noop,
			onScrollStart: _utilities.utils.noop,
			onScrollEnd: _utilities.utils.noop,
			onScrollFrame: _utilities.utils.noop,
			onUpdate: _utilities.utils.noop,
			atBottom: _utilities.utils.noop,
			atTop: _utilities.utils.noop,
			atRight: _utilities.utils.noop,
			atLeft: _utilities.utils.noop,

			cssStyleClass: CSS_CLASS,
			cssStylesheetID: CSS_TAG_ID,
			flashTime: 1500,
			flashTimeDelay: 0,

			containerStyle: {},
			viewStyle: {},
			tracksStyle: {},
			thumbsStyle: {},
			parsedStyle: null,

			preventScrolling: true,
			updateOnUpdates: true,
			expandTracks: true,
			syncTracks: false,
			hideUnnecessary: true,
			passiveEvent: false,
			usePerformantView: true
		};
	},


	/**
  * All Storable data that won't change or won't be necessary
  * to re-generate during the component's life time
  */
	setupData: function setupData() {

		this.hasInit = false;
		this.needsReCalculation = false;
		this.needsUpdateData = false;
		this.needsFlash = false;
		this.needsFlashX = false;
		this.needsFlashY = false;
		this.enable = true;

		//Data Saving Storage
		this.current = new _utilities.utils.DataStorage(_dataModels2.default.scrollInfo);
		this.previous = new _utilities.utils.DataStorage(_dataModels2.default.scrollInfo);
		this.dragging = new _utilities.utils.DataStorage(_dataModels2.default.draggingInfo);
		this.global = new _utilities.utils.DataStorage(_dataModels2.default.globalTracking);
		this.cache = new _utilities.utils.DataStorage();
		this.delivery = new _utilities.utils.DataStorage();

		/** Quick access to Refs **/
		this._c = {}; //container
		this._v = {}; // view
		this._ht = {}; // horizontal track
		this._vt = {}; // vertical track
		this._htn = {}; // horizontal thumbnail
		this._vtn = {}; // vertical thumbnail

		/** Style and Tag **/
		var _props = this.props;
		var cssStyleClass = _props.cssStyleClass;
		var cssStylesheetID = _props.cssStylesheetID;

		var isDefaultStyle = cssStyleClass === CSS_CLASS;
		this.styleTagId = isDefaultStyle ? cssStylesheetID : CSS_TAG_ID + "_" + cssStyleClass;
		this.styleClass = cssStyleClass; //isDefaultStyle ? cssStyleClass   : CSS_CLASS  + "." + cssStyleClass;

		//Object Events
		this.evt = {
			container: {},
			view: {},
			vTrack: {
				onMouseDown: this.onMouseDownVerticalTrack,
				onWheel: this.onScrollBarAndThumb,
				onMouseEnter: this.onMouseEnterTrack,
				onMouseLeave: this.onMouseLeaveTrack
			},
			hTrack: {
				onMouseDown: this.onMouseDownHorizontalTrack,
				onWheel: this.onScrollBarAndThumb,
				onMouseEnter: this.onMouseEnterTrack,
				onMouseLeave: this.onMouseLeaveTrack
			},
			vThumb: {
				onMouseDown: this.onMouseDownThumbVertical
			},
			hThumb: {
				onMouseDown: this.onMouseDownThumbHorizontal
			}
		};
		this.cssClasses = {
			container: (0, _classnames2.default)('sb2-container', this.styleClass.toLowerCase().replace(".", " "), {
				'sb2-auto-hide': this.props.autoHide,
				'sb2-auto-height': this.props.autoHeight,
				'sb2-expand-tracks': this.props.expandTracks
			}),
			view: (0, _classnames2.default)('sb2-view', {
				performant: this.props.usePerformantView
			}),
			vTrack: 'sb2-track sb2-v',
			hTrack: 'sb2-track sb2-h',
			vThumb: 'sb2-thumb sb2-v',
			hThumb: 'sb2-thumb sb2-h',
			body: 'sb2-body',
			scrolling: 'sb2-scrolling',
			dragging: 'sb2-dragging',
			autoHideOn: 'sb2-auto-hide-on',
			expanded: 'sb2-expanded'
		};
		this.cssStyles = {
			container: this.getContainerStyle(true),
			view: this.getViewStyle(true),
			vTrack: this.getTracksStyle(VER, true),
			hTrack: this.getTracksStyle(HOR, true),
			vThumb: this.getThumbsStyle(VER),
			hThumb: this.getThumbsStyle(HOR)
		};
	},
	addWindowListeners: function addWindowListeners() {
		//window.addEventListener( 'resize', this.onResize );
		WinRes.addInstance(this, this.onResize);
		this.toggleScrollEvent(SCROLL, ON);
		this.toggleScrollEvent(WHEEL, ON);
	},
	removeWindowListeners: function removeWindowListeners() {
		//window.removeEventListener( 'resize', this.onResize );
		WinRes.removeInstance(this);
		this.toggleScrollEvent(SCROLL, OFF);
		this.toggleScrollEvent(WHEEL, OFF);
	},


	/**
  * Attaches and Detaches the Scroll Event Listener
  * @type boolean
  */
	toggleScrollEvent: function toggleScrollEvent() {
		var eventName = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
		var status = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;


		if (!eventName || !status) return false;

		if (status === ON) {
			this._v.addEventListener(eventName, this.onScroll, {
				passive: this.props.passiveEvent,
				capture: true
			});
			return false;
		}
		if (status === OFF) {
			this._v.removeEventListener(eventName, this.onScroll, {
				passive: this.props.passiveEvent,
				capture: true
			});
			return false;
		}
	},
	setDataToCache: function setDataToCache() {
		if (!sBarWidth) {
			sBarWidth = (0, _helpers.getScrollbarWidth)(true);
		}

		this.cache.save({
			trackWidth: _utilities.calc.innerWidth(this._ht),
			trackHeight: _utilities.calc.innerHeight(this._vt),
			scrollbarWidth: sBarWidth
		});
	},
	doCalculations: function doCalculations() {
		var event = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
		var needsUpdateData = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

		if (event) {
			console.log(event);
		}
		if (needsUpdateData) {
			this.setDataToCache();
		}

		var _v = this._v;
		var scrollLeft = _v.scrollLeft;
		var scrollTop = _v.scrollTop;
		var scrollWidth = _v.scrollWidth;
		var scrollHeight = _v.scrollHeight;
		var clientWidth = _v.clientWidth;
		var clientHeight = _v.clientHeight;


		var maxScrollTop = scrollHeight - clientHeight;
		var maxScrollLeft = scrollWidth - clientWidth;
		var scrollbarWidth = this.cache.data.scrollbarWidth;

		var trackWidth = this.cache.data.trackWidth;
		var trackHeight = this.cache.data.trackHeight;

		//Thumbs Calculation
		var thumbHeight = _utilities.calc.thumbHeight(this._v, trackHeight, this.props.thumbMinSize);
		var thumbWidth = _utilities.calc.thumbWidth(this._v, trackWidth, this.props.thumbMinSize);
		var thumbPosY = _utilities.calc.thumbPosY(this._v, trackHeight, thumbHeight);
		var thumbPosX = _utilities.calc.thumbPosX(this._v, trackWidth, thumbWidth);

		//Position Calculation
		var atTop = scrollTop <= 0;
		var atLeft = scrollLeft <= 0;
		var atBottom = scrollTop >= maxScrollTop;
		var atRight = scrollLeft >= maxScrollLeft;

		//Size Calculations
		var widerThanClient = scrollWidth > clientWidth;
		var tallerThanClient = scrollHeight > clientHeight;

		//Scrollbars required
		var requireVertical = tallerThanClient;
		var requireHorizontal = widerThanClient;
		var requireBoth = widerThanClient && tallerThanClient;
		var requireNone = !requireVertical && !requireHorizontal;

		var data = {
			scrollLeft: scrollLeft,
			scrollTop: scrollTop,
			scrollWidth: scrollWidth,
			scrollHeight: scrollHeight,
			clientWidth: clientWidth,
			clientHeight: clientHeight,
			maxScrollTop: maxScrollTop,
			maxScrollLeft: maxScrollLeft,
			scrollbarWidth: scrollbarWidth,
			trackHeight: trackHeight,
			trackWidth: trackWidth,
			thumbHeight: thumbHeight,
			thumbWidth: thumbWidth,
			thumbPosY: thumbPosY,
			thumbPosX: thumbPosX,
			atTop: atTop,
			atLeft: atLeft,
			atBottom: atBottom,
			atRight: atRight,
			widerThanClient: widerThanClient,
			tallerThanClient: tallerThanClient,
			requireVertical: requireVertical,
			requireHorizontal: requireHorizontal,
			requireBoth: requireBoth,
			requireNone: requireNone
		};

		this.delivery.save({
			posTop: scrollTop,
			posLeft: scrollLeft,
			scrollableX: scrollWidth,
			scrollableY: scrollHeight
		}); //todo: complete the list

		this.previous.reset(this.current.data);
		this.current.save(data);
		return this.current.data;
	},


	/* - - C O N F I G  A C T I O N S - - */
	/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */

	/** *********************************************************** */
	/*    V I S U A L   U P D A T E S
  /* *********************************************************** */

	/*
  * Adjust size and position of thumbs
  */
	updateThumbs: function updateThumbs() {
		var _props2 = this.props;
		var showHorizontal = _props2.showHorizontal;
		var showVertical = _props2.showVertical;
		var _current$data = this.current.data;
		var thumbWidth = _current$data.thumbWidth;
		var thumbHeight = _current$data.thumbHeight;
		var thumbPosY = _current$data.thumbPosY;
		var thumbPosX = _current$data.thumbPosX;
		var requireHorizontal = _current$data.requireHorizontal;
		var requireVertical = _current$data.requireVertical;

		// if the user request configure to show Horizontal

		if (showHorizontal) {
			(0, _domCss2.default)(this._htn, _extends({
				width: requireHorizontal ? thumbWidth : 0
			}, requireHorizontal && {
				transform: 'translateX(' + thumbPosX + 'px)'
			}));
		}

		// if the user request configure to show Vertical
		if (showVertical) {
			(0, _domCss2.default)(this._vtn, _extends({
				height: requireVertical ? thumbHeight : 0
			}, requireVertical && {
				transform: 'translateY(' + thumbPosY + 'px)'
			}));
		}
	},


	/**
  * Shows or hides trackbar accordingly to [ showVertical | showHorizontal ] Props.
  */
	updateTracks: function updateTracks() {
		var _props3 = this.props;
		var showHorizontal = _props3.showHorizontal;
		var showVertical = _props3.showVertical;
		var hideUnnecessary = _props3.hideUnnecessary;

		var hDisplay = showHorizontal ? 'block' : 'none';
		var vDisplay = showVertical ? 'block' : 'none';

		if (hideUnnecessary) {
			var _current$data2 = this.current.data;
			var requireVertical = _current$data2.requireVertical;
			var requireHorizontal = _current$data2.requireHorizontal;

			if (!requireHorizontal) hDisplay = 'none';
			if (!requireVertical) vDisplay = 'none';
		}

		// if the user request configure to show Horizontal
		(0, _domCss2.default)(this._ht, { display: hDisplay });
		// if the user request configure to show Vertical
		(0, _domCss2.default)(this._vt, { display: vDisplay });
	},


	/**
  * Callback function to move directly the View using requestAnimationFrame as an
  * interface for such movement
  * @param object
  * @param axis
  * @param newPosition
  */
	moveViewDirectly: function moveViewDirectly(object, axis, newPosition) {
		if (axis === VER) object.scrollTop = newPosition;
		if (axis === HOR) object.scrollLeft = newPosition;
		this.update();
	},


	/**
  * Display the bars for a given time
  */
	flashBars: function flashBars() {
		var axis = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : BOTH;
		var time = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

		if (this.props.autoHide && (time || this.props.flashTime > 0)) {
			this.needsFlash = true;
			if (axis === VER || axis === BOTH) this.needsFlashY = true;
			if (axis === HOR || axis === BOTH) this.needsFlashX = true;
			this.showTracks();
			this.hideTracks(time || this.props.flashTime);
			this.needsFlash = false;
			this.needsFlashY = false;
			this.needsFlashX = false;
		}
	},


	/**
  * Manages the showing process according to "Sync" and "autoHide" Props,
  * hiding a single track o both when autoHide is enabled
  */
	showTracks: function showTracks() {
		var _props4 = this.props;
		var syncTracks = _props4.syncTracks;
		var autoHide = _props4.autoHide;
		var expandTracks = _props4.expandTracks;

		if (!autoHide && !expandTracks) return;

		if (syncTracks) {
			this.showSyncedTracks();
			return;
		}

		this.showUnSyncedTracks(VER);
		this.showUnSyncedTracks(HOR);
	},


	/**
  * Manages the showing process according to Sync = true and autoHide = true,
  */
	showSyncedTracks: function showSyncedTracks() {
		var _global$data = this.global.data;
		var mouseOverTrack = _global$data.mouseOverTrack;
		var scrolling = _global$data.scrolling;
		var dragging = _global$data.dragging;
		var _current$data3 = this.current.data;
		var requireVertical = _current$data3.requireVertical;
		var requireHorizontal = _current$data3.requireHorizontal;
		var _props5 = this.props;
		var showVertical = _props5.showVertical;
		var showHorizontal = _props5.showHorizontal;
		var expandTracks = _props5.expandTracks;
		var autoHide = _props5.autoHide;

		var needsFlash = this.needsFlash; //!this.hasInit && flashTime > 0;

		//Don't show on hover, it is supposed to remain hidden until scroll
		if ((!this.isObjectVisible(this._vt) || !this.isObjectVisible(this._ht)) && !scrolling && !dragging && !needsFlash) {
			return;
		}

		//Expand
		if (requireVertical && showVertical && expandTracks && mouseOverTrack && !needsFlash) this._vt.classList.add(this.cssClasses.expanded);
		if (requireHorizontal && showHorizontal && expandTracks && mouseOverTrack && !needsFlash) this._ht.classList.add(this.cssClasses.expanded);
		//Hide
		if (autoHide && requireVertical && showVertical && (!needsFlash || this.needsFlashY)) (0, _domCss2.default)(this._vt, { opacity: 1 });
		if (autoHide && requireHorizontal && showHorizontal && (!needsFlash || this.needsFlashX)) (0, _domCss2.default)(this._ht, { opacity: 1 });
	},


	/**
  * Manages the showing process according to Sync = false and autoHide = true,
  * @param axis
  */
	showUnSyncedTracks: function showUnSyncedTracks(axis) {
		var _global$data2 = this.global.data;
		var mouseOverTrackX = _global$data2.mouseOverTrackX;
		var mouseOverTrackY = _global$data2.mouseOverTrackY;
		var scrollingDir = _global$data2.scrollingDir;
		var draggingDir = _global$data2.draggingDir;
		var _current$data4 = this.current.data;
		var requireVertical = _current$data4.requireVertical;
		var requireHorizontal = _current$data4.requireHorizontal;
		var _props6 = this.props;
		var showVertical = _props6.showVertical;
		var showHorizontal = _props6.showHorizontal;
		var expandTracks = _props6.expandTracks;

		var isVer = axis === VER;
		var isHor = axis === HOR;
		var needsFlash = this.needsFlash; //!this.hasInit && flashTime > 0;

		//If not configured or needed to be shown
		if (isVer && !showVertical || isHor && !showHorizontal || isVer && !requireVertical || isHor && !requireHorizontal) {
			return;
		}

		//Don't show on hover, it is supposed to remain hidden until scroll
		if (!this.isObjectVisible(isVer ? this._vt : this._ht) && !scrollingDir && !draggingDir && !needsFlash) {
			return;
		}

		// Validations if performing dragging or scrolling
		if ((draggingDir && draggingDir !== axis || scrollingDir && scrollingDir !== axis) && !needsFlash) {
			return;
		}

		//Expand
		if (isVer && expandTracks && mouseOverTrackY && !needsFlash) this._vt.classList.add(this.cssClasses.expanded);
		if (isHor && expandTracks && mouseOverTrackX && !needsFlash) this._ht.classList.add(this.cssClasses.expanded);
		//Hide
		if (isVer && !needsFlash || isVer && this.needsFlashY) (0, _domCss2.default)(this._vt, { opacity: 1 });
		if (isHor && !needsFlash || isHor && this.needsFlashX) (0, _domCss2.default)(this._ht, { opacity: 1 });
	},


	/**
  * Manages the hiding process according to "Sync" and "autoHide" Props,
  * hiding a single track o both when autoHide is enabled
  * @param timeout
  */
	hideTracks: function hideTracks() {
		var timeout = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
		var _props7 = this.props;
		var syncTracks = _props7.syncTracks;
		var autoHide = _props7.autoHide;
		var expandTracks = _props7.expandTracks;

		if (!autoHide && !expandTracks) return;

		if (syncTracks) {
			this.hideSyncedTracks(timeout);
			return;
		}

		this.hideUnSyncedTracks(timeout, VER);
		this.hideUnSyncedTracks(timeout, HOR);
	},


	/**
  * Manages the hiding process of Both tracks when autoHide = true and Sync = true,
  * receives a timeout
  * @param time
  */
	hideSyncedTracks: function hideSyncedTracks() {
		var time = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
		var _global$data3 = this.global.data;
		var mouseOverTrack = _global$data3.mouseOverTrack;
		var scrolling = _global$data3.scrolling;
		var dragging = _global$data3.dragging;
		var _props8 = this.props;
		var expandTracks = _props8.expandTracks;
		var autoHideTimeout = _props8.autoHideTimeout;

		var selectedTimeout = time || autoHideTimeout;

		//If the track is performing scroll or drag, then return
		if (scrolling || dragging) return;

		//If it's already hidden, clear the timeouts, if any and return
		if (!this.isObjectVisible(this._vt) && !this.isObjectVisible(this._ht)) {
			clearTimeout(this.global.data.autoHideTimeout);
			clearTimeout(this.global.data.expandedTimeout);
			return;
		}

		if (expandTracks) {
			//If timeout is running, cancel before start over
			clearTimeout(this.global.data.expandedTimeout);
			this.global.data.expandedTimeout = setTimeout(this.shrinkTimeoutCallback.bind(this, this._vt, this._ht), selectedTimeout / 3);
		}

		//If timeout is running, cancel before start over
		clearTimeout(this.global.data.autoHideTimeout);
		this.global.data.autoHideTimeout = setTimeout(this.hideTimeoutCallback.bind(this, this._vt, this._ht), expandTracks && mouseOverTrack ? selectedTimeout * 1.3 : selectedTimeout);
	},


	/**
  * Manages the hiding process of Both tracks when autoHide = true and Sync = false,
  * receives a timeout and the axis to manage
  * @param time
  * @param axis
  */
	hideUnSyncedTracks: function hideUnSyncedTracks() {
		var _hideTimeoutCallback;

		var time = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
		var axis = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
		var _global$data4 = this.global.data;
		var mouseOverTrackX = _global$data4.mouseOverTrackX;
		var mouseOverTrackY = _global$data4.mouseOverTrackY;
		var scrollingDir = _global$data4.scrollingDir;
		var draggingDir = _global$data4.draggingDir;

		//If the track is performing scroll or drag, then return

		if (scrollingDir === axis || draggingDir === axis) return;

		var _props9 = this.props;
		var expandTracks = _props9.expandTracks;
		var autoHideTimeout = _props9.autoHideTimeout;


		var isVer = axis === VER;
		var timeoutName = 'autoHideTimeout' + (isVer ? 'Y' : 'X');
		var timeoutNameShrink = 'expandedTimeout' + (isVer ? 'Y' : 'X');
		var selectedTimeout = time || autoHideTimeout;
		var selectedTrack = isVer ? this._vt : this._ht;

		//If it's already hidden, clear the timeouts, if any and return
		if (!this.isObjectVisible(selectedTrack)) {
			clearTimeout(this.global.data[timeoutName]);
			clearTimeout(this.global.data[timeoutNameShrink]);
			return;
		}

		if (expandTracks) {
			var _shrinkTimeoutCallbac;

			//If timeout is running, cancel before start over
			clearTimeout(this.global.data[timeoutNameShrink]);
			this.global.data[timeoutNameShrink] = setTimeout((_shrinkTimeoutCallbac = this.shrinkTimeoutCallback).bind.apply(_shrinkTimeoutCallbac, [this].concat(_toConsumableArray(isVer ? [selectedTrack, null] : [null, selectedTrack]))), selectedTimeout / 3);
		}

		//If timeout is running, cancel before start over
		clearTimeout(this.global.data[timeoutName]);
		this.global.data[timeoutName] = setTimeout((_hideTimeoutCallback = this.hideTimeoutCallback).bind.apply(_hideTimeoutCallback, [this].concat(_toConsumableArray(isVer ? [selectedTrack, null] : [null, selectedTrack]))), expandTracks && (isVer && mouseOverTrackY || !isVer && mouseOverTrackX) ? selectedTimeout * 1.3 : selectedTimeout);
	},


	/**
  * Handles the timeout function to hide the tracks on autoHide = true
  * @param trackV
  * @param trackH
  */
	hideTimeoutCallback: function hideTimeoutCallback() {
		var trackV = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
		var trackH = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

		var isVer = trackV && trackH ? true : trackV ? true : false;
		var isHor = trackV && trackH ? true : trackH ? true : false;
		var isBoth = isVer && isHor;
		var scrolling = this.global.data['scrolling' + (isBoth ? '' : 'Dir')] === (isBoth ? true : isVer ? VER : HOR);
		var dragging = this.global.data['dragging' + (isBoth ? '' : 'Dir')] === (isBoth ? true : isVer ? VER : HOR);

		if (!this.global.data['mouseOverTrack' + (isBoth ? '' : isVer ? 'Y' : 'X')] && !scrolling && !dragging) {
			if (trackV) (0, _domCss2.default)(trackV, { opacity: 0 });
			if (trackH) (0, _domCss2.default)(trackH, { opacity: 0 });
		}
	},


	/**
  * Handles the timeout function to contract the tracks on expandedTracks = true
  * @param trackV
  * @param trackH
  */
	shrinkTimeoutCallback: function shrinkTimeoutCallback() {
		var trackV = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
		var trackH = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

		var trackToCheck = trackV && trackH ? '' : trackV ? 'Y' : 'X';
		if (!this.global.data['mouseOverTrack' + trackToCheck]) {
			if (trackV) trackV.classList.remove(this.cssClasses.expanded);
			if (trackH) trackH.classList.remove(this.cssClasses.expanded);
		}
	},


	/* *********************************************************** */
	/*    S C R O L L  E V E N T S
  /* *********************************************************** */

	/* ··································
  SCROLL EVENT ACTIONS
  ·································· */

	/**
  * Actions to perform when scroll starts
  */
	onScrollStart_actions: function onScrollStart_actions() {
		//this._c.classList.add( this.cssClasses.scrolling );

		this.showTracks();
		this.proxyUserEvents(this.props.onScrollStart, null, true);
	},


	/**
  * Actions to perform when scroll changes axis in the same capturing process
  */
	onScrollChangeDirection: function onScrollChangeDirection() {
		if (this.props.syncTracks) return;
		this.showTracks();
		this.hideTracks();
	},


	/**
  * Actions to perform when scroll ends
  */
	onScrollEnd_actions: function onScrollEnd_actions() {
		//this._c.classList.remove( this.cssClasses.scrolling );

		this.proxyUserEvents(this.props.onScrollEnd, null, true);
		this.hideTracks();
	},


	/* ··································
  SCROLL EVENT PROCESS
  ·································· */

	/**
  * It'a a proxy of events that trigger scrolling, but filters
  * it's data and calculation process accordingly
  * @param event
  */
	scrollProcessDelegate: function scrollProcessDelegate(event) {

		//Detect direction, axis, movementDelta, etc
		this.filterAndExtractScrollData(event);

		//Ignore Movements not required
		var usableMovement = this.global.data.usableMovement;

		//Some not usable movements need to give a feed back to the user,
		// like showing the bars

		if (usableMovement !== OK) {
			if (usableMovement === OFF_LIMIT_Y) {
				this.flashBars(VER);
			}
			if (usableMovement === OFF_LIMIT_X) {
				this.flashBars(HOR);
			}
			return;
		}
		if (event.type === WHEEL) {
			return;
		}
		//console.log( "passing",event.type, event.deltaY, event.deltaX );
		//Scroll Actions
		this.manageRequestActionFrame(event, this.update);
		this.proxyUserEvents(this.props.onScroll, event, true);
		this.detectScrolling();
	},


	/**
  * Inspects the event to calculate the movement according to it,
  * using DeltaX and DeltaY for Wheel event or calculating position
  * if other. Detects unnecessary events, like those on wheel events.
  * @param event
  */
	filterAndExtractScrollData: function filterAndExtractScrollData(event) {
		var values = this.doCalculations(event);
		var axisToListen = NONE;
		var directionX = NONE;
		var directionY = NONE;
		var usableMovement = OK;

		var type = event.type;
		var deltaY = event.deltaY;
		var deltaX = event.deltaX;
		var requireBoth = values.requireBoth;
		var requireNone = values.requireNone;
		var requireHorizontal = values.requireHorizontal;
		var requireVertical = values.requireVertical;
		//console.log( event );
		//The content doesn't need to scroll

		if (requireNone) {
			this.current.save({ direction: NONE, directionX: NONE, directionY: NONE });
			usableMovement = ZERO;
			this.global.save({ usableMovement: usableMovement });
			return;
		}

		// If it's wheel, check the movement, track-pads sends data in both directions x and y,
		// so we have to calculate something before decide where to move
		if (type === WHEEL) {
			var atBottom = values.atBottom;
			var atTop = values.atTop;
			var atLeft = values.atLeft;
			var atRight = values.atRight;

			//Both deltas have no information about movement

			if (deltaX === 0 && deltaY === 0) {
				usableMovement = ZERO;
				if (atBottom || atTop || atLeft || atRight) {
					usableMovement = OFF_LIMIT;
					this.preventScroll(event);
				}
				this.global.save({ usableMovement: usableMovement });
				return;
			}

			//If we need both scrollbars, we need to check which axis has more movement
			axisToListen = requireBoth ? _utilities.calc.axisDelta(deltaX, deltaY) : _utilities.calc.axisRequired(requireHorizontal, requireVertical);

			//No movement in axis to listen
			if (axisToListen === VER && deltaY === 0 || axisToListen === HOR && deltaX === 0) {
				usableMovement = ZERO;
				this.global.save({ usableMovement: usableMovement });
				return;
			}

			// If we should listen to the Y axis.
			if (axisToListen === VER) {

				//At bottom or top we have to call to prevent default if it's needed
				if (values.atBottom && deltaY >= 0 || values.atTop && deltaY <= 0) {
					usableMovement = OFF_LIMIT_Y;
					this.preventScroll(event);
				}

				//Save the direction and prevailing axis
				directionY = deltaY > 0 ? DOWN : UP;
			}

			// If we should listen to the X axis.
			else if (axisToListen === HOR) {

					//At right-end or left-end we have to call to prevent default if it's needed
					if (values.atRight && deltaX >= 0 || values.atLeft && deltaX <= 0) {
						usableMovement = OFF_LIMIT_X;
						this.preventScroll(event);
					}

					//Save the direction and prevailing axis
					directionX = deltaX > 0 ? RIGHT : LEFT;
				}

			//On direction change, discard minimal or accidental moves trough different axis
			if (this.current.data.direction !== axisToListen) {
				//probably an over sensitive scroll
				if (Math.abs(deltaY) < 2 || Math.abs(deltaX) < 2) {
					usableMovement = ZERO;
				}
			}

			//Save the direction and prevailing axis
			this.current.save({ direction: axisToListen, directionX: directionX, directionY: directionY });
		} else {

			var movement = _utilities.calc.movement(this.current.data, this.previous.data);

			//Saving the movement detected
			if (movement.direction !== NONE) {
				this.current.save(movement);
			}
			//Probably a Scroll event fired just after the Wheel, so no info is detected
			else {
					usableMovement = ZERO;
				}
		}

		this.limitEventCalls(event);
		this.global.save({ usableMovement: usableMovement });
	},


	/**
  * When the callbacks passed as props need to be called, we need to make sure we don't trigger them more than once
  * if nothing has change, eg: When Calling atBottom but user scrolls down again, the the action should be triggered
  * once
  * @param event
  */
	limitEventCalls: function limitEventCalls(event) {
		var _global$data5 = this.global.data;
		var atBottomCalled = _global$data5.atBottomCalled;
		var atTopCalled = _global$data5.atTopCalled;
		var atRightCalled = _global$data5.atRightCalled;
		var atLeftCalled = _global$data5.atLeftCalled;
		var hasEverMoveDown = _global$data5.hasEverMoveDown;
		var hasEverMoveRight = _global$data5.hasEverMoveRight;
		var _current$data5 = this.current.data;
		var atBottom = _current$data5.atBottom;
		var atTop = _current$data5.atTop;
		var atRight = _current$data5.atRight;
		var atLeft = _current$data5.atLeft;
		var direction = _current$data5.direction;
		var directionY = _current$data5.directionY;
		var directionX = _current$data5.directionX;


		if (direction === VER) {
			if (atBottom && directionY === DOWN && !atBottomCalled) {
				//event.persist();
				this.proxyUserEvents(this.props.atBottom, event, true);
				this.global.data.atBottomCalled = true;
				this.global.data.atTopCalled = false;
			} else if (atTop && directionY === UP && !atTopCalled && hasEverMoveDown) {
				//event.persist();
				this.proxyUserEvents(this.props.atTop, event, true);
				this.global.data.atTopCalled = true;
				this.global.data.atBottomCalled = false;
			} else if (!atTop && !atBottom) {
				this.global.data.atTopCalled = false;
				this.global.data.atBottomCalled = false;
			}
			if (directionY === DOWN) {
				this.global.data.hasEverMoveDown = true;
			}
		}

		if (direction === HOR) {

			if (atRight && directionX === RIGHT && !atRightCalled) {
				//event.persist();
				this.proxyUserEvents(this.props.atRight, event, true);
				this.global.data.atRightCalled = true;
				this.global.data.atLeftCalled = false;
			} else if (atLeft && directionX === LEFT && !atLeftCalled && hasEverMoveRight) {
				//event.persist();
				this.proxyUserEvents(this.props.atLeft, event, true);
				this.global.data.atLeftCalled = true;
				this.global.data.atRightCalled = false;
			} else if (!atLeft && !atRight) {
				this.global.data.atLeftCalled = false;
				this.global.data.atRightCalled = false;
			}
			if (directionX === RIGHT) {
				this.global.data.hasEverMoveRight = true;
			}
		}
	},


	/**
  * Manages the instantiation of a
  * requestActionFrame to manage the animations
  * in the browser.
  * @param event
  * @param callback
  * @param object
  */
	manageRequestActionFrame: function manageRequestActionFrame() {
		var event = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
		var callback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _utilities.utils.noop;
		var object = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'raf';

		//Cancel Existing Request Animation Frames
		if (this.current.data[object]) {
			_raf2.default.cancel(this.current.data[object]);
			if (event && !this.props.passiveEvent) event.preventDefault();
			if (event && !this.props.passiveEvent) event.stopPropagation();
		}
		this.current.save(_defineProperty({}, object, (0, _raf2.default)(callback)));
	},


	/**
  * Creates an interval to monitor when the scroll process
  * has finished in order to do some operations
  */
	detectScrolling: function detectScrolling() {
		var _this = this;

		var scrollingDir = this.global.data.scrollingDir;
		var direction = this.current.data.direction;

		// If Scrolling process already started but there is a change
		// of axis in the middle of detection, just call start actions again
		// to show the scrollbar for the new axis

		if (scrollingDir !== direction && this.global.data.scrolling) {
			this.global.save({
				scrolling: true,
				ticking: true,
				scrollingDir: direction
			});

			this.onScrollChangeDirection(scrollingDir);
			return;
		}

		//Exit if already detected
		if (this.global.data.scrolling) return;

		//Store the flags
		this.global.save({
			scrolling: true,
			ticking: true,
			scrollingDir: direction
		});

		//Call onScrollStart actions, internal and from props
		this.onScrollStart_actions();

		//create an interval
		this.global.data.interval = setInterval(function () {
			var _current$data6 = _this.current.data;
			var scrollTop = _current$data6.scrollTop;
			var scrollLeft = _current$data6.scrollLeft;
			var _global$data6 = _this.global.data;
			var detectingPointX = _global$data6.detectingPointX;
			var detectingPointY = _global$data6.detectingPointY;

			//if scroll has stopped

			if (detectingPointX === scrollLeft && detectingPointY === scrollTop) {
				clearInterval(_this.global.data.interval);
				_this.global.save({
					scrolling: false,
					ticking: false,
					scrollingDir: false
				});

				//Call onScrollEnd actions, internal and from props
				_this.onScrollEnd_actions();
			}

			_this.global.save({
				detectingPointY: scrollTop,
				detectingPointX: scrollLeft
			});
		}, 100);
	},


	/**
  * Handles the prevent scrolling, if it's enabled
  * then it's applied
  * @param event
  */
	preventScroll: function preventScroll(event) {
		if (this.props.preventScrolling && !this.props.passiveEvent) {
			event.preventDefault();
			event.stopPropagation();
		}
	},


	/* ··································
  SCROLL UPDATES MANAGEMENT
  ·································· */

	/**
  * Applies updates according to doCalculations() data
  */
	visualUpdates: function visualUpdates() {
		this.updateThumbs();
		this.updateTracks();
	},


	/**
  * Applies the changes detected
  */
	update: function update() {

		//de-activate requestAnimationFrame
		this.current.data.raf = undefined;
		this.current.data.rafScrollbar = undefined;
		this.current.data.rafDragging = undefined;

		if (this.needsReCalculation) {
			this.doCalculations(null, this.needsUpdateData);
			this.needsReCalculation = false;
			this.needsUpdateData = false;

			var action = this.current.data.scrollbarWidth ? 'add' : 'remove';
			this._c.classList[action]("sb2-has-scrollbar");
		}

		this.visualUpdates();

		if (this.hasInit) {
			this.proxyUserEvents(this.props.onUpdate);
			this.proxyUserEvents(this.props.onScrollFrame, null, true);
		}
	},


	/* ··································
  SCROLL EVENT HELPER
  ·································· */
	/**
  * Before calling a prop action, we need to verify the action matches the movement
  * and the axis so we won't throwing unnecessary calls
  * @param callback
  * @param event
  * @param validateDirection
  */
	proxyUserEvents: function proxyUserEvents() {
		var callback = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : _utilities.utils.noop;
		var event = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
		var validateDirection = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
		var _props10 = this.props;
		var showVertical = _props10.showVertical;
		var showHorizontal = _props10.showHorizontal;
		var direction = this.current.data.direction;

		var response = [];

		if (event) {
			response.push(event);
		}
		response.push(this.delivery.data);

		if (!validateDirection) {
			callback.apply(undefined, response);
			return;
		}

		if (showVertical && direction === VER || showHorizontal && direction === HOR) {
			callback.apply(undefined, response);
		}
	},


	/* *********************************************************** */
	/*    D R A G  E V E N T S
  /* *********************************************************** */

	/* ··································
  DRAG SETUP AND TEAR DOWN
  ·································· */

	/**
  * All necessary actions to perform in order to
  * make the drag process works
  */
	setupDrag: function setupDrag() {

		//Save some data before change it
		this.dragging.save({
			onselectstart: document.onselectstart
		});

		//Add temporarily the class to the body to avoid unwanted selections
		document.body.classList.add(this.cssClasses.body);
		this._c.classList.add(this.cssClasses.dragging);

		//Add events
		document.addEventListener('mousemove', this.onDrag);
		document.addEventListener('mouseup', this.onDragEnd);
		document.onselectstart = _utilities.utils.falseNoop();
	},


	/**
  * All actions made my the setup needs to be undone
  * to make every thing as it was
  */
	tearDownDrag: function tearDownDrag() {
		//Restore some data
		document.body.classList.remove(this.cssClasses.body);
		document.onselectstart = this.dragging.data.onselectstart;
		this._c.classList.remove(this.cssClasses.dragging);

		//Remove Events
		document.removeEventListener('mousemove', this.onDrag);
		document.removeEventListener('mouseup', this.onDragEnd);
	},


	/* ··································
  DRAG EVENT ACTIONS
  ·································· */

	/**
  * Starts the process of dragging
  * @param event
  */
	onDragStart: function onDragStart(event) {
		var target = event.target;

		//Saving Scrolling data

		this.global.save({
			dragging: true,
			draggingDir: target === this._vtn ? VER : HOR
		});

		event.stopPropagation();
		this.setupDrag(event);
	},


	/**
  * Drag process itself, Managed by document.mousemove
  * @returns {boolean}
  */
	onDrag: function onDrag(event) {

		if (this.dragging.data.prevPosY) {
			var clientY = event.clientY;

			var _vt$getBoundingClient = this._vt.getBoundingClientRect();

			var trackTop = _vt$getBoundingClient.top;

			var thumbHeight = this.current.data.thumbHeight;
			var clickPosition = thumbHeight - this.dragging.data.prevPosY;
			var offset = -trackTop + clientY - clickPosition;
			this.manageRequestActionFrame(null, this.moveViewDirectly.bind(this, this._v, VER, this.getScrollTopForOffset(offset)), 'rafDragging');
		}

		if (this.dragging.data.prevPosX) {
			var clientX = event.clientX;

			var _ht$getBoundingClient = this._ht.getBoundingClientRect();

			var trackLeft = _ht$getBoundingClient.left;

			var thumbWidth = this.current.data.thumbWidth;
			var _clickPosition = thumbWidth - this.dragging.data.prevPosX;
			var _offset = -trackLeft + clientX - _clickPosition;
			this.manageRequestActionFrame(null, this.moveViewDirectly.bind(this, this._v, HOR, this.getScrollLeftForOffset(_offset)), 'rafDragging');
		}

		return false;
	},


	/**
  * End of dragging
  */
	onDragEnd: function onDragEnd() {

		//Reset Values
		this.global.save({
			dragging: false,
			draggingDir: false
		});
		this.dragging.save({
			prevPosX: null,
			prevPosY: null
		});

		this.tearDownDrag();
		this.hideTracks();
	},


	/* ··································
  DRAG EVENT HELPERS
  ·································· */
	getScrollTopForOffset: function getScrollTopForOffset(offset) {
		var _current$data7 = this.current.data;
		var scrollHeight = _current$data7.scrollHeight;
		var clientHeight = _current$data7.clientHeight;
		var thumbHeight = _current$data7.thumbHeight;

		return offset / (clientHeight - thumbHeight) * (scrollHeight - clientHeight);
	},
	getScrollLeftForOffset: function getScrollLeftForOffset(offset) {
		var _current$data8 = this.current.data;
		var scrollWidth = _current$data8.scrollWidth;
		var clientWidth = _current$data8.clientWidth;
		var thumbWidth = _current$data8.thumbWidth;

		return offset / (clientWidth - thumbWidth) * (scrollWidth - clientWidth);
	},


	/* *********************************************************** */
	/*    E V E N T S   A S S I G N A T I O N
  /* *********************************************************** */

	/**
  * Receives onScroll and onWheel,
  * filtering the events to avoid duplicates through scrollProcessDelegate
  * @param event
  */
	onScroll: function onScroll(event) {
		this.scrollProcessDelegate(event);
	},


	/**
  * Update positions and sizes after window resize
  */
	onResize: function onResize() {
		this.forceVisualUpdate();
	},


	/* ··································
  TRACK'S EVENTS
  ·································· */

	/**
  * Sets the status mouseOverTrack[X,Y], based on
  * the given element, and the status [true, false]
  * @param target
  * @param status
  */
	setMouseOver: function setMouseOver(target, status) {
		var isHorizontal = target === this._ht || target === this._htn;
		var isVertical = target === this._vt || target === this._vtn;
		this.global.save(_extends({}, this.props.syncTracks && { mouseOverTrack: status }, isHorizontal && !this.props.syncTracks && { mouseOverTrackX: status }, isVertical && !this.props.syncTracks && { mouseOverTrackY: status }));
	},
	onMouseEnterTrack: function onMouseEnterTrack(event) {
		this.setMouseOver(event.target, true);
		this.showTracks();
	},
	onMouseLeaveTrack: function onMouseLeaveTrack(event) {
		this.setMouseOver(event.target, false);
		this.hideTracks();
	},
	onMouseDownVerticalTrack: function onMouseDownVerticalTrack(event) {
		this.scrollToTop(_utilities.calc.posY(event, this.current.data));
	},
	onMouseDownHorizontalTrack: function onMouseDownHorizontalTrack(event) {
		this.scrollToLeft(_utilities.calc.posX(event, this.current.data));
	},
	onScrollBarAndThumb: function onScrollBarAndThumb(event) {
		var deltaX = event.deltaX;
		var deltaY = event.deltaY;

		var isHorizontal = event.target === this._ht || event.target === this._htn;
		var isVertical = event.target === this._vt || event.target === this._vtn;

		if (deltaY && isVertical) {
			if (this._vt.style.opacity > 0 && (deltaY > 0 || deltaY < 0)) {
				event.preventDefault();
				this.manageRequestActionFrame(null, this.moveViewDirectly.bind(this, this._v, VER, this._v.scrollTop + deltaY), 'rafScrollbar');
			}
		}
		if (deltaX && isHorizontal) {
			if (this._ht.style.opacity > 0 && (deltaX > 0 || deltaX < 0)) {
				event.preventDefault();
				this.manageRequestActionFrame(null, this.moveViewDirectly.bind(this, this._v, HOR, this._v.scrollLeft + deltaX), 'rafScrollbar');
			}
		}
	},


	/* ··································
  THUMB'S EVENTS
  ·································· */

	onMouseEnterThumb: function onMouseEnterThumb(event) {
		//... possible action on hover
	},
	onMouseLeaveThumb: function onMouseLeaveThumb() {
		//... possible action on hover
	},
	onMouseDownThumbHorizontal: function onMouseDownThumbHorizontal(event) {

		this.onDragStart(event);
		var target = event.target;
		var clientX = event.clientX;
		var offsetWidth = target.offsetWidth;

		var _target$getBoundingCl = target.getBoundingClientRect();

		var left = _target$getBoundingCl.left;

		this.dragging.data.prevPosX = offsetWidth - (clientX - left);
	},
	onMouseDownThumbVertical: function onMouseDownThumbVertical(event) {

		this.onDragStart(event);
		var target = event.target;
		var clientY = event.clientY;
		var offsetHeight = target.offsetHeight;

		var _target$getBoundingCl2 = target.getBoundingClientRect();

		var top = _target$getBoundingCl2.top;

		this.dragging.data.prevPosY = offsetHeight - (clientY - top);
	},


	/* *********************************************************** */
	/*    A P I   M E T H O D S
  /* *********************************************************** */

	scrollToTop: function scrollToTop() {
		var top = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
		var _current$data9 = this.current.data;
		var requireVertical = _current$data9.requireVertical;
		var requireBoth = _current$data9.requireBoth;


		if (this.props.showVertical && (requireVertical || requireBoth)) {
			this._v.scrollTop = top;
		}
	},
	scrollToBottom: function scrollToBottom() {
		var bottom = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
		var _current$data10 = this.current.data;
		var requireVertical = _current$data10.requireVertical;
		var requireBoth = _current$data10.requireBoth;
		var maxScrollTop = _current$data10.maxScrollTop;


		if (this.props.showVertical && (requireVertical || requireBoth)) {
			this._v.scrollTop = maxScrollTop - bottom;
		}
	},
	scrollToLeft: function scrollToLeft() {
		var left = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
		var _current$data11 = this.current.data;
		var requireHorizontal = _current$data11.requireHorizontal;
		var requireBoth = _current$data11.requireBoth;


		if (this.props.showHorizontal && (requireHorizontal || requireBoth)) {
			this._v.scrollLeft = left;
		}
	},
	scrollToRight: function scrollToRight() {
		var right = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
		var _current$data12 = this.current.data;
		var requireHorizontal = _current$data12.requireHorizontal;
		var requireBoth = _current$data12.requireBoth;
		var maxScrollLeft = _current$data12.maxScrollLeft;


		if (this.props.showHorizontal && (requireHorizontal || requireBoth)) {
			this._v.scrollLeft = maxScrollLeft - right;
		}
	},
	disable: function disable() {
		this.removeWindowListeners();
		this.enable = false;
	},
	enable: function enable() {
		this.addWindowListeners();
		this.enable = true;
	},
	forceVisualUpdate: function forceVisualUpdate() {
		var includeScrollBarWidth = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

		if (includeScrollBarWidth) {
			//noinspection JSUnresolvedVariable
			this.sBarWidth = false;
		}
		this.needsUpdateData = true;
		this.needsReCalculation = true;
		this.update();
	},


	/**
  * Evaluates opacity of given object
  * @param target
  * @returns {boolean}
  */
	isObjectVisible: function isObjectVisible(target) {
		var autoHide = this.props.autoHide;


		if (target === this._vt) {
			if (this._vt.style.opacity > 0 && autoHide) {
				return true;
			} else if (this._vt.style.display === 'block' && !autoHide) {
				return true;
			}
		}

		if (target === this._ht) {
			if (this._ht.style.opacity > 0 && autoHide) {
				return true;
			} else if (this._ht.style.display === 'block' && !autoHide) {
				return true;
			}
		}

		return false;
	},


	/* *********************************************************** */
	/*    I N L I N E   S T Y L E S
  /* *********************************************************** */

	getContainerStyle: function getContainerStyle() {
		var _props11 = this.props;
		var autoHeight = _props11.autoHeight;
		var autoHeightMin = _props11.autoHeightMin;
		var autoHeightMax = _props11.autoHeightMax;


		return _extends({
			position: 'relative',
			overflow: 'hidden',
			width: '100%'
		}, autoHeight && {
			height: 'auto',
			minHeight: autoHeightMin,
			maxHeight: autoHeightMax
		}, !autoHeight && {
			height: '100%'
		}, this.props.style, this.props.containerStyle);
	},
	getViewStyle: function getViewStyle() {
		var _props12 = this.props;
		var autoHeight = _props12.autoHeight;
		var autoHeightMin = _props12.autoHeightMin;
		var autoHeightMax = _props12.autoHeightMax;
		var showHorizontal = _props12.showHorizontal;
		var showVertical = _props12.showVertical;
		var scrollbarWidth = this.current.data.scrollbarWidth;


		return _extends({

			overflowX: showHorizontal ? 'scroll' : 'hidden',
			overflowY: showVertical ? 'scroll' : 'hidden',
			WebkitOverflowScrolling: 'touch',
			marginRight: scrollbarWidth ? -scrollbarWidth : 0,
			marginBottom: scrollbarWidth ? -scrollbarWidth : 0

		}, autoHeight && {
			position: 'relative',
			minHeight: autoHeightMin + scrollbarWidth,
			maxHeight: autoHeightMax + scrollbarWidth
		}, !autoHeight && {
			position: 'absolute',
			top: 0,
			left: 0,
			right: 0,
			bottom: 0
		}, this.props.viewStyle);
	},
	getTracksStyle: function getTracksStyle(axis) {
		var _props13 = this.props;
		var showVertical = _props13.showVertical;
		var showHorizontal = _props13.showHorizontal;
		var autoHide = _props13.autoHide;


		return _extends({
			position: 'absolute',
			zIndex: 1,
			right: 0,
			bottom: 0
		}, axis === VER && {
			display: showVertical ? 'block' : 'none',
			top: 0
		}, axis === HOR && {
			display: showHorizontal ? 'block' : 'none',
			left: 0
		}, autoHide && {
			opacity: 0
		}, this.props.tracksStyle);
	},
	getThumbsStyle: function getThumbsStyle() {
		return _extends({
			position: 'relative',
			display: 'block',
			cursor: 'default'
		}, this.props.thumbsStyle);
	},
	quickRefs: function quickRefs() {
		this._c = this.refs['container'];
		this._v = this.refs['view'];
		this._ht = this.refs['trackHorizontal'];
		this._vt = this.refs['trackVertical'];
		this._htn = this.refs['thumbHorizontal'];
		this._vtn = this.refs['thumbVertical'];
	},
	delayableInit: function delayableInit() {
		this.forceVisualUpdate();
		this.flashBars(VER);
		this.hasInit = true;
	},


	/* *********************************************************** */
	/*    C O M P O N E N T   L I F E C Y C L E
  /* *********************************************************** */

	componentWillMount: function componentWillMount() {

		this.setupData();
		this.global.save({
			stylesheetObject: new _utilities.utils.StyleInserter(this.styleTagId, this.styleClass, true)
		});
		this.global.data.stylesheetObject.setRulesFromParsed(this.props.parsedStyle || defaultParsedStyle, this.props.parsedStyle);
	},
	componentDidMount: function componentDidMount() {
		var _this2 = this;

		this.quickRefs();
		this.addWindowListeners();

		if (this.props.flashTimeDelay === 0) {
			this.delayableInit();
			return;
		}

		//Delay the flash and initial calculation until client is ready
		var initTimeOut = setTimeout(function () {
			_this2.delayableInit();
			clearTimeout(initTimeOut);
		}, this.props.flashTimeDelay);
	},
	componentDidUpdate: function componentDidUpdate() {
		console.clear();
		if (this.props.updateOnUpdates) {
			this.needsUpdateData = true;
			this.needsReCalculation = true;
			this.update();
		}

		this.global.data.stylesheetObject.setRulesFromParsed(this.props.parsedStyle || defaultParsedStyle, this.props.parsedStyle);
	},
	componentWillUnmount: function componentWillUnmount() {
		this.removeWindowListeners();
		clearInterval(this.global.data.interval);

		//Clear autoHide Timeouts
		clearTimeout(this.global.data.autoHideTimeout);
		clearTimeout(this.global.data.autoHideTimeoutX);
		clearTimeout(this.global.data.autoHideTimeoutY);

		//Clear Expand Tracks Timeouts
		clearTimeout(this.global.data.expandedTimeout);
		clearTimeout(this.global.data.expandedTimeoutX);
		clearTimeout(this.global.data.expandedTimeoutY);

		//Cancel requestAnimationFrames
		if (this.global.data.raf) _raf2.default.cancel(this.global.data.raf);
		if (this.global.data.rafScrollbar) _raf2.default.cancel(this.global.data.rafScrollbar);
		if (this.global.data.rafDragging) _raf2.default.cancel(this.global.data.rafDragging);

		//Style
		this.global.data.stylesheetObject.cleanUp();
	},


	/* *********************************************************** */
	/*    R E N D E R
  /* *********************************************************** */

	render: function render() {
		var _cssStyles = this.cssStyles;
		var container = _cssStyles.container;
		var view = _cssStyles.view;
		var vTrack = _cssStyles.vTrack;
		var hTrack = _cssStyles.hTrack;
		var vThumb = _cssStyles.vThumb;
		var hThumb = _cssStyles.hThumb;


		return _react2.default.createElement(
			'div',
			_extends({ className: this.cssClasses.container, ref: 'container', style: container }, this.evt.container),
			_react2.default.createElement(
				'div',
				{ className: this.cssClasses.view, key: 'theView', ref: 'view', tabIndex: '0', style: view },
				this.props.children
			),
			_react2.default.createElement(
				'div',
				_extends({ className: this.cssClasses.hTrack, ref: 'trackHorizontal', style: hTrack }, this.evt.hTrack),
				_react2.default.createElement('div', _extends({ className: this.cssClasses.hThumb, ref: 'thumbHorizontal', style: hThumb }, this.evt.hThumb))
			),
			_react2.default.createElement(
				'div',
				_extends({ className: this.cssClasses.vTrack, ref: 'trackVertical', style: vTrack }, this.evt.vTrack),
				_react2.default.createElement('div', _extends({ className: this.cssClasses.vThumb, ref: 'thumbVertical', style: vThumb }, this.evt.vThumb))
			)
		);
	}
});

exports.default = Scrollbars2;