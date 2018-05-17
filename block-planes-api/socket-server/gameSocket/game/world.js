const Queue = require('./queue.js');
var Ship = require('./ship.js');

const World = function() {
    this.peers = new Object;
    this.queue = new Queue();
}

World.prototype.connect = function (player, shipAttributes) {
    // Create a new peer for this connection.
    this.peers[player] = new Ship(shipAttributes);
    this.peers[player].id = player;
    // Set peer's initial position
    this.peers[player].position.x = player === 1 ? 50 : 75;
    this.peers[player].position.y = player === 1 ? 50 : 75;
};

World.prototype.createObject = function (type, obj) {
    console.log('creating an object of type ', type, obj)
};

World.prototype.update = function (io) {
    this.processInputs();
    // emit to clients
    console.log('emitting state');
    io.sockets.emit('server_state', this.buildPeersNetObject());
};

// Check whether this input seems to be valid (e.g. "make sense" according
// to the physical rules of the World) simply return true for now
World.prototype.validateInput = function (input) {
    if (!this.peers[input.id]) {
        return false;
    } else {
        return true;
    }
};

// Process all pending messages from peers.
World.prototype.processInputs = function () {
    while (true) {
        var update = this.queue.receive();
        if (!update) {
            break;
        }

        // Update the state of the peer, based on its input. *****************************************
        if (this.validateInput(update)) {
            this.peers[update.id].applyInput(update);
            this.peers[update.id].last_processed_input = update.input_sequence_number;
        }
    }
};

// Build the object for the given peer id that is to be sent across the network
World.prototype.buildPeerNetObject = function (peer_id) {
    return {
        id: peer_id,
        position: {
            x: this.peers[peer_id].position.x,
            y: this.peers[peer_id].position.y,
        },
        last_processed_input: this.peers[peer_id].last_processed_input
    };

};

// Build the object for the given peer id that is to be sent across the network
World.prototype.buildPeersNetObject = function () {

    var netObj = new Object;

    for (var id in this.peers) {
        netObj[id] = {
            id: id,
            position: {
                x: this.peers[id].position.x,
                y: this.peers[id].position.y,
            },
            last_processed_input: this.peers[id].last_processed_input
        };
    }

    return netObj;

};


module.exports = World;