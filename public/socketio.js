let socket = io();

const form = document.getElementById('form');
const input = document.querySelector('#input');
const messages = document.querySelector('#messages')

window.addEventListener('load' , ()=>{
  messages.scrollTop = messages.scrollHeight
})

form.addEventListener('submit', function(e) {
  e.preventDefault();
  if (input.value) {
    socket.emit('chat message', input.value);
    input.value = '';
  }
});
socket.on('chat message', function(msg) {
    const item = document.createElement('div');
    console.log(msg.author._id)
    console.log(userid)
    if(msg.author._id === userid){
      item.classList.add('rightMessages')
    }else{
      item.classList.add('leftMessages')
    }
    item.innerHTML = `
        <span>${msg.author.username}</span>
        <p>${msg.message}</p>
    `
    messages.appendChild(item);
    messages.scrollTop = messages.scrollHeight
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