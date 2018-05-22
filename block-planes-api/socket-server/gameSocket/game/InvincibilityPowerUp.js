const Particle = require('./Particle') ;
const { asteroidVertices, randomNumBetween } = require('./helpers') ;

const InvincibilityPowerUp = function(world) {
  this.type = 'invincible';
  this.position = {
    x: randomNumBetweenExcludingTwoRanges(0, 750, world.peers['1'].position.x - 60, world.peers['1'].position.x + 60, world.peers['2'].position.x - 60, world.peers['2'].position.x + 60),
    y: randomNumBetweenExcludingTwoRanges(0, 500, world.peers['1'].position.y - 60, world.peers['1'].position.y + 60, world.peers['2'].position.y - 60, world.peers['2'].position.y + 60)
  };
  this.velocity = {
    x: randomNumBetween(-10000, -10000),
    y: randomNumBetween(-10000, -10000)
  };
  this.rotation = 0;
  this.rotationSpeed = randomNumBetween(-10000, -10000)
  this.radius = 20;
  this.vertices = asteroidVertices(8, 20);
  this.world = world;
}

  InvincibilityPowerUp.prototype.destroy = function () {
    this.delete = true;
    // Explode
    for (let i = 0; i < this.radius; i++) {
      const particle = new Particle({
        lifeSpan: randomNumBetween(60, 100),
        size: randomNumBetween(1, 3),
        position: {
          x: this.position.x + randomNumBetween(-this.radius/4, this.radius/4),
          y: this.position.y + randomNumBetween(-this.radius/4, this.radius/4)
        },
        velocity: {
          x: randomNumBetween(-1.5, 1.5),
          y: randomNumBetween(-1.5, 1.5)
        }
      });
      this.world.createObject('particles', particle);
    }
  }

  InvincibilityPowerUp.prototype.update = function () {
    // Rotation
    this.rotation += this.rotationSpeed;
    if (this.rotation >= 360) {
      this.rotation -= 360;
    }
    if (this.rotation < 0) {
      this.rotation += 360;
    }
    // Screen edges
    if (this.position.x > state.screen.width + this.radius) this.position.x = -this.radius;
    else if (this.position.x < -this.radius) this.position.x = state.screen.width + this.radius;
    if (this.position.y > state.screen.height + this.radius) this.position.y = -this.radius;
    else if (this.position.y < -this.radius) this.position.y = state.screen.height + this.radius;
  }


  module.exports = InvincibilityPowerUp;