/*jslint browser this */
/*global _ */

(function (global) {
    "use strict";

    global.utils = {
        CELL_SIZE: 60,
        // retourne la position (démarre à 1) du noeud passé en paramètre dans son parent
        eq: function (node) {
            var p = node.parentNode;
            var i = 0;
            var nbChildren = p.children.length;
            var c = p.children[i];

            while (c !== node && i < nbChildren) {
                i += 1;
                c = p.children[i];
            }
            if (c === node) {
                return i;
            } else {
                return null;
            }
        },
        // créer un tableau à deux dimension, chaque élément du tableau est définie à la valeur (optionelle) "value" (vaut 0 par défaut)
        createGrid: function (lines, columns, value) {
            var val = value !== undefined
                ? value
                : 0;
            var i = 0;
            var j;
            var grid = [];
            while (i < lines) {
                grid[i] = [];
                j = 0;
                while (j < columns) {
                    grid[i][j] = val;
                    j += 1;
                }
                i += 1;
            }
            return grid;
        },
        // permet de faire afficher un message dans une "boite" spécifique (le noeud qui a la classe game-info)
        info: function (msg, color = false) {
            var infoBox = document.querySelector('.game-info');

            if (!color) {
                infoBox.style.color = ""
                infoBox.style.fontSize = ""
            } else {
                msg += " &#9888;"
                infoBox.style.fontSize = "large"
                infoBox.style.color = "" + color
            }
            infoBox.innerHTML = msg;
        },
        // permet de savoir si un bateau peut être placé dans la grille
        // utilisé dans player.js
        isPlaceAvailable: function(x, y, orientation, shiplife, grid) {
            let i = 0;
            if (orientation == "horizontal") {
                x -= Math.floor(shiplife / 2);

                // teste si le bateau sort de la grille ou si la case est déjà occupée
                while (i < shiplife) {
                    if (x < 0 - shiplife || grid[y][x + i] != 0) {
                        return false;
                    }
                    i++;
                }
            } else if (orientation == "vertical") {
                y -= Math.floor(shiplife / 2);

                while (i < shiplife) {
                    if (y < 0 || y > 9 - shiplife || grid[y + i][x] != 0) {
                        return false;
                    }
                    i ++;
                }
            }
            return true;
        },
        // permet de connaitre la taille totale des divs représentant les vaisseaux déjà placés
        // utilisé dans game.js
        getTotalSheepsHeight: function(grid) {
            const childs = grid.children
            const lastChild = grid.lastChild
            let height = 0
            
            for (const child of childs) {
                if (!child.classList.contains("row") && child != lastChild) {
                    height += parseInt(child.style.height)
                }
            }
            return height;
        },
        // permet de générer un nombre aléatoire entre deux intervales
        randomIntFromInterval: function (min, max) { // min and max included 
            return Math.floor(Math.random() * (max - min + 1) + min)
        },
        // permet de demander une confirmation à l'utilisateur
        // les 2 derniers paramètres sont des callback a exécuter en cas de confirmation pour le deuxième, ou d'infirmation pour le dernier
        confirm: function (message, confirm, cancel) {
            var clickCallback;
            var confirmBox = document.querySelector('#confirm');
            var btnContainer = confirmBox.querySelector('.btn-container');
            var msgContainer = confirmBox.querySelector('.message-container');
            clickCallback = function (e) {
                if (e.target.classList.contains('btn')) {
                    this.removeEventListener('click', clickCallback);
                    confirmBox.style.display = "none";
                    if (e.target.classList.contains('confirm-ok')) {
                        if (confirm) {
                            confirm.call();
                        }
                    } else {
                        if (cancel) {
                            cancel.call();
                        }
                    }
                }
            };

            btnContainer.addEventListener('click', clickCallback);

            confirmBox.style.display = 'block';

            msgContainer.innerHTML = message;
        },
        /**
         * 
         * @param {int} players Le nombre de joueurs qui jouent la partie.
         */
        generateSelectPlayer(players = 1, wrapper) {
            const msg = document.createElement("p");
            const labelP1 = document.createElement("label")
            const labelComputer = document.createElement("label")
            const radioP1 = document.createElement("input")
            const radioComputer = document.createElement("input")
            const submit = document.createElement("button")

            msg.textContent = "Selectionnez le premier joueur"
            msg.className = "players__msg"

            labelP1.setAttribute("for", "player1")
            labelP1.textContent = "Joueur 1"
            labelP1.className = "players__label players__label--1"

            labelComputer.setAttribute("for", "computer")
            labelComputer.textContent = "Ordinateur"
            labelComputer.className = "players__label players__label--1"

            radioP1.id = "player1"
            radioP1.setAttribute("checked", "true")
            
            radioComputer.id = "computer"

            submit.textContent = "Ok"
            submit.className = "players__submit"
            
            wrapper.appendChild(msg)
            wrapper.appendChild(labelP1)
            wrapper.appendChild(radioP1)
            wrapper.appendChild(labelComputer)
            wrapper.appendChild(radioComputer)
            submit.appendChild(submit)
        }
    };

}(this));
