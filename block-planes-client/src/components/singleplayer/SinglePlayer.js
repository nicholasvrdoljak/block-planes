import React, { Component } from 'react';
import Ship from './Ship';
import Asteroid from './Asteroid';
import Fasteroid from './Fasteroid';
import Masteroid from './Masteroid';
import Blasteroid from './Blasteroid';
import InvincibilityPowerUp from './InvincibilityPowerUp';
import SpeedPowerUp from './SpeedPowerUp';
import FireRatePowerUp from './FireRatePowerUp';
import { randomNumBetweenExcluding, randomNumBetween } from './helpers'
import { connect } from "react-redux";
import axios from 'axios';
import style from './style.css';


const mapStateToProps = state => {
  return {
    ship: state.selectedPlane,
    userId: state.id,
    contract: state.contract,
    userPlanes: state.userPlanes,
    userAddress: state.userAddress,
    selectedPlane: state.selectedPlane
  };
};

const KEY = {
  LEFT:  37,
  RIGHT: 39,
  UP: 38,
  A: 65,
  D: 68,
  W: 87,
  SPACE: 32
};

class ConnectedSinglePlayer extends Component {
  constructor() {
    super();
    this.state = {
      screen: {
        width: 1600,
        height: 900,
        ratio: window.devicePixelRadio || 1
      },
      // context: null,
      keys : {
        left  : 0,
        right : 0,
        up    : 0,
        down  : 0,
        space : 0,
      },
      asteroidCount: 1,
      fasteroidCount: 0,
      masteroidCount: 0,
      blasteroidCount: 0,
      currentScore: 0,
      lives: 5,
      topScore: localStorage['topscore'] || 0,
      inGame: false,
      highScore: '',
      ship: ''
    }
    this.ship = [];
    this.asteroids = [];
    this.fasteroids = [];
    this.masteroids = [];
    this.blasteroids = [];
    this.bullets = [];
    this.blasteroidBullets = [];
    this.particles = [];
    this.invincibilityPowerUps = [];
    this.speedPowerUps = [];
    this.fireRatePowerUps = [];
  }

  handleResize(value, e){
    this.setState({
      screen : {
        width: window.innerWidth,
        height: window.innerHeight,
        ratio: window.devicePixelRatio || 1,
      }
    });
  }

  handleKeys(value, e){
    let keys = this.state.keys;
    if(e.keyCode === KEY.LEFT   || e.keyCode === KEY.A) keys.left  = value;
    if(e.keyCode === KEY.RIGHT  || e.keyCode === KEY.D) keys.right = value;
    if(e.keyCode === KEY.UP     || e.keyCode === KEY.W) keys.up    = value;
    if(e.keyCode === KEY.SPACE) keys.space = value;
    this.setState({
      keys : keys
    });
  }

  componentDidMount() {
    this.fetchHighScore();
    window.addEventListener('keyup',   this.handleKeys.bind(this, false));
    window.addEventListener('keydown', this.handleKeys.bind(this, true));
    window.addEventListener('resize',  this.handleResize.bind(this, false));

    const context = this.refs.canvas.getContext('2d');
    this.setState({ context: context });
    this.startGame();
    requestAnimationFrame(() => {this.update()});
  }
  
  componentWillUnmount() {
    window.removeEventListener('keyup', this.handleKeys);
    window.removeEventListener('keydown', this.handleKeys);
    window.removeEventListener('resize', this.handleResize);
  }
  
