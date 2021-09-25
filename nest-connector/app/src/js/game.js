io = require('socket.io/client-dist/socket.io');

Vue.component('game', {
  template: `<div>
   <div id="game_you" :style="{ right: youRealPosX + '%', width: youWidth + '%' }"></div>
   <div id="game_enemy" :style="{ right: enemyRealPosX + '%', width: enemyWidth + '%' }"></div>
   <div id="game_ball" :style="{ right: ballRealPosX + '%' , bottom: ballRealPosY + '%' }"></div>
</div>`,
  data() {
    return {
      youPosX: 50,
      youWidth: 10,
      enemyPosX: 50,
      enemyWidth: 10,
      ballPosX: 0,
      ballPosY: 0,
      enemySpeed: 1,
      interval: null,
      angle: 0,
      starter: false,
      id: 0,
    };
  },
  computed: {
    youRealPosX: function () {
      return this.youPosX - this.youWidth / 2;
    },
    enemyRealPosX: function () {
      return this.enemyPosX - this.enemyWidth / 2;
    },
    ballRealPosY: function () {
      return this.ballPosY - 2;
    },
    ballRealPosX: function () {
      return this.ballPosX - 2;
    },
  },
  methods: {
    setSettings: function (gameSettings) {
      clearInterval(this.interval);
      console.log('settings');
      this.enemyWidth = gameSettings.enemyGameSettings.platformWide;
      this.enemySpeed = gameSettings.enemyGameSettings.platformSpeed;
      this.id = gameSettings.id;
      console.log(gameSettings.starter);
      if (gameSettings.starter) {
        this.ballPosY = 100 - gameSettings.BallPosY;
        this.ballPosX = 100 - gameSettings.BallPosX;
      } else {
        this.ballPosY = gameSettings.BallPosY;
        this.ballPosX = gameSettings.BallPosX;
      }
      this.starter = gameSettings.starter;
    },
    ballInAction(type = false) {
      let angle = 45;
      console.log('type: ' + type);
      let sin;
      let cos;
      if (type) {
        sin = Math.sin(angle);
        cos = Math.cos(angle);
      } else {
        cos = -Math.cos(angle);
        sin = -Math.sin(angle);
      }
      let tumbler = false;
      this.interval = setInterval(
        function () {
          console.log(this.ballPosX);
          if (this.ballPosY > 0 && this.ballPosY < 100 && this.ballPosX > 0 && this.ballPosX < 100) {
            this.ballPosY += sin;
            this.ballPosX += cos;
          } else if (this.ballPosX >= 100) {
            cos *= -1;
            this.ballPosX += cos;
          } else if (this.ballPosX <= 0) {
            cos *= -1;
            this.ballPosX += cos;
          } else if (this.ballPosY <= 0) {
            sin *= -1;
            this.ballPosY += sin;
          } else if (this.ballPosY >= 0) {
            sin *= -1;
            this.ballPosY += sin;
          }
        }.bind(this),
        10,
      );
    },
  },
});
