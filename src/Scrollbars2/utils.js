/*
 *
 *  File: utils.js | Package: Scrollbars2
 *
 *  Author:    Miguel Zamora Serrano <mzamoras@backlogics.com>
 *  Created:   12 Sep, 2016 | 04:33 PM
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

window.sb2GlobalData                = window.sb2GlobalData || {};
window.sb2GlobalData.scrollbarWidth = window.sb2GlobalData.scrollbarWidth || null;

if ( window.sb2GlobalData.scrollbarWidth === null ) {
    window.sb2GlobalData.scrollbarWidth = calculateScrollbarWidth()
}

function calculateScrollbarWidthAsPromise( force = false ) {
    return new Promise( ( resolve ) => {
        calculateScrollbarWidth( force );
        resolve();
    } );
}

function calculateScrollbarWidth( force = false ) {

    if ( window.sb2GlobalData.scrollbarWidth !== null && !force ) {
        return window.sb2GlobalData.scrollbarWidth;
    }

    let div1, div2;

    div1 = document.createElement( 'div' );
    div2 = document.createElement( 'div' );

    div1.style.width = div2.style.width = div1.style.height = div2.style.height = '100px';
    div1.style.overflow = 'scroll';
    div2.style.overflow = 'hidden';

    document.body.appendChild( div1 );
    document.body.appendChild( div2 );

    window.sb2GlobalData.scrollbarWidth = Math.abs( div1.scrollHeight - div2.scrollHeight );

    document.body.removeChild( div1 );
    document.body.removeChild( div2 );

    return window.sb2GlobalData.scrollbarWidth;

}

const HOR        = "axis:x";
const VER        = "axis:y";
const AN         = "axis:none";
const emptyThumb = {
    size: 0,
    pos : 0
};

export class ScrollDataManager {

    init() {
        this.hasData     = false;
        this.hasPrevData = false;

        this.data     = {};
        this.dataTX   = {};
        this.dataTY   = {};
        this.prevData = {};
    }

    constructor( refs, props, emitter ) {

        this.refs    = refs;
        this.view    = refs['view'];
        this.tX      = refs['trackHorizontal'];
        this.tY      = refs['trackVertical'];
        this.tnX     = refs['thumbHorizontal'];
        this.tnY     = refs['thumbVertical'];
        this.props   = props;
        this.emitter = emitter;

        this.init();
        this.update();
    }

    /*** Collect Element Info ***/
    gatherDataFromElement( savePrev = true ) {

        if ( savePrev && this.hasData ) {
            this.prevData    = this.data;
            this.hasPrevData = true;
        }

        const tmpEl   = this.view;
        const tmpData = {};

        /** Basic Measures **/
        tmpData.barWidth = window.sb2GlobalData.scrollbarWidth;
        tmpData.scrollLeft   = tmpEl.scrollLeft;
        tmpData.scrollTop    = tmpEl.scrollTop;
        tmpData.scrollWidth  = tmpEl.scrollWidth;
        tmpData.scrollHeight = tmpEl.scrollHeight;
        tmpData.clientWidth  = tmpEl.clientWidth;
        tmpData.clientHeight = tmpEl.clientHeight;
        tmpData.trackHeight  = this.getInnerSize( VER );
        tmpData.trackWidth   = this.getInnerSize( HOR );

        /** Basic Calculations **/
        tmpData.maxScrollTop = tmpData.scrollHeight - tmpData.clientHeight;
        tmpData.maxScrollLeft = tmpData.scrollWidth - tmpData.clientWidth;
        tmpData.thumbWidth    = Number( ScrollDataManager.thumbSize( HOR, tmpData, this.props ).toFixed( 0 ) );
        tmpData.thumbHeight   = Number( ScrollDataManager.thumbSize( VER, tmpData, this.props ).toFixed( 0 ) );

        /** Movement Calculations **/
        tmpData.realMovY = tmpData.scrollTop - (!this.hasPrevData ? 0 : this.prevData.scrollTop);
        tmpData.realMovX = tmpData.scrollLeft - (!this.hasPrevData ? 0 : this.prevData.scrollLeft);

        /** Display Calculations **/
        tmpData.reqByDimensionsX = tmpData.scrollWidth > tmpData.clientWidth;
        tmpData.reqByDimensionsY = tmpData.scrollHeight > tmpData.clientHeight;
        tmpData.reqByConfigX     = this.props.showHorizontal;
        tmpData.reqByConfigY     = this.props.showVertical;
        tmpData.reqByMovementX   = tmpData.realMovX !== 0;
        tmpData.reqByMovementY   = tmpData.realMovY !== 0;

        tmpData.requireX = tmpData.scrollWidth > tmpData.clientWidth;
        tmpData.requireY = tmpData.scrollHeight > tmpData.clientHeight;

        tmpData.availableTrackX   = tmpData.reqByConfigX && ( tmpData.reqByDimensionsX || !this.props.hideUnnecessary);
        tmpData.availableTrackY   = tmpData.reqByConfigY && ( tmpData.reqByDimensionsY || !this.props.hideUnnecessary);
        tmpData.displayableTrackX = tmpData.availableTrackX && ((tmpData.realMovX && this.props.autoHide) || !this.props.autoHide);
        tmpData.displayableTrackY = tmpData.availableTrackY && ((tmpData.realMovY && this.props.autoHide) || !this.props.autoHide);
        tmpData.flashableTrackX   = tmpData.availableTrackX; //&& this.props.flashTime > 0;
        tmpData.flashableTrackY   = tmpData.availableTrackY; //&& this.props.flashTime > 0;

        tmpData.displayableThumbX = tmpData.availableTrackX;
        tmpData.displayableThumbY = tmpData.availableTrackY;

        //tmpData.displayableThumbX = tmpData.displayableTrackX && tmpData.thumbWidth !== tmpData.clientWidth;
        //tmpData.displayableThumbY = tmpData.displayableTrackY && tmpData.thumbHeight !== tmpData.clientHeight;

        /*tmpData.displayableTrackX = (tmpData.requireX || !this.props.hideUnnecessary) && this.props.showHorizontal;
         tmpData.displayableTrackY = (tmpData.requireY || !this.props.hideUnnecessary) && this.props.showVertical;
         tmpData.displayableThumbX = tmpData.displayableTrackX && tmpData.thumbWidth !== tmpData.clientWidth;
         tmpData.displayableThumbY = tmpData.displayableTrackY && tmpData.thumbHeight !== tmpData.clientHeight;*/


        this.data    = tmpData;
        this.hasData = true;
    }

    gatherDataFromThumbs() { //debugger;

        const tx    = this.tnX.style.transform.match( /X\((.*)px/ );
        const ty    = this.tnY.style.transform.match( /Y\((.*)px/ );
        this.dataTX = {
            pos    : Number( tx ? tx[1] : 0 ),
            size   : Number( this.tnX.style.width.replace( 'px', '' ) || 0 ),
            opacity: Number( this.tnX.style.opacity || 0 )
        };
        this.dataTY = {
            pos    : Number( ty ? ty[1] : 0 ),
            size   : Number( this.tnY.style.height.replace( 'px', '' ) || 0 ),
            opacity: Number( this.tnY.style.opacity || 0 )
        };
    }

    getInnerSize( axis ) {
        const el         = axis === VER ? this.tY : this.tX;
        const offsetSize = axis === VER ? el.offsetHeight : el.offsetWidth;

        const style         = window.getComputedStyle ? getComputedStyle( el, null ) : el.currentStyle;
        const marginLeft    = parseInt( style.marginLeft, 10 ) || 0;
        const marginRight   = parseInt( style.marginRight, 10 ) || 0;
        const marginTop     = parseInt( style.marginTop, 10 ) || 0;
        const marginBottom  = parseInt( style.marginBottom, 10 ) || 0;
        const paddingLeft   = parseInt( style.paddingLeft, 10 ) || 0;
        const paddingRight  = parseInt( style.paddingRight, 10 ) || 0;
        const paddingTop    = parseInt( style.paddingTop, 10 ) || 0;
        const paddingBottom = parseInt( style.paddingBottom, 10 ) || 0;
        const borderLeft    = parseInt( style.borderLeftWidth, 10 ) || 0;
        const borderRight   = parseInt( style.borderRightWidth, 10 ) || 0;
        const borderTop     = parseInt( style.borderTopWidth, 10 ) || 0;
        const borderBottom  = parseInt( style.borderBottomWidth, 10 ) || 0;
        const borders       = axis === VER ? borderTop + borderBottom : borderLeft + borderRight;
        const margins       = axis === VER ? marginTop + marginBottom : marginLeft + marginRight;
        const paddings      = axis === VER ? paddingTop + paddingBottom : paddingLeft + paddingRight;

        return offsetSize - (borders + margins + paddings);
    }

    update( force = false ) {
        if ( force ) {
            return calculateScrollbarWidthAsPromise( force ).then( () => {
                this.gatherDataFromElement();
                return this.data;
            } );
        }
        calculateScrollbarWidth();
        this.gatherDataFromElement();
        return this.data;
    }

    /** PUBLIC **/


    /*** STATICS ***/
    static thumbSize( axis, dataSource, props ) {

        const windowSize   = axis === VER ? dataSource.clientHeight : dataSource.clientWidth;
        const contentSize  = axis === VER ? dataSource.scrollHeight : dataSource.scrollWidth;
        const trackSize    = axis === VER ? dataSource.trackHeight : dataSource.trackWidth;
        const contentRatio = windowSize / contentSize;

        const size      = trackSize * contentRatio;
        const minSize   = props.thumbMinSize;
        const finalSize = minSize > size ? minSize : size;

        return finalSize - (dataSource.barWidth / 2) + 2;
    }

    static thumbPos( axis, dataSource, thumbSize ) {

        const windowSize  = axis === VER ? dataSource.clientHeight : dataSource.clientWidth;
        const contentSize = axis === VER ? dataSource.scrollHeight : dataSource.scrollWidth;
        const trackSize   = axis === VER ? dataSource.trackHeight : dataSource.trackWidth;

        const scrollAreaSize      = contentSize - windowSize;
        const windowPosition      = axis === VER ? dataSource.scrollTop : dataSource.scrollLeft;
        const windowPositionRatio = windowPosition / (scrollAreaSize || 1);
        const trackScrollAreaSize = trackSize - thumbSize;

        return trackScrollAreaSize * windowPositionRatio;
    }


    /*** PROPS TO RESOLVE ***/

    get values() {
        return this.data;
    }

    get previous() {
        return this.prevData;
    }

    get hasMovX() {
        return this.data.realMovX > 0 || this.data.realMovX < 0;
    }

    get hasMovY() {
        return this.data.realMovY > 0 || this.data.realMovY < 0;
    }

    get atTop() {
        return this.data.scrollTop <= 0 && this.data.reqByDimensionsY;
    }

    get atBottom() {
        return this.data.scrollTop >= this.data.maxScrollTop - 1 && this.data.reqByDimensionsY;
    }

    get atLeft() {
        return this.data.scrollLeft <= 0 && this.data.reqByDimensionsX;
    }

    get atRight() {
        return this.data.scrollLeft >= this.data.maxScrollLeft - 1 && this.data.reqByDimensionsX;
    }

    get thumbData() {
        const axisX = this.data.requireX ? Object.assign( {}, emptyThumb ) : {};
        axisX.size  = this.data.thumbWidth;

        axisX.pos         = Number( ScrollDataManager.thumbPos( HOR, this.data, axisX.size ).toFixed( 3 ) );
        axisX.sizeChanged = !this.dataTX.size === axisX.size;
        axisX.posChanged  = !this.dataTX.pos === axisX.pos;

        const axisY       = this.data.requireY ? Object.assign( {}, emptyThumb ) : {};
        axisY.size        = this.data.thumbHeight;
        axisY.pos         = Number( ScrollDataManager.thumbPos( VER, this.data, axisY.size ).toFixed( 3 ) );
        axisY.sizeChanged = !(this.dataTY.size === axisY.size);
        axisY.posChanged  = !(this.dataTY.pos === axisY.pos);


        return {
            x: axisX,
            y: axisY
        }
    }

}

const SCROLL = 'scroll';
const WHEEL  = 'wheel';
const DOWN   = 'down';
const UP     = 'up';
const LEFT   = 'left';
const RIGHT  = 'right';
const NONE   = 'none';

export class MovementManager {

    init( event = { type: AN } ) {

        this.values = this.dataManager.values;


        this.event     = event;
        this.eventType = event ? this.event.type : null;

        this.isScroll = event ? this.eventType === SCROLL : false;
        this.isWheel  = event ? this.eventType === WHEEL : false;

        this.direction = event ? this.getEventAxis() : AN;
        this.isX       = event ? this.direction.isX : false;
        this.isY       = event ? this.direction.isY : false;

        this.movementAllowedY = this.props.showVertical || false;
        this.movementAllowedX = this.props.showHorizontal || false;

        this.movementRequiredY = this.values.requireY;
        this.movementRequiredX = this.values.requireX;

        this.needY = this.movementAllowedY && this.movementRequiredY && this.isY;
        this.needX = this.movementAllowedX && this.movementRequiredX && this.isX;

        this.needYWithMovement = this.needY && this.dataManager.hasMovY;
        this.needXWithMovement = this.needX && this.dataManager.hasMovX;

        this.lastValidDirection = this.direction.axis === AN ? this.lastValidDirection : this.direction;
    }


    constructor( dataManager, passedProps, emitter ) {
        this.dataManager        = dataManager;
        this.props              = passedProps;
        this.emitter            = emitter;
        this.scrollTimer        = null;
        this.scrolling          = false;
        this.lastValidDirection = AN;
        this.scrollStarted      = false;

        this.atTopEmitted    = false;
        this.atBottomEmitted = false;
        this.atLeftEmitted   = false;
        this.atRightEmitted  = false;

        this.init();
    }

    shouldContinue() {
        this.startTimer();
        this.scrolling = true;

        this.edgeChecker();

        //Event is explorable
        if ( (this.needYWithMovement || this.needXWithMovement) && this.isScroll ) {
            this.emitter.emit( 'scroll:scrolling' );
            return true;
        }

        if ( this.isWheel ) {
            const isDeltaUp      = this.event.deltaY <= 0;
            const isDeltaDown    = this.event.deltaY >= 0;
            const isDeltaLeft    = this.event.deltaX <= 0;
            const isDeltaRight   = this.event.deltaX >= 0;
            let preventScrolling = false;


            if ( this.isY && isDeltaUp && this.dataManager.atTop && this.needY ) {
                //console.log( "at atTop actions" );
                preventScrolling = true;
            }

            if ( this.isY && isDeltaDown && this.dataManager.atBottom && this.needY ) {
                //console.log( "at atBottom actions" );
                preventScrolling = true;
            }

            if ( this.isX && isDeltaLeft && this.dataManager.atLeft && this.needX ) {
                //console.log( "at atLeft actions" );
                preventScrolling = true;
            }

            if ( this.isX && isDeltaRight && this.dataManager.atRight && this.needX ) {
                //console.log( "at atRight actions" );
                preventScrolling = true;
            }

            if ( this.props.preventScrolling && preventScrolling ) {
                this.event.preventDefault();
            }

            return false;
        }
    }

    edgeMarker( obj ) {
        const object = obj + 'Emitted';
        if ( this[object] ) return;
        this[object] = true;
        this.emitter.emit( 'scroll:' + obj );
    }

    edgeChecker() {

        const dir                                  = this.direction.dir;
        const { atTop, atBottom, atLeft, atRight } = this.dataManager;

        if ( !atTop && !atBottom ) {
            this.atTopEmitted    = false;
            this.atBottomEmitted = false;
        }
        if ( !atLeft && !atRight ) {
            this.atLeftEmitted  = false;
            this.atRightEmitted = false;
        }

        if ( this.dataManager.atTop && dir === UP ) {
            this.edgeMarker( 'atTop' );
        }

        if ( this.dataManager.atBottom && dir === DOWN ) {
            this.edgeMarker( 'atBottom' );
        }

        if ( this.dataManager.atLeft && dir === LEFT ) {
            this.edgeMarker( 'atLeft' );
        }

        if ( this.dataManager.atRight && dir === RIGHT ) {
            this.edgeMarker( 'atRight' );
        }

    }

    setEvent( event ) {
        this.init( event );
        if ( !this.scrollStarted ) {
            this.emitter.emit( 'scroll:start' );
            this.scrollStarted = true;
        }
        return this;
    }


    getEventAxis() {

        const dx   = this.isScroll ? this.values.realMovX : this.event.deltaX;
        const dy   = this.isScroll ? this.values.realMovY : this.event.deltaY;
        const dirY = dy === 0 ? NONE : dy > 0 ? DOWN : UP;
        const dirX = dx === 0 ? NONE : dx > 0 ? RIGHT : LEFT;

        const deltaX = (dx * (dx > 0 ? 1 : -1)) || 0;
        const deltaY = (dy * (dy > 0 ? 1 : -1)) || 0;

        const majorDelta = deltaX > deltaY ? deltaX : deltaY > deltaX ? deltaY : -1;

        const directionRes = {
            dx,
            dy,
            deltaX,
            deltaY,
            et: this.eventType
        };

        directionRes.axis    = majorDelta === deltaY ? VER : majorDelta === deltaX ? HOR : AN;
        directionRes.isX     = directionRes.axis === HOR;
        directionRes.isY     = directionRes.axis === VER;
        directionRes.dir     = directionRes.isY ? dirY : dirX;
        directionRes.isUp    = directionRes.isY && dirY === UP;
        directionRes.isDown  = directionRes.isY && dirY === DOWN;
        directionRes.isLeft  = directionRes.isX && dirX === LEFT;
        directionRes.isRight = directionRes.isX && dirX === RIGHT;

        return directionRes;
    }


    startTimer() {
        if ( this.scrolling ) return;

        this.scrollTimer = setInterval( () => {

            this.scrolling = false;
            clearInterval( this.scrollTimer );
            if ( !this.scrolling ) {
                this.scrollStarted = false;
                this.emitter.emit( 'scroll:end' );
            }

        }, 100 );
    }
}


const noop      = () => null;
const noopFalse = () => false;
const noopTrue  = () => false;

export class DraggingManager {

    constructor( refs, scrollDataManager ) {
        this.draggingCSSClass    = 'sb2-dragging';
        this.dragging            = false;
        this.direction           = null;
        this.prevPositionX       = null;
        this.prevPositionY       = null;
        this.onSelectStartKeeper = null;
        this.target              = null;

        this.tX   = refs['trackHorizontal'];
        this.tY   = refs['trackVertical'];
        this.tnX  = refs['thumbHorizontal'];
        this.tnY  = refs['thumbVertical'];
        this.view = refs['view'];

        this.data = scrollDataManager.values;

        this.eventsSetup     = { passive: false, capture: true };
        this.onDragBinded    = this.onDrag.bind( this );
        this.onDragEndBinded = this.onDragEnd.bind( this );
    }

    setup() {
        //Save some data before change it
        this.onSelectStartKeeper = document.onselectstart;

        //Add events
        document.addEventListener( 'mousemove', this.onDragBinded, this.eventsSetup );
        document.addEventListener( 'mouseup', this.onDragEndBinded, this.eventsSetup );
        document.onselectstart = noopFalse();

        //Add Styles
        document.body.classList.add( this.draggingCSSClass );
    }

    tearDown() {
        //Restore data and events
        document.onselectstart = this.onSelectStartKeeper;

        //Remove Events
        document.removeEventListener( 'mousemove', this.onDragBinded, this.eventsSetup );
        document.removeEventListener( 'mouseup', this.onDragEndBinded, this.eventsSetup );

        //Remove Styles
        document.body.classList.remove( this.draggingCSSClass );
    }

    onDragStart( event ) {
        event.stopPropagation();

        const { target, clientY, clientX }  = event;
        const { offsetHeight, offsetWidth } = target;
        const { top, left }                 = target.getBoundingClientRect();

        this.dragging  = true;
        this.direction = target === this.tnY ? VER : HOR;

        if ( this.direction === VER ) this.prevPositionY = offsetHeight - (clientY - top);
        if ( this.direction === HOR ) this.prevPositionX = offsetWidth - (clientX - left);

        this.setup();
    }

    onDrag( event ) {

        const { clientX, clientY }          = event;
        const { top }                       = this.tY.getBoundingClientRect();
        const { left }                      = this.tX.getBoundingClientRect();
        const { thumbHeight, thumbWidth }   = this.data;

        const clickPositionY = thumbHeight - this.prevPositionY;
        const clickPositionX = thumbWidth - this.prevPositionX;
        const offsetY        = -top + clientY - clickPositionY;
        const offsetX        = -left + clientX - clickPositionX;

        if ( this.prevPositionY ) {
            this.move( VER, this.getScrollTopForOffset( offsetY ) );
        }
        if ( this.prevPositionX ) {
            this.move( HOR, this.getScrollLeftForOffset( offsetX ) );
        }

        return false;
    }

    onDragEnd() {

        this.dragging  = false;
        this.direction = null;
        this.tearDown();
    }

    move( axis, newPosition ) {
        if ( axis === VER ) this.view.scrollTop = newPosition;
        if ( axis === HOR ) this.view.scrollLeft = newPosition;
    }

    getScrollTopForOffset( offset ) {
        const { scrollHeight, clientHeight, thumbHeight } = this.data;
        return offset / (clientHeight - thumbHeight) * (scrollHeight - clientHeight);
    }

    getScrollLeftForOffset( offset ) {
        const { scrollWidth, clientWidth, thumbWidth } = this.data;
        return offset / (clientWidth - thumbWidth) * (scrollWidth - clientWidth);
    }

    onTrackClicked( event ) {
        this.direction = event.target === this.tY ? VER : HOR;
        const offset   = this.direction === VER
            ? this.getScrollTopForClickOffset( event )
            : this.getScrollLeftForClickOffset( event );
        this.move( this.direction, offset );
    }

    getScrollTopForClickOffset( event ) {
        const { target, clientY } = event;
        const { top }             = target.getBoundingClientRect();

        const { scrollHeight, clientHeight, thumbHeight, trackHeight } = this.data;

        const offset = Math.abs( top - clientY ) - thumbHeight / 2;
        return offset / (trackHeight - thumbHeight) * (scrollHeight - clientHeight);
    }

    getScrollLeftForClickOffset( event ) {
        const { target, clientX }  = event;
        const { left }             = target.getBoundingClientRect();

        const { scrollWidth, clientWidth, thumbWidth, trackWidth } = this.data;

        const offset = Math.abs( left - clientX ) - thumbWidth / 2;
        return offset / (trackWidth - thumbWidth) * (scrollWidth - clientWidth);
    }
}

export class ScrollingManager {

    constructor( refs, props, dataManager, movementManager, visualChangesManager ) {

        this.changesManager  = visualChangesManager;
        this.dataManager     = dataManager;
        this.props           = props;
        this.movementManager = movementManager;

        this.enabled         = true;
        this.scrolling       = false;
        this.raf             = null;
        this.autoHideTimeout = null;
        this.flashTimeout    = null;
        this.cancelHiding    = false;
        this.mouseOverX      = false;
        this.mouseOverY      = false;
        this.visibleX        = false;
        this.disableX        = false;
        this.visibleY        = false;
        this.disableY        = false;

        this.tX   = refs['trackHorizontal'];
        this.tY   = refs['trackVertical'];
        this.tnX  = refs['thumbHorizontal'];
        this.tnY  = refs['thumbVertical'];
        this.view = refs['view'];

        this.loopBinded = this.rafLoop.bind( this );
    }

    /*** Initializer ***/
    initialize() {
        this.initializeX();
        this.initializeY();
        this.flashBars( true );
    }

    initializeX() {
        const { availableTrackX }                     = this.dataManager.values;
        const { flashTime, flashTimeDelay, autoHide } = this.props;
        const startHidden                             = (flashTime > 0 && flashTimeDelay > 0 && autoHide) || ( autoHide && !flashTime );

        if ( availableTrackX ) {
            this.resizeThumbX();
            if ( startHidden ) {
                this.hideBar( HOR, true );
                this.hideBar( HOR );
            }
            else {
                this.showBar( HOR );
            }
            return;
        }
        this.hideBar( HOR, true );
    }

    initializeY() {
        const { availableTrackY }                     = this.dataManager.values;
        const { flashTime, flashTimeDelay, autoHide } = this.props;
        const startHidden                             = (flashTime > 0 && flashTimeDelay > 0 && autoHide) || ( autoHide && !flashTime );

        if ( availableTrackY ) {
            this.resizeThumbY();
            if ( startHidden ) {
                this.hideBar( VER, true );
                this.hideBar( VER );
            }
            else {
                this.showBar( VER );
            }
            return;
        }
        this.hideBar( VER, true );
    }

    /*** Events ***/
    onScroll( event ) {
        this.dataManager.update();
        this.movementManager.setEvent( event );
        this.movementManager.shouldContinue();

        if ( this.raf ) return;
        this.raf = window.requestAnimationFrame( this.loopBinded );
    }

    onScrollStart() {
        this.scrolling    = true;
        this.cancelHiding = false;
        this.changesManager.scrollingOn();
    }

    onScrolling() {

    }

    onScrollEnd() {
        window.cancelAnimationFrame( this.raf );
        this.raf       = undefined;
        this.scrolling = false;
        this.changesManager.scrollingOff();
        this.autoHide();
    }

    onMouseEnterTrack( event ) {

        const targetDirection = this.mouseEnterLeaveDetect( event.target );
        if ( targetDirection === HOR ) this.mouseOverX = true;
        if ( targetDirection === VER ) this.mouseOverY = true;

        clearTimeout( this.autoHideTimeout );
        this.autoHideTimeout = null;
    }

    onMouseLeaveTrack( event ) {

        const targetDirection = this.mouseEnterLeaveDetect( event.target );
        if ( targetDirection === VER ) this.mouseOverY = false;
        if ( targetDirection === HOR ) this.mouseOverX = false;

        this.autoHide();
    }

    mouseEnterLeaveDetect( target ) {
        return (target === this.tY || target === this.tnY)
            ? VER
            : (target === this.tX || target === this.tnX)
            ? HOR
            : NONE;
    }

    onScrollBarAndThumb( event ) {
        this.movementManager.setEvent( event, true );
        const { dx, dy, isX, isY }      = this.movementManager.direction;
        const { scrollTop, scrollLeft } = this.dataManager.values;

        if ( isY ) {
            this.toTop( scrollTop + dy );
        }
        if ( isX ) {
            this.toLeft( scrollLeft + dx );
        }
    }

    /*** animation frame ***/
    rafLoop() {
        this.rafActions();
        this.raf = window.requestAnimationFrame( this.loopBinded );
    }

    rafActions() {
        this.showBars();
        this.changesManager.applyChanges();
    }

    /*** changers ***/
    showBars() {
        const { displayableTrackX, displayableTrackY } = this.dataManager.values;

        if ( displayableTrackX ) {
            this.showBar( HOR );
            this.moveThumbX();
            this.resizeThumbX();
        }

        if ( displayableTrackY ) {
            this.showBar( VER );
            this.moveThumbY();
            this.resizeThumbY();
        }
    }

    showBar( axis, disable = false ) {
        //console.log("******", axis, disable, this.visibleY, this.visibleX);
        const object = axis === HOR ? this.tX : this.tY;
        if ( !disable ) {
            this.adjustCounterpart( axis, 'show' );
            this['visible' + ( axis === HOR ? 'X' : 'Y' )] = true;
            this.changesManager.removeClass( object, 'inactive' );

            if( this['disable' + ( axis === HOR ? 'X' : 'Y' )] === true ){
                this['disable' + ( axis === HOR ? 'X' : 'Y' )] = false
                this.changesManager.changeProperty( object, 'display', 'block' );
            }
            return;
        }
        this['disable' + ( axis === HOR ? 'X' : 'Y' )] = false;
        this.changesManager.changeProperty( object, 'display', 'block' );
    }

    hideBar( axis, disable = false ) {
        const object = axis === HOR ? this.tX : this.tY;
        if ( !disable ) {
            this.adjustCounterpart( axis, 'hide' );
            this['visible' + ( axis === HOR ? 'X' : 'Y' )] = false;
            this.changesManager.addClass( object, 'inactive' );
            return;
        }
        this['disable' + ( axis === HOR ? 'X' : 'Y' )] = true;
        this.changesManager.changeProperty( object, 'display', 'none' );
    }

    moveThumbX() {
        this.changesManager.changeProperty(
            this.tnX, 'transform', `translateX(${this.dataManager.thumbData.x.pos}px)`
        )
    }

    moveThumbY() {
        this.changesManager.changeProperty(
            this.tnY, 'transform', `translateY(${this.dataManager.thumbData.y.pos}px)`
        )
    }

    resizeThumbX() {
        this.changesManager.changeProperty(
            this.tnX, 'width', `${this.dataManager.thumbData.x.size}px`
        );
    }

    resizeThumbY() {
        this.changesManager.changeProperty(
            this.tnY, 'height', `${this.dataManager.thumbData.y.size}px`
        );
    }

    autoHide() {
        if ( this.props.autoHide ) {
            this.autoHideTimeout = setTimeout( () => {
                clearTimeout( this.autoHideTimeout );

                if ( !this.scrolling && !this.cancelHiding ) {
                    if ( !this.mouseOverX ) this.hideBar( HOR );
                    if ( !this.mouseOverY ) this.hideBar( VER );
                }
            }, this.props.autoHideTimeout );
        }
    }

    flashBars( useDelay = false ) {
        const { flashableTrackX, flashableTrackY } = this.dataManager.values;

        const flash = setTimeout( ()=> {

            if ( flashableTrackX ) this.showBar( HOR, true );
            if ( flashableTrackX ) this.showBar( HOR );
            if ( flashableTrackY ) this.showBar( VER, true );
            if ( flashableTrackY ) this.showBar( VER );
            clearTimeout( flash );

            if ( !this.props.autoHide ) return;

            this.flashTimeout = setTimeout( ()=> {

                clearTimeout( this.flashTimeout );
                if ( flashableTrackX && !this.mouseOverX ) this.hideBar( HOR );
                if ( flashableTrackY && !this.mouseOverY ) this.hideBar( VER );

            }, this.props.flashTime );
        }, useDelay ? this.props.flashTimeDelay : 0 );
    }

    adjustCounterpart( axis, action ) {
        const otherVisibility = axis === HOR ? this.visibleY : this.visibleX;
        const thisObject      = axis === HOR ? this.tX : this.tY;
        const otherObject     = axis === HOR ? this.tY : this.tX;

        if ( action === 'show' ) {
            if ( otherVisibility ) {
                this.changesManager.addClass( thisObject, 'shrinked' );
                this.changesManager.addClass( otherObject, 'shrinked' );
                this.changesManager.removeClass( thisObject, 'extended' );
                this.changesManager.removeClass( otherObject, 'extended' );
                return;
            }
            this.changesManager.addClass( thisObject, 'extended' );
            this.changesManager.removeClass( thisObject, 'shrinked' );
            return;
        }

        if( action === 'hide' ){

            this.changesManager.removeClass( thisObject, 'extended' );
            this.changesManager.removeClass( thisObject, 'shrinked' );

            if ( otherVisibility ) {
                this.changesManager.addClass( otherObject, 'extended' );
                this.changesManager.removeClass( otherObject, 'shrinked' );
            }

        }
    }


    toTop( top = 0 ) {
        if ( this.dataManager.values.availableTrackY ) this.view.scrollTop = top;
    }

    toBottom( bottom = 0 ) {
        if ( this.dataManager.values.availableTrackY )
            this.view.scrollTop = this.dataManager.values.maxScrollTop - bottom;
    }

    toLeft( left = 0 ) {
        if ( this.dataManager.values.availableTrackX ) this.view.scrollLeft = left;
    }

    toRight( right = 0 ) {
        if ( this.dataManager.values.availableTrackX )
            this.view.scrollLeft = this.dataManager.values.maxScrollLeft - right;
    }

    enable() {
        this.enabled = true;
    }

    disable() {
        this.enabled = false;
    }

    cancelFlash() {

    }
}

export class VisualChangesManager {
    constructor() {
        this.scrolling     = false;
        this.visualChanges = [];
    }

    scrollingOn() {
        this.scrolling = true;
    }

    scrollingOff() {
        this.scrolling = false;
    }

    addClass( object, cssClass, force = false ) {
        if ( this.scrolling && !force ) {
            this.storeChange( object, 'class', cssClass, 'add' );
            return;
        }
        object.classList.add( cssClass );
    }

    removeClass( object, cssClass, force = false ) {
        if ( this.scrolling && !force ) {
            this.storeChange( object, 'class', cssClass, 'remove' );
            return;
        }
        object.classList.remove( cssClass );
    }

    changeProperty( object, cssProperty, value, force = false ) {

        if ( this.scrolling && !force ) {
            this.storeChange( object, cssProperty, value, null );
            return;
        }

        object.style[cssProperty] = value;
    }

    storeChange( object, cssProperty, value, action ) {
        this.visualChanges.push( { object, cssProperty, value, action } );
    }

    applyChanges() {

        while ( this.visualChanges.length > 0 && this.scrolling ) {
            const currentChange = this.visualChanges.shift();

            const { object, cssProperty, value, action } = currentChange;

            if ( cssProperty === 'class' ) {
                if ( action === 'add' ) this.addClass( object, value, true );
                if ( action === 'remove' ) this.removeClass( object, value, true );
            }
            else {
                this.changeProperty( object, cssProperty, value, true );
            }
        }
    }
}

export class DisplayManager {

    constructor( refs ) {
        this.v = {
            track: refs['trackVertical'],
            thumb: refs['thumbVertical']
        };
        this.h = {
            track: refs['trackHorizontal'],
            thumb: refs['thumbHorizontal']
        };
    }


}

export class StyleManager {

    init() {

    }

    constructor( styleID, namespace = null ) {

        this.id          = styleID.toLowerCase();
        this.rawCSS      = null;
        this.parsedCSS   = null;
        this.cssOwner    = false;
        this.namespace   = (namespace || '').toLowerCase() || this.id;
        this.preExisted  = true;
        this.currentNode = document.getElementById( this.id ) || this.createDomNode();
        this.origin      = null;

        this.rex = {
            placeholder: /classNamePlaceholder/gm,
            ruleFinder : /([#.a-z]?[a-z_][\s\S]+?{[\s\S]*?})/gmi
        };
    }


    setParsedRules( rawCSS ) {
        if ( !rawCSS ) return;

        this.rawCSS = rawCSS;
        this.fixRawCSS();
        this.writeRules();
    }

    writeRules( forceNew = false ) {
        if ( !this.cssOwner && !forceNew ) return;
        if ( this.preExisted ) return;

        this.currentNode.innerHTML = this.parsedCSS;
    }

    fixRawCSS() {
        this.parsedCSS = this.rawCSS.replace( this.rex.placeholder, this.namespace );
    }

    createDomNode() {
        const node = document.createElement( 'style' );
        node.setAttribute( 'type', "text/css" );
        node.setAttribute( 'id', this.id );
        document.head.appendChild( node );
        this.preExisted = false;
        this.cssOwner   = true;
        return node;
    }


}