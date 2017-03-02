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

require( 'classlist-polyfill' );

//import React from 'react';
import React from 'react';
import css from 'dom-css';
import classnames from 'classnames';
import raf from 'raf';
import {getScrollbarWidth} from './helpers';
import {utils, calc} from './utilities';
import models from './dataModels';

const RPT = React.PropTypes;

const VER  = 'vertical';
const HOR  = 'horizontal';
const NONE = 'none';
const BOTH = 'both';

const DOWN  = 'down';
const UP    = 'up';
const LEFT  = 'left';
const RIGHT = 'right';

const WHEEL        = 'wheel';
const SCROLL       = 'scroll';
const CSS_CLASS    = 'sb2-scrollbars2';
const CSS_TAG_ID = 'sb2-tag';

//Related to movements and Deltas X & Y
const ZERO        = 'zero';
const OFF_LIMIT   = 'off-limits';
const OFF_LIMIT_X = 'off-limits-x';
const OFF_LIMIT_Y = 'off-limits-y';
const OK          = 'ok';

//Related to event add or remove listener
const ON  = 'on';
const OFF = 'off';

//Window Resize Event, globally avoiding duplication among different instances
let sBarWidth   = null;
const WinRes    = new utils.WindowResizer();
const defaultParsedStyle =  require( 'to-string!css!less!./style/style.less' );