  update() {
    const context = this.state.context;
    const keys = this.state.keys;
    const ship = this.ship[0];
    
    context.save();
    context.scale(this.state.screen.ratio, this.state.screen.ratio);
    
    // Motion trail
    context.fillStyle = '#000';
    context.globalAlpha = 0.4;
    context.fillRect(0, 0, this.state.screen.width, this.state.screen.height);
    context.globalAlpha = 1;

    // Next set of asteroids
    if(!this.asteroids.length && !this.fasteroids.length && !this.masteroids.length && !this.blasteroids.length && this.ship.length){
      console.log('asteroid array', this.asteroids.length, 'asteroid count', this.state.asteroidCount);
      this.nextStage();
    }


    // Check for colisions
    this.checkCollisionsWith(this.bullets, this.asteroids);
    this.checkCollisionsWith(this.bullets, this.fasteroids);
    this.checkCollisionsWith(this.bullets, this.masteroids);
    this.checkCollisionsWith(this.bullets, this.blasteroids);
    this.checkCollisionsWith(this.ship, this.asteroids);
    this.checkCollisionsWith(this.ship, this.fasteroids);
    this.checkCollisionsWith(this.ship, this.masteroids);
    this.checkCollisionsWith(this.ship, this.blasteroids);
    this.checkCollisionsWith(this.ship, this.blasteroidBullets);
    this.checkCollisionsWith(this.ship, this.invincibilityPowerUps);
    this.checkCollisionsWith(this.ship, this.speedPowerUps);
    this.checkCollisionsWith(this.ship, this.fireRatePowerUps);

    // Remove or render
    this.updateObjects(this.particles, 'particles')
    this.updateObjects(this.asteroids, 'asteroids')
    this.updateObjects(this.fasteroids, 'fasteroids')
    this.updateObjects(this.masteroids, 'masteroids')
    this.updateObjects(this.blasteroids, 'blasteroids')
    this.updateObjects(this.invincibilityPowerUps, 'invincibilityPowerUps')
    this.updateObjects(this.speedPowerUps, 'speedPowerUps')
    this.updateObjects(this.fireRatePowerUps, 'fireRatePowerUps')
    this.updateObjects(this.bullets, 'bullets')
    this.updateObjects(this.blasteroidBullets, 'blasteroidBullets')
    this.updateObjects(this.ship, 'ship')

    context.restore();

    // Next frame
    requestAnimationFrame(() => {this.update()});
  }

  nextStage() {
    let component = this;
    const randomNum = Math.floor(Math.random() * (3 - 0 + 1) + 0);
    const randomAsteroidType = ['asteroid', 'fasteroid', 'masteroid', 'blasteroid'][randomNum] + 'Count';
    console.log('randomasteroidtype',randomAsteroidType, component.state[randomAsteroidType]);
    component.setState({
      [randomAsteroidType]: component.state[randomAsteroidType] + 1
    }, function() {
      console.log('state after adding asteroid count', component.state);
      component.generateAsteroids(component.state.asteroidCount);
      component.generateFasteroids(component.state.fasteroidCount);
      component.generateMasteroids(component.state.masteroidCount);
      component.generateBlasteroids(component.state.blasteroidCount);
    });
  }

  addScore(points){
    if(this.state.inGame){
      this.setState({
        currentScore: this.state.currentScore + points,
      });
    }
  }

  startGame() {
    console.log('running startGame', this.state);
    this.fetchHighScore();
    let component = this;
    this.setState({
      inGame: true,
      currentScore: 0,
      asteroidCount: 1,
      fasteroidCount: 0,
      masteroidCount: 0,
      blasteroidCount: 0,
      currentScore: 0,
      lives: 5
    }, function () {
      component.makeShip();
      this.asteroids = [];
      this.fasteroids = [];
      this.masteroids = [];
      this.blasteroids = [];
      this.invincibilityPowerUps = [];
      this.speedPowerUps = [];
      this.fireRatePowerUps = [];
      this.bullets = [];
      this.blasteroidBullets = [];
      this.particles = [];
      this.generateAsteroids(this.state.asteroidCount);
      this.generateFasteroids(this.state.fasteroidCount);
      this.generateMasteroids(this.state.masteroidCount);
      this.generateBlasteroids(this.state.blasteroidCount);
      this.invincibilityPowerUpCountdown();
      this.speedPowerUpCountdown();
      this.fireRatePowerUpCountdown();
      console.log('ending start game', this.state);
    });
  }

  makeShip() {
    console.log('ship str', this.props.ship, typeof this.props.ship);
    let ship = new Ship({
      attr: this.props.ship || 2222222222222222,
      position: {
        x: this.state.screen.width/2,
        y: this.state.screen.height/2
      },
      create: this.createObject.bind(this),
      // onDie: this.gameOver.bind(this)
      onDie: this.resetAfterDeath.bind(this)
    });
    this.createObject(ship, 'ship');
  }

  resetAfterDeath(){
    let component = this;
    this.setState({
      lives: component.state.lives - 1
    });
    if (component.state.lives < 1) {
      component.gameOver();
    } else {
      console.log('onDie', component.state.lives);
        setTimeout(function() {
          console.log('start',component.startGame);
          component.makeShip();
        }, 3000)
    }
  }

  gameOver(){
    this.setState({
      inGame: false,
    });

    this.addScoreToTotal();

    // Replace top score
    // if(this.state.currentScore > this.state.topScore){
    //   this.setState({
    //     topScore: this.state.currentScore,
    //   });
    //   localStorage['topscore'] = this.state.currentScore;
    // }
  }

