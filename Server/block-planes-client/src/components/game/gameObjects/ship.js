import Bullet from './bullet';
import Particle from './particle';
import { rotatePoint, randomNumBetween } from './helpers';
import shipRenderer from './shipRenderer.js';

export default class Ship {
    constructor(args) {
        this.id = args.id || null;
        this.attr = args.attr;
        this.player = args.player;
        this.position = args.position;
        this.targetPosition = args.position;
        this.velocity = { 
            x: 0, 
            y: 0
        };

        this.rotation = 0;
        this.targetRotation = 0;
        this.rotationSpeed = 6;
        this.radius = 20;
        this.lastShot = 0;
        this.delete = false;
        
        this.shadowColor = '#ffffff'
        this.glow = 500;

        this.create = args.create;
        this.emitUpdate = args.emitUpdate;

        this.invincible = true;
        this.speedy = false;

        let attributes = shipRenderer(args.attr);
        
        // ship characteristics
        this.bodyColor = attributes.bodyColor;
        this.wingShape = attributes.wingShape;
        this.wingColor = attributes.wingColor;
        this.tailShape = attributes.tailShape;
        this.tailColor = attributes.tailColor;
        this.cockpitShape = attributes.cockpitShape;
        this.cockpitColor = attributes.cockpitColor;
        this.speed = attributes.speed; // modify in arguments when called
        this.inertia = attributes.inertia; // modify in arguments when called
        this.shootingSpeed = attributes.shootingSpeed; // lower is better
        this.smokeColor = attributes.smokeColor;    
        this.ingame = args.ingame
        
        this.invincibleGlow = new Image();
        this.invincibleGlow.src = 'https://s3-us-west-1.amazonaws.com/blockplanes/yellow.png';
        this.speedyGlow = new Image();
        this.speedyGlow.src = 'https://s3-us-west-1.amazonaws.com/blockplanes/blue.png';
        this.bothPowerUpsGlow = new Image();
        this.bothPowerUpsGlow.src = 'https://s3-us-west-1.amazonaws.com/blockplanes/green.png';

        this.img1 = new Image();
        this.img1.src = `https://s3-us-west-1.amazonaws.com/blockplanes/bodies/body_${this.bodyColor}.png`;
        this.img2 = new Image();
        this.img2.src = `https://s3-us-west-1.amazonaws.com/blockplanes/wings/${this.wingShape}/wing_${this.wingShape}_${this.wingColor}.png`;
        this.img3 = new Image();
        this.img3.src = `https://s3-us-west-1.amazonaws.com/blockplanes/tails/${this.tailShape}/tail_${this.tailShape}_${this.tailColor}.png`;
        this.img4 = new Image();
        this.img4.src = `https://s3-us-west-1.amazonaws.com/blockplanes/cockpits/${this.cockpitShape}/cockpit_${this.cockpitShape}_${this.cockpitColor}.png`;

        setTimeout(this.makeVulnerable.bind(this), 3000);
    }

    destroy() {
        // set its delete property to true, for the game.jsx to delete on next render
        this.delete = true;
        this.ingame = false;
        // generate new 60 new particles in an explosion
        for (let i = 0; i < 60; i++) {
            let posDelta = rotatePoint({ x: 0, y: -55 }, { x: 0, y: 0 }, (this.rotation - 180) * Math.PI / 180);
            let x = this.position.x + posDelta.x + randomNumBetween(-2, 2);
            let y = this.position.y + posDelta.y + randomNumBetween(-2, 2);
            let size = randomNumBetween(1, 3);
            let lifeSpan = randomNumBetween(20, 40);
            let velocityx = posDelta.x / randomNumBetween(3, 5);
            let velocityy = posDelta.y / randomNumBetween(3, 5);

            const particle = new Particle({ lifeSpan, size, position: { x, y }, velocity: { x: velocityx, y: velocityy, }, owner: this.player, player: this.player });

            this.create(particle, 'particles', this.player);
            this.emitUpdate('particle_generated', {
                owner: this.player,
                position: { x, y },
                size,
                lifeSpan,
                velocity: { x: velocityx, y: velocityy },
                color: this.smokeColor,
            });
        }
    }

    update(updateObj) {
        this.targetPosition.x = updateObj.position.x;
        this.targetPosition.y = updateObj.position.y;
        this.targetRotation = updateObj.rotation;
        this.delete = updateObj.delete;
    }

    powerUp(powerUp) {
        if (powerUp.type === 'invincible') {
            this.invincible = true;
            setTimeout(() => this.makeVulnerable(), 5000);
        } else if (powerUp.type === 'speed') {
            this.speedy = true;
            this.speed += 0.75;
            this.inertia -= 0.05;
            setTimeout(() => this.slowDown(), 10000);
        }
    }
    
    slowDown() {
        this.speedy = false;
        this.speed -= 0.75;
        this.inertia += 0.05;
    }

    makeVulnerable() {
        this.invincible = false;
    }

    rotate(dir) {
        if (dir == 'LEFT') {
            this.rotation -= this.rotationSpeed;
        } else if (dir == 'RIGHT') {
            this.rotation += this.rotationSpeed;
        }
    }