export const Scrollbars2 =  React.createClass( {

	displayName: "Scrollbars2",

	propTypes: {
		showVertical   : RPT.bool,
		showHorizontal : RPT.bool,
		autoHide       : RPT.bool,
		autoHideTimeout: RPT.number,
		autoHeight     : RPT.bool,
		autoHeightMin  : RPT.number,
		autoHeightMax  : RPT.number,
		thumbMinSize   : RPT.number,
		className      : RPT.string,

		onScroll     : RPT.func,
		onScrollStart: RPT.func,
		onScrollEnd  : RPT.func,
		onScrollFrame: RPT.func,
		onUpdate     : RPT.func,
		atBottom     : RPT.func,
		atTop        : RPT.func,
		atRight      : RPT.func,
		atLeft       : RPT.func,

		cssStyleClass  : RPT.string,
		cssStylesheetID: RPT.string,
		flashTime      : RPT.number,
		flashTimeDelay : RPT.number,

		containerStyle: RPT.object,
		viewStyle     : RPT.object,
		tracksStyle   : RPT.object,
		thumbsStyle   : RPT.object,
		parsedStyle   : RPT.string,

		preventScrolling : RPT.bool,
		updateOnUpdates  : RPT.bool,
		expandTracks     : RPT.bool,
		syncTracks       : RPT.bool,
		hideUnnecessary  : RPT.bool,
		passiveEvent     : RPT.bool,
		usePerformantView: RPT.bool

	},
	getDefaultProps(){
		return {
			showVertical   : true,
			showHorizontal : false,
			autoHide       : false,
			autoHideTimeout: 1000,
			autoHeight     : false,
			autoHeightMin  : 0,
			autoHeightMax  : 200,
			thumbMinSize   : 30,
			className      : '',

			onScroll     : utils.noop,
			onScrollStart: utils.noop,
			onScrollEnd  : utils.noop,
			onScrollFrame: utils.noop,
			onUpdate     : utils.noop,
			atBottom     : utils.noop,
			atTop        : utils.noop,
			atRight      : utils.noop,
			atLeft       : utils.noop,

			cssStyleClass  : CSS_CLASS,
			cssStylesheetID: CSS_TAG_ID,
			flashTime      : 1500,
			flashTimeDelay : 0,

			containerStyle: {},
			viewStyle     : {},
			tracksStyle   : {},
			thumbsStyle   : {},
			parsedStyle   : null,

			preventScrolling : true,
			updateOnUpdates  : true,
			expandTracks     : true,
			syncTracks       : false,
			hideUnnecessary  : true,
			passiveEvent     : false,
			usePerformantView: true
		}
	},

	/**
	 * All Storable data that won't change or won't be necessary
	 * to re-generate during the component's life time
	 */
	setupData(){

		this.hasInit            = false;
		this.needsReCalculation = false;
		this.needsUpdateData    = false;
		this.needsFlash         = false;
		this.needsFlashX        = false;
		this.needsFlashY        = false;
		this.enable             = true;

		//Data Saving Storage
		this.current  = new utils.DataStorage( models.scrollInfo );
		this.previous = new utils.DataStorage( models.scrollInfo );
		this.dragging = new utils.DataStorage( models.draggingInfo );
		this.global   = new utils.DataStorage( models.globalTracking );
		this.cache    = new utils.DataStorage();
		this.delivery = new utils.DataStorage();

		/** Quick access to Refs **/
		this._c = {}; //container
		this._v   = {}; // view
		this._ht  = {}; // horizontal track
		this._vt  = {}; // vertical track
		this._htn = {}; // horizontal thumbnail
		this._vtn = {}; // vertical thumbnail

		/** Style and Tag **/
		const {cssStyleClass, cssStylesheetID} = this.props;
		const isDefaultStyle = cssStyleClass === CSS_CLASS;
		this.styleTagId     = isDefaultStyle ? cssStylesheetID : CSS_TAG_ID + "_" + cssStyleClass ;
		this.styleClass     = cssStyleClass;//isDefaultStyle ? cssStyleClass   : CSS_CLASS  + "." + cssStyleClass;

		//Object Events
		this.evt        = {
			container: {},
			view     : {},
			vTrack   : {
				onMouseDown : this.onMouseDownVerticalTrack,
				onWheel     : this.onScrollBarAndThumb,
				onMouseEnter: this.onMouseEnterTrack,
				onMouseLeave: this.onMouseLeaveTrack
			},
			hTrack   : {
				onMouseDown : this.onMouseDownHorizontalTrack,
				onWheel     : this.onScrollBarAndThumb,
				onMouseEnter: this.onMouseEnterTrack,
				onMouseLeave: this.onMouseLeaveTrack
			},
			vThumb   : {
				onMouseDown: this.onMouseDownThumbVertical
			},
			hThumb   : {
				onMouseDown: this.onMouseDownThumbHorizontal
			},
		};
		this.cssClasses = {
			container : classnames(
				'sb2-container', this.styleClass.toLowerCase().replace("."," "), {
					'sb2-auto-hide'    : this.props.autoHide,
					'sb2-auto-height'  : this.props.autoHeight,
					'sb2-expand-tracks': this.props.expandTracks,
				}
			),
			view      : classnames(
				'sb2-view', {
					performant: this.props.usePerformantView
				}
			),
			vTrack    : 'sb2-track sb2-v',
			hTrack    : 'sb2-track sb2-h',
			vThumb    : 'sb2-thumb sb2-v',
			hThumb    : 'sb2-thumb sb2-h',
			body      : 'sb2-body',
			scrolling : 'sb2-scrolling',
			dragging  : 'sb2-dragging',
			autoHideOn: 'sb2-auto-hide-on',
			expanded  : 'sb2-expanded',
		};
		this.cssStyles  = {
			container: this.getContainerStyle( true ),
			view     : this.getViewStyle( true ),
			vTrack   : this.getTracksStyle( VER, true ),
			hTrack   : this.getTracksStyle( HOR, true ),
			vThumb   : this.getThumbsStyle( VER ),
			hThumb   : this.getThumbsStyle( HOR ),
		}
	},

	addWindowListeners(){
		//window.addEventListener( 'resize', this.onResize );
		WinRes.addInstance( this, this.onResize );
		this.toggleScrollEvent( SCROLL, ON );
		this.toggleScrollEvent( WHEEL, ON );
	},

	removeWindowListeners(){
		//window.removeEventListener( 'resize', this.onResize );
		WinRes.removeInstance( this );
		this.toggleScrollEvent( SCROLL, OFF );
		this.toggleScrollEvent( WHEEL, OFF );
	},

	/**
	 * Attaches and Detaches the Scroll Event Listener
	 * @type boolean
	 */
	toggleScrollEvent(eventName = null, status = null){

		if ( !eventName || !status ) return false;

		if ( status === ON ) {
			this._v.addEventListener( eventName, this.onScroll, {
				passive: this.props.passiveEvent,
				capture: true
			} );
			return false;
		}
		if ( status === OFF ) {
			this._v.removeEventListener( eventName, this.onScroll, {
				passive: this.props.passiveEvent,
				capture: true
			} );
			return false;
		}
	},

	setDataToCache(){
		if( !sBarWidth ){
			sBarWidth = getScrollbarWidth( true );
		}

		this.cache.save( {
			trackWidth    : calc.innerWidth( this._ht ),
			trackHeight   : calc.innerHeight( this._vt ),
			scrollbarWidth: sBarWidth
		} );
	},

	doCalculations(event = null, needsUpdateData = false){
	    if(event){
	        console.log(event);
        }
		if ( needsUpdateData ) {
			this.setDataToCache();
		}

		const { scrollLeft, scrollTop, scrollWidth, scrollHeight, clientWidth, clientHeight } = this._v;

		const maxScrollTop   = scrollHeight - clientHeight;
		const maxScrollLeft  = scrollWidth - clientWidth;
		const scrollbarWidth = this.cache.data.scrollbarWidth;

		const trackWidth  = this.cache.data.trackWidth;
		const trackHeight = this.cache.data.trackHeight;

		//Thumbs Calculation
		const thumbHeight = calc.thumbHeight( this._v, trackHeight, this.props.thumbMinSize );
		const thumbWidth  = calc.thumbWidth( this._v, trackWidth, this.props.thumbMinSize );
		const thumbPosY   = calc.thumbPosY( this._v, trackHeight, thumbHeight );
		const thumbPosX   = calc.thumbPosX( this._v, trackWidth, thumbWidth );

		//Position Calculation
		const atTop    = scrollTop <= 0;
		const atLeft   = scrollLeft <= 0;
		const atBottom = scrollTop >= maxScrollTop;
		const atRight  = scrollLeft >= maxScrollLeft;

		//Size Calculations
		const widerThanClient  = scrollWidth > clientWidth;
		const tallerThanClient = scrollHeight > clientHeight;

		//Scrollbars required
		const requireVertical   = tallerThanClient;
		const requireHorizontal = widerThanClient;
		const requireBoth       = widerThanClient && tallerThanClient;
		const requireNone       = !requireVertical && !requireHorizontal;

		const data = {
			scrollLeft,
			scrollTop,
			scrollWidth,
			scrollHeight,
			clientWidth,
			clientHeight,
			maxScrollTop,
			maxScrollLeft,
			scrollbarWidth,
			trackHeight,
			trackWidth,
			thumbHeight,
			thumbWidth,
			thumbPosY,
			thumbPosX,
			atTop,
			atLeft,
			atBottom,
			atRight,
			widerThanClient,
			tallerThanClient,
			requireVertical,
			requireHorizontal,
			requireBoth,
			requireNone,
			//movementDetected,
			//hasMovement
		};

		this.delivery.save( {
			posTop     : scrollTop,
			posLeft    : scrollLeft,
			scrollableX: scrollWidth,
			scrollableY: scrollHeight
		} ); //todo: complete the list

		this.previous.reset( this.current.data );
		this.current.save( data );
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
	updateThumbs(){
		const { showHorizontal, showVertical } = this.props;
		const { thumbWidth, thumbHeight, thumbPosY, thumbPosX, requireHorizontal, requireVertical } = this.current.data;

		// if the user request configure to show Horizontal
		if ( showHorizontal ) {
			css( this._htn, {
				width: requireHorizontal ? thumbWidth : 0,
				...( requireHorizontal && {
					transform: `translateX(${thumbPosX}px)`
				} )
			} );
		}

		// if the user request configure to show Vertical
		if ( showVertical ) {
			css( this._vtn, {
				height: requireVertical ? thumbHeight : 0,
				...( requireVertical && {
					transform: `translateY(${thumbPosY}px)`
				} )
			} );
		}
	},

	/**
	 * Shows or hides trackbar accordingly to [ showVertical | showHorizontal ] Props.
	 */
	updateTracks(){
		const { showHorizontal, showVertical, hideUnnecessary } = this.props;
		let hDisplay = showHorizontal ? 'block' : 'none';
		let vDisplay = showVertical ? 'block' : 'none';

		if ( hideUnnecessary ) {
			const { requireVertical, requireHorizontal } = this.current.data;
			if ( !requireHorizontal ) hDisplay = 'none';
			if ( !requireVertical ) vDisplay = 'none';
		}

		// if the user request configure to show Horizontal
		css( this._ht, { display: hDisplay } );
		// if the user request configure to show Vertical
		css( this._vt, { display: vDisplay } );
	},

	/**
	 * Callback function to move directly the View using requestAnimationFrame as an
	 * interface for such movement
	 * @param object
	 * @param axis
	 * @param newPosition
	 */
	moveViewDirectly(object, axis, newPosition){
		if ( axis === VER ) object.scrollTop = newPosition;
		if ( axis === HOR ) object.scrollLeft = newPosition;
		this.update();
	},


	/**
	 * Display the bars for a given time
	 */
	flashBars(axis = BOTH, time = null){
		if ( this.props.autoHide && (time || this.props.flashTime > 0) ) {
			this.needsFlash = true;
			if ( axis === VER || axis === BOTH ) this.needsFlashY = true;
			if ( axis === HOR || axis === BOTH ) this.needsFlashX = true;
			this.showTracks();
			this.hideTracks( time || this.props.flashTime );
			this.needsFlash  = false;
			this.needsFlashY = false;
			this.needsFlashX = false;
		}
	},

	/**
	 * Manages the showing process according to "Sync" and "autoHide" Props,
	 * hiding a single track o both when autoHide is enabled
	 */
	showTracks(){
		const { syncTracks, autoHide, expandTracks } = this.props;
		if ( !autoHide && !expandTracks ) return;

		if ( syncTracks ) {
			this.showSyncedTracks();
			return;
		}

		this.showUnSyncedTracks( VER );
		this.showUnSyncedTracks( HOR );
	},

	/**
	 * Manages the showing process according to Sync = true and autoHide = true,
	 */
	showSyncedTracks(){
		const { mouseOverTrack, scrolling, dragging } = this.global.data;
		const { requireVertical, requireHorizontal } = this.current.data;
		const { showVertical, showHorizontal, expandTracks, autoHide } = this.props;
		const needsFlash = this.needsFlash; //!this.hasInit && flashTime > 0;

		//Don't show on hover, it is supposed to remain hidden until scroll
		if ( (!this.isObjectVisible( this._vt ) || !this.isObjectVisible( this._ht )) && !scrolling && !dragging && !needsFlash ) {
			return;
		}

		//Expand
		if ( requireVertical && showVertical && expandTracks && mouseOverTrack && !needsFlash ) this._vt.classList.add( this.cssClasses.expanded );
		if ( requireHorizontal && showHorizontal && expandTracks && mouseOverTrack && !needsFlash ) this._ht.classList.add( this.cssClasses.expanded );
		//Hide
		if ( autoHide && requireVertical && showVertical && ( !needsFlash || this.needsFlashY ) ) css( this._vt, { opacity: 1 } );
		if ( autoHide && requireHorizontal && showHorizontal && (!needsFlash || this.needsFlashX) ) css( this._ht, { opacity: 1 } );
	},

	/**
	 * Manages the showing process according to Sync = false and autoHide = true,
	 * @param axis
	 */
	showUnSyncedTracks(axis){
		const { mouseOverTrackX, mouseOverTrackY, scrollingDir, draggingDir } = this.global.data;
		const { requireVertical, requireHorizontal } = this.current.data;
		const { showVertical, showHorizontal, expandTracks } = this.props;
		const isVer      = axis === VER;
		const isHor      = axis === HOR;
		const needsFlash = this.needsFlash;//!this.hasInit && flashTime > 0;

		//If not configured or needed to be shown
		if ( (isVer && !showVertical) || (isHor && !showHorizontal) ||
			(isVer && !requireVertical) || (isHor && !requireHorizontal) ) {
			return;
		}

		//Don't show on hover, it is supposed to remain hidden until scroll
		if ( !this.isObjectVisible( isVer ? this._vt : this._ht ) && !scrollingDir && !draggingDir && !needsFlash ) {
			return;
		}

		// Validations if performing dragging or scrolling
		if ( (((draggingDir && draggingDir !== axis) || (scrollingDir && scrollingDir !== axis)) && !needsFlash) ) {
			return;
		}

		//Expand
		if ( isVer && expandTracks && mouseOverTrackY && !needsFlash ) this._vt.classList.add( this.cssClasses.expanded );
		if ( isHor && expandTracks && mouseOverTrackX && !needsFlash ) this._ht.classList.add( this.cssClasses.expanded );
		//Hide
		if ( (isVer && !needsFlash) || ( isVer && this.needsFlashY ) ) css( this._vt, { opacity: 1 } );
		if ( (isHor && !needsFlash) || ( isHor && this.needsFlashX ) ) css( this._ht, { opacity: 1 } );
	},

	/**
	 * Manages the hiding process according to "Sync" and "autoHide" Props,
	 * hiding a single track o both when autoHide is enabled
	 * @param timeout
	 */
	hideTracks(timeout = null){

		const { syncTracks, autoHide, expandTracks } = this.props;
		if ( !autoHide && !expandTracks ) return;

		if ( syncTracks ) {
			this.hideSyncedTracks( timeout );
			return;
		}

		this.hideUnSyncedTracks( timeout, VER );
		this.hideUnSyncedTracks( timeout, HOR );
	},

	/**
	 * Manages the hiding process of Both tracks when autoHide = true and Sync = true,
	 * receives a timeout
	 * @param time
	 */
	hideSyncedTracks(time = null){
		const { mouseOverTrack, scrolling, dragging } = this.global.data;
		const { expandTracks, autoHideTimeout } = this.props;
		const selectedTimeout = time || autoHideTimeout;

		//If the track is performing scroll or drag, then return
		if ( scrolling || dragging ) return;

		//If it's already hidden, clear the timeouts, if any and return
		if ( !this.isObjectVisible( this._vt ) && !this.isObjectVisible( this._ht ) ) {
			clearTimeout( this.global.data.autoHideTimeout );
			clearTimeout( this.global.data.expandedTimeout );
			return;
		}

		if ( expandTracks ) {
			//If timeout is running, cancel before start over
			clearTimeout( this.global.data.expandedTimeout );
			this.global.data.expandedTimeout = setTimeout(
				this.shrinkTimeoutCallback.bind( this, this._vt, this._ht ),
				selectedTimeout / 3
			);
		}

		//If timeout is running, cancel before start over
		clearTimeout( this.global.data.autoHideTimeout );
		this.global.data.autoHideTimeout = setTimeout(
			this.hideTimeoutCallback.bind( this, this._vt, this._ht ),
			expandTracks && mouseOverTrack ? selectedTimeout * 1.3 : selectedTimeout
		);

	},

	/**
	 * Manages the hiding process of Both tracks when autoHide = true and Sync = false,
	 * receives a timeout and the axis to manage
	 * @param time
	 * @param axis
	 */
	hideUnSyncedTracks(time = null, axis = null){
		const { mouseOverTrackX, mouseOverTrackY, scrollingDir, draggingDir } = this.global.data;

		//If the track is performing scroll or drag, then return
		if ( scrollingDir === axis || draggingDir === axis ) return;

		const { expandTracks, autoHideTimeout } = this.props;

		const isVer             = axis === VER;
		const timeoutName       = 'autoHideTimeout' + (isVer ? 'Y' : 'X');
		const timeoutNameShrink = 'expandedTimeout' + (isVer ? 'Y' : 'X');
		const selectedTimeout   = time || autoHideTimeout;
		const selectedTrack     = isVer ? this._vt : this._ht;

		//If it's already hidden, clear the timeouts, if any and return
		if ( !this.isObjectVisible( selectedTrack ) ) {
			clearTimeout( this.global.data[ timeoutName ] );
			clearTimeout( this.global.data[ timeoutNameShrink ] );
			return;
		}

		if ( expandTracks ) {
			//If timeout is running, cancel before start over
			clearTimeout( this.global.data[ timeoutNameShrink ] );
			this.global.data[ timeoutNameShrink ] = setTimeout(
				this.shrinkTimeoutCallback.bind( this, ...(isVer ? [ selectedTrack, null ] : [ null, selectedTrack ]) ),
				selectedTimeout / 3
			);
		}

		//If timeout is running, cancel before start over
		clearTimeout( this.global.data[ timeoutName ] );
		this.global.data[ timeoutName ] = setTimeout(
			this.hideTimeoutCallback.bind( this, ...(isVer ? [ selectedTrack, null ] : [ null, selectedTrack ]) ),
			expandTracks && ( (isVer && mouseOverTrackY) || (!isVer && mouseOverTrackX) ) ? selectedTimeout * 1.3 : selectedTimeout
		);

	},

	/**
	 * Handles the timeout function to hide the tracks on autoHide = true
	 * @param trackV
	 * @param trackH
	 */
	hideTimeoutCallback(trackV = null, trackH = null){
		const isVer     = trackV && trackH ? true : trackV ? true : false;
		const isHor     = trackV && trackH ? true : trackH ? true : false;
		const isBoth    = isVer && isHor;
		const scrolling = this.global.data[ 'scrolling' + (isBoth ? '' : 'Dir') ] === ( isBoth ? true : isVer ? VER : HOR );
		const dragging  = this.global.data[ 'dragging' + (isBoth ? '' : 'Dir') ] === ( isBoth ? true : isVer ? VER : HOR );

		if ( !this.global.data[ 'mouseOverTrack' + ( isBoth ? '' : isVer ? 'Y' : 'X') ] && !scrolling && !dragging ) {
			if ( trackV ) css( trackV, { opacity: 0 } );
			if ( trackH ) css( trackH, { opacity: 0 } );
		}
	},

	/**
	 * Handles the timeout function to contract the tracks on expandedTracks = true
	 * @param trackV
	 * @param trackH
	 */
	shrinkTimeoutCallback(trackV = null, trackH = null){
		const trackToCheck = trackV && trackH ? '' : trackV ? 'Y' : 'X';
		if ( !this.global.data[ 'mouseOverTrack' + trackToCheck ] ) {
			if ( trackV ) trackV.classList.remove( this.cssClasses.expanded );
			if ( trackH ) trackH.classList.remove( this.cssClasses.expanded );
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
	onScrollStart_actions(){
		//this._c.classList.add( this.cssClasses.scrolling );

		this.showTracks();
		this.proxyUserEvents( this.props.onScrollStart, null, true );
	},

	/**
	 * Actions to perform when scroll changes axis in the same capturing process
	 */
	onScrollChangeDirection(){
		if ( this.props.syncTracks ) return;
		this.showTracks();
		this.hideTracks();
	},

	/**
	 * Actions to perform when scroll ends
	 */
	onScrollEnd_actions(){
		//this._c.classList.remove( this.cssClasses.scrolling );

		this.proxyUserEvents( this.props.onScrollEnd, null, true );
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
	scrollProcessDelegate(event){

		//Detect direction, axis, movementDelta, etc
		this.filterAndExtractScrollData( event );

		//Ignore Movements not required
		const { usableMovement } = this.global.data;

		//Some not usable movements need to give a feed back to the user,
		// like showing the bars
		if ( usableMovement !== OK ) {
			if ( usableMovement === OFF_LIMIT_Y ) {
				this.flashBars( VER );
			}
			if ( usableMovement === OFF_LIMIT_X ) {
				this.flashBars( HOR );
			}
			return;
		}
		if( event.type === WHEEL ){
		    return;
        }
        //console.log( "passing",event.type, event.deltaY, event.deltaX );
		//Scroll Actions
		this.manageRequestActionFrame( event, this.update );
		this.proxyUserEvents( this.props.onScroll, event, true );
		this.detectScrolling();
	},

	/**
	 * Inspects the event to calculate the movement according to it,
	 * using DeltaX and DeltaY for Wheel event or calculating position
	 * if other. Detects unnecessary events, like those on wheel events.
	 * @param event
	 */
	filterAndExtractScrollData(event){
		const values       = this.doCalculations(event);
		let axisToListen   = NONE;
		let directionX     = NONE;
		let directionY     = NONE;
		let usableMovement = OK;

		const { type, deltaY, deltaX } = event;
		const { requireBoth, requireNone, requireHorizontal, requireVertical } = values;
        //console.log( event );
		//The content doesn't need to scroll
		if ( requireNone ) {
			this.current.save( { direction: NONE, directionX: NONE, directionY: NONE } );
			usableMovement = ZERO;
			this.global.save( { usableMovement } );
			return;
		}

		// If it's wheel, check the movement, track-pads sends data in both directions x and y,
		// so we have to calculate something before decide where to move
		if ( type === WHEEL ) {

			const { atBottom, atTop, atLeft, atRight } = values;

			//Both deltas have no information about movement
			if ( deltaX === 0 && deltaY === 0 ) {
				usableMovement = ZERO;
				if ( atBottom || atTop || atLeft || atRight ) {
					usableMovement = OFF_LIMIT;
					this.preventScroll( event );
				}
				this.global.save( { usableMovement } );
				return;
			}

			//If we need both scrollbars, we need to check which axis has more movement
			axisToListen = requireBoth
				? calc.axisDelta( deltaX, deltaY )
				: calc.axisRequired( requireHorizontal, requireVertical );


			//No movement in axis to listen
			if ( (axisToListen === VER && deltaY === 0) || (axisToListen === HOR && deltaX === 0) ) {
				usableMovement = ZERO;
				this.global.save( { usableMovement } );
				return;
			}

			// If we should listen to the Y axis.
			if ( axisToListen === VER ) {

				//At bottom or top we have to call to prevent default if it's needed
				if ( (values.atBottom && deltaY >= 0) || (values.atTop && deltaY <= 0) ) {
					usableMovement = OFF_LIMIT_Y;
					this.preventScroll( event );
				}

				//Save the direction and prevailing axis
				directionY = deltaY > 0 ? DOWN : UP;
			}

			// If we should listen to the X axis.
			else if ( axisToListen === HOR ) {

				//At right-end or left-end we have to call to prevent default if it's needed
				if ( (values.atRight && deltaX >= 0) || (values.atLeft && deltaX <= 0) ) {
					usableMovement = OFF_LIMIT_X;
					this.preventScroll( event );
				}

				//Save the direction and prevailing axis
				directionX = deltaX > 0 ? RIGHT : LEFT;
			}

			//On direction change, discard minimal or accidental moves trough different axis
			if ( this.current.data.direction !== axisToListen ) {
				//probably an over sensitive scroll
				if ( Math.abs( deltaY ) < 2 || Math.abs( deltaX ) < 2 ) {
					usableMovement = ZERO;
				}
			}

			//Save the direction and prevailing axis
			this.current.save( { direction: axisToListen, directionX, directionY } );

		}
		else {

			const movement = calc.movement( this.current.data, this.previous.data );

			//Saving the movement detected
			if ( movement.direction !== NONE ) {
				this.current.save( movement );
			}
			//Probably a Scroll event fired just after the Wheel, so no info is detected
			else {
				usableMovement = ZERO;
			}

		}

		this.limitEventCalls( event );
		this.global.save( { usableMovement } );
	},

	/**
	 * When the callbacks passed as props need to be called, we need to make sure we don't trigger them more than once
	 * if nothing has change, eg: When Calling atBottom but user scrolls down again, the the action should be triggered
	 * once
	 * @param event
	 */
	limitEventCalls(event){
		const { atBottomCalled, atTopCalled, atRightCalled, atLeftCalled, hasEverMoveDown, hasEverMoveRight } = this.global.data;
		const { atBottom, atTop, atRight, atLeft, direction, directionY, directionX } = this.current.data;

		if ( direction === VER ) {
			if ( atBottom && directionY === DOWN && !atBottomCalled ) {
				//event.persist();
				this.proxyUserEvents( this.props.atBottom, event, true );
				this.global.data.atBottomCalled = true;
				this.global.data.atTopCalled    = false;
			}
			else if ( atTop && directionY === UP && !atTopCalled && hasEverMoveDown ) {
				//event.persist();
				this.proxyUserEvents( this.props.atTop, event, true );
				this.global.data.atTopCalled    = true;
				this.global.data.atBottomCalled = false;
			}
			else if ( !atTop && !atBottom ) {
				this.global.data.atTopCalled    = false;
				this.global.data.atBottomCalled = false;
			}
			if ( directionY === DOWN ) {
				this.global.data.hasEverMoveDown = true;
			}
		}


		if ( direction === HOR ) {

			if ( atRight && directionX === RIGHT && !atRightCalled ) {
				//event.persist();
				this.proxyUserEvents( this.props.atRight, event, true );
				this.global.data.atRightCalled = true;
				this.global.data.atLeftCalled  = false;
			}
			else if ( atLeft && directionX === LEFT && !atLeftCalled && hasEverMoveRight ) {
				//event.persist();
				this.proxyUserEvents( this.props.atLeft, event, true );
				this.global.data.atLeftCalled  = true;
				this.global.data.atRightCalled = false;
			}
			else if ( !atLeft && !atRight ) {
				this.global.data.atLeftCalled  = false;
				this.global.data.atRightCalled = false;
			}
			if ( directionX === RIGHT ) {
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
	manageRequestActionFrame(event = null, callback = utils.noop, object = 'raf'){
		//Cancel Existing Request Animation Frames
		if ( this.current.data[ object ] ) {
			raf.cancel( this.current.data[ object ] );
			if ( event && !this.props.passiveEvent ) event.preventDefault();
			if ( event && !this.props.passiveEvent ) event.stopPropagation();
		}
		this.current.save( {
			[object]: raf( callback )
		} );
	},

	/**
	 * Creates an interval to monitor when the scroll process
	 * has finished in order to do some operations
	 */
	detectScrolling() {
		const { scrollingDir } = this.global.data;
		const { direction } = this.current.data;

		// If Scrolling process already started but there is a change
		// of axis in the middle of detection, just call start actions again
		// to show the scrollbar for the new axis
		if ( scrollingDir !== direction && this.global.data.scrolling ) {
			this.global.save( {
				scrolling   : true,
				ticking     : true,
				scrollingDir: direction
			} );

			this.onScrollChangeDirection( scrollingDir );
			return;
		}

		//Exit if already detected
		if ( this.global.data.scrolling ) return;

		//Store the flags
		this.global.save( {
			scrolling   : true,
			ticking     : true,
			scrollingDir: direction
		} );

		//Call onScrollStart actions, internal and from props
		this.onScrollStart_actions();

		//create an interval
		this.global.data.interval = setInterval( ()=> {

			const { scrollTop, scrollLeft } = this.current.data;
			const { detectingPointX, detectingPointY } = this.global.data;

			//if scroll has stopped
			if ( detectingPointX === scrollLeft && detectingPointY === scrollTop ) {
				clearInterval( this.global.data.interval );
				this.global.save( {
					scrolling   : false,
					ticking     : false,
					scrollingDir: false
				} );

				//Call onScrollEnd actions, internal and from props
				this.onScrollEnd_actions();
			}

			this.global.save( {
				detectingPointY: scrollTop,
				detectingPointX: scrollLeft
			} );

		}, 100 );
	},


	/**
	 * Handles the prevent scrolling, if it's enabled
	 * then it's applied
	 * @param event
	 */
	preventScroll(event){
		if ( this.props.preventScrolling && !this.props.passiveEvent ) {
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
	visualUpdates(){
		this.updateThumbs();
		this.updateTracks();
	},

	/**
	 * Applies the changes detected
	 */
	update(){

		//de-activate requestAnimationFrame
		this.current.data.raf          = undefined;
		this.current.data.rafScrollbar = undefined;
		this.current.data.rafDragging  = undefined;

		if ( this.needsReCalculation ) {
			this.doCalculations( null, this.needsUpdateData );
			this.needsReCalculation = false;
			this.needsUpdateData    = false;

			const action = this.current.data.scrollbarWidth ? 'add' : 'remove';
			this._c.classList[ action ]( "sb2-has-scrollbar" );
		}

		this.visualUpdates();

		if ( this.hasInit ) {
			this.proxyUserEvents( this.props.onUpdate );
			this.proxyUserEvents( this.props.onScrollFrame, null, true );
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
	proxyUserEvents(callback = utils.noop, event = null, validateDirection = false){
		const { showVertical, showHorizontal } = this.props;
		const { direction } = this.current.data;
		const response = [];

		if ( event ) {
			response.push( event );
		}
		response.push( this.delivery.data );

		if ( !validateDirection ) {
			callback( ...response );
			return;
		}

		if ( (showVertical && direction === VER) ||
			(showHorizontal && direction === HOR) ) {
			callback( ...response );
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
	setupDrag(){

		//Save some data before change it
		this.dragging.save( {
			onselectstart: document.onselectstart
		} );

		//Add temporarily the class to the body to avoid unwanted selections
		document.body.classList.add( this.cssClasses.body );
		this._c.classList.add( this.cssClasses.dragging );

		//Add events
		document.addEventListener( 'mousemove', this.onDrag );
		document.addEventListener( 'mouseup', this.onDragEnd );
		document.onselectstart = utils.falseNoop();
	},

	/**
	 * All actions made my the setup needs to be undone
	 * to make every thing as it was
	 */
	tearDownDrag(){
		//Restore some data
		document.body.classList.remove( this.cssClasses.body );
		document.onselectstart = this.dragging.data.onselectstart;
		this._c.classList.remove( this.cssClasses.dragging );

		//Remove Events
		document.removeEventListener( 'mousemove', this.onDrag );
		document.removeEventListener( 'mouseup', this.onDragEnd );
	},


	/* ··································
	 DRAG EVENT ACTIONS
	 ·································· */

	/**
	 * Starts the process of dragging
	 * @param event
	 */
	onDragStart(event){
		const { target } = event;

		//Saving Scrolling data
		this.global.save( {
			dragging   : true,
			draggingDir: target === this._vtn ? VER : HOR
		} );

		event.stopPropagation();
		this.setupDrag( event );
	},

	/**
	 * Drag process itself, Managed by document.mousemove
	 * @returns {boolean}
	 */
	onDrag(event){

		if ( this.dragging.data.prevPosY ) {
			const { clientY } = event;
			const { top: trackTop } = this._vt.getBoundingClientRect();
			const thumbHeight   = this.current.data.thumbHeight;
			const clickPosition = thumbHeight - this.dragging.data.prevPosY;
			const offset        = -trackTop + clientY - clickPosition;
			this.manageRequestActionFrame( null,
				this.moveViewDirectly.bind( this, this._v, VER, this.getScrollTopForOffset( offset ) ), 'rafDragging'
			);
		}

		if ( this.dragging.data.prevPosX ) {
			const { clientX } = event;
			const { left: trackLeft } = this._ht.getBoundingClientRect();
			const thumbWidth    = this.current.data.thumbWidth;
			const clickPosition = thumbWidth - this.dragging.data.prevPosX;
			const offset        = -trackLeft + clientX - clickPosition;
			this.manageRequestActionFrame( null,
				this.moveViewDirectly.bind( this, this._v, HOR, this.getScrollLeftForOffset( offset ) ), 'rafDragging'
			);
		}

		return false;
	},

	/**
	 * End of dragging
	 */
	onDragEnd(){

		//Reset Values
		this.global.save( {
			dragging   : false,
			draggingDir: false
		} );
		this.dragging.save( {
			prevPosX: null,
			prevPosY: null,
		} );

		this.tearDownDrag();
		this.hideTracks();
	},


	/* ··································
	 DRAG EVENT HELPERS
	 ·································· */
	getScrollTopForOffset(offset) {
		const { scrollHeight, clientHeight, thumbHeight } = this.current.data;
		return offset / (clientHeight - thumbHeight) * (scrollHeight - clientHeight);
	},
	getScrollLeftForOffset(offset) {
		const { scrollWidth, clientWidth, thumbWidth } = this.current.data;
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
	onScroll(event){
		this.scrollProcessDelegate( event );
	},


	/**
	 * Update positions and sizes after window resize
	 */
	onResize(){
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
	setMouseOver(target, status){
		const isHorizontal = target === this._ht || target === this._htn;
		const isVertical   = target === this._vt || target === this._vtn;
		this.global.save( {
			...( this.props.syncTracks && { mouseOverTrack: status }),
			...( isHorizontal && !this.props.syncTracks && { mouseOverTrackX: status } ),
			...( isVertical && !this.props.syncTracks && { mouseOverTrackY: status } ),
		} );
	},
	onMouseEnterTrack(event){
		this.setMouseOver( event.target, true );
		this.showTracks();
	},
	onMouseLeaveTrack(event){
		this.setMouseOver( event.target, false );
		this.hideTracks();
	},


	onMouseDownVerticalTrack(event){
		this.scrollToTop( calc.posY( event, this.current.data ) );
	},
	onMouseDownHorizontalTrack(event){
		this.scrollToLeft( calc.posX( event, this.current.data ) );
	},

	onScrollBarAndThumb(event){
		const { deltaX, deltaY } = event;
		const isHorizontal = event.target === this._ht || event.target === this._htn;
		const isVertical   = event.target === this._vt || event.target === this._vtn;


		if ( deltaY && isVertical ) {
			if ( this._vt.style.opacity > 0 && (deltaY > 0 || deltaY < 0) ) {
				event.preventDefault();
				this.manageRequestActionFrame( null, this.moveViewDirectly.bind( this, this._v, VER, this._v.scrollTop + deltaY ), 'rafScrollbar'
				);
			}
		}
		if ( deltaX && isHorizontal ) {
			if ( this._ht.style.opacity > 0 && (deltaX > 0 || deltaX < 0) ) {
				event.preventDefault();
				this.manageRequestActionFrame( null, this.moveViewDirectly.bind( this, this._v, HOR, this._v.scrollLeft + deltaX ), 'rafScrollbar'
				);
			}
		}
	},

	/* ··································
	 THUMB'S EVENTS
	 ·································· */

	onMouseEnterThumb(event){
		//... possible action on hover
	},

	onMouseLeaveThumb(){
		//... possible action on hover
	},

	onMouseDownThumbHorizontal(event){

		this.onDragStart( event );
		const { target, clientX } = event;
		const { offsetWidth } = target;
		const { left } = target.getBoundingClientRect();
		this.dragging.data.prevPosX = offsetWidth - (clientX - left);
	},

	onMouseDownThumbVertical(event){

		this.onDragStart( event );
		const { target, clientY } = event;
		const { offsetHeight } = target;
		const { top } = target.getBoundingClientRect();
		this.dragging.data.prevPosY = offsetHeight - (clientY - top);
	},


	/* *********************************************************** */
	/*    A P I   M E T H O D S
	 /* *********************************************************** */

	scrollToTop(top = 0){
		const { requireVertical, requireBoth } = this.current.data;

		if ( this.props.showVertical && ( requireVertical || requireBoth ) ) {
			this._v.scrollTop = top;
		}
	},
	scrollToBottom(bottom = 0){
		const { requireVertical, requireBoth, maxScrollTop } = this.current.data;

		if ( this.props.showVertical && ( requireVertical || requireBoth ) ) {
			this._v.scrollTop = maxScrollTop - bottom;
		}
	},
	scrollToLeft(left = 0){
		const { requireHorizontal, requireBoth } = this.current.data;

		if ( this.props.showHorizontal && ( requireHorizontal || requireBoth ) ) {
			this._v.scrollLeft = left;
		}
	},
	scrollToRight(right = 0){
		const { requireHorizontal, requireBoth, maxScrollLeft } = this.current.data;

		if ( this.props.showHorizontal && ( requireHorizontal || requireBoth ) ) {
			this._v.scrollLeft = maxScrollLeft - right;
		}
	},

	disable(){
		this.removeWindowListeners();
		this.enable = false;
	},

	enable(){
		this.addWindowListeners();
		this.enable = true;
	},

	forceVisualUpdate( includeScrollBarWidth= false ){
		if( includeScrollBarWidth ){
			//noinspection JSUnresolvedVariable
			this.sBarWidth = false;
		}
		this.needsUpdateData    = true;
		this.needsReCalculation = true;
		this.update();
	},


	/**
	 * Evaluates opacity of given object
	 * @param target
	 * @returns {boolean}
	 */
	isObjectVisible(target) {

		const { autoHide } = this.props;

		if ( target === this._vt ) {
			if ( this._vt.style.opacity > 0 && autoHide ) {
				return true;
			}
			else if ( this._vt.style.display === 'block' && !autoHide ) {
				return true;
			}
		}

		if ( target === this._ht ) {
			if ( this._ht.style.opacity > 0 && autoHide ) {
				return true;
			}
			else if ( this._ht.style.display === 'block' && !autoHide ) {
				return true;
			}
		}

		return false;
	},


	/* *********************************************************** */
	/*    I N L I N E   S T Y L E S
	 /* *********************************************************** */

	getContainerStyle(){

		const { autoHeight, autoHeightMin, autoHeightMax } = this.props;

		return {
			position: 'relative',
			overflow: 'hidden',
			width   : '100%',
			...( autoHeight && {
				height   : 'auto',
				minHeight: autoHeightMin,
				maxHeight: autoHeightMax
			}),
			...( !autoHeight && {
				height: '100%',
			}),
			...this.props.style,
			...this.props.containerStyle,
		};

	},

	getViewStyle(){

		const { autoHeight, autoHeightMin, autoHeightMax, showHorizontal, showVertical } = this.props;
		const { scrollbarWidth } = this.current.data;

		return {

			overflowX              : showHorizontal ? 'scroll' : 'hidden',
			overflowY              : showVertical ? 'scroll' : 'hidden',
			WebkitOverflowScrolling: 'touch',
			marginRight            : scrollbarWidth ? -scrollbarWidth : 0,
			marginBottom           : scrollbarWidth ? -scrollbarWidth : 0,

			...( autoHeight && {
				position : 'relative',
				minHeight: autoHeightMin + scrollbarWidth,
				maxHeight: autoHeightMax + scrollbarWidth
			}),

			...( !autoHeight && {
				position: 'absolute',
				top     : 0,
				left    : 0,
				right   : 0,
				bottom  : 0
			}),
			...this.props.viewStyle
		};
	},

	getTracksStyle(axis){
		const { showVertical, showHorizontal, autoHide } = this.props;

		return {
			position: 'absolute',
			zIndex  : 1,
			right   : 0,
			bottom  : 0,
			...( axis === VER && {
				display: showVertical ? 'block' : 'none',
				top    : 0
			} ),
			...( axis === HOR && {
				display: showHorizontal ? 'block' : 'none',
				left   : 0
			} ),
			...( autoHide && {
				opacity: 0
			}),
			...this.props.tracksStyle
		};

	},

	getThumbsStyle(){
		return {
			position: 'relative',
			display : 'block',
			cursor  : 'default',
			...this.props.thumbsStyle
		};
	},

	quickRefs(){
		this._c   = this.refs[ 'container' ];
		this._v   = this.refs[ 'view' ];
		this._ht  = this.refs[ 'trackHorizontal' ];
		this._vt  = this.refs[ 'trackVertical' ];
		this._htn = this.refs[ 'thumbHorizontal' ];
		this._vtn = this.refs[ 'thumbVertical' ];
	},

	delayableInit(){
		this.forceVisualUpdate();
		this.flashBars( VER );
		this.hasInit = true;
	},

	/* *********************************************************** */
	/*    C O M P O N E N T   L I F E C Y C L E
	 /* *********************************************************** */

	componentWillMount(){

		this.setupData();
		this.global.save( {
			stylesheetObject: new utils.StyleInserter( this.styleTagId, this.styleClass, true )
		} );
		this.global.data.stylesheetObject.setRulesFromParsed( this.props.parsedStyle || defaultParsedStyle, this.props.parsedStyle );

	},

	componentDidMount(){
		this.quickRefs();
		this.addWindowListeners();

		if ( this.props.flashTimeDelay === 0 ) {
			this.delayableInit();
			return;
		}

		//Delay the flash and initial calculation until client is ready
		const initTimeOut = setTimeout( ()=> {
			this.delayableInit();
			clearTimeout( initTimeOut );
		}, this.props.flashTimeDelay );
	},

	componentDidUpdate(){
		console.clear();
		if ( this.props.updateOnUpdates ) {
			this.needsUpdateData    = true;
			this.needsReCalculation = true;
			this.update();
		}

		this.global.data.stylesheetObject.setRulesFromParsed( this.props.parsedStyle || defaultParsedStyle, this.props.parsedStyle );
	},

	componentWillUnmount(){
		this.removeWindowListeners();
		clearInterval( this.global.data.interval );

		//Clear autoHide Timeouts
		clearTimeout( this.global.data.autoHideTimeout );
		clearTimeout( this.global.data.autoHideTimeoutX );
		clearTimeout( this.global.data.autoHideTimeoutY );

		//Clear Expand Tracks Timeouts
		clearTimeout( this.global.data.expandedTimeout );
		clearTimeout( this.global.data.expandedTimeoutX );
		clearTimeout( this.global.data.expandedTimeoutY );

		//Cancel requestAnimationFrames
		if ( this.global.data.raf ) raf.cancel( this.global.data.raf );
		if ( this.global.data.rafScrollbar ) raf.cancel( this.global.data.rafScrollbar );
		if ( this.global.data.rafDragging ) raf.cancel( this.global.data.rafDragging );

		//Style
		this.global.data.stylesheetObject.cleanUp();
	},


	/* *********************************************************** */
	/*    R E N D E R
	 /* *********************************************************** */

	render(){

		const { container, view, vTrack, hTrack, vThumb, hThumb } = this.cssStyles;

		return (
			<div className={this.cssClasses.container} ref="container" style={container} {...this.evt.container}>

				{/* MAIN VIEW */}
				<div className={this.cssClasses.view} key="theView" ref="view" tabIndex='0' style={ view }>
					{this.props.children}
				</div>

				{/* HORIZONTAL scroll track and thumb */}
				<div className={this.cssClasses.hTrack} ref='trackHorizontal' style={hTrack} {...this.evt.hTrack}>
					<div className={this.cssClasses.hThumb} ref='thumbHorizontal' style={hThumb} {...this.evt.hThumb} />
				</div>

				{/* VERTICAL scroll track and thumb */}
				<div className={this.cssClasses.vTrack} ref='trackVertical' style={vTrack} {...this.evt.vTrack}>
					<div className={this.cssClasses.vThumb} ref='thumbVertical' style={vThumb} {...this.evt.vThumb} />
				</div>

			</div>
		)
	}
} );

export default Scrollbars2;
