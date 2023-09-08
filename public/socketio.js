let socket = io();

const form = document.getElementById('form');
const input = document.querySelector('#input');
const messages = document.querySelector('#messages')

form.addEventListener('submit', function(e) {
  e.preventDefault();
  if (input.value) {
    socket.emit('chat message', input.value);
    input.value = '';
  }
});
socket.on('chat message', function(msg) {
    const item = document.createElement('div');
    item.classList.add('rightMessages')
    item.innerHTML = `
        <span>${msg.author.username}</span>
        <p>${msg.message}</p>
    `
    messages.appendChild(item);
    messages.scrollTo(0, document.body.scrollHeight);
});

const userFlash = document.querySelector('.userFlash')
const userFlashText = document.querySelector('.userFlash p')

socket.on('user connected' ,function(username){
    userFlashText.innerText = `${username} Joined`
    userFlash.style.display = 'block'
})
socket.on('user disconneted' ,function(username){
    userFlashText.innerText = `${username} Disconnected`
    userFlash.style.display = 'block'
})