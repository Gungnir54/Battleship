/*jslint browser this */
/*global _, player */

(function (global) {
    "use strict";

    var computer = _.assign({}, player, {
        grid: [],
        tries: [],
        fleet: [],
        game: null,
        lastSuccessfullFire: {},
        play: function () {
            var self = this;
            setTimeout(function () {
                const difficulty = self.game.difficulty
                let col = null;
                let line = null;

                if (difficulty == "easy") {
                    // on génère des positions aléatoire de colonnes et de lignes
                    col = utils.randomIntFromInterval(0, 9)
                    line = utils.randomIntFromInterval(0, 9)
                } else if (difficulty == "hard") {
                    const coordinates = self.generateSmartCoordinates(self.lastSuccessfullFire, self.tries);
                    // console.log("coordonnées du tir: ", "col: ",coordinates.col, "line :", coordinates.line)
                    col = coordinates.col
                    line = coordinates.line
                }
                
                self.game.fire(this, col, line, function (hasSucced) {
                    self.tries[line][col] = hasSucced;
                    if (hasSucced === true) {
                        for (var value in self.lastSuccessfullFire) delete self.lastSuccessfullFire[value];
                        self.lastSuccessfullFire.col = col
                        self.lastSuccessfullFire.line = line
                    }
                });
            }, 1000);
        },
        areShipsOk: function (callback) {
            this.fleet.forEach(function (ship) {
                let test = true
                while (test) {
                    let orientation = utils.randomIntFromInterval(0, 1) == 0 ? "vertical" : "horizontal"
                    let x = utils.randomIntFromInterval(0, 10 - ship.life)
                    let y = utils.randomIntFromInterval(0, 10 - ship.life)

                    if (utils.isPlaceAvailable(x, y, orientation, ship.getLife(), this.grid)) {
                        test = false
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
                    }

                }

            }, this);
// pour afficher la grille de l'ordinateur
console.log(this.grid)
            setTimeout(function () {
                callback();
            }, 500);
        },
        generateSmartCoordinates: function(lastSuccessfullFire, tries) {
            if (Object.keys(lastSuccessfullFire).length !== 0) {
                // Si un tir à été  réussi dans une case adjacente, on définit l'axe dans lequel on va tirer (ligne ou colonne)
                const axe = this.checkCellAround(lastSuccessfullFire, tries);
                if (axe) {
                    // on regarde dans un premier sens (vers la droite pour les colonnes, vers le bas pour les lignes) si une case est vide
                    // si c'est le cas, on tire sur cette case
                    const firstAxeCell = this.checkFirstAxe(axe, lastSuccessfullFire, tries);
                    if (firstAxeCell) {
                        return firstAxeCell;
                    }
                    const secondAxeCell = this.checkSecondAxe(axe, lastSuccessfullFire, tries);
                    if (secondAxeCell) {
                        return secondAxeCell
                    } else {
                        let coordinates = this.generateRandomCoordinates()
                        return {col: coordinates.col, line: coordinates.line}
                    }
                } else {
                    // on définit aléatoirement une case adjacente pour tirer dedans
                    let test = false;
                    let output = null;
                    const possibilities = [
                        {col: lastSuccessfullFire.col + 1, line: lastSuccessfullFire.line},
                        {col: lastSuccessfullFire.col - 1, line: lastSuccessfullFire.line},
                        {col: lastSuccessfullFire.col, line: lastSuccessfullFire.line  + 1},
                        {col: lastSuccessfullFire.col, line: lastSuccessfullFire.line - 1},
                    ]
                    while (!test) {
                        if (possibilities.length > 0) {
                            // on mélange le tableau pour changer la case que l'on choisira a chaque tour de boucle
                            possibilities.sort(() => Math.random() - 0.5)
                            let cell = possibilities[0]
                            if (cell.col <= 9 && cell.col >= 0 && cell.line <= 9 && cell.line >= 0) {
                                if (this.tries[cell.line][cell.col] === 0) {
                                    output = { col: cell.col, line: cell.line }
                                    test = true
                                } else {
                                    possibilities.shift()
                                }
                            } else {
                                possibilities.shift()
                            }
                        } else {
                            return this.generateRandomCoordinates()
                        }

                    }

                    return output;
                }
            } else {
                const coordinates = this.generateRandomCoordinates()
                return {
                    col: coordinates.col,
                    line: coordinates.line
                }
            }
        },
        checkCellAround: function(lastSuccessfullFire, tries) {
            if (lastSuccessfullFire.line >= 0 && lastSuccessfullFire.line <= 9) {
                if (tries[lastSuccessfullFire.line + 1][lastSuccessfullFire.col] === true
                    || tries[lastSuccessfullFire.line - 1][lastSuccessfullFire.col] === true) {
                        return "col";
                    }
            }
            if (lastSuccessfullFire.col >= 0 && lastSuccessfullFire.col <= 9) {
                if(tries[lastSuccessfullFire.line][lastSuccessfullFire.col + 1] === true
                    || tries[lastSuccessfullFire.line][lastSuccessfullFire.col - 1] === true) {
                    return "line";
                }
            }

            return false;
        },
        checkFirstAxe: function(axe, lastSuccessfullFire, tries) {
            if (axe == "col") {
                if (lastSuccessfullFire.line > 8) {
                    return this.checkSecondAxe(axe, lastSuccessfullFire, tries)
                } else if (tries[lastSuccessfullFire.line + 1][lastSuccessfullFire.col] === true) {
                    return this.checkFirstAxe(
                        axe, 
                        {col: lastSuccessfullFire.col,line: lastSuccessfullFire.line + 1}, 
                        tries);
                } else if (tries[lastSuccessfullFire.line + 1][lastSuccessfullFire.col] === false) {
                    return false;
                } else if (tries[lastSuccessfullFire.line + 1][lastSuccessfullFire.col] === 0) {
                    return {col: lastSuccessfullFire.col,line: lastSuccessfullFire.line + 1};
                }
            } else if (axe == "line") {
                if (lastSuccessfullFire.col > 8) {
                    return this.checkSecondAxe(axe, lastSuccessfullFire, tries)
                } else if (tries[lastSuccessfullFire.line][lastSuccessfullFire.col + 1] === true) {
                    return this.checkFirstAxe(
                        axe, 
                        {col: lastSuccessfullFire.col + 1,line: lastSuccessfullFire.line},
                        tries);
                } else if (tries[lastSuccessfullFire.line][lastSuccessfullFire.col + 1] === false) {
                    return false;
                } else if (tries[lastSuccessfullFire.line][lastSuccessfullFire.col + 1] === 0) {
                    return {col: lastSuccessfullFire.col + 1, line: lastSuccessfullFire.line};
                }
            }
        },
        checkSecondAxe: function(axe, lastSuccessfullFire, tries) {
            if (axe == "col") {
                if (lastSuccessfullFire.line < 1) {
                    return this.checkFirstAxe(axe, lastSuccessfullFire, tries)
                } else if (tries[lastSuccessfullFire.line - 1][lastSuccessfullFire.col] === true) {
                    return this.checkSecondAxe(
                        axe, 
                        {col: lastSuccessfullFire.col,line: lastSuccessfullFire.line - 1},
                        tries);
                } else if (tries[lastSuccessfullFire.line - 1][lastSuccessfullFire.col] === false) {
                    return false;
                } else if (tries[lastSuccessfullFire.line - 1][lastSuccessfullFire.col] === 0) {
                    return {col: lastSuccessfullFire.col, line: lastSuccessfullFire.line - 1};
                }
            } else if (axe == "line") {
                if (lastSuccessfullFire.col < 1) {
                        return this.checkFirstAxe(axe, lastSuccessfullFire, tries)
                } else if (tries[lastSuccessfullFire.line][lastSuccessfullFire.col - 1] === true) {
                    return this.checkSecondAxe(
                        axe, 
                        {col: lastSuccessfullFire.col - 1,line: lastSuccessfullFire.line},
                        tries);
                } else if (tries[lastSuccessfullFire.line][lastSuccessfullFire.col - 1] === false) {
                    return false;
                } else if (tries[lastSuccessfullFire.line][lastSuccessfullFire.col - 1] === 0) {
                    return {col: lastSuccessfullFire.col - 1,line: lastSuccessfullFire.line};
                }
            }
        },
        generateRandomCoordinates: function() {
            let col = 0
            let line = 0
            let test = false
            while (!test) {
                col = utils.randomIntFromInterval(0, 9)
                line = utils.randomIntFromInterval(0, 9)
                if (this.tries[line][col] === 0) {
                    test = true;
                }
            }
            return {col: col, line: line}
        },
        setGame: function (game) {
            this.game = game;
        }
    });

    global.computer = computer;

}(this));