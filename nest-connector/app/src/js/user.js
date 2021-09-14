// eslint-disable-next-line @typescript-eslint/no-var-requires
const axios = require('axios');
chat = require('./chat');
chat = require('./game');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const bcrypt = require('bcryptjs');

Vue.directive('focus', {
  inserted: function (el) {
    el.focus();
  },
});

Vue.component('user_register', {
  props: {
    authorized: {
      required: true,
      type: Boolean,
    },
    selectedAuth: {
      required: true,
      type: String,
    },
  },
  template: `<div><div id="user_register_login">login: <input v-model="login" type="text"></div>
                    <div id="user_register_pass1">pass: <input v-model="password1" type="password"></div>
                    <div id="user_register_pass2">repeat: <input v-model="password2" type="password"></div>
                    <p v-if="error" id="user_register_error_message">error: {{ error }}</p>
                    <div class="user_login_button"
                    v-on:click="register">login</div>
                    </div>`,
  data() {
    return {
      error: null,
      password1: null,
      password2: null,
      login: null,
    };
  },
  methods: {
    async creating() {
      bcrypt.hash(
        this.password1,
        10,
        async function (err, hash) {
          this.password1 = null;
          this.password2 = null;
          await axios
            .post('/users/create', {
              pass: hash,
              login: this.login,
            })
            .then(
              function (res) {
                const bad = ' /|;<>&?:{}[]()';
                if (res.data.length === 1) {
                  for (let k = 0; k < bad.length; k++) {
                    if (res.data === bad[k]) {
                      this.error = "bad symbol in login: '" + bad[k] + "'";
                      return;
                    }
                  }
                } else {
                  this.error = null;
                  this.$emit('register', this.login);
                  this.login = null;
                }
              }.bind(this),
            );
        }.bind(this),
      );
    },
    async register() {
      if (!this.login) {
        this.error = 'please enter login';
      } else if (!this.password1) {
        this.error = 'please enter password';
      } else if (!this.password2) {
        this.error = 'please enter password again';
      } else if (this.login.length < 4) {
        this.error = 'login too short';
      } else if (this.password1 !== this.password2) {
        this.error = 'passwords are not equal';
      } else if (this.password1.length < 6) {
        this.error = 'password too short';
      } else if (
        await axios
          .get('/users/checkExist?login=' + this.login)
          .then(function (res) {
            return res.data;
          })
      ) {
        this.error = 'user with the same login already exist';
      } else {
        this.creating();
      }
    },
  },
  mounted() {
    document.addEventListener(
      'keydown',
      function (event) {
        if (event.key === 'Enter') {
          if (!this.authorized && this.selectedAuth === 'registration') {
            this.register();
          }
        }
      }.bind(this),
    );
  },
});

Vue.component('user_login', {
  props: {
    error: {
      required: true,
    },
    authorized: {
      required: true,
      type: Boolean,
    },
    selectedAuth: {
      required: true,
      type: String,
    },
  },
  template: `<div style="margin-left: 5%">login: <input v-model="login" type="text" class="input" v-focus><br>
                    pass: <input v-model="password" type="password" class="input">
                    <p v-if="error">error: {{ error }}</p>
                    <div class="user_login_button"
                    v-on:click="authorize">login</div>
                    <img src="https://yt3.ggpht.com/ytc/AAUvwniWlUa-gZ5YNz8-2Mtada9CZOHaX8o4nGaq5JWc=s900-c-k-c0x00ffffff-no-rj" id="intra_img"></div>`,
  data() {
    return {
      login: null,
      password: null,
    };
  },
  methods: {
    authorize() {
      this.$emit('authorization', this.login, this.password);
      this.password = null;
    },
  },
  mounted() {
    document.addEventListener(
      'keydown',
      function (event) {
        if (event.key === 'Enter') {
          if (!this.authorized && this.selectedAuth === 'login') {
            this.authorize();
          }
        }
      }.bind(this),
    );
  },
});

Vue.component('wall', {
  props: {
    authorized: {
      required: true,
      type: Boolean,
    },
  },
  template: `<div><span v-for="tab in auth"  class="tab"
                    v-on:click="selectedAuth=tab"
                    v-show="selectedAuth!=='another'"
                    :class="{ active_tab: selectedAuth === tab }">
                    {{ tab }}
                    </span>
                    <user_login v-show="selectedAuth === 'login'"
                    :error="error"
                    :authorized="authorized"
                    :selectedAuth="selectedAuth"
                    @authorization="authorize"></user_login>
                    <user_register
                    :authorized="authorized"
                    :selectedAuth="selectedAuth"
                    v-show="selectedAuth === 'registration'"
                    @register="thankYou"></user_register>
                    <div v-show="selectedAuth === 'another'"
                    id="thank_you"><h4>{{ message }}</h4></div></div>`,
  data() {
    return {
      im: null,
      profile: false,
      error: null,
      auth: ['login', 'registration'],
      selectedAuth: 'login',
      message: null,
      users: null,
    };
  },
  methods: {
    async authorize(login, password) {
      if (!login) {
        this.error = 'please enter login';
        return;
      } else if (!password) {
        this.error = 'please enter password';
        return;
      }
      this.im = await axios
        .post('/users/login', { login: login })
        .then(function (res) {
          return res.data;
        });
      if (this.im) {
        if (bcrypt.compareSync(password, this.im.password)) {
          this.im.password = null;
          this.error = null;
          this.users = await axios
            .get('/users/getOnline')
            .then(function (response) {
              return response.data;
            });
          this.$emit('authSuccess', this.im, this.users);
          this.users = null;
          this.im = null;
        } else {
          this.error = 'Wrong password';
        }
      } else {
        this.error = "User with login '" + login + "' not registered";
      }
    },
    thankYou(login) {
      this.selectedAuth = 'another';
      this.message = 'Hello ' + login + '! Thank you for registration';
      setTimeout(
        function () {
          this.selectedAuth = 'login';
        }.bind(this),
        3000,
      );
    },
  },
  modules: {
    user_login: 'user_login',
    user_register: 'user_register',
  },
});

