/*jslint browser this */
/*global _, shipFactory, player, utils */

(function (global) {
    "use strict";

    var sheep = {dom: {parentNode: {removeChild: function (ship, deleteShip) {
        
        if (deleteShip) {
            ship.parentNode.removeChild(ship)
        } else {
            ship.hidden = "true"
        }
    }}}};

    var player = {
        grid: [],
        tries: [],
        fleet: [],
        game: null,
        activeShip: 0,
        init: function () {
            // créé la flotte
            this.fleet.push(shipFactory.build(shipFactory.TYPE_BATTLESHIP));
            this.fleet.push(shipFactory.build(shipFactory.TYPE_DESTROYER));
            this.fleet.push(shipFactory.build(shipFactory.TYPE_SUBMARINE));
            this.fleet.push(shipFactory.build(shipFactory.TYPE_SMALL_SHIP));

            // créé les grilles
            this.grid = utils.createGrid(10, 10);
            this.tries = utils.createGrid(10, 10);
        },
        play: function (col, line) {
            let fire = new Audio('sounds/fire.mp3');
            fire.play();
            // appel la fonction fire du game, et lui passe une calback pour récupérer le résultat du tir
            this.game.fire(this, col, line, _.bind(function (hasSucced) {
                let hit = new Audio('sounds/hit.mp3');
                let miss = new Audio('sounds/miss.mp3');
                if (hasSucced) {
                    setTimeout(function() {
                        hit.play();
                    }, 1400)
                } else {
                    setTimeout(function() {
                        miss.play();
                    }, 1400)
                }
                this.tries[line][col] = hasSucced;
                this.renderTries(this.game.grid);
            }, this));
        },
        // quand il est attaqué le joueur doit dire si il a un bateaux ou non à l'emplacement choisi par l'adversaire
        receiveAttack: function (col, line, miniGrid, callback) {
            var succeed = false;
            var alreadyTargeted = false;

            if (this.grid[line][col] == "X") {
                alreadyTargeted = true
                succeed = true
            } else if (this.grid[line][col] == "M") {
                alreadyTargeted = true
            } else {
                if (this.grid[line][col] !== 0) {
                    succeed = true;
                    // on assigne la valeur "X" à une case qui contenait un bateau
                    this.grid[line][col] = "X";
                } else {
                    // on assigne la valeur "M" à une case qui ne contenait pas de bateau
                    this.grid[line][col] = "M"
                }
            }
            // Si la fonction est appelée par le joueur
            if (player == this && succeed) {
                this.renderShips(miniGrid);
            }
            // on assigne la valeur "X" à la case pour dire qu'elle à été visée. 
            callback.call(undefined, succeed, alreadyTargeted);
        },
        setActiveShipPosition: function (x, y, orientation) {
            var ship = this.fleet[this.activeShip];
            
            if (!utils.isPlaceAvailable(x, y, orientation, ship.getLife(), this.grid)) return false
            let i = 0;
            if (orientation == "horizontal") {
                // ajuste le placement du bateau vers la droite.
                x -= Math.floor(ship.life / 2);

                while (i < ship.getLife()) {
                    this.grid[y][x + i] = ship.getId();
                    i += 1;
                }
            } else if (orientation == "vertical") {
                // ajuste le placement du bateau vers le haut.
                y -= Math.floor(ship.life / 2);
                while (i < ship.getLife()) {
                    this.grid[y + i][x] = ship.getId();
                    i += 1;
                }
            }
            return true;
        },
        clearPreview: function (deleteShip = false) {
            this.fleet.forEach(function (ship) {
                if (sheep.dom.parentNode) {
                    sheep.dom.parentNode.removeChild(ship.dom, deleteShip);
                }
            });
        },
        resetShipPlacement: function () {
            this.clearPreview(true);

            this.activeShip = 0;
            this.grid = utils.createGrid(10, 10);
        },
        activateNextShip: function () {
            if (this.activeShip < this.fleet.length - 1) {
                this.activeShip += 1;
                return true;
            } else {
                return false;
            }
        },
        renderTries: function (grid) {
            this.tries.forEach(function (row, rid) {
                row.forEach(function (val, col) {
                    var node = grid.querySelector('.row:nth-child(' + (rid + 1) + ') .cell:nth-child(' + (col + 1) + ')');
                    if (val === true) {
                        node.style.backgroundColor = '#e60019';
                    } else if (val === false) {
                        node.style.backgroundColor = '#aeaeae';
                    }
                });
            });
        },
        renderShips: function (miniGrid) {
            this.grid.forEach(function (row, rid, grid) { // j'itére sur mes case de tableau avec les forEach
                row.forEach(function (val,col) {
                    var node = miniGrid.querySelector('.row:nth-child(' + (rid +1) + ') .cell:nth-child(' + (col + 1) + ')'); // je target mes dans la minigrid
                    if(node != null) {
                        if(val != 0 && val != "X" && val != "M") {
                            const shipColor = player.getShipColor(val)
                            node.style.backgroundColor = shipColor; // je prends la couleur du bateau du player
                        } else if (val == "X") {
                            if (!node.hasChildNodes()) {
                                let img = document.createElement("img");
                                img.src = "img/cross.png";
                                img.style.width = "100%";
                                img.style.height = "100%";
                                node.appendChild(img);
                            }
                        }
                    }
                })
            })
        },
        getShipColor: function (idShip) {
            const color = null
            for (const ship of this.fleet) {
                if (ship.id == idShip) {
                    return ship.color;
                }
            }
            return color
        },
        setGame: function(game) {
            this.game = game;
        }
    };

    global.player = player;

}(this));