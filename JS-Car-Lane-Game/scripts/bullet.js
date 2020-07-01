const Bullet = function (startPosition, size) {
  this.position = {
    'start': startPosition,
    'end': new Position(startPosition.x + size, startPosition.y + size)
  }
  this.size = size;
  this.active = true;

  this.draw = (ctx) => {
    ctx.drawImage(images.bullet, this.position.start.x, this.position.start.y, this.size, this.size);
  }

  this.move = () => {
    if (this.active) {
      this.position.start.y -= Game.bulletSpeed;
      this.position.end.y -= Game.bulletSpeed;

      if (this.position.start.y < 0) {
        this.active = false;
      }
    }
  }

  this.deactivate = () => {
    this.active = false;
  }
}