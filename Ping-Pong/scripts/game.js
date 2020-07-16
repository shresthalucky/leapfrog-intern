let Game = {
  'state': {
    'begin': true,
    'inPlay': false,
    'isOver': false,
    'ballStart': true,
    'server': undefined,
    'driver': undefined,
    'served': false,
    'serveSuccess': false,
    'deuce': false
  },
  'service': {
    'change': 2
  },
  'score': {
    'player': 0,
    'opponent': 0
  },
  'batDirection': false
}

function renderGame() {
  ctx.clearRect(-500, -500, CANVAS_WIDTH + 500, CANVAS_HEIGHT + 500);

  floor.draw();
  walls.draw();
  table.draw();
  opponent.drawBat();
  net.draw();

  if (Game.state.begin && !Game.state.isOver) {
    ball.draw();
    player.setInitialX();
    player.drawBat();

    updateStates();

    if (!Game.state.served) {
      serveBall();
    } else if (Game.state.inPlay) {
      hitBall();
    }
  } else {
    // TODO: start game menu
    // console.log('end');
  }

  requestAnimationFrame(renderGame);
}

// choose ball server and serve the ball
function serveBall() {

  if (!Game.state.server) {
    Game.state.server = player;
    Game.state.driver = player;
  }

  if (Game.state.server === player) {
  
    const x = clamp(BOARD_LEFT_X + BALL_MAX_RADIUS, BOARD_RIGHT_X - BALL_MAX_RADIUS, player.position.x);
    ball.setPosition(new Position(x, player.position.y, BOARD_Z));

    if (!Game.batDirection) player.movementDirection();

    if (player.batActive && Game.batDirection && ball.checkCollision(player)) {
      player.serve(VELOCITY);
      opponentMovement();
      Game.state.served = true;
      player.batActive = false;
    }
  } else {
    const pos = opponent.setPosition();
    ball.setPosition(pos);
    opponent.serve(VELOCITY);
    Game.state.served = true;
    player.batActive = true;
  }

  player.resetBounce();
  opponent.resetBounce();
}


// ball inside board conditions
function hitBall() {

  if (player.batActive && ball.checkCollision(player)) {
    player.batActive = false;
    ball.hit(player, 80, 40, player.getHitAngle());
    Game.state.driver = player;
    console.log('ping');
    opponentMovement();
  }

  if (opponent.batActive && ball.checkCollision(opponent)) {
    Game.state.serveSuccess = true;
    player.batActive = true;
    ball.hit(opponent, 80, 30, 0);
    Game.state.driver = opponent;
    console.log('pong');
  }
}

function updateStates() {

  if (ball.bounceCount === 1) {
    Game.state.inPlay = true;
  }

  if (net.checkCollision()) {
    ball.bounceBack(Game.state.driver);
    Game.state.inPlay = false;
    Game.state.driver.batActive = false;
  }

  if (Game.state.inPlay) {
    if (ball.ballOut()) {
      console.log('out');
      updateScore();
      Game.state.served = false;
      Game.state.inPlay = false;
      Game.batDirection = false;
      Game.state.serveSuccess = false;
      player.batActive = true;
      opponent.batActive = true;
    }
  }
}

function updateScore() {

  const bounce = `${player.bounce}${opponent.bounce}`;

  // console.log(bounce);

  if (Game.state.serveSuccess) {
    if (Game.state.driver === player) {
      if (bounce === '01') {
        Game.score.player++;
      } else {
        Game.score.opponent++;
      }
    } else if (Game.state.driver === opponent) {
      if (bounce === '10') {
        Game.score.opponent++;
      } else {
        Game.score.player++;
      }
    }
  } else {
    if (Game.state.server === player) {
      if (bounce === '11') {
        Game.score.player++;
      } else {
        Game.score.opponent++;
      }
    } else if (Game.state.server === opponent) {
      if (bounce === '11') {
        Game.score.opponent++;
      } else {
        Game.score.player++;
      }
    }
  }

  checkWin();

  if (Game.score.player === 10 && Game.score.opponent === 10) {
    deuce();
  }

  let points = Game.score.player + Game.score.opponent;

  if (points % Game.service.change === 0) {
    const side = Game.state.server === player ? opponent : player;
    Game.state.server = side;
    Game.state.driver = side;
  }

  console.log(Game.score);
}

function checkWin() {
  if (!Game.state.deuce) {

    if (Game.score.player === 11) gameOver(player);
    if (Game.score.opponent === 11) gameOver(opponent);

  } else {

    const dPoints = Game.score.player - Game.score.opponent;
    if (Math.abs(dPoints) === 2) {
      const winner = dPoints > 0 ? player : opponent;
      gameOver(winner);
    }
  }
}

function deuce() {
  console.log('deuce');
  Game.state.deuce = true;
  Game.service.change = 1;
}

function gameOver(winner) {
  Game.state.isOver = true;
  Game.state.inPlay = false;
  console.log('over', Game.score);
}

function opponentMovement() {
  const pos = ball.current3dPos;
  const slope = ball.velocity.z * TIME / (10 * ball.velocity.x);
  const destination = new Position(pos.x + ((BOARD_END - pos.z) / slope), opponent.position.y, BOARD_END);

  const right = BOARD_RIGHT_X;
  const left = BOARD_LEFT_X;

  if (destination.x < left) {
    destination.x = left;

    const z = (slope * (left - pos.x)) + pos.z;
    destination.z = z > NET_Z + 100 ? z : destination.z;

  } else if (destination.x > right) {
    destination.x = right;

    const z = (slope * (right - pos.x)) + pos.z;
    destination.z = z > NET_Z + 100 ? z : destination.z;
  }
  
  opponent.animate(destination);
}