  generateAsteroids(howMany){
    let asteroids = [];
    let ship = this.ship[0];
    for (let i = 0; i < howMany; i++) {
      let asteroid = new Asteroid({
        size: 80,
        position: {
          x: randomNumBetweenExcluding(0, this.state.screen.width, ship.position.x-60, ship.position.x+60),
          y: randomNumBetweenExcluding(0, this.state.screen.height, ship.position.y-60, ship.position.y+60)
        },
        create: this.createObject.bind(this),
        addScore: this.addScore.bind(this)
      });
      this.createObject(asteroid, 'asteroids');
    }
  }

  generateFasteroids(howMany){
    let fasteroids = [];
    let ship = this.ship[0];
    for (let i = 0; i < howMany; i++) {
      let fasteroid = new Fasteroid({
        size: 80,
        position: {
          x: randomNumBetweenExcluding(0, this.state.screen.width, ship.position.x-60, ship.position.x+60),
          y: randomNumBetweenExcluding(0, this.state.screen.height, ship.position.y-60, ship.position.y+60)
        },
        create: this.createObject.bind(this),
        addScore: this.addScore.bind(this)
      });
      this.createObject(fasteroid, 'fasteroids');
    }
  }

  generateMasteroids(howMany){
    let masteroids = [];
    let ship = this.ship[0];
    for (let i = 0; i < howMany; i++) {
      let masteroid = new Masteroid({
        size: 120,
        position: {
          x: randomNumBetweenExcluding(0, this.state.screen.width, ship.position.x-60, ship.position.x+60),
          y: randomNumBetweenExcluding(0, this.state.screen.height, ship.position.y-60, ship.position.y+60)
        },
        create: this.createObject.bind(this),
        addScore: this.addScore.bind(this)
      });
      this.createObject(masteroid, 'masteroids');
    }
  }

  generateBlasteroids(howMany){
    let blasteroids = [];
    let ship = this.ship[0];
    for (let i = 0; i < howMany; i++) {
      let blasteroid = new Blasteroid({
        size: 40,
        position: {
          x: randomNumBetweenExcluding(0, this.state.screen.width, ship.position.x-60, ship.position.x+60),
          y: randomNumBetweenExcluding(0, this.state.screen.height, ship.position.y-60, ship.position.y+60)
        },
        create: this.createObject.bind(this),
        addScore: this.addScore.bind(this)
      });
      this.createObject(blasteroid, 'blasteroids');
    }
  }

  generateInvincibilityPowerUp(){
    console.log('generating INV PU');
    let invincibilityPowerUps = [];
    let ship = this.ship[0];
    for (let i = 0; i < 1; i++) {
      let invincibilityPowerUp = new InvincibilityPowerUp({
        size: 20,
        position: {
          x: randomNumBetweenExcluding(0, this.state.screen.width, ship.position.x-60, ship.position.x+60),
          y: randomNumBetweenExcluding(0, this.state.screen.height, ship.position.y-60, ship.position.y+60)
        },
        create: this.createObject.bind(this)
      });
      this.createObject(invincibilityPowerUp, 'invincibilityPowerUps');
    }
  }

  invincibilityPowerUpCountdown() {
      console.log('inv pu start');
      let component = this;
      let randomNumber = randomNumBetween(10000, 20000)
      setTimeout(function() {
        console.log('set timeout');
        if (component.ship.length) {
          component.generateInvincibilityPowerUp();
        } else if (component.state.inGame) {
          console.log('dead, so waiting three seconds');
          setTimeout(function() {
            component.generateInvincibilityPowerUp();
          }, 3000)
        }
      }, randomNumber);
  }

  generateSpeedPowerUp(){
    console.log('generating INV PU');
    let speedPowerUps = [];
    let ship = this.ship[0];
    for (let i = 0; i < 1; i++) {
      let speedPowerUp = new SpeedPowerUp({
        size: 20,
        position: {
          x: randomNumBetweenExcluding(0, this.state.screen.width, ship.position.x-60, ship.position.x+60),
          y: randomNumBetweenExcluding(0, this.state.screen.height, ship.position.y-60, ship.position.y+60)
        },
        create: this.createObject.bind(this)
      });
      this.createObject(speedPowerUp, 'speedPowerUps');
    }
  }

  speedPowerUpCountdown() {
      console.log('inv pu start');
      let component = this;
      let randomNumber = randomNumBetween(10000, 20000)
      setTimeout(function() {
        console.log('set timeout');
        if (component.ship.length) {
          component.generateSpeedPowerUp();
        } else if (component.state.inGame) {
          console.log('dead, so waiting three seconds');
          setTimeout(function() {
            component.generateSpeedPowerUp();
          }, 3000)
        }
      }, randomNumber);
  }