    accelerate(val) {
        if (this.ingame) {
            this.velocity.x -= Math.sin(-this.rotation * Math.PI / 180) * this.speed;
            this.velocity.y -= Math.cos(-this.rotation * Math.PI / 180) * this.speed;
        }
        // Thruster particles
        let posDelta = rotatePoint({ x: 0, y: -35 }, { x: 0, y: 0 }, (this.rotation - 180) * Math.PI / 180);
        let x = this.position.x + posDelta.x + randomNumBetween(-2, 2);
        let y = this.position.y + posDelta.y + randomNumBetween(-2, 2);
        let size = randomNumBetween(1, 3);
        let lifeSpan = randomNumBetween(20, 40);
        let velocityx = posDelta.x / randomNumBetween(3, 5);
        let velocityy = posDelta.y / randomNumBetween(3, 5);

        const particle = new Particle({
            lifeSpan,
            size,
            position: { x, y },
            color: this.smokeColor,
            velocity: { x: velocityx, y: velocityy },
            owner: this.player, 
            player: this.player,
        });

        this.create(particle, 'particles', this.player);
        this.emitUpdate('particle_generated', { owner: this.player, 
                                                position: {x, y}, 
                                                size, 
                                                lifeSpan, 
                                                velocity: {x: velocityx, y: velocityy},
                                                color: this.smokeColor,
                                            });
    }

    // state is passed in from game.jsx (state = game.jsx's state)
    render(state) {
        if (this.ingame) {  
            if (this.player === this.id) {
                // *** YOU
                // if the specified buttons are pressed, activate the respective functions
                if (state.keys.up) {
                    this.accelerate(1, state);
                }   
                if (state.keys.left) {
                    this.rotate('LEFT');
                }
                if (state.keys.right) {
                    this.rotate('RIGHT');
                }
                if (state.keys.space && Date.now() - this.lastShot > this.shootingSpeed) {
                    // doesn't allow rapidly firing as quickly as you can press the spacebar
                    const bullet = new Bullet({
                        ship: this,
                        owner: this.player,
                        player: this.player,
                        rotation: this.rotation,
                    });
                    // this.create = this(game.jsx).createObject()
                    this.create(bullet, 'bullets', this.player);
                    this.lastShot = Date.now();
                    this.emitUpdate('player_shot', { owner: this.player, position: this.position, rotation: this.rotation });
                }
                // Move
                this.position.x += this.velocity.x;
                this.position.y += this.velocity.y;
                this.velocity.x *= this.inertia;
                this.velocity.y *= this.inertia;
                // Rotation
                if (this.rotation >= 360) {
                    this.rotation -= 360;
                }
                if (this.rotation < 0) {
                    this.rotation += 360;
                }
                // Screen edges
                // Roll from one edge to the opposite
                if (this.position.x > state.screen.width) this.position.x = 0;
                else if (this.position.x < 0) this.position.x = state.screen.width;
                if (this.position.y > state.screen.height) this.position.y = 0;
                else if (this.position.y < 0) this.position.y = state.screen.height;

                this.emitUpdate('move_player', {
                    id: this.id,
                    x: this.position.x,
                    y: this.position.y,
                    rotation: this.rotation    
                });
            } else {
                // *** NOT YOU
                // INTERPOLATE
                if (this.targetPosition.x - this.position.x > 250 || this.targetPosition.x - this.position.x < -250) {
                    // too much motion (likely going off screen) - don't interpolate
                    this.position.x = this.targetPosition.x;
                } else {
                    // otherwise - interpolate
                    this.position.x += (this.targetPosition.x - this.position.x) * 0.16;
                }

                if (this.targetPosition.y - this.position.y > 250 || this.targetPosition.y - this.position.y < -250) {
                    this.position.y = this.targetPosition.y;
                } else {
                    this.position.y += (this.targetPosition.y - this.position.y) * 0.16;
                }

                this.rotation += (this.targetRotation - this.rotation);
            }
        }
        // Draw
        if (!this.delete) {  
            const context = state.context;
            context.save();
            context.translate(this.position.x, this.position.y);
            // + 0.785.... is the additional rotation of 45 degrees due to the img format
            context.rotate((this.rotation) * Math.PI / 180 + 0.78539816);
            
            if ((this.invincible === true || this.speedy === true ) && this.ingame) {
                let img0 = new Image();
                if (this.invincible && !this.speedy) {
                    context.drawImage(this.invincibleGlow, -20, -20, 55, 55);
                } else if (this.speedy && !this.invincible) {
                    context.drawImage(this.speedyGlow, -20, -20, 55, 55);
                } else if (this.speedy && this.invincible) {
                    context.drawImage(this.bothPowerUpsGlow, -20, -20, 55, 55);
                }
            }
            // RENDER BODY
            context.drawImage(this.img1, -20, -20, 55, 55);
            // RENDER WINGS
            context.drawImage(this.img2, -20, -20, 55, 55);
            // RENDER TAIL
            context.drawImage(this.img3, -20, -20, 55, 55);
            // RENDER COCKPIT
            context.drawImage(this.img4, -20, -20, 55, 55);
            context.restore();
        }
    }
}