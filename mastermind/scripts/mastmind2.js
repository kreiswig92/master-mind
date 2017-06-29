var masterMind = (function() {

  var api = {};

  var view = {
    displayLocked : function (id) { // sets passed id's class to 'locked'
      document.getElementById(id).className += " " + "locked";
    },

    displayEmpty : function(id) { // sets passed id's class to 'blankPeg'
      document.getElementById(id).setAttribute("class", "blankPeg");
    },

    clearGameboard : function() { // sets gameboardDiv to empty string
      getE("gameboard").innerHTML = "<div id='pegboard'></div>"; // includes pegboard div, needed for pegboard generation
    },

   showGameboard :function() {// sets gameboard display to block, reshows gameboard if hidden
     var gameboard = getE("gameboard");
     gameboard.setAttribute("style", "display: block;");
   },

   displayMessageArea : function() { // set messageArea div to display: block, used to display message area at end of game
      var messageArea = getE("messageArea");
      messageArea.setAttribute("style", "display: block");
   },

   hideMessageArea : function() { // hides message area, used for resetting game.
      var messageArea = getE("messageArea");
      messageArea.setAttribute("style", "display: none");
   },

   printMessageArea : function(txt) { // prints text to text area in messageArea
     var textArea = getE("textArea");
     textArea.innerHTML = "<p>" + txt + "</p>";
   },

   printButtonText : function(txt) { // prints text on button in messageArea
     var button = getE("button");
     button.innerHTML = txt;
   }
  }

  var model = {
    gameboard : {
      rows : [], // each time a new row is displayed, a new row object is placed here
      targetCell : null,// represents cell currently selected by user on gameboard
      winningSet : [], // winning color combanation is generated and placed here

      reinit : function() { // resets gameboard data, used for resetting game
        this.rows = [];
        this.targetCell = null;
        this.winningSet = [];
      },

      currentRow : function() { // gets current row number
        return this.rows.length - 1;
      },

      getRow : function(rowId) { // gets row object based on DOM row id
        var number = rowId.split("_")[1];
        console.log("getRowNum: " + number);
        for( let i = 0; i < this.rows.length; i += 1 ) {
          if(this.rows[i].rowNumber == number) {
            return this.rows[i];
          }
        }
        console.log("error--> invalid rowId passed to gameboard.getRow");
      },

      setTarget: function(cell) { // sets the target cell in gameboard object
        this.targetCell = cell;
      },

      compileMatchData : function() { // compiles array of numbers, representing the indexeds of colors.locatedCodes, that shold be assigned to locator UI
        var masterSet = this.winningSet.slice();
        var colorSet = this.rows[this.currentRow()].compileColors();
        var matchData = [];


      for( let i = colorSet.length - 1; i >= 0; i -= 1 ) {
        if(masterSet[i] === colorSet[i]) { //testing for direct matches
          matchData.push(0); // 0 = numerical representation of perfect match
          masterSet.splice(i, 1); // remove from masterSet and colorSet, this prevents a second cell of the same color being assigned a partial match if a perfect match has already been found
          colorSet.splice(i, 1);
        }
      }

      for ( let i = colorSet.length - 1; i >= 0; i -= 1 ) {
        let index = masterSet.indexOf(colorSet[i]);
        if(index >= 0) {
          matchData.push(1); // 1 is numerical represntation of a partial match
          masterSet.splice(masterSet.indexOf(colorSet[i]), 1);
          colorSet.splice(i, 1);
        }
      }

      while(matchData.length < 4) { // fills array
        matchData.push(2); // 2 represents no match
      }
      return matchData;
    },

    checkMatch : function() {
      var matchData = this.compileMatchData();
      var matchColors = [];// hash codes for locator ui stored here
      var matchDisp = getE("matchDisp" + this.currentRow());
      if(this.isWon(matchData)) { // checking if game is won
        controller.winGame(); // display win message if won
      }
      else{
        for(let i = 0; i < matchData.length; i += 1 ) {
          matchColors.push(model.colors.locatedCodes[matchData[i]]); // pushing hashCodes for color UI to matchCOlors array
        }
        let dispCells = matchDisp.childNodes; // gets color locator divs
        for(let i = 0; i < dispCells.length; i += 1 ) {
          dispCells[i].setAttribute("style", "background-color: " + matchColors[i] + ";"); // sets background color for locator divs
        }
        if(!this.isLost()){ // if 12 rows have been displayed, and now match found, game is lost
        model.gameboardGen.genNewRow(); // game goes on, new row generated
      }
      else{
        controller.loseGame(); // display losing message
      }
      }
    },

    isWon(matchData) { // takes matchdata compiled by "compileMatchData", checks if array is comprised of all 0's, which represent perfect match
      for( let i = 0; i < matchData.length; i += 1 ) {
        if(matchData[i] !== 0){
          return false;
        }
      }
      return true;
    },

    isLost() { // checks if 12 rows have been displayed.
      if(this.currentRow() >= 11){
        return true;
      }
      return false;
    }

  }, // end of gameboard object

    colors : {
      names : ["blue", "ice", "mint", "orange", "pink", "yellow"],
      hashCodes : ["#00d2df", "#adb5c3", "#8ce8a8", "#feb244", "#fa00f5", "#eff991"],
      locatedCodes : ["#ff0000", "#e3e3c0" ,"#edefef" ], // colors used for locator ui

      getHash : function(colorName) { // pass colorName returns hashcode for passed color
        var index = this.names.indexOf(colorName);
        if(index < 0) {
          console.log("error --> invalid color passed to model.colors.getHash")
        }

        return this.hashCodes[index];
      },
      getColor : function(hashCode) { // pass hashCode, gets color name
        var index = this.hashCodes.indexOf(hashCode);
        if(index < 0) {
          console.log( "error --> invalid hashCode passed to model.colors.getColor")
        }

        return this.names[index];
      }
    }
};

  model.gameboardGen = { // object holds methods concerning generation of gameboard ui elements, and gameboard data generation
    genNewRow : function() { // generates a new gameboard row with genDivGrid, adds row object to data structure in gameboard object.
    var rowNumber = this.getRowNumber();
    var newRow = new this.Row(rowNumber);
    this.genDivGrid(4, 1, "gameboard", "blankPeg");
    model.gameboard.rows.push(newRow);
    this.matchGridGen(); //genning peg locator UI
    let newPegs = document.getElementsByClassName("blankPeg");
    for( let i = 0; i < newPegs.length; i += 1 ) {
      //newPegs[i].onclick = controller.procGbClick; // adding onclick events to new row
      newPegs[i].setAttribute("id", i ); //sets cell ID
    }
    newRow.addClickHandler(controller.procGbClick);
    },

    getRowNumber : function() { // gets total rows displayed on gameboard ---> !!!!!! replace with betterfunction in gameboard !!!!!!!
      var totalRows = document.getElementsByClassName("row").length;
      return totalRows;
    },

    pegSelectorGen : function() { // generates peg selector ui element
      var pegColors = ["blue", "ice", "mint", "orange", "pink", "yellow"]
      this.genDivGrid(6,1,"pegboard", "pegSelector");
      let selectors = document.getElementsByClassName("pegSelector");
      let colors = model.colors;
      for(let i = 0; i < selectors.length; i += 1 ) {
        selectors[i].setAttribute("style", "background-color: " + model.colors.getHash(pegColors[i]));
        selectors[i].setAttribute("id", pegColors[i]);
        selectors[i].onclick = controller.procPbClick;
      }
      getE("pegboardRow_1").className = "pegRow";// overwriting className assigned by genDiv grid, to seperate pegselector from gameboard rows.
    },

    matchGridGen : function() { // generates the UI which shows which cells have been "found".
      var currentRow = model.gameboard.currentRow();
      var rowDiv = getE("gameboardRow_" + currentRow);
      console.log("genning on row " + currentRow);
      rowDiv.innerHTML += "<div id='matchDisp" + currentRow + "'></div>"; // adds new parent div for matchDiv objects, gives an Id of matchDisp + 'the current row'
      for(let i = 0; i < 4; i += 1) {
        let newMatchDisp = getE("matchDisp" + currentRow);
        newMatchDisp.innerHTML += "<div></div>";
        newMatchDisp.className = "matchView";
      }
    },

    genDivGrid : function (cols, rows, divId, className) { // pass cols and rows, generates grid of divs inside of passed div id, each grid item gets className
      var container = getE(divId)
      for(let i = 0; i < rows; i += 1) {
        let newRow = document.createElement("div");
        newRow.className = "row";
        newRow.id = divId + "Row_" + this.getRowNumber();
        for(let j = 0; j < cols; j += 1) {
          var newCell = document.createElement("div");
          newCell.id = divId +"_"+i + "" + j;
          newCell.className = className;
          newRow.appendChild(newCell);
        }
        container.appendChild(newRow);
      }
    },
      genWinningSet : function() { // randomly generates the winning color combanation, styles the "winCell" divs to reflect winning combo
        var genSet = [];
        var colorSet = model.colors.names;
        var hashSet = model.colors.hashCodes;
        var winningDivs = document.getElementsByClassName("winCell");
        for( let i = 0; i < 4; i += 1 ) {
        let index = getRandomIndex(colorSet);
        genSet.push(colorSet[index]);
        winningDivs[i].style.backgroundColor = hashSet[index];
       }
       model.gameboard.winningSet = genSet;
     },

    Row : function (rowNumber) { // constructor for row object data
      this.rowNumber = rowNumber
      this.submitted = false;
      this.genCells = function() { //creates 4 new cell objects based on row number
        var start = this.rowNumber * 4;
        var end = start + 3;
        var cellList = [];
        var position = 0;
        for(let i = start; i <= end; i += 1 ) {
          cellList.push(new model.gameboardGen.Cell(i, "blank", this.rowNumber, position));
          position ++;
        }
        return cellList;
      };
      this.cells = this.genCells();
      this.marked = [false, false, false, false];
    },

    Cell :function (id, color, belongsToRow, position) { // constructor for individual cell object data, held in each row object
      this.id = id;
      this.belongsToRow = belongsToRow;
      this.color = color;
      this.marked = false;
      this.position = position; // to represent position in array cell sits in
      //move to prototype
    }
  }; // end of gameboardGen Object

  model.gameboardGen.Row.prototype = { // Row object functions placed in prototype
  constructor : model.gameboardGen.Row,
  getCellObject : function(id) { // used to access a cell object within the row object
    for( let i = 0; i < this.cells.length; i += 1 ) {
      if(this.cells[i].id == id) {
        return this.cells[i];
      }
    }
    console.log("error --> invalid cell id passed to Row.getCellObject");
  },
  readyToSubmit : function() { // test row object to see if every cell has been marked
    for(let i = 0; i < this.marked.length; i += 1) {
      if(!this.marked[i]){
        return false;
      }
    }
    return true;
  },
  compileColors : function() { // returns an array of colors of each cell in row. returns array as color names, NOT hash codes
    var result = [];
    for( let i = 0 ; i < this.cells.length; i += 1 ) {
      let hashCode = this.cells[i].color;
      result.push(model.colors.getColor(hashCode));
    }
    return result;
  },

  removeClickHandler: function() { // removes onclick handler from every cell in row, used for rows that have been submitted
    for( let i = 0 ; i < this.cells.length; i += 1 ) {
      let cellDiv = this.cells[i].getCellEl();
      cellDiv.onclick = '';
      cellDiv.style.cursor = "default";
    }
  },

  addClickHandler: function(handler) {
    for( let i = 0; i < this.cells.length; i += 1 ) {
      let cellDiv = this.cells[i].getCellEl();
      cellDiv.onclick = handler;
      cellDiv.style.cursor = "pointer";
    }
  }
};

  model.gameboardGen.Cell.prototype = {
    constructor: model.gameboardGen.Cell,
    getCellEl : function() { // returns the DOM object based on cells ID
      return getE(this.id);
    },
    setCellColor : function(hash) { // sets the cells DOM object backgroundColor
      var el = getE(this.id);
      el.setAttribute("style", "background-color:" + hash);
    },
    writeMark : function(hashCode) { // writes object data when cell is marked
      this.color = hashCode;
      this.marked = true;
      model.gameboard.rows[this.belongsToRow].marked[this.position] = true;
    }
  };

  var controller = {
    procGbClick : function(eventObj) { //proccesses clicks on main-gameboard
      var pegBoard = getE("pegboard");
      var cell = eventObj.target;
      var row = model.gameboard.getRow(cell.parentElement.id);
      var cellObj = row.getCellObject(cell.id);
      var position = getPosition(cell);

      controller.clearLocked(); // clearing any "locked" cells, if user changes mind on which cell they want to mark
      pegBoard.setAttribute("style", "display: block;")// displaying pegboard
      positionEl(position.x - 75, position.y + 50, "pegboard"); // positioning pegboard below row
      view.displayLocked(cell.id);// locking selected cell

      model.gameboard.setTarget(cellObj); // sets target cell in gameboard object
    },

    clearLocked : function(){ // returns all cells to none locked visual state, needed if user selects second cell without assigning color to first cell
      var rows = document.getElementsByClassName("locked");
      for(let i = 0; i < rows.length; i += 1) {
        view.displayEmpty(rows[i].id);
      }
    },

    hidePegboard : function() { // sets pegboard display to none, also "unlocks" all cells
      var pegboard = getE("pegboard");

      var clearSelected = function() {
        var pegs = document.getElementsByClassName("emptyPeg");
        for( let i = 0; i < pegs.length; i += 1 ) {
          if(pegs[i].className == "locked")
          view.displayEmpty(pegs[i].id);
        }
      }
      pegboard.setAttribute("style", "display: none");
      clearSelected();
    },


    procPbClick : function(eventObj) { // process click on pegboard UI
      var selectedColor = eventObj.target.id;
      var hashCode = model.colors.getHash(selectedColor);
      var row = model.gameboard.rows[model.gameboard.rows.length - 1];
      var selectedCell = model.gameboard.targetCell;
      selectedCell.setCellColor(hashCode); // color targetCell
      controller.hidePegboard(); // hide pegboard
      controller.clearLocked();
      selectedCell.writeMark(hashCode); // write data to cell object

      if(row.readyToSubmit()) { // if row is completly filled
        model.gameboard.checkMatch();
        row.removeClickHandler();// remove handlers for row so user cant re-select submitted rows
      }
    },

    loseGame : function() { //clears gameboard, displays winning set, ask player if they want to play again, with losing message
      view.clearGameboard();
      view.printMessageArea("You lost... Wanna try again?");
      view.printButtonText("Try Again");
      view.displayMessageArea();
    },

    winGame : function() { //clears gameboard, displays winning set, ask player if they want to play again, with winning message
      view.clearGameboard();
      view.printMessageArea("YOU WON! Good job, Wanna play again?");
      view.printButtonText("Play Again");
      view.displayMessageArea();
    },

    resetHandler : function() { // resets game, assigned to button in message area which is displayed when game is won or lost
      model.gameboard.reinit();
      view.hideMessageArea();
      init();
    }

};

  var init = function () {
    model.gameboardGen.genNewRow();
    model.gameboardGen.pegSelectorGen();
    model.gameboardGen.genWinningSet();
    getE("button").onclick = controller.resetHandler;
  }


  function getE(id) {
    return document.getElementById(id);
  }

  function getPosition(el) { // credit kirupa at https://www.kirupa.com/about/whatiskirupa.htm
  var xPosition = 0;
  var yPosition = 0;

  while (el) {
    if (el.tagName == "BODY") {
      // deal with browser quirks with body/window/document and page scroll
      var xScrollPos = el.scrollLeft || document.documentElement.scrollLeft;
      var yScrollPos = el.scrollTop || document.documentElement.scrollTop;

      xPosition += (el.offsetLeft - xScrollPos + el.clientLeft);
      yPosition += (el.offsetTop - yScrollPos + el.clientTop);
    } else {
      xPosition += (el.offsetLeft - el.scrollLeft + el.clientLeft);
      yPosition += (el.offsetTop - el.scrollTop + el.clientTop);
    }

    el = el.offsetParent;
  }
  return {
    x: xPosition,
    y: yPosition
  };
}

function positionEl(x_pos, y_pos, id) { // positions element with passed "id", based on x position, and y position
  var d = document.getElementById(id);
  var scroll = getE("container").getBoundingClientRect().top
  d.style.position = "absolute";
  d.style.left = x_pos +'px';
  d.style.top = y_pos - getE("container").getBoundingClientRect().top + 'px';
}

function getRandomIndex(array) { // returns a random index between 0 and last position of array.
  return Math.floor(Math.random() * array.length);
}

  api.init = init;
  api.model = model;
  api.controller = controller;
  api.view = view;
  return api;
}());

window.onload = masterMind.init;
