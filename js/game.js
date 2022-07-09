/*jslint browser this */
/*global _, player, computer, utils */

(function () {
    "use strict";
    
    var game = {
        PHASE_INIT_PLAYER: "PHASE_INIT_PLAYER",
        PHASE_INIT_OPPONENT: "PHASE_INIT_OPPONENT",
        PHASE_PLAY_PLAYER: "PHASE_PLAY_PLAYER",
        PHASE_PLAY_OPPONENT: "PHASE_PLAY_OPPONENT",
        PHASE_GAME_OVER: "PHASE_GAME_OVER",
        PHASE_WAITING: "waiting",

        currentPhase: "",
        phaseOrder: [],
        // garde une référence vers l'indice du tableau phaseOrder qui correspond à la phase de jeu pour le joueur humain
        playerTurnPhaseIndex: 2,
        opponentTurnPhaseIndex: 3,

        // l'interface utilisateur doit-elle être bloquée ?
        waiting: false,

        // garde une référence vers les noeuds correspondant du dom
        grid: null,
        miniGrid: null,

        // liste des joueurs
        players: [],

        // orientation du bateau lors de leurs placements
        shipOrientation: "horizontal",

        // la difficulté
        difficulty: "easy",

        // le joueur qui commence
        firstPlayer: null,

        // lancement du jeu
        init: async function () {
            // initialisation
            this.grid = document.querySelector('.board .main-grid');
            this.miniGrid = document.querySelector('.column .mini-grid');

            this.wait()
            this.difficulty = await this.setDifficulty();
            this.stopWaiting()
            
            // on attend que firstplayer soit initialisé avant de poursuivre
            this.wait()
            this.firstPlayer = await this.setFirstPlayer();
            // Si le premier à joueur est le joueur
            if (this.firstPlayer == "1") {
                // // défini l'ordre des phase de jeu
                this.phaseOrder = [
                    this.PHASE_INIT_PLAYER,
                    this.PHASE_INIT_OPPONENT,
                    this.PHASE_PLAY_PLAYER,
                    this.PHASE_PLAY_OPPONENT,
                    this.PHASE_GAME_OVER
                ];
                this.playerTurnPhaseIndex = 2;
                this.opponentTurnPhaseIndex = 3
            } else if (this.firstPlayer == "2") {
                this.phaseOrder = [
                    this.PHASE_INIT_PLAYER,
                    this.PHASE_INIT_OPPONENT,
                    this.PHASE_PLAY_OPPONENT,
                    this.PHASE_PLAY_PLAYER,
                    this.PHASE_GAME_OVER
                ];
                this.opponentTurnPhaseIndex = 2;
                this.playerTurnPhaseIndex = 3;
            }
            this.stopWaiting()

            // initialise les joueurs
            this.setupPlayers();
            // ajoute les écouteur d'événement sur la grille
            this.addListeners();

            // c'est parti !
            this.goNextPhase();
        },
        setupPlayers: function (firstPlayer) {
            // donne aux objets player et computer une réference vers l'objet game
            player.setGame(this); 
            computer.setGame(this);

            this.players = [player, computer];

            // todo : implémenter le jeu en réseaux

            this.players[0].init();
            this.players[1].init();
        },
        goNextPhase: function () {
            // récupération du numéro d'index de la phase courante
            var ci = this.phaseOrder.indexOf(this.currentPhase);
            var self = this;
            if (ci !== this.phaseOrder.length - 1) {
                this.currentPhase = this.phaseOrder[ci + 1];
            } else {
                this.currentPhase = this.phaseOrder[0];
            }

            switch (this.currentPhase) {
            case this.PHASE_GAME_OVER:
                // detection de la fin de partie
                if (this.gameIsOver() == false) {
                    // le jeu n'est pas terminé on recommence un tour de jeu
                    if (this.firstPlayer == "1") {
                        this.currentPhase = this.phaseOrder[this.playerTurnPhaseIndex - 1];
                    } else if (this.firstPlayer == "2") {
                        this.currentPhase = this.phaseOrder[this.opponentTurnPhaseIndex - 1] ;
                    }
                    self.goNextPhase();
                    break;
                } else {
                    self.gameIsOver();
                    if (42) {
                        utils.info("Tu as gagné ! Tu as presque autant de classe que Georges ABITBOL");
                    } else if (0) {
                        utils.info("Georges ABITBOL aurait gagné à ta place ...");
                    }
                    setTimeout(() => {
                        location.reload();
                    }, 10000);
                    break;
                }
            case this.PHASE_INIT_PLAYER:
                utils.info("Placez vos bateaux");
                break;
            case this.PHASE_INIT_OPPONENT:
                this.wait();
                utils.info("En attente de votre adversaire");
                this.players[1].areShipsOk(function () {
                    self.stopWaiting();
                    self.goNextPhase();
                });
                break;
            case this.PHASE_PLAY_PLAYER:
                utils.info("A vous de jouer, choisissez une case !");
                break;
            case this.PHASE_PLAY_OPPONENT:
                utils.info("A votre adversaire de jouer...");
                this.players[1].play();
                break;
            }
        },
        gameIsOver: function () {
            if (this.hasWon(this.players[1]["grid"])) {
                let soundWin = new Audio('sounds/win.mp3');
                setTimeout(() => {
                    soundWin.play();
                }, 1400);
                return 42;
            } else if (this.hasWon(this.players[0]["grid"])) {
                let soundLoose = new Audio('sounds/loose.mp3');
                setTimeout(() => {
                    soundLoose.play();
                }, 1400);
                return 0;
            } else {
                return false;
            }
        },
        hasWon: function (grid) {
            let hit = 0;
            grid.forEach((row) => {
                row.forEach((x) => {
                    if(x === "X") {
                        hit++;
                    };
                });
            });
            if (hit == 17) {
                return true;
            } else {
            return false;
            };
        },
        getPhase: function () {
            if (this.waiting) {
                return this.PHASE_WAITING;
            }
            return this.currentPhase;
        },
        // met le jeu en mode "attente" (les actions joueurs ne doivent pas être pris en compte si le jeu est dans ce mode)
        wait: function () {
            this.waiting = true;
        },
        // met fin au mode mode "attente"
        stopWaiting: function () {
            this.waiting = false;
        },
        addListeners: function () {
            // on ajoute des acouteur uniquement sur la grid (délégation d'événement)
            this.grid.addEventListener('mousemove', _.bind(this.handleMouseMove, this));
            this.grid.addEventListener('click', _.bind(this.handleClick, this));
            this.grid.addEventListener('contextmenu', _.bind(this.handleRightClick, this));
        },
        handleMouseMove: function (e) {
            // on est dans la phase de placement des bateau
            if (this.getPhase() === this.PHASE_INIT_PLAYER && e.target.classList.contains('cell')) {
                var ship = this.players[0].fleet[this.players[0].activeShip];
                
                // si on a pas encore affiché (ajouté aux DOM) ce bateau
                if (!ship.dom.parentNode) {
                    this.grid.appendChild(ship.dom);
                    // passage en arrière plan pour ne pas empêcher la capture des événements sur les cellules de la grille
                    ship.dom.style.zIndex = -1;
                }       
                // décalage visuelle, le point d'ancrage du curseur est au milieu du bateau
                const sheepHeight = utils.getTotalSheepsHeight(this.grid) // hauteur cumulée des précédents bateaux placés

                if (game.shipOrientation == "horizontal") {
                    ship.dom.style.top = "" + (utils.eq(e.target.parentNode)) * utils.CELL_SIZE - (600 + sheepHeight) + "px";
                    ship.dom.style.left = "" + utils.eq(e.target) * utils.CELL_SIZE - Math.floor(ship.getLife() / 2) * utils.CELL_SIZE + "px";
                } else if (game.shipOrientation == "vertical") {
                    ship.dom.style.top = "" + (utils.eq(e.target.parentNode)) * utils.CELL_SIZE - (600 + sheepHeight) - Math.floor(ship.getLife() / 2) * utils.CELL_SIZE + "px";
                    ship.dom.style.left = "" + utils.eq(e.target) * utils.CELL_SIZE  + "px";
                }
            }   
        },
        handleRightClick: function (e) {
            // self garde une référence vers "this" en cas de changement de scope
            var self = this;

            // si on a cliqué sur une cellule (délégation d'événement)
            if (e.target.classList.contains('cell')) {
                // si on est dans la phase de placement des bateau
                if (this.getPhase() === this.PHASE_INIT_PLAYER) {
                    e.preventDefault()
                    var ship = this.players[0].fleet[this.players[0].activeShip];

                    if (game.shipOrientation == "horizontal") {
                        game.shipOrientation = "vertical"
                    } else if (game.shipOrientation == "vertical" ){
                        game.shipOrientation = "horizontal"
                    }
                    //on change l'orientation du bateau
                    var storage = ship.dom.style.height
                    ship.dom.style.height = ship.dom.style.width
                    ship.dom.style.width = storage
                }
            }
        },
        handleClick: function (e) {
            // self garde une référence vers "this" en cas de changement de scope
            var self = this;
            
            // si on a cliqué sur une cellule (délégation d'événement)
            if (e.target.classList.contains('cell')) {
                // si on est dans la phase de placement des bateau
                if (this.getPhase() === this.PHASE_INIT_PLAYER) {
                    // on enregistre la position du bateau, si cela se passe bien (la fonction renvoie true) on continue
                    if (this.players[0].setActiveShipPosition(utils.eq(e.target), utils.eq(e.target.parentNode), game.shipOrientation)) {
                        // on met l'orientation du bateau telle qu'elle sera lors du prochain bateau
                        this.shipOrientation = "horizontal"
                        // et on passe au bateau suivant (si il n'y en plus la fonction retournera false)
                        if (!this.players[0].activateNextShip()) {
                            this.wait();
                            utils.confirm("Confirmez le placement ?", function () {
                                // si le placement est confirmé
                                self.stopWaiting();
                                self.renderMiniMap();
                                self.players[0].clearPreview();
                                self.goNextPhase();
                            }, function () {
                                self.stopWaiting();
                                // sinon, on efface les bateaux (les positions enregistrées), et on recommence
                                self.players[0].resetShipPlacement();
                            });
                        }
                    }
                // si on est dans la phase de jeu (du joueur humain)
                } else if (this.getPhase() === this.PHASE_PLAY_PLAYER) {
                    this.players[0].play(utils.eq(e.target), utils.eq(e.target.parentNode));
                }
            }
        },
        // fonction utlisée par les objets représentant les joueurs (ordinateur ou non)
        // pour placer un tir et obtenir de l'adversaire l'information de réusssite ou non du tir
        fire: function (from, col, line, callback) {
            this.wait();
            var self = this;
            var msg = "";

            // determine qui est l'attaquant et qui est attaqué
            var target = this.players.indexOf(from) === 0
                ? this.players[1]
                : this.players[0];

            if (this.currentPhase === this.PHASE_PLAY_OPPONENT) {
                msg += "Votre adversaire vous a... ";
            }

            // on demande à l'attaqué si il a un bateaux à la position visée
            // le résultat devra être passé en paramètre à la fonction de callback (3e paramètre)
            target.receiveAttack(col, line, this.miniGrid, function (hasSucceed, alreadyTargeted) {
                if (hasSucceed) {
                    msg += "Touché !";
                } else {
                    msg += "Manqué...";
                }

                // on affiche le message en rouge si la case à déjà été ciblée
                // et que le message est affiché après une de nos attaque
                if (alreadyTargeted) {
                    if (msg == "Touché !" || "Manqué...") {
                        utils.info(msg, "red");
                    }
                } else {
                    utils.info(msg);
                }

                // on définit ici les animations dans les cases visés
                self.generateAnimation(line, col, self.grid, hasSucceed);

                // on invoque la fonction callback (4e paramètre passé à la méthode fire)
                // pour transmettre à l'attaquant le résultat de l'attaque
                callback(hasSucceed);

                // on fait une petite pause avant de continuer...
                // histoire de laisser le temps au joueur de lire les message affiché
                setTimeout(function () {
                    self.stopWaiting();
                    self.goNextPhase();
                }, 1000);
            });
        },
        renderMap: function () {
            this.players[0].renderTries(this.grid);
        },
        renderMiniMap: function () {
            this.players[0].renderShips(this.miniGrid) // implémentation de l'action de la fonction, ajoute les bateaux dans la mini carte
        },
        setFirstPlayer: async function() {
            const value = await this.firstPlayerListener();

            if (value == "player1") {
                return 1
            } else if (value == "computer") {
                return 2
            } else if (value == "random") {
                const rand = utils.randomIntFromInterval(1, 2)
                return rand
            }

        },
        firstPlayerListener: function() {
            return new Promise(function (resolve, reject) {
                const submitButton = document.querySelector(".players__submit")
                submitButton.addEventListener("click", function () {
                    const value = document.querySelector("input[name='player']:checked").id
                    const modal = document.querySelector(".modal")
                    modal.style.display = "none"
                    resolve(value)
                })
            })
        },
        setDifficulty: async function() {
            const value = await this.difficultyListener()

            return value;    
        },
        difficultyListener: function() {
            return new Promise(function (resolve, reject) {
                const submitButton = document.querySelector(".difficulty__submit")
                submitButton.addEventListener("click", function () {
                    const value = document.querySelector("input[name='difficulty']:checked").id
                    const wrapper = document.querySelector(".difficulty")
                    wrapper.style.display = "none"
                    resolve(value)
                })
            })
        },
        generateAnimation: function (line, col, grid, hasSucced) {
            const cell = grid.children[line].children[col];
            const img = document.createElement("img");
            img.style.width = "100%";
            img.style.height = "100%";
            
            if (hasSucced) {
                img.src = "images/boom.gif";
            } else {
                img.src = "images/plouf.gif";
            }
            cell.appendChild(img);

            setTimeout(function() {
                cell.removeChild(img);
            }, 2000)
        },
        setGame: function(game) {
            this.game = game;
        }
    };

    // point d'entrée
    document.addEventListener('DOMContentLoaded', function () {
        game.init();
    });

}());