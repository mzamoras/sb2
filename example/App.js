/*
 *
 *  File: App.js | Package: Scrollbars2
 *
 *  Author:    Miguel Zamora Serrano <mzamoras@backlogics.com>
 *  Created:   08 Sep, 2016 | 06:26 PM
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

//require('./example.less');
import React from 'react';
//import Lorem from 'react-lorem-component';
// import Scrollbars2 from '../src/Scrollbars2/index';
import Scrollbars2 from '../dist/index';


const totalCards = 300;
const cards      = [];

for ( let i = 0; i < totalCards; i++ ) {
    cards.push( {
        name : "Card" + ( i + 1 ),
        index: i
    } )
}

const RCard = React.createClass( {
    
    getInitialState(){
        return {
            selected: false
        }
    },
    onClick(){
        this.setState( { selected: !this.state.selected } )
    },
    
    render(){
        const isOdd = this.props.data.index % 2;
        const baseClass = isOdd ? 'odd' : 'pair';
        const currentClass = 'sCard ' + baseClass + ( this.state.selected ? ' selected' : '' );
       /* const color1 = 'red';//"rgba( 0,0,0,0.2 )";
        const color2 = 'blue';//"rgba( 240,0,0,0.2 )";*/
        
        /*const color  = this.props.data.index % 2 ? color2 : color1;
        const currentClass = "sCard" + this.props.data.index % 2 ? 'pair' : 'odd';
        const styleX = {
            border      : "1px solid " + ( this.props.data.index % 2 ? color1 : color2 ),
            /!*width       : 120,
            height      : 80,
            display     : 'inline-block',
            marginRight : 10,
            marginBottom: 10,
            borderRadius: 4,*!/
            ...( this.state.selected && { backgroundColor: color } )
        };*/
        
        return (
            <div onClick={this.onClick} className={currentClass}>
                <div className="title">click on the card</div>
                <div className="content">{this.props.data.index}</div>
            </div>
        );
    }
} );


const App = React.createClass( {
    getInitialState(){
        return {
            topMessage: 'I\'m at the top'
        }
    },
    changeMessage(event){
        this.setState( { topMessage: event.target.value } );
    },
    
    onTop(...argsS){
        this.setState( { topMessage: "I'm at the top" } );
    },
    onBottom(){
        this.setState( { topMessage: "I'm at the bottom" } );
    },
    
    render(){
        const contentStyle = {
            border: "1px solid rgba(255,255,255,0.1)",
        };
        return (
            <Content>
                <div className="topBar">
                    <div className="title">Scrollbars2 v1</div>
                    <div>
                        <input value={this.state.topMessage} onChange={this.changeMessage}/>
                    </div>
                    
                </div>
                <Scrollbars2 autoHide={true} showHorizontal={true} atBottom={this.onBottom} atTop={this.onTop} expandTracks={true} containerStyle={contentStyle}>
                    <div style={{ width: '100%', padding:30 }}>
                        {cards.map( (c => {
                            return <RCard data={c} key={c.name}/>
                        }) )}
                    </div>
                </Scrollbars2>
                <div style={{width:"100%", height:500 }} >extra content</div>
            </Content>
        )
    }
    
} );

/*const style = {
    position       : 'absolute',
    width          : '100%',
    height         : '100%',
    // backgroundColor: '#252B39',
    backgroundColor: '#F1F1F1',
    overflow       : 'scroll',
    padding        : '60px 30px 30px 30px',
    // background     : 'linear-gradient(to left, #606c88 , #3f4c6b)',
    //color          : 'white'
    
};*/

const Content = React.createClass( {
    
    
    render(){
        return (
            <div className="appContainer">
                {this.props.children}
            </div>
        )
    }
} );

export default App;
