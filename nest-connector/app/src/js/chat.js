// eslint-disable-next-line @typescript-eslint/no-var-requires
const axios = require('axios');

let chat = Vue.component('chat', {
  props: {
    authorized: {
      type: Boolean,
      required: true,
    },
  },
  template: `<div v-if="authorized"
             :class="{ chat_closed: !show_chat, chat_opened: show_chat }"
             v-on:click="showChat">
                <div class="chat_performance">
                    {{ type }}
                </div>
              <div v-if="show_chat"
                      class="chat_users_side">
                  <div class="user_in_chat"
                       v-for="user in users">
                      <p>{{ user.login }} {{ user.id }}</p>
                  </div>
              </div>
        </div>
  `,
  data() {
    return {
      type: 'Chat',
      show_chat: false,
      users: null,
    };
  },
  methods: {
    showChat() {
      if (this.show_chat) {
        this.show_chat = false;
      } else {
        this.show_chat = true;
      }
    },
  },
  async mounted() {
    this.users = await axios.get('/users/get').then(function (response) {
      console.log(response.data);
      return response.data;
    });
  },
});
