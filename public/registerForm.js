const password = document.querySelector('.pass')
const confirmPassword = document.querySelector('.confirmPass')
const username = document.querySelector('.regUsername')
const registerForm = document.querySelector('#form')
const passwordError = document.querySelector('#passwordError')
const passwordError2 = document.querySelector('#passwordError2')
const userFlash = document.querySelector('.userFlash')
const userFlashText = document.querySelector('.userFlash p')

let passwordValidation = false
registerForm.addEventListener('submit', async function (e) {
    e.preventDefault()
    if (passwordValidation && password.value === confirmPassword.value) {
        const formData = { username: username.value, password: password.value }
        const response = await fetch('/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json', // Set the Content-Type header
            },
            body: JSON.stringify(formData)
        })
        
            if (response.url.includes('register')) {
                userFlash.style.display = 'block'
                setTimeout(() => {
                    window.location.href = response.url;
                }, 1500)
            }
        else if (response.redirected) {
            // If not redirected to the registration page, immediately redirect
            window.location.href = response.url;
        }
    }
})

confirmPassword.addEventListener('input', () => {
    if (confirmPassword.value.length <= 5 || confirmPassword.value.length > 20) {
        passwordError.classList.add('togglePasswordError')
        passwordError2.classList.remove('togglePasswordError')
    }
    else {
        passwordValidation = true
        if (password.value !== confirmPassword.value) {
            passwordError2.classList.add('togglePasswordError')
            passwordError.classList.remove('togglePasswordError')
        } else {
            passwordError2.classList.add('togglePasswordError')
            passwordError.classList.add('togglePasswordError')
        }
    }
})