Vue.component('user', {
  template: `<div>
              <div @login="addUser"></div>
              <chat :authorized="authorized" :im="im" :users="users"
              ref="chat"></chat>
              <ladder :authorized="authorized" @kickEnemy="enemy = false"
              :im="im" :users="users" :enemy="enemy"
              ref="ladder"></ladder>
              <div :class="{ user_authorized: authorized, user_unauthorized: !authorized }">
                <div v-if="authorized">
                    <div class="user_logout_button" v-on:click="logout">logout</div>
                    <div class="user_profile_button" v-on:click="showProfile">{{ im.login }}</div>
                </div>
                <wall v-show="!authorized" @authSuccess="authSuccess" @logout="logout" :authorized="authorized"></wall>
              </div>
              <div v-show="profile && authorized" class="user_profile">
                <img :src="im.url_avatar" class="user_profile_avatar">
                <div id="user_update_avatar" v-on:click="updateAvatar"></div>
                <div class="user_profile_close_button" v-on:click="showProfile">x</div>
              </div>
             </div>`,
  data() {
    return {
      authorized: false,
      profile: false,
      winP: 0,
      games: 0,
      im: false,
      users: null,
      eventSource: null,
      enemy: false,
    };
  },
  methods: {
    addUser() {
      this.users.push(this.eventSource.data);
    },
    async logout() {
      if (this.$refs.ladder.game) {
        if (this.$refs.ladder.enemy) {
          clearInterval(this.$refs.ladder.acceptInterval);
          clearInterval(this.$refs.ladder.findInterval);
          this.$refs.ladder.clearData();
        } else {
          clearInterval(this.$refs.ladder.findInterval);
          this.$refs.ladder.clearData();
        }
      }
      this.eventSource.close();
      await axios.post('/users/logout', { user: this.im });
      this.enemy = false;
      this.authorized = false;
      this.profile = false;
      this.users = null;
      this.im = false;
    },
    authSuccess(im, users) {
      this.im = im;
      this.eventSource = new EventSource('/users/login?login=' + this.im.login);
      this.eventSource.addEventListener('login', (event) => {
        const user = JSON.parse(event.data);
        if (
          this.users
            .map(function (e) {
              return e.login;
            })
            .indexOf(user.login) === -1
        )
          this.users.push(user);
      });
      this.eventSource.addEventListener('logout_SSE', (event) => {
        const user = JSON.parse(event.data);
        if (
          this.users
            .map(function (e) {
              return e.login;
            })
            .indexOf(user.login) !== -1
        ) {
          let index = 0;
          while (index < this.users.length) {
            if (this.users[index].login === user.login) {
              break;
            }
            ++index;
          }
          this.users.splice(index, 1);
        }
      });
      this.eventSource.addEventListener('updateUser', (event) => {
        const user = JSON.parse(event.data);
        if (
          this.users
            .map(function (e) {
              return e.login;
            })
            .indexOf(user.login) !== -1
        ) {
          let index = 0;
          while (index < this.users.length) {
            if (this.users[index].login === user.login) {
              this.users[index].status = user.status;
              this.users[index].url_avatar = user.url_avatar;
              break;
            }
            ++index;
          }
          if (this.enemy && this.enemy.login === user.login) {
            this.enemy.status = user.status;
            this.enemy.url_avatar = user.url_avatar;
          }
        }
      });
      this.eventSource.addEventListener('enemy', (event) => {
        this.enemy = JSON.parse(event.data);
      });
      this.users = users;
      this.authorized = true;
    },
    async updateAvatar() {
      this.im.url_avatar = await axios
        .get('/users/avatar?login=' + this.im.login)
        .then(function (res) {
          return res.data;
        });
    },
    showProfile() {
      if (this.profile) {
        this.profile = false;
      } else {
        this.profile = true;
      }
    },
  },
  modules: {
    user: 'chat',
    ladder: 'ladder',
    wall: 'wall',
  },
  mounted() {
    window.onbeforeunload = function () {
      if (this.authorized) {
        this.logout();
      }
    }.bind(this);
    document.addEventListener(
      'keydown',
      function (event) {
        if (event.key === 'Escape') {
          if (this.authorized && !this.$refs.ladder.game && !this.enemy) {
            this.logout();
          } else if (this.authorized && this.$refs.ladder.game) {
            if (!this.enemy) {
              this.$refs.ladder.cancelFind(event);
            } else {
              this.$refs.ladder.cancelAccept(event);
            }
          }
        } else if (event.key === 'Enter') {
          if (this.authorized && !this.$refs.ladder.game && !this.enemy) {
            this.$refs.ladder.findGame();
          }
        } else if (event.key === 'Tab' && this.authorized) {
          event.preventDefault();
          this.showProfile();
        } else if (event.key === ' ' && this.authorized) {
          this.$refs.chat.showChat();
        }
      }.bind(this),
    );
  },
});