  generateFireRatePowerUp(){
    console.log('generating FR PU');
    let fireRatePowerUps = [];
    let ship = this.ship[0];
    for (let i = 0; i < 1; i++) {
      let fireRatePowerUp = new FireRatePowerUp({
        size: 20,
        position: {
          x: randomNumBetweenExcluding(0, this.state.screen.width, ship.position.x-60, ship.position.x+60),
          y: randomNumBetweenExcluding(0, this.state.screen.height, ship.position.y-60, ship.position.y+60)
        },
        create: this.createObject.bind(this)
      });
      this.createObject(fireRatePowerUp, 'fireRatePowerUps');
    }
  }

  fireRatePowerUpCountdown() {
      console.log('FR pu start');
      let component = this;
      let randomNumber = randomNumBetween(10000, 20000)
      setTimeout(function() {
        console.log('set timeout');
        if (component.ship.length) {
          component.generateFireRatePowerUp();
        } else if (component.state.inGame) {
          console.log('dead, so waiting three seconds');
          setTimeout(function() {
            component.generateFireRatePowerUp();
          }, 3000)
        }
      }, randomNumber);
  }

  createObject(item, group){
    this[group].push(item);
  }

  updateObjects(items, group){
    let index = 0;
    for (let item of items) {
      if (item.delete) {
        this[group].splice(index, 1);
      }else{
        items[index].render(this.state);
      }
      index++;
    }
  }

  checkCollisionsWith(items1, items2) {
    var a = items1.length - 1;
    var b;
    for(a; a > -1; --a){
      b = items2.length - 1;
      for(b; b > -1; --b){
        var item1 = items1[a];
        var item2 = items2[b];
        if(this.checkCollision(item1, item2)){
          if (items2 === this.invincibilityPowerUps) {
            item1.invincibilityPowerUpEffect();
            item2.destroy();
            this.invincibilityPowerUpCountdown();
          } else if (items2 === this.speedPowerUps) {
            item1.speedPowerUpEffect();
            item2.destroy();
            this.speedPowerUpCountdown();
          } else if (items2 === this.fireRatePowerUps) {
            item1.fireRatePowerUpEffect();
            item2.destroy();
            this.fireRatePowerUpCountdown();
          } else {
          item1.destroy();
          item2.destroy();
          }
        }
      }
    }
  }


  checkCollision(obj1, obj2){
    var vx = obj1.position.x - obj2.position.x;
    var vy = obj1.position.y - obj2.position.y;
    var length = Math.sqrt(vx * vx + vy * vy);
    if(length < obj1.radius + obj2.radius){
      return true;
    }
    return false;
  }

  fetchHighScore() {
    let component = this;
    axios
      .get('/fetchHighScore', {
        params: {
          id: component.props.userId
        }
        })
      .then(response => {
        console.log('highscore', response);
          component.setState({
            highScore: response.data.high_score
          }, () => {
            // this.fetchRequests();
          });
      })
      .catch(err => {
        console.log('Error from login', err);
      });
  }

  addScoreToTotal() {
    console.log('adding score to total', {
      id: this.props.userId,
      score: this.state.currentScore
    });
    axios
      .post('/addScore', {
        id: this.props.userId,
        score: this.state.currentScore
      })
      .then(response => {
        console.log('score added to db');
      })
      .catch(err => {
        console.log('Error from handleCreateAccount', err);
      });
  }

  render() {
    let endgame;
    let message;
    let message2;

    if (this.state.currentScore <= 0) {
      message = 'Mission Failed!';
      message2 = 'Score: ' + this.state.currentScore;
    } else if (this.state.currentScore >= this.state.highScore){
      message = 'Mission Complete!';
      message2 = 'New High Score: ' + this.state.currentScore;
    } else {
      message = 'Mission Complete!';
      message2 = 'Score: ' + this.state.currentScore;
    }

    if(!this.state.inGame){
      endgame = (
        <div className="endgame">
          <p>{message}</p>
          <p>{message2}</p>
          <button className='buttongame'
            onClick={ this.startGame.bind(this) }>
            Play Again?
          </button>
        </div>
      )
    }

    return (
      <div>
        { endgame }

        <span className='stats'>
          <div className="score lives" >Lives: {this.state.lives}</div>
          <div className="score current-score" >Score: {this.state.currentScore}</div>
          <div className="score top-score" >High Score: {this.state.highScore}</div>
          <div className="barunderscore" ></div>
        </span>
        
        <canvas ref = "canvas" className = 'canvas-single-player'
          width={this.state.screen.width * this.state.screen.ratio}
          height={this.state.screen.height * this.state.screen.ratio}
        />
      </div>
    );
  }
}

const SinglePlayer = connect(mapStateToProps)(ConnectedSinglePlayer);

export default SinglePlayer